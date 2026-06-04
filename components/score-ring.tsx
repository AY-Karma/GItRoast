"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function ScoreRing({ value }: { value: number }) {
  const progress = useMotionValue(0);
  const spring = useSpring(progress, { stiffness: 70, damping: 18 });
  const display = useTransform(spring, (latest) => Math.round(latest));
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = useTransform(spring, (latest) => circumference - (latest / 100) * circumference);

  useEffect(() => {
    progress.set(value);
  }, [progress, value]);

  return (
    <div className="relative size-40 shrink-0">
      <svg className="size-40 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,.1)" strokeWidth="12" fill="none" />
        <motion.circle
          cx="64"
          cy="64"
          r="54"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#FF5C8A" />
            <stop offset="0.5" stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <motion.div className="text-4xl font-black tracking-normal">{display}</motion.div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">/ 100</div>
        </div>
      </div>
    </div>
  );
}
