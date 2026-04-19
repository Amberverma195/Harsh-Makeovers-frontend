"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiPlay } from "react-icons/fi";

interface PortfolioMediaSliderProps {
  imageUrl: string;
  videoUrl: string | null;
  alt: string;
}

export default function PortfolioMediaSlider({
  imageUrl,
  videoUrl,
  alt,
}: PortfolioMediaSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = !!videoUrl;
  const totalSlides = hasVideo ? 2 : 1;

  const swipeThreshold = 50;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!hasVideo) return;
    if (info.offset.x < -swipeThreshold && activeIndex === 0) {
      setActiveIndex(1);
    } else if (info.offset.x > swipeThreshold && activeIndex === 1) {
      setActiveIndex(0);
      pauseVideo();
    }
  };

  const navigate = (dir: -1 | 1) => {
    const next = activeIndex + dir;
    if (next >= 0 && next < totalSlides) {
      setActiveIndex(next);
      if (next === 0) pauseVideo();
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  return (
    <div className="group/slider relative aspect-[3/4] overflow-hidden">
      <motion.div
        className="flex h-full"
        drag={hasVideo ? "x" : undefined}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ cursor: hasVideo ? "grab" : "default" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {activeIndex === 0 && (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full shrink-0"
            >
              <img
                src={imageUrl}
                alt={alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </motion.div>
          )}
          {activeIndex === 1 && videoUrl && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-full w-full shrink-0 bg-black"
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="h-full w-full object-cover"
                playsInline
                loop
                preload="none"
              />
              {!videoPlaying && (
                <button
                  onClick={playVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white transition hover:scale-110 hover:border-brand-pink">
                    <FiPlay className="ml-1 h-6 w-6" />
                  </div>
                </button>
              )}
              {videoPlaying && (
                <button
                  onClick={pauseVideo}
                  className="absolute inset-0"
                  aria-label="Pause video"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation arrows (desktop) */}
      {hasVideo && (
        <>
          {activeIndex > 0 && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/70 opacity-0 transition hover:text-white group-hover/slider:opacity-100 sm:flex"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
          )}
          {activeIndex < totalSlides - 1 && (
            <button
              onClick={() => navigate(1)}
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/70 opacity-0 transition hover:text-white group-hover/slider:opacity-100 sm:flex"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      {/* Dot indicators */}
      {hasVideo && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                if (i === 0) pauseVideo();
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-4 bg-brand-pink"
                  : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
