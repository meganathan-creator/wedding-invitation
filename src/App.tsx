import { motion, useReducedMotion } from "motion/react";
import type { WeddingConfig } from "./types/wedding";
import { Hero } from "./components/Hero";
import { Reveal } from "./components/Reveal";
import { Countdown } from "./components/Countdown";
import { Gallery } from "./components/Gallery";
import { RSVP } from "./components/RSVP";
import { EventCard, MapLink, VenueMedia } from "./components/EventCard";
import "./styles.css";

export default function App({ config }: { config: WeddingConfig }) {
  const { bride, groom } = config.couple;
  const reduceMotion = useReducedMotion();
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
  const sharedLocationText = sharedLocation
    ? [sharedLocation.venue, sharedLocation.address].filter(Boolean).join(", ")
    : "";

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
              initial={reduceMotion ? false : { opacity: 0, x: -70 }}
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
              initial={reduceMotion ? false : { opacity: 0, x: 70 }}
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
              <EventCard
                key={event.id}
                event={event}
                index={index}
                coupleNames={coupleNames}
                showLocation={shouldShowLocationPerEvent}
                fallbackLocation={sharedLocationText}
              />
            ))}
          </div>

          {sharedLocation && (
            <Reveal className="shared-location-block">
              <p className="shared-location-label">VENUE</p>
              {sharedLocation.venue && <p className="shared-location-venue">{sharedLocation.venue}</p>}
              {sharedLocation.address && <p className="shared-location-address">{sharedLocation.address}</p>}
              {sharedLocation.mapUrl && (
                <MapLink
                  className="shared-location-map"
                  href={sharedLocation.mapUrl}
                  label={sharedLocation.mapLabel}
                />
              )}
              <VenueMedia
                className="shared-venue-visual"
                image={sharedLocationEvent?.venueImage}
                imageAlt={sharedLocationEvent?.venueImageAlt ?? "Wedding venue"}
                mapEmbedUrl={sharedLocationEvent?.mapEmbedUrl}
                label="Wedding venue"
              />
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
