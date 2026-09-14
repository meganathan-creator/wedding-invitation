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
  forWhom?: "bride" | "groom";
};

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

  const isAdminMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("admin") === "1";

  if (!config.enabled) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
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
        throw new Error("Failed to submit RSVP.");
      }

      setSent(true);
      event.currentTarget.reset();
    } catch {
      setError("We could not send your RSVP right now. Please try again.");
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
          throw new Error("Admin access key is not configured on server.");
        }
        throw new Error("Failed to fetch responses.");
      }

      const data = (await response.json()) as { responses?: RSVPResponse[] };
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
              <input required name="name" placeholder="Enter your name" />
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
              <textarea name="message" rows={3} placeholder="Leave a little love..." />
            </label>

            <button className="primary-button" type="submit">
              {submitting ? "SENDING..." : "SEND RSVP"} <span>→</span>
            </button>

            {error && <p className="rsvp-error">{error}</p>}
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
                {responsesError && <p className="rsvp-error">{responsesError}</p>}
                {!responsesError && !loadingResponses && responses.length === 0 && (
                  <p className="rsvp-empty">No responses yet.</p>
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
                            <td>{new Date(entry.createdAt).toLocaleString()}</td>
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
