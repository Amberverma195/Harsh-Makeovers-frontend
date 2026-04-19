"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { PortfolioCardSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import PortfolioMediaSlider from "@/components/PortfolioMediaSlider";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, getSafeInstagramUrl } from "@/lib/utils";
import type {
  PortfolioItem,
  PaginatedResponse,
  ServiceCategory,
} from "@/types";
import { FiExternalLink } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";

const ALL_CATEGORIES: ServiceCategory[] = [
  "BRIDAL",
  "NON_BRIDAL",
  "PARTY",
  "HAIR",
  "LASHES",
];

const LIMIT = 12;
const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState<
    ServiceCategory | "ALL"
  >("ALL");

  const fetchPage = useCallback(
    async (p: number, append = false) => {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await api.get<PaginatedResponse<PortfolioItem>>(
          `/portfolio?page=${p}&limit=${LIMIT}`
        );
        setItems((prev) => (append ? [...prev, ...data.data] : data.data));
        setTotalPages(data.pagination.totalPages);
        setPage(p);
      } catch {
        setError("Failed to load portfolio");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const filtered =
    activeCategory === "ALL"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const handleLoadMore = () => {
    fetchPage(page + 1, true);
  };

  return (
    <PageTransition>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-4xl font-bold sm:text-5xl"
          >
            Portfolio
          </motion.h1>
          <LuxuryHeroSubtitle>
            A showcase of our finest transformations and artistry.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        {/* Filter Tabs */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              activeCategory === "ALL"
                ? "bg-brand-pink/20 text-brand-pink"
                : "border border-white/10 text-white/50 hover:text-white/70"
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-brand-pink/20 text-brand-pink"
                  : "border border-white/10 text-white/50 hover:text-white/70"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PortfolioCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchPage(1)}
              className="mt-3 text-sm text-brand-pink hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="No portfolio items yet"
            description="Check back soon for new work."
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, i) => {
                const instagramUrl = getSafeInstagramUrl(item.instagramUrl);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ delay: (i % 6) * 0.05, duration: 0.5, ease }}
                    className="group overflow-hidden rounded-2xl border border-white/6 bg-white/3 transition hover:border-brand-pink/20"
                  >
                    <div className="px-5 pt-5">
                      <div className="inline-flex rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-brand-pink backdrop-blur-sm">
                        {item.makeupType}
                      </div>
                    </div>
                    <PortfolioMediaSlider
                      imageUrl={item.imageUrl}
                      videoUrl={item.videoUrl}
                      alt={item.modelName}
                    />

                    {/* Card body per PRD order: model name, description, Instagram */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white/90">
                        {item.modelName}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/40 line-clamp-2">
                        {item.description}
                      </p>
                      {instagramUrl && (
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-pink/20 px-4 py-2 text-xs font-medium text-brand-pink transition hover:bg-brand-pink/10"
                        >
                          <FaInstagram className="h-3.5 w-3.5" />
                          View on Instagram
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {page < totalPages && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-white/60 transition hover:border-brand-pink/40 hover:text-brand-pink disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </PageTransition>
  );
}

