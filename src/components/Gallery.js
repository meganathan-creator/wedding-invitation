import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
import { Reveal } from "./Reveal";
export function Gallery({ gallery }) {
    if (!gallery.photos.length)
        return null;
    return (_jsx("section", { className: "gallery-section", children: _jsxs("div", { className: "container", children: [_jsxs(Reveal, { className: "gallery-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "A FEW FRAMES" }), _jsx("h2", { children: gallery.title })] }), _jsx("p", { className: "gallery-subtitle", children: gallery.subtitle })] }), _jsx("div", { className: "gallery-wall", children: gallery.photos.map((photo, index) => (_jsxs(motion.figure, { className: `gallery-item gallery-item-${index + 1}`, whileHover: { scale: 1.025 }, transition: { duration: 0.35 }, children: [_jsx("img", { src: photo, alt: `Wedding moment ${index + 1}`, loading: "lazy", onError: (event) => {
                                    event.currentTarget.style.display = "none";
                                    event.currentTarget.parentElement?.classList.add("gallery-missing");
                                } }), _jsx("figcaption", { children: String(index + 1).padStart(2, "0") })] }, `${photo}-${index}`))) })] }) }));
}
