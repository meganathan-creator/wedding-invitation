/// <reference types="node" />

import { promises as fs, readFileSync } from "node:fs";
import { randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

/**
 * Single source of truth: the server accepts exactly the options the form offers.
 * Read at runtime (not `import … from "*.json"`, which crashes Node ESM on Vercel
 * without an import attribute). vercel.json `includeFiles` ships the file with the
 * function; the defaults below only apply if it ever can't be read.
 */
function loadRsvpOptions(): { attendanceOptions: string[]; guestOptions: number[] } {
  const defaults = {
    attendanceOptions: ["Joyfully attending", "Regretfully declining"],
    guestOptions: [1, 2, 3, 4],
  };
  try {
    const file = path.join(process.cwd(), "public", "config", "wedding.json");
    const rsvp = JSON.parse(readFileSync(file, "utf8"))?.rsvp ?? {};
    const attendanceOptions = Array.isArray(rsvp.attendanceOptions)
      ? rsvp.attendanceOptions.filter((o: unknown): o is string => typeof o === "string")
      : [];
    const guestOptions = Array.isArray(rsvp.guestOptions)
      ? rsvp.guestOptions.filter((n: unknown): n is number => Number.isInteger(n))
      : [];
    return {
      attendanceOptions: attendanceOptions.length ? attendanceOptions : defaults.attendanceOptions,
      guestOptions: guestOptions.length ? guestOptions : defaults.guestOptions,
    };
  } catch (error) {
    console.warn("RSVP: could not read public/config/wedding.json, using defaults", error);
    return defaults;
  }
}

const { attendanceOptions: ATTENDANCE_OPTIONS, guestOptions: GUEST_OPTIONS } = loadRsvpOptions();
const DECLINE_OPTION = ATTENDANCE_OPTIONS.find((option) => /declin|regret|not/i.test(option));

const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MAX = 400;
const MAX_BODY_BYTES = 4 * 1024;
const MIN_ADMIN_TOKEN_LENGTH = 24;

// Fixed-window rate limits, per client IP.
const SUBMIT_LIMIT = { max: 5, windowSeconds: 10 * 60 }; // 5 RSVPs / 10 min
const ADMIN_LIMIT = { max: 10, windowSeconds: 15 * 60 }; // 10 admin attempts / 15 min

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type RSVPEntry = {
  id: string;
  name: string;
  attendance: string;
  guests: number;
  message: string;
  createdAt: string;
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/*                                                                     */
/* Durable: Upstash Redis over REST (Vercel Marketplace → Upstash, or  */
/* legacy Vercel KV). Set KV_REST_API_URL + KV_REST_API_TOKEN, or      */
/* UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.                  */
/*                                                                     */
/* Fallback: /tmp + memory. On serverless this is per-instance and is  */
/* wiped on cold starts / redeploys — fine for local dev, NOT for real */
/* guests. GET responses report which one is active.                   */
/* ------------------------------------------------------------------ */

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);
const RESPONSES_KEY = "rsvp:responses";

async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  const response = await fetch(`${REDIS_URL.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!response.ok) throw new Error(`Redis error ${response.status}`);
  const results = (await response.json()) as { result?: unknown; error?: string }[];
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(`Redis error: ${failed.error}`);
  return results.map((r) => r.result);
}

const tempDataFilePath = path.resolve("/tmp", "rsvp-responses.json");
let memoryResponses: RSVPEntry[] | null = null;
const memoryWindows = new Map<string, { count: number; resetAt: number }>();

async function readFallback(): Promise<RSVPEntry[]> {
  if (memoryResponses) return memoryResponses;
  try {
    const parsed = JSON.parse(await fs.readFile(tempDataFilePath, "utf8"));
    memoryResponses = Array.isArray(parsed) ? parsed : [];
  } catch {
    memoryResponses = [];
  }
  return memoryResponses;
}

async function saveResponse(entry: RSVPEntry): Promise<void> {
  if (useRedis) {
    await redis([["RPUSH", RESPONSES_KEY, JSON.stringify(entry)]]);
    return;
  }
  const entries = await readFallback();
  entries.push(entry);
  await fs.writeFile(tempDataFilePath, JSON.stringify(entries, null, 2), "utf8");
}

async function listResponses(): Promise<RSVPEntry[]> {
  if (!useRedis) return readFallback();
  const [raw] = await redis([["LRANGE", RESPONSES_KEY, 0, -1]]);
  return (Array.isArray(raw) ? raw : []).flatMap((item) => {
    try {
      return [JSON.parse(String(item)) as RSVPEntry];
    } catch {
      return [];
    }
  });
}

/** Returns true when the caller has exceeded `max` hits in the current window. */
async function isRateLimited(
  bucket: string,
  ip: string,
  { max, windowSeconds }: { max: number; windowSeconds: number }
): Promise<boolean> {
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${bucket}:${ip}:${windowId}`;

  if (useRedis) {
    const [count] = await redis([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds],
    ]);
    return Number(count) > max;
  }

  const now = Date.now();
  for (const [k, v] of memoryWindows) if (v.resetAt <= now) memoryWindows.delete(k); // prune
  const current = memoryWindows.get(key) ?? { count: 0, resetAt: now + windowSeconds * 1000 };
  current.count += 1;
  memoryWindows.set(key, current);
  return current.count > max;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function sendJson(res: any, statusCode: number, payload: unknown): void {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(statusCode).json(payload);
}

function header(req: any, name: string): string {
  const value = req.headers?.[name];
  return String(Array.isArray(value) ? value[0] : value ?? "").trim();
}

/**
 * Vercel sets x-vercel-forwarded-for / x-real-ip itself. The left-most entry of a
 * raw x-forwarded-for can be supplied by the client, so it is only a last resort.
 */
function getClientIp(req: any): string {
  return (
    header(req, "x-vercel-forwarded-for").split(",")[0].trim() ||
    header(req, "x-real-ip") ||
    header(req, "x-forwarded-for").split(",").pop()!.trim() ||
    String(req.socket?.remoteAddress ?? "unknown")
  );
}

function tokensMatch(requestToken: string, adminToken: string): boolean {
  const a = Buffer.from(requestToken);
  const b = Buffer.from(adminToken);
  const length = Math.max(a.length, b.length, 1);
  const paddedA = Buffer.alloc(length);
  const paddedB = Buffer.alloc(length);
  a.copy(paddedA);
  b.copy(paddedB);
  return timingSafeEqual(paddedA, paddedB) && a.length === b.length;
}

/** Trim, normalise, and strip control characters (keeps newlines in messages). */
function cleanText(value: unknown, { multiline = false } = {}): string {
  if (typeof value !== "string") return "";
  const controls = multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.normalize("NFC").replace(/\r\n?/g, "\n").replace(controls, "").trim();
}

const charLength = (value: string) => Array.from(value).length;

function parseBody(req: any): Record<string, unknown> {
  const contentType = header(req, "content-type").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json.");
  }
  const declaredLength = Number(header(req, "content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new HttpError(413, "Request is too large.");

  let body = req.body;
  if (typeof body === "string" || Buffer.isBuffer(body)) {
    const text = body.toString();
    if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new HttpError(413, "Request is too large.");
    try {
      body = JSON.parse(text);
    } catch {
      throw new HttpError(400, "Invalid JSON.");
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Invalid request body.");
  }
  return body as Record<string, unknown>;
}

function validateEntry(payload: Record<string, unknown>): RSVPEntry {
  const name = cleanText(payload.name);
  const attendance = cleanText(payload.attendance);
  const message = cleanText(payload.message, { multiline: true });
  const guests = payload.guests;

  if (charLength(name) < NAME_MIN || charLength(name) > NAME_MAX) {
    throw new HttpError(400, `Name must be between ${NAME_MIN} and ${NAME_MAX} characters.`);
  }
  if (!ATTENDANCE_OPTIONS.includes(attendance)) {
    throw new HttpError(400, "Please choose a valid attendance option.");
  }
  if (typeof guests !== "number" || !Number.isInteger(guests) || !GUEST_OPTIONS.includes(guests)) {
    throw new HttpError(400, `Guests must be one of: ${GUEST_OPTIONS.join(", ")}.`);
  }
  if (charLength(message) > MESSAGE_MAX) {
    throw new HttpError(400, `Message must be ${MESSAGE_MAX} characters or fewer.`);
  }

  return {
    id: `rsvp_${randomUUID()}`,
    name,
    attendance,
    // Someone declining isn't bringing anyone; keeps the admin headcount honest.
    guests: attendance === DECLINE_OPTION ? 0 : guests,
    message,
    createdAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

async function handleAdmin(req: any, res: any) {
  if (await isRateLimited("admin", getClientIp(req), ADMIN_LIMIT)) {
    throw new HttpError(429, "Too many attempts. Please try again later.");
  }

  const adminToken = (process.env.RSVP_ADMIN_TOKEN ?? "").trim();
  if (adminToken.length < MIN_ADMIN_TOKEN_LENGTH) {
    // Refuse to run with no token or a guessable one.
    throw new HttpError(503, "RSVP admin access is not configured.");
  }
  if (!tokensMatch(header(req, "x-rsvp-admin-token"), adminToken)) {
    throw new HttpError(401, "Unauthorized.");
  }

  const responses = await listResponses();
  sendJson(res, 200, {
    total: responses.length,
    attendingGuests: responses.reduce((sum, r) => sum + (Number(r.guests) || 0), 0),
    storage: useRedis ? "durable" : "ephemeral",
    responses,
  });
}

async function handleSubmit(req: any, res: any) {
  const payload = parseBody(req);

  if (payload.website) {
    // Honeypot triggered: pretend success so bots cannot infer filtering.
    sendJson(res, 201, { ok: true });
    return;
  }

  if (await isRateLimited("submit", getClientIp(req), SUBMIT_LIMIT)) {
    throw new HttpError(429, "Too many RSVPs from this connection. Please try again later.");
  }

  const entry = validateEntry(payload);
  await saveResponse(entry);
  sendJson(res, 201, { ok: true, id: entry.id });
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (req.method === "GET") return await handleAdmin(req, res);
    if (req.method === "POST") return await handleSubmit(req, res);
    res.setHeader("Allow", "GET, POST");
    throw new HttpError(405, "Method not allowed.");
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message });
      return;
    }
    console.error("RSVP handler failed", error);
    sendJson(res, 500, { error: "Something went wrong. Please try again." });
  }
}
