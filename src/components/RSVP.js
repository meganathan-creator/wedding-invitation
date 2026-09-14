import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "motion/react";
import { Reveal } from "./Reveal";
export function RSVP({ config, }) {
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showResponses, setShowResponses] = useState(false);
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [responsesError, setResponsesError] = useState("");
    const [adminToken, setAdminToken] = useState("");
    const isAdminMode = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("admin") === "1";
    if (!config.enabled)
        return null;
    async function submit(event) {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const payload = {
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
        }
        catch {
            setError("We could not send your RSVP right now. Please try again.");
        }
        finally {
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
            const data = (await response.json());
            setResponses(Array.isArray(data.responses) ? data.responses : []);
        }
        catch (fetchError) {
            setResponsesError(fetchError instanceof Error
                ? fetchError.message
                : "Could not load RSVP responses right now.");
        }
        finally {
            setLoadingResponses(false);
        }
    }
    return (_jsx("section", { className: "section cream rsvp", children: _jsxs("div", { className: "container narrow", children: [_jsxs(Reveal, { className: "center", children: [_jsx("p", { className: "eyebrow gold", children: "BE OUR GUEST" }), _jsx("h2", { children: config.title }), _jsx("p", { className: "muted", children: config.subtitle })] }), sent ? (_jsxs(motion.div, { className: "rsvp-success", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsx("span", { children: "\u2726" }), _jsx("h3", { children: "Thank you." }), _jsx("p", { children: "Your response has been received." })] })) : (_jsxs("form", { className: "rsvp-form", onSubmit: submit, children: [_jsxs("div", { className: "rsvp-honeypot", "aria-hidden": "true", children: [_jsx("label", { htmlFor: "website-field", children: "Website" }), _jsx("input", { id: "website-field", name: "website", type: "text", tabIndex: -1, autoComplete: "off", defaultValue: "" })] }), _jsxs("label", { children: ["Your name", _jsx("input", { required: true, name: "name", placeholder: "Enter your name" })] }), _jsxs("label", { children: ["Attendance", _jsxs("select", { required: true, name: "attendance", defaultValue: "", children: [_jsx("option", { value: "", disabled: true, children: "Select one" }), config.attendanceOptions.map(option => (_jsx("option", { children: option }, option)))] })] }), _jsxs("label", { children: ["Guests", _jsx("select", { name: "guests", defaultValue: String(config.guestOptions[0] ?? 1), children: config.guestOptions.map(option => (_jsx("option", { children: option }, option))) })] }), _jsxs("label", { children: ["Message", _jsx("textarea", { name: "message", rows: 3, placeholder: "Leave a little love..." })] }), _jsxs("button", { className: "primary-button", type: "submit", children: [submitting ? "SENDING..." : "SEND RSVP", " ", _jsx("span", { children: "\u2192" })] }), error && _jsx("p", { className: "rsvp-error", children: error })] })), isAdminMode && (_jsxs("div", { className: "rsvp-admin-panel", children: [_jsx("label", { className: "rsvp-admin-label", htmlFor: "rsvp-admin-token", children: "Admin access key" }), _jsx("input", { id: "rsvp-admin-token", className: "rsvp-admin-input", type: "password", value: adminToken, onChange: (event) => setAdminToken(event.target.value), placeholder: "Enter admin key" }), _jsx("button", { className: "secondary-button", type: "button", onClick: viewResponses, children: loadingResponses ? "LOADING RESPONSES..." : "VIEW RESPONSES" }), showResponses && (_jsxs("div", { className: "rsvp-responses", children: [_jsx("h3", { children: "RSVP Responses" }), responsesError && _jsx("p", { className: "rsvp-error", children: responsesError }), !responsesError && !loadingResponses && responses.length === 0 && (_jsx("p", { className: "rsvp-empty", children: "No responses yet." })), !responsesError && responses.length > 0 && (_jsx("div", { className: "rsvp-table-wrap", children: _jsxs("table", { className: "rsvp-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Attendance" }), _jsx("th", { children: "Guests" }), _jsx("th", { children: "Message" }), _jsx("th", { children: "Time" })] }) }), _jsx("tbody", { children: responses.map((entry) => (_jsxs("tr", { children: [_jsx("td", { children: entry.name }), _jsx("td", { children: entry.attendance }), _jsx("td", { children: entry.guests }), _jsx("td", { children: entry.message || "-" }), _jsx("td", { children: new Date(entry.createdAt).toLocaleString() })] }, entry.id))) })] }) }))] }))] }))] }) }));
}
