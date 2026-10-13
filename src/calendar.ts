import type { WeddingEvent } from "./types/wedding";

/**
 * All event times in wedding.json are Indian times. Calendar output is written
 * as *local IST wall-clock time + an explicit time zone* (not converted to UTC),
 * so the event details a guest inspects read "6:00 AM, India Standard Time"
 * rather than "00:30 UTC". Their calendar app still shows it in their own zone.
 */
export const EVENT_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 5 * 60 + 30; // India has no DST
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Build an instant from IST wall-clock parts, independent of the guest's browser zone. */
function istInstant(year: number, monthIndex: number, day: number, hour = 0, minute = 0) {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);
}

/** IST wall-clock parts of an instant, e.g. 20261113T060000 */
export function formatIstLocal(value: Date) {
  const ist = new Date(value.getTime() + IST_OFFSET_MINUTES * 60_000);
  return (
    `${ist.getUTCFullYear()}${pad(ist.getUTCMonth() + 1)}${pad(ist.getUTCDate())}` +
    `T${pad(ist.getUTCHours())}${pad(ist.getUTCMinutes())}${pad(ist.getUTCSeconds())}`
  );
}

/** UTC timestamp, used only for DTSTAMP (which RFC 5545 requires in UTC). */
function formatUtc(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function parseIsoish(value?: string) {
  if (!value) return null;
  // A date-time without an offset ("2026-11-13T06:00") is treated as IST, not browser-local.
  const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) || !value.includes("T")
    ? value
    : `${value}+05:30`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fallback: "12 November 2026" + "6:30 PM onwards", interpreted as IST. */
function parseLabels(dateLabel: string, time: string) {
  const dateMatch = dateLabel.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!dateMatch) return null;
  const monthIndex = MONTHS.findIndex((m) => m.startsWith(dateMatch[2].toLowerCase().slice(0, 3)));
  if (monthIndex < 0) return null;

  const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  let hour = 0;
  let minute = 0;
  if (timeMatch) {
    hour = (Number(timeMatch[1]) % 12) + (timeMatch[3].toUpperCase() === "PM" ? 12 : 0);
    minute = Number(timeMatch[2] ?? "0");
  }
  return istInstant(Number(dateMatch[3]), monthIndex, Number(dateMatch[1]), hour, minute);
}

export function parseEventStart(event: WeddingEvent) {
  return (
    parseIsoish(event.startDateTime) ??
    parseLabels(event.dateLabel, event.time) ??
    parseIsoish(event.countdownDate)
  );
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: fold content lines longer than 75 octets. */
function foldLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function getCalendarLinks(
  event: WeddingEvent,
  coupleNames: string,
  fallbackLocation = ""
) {
  const start = parseEventStart(event);
  if (!start) return null;

  const end = parseIsoish(event.endDateTime) ?? new Date(start.getTime() + DEFAULT_DURATION_MS);
  if (end.getTime() <= start.getTime()) return null;

  const title = event.calendarTitle ?? `${event.type} - ${coupleNames}`;
  const location =
    [event.venue, event.address].filter(Boolean).join(", ") || fallbackLocation;
  const details =
    event.calendarDescription ?? `${event.type} · ${event.dateLabel} · ${event.time} (IST)`;

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", title);
  google.searchParams.set("dates", `${formatIstLocal(start)}/${formatIstLocal(end)}`);
  google.searchParams.set("ctz", EVENT_TIME_ZONE);
  google.searchParams.set("details", details);
  if (location) google.searchParams.set("location", location);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Wedding Invitation//EN",
    "BEGIN:VTIMEZONE",
    `TZID:${EVENT_TIME_ZONE}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${event.id}-${formatIstLocal(start)}@wedding-invitation`,
    `DTSTAMP:${formatUtc(new Date())}`,
    // UTC DTSTART/DTEND are broadly supported by Apple Calendar and Outlook.
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(foldLine)
    .join("\r\n");

  return {
    googleUrl: google.toString(),
    ics,
  };
}
