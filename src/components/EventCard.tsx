import { motion, useReducedMotion } from "motion/react";
import type { WeddingEvent } from "../types/wedding";
import { getCalendarLinks } from "../calendar";

/** Venue photo and/or embedded Google Map. Renders nothing if neither is configured. */
export function VenueMedia({
  image,
  imageAlt,
  mapEmbedUrl,
  label,
  className = "",
}: {
  image?: string;
  imageAlt?: string;
  mapEmbedUrl?: string;
  label: string;
  className?: string;
}) {
  if (!image && !mapEmbedUrl) return null;

  return (
    <div className={`event-venue-visual ${className}`.trim()}>
      {image && <img src={image} alt={imageAlt ?? `${label} venue`} loading="lazy" />}
      {mapEmbedUrl && (
        <iframe
          src={mapEmbedUrl}
          title={`${label} map`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      )}
    </div>
  );
}

export function MapLink({ href, label, className = "" }: { href: string; label?: string; className?: string }) {
  return (
    <a className={`map-link ${className}`.trim()} href={href} target="_blank" rel="noreferrer">
      {label ?? "OPEN MAP"} <span aria-hidden="true">↗</span>
    </a>
  );
}

export function EventCard({
  event,
  index,
  coupleNames,
  showLocation,
  fallbackLocation,
}: {
  event: WeddingEvent;
  index: number;
  coupleNames: string;
  /** Show venue details on the card (only when events are at different venues). */
  showLocation: boolean;
  /** Used for the calendar entry when the event has no venue of its own. */
  fallbackLocation: string;
}) {
  const reduceMotion = useReducedMotion();
  const calendar = getCalendarLinks(event, coupleNames, fallbackLocation);

  const downloadIcs = () => {
    if (!calendar) return;
    const blob = new Blob([calendar.ics + "\r\n"], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.article
      className={`event-card ${index === 0 ? "event-card-main" : ""}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
    >
      <div className="event-number">{String(index + 1).padStart(2, "0")}</div>

      <div className="event-copy">
        <p className="event-type">{event.type}</p>
        <h3>{event.dateLabel}</h3>
        <p className="event-time">{event.time}</p>

        {showLocation && (
          <>
            {event.venue && <p className="event-venue">{event.venue}</p>}
            {event.address && <p className="event-address">{event.address}</p>}
            <VenueMedia
              image={event.venueImage}
              imageAlt={event.venueImageAlt}
              mapEmbedUrl={event.mapEmbedUrl}
              label={event.type}
            />
          </>
        )}

        {calendar && (
          <div className="calendar-actions">
            <a href={calendar.googleUrl} target="_blank" rel="noreferrer">
              ADD TO GOOGLE
            </a>
            <a
              href="#"
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                downloadIcs();
              }}
            >
              ADD TO APPLE/OUTLOOK
            </a>
          </div>
        )}
      </div>

      {showLocation && event.mapUrl && <MapLink href={event.mapUrl} label={event.mapLabel} />}
    </motion.article>
  );
}
