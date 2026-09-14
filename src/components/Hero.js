import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, useScroll, useTransform } from "motion/react";
import { MusicButton } from "./MusicButton";
export function Hero({ config }) {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 900], [0, 140]);
    const scale = useTransform(scrollY, [0, 900], [1.03, 1.14]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0.15]);
    const { bride, groom } = config.couple;
    const heroEvent = config.events.find((event) => event.countdownDate) ??
        config.events.find((event) => /wedding/i.test(event.type)) ??
        config.events[0];
    return (_jsxs("section", { className: "hero", children: [_jsx(motion.div, { className: "hero-image", style: {
                    y,
                    scale,
                    backgroundImage: `url("${config.hero.image}")`
                } }), _jsx("div", { className: "hero-overlay", style: { opacity: config.hero.overlay ?? 0.58 } }), _jsxs("div", { className: "hero-top", children: [_jsx("span", { className: "hero-index", children: "01 / 05" }), config.music.enabled && config.hero.showMusicButton !== false && (_jsx(MusicButton, { file: config.music.file, label: config.music.label }))] }), _jsxs(motion.div, { className: "hero-copy", style: { opacity }, children: [_jsx("p", { className: "hero-kicker", children: config.invitation.eyebrow }), _jsxs("div", { className: "hero-date-mark", children: [_jsx("span", { children: heroEvent?.dateLabel?.split(" ")[1] ?? "" }), _jsx("strong", { children: heroEvent?.dateLabel?.match(/\b\d{1,2}\b/)?.[0] ?? "—" }), _jsx("span", { children: heroEvent?.dateLabel?.split(" ").slice(-1)[0] ?? "" })] }), _jsxs("div", { className: "hero-names", children: [_jsx("div", { children: groom.name }), _jsx("span", { children: "&" }), _jsx("div", { children: bride.name })] }), _jsx("p", { className: "hero-subtitle", children: "A NEW CHAPTER \u00B7 A BEAUTIFUL BEGINNING" })] }), _jsxs("button", { className: "hero-scroll", onClick: () => document.querySelector("#invitation")?.scrollIntoView({ behavior: "smooth" }), "aria-label": "Open wedding invitation", children: [_jsx("span", { children: "OPEN THE INVITATION" }), _jsx("i", { children: "\u2193" })] })] }));
}
