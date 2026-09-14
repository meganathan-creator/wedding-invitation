import { motion } from "motion/react";
import type { WeddingConfig } from "./types/wedding";
import { Hero } from "./components/Hero";
import { Reveal } from "./components/Reveal";
import { Countdown } from "./components/Countdown";
import { Gallery } from "./components/Gallery";
import { RSVP } from "./components/RSVP";
import "./styles.css";

function formatGoogleDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function parseEventStart(event: WeddingConfig["events"][number]) {
  if (event.startDateTime) {
    const start = new Date(event.startDateTime);
    if (!Number.isNaN(start.getTime())) return start;
  }

  if (event.countdownDate) {
    const start = new Date(event.countdownDate);
    if (!Number.isNaN(start.getTime())) return start;
  }

  const timeMatch = event.time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const date = new Date(event.dateLabel);
  if (Number.isNaN(date.getTime())) return null;

  if (!timeMatch) {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const hour12 = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? "0");
  const meridiem = timeMatch[3].toUpperCase();
  const hour24 = (hour12 % 12) + (meridiem === "PM" ? 12 : 0);
  date.setHours(hour24, minute, 0, 0);
  return date;
}

function getCalendarLinks(event: WeddingConfig["events"][number], coupleNames: string) {
  const start = parseEventStart(event);
  if (!start) return null;

  const end = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  if (Number.isNaN(end.getTime())) return null;

  const title = event.calendarTitle ?? `${event.type} - ${coupleNames}`;
  const location = [event.venue, event.address].filter(Boolean).join(", ");
  const details = event.calendarDescription ?? "Wedding celebration";

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGoogleDate(start)}/${formatGoogleDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}-${start.getTime()}@wedding-invitation`,
    `DTSTAMP:${formatGoogleDate(new Date())}`,
    `DTSTART:${formatGoogleDate(start)}`,
    `DTEND:${formatGoogleDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  return { googleUrl, icsUrl };
}

export default function App({ config }: { config: WeddingConfig }) {
  const { bride, groom } = config.couple;
  const coupleNames = `${bride.name} & ${groom.name}`;
  const primaryEvent =
    config.events.find((event) => event.countdownDate) ??
    config.events.find((event) => event.venue) ??
    config.events[0];
  const eventLocations = config.events
    .map((event) => ({
      venue: event.venue?.trim() ?? "",
      address: event.address?.trim() ?? "",
      mapUrl: event.mapUrl?.trim() ?? "",
      mapLabel: event.mapLabel,
    }))
    .filter((location) => location.venue || location.address || location.mapUrl);
  const uniqueLocationKeys = new Set(
    eventLocations.map((location) => `${location.venue}|${location.address}|${location.mapUrl}`)
  );
  const hasSingleSharedLocation = uniqueLocationKeys.size === 1 && eventLocations.length > 0;
  const shouldShowLocationPerEvent = uniqueLocationKeys.size > 1;
  const sharedLocation = hasSingleSharedLocation ? eventLocations[0] : null;
  const sharedLocationEvent = hasSingleSharedLocation
    ? config.events.find((event) => event.venue || event.address || event.mapUrl)
    : null;

  return (
    <main className="site-shell">
      <Hero config={config} />

      <section id="invitation" className="invitation-section">
        <div className="container invitation-inner">
          <Reveal className="invitation-copy">
            <p className="eyebrow">{config.invitation.eyebrow}</p>
            <h2>{config.invitation.introTitle}</h2>
            <p className="lead">{config.invitation.introText}</p>
          </Reveal>

          <div className="couple-stage">
            <motion.div
              className="couple-person groom-person"
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="portrait-frame">
                <img src={groom.photo} alt={groom.name} />
              </div>
              <p className="role">{groom.role}</p>
              <h3>{groom.name}</h3>
              {groom.parents && <p className="parents">{groom.parents}</p>}
            </motion.div>

            <div className="ampersand" aria-hidden="true">&</div>

            <motion.div
              className="couple-person bride-person"
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <div className="portrait-frame">
                <img src={bride.photo} alt={bride.name} />
              </div>
              <p className="role">{bride.role}</p>
              <h3>{bride.name}</h3>
              {bride.parents && <p className="parents">{bride.parents}</p>}
            </motion.div>
          </div>

          <Reveal className="family-note">
            <span>ONE WEDDING</span>
            <span>·</span>
            <span>TWO FAMILIES</span>
            <span>·</span>
            <span>ONE NEW BEGINNING</span>
          </Reveal>
        </div>
      </section>

      <section className="celebration-section">
        <div className="celebration-orbit orbit-one" />
        <div className="celebration-orbit orbit-two" />

        <div className="container celebration-inner">
          <Reveal>
            <p className="eyebrow light">THE CELEBRATION</p>
            <h2>
              We're making it
              <br />
              <i>forever.</i>
            </h2>
          </Reveal>

          <div className="event-stack">
            {config.events.map((event, index) => (
              (() => {
                const calendar = getCalendarLinks(event, coupleNames);
                return (
              <motion.article
                className={`event-card ${index === 0 ? "event-card-main" : ""}`}
                key={event.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
              >
                <div className="event-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="event-copy">
                  <p className="event-type">{event.type}</p>
                  <h3>{event.dateLabel}</h3>
                  <p className="event-time">{event.time}</p>
                  {shouldShowLocationPerEvent && event.venue && <p className="event-venue">{event.venue}</p>}
                  {shouldShowLocationPerEvent && event.address && <p className="event-address">{event.address}</p>}
                  {(event.venueImage || event.mapEmbedUrl) && shouldShowLocationPerEvent && (
                    <div className="event-venue-visual">
                      {event.venueImage && (
                        <img
                          src={event.venueImage}
                          alt={event.venueImageAlt ?? `${event.type} venue`}
                          loading="lazy"
                        />
                      )}
                      {event.mapEmbedUrl && (
                        <iframe
                          src={event.mapEmbedUrl}
                          title={`${event.type} map`}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      )}
                    </div>
                  )}
                  {calendar && (
                    <div className="calendar-actions">
                      <a href={calendar.googleUrl} target="_blank" rel="noreferrer">ADD TO GOOGLE</a>
                      <a href={calendar.icsUrl} download={`${event.id}.ics`}>ADD TO APPLE/OUTLOOK</a>
                    </div>
                  )}
                </div>
                {shouldShowLocationPerEvent && event.mapUrl && (
                  <a
                    className="map-link"
                    href={event.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {event.mapLabel ?? "OPEN MAP"} <span>↗</span>
                  </a>
                )}
              </motion.article>
                );
              })()
            ))}
          </div>

          {sharedLocation && (
            <Reveal className="shared-location-block">
              <p className="shared-location-label">VENUE</p>
              {sharedLocation.venue && <p className="shared-location-venue">{sharedLocation.venue}</p>}
              {sharedLocation.address && <p className="shared-location-address">{sharedLocation.address}</p>}
              {sharedLocation.mapUrl && (
                <a
                  className="map-link shared-location-map"
                  href={sharedLocation.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sharedLocation.mapLabel ?? "OPEN MAP"} <span>↗</span>
                </a>
              )}
              {(sharedLocationEvent?.venueImage || sharedLocationEvent?.mapEmbedUrl) && (
                <div className="event-venue-visual shared-venue-visual">
                  {sharedLocationEvent.venueImage && (
                    <img
                      src={sharedLocationEvent.venueImage}
                      alt={sharedLocationEvent.venueImageAlt ?? "Wedding venue"}
                      loading="lazy"
                    />
                  )}
                  {sharedLocationEvent.mapEmbedUrl && (
                    <iframe
                      src={sharedLocationEvent.mapEmbedUrl}
                      title="Wedding venue map"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  )}
                </div>
              )}
            </Reveal>
          )}
        </div>
      </section>

      {primaryEvent?.countdownDate && (
        <section className="countdown-section">
          <div className="container countdown-inner">
            <Reveal className="countdown-heading">
              <p className="eyebrow light">THE BIG DAY</p>
              <h2>
                Almost time.
                <br />
                <i>See you there.</i>
              </h2>
            </Reveal>
            <Countdown target={primaryEvent.countdownDate} />
          </div>
        </section>
      )}

      <Gallery gallery={config.gallery} />

      <RSVP config={config.rsvp} />

      <footer className="footer">
        <div className="footer-line" />
        <Reveal className="center">
          <p className="eyebrow">WITH LOVE</p>
          <div className="footer-monogram">
            {bride.name.charAt(0)} <span aria-hidden="true">♥</span> {groom.name.charAt(0)}
          </div>
          <h2>{config.footer.message}</h2>
          <p className="footer-names">{bride.name} & {groom.name}</p>
          <p className="footer-date">{primaryEvent?.dateLabel?.toUpperCase()}</p>
        </Reveal>
      </footer>
    </main>
  );
}
