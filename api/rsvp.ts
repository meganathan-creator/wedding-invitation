/// <reference types="node" />

import { promises as fs } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";

type RSVPEntry = {
  id: string;
  name: string;
  attendance: string;
  guests: number;
  message: string;
  createdAt: string;
};

type RSVPRequestPayload = {
  name?: string;
  attendance?: string;
  guests?: number;
  message?: string;
  website?: string;
};

const tempDataFilePath = path.resolve("/tmp", "rsvp-responses.json");
const submitCooldownMs = 15000;

let inMemoryResponses: RSVPEntry[] | null = null;
const lastSubmitByIp = new Map<string, number>();
const lastAdminCheckByIp = new Map<string, number>();

function parseJsonSafely(value: string): RSVPEntry[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readResponses(): Promise<RSVPEntry[]> {
  if (inMemoryResponses) {
    return inMemoryResponses;
  }

  try {
    const content = await fs.readFile(tempDataFilePath, "utf8");
    inMemoryResponses = parseJsonSafely(content);
  } catch {
    inMemoryResponses = [];
  }

  return inMemoryResponses;
}

async function writeResponses(entries: RSVPEntry[]): Promise<void> {
  inMemoryResponses = entries;
  await fs.writeFile(tempDataFilePath, JSON.stringify(entries, null, 2), "utf8");
}

function sendJson(res: any, statusCode: number, payload: unknown): void {
  res.status(statusCode).json(payload);
}

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return String(req.socket?.remoteAddress ?? "unknown");
}

function isRateLimited(ip: string, tracker: Map<string, number>, cooldownMs: number): boolean {
  const now = Date.now();
  const lastAttemptAt = tracker.get(ip) ?? 0;
  if (now - lastAttemptAt < cooldownMs) {
    return true;
  }
  tracker.set(ip, now);
  return false;
}

function tokensMatchTimingSafe(requestToken: string, adminToken: string): boolean {
  const requestBuffer = Buffer.from(requestToken);
  const adminBuffer = Buffer.from(adminToken);
  const compareLength = Math.max(requestBuffer.length, adminBuffer.length, 1);

  const paddedRequest = Buffer.alloc(compareLength);
  const paddedAdmin = Buffer.alloc(compareLength);
  requestBuffer.copy(paddedRequest);
  adminBuffer.copy(paddedAdmin);

  const equal = timingSafeEqual(paddedRequest, paddedAdmin);
  return equal && requestBuffer.length === adminBuffer.length;
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "GET") {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp, lastAdminCheckByIp, submitCooldownMs)) {
      sendJson(res, 429, { error: "Please wait a few seconds before trying again." });
      return;
    }

    const adminToken = (process.env.RSVP_ADMIN_TOKEN ?? "").trim();
    if (!adminToken) {
      sendJson(res, 503, { error: "RSVP admin token is not configured." });
      return;
    }

    const requestToken = String(req.headers["x-rsvp-admin-token"] ?? "").trim();
    if (!tokensMatchTimingSafe(requestToken, adminToken)) {
      sendJson(res, 401, { error: "Unauthorized." });
      return;
    }

    const responses = await readResponses();
    sendJson(res, 200, { total: responses.length, responses });
    return;
  }

  if (req.method === "POST") {
    const payload = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as RSVPRequestPayload;

    if (payload.website) {
      // Honeypot triggered: pretend success so bots cannot infer filtering.
      sendJson(res, 201, { ok: true });
      return;
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp, lastSubmitByIp, submitCooldownMs)) {
      sendJson(res, 429, { error: "Please wait a few seconds before submitting again." });
      return;
    }

    const cleanName = String(payload.name ?? "").trim();
    const cleanAttendance = String(payload.attendance ?? "").trim();
    const cleanGuests = Number(payload.guests ?? 1);
    const cleanMessage = String(payload.message ?? "").trim();

    if (!cleanName || !cleanAttendance) {
      sendJson(res, 400, { error: "Missing required RSVP fields." });
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 80) {
      sendJson(res, 400, { error: "Name must be between 2 and 80 characters." });
      return;
    }

    if (!Number.isFinite(cleanGuests) || cleanGuests < 1 || cleanGuests > 10) {
      sendJson(res, 400, { error: "Guests must be between 1 and 10." });
      return;
    }

    if (cleanMessage.length > 400) {
      sendJson(res, 400, { error: "Message is too long." });
      return;
    }

    const newEntry: RSVPEntry = {
      id: `rsvp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      attendance: cleanAttendance,
      guests: cleanGuests,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    const responses = await readResponses();
    responses.push(newEntry);
    await writeResponses(responses);

    sendJson(res, 201, { ok: true, id: newEntry.id });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
}
