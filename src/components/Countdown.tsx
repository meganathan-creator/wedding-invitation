import { useEffect, useState } from "react";
import { motion } from "motion/react";

function getTime(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const safeDiff = Math.max(0, diff);
  return {
    isPast: diff <= 0,
    values: [
      ["DAYS", Math.floor(safeDiff / 86400000)],
      ["HOURS", Math.floor(safeDiff / 3600000) % 24],
      ["MIN", Math.floor(safeDiff / 60000) % 60],
      ["SEC", Math.floor(safeDiff / 1000) % 60]
    ] as const,
  };
}

export function Countdown({ target }: { target?: string }) {
  const [time, setTime] = useState(() => target ? getTime(target) : getTime("1970-01-01"));

  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setTime(getTime(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (time.isPast) {
    return (
      <motion.div
        className="countdown-finished"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3>We are married.</h3>
        <p>Thank you for your love, blessings, and presence.</p>
      </motion.div>
    );
  }

  return (
    <div className="countdown-grid">
      {time.values.map(([label, value], index) => (
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
