import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
export function MusicButton({ file, label = "Music" }) {
    const audio = useRef(null);
    const [playing, setPlaying] = useState(false);
    async function toggle() {
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
    return (_jsxs("button", { className: "music-button", onClick: toggle, "aria-label": "Toggle music", children: [_jsxs("span", { className: `equalizer ${playing ? "playing" : ""}`, children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), playing ? "ON" : label] }));
}
