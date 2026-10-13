import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { Reveal } from "./Reveal";

type RSVPResponsePayload = {
  name: string;
  attendance: string;
  guests: number;
  message: string;
  website?: string;
};

type RSVPResponse = RSVPResponsePayload & {
  id: string;
  createdAt: string;
};

/** Quote a CSV cell; neutralise values Excel/Sheets would run as formulas. */
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(responses: RSVPResponse[]) {
  const header = ["Name", "Attendance", "Guests", "Message", "Submitted (IST)"];
  const rows = responses.map((r) => [
    r.name,
    r.attendance,
    r.guests,
    r.message,
    new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  ]);
  // BOM so Excel opens UTF-8 (Tamil names, emoji) correctly
  const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function RSVP({
  config,
}: {
  config: WeddingConfig["rsvp"];
}) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState<RSVPResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responsesError, setResponsesError] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);

  const isAdminMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("admin") === "1";

  if (!config.enabled) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    // Capture the element now: React clears event.currentTarget after the first await.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: RSVPResponsePayload = {
      name: String(form.get("name") ?? "").trim(),
      attendance: String(form.get("attendance") ?? ""),
      guests: Number(form.get("guests") ?? 1),
      message: String(form.get("message") ?? "").trim(),
      website: String(form.get("website") ?? "").trim(),
    };

    try {
      setSubmitting(true);
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "We could not send your RSVP right now. Please try again.");
      }

      formElement.reset();
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "We could not send your RSVP right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function viewResponses() {
    if (!adminToken.trim()) {
      setResponsesError("Enter admin access key to view responses.");
      setShowResponses(false);
      return;
    }

    setResponsesError("");
    setLoadingResponses(true);
    setShowResponses(true);

    try {
      const response = await fetch("/api/rsvp", {
        headers: {
          "x-rsvp-admin-token": adminToken.trim(),
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid admin access key.");
        }
        if (response.status === 503) {
          throw new Error("Admin access key is not configured on the server (needs 24+ characters).");
        }
        if (response.status === 429) {
          throw new Error("Too many attempts. Please wait a few minutes.");
        }
        throw new Error("Failed to fetch responses.");
      }

      const data = (await response.json()) as { responses?: RSVPResponse[]; storage?: string };
      setStorageWarning(data.storage === "ephemeral");
      setResponses(Array.isArray(data.responses) ? data.responses : []);
    } catch (fetchError) {
      setResponsesError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load RSVP responses right now."
      );
    } finally {
      setLoadingResponses(false);
    }
  }

  return (
    <section className="section cream rsvp">
      <div className="container narrow">
        <Reveal className="center">
          <p className="eyebrow gold">BE OUR GUEST</p>
          <h2>{config.title}</h2>
          <p className="muted">{config.subtitle}</p>
        </Reveal>

        {sent ? (
          <motion.div className="rsvp-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>✦</span>
            <h3>Thank you.</h3>
            <p>Your response has been received.</p>
          </motion.div>
        ) : (
          <form className="rsvp-form" onSubmit={submit}>
            <div className="rsvp-honeypot" aria-hidden="true">
              <label htmlFor="website-field">Website</label>
              <input
                id="website-field"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <label>
              Your name
              <input
                required
                name="name"
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Enter your name"
              />
            </label>

            <label>
              Attendance
              <select required name="attendance" defaultValue="">
                <option value="" disabled>Select one</option>
                {config.attendanceOptions.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Guests
              <select name="guests" defaultValue={String(config.guestOptions[0] ?? 1)}>
                {config.guestOptions.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Message
              <textarea
                name="message"
                rows={3}
                maxLength={400}
                placeholder="Leave a little love..."
              />
            </label>

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "SENDING..." : "SEND RSVP"} <span>→</span>
            </button>

            {error && <p className="rsvp-error" role="alert">{error}</p>}
          </form>
        )}

        {isAdminMode && (
          <div className="rsvp-admin-panel">
            <label className="rsvp-admin-label" htmlFor="rsvp-admin-token">
              Admin access key
            </label>
            <input
              id="rsvp-admin-token"
              className="rsvp-admin-input"
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Enter admin key"
            />

            <button className="secondary-button" type="button" onClick={viewResponses}>
              {loadingResponses ? "LOADING RESPONSES..." : "VIEW RESPONSES"}
            </button>

            {showResponses && (
              <div className="rsvp-responses">
                <h3>RSVP Responses</h3>
                {storageWarning && (
                  <p className="rsvp-error">
                    Temporary storage: responses can disappear on redeploys or cold starts.
                    Connect Upstash Redis before sharing the invitation.
                  </p>
                )}
                {responsesError && <p className="rsvp-error">{responsesError}</p>}
                {!responsesError && !loadingResponses && responses.length === 0 && (
                  <p className="rsvp-empty">No responses yet.</p>
                )}
                {!responsesError && responses.length > 0 && (
                  <p className="rsvp-summary">
                    {responses.length} {responses.length === 1 ? "response" : "responses"} ·{" "}
                    {responses.reduce((sum, r) => sum + (Number(r.guests) || 0), 0)} guests attending
                    <button className="text-button" type="button" onClick={() => downloadCsv(responses)}>
                      DOWNLOAD CSV
                    </button>
                  </p>
                )}
                {!responsesError && responses.length > 0 && (
                  <div className="rsvp-table-wrap">
                    <table className="rsvp-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Attendance</th>
                          <th>Guests</th>
                          <th>Message</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.name}</td>
                            <td>{entry.attendance}</td>
                            <td>{entry.guests}</td>
                            <td>{entry.message || "-"}</td>
                            <td>{new Date(entry.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
