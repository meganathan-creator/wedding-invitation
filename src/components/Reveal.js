import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from "motion/react";
export function Reveal({ children, className = "", delay = 0 }) {
    return (_jsx(motion.div, { className: className, initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.16 }, transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }, children: children }));
}
