import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { MusicButton } from "./MusicButton";

export function Hero({ config }: { config: WeddingConfig }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 140]);
  const scale = useTransform(scrollY, [0, 900], [1.03, 1.14]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.15]);
  // Scroll-linked styles aren't animations, so MotionConfig can't switch them off — do it here.
  const reduceMotion = useReducedMotion();
  const { bride, groom } = config.couple;
  const heroEyebrow = config.invitation.heroEyebrow ?? config.invitation.eyebrow;
  const heroEvent =
    config.events.find((event) => event.countdownDate) ??
    config.events.find((event) => /wedding/i.test(event.type)) ??
    config.events[0];
  return (
    <section className="hero">
      <motion.div
        className="hero-image"
        style={{
          ...(reduceMotion ? {} : { y, scale }),
          backgroundImage: `url("${config.hero.image}")`
        }}
      />
      <div
        className="hero-overlay"
        style={{ opacity: config.hero.overlay ?? 0.58 }}
      />

      <div className="hero-top">
        {config.music.enabled && config.hero.showMusicButton !== false && (
          <MusicButton file={config.music.file} label={config.music.label} />
        )}
      </div>

      <motion.div className="hero-copy" style={reduceMotion ? undefined : { opacity }}>
        {heroEyebrow && <p className="hero-kicker">{heroEyebrow}</p>}

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
          document.querySelector("#invitation")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
        }
        aria-label="Open wedding invitation"
      >
        <span>OPEN THE INVITATION</span>
        <i>↓</i>
      </button>
    </section>
  );
}
