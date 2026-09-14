import { promises as fs } from "node:fs";
import path from "node:path";

type RSVPEntry = {
  id: string;
  name: string;
  attendance: string;
  guests: number;
  message: string;
  createdAt: string;
};

const tempDataFilePath = path.resolve("/tmp", "rsvp-responses.json");

let inMemoryResponses: RSVPEntry[] | null = null;

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

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "GET") {
    const adminToken = (process.env.RSVP_ADMIN_TOKEN ?? "").trim();
    if (!adminToken) {
      sendJson(res, 503, { error: "RSVP admin token is not configured." });
      return;
    }

    const requestToken = String(req.headers["x-rsvp-admin-token"] ?? "").trim();
    if (requestToken !== adminToken) {
      sendJson(res, 401, { error: "Unauthorized." });
      return;
    }

    const responses = await readResponses();
    sendJson(res, 200, { total: responses.length, responses });
    return;
  }

  if (req.method === "POST") {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!payload?.name || !payload?.attendance) {
      sendJson(res, 400, { error: "Missing required RSVP fields." });
      return;
    }

    const newEntry: RSVPEntry = {
      id: `rsvp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(payload.name),
      attendance: String(payload.attendance),
      guests: Number(payload.guests ?? 1),
      message: String(payload.message ?? ""),
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
