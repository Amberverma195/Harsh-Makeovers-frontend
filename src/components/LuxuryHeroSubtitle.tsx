"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

const defaultEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

type LuxuryHeroSubtitleProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export default function LuxuryHeroSubtitle({
  children,
  delay = 0.15,
  className,
}: LuxuryHeroSubtitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.6, delay, ease: defaultEase }}
      className={`group relative mx-auto mt-6 max-w-2xl${className ? ` ${className}` : ""}`}
    >
      <div className="absolute inset-0 translate-x-2 translate-y-3 rounded-[30px] bg-brand-gold/10 blur-md transition duration-300 group-hover:translate-x-3 group-hover:translate-y-4 group-hover:bg-brand-gold/15" />
      <div className="absolute inset-0 rounded-[30px] border border-brand-gold/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(212,165,116,0.1)_38%,rgba(7,7,7,0.24)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.38)]" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(212,165,116,0.16),rgba(255,255,255,0.03)_26%,rgba(10,10,10,0.62)_100%)] px-7 py-5 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-10 right-10 h-px bg-linear-to-r from-transparent via-brand-gold/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-6 left-0 w-px bg-linear-to-b from-transparent via-white/25 to-transparent" />
        <p className="relative text-sm font-medium leading-relaxed tracking-[0.02em] text-white/80 sm:text-base">
          {children}
        </p>
      </div>
    </motion.div>
  );
}
