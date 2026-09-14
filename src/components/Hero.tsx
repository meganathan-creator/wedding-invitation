import { motion, useScroll, useTransform } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { MusicButton } from "./MusicButton";

export function Hero({ config }: { config: WeddingConfig }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 140]);
  const scale = useTransform(scrollY, [0, 900], [1.03, 1.14]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.15]);
  const { bride, groom } = config.couple;
  const heroEvent =
    config.events.find((event) => event.countdownDate) ??
    config.events.find((event) => /wedding/i.test(event.type)) ??
    config.events[0];
  const totalSections =
    config.hero.pageCount ??
    (
      1 + // hero
      1 + // invitation
      1 + // celebration
      (heroEvent?.countdownDate ? 1 : 0) +
      (config.gallery.photos.length ? 1 : 0) +
      (config.rsvp.enabled ? 1 : 0) +
      1 // footer
    );

  return (
    <section className="hero">
      <motion.div
        className="hero-image"
        style={{
          y,
          scale,
          backgroundImage: `url("${config.hero.image}")`
        }}
      />
      <div
        className="hero-overlay"
        style={{ opacity: config.hero.overlay ?? 0.58 }}
      />

      <div className="hero-top">
        <span className="hero-index">01 / {String(totalSections).padStart(2, "0")}</span>
        {config.music.enabled && config.hero.showMusicButton !== false && (
          <MusicButton file={config.music.file} label={config.music.label} />
        )}
      </div>

      <motion.div className="hero-copy" style={{ opacity }}>
        <p className="hero-kicker">{config.invitation.eyebrow}</p>

        <div className="hero-date-mark">
          <span>{heroEvent?.dateLabel?.split(" ")[1] ?? ""}</span>
          <strong>{heroEvent?.dateLabel?.match(/\b\d{1,2}\b/)?.[0] ?? "—"}</strong>
          <span>{heroEvent?.dateLabel?.split(" ").slice(-1)[0] ?? ""}</span>
        </div>

        <div className="hero-names">
          <div>{groom.name}</div>
          <span>&amp;</span>
          <div>{bride.name}</div>
        </div>

        <p className="hero-subtitle">A NEW CHAPTER · A BEAUTIFUL BEGINNING</p>
      </motion.div>

      <button
        className="hero-scroll"
        onClick={() =>
          document.querySelector("#invitation")?.scrollIntoView({ behavior: "smooth" })
        }
        aria-label="Open wedding invitation"
      >
        <span>OPEN THE INVITATION</span>
        <i>↓</i>
      </button>
    </section>
  );
}
