import { motion } from "motion/react";
import type { WeddingConfig } from "../types/wedding";
import { Reveal } from "./Reveal";

/**
 * Layout follows the number of photos instead of forcing a big-gallery grid:
 *   1 photo       → a single framed print
 *   3 photos      → editorial wall (one tall + two stacked; fills exactly)
 *   2 or 4+ photos → two columns of matched portrait prints, the right column
 *                    dropped for rhythm (works for any count, no grid gaps)
 */
function layoutFor(count: number) {
  if (count === 1) return "is-single";
  if (count === 3) return "is-wall";
  return "is-columns";
}

export function Gallery({ gallery }: { gallery: WeddingConfig["gallery"] }) {
  if (!gallery.photos.length) return null;

  const photos = gallery.photos.map((photo, index) => {
    const fallbackCaption = String(index + 1).padStart(2, "0");
    if (typeof photo === "string") {
      return { src: photo, alt: `Wedding moment ${index + 1}`, caption: fallbackCaption, position: undefined };
    }
    return {
      src: photo.src,
      alt: photo.alt?.trim() || `Wedding moment ${index + 1}`,
      caption: photo.caption?.trim() || fallbackCaption,
      position: photo.position,
    };
  });

  const layout = layoutFor(photos.length);

  const renderPhoto = (photo: (typeof photos)[number], index: number) => (
    <figure key={`${photo.src}-${index}`} className={`gallery-item gallery-item-${index + 1}`}>
      <div className="gallery-frame">
        <motion.img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          style={photo.position ? { objectPosition: photo.position } : undefined}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement?.classList.add("gallery-missing");
          }}
        />
      </div>
      <figcaption>
        {layout !== "is-wall" && (
          <span className="gallery-index">{String(index + 1).padStart(2, "0")}</span>
        )}
        <span className="gallery-caption">{photo.caption}</span>
      </figcaption>
    </figure>
  );
  const eyebrow =
    gallery.eyebrow ?? (photos.length === 2 ? "TWO FRAMES" : photos.length === 1 ? "ONE FRAME" : "A FEW FRAMES");

  return (
    <section className={`gallery-section gallery-${layout}`}>
      <div className="container">
        <Reveal className="gallery-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{gallery.title}</h2>
          </div>
          <p className="gallery-subtitle">{gallery.subtitle}</p>
        </Reveal>

        {layout === "is-columns" ? (
          <div className="gallery-wall is-columns">
            {[0, 1].map((column) => (
              <div className={`gallery-col gallery-col-${column + 1}`} key={column}>
                {photos.map((photo, index) =>
                  index % 2 === column ? renderPhoto(photo, index) : null
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`gallery-wall ${layout}`}>
            {photos.map((photo, index) => renderPhoto(photo, index))}
          </div>
        )}
      </div>
    </section>
  );
}
