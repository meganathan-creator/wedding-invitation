import { useEffect, useRef, useState } from "react";

export function MusicButton({
  file,
  label = "Music"
}: {
  file: string;
  label?: string;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
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
    } catch {
      // Browsers can block autoplay; user can tap again.
    }
  }

  return (
    <button
      className={`music-button ${playing ? "" : "music-button-pulse"}`.trim()}
      onClick={toggle}
      aria-label="Toggle music"
    >
      {showHint && !playing && <span className="music-hint">Tap for music</span>}
      <span className={`equalizer ${playing ? "playing" : ""}`}>
        <i /><i /><i /><i />
      </span>
      {playing ? "ON" : label}
    </button>
  );
}
