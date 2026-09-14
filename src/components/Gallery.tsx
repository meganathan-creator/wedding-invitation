import { motion } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { Reveal } from "./Reveal";

export function Gallery({ gallery }: { gallery: WeddingConfig["gallery"] }) {
  if (!gallery.photos.length) return null;

  return (
    <section className="gallery-section">
      <div className="container">
        <Reveal className="gallery-heading">
          <div>
            <p className="eyebrow">A FEW FRAMES</p>
            <h2>{gallery.title}</h2>
          </div>
          <p className="gallery-subtitle">{gallery.subtitle}</p>
        </Reveal>

        <div className="gallery-wall">
          {gallery.photos.map((photo, index) => (
            <motion.figure
              key={`${photo}-${index}`}
              className={`gallery-item gallery-item-${index + 1}`}
              whileHover={{ scale: 1.025 }}
              transition={{ duration: 0.35 }}
            >
              <img
                src={photo}
                alt={`Wedding moment ${index + 1}`}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.classList.add("gallery-missing");
                }}
              />
              <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
