import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
export function MusicButton({ file, label = "Music" }) {
    const audio = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [showHint, setShowHint] = useState(true);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setShowHint(false);
        }, 5000);
        return () => window.clearTimeout(timer);
    }, []);
    async function toggle() {
        setShowHint(false);
        if (!audio.current) {
            audio.current = new Audio(file);
            audio.current.loop = true;
        }
        if (playing) {
            audio.current.pause();
            setPlaying(false);
            return;
        }
        try {
            await audio.current.play();
            setPlaying(true);
        }
        catch {
            // Browsers can block autoplay; user can tap again.
        }
    }
    return (_jsxs("button", { className: `music-button ${playing ? "" : "music-button-pulse"}`.trim(), onClick: toggle, "aria-label": "Toggle music", children: [showHint && !playing && _jsx("span", { className: "music-hint", children: "Tap for music" }), _jsxs("span", { className: `equalizer ${playing ? "playing" : ""}`, children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), playing ? "ON" : label] }));
}
