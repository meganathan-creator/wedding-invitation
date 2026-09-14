import { useRef, useState } from "react";

export function MusicButton({
  file,
  label = "Music"
}: {
  file: string;
  label?: string;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
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
    } catch {
      // Browsers can block autoplay; user can tap again.
    }
  }

  return (
    <button className="music-button" onClick={toggle} aria-label="Toggle music">
      <span className={`equalizer ${playing ? "playing" : ""}`}>
        <i /><i /><i /><i />
      </span>
      {playing ? "ON" : label}
    </button>
  );
}
