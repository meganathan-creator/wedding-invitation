import { useEffect, useState } from "react";
import { motion } from "motion/react";

function getTime(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return [
    ["DAYS", Math.floor(diff / 86400000)],
    ["HOURS", Math.floor(diff / 3600000) % 24],
    ["MIN", Math.floor(diff / 60000) % 60],
    ["SEC", Math.floor(diff / 1000) % 60]
  ] as const;
}

export function Countdown({ target }: { target?: string }) {
  const [time, setTime] = useState(() => target ? getTime(target) : getTime("1970-01-01"));

  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setTime(getTime(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <div className="countdown-grid">
      {time.map(([label, value], index) => (
        <motion.div
          className="countdown-cell"
          key={label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.07 }}
        >
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </motion.div>
      ))}
    </div>
  );
}
