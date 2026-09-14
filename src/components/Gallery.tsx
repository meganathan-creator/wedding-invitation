import { motion } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { Reveal } from "./Reveal";

export function Gallery({ gallery }: { gallery: WeddingConfig["gallery"] }) {
  if (!gallery.photos.length) return null;

  const photos = gallery.photos.map((photo, index) => {
    if (typeof photo === "string") {
      return {
        src: photo,
        alt: `Wedding moment ${index + 1}`,
        caption: String(index + 1).padStart(2, "0"),
      };
    }

    return {
      src: photo.src,
      alt: photo.alt?.trim() || `Wedding moment ${index + 1}`,
      caption: photo.caption?.trim() || String(index + 1).padStart(2, "0"),
    };
  });

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
          {photos.map((photo, index) => (
            <motion.figure
              key={`${photo.src}-${index}`}
              className={`gallery-item gallery-item-${index + 1}`}
              whileHover={{ scale: 1.025 }}
              transition={{ duration: 0.35 }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.classList.add("gallery-missing");
                }}
              />
              <figcaption>{photo.caption}</figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
