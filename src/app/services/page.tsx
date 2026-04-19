"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { CardSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, formatDurationInHours } from "@/lib/utils";
import type { Service } from "@/types";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Service[]>("/services")
      .then(setServices)
      .catch(() => setError("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

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
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-transparent bg-linear-to-r from-brand-pink via-white/70 to-brand-gold bg-clip-text"
          >
            From bridal glam to everyday elegance, discover the perfect service
            for your occasion.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-brand-pink hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <EmptyState
            title="No services found"
            description="Check back soon for available services."
          />
        )}

        {!loading && !error && services.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease }}
                className="group rounded-2xl border border-white/6 bg-white/3 p-6 backdrop-blur-sm transition hover:border-brand-pink/20 hover:bg-white/6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-pink/70">
                  {CATEGORY_LABELS[service.category]}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white/90">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">
                  {service.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-white/30">
                    {formatDurationInHours(service.durationMinutes)}
                  </span>
                  <Link
                    href={`/book?serviceId=${service.id}`}
                    className="rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-5 py-2 text-xs font-semibold text-black transition hover:scale-[1.03] hover:opacity-90"
                  >
                    Book Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
