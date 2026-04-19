"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const PAUSE_MS = 1200;
const TRAVEL_MS = 2200;
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

type HighlightItem = {
  title: string;
  desc: string;
};

type ClassesHighlightsWheelProps = {
  items: HighlightItem[];
};

function getCardPose(offset: number) {
  if (offset <= -3) {
    return {
      x: -640,
      y: 42,
      scale: 0.48,
      rotateX: 2,
      rotateY: 72,
      rotateZ: -1,
      opacity: 0,
      zIndex: 0,
      filter: "blur(8px)",
    };
  }

  if (offset >= 3) {
    return {
      x: 640,
      y: 42,
      scale: 0.48,
      rotateX: 2,
      rotateY: -72,
      rotateZ: 1,
      opacity: 0,
      zIndex: 0,
      filter: "blur(8px)",
    };
  }

  if (offset === -2) {
    return {
      x: -430,
      y: 26,
      scale: 0.56,
      rotateX: 1,
      rotateY: 54,
      rotateZ: -2.2,
      opacity: 0.18,
      zIndex: 8,
      filter: "blur(4.5px)",
    };
  }

  if (offset === -1) {
    return {
      x: -235,
      y: 8,
      scale: 0.72,
      rotateX: 0,
      rotateY: 27,
      rotateZ: -2.4,
      opacity: 0.5,
      zIndex: 30,
      filter: "blur(1.8px)",
    };
  }

  if (offset === 0) {
    return {
      x: 0,
      y: 0,
      scale: 1.06,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      zIndex: 60,
      filter: "blur(0px)",
    };
  }

  if (offset === 1) {
    return {
      x: 235,
      y: 8,
      scale: 0.72,
      rotateX: 0,
      rotateY: -27,
      rotateZ: 2.4,
      opacity: 0.52,
      zIndex: 30,
      filter: "blur(1.8px)",
    };
  }

  return {
    x: 430,
    y: 26,
    scale: 0.56,
    rotateX: 1,
    rotateY: -54,
    rotateZ: 2.2,
    opacity: 0.18,
    zIndex: 8,
    filter: "blur(4.5px)",
  };
}

export default function ClassesHighlightsWheel({
  items,
}: ClassesHighlightsWheelProps) {
  const duplicatedItems = useMemo(() => [...items, ...items, ...items], [items]);
  const baseIndex = items.length;

  const [activeIndex, setActiveIndex] = useState(baseIndex);
  const [isPaused, setIsPaused] = useState(true);
  const [disableTransition, setDisableTransition] = useState(false);

  useEffect(() => {
    if (items.length < 2) return;

    const timeoutId = window.setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setActiveIndex((prev) => prev + 1);
        return;
      }

      if (activeIndex >= baseIndex + items.length) {
        setDisableTransition(true);
        setActiveIndex((prev) => prev - items.length);
      }

      setIsPaused(true);
    }, isPaused ? PAUSE_MS : TRAVEL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, baseIndex, isPaused, items.length]);

  useEffect(() => {
    if (!disableTransition) return;

    const frameId = window.requestAnimationFrame(() => {
      setDisableTransition(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [disableTransition]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="relative px-2 py-2 sm:px-4">
        <div className="pointer-events-none absolute left-1/2 top-14 h-24 w-[18rem] -translate-x-1/2 rounded-full bg-brand-gold/10 blur-3xl" />

        <div className="relative h-[21rem] sm:h-[20rem]" style={{ perspective: 1400 }}>
          <div className="pointer-events-none absolute bottom-10 left-1/2 h-12 w-[78%] -translate-x-1/2 rounded-full bg-brand-gold/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-7 left-1/2 h-px w-[72%] -translate-x-1/2 bg-linear-to-r from-transparent via-white/12 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/[0.08]" />

          <div className="pointer-events-none absolute left-1/2 top-1 h-40 w-[22rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,245,214,0.46)_0%,rgba(255,224,161,0.18)_34%,transparent_72%)] opacity-90 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[20rem] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,244,215,0.2),transparent)] opacity-45 [clip-path:polygon(50%_0%,100%_100%,0%_100%)] blur-xl" />

          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            {duplicatedItems.map((item, index) => {
              const relativeOffset = index - activeIndex;
              const isFront = relativeOffset === 0;

              return (
                <motion.div
                  key={`${index}-${item.title}`}
                  initial={false}
                  animate={getCardPose(relativeOffset)}
                  transition={disableTransition ? { duration: 0 } : { duration: TRAVEL_MS / 1000, ease }}
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[15.5rem] -translate-x-1/2 -translate-y-1/2 sm:w-[18rem] lg:w-[19.5rem]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="relative min-h-[15rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_24%,rgba(17,17,17,0.96)_75%)] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.52)]">
                    <div className="absolute inset-[1px] rounded-[1.65rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_25%),linear-gradient(180deg,rgba(26,26,26,0.98),rgba(7,7,7,0.98))]" />
                    <div className="absolute -right-12 top-0 h-28 w-32 rotate-[18deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_75%)] blur-xl" />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-[radial-gradient(ellipse_at_bottom,rgba(212,165,116,0.16),transparent_72%)]" />

                    {isFront && (
                      <div className="pointer-events-none absolute inset-x-6 top-5 h-16 bg-[radial-gradient(ellipse_at_center,rgba(255,241,207,0.3),transparent_75%)] blur-2xl" />
                    )}

                    <div className="relative">
                      <h3 className="max-w-[12rem] text-2xl font-semibold tracking-[-0.04em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-white/60">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="sr-only">
            <ul>
              {items.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>: {item.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((item, index) => {
            const currentIndex = activeIndex % items.length;
            const isCurrent = currentIndex === index;

            return (
              <div
                key={item.title}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isCurrent ? "w-10 bg-brand-gold shadow-[0_0_18px_rgba(212,165,116,0.55)]" : "w-3 bg-white/12"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
