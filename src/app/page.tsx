"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { CardSkeleton } from "@/components/Skeleton";
import Skeleton from "@/components/Skeleton";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, CATEGORY_ICONS, formatDurationInHours } from "@/lib/utils";
import type {
  Service,
  PortfolioItem,
  Review,
  PaginatedResponse,
} from "@/types";
import { FiStar, FiArrowRight } from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease },
  }),
};

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    api
      .get<Service[]>("/services")
      .then((data) => setServices(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingServices(false));

    api
      .get<PaginatedResponse<PortfolioItem>>("/portfolio?limit=4")
      .then((data) => setPortfolio(data.data))
      .catch(() => {})
      .finally(() => setLoadingPortfolio(false));

    api
      .get<PaginatedResponse<Review>>("/reviews/approved?limit=6")
      .then((data) => setReviews(data.data))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, []);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.08)_0%,transparent_70%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-28 text-center sm:py-36">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-brand-pink"
          >
            Professional Makeup Artist
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your beauty, elevated by{" "}
            <span className="bg-linear-to-r from-brand-pink via-brand-rose to-brand-gold bg-clip-text text-transparent">
              Harsh Makeovers
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/50"
          >
            Bridal, party, and special occasion makeup services crafted with
            precision and care. Based in Canada, serving clients who deserve to
            look their absolute best.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/book"
              className="inline-flex rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-brand-pink/20 transition hover:scale-[1.03] hover:opacity-90 hover:shadow-brand-pink/30"
            >
              Book Appointment
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/70 transition hover:scale-[1.03] hover:border-brand-pink/40 hover:text-brand-pink"
            >
              View Portfolio
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,168,124,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="mb-3 text-center text-3xl font-bold"
          >
            Our Services
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className="mx-auto mb-14 max-w-lg text-center text-white/40"
          >
            From bridal glam to everyday elegance, we have you covered.
          </motion.p>

          {loadingServices ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i + 2}
                  className="group rounded-2xl border border-white/6 bg-white/3 p-6 backdrop-blur-sm transition hover:border-brand-pink/20 hover:bg-white/6"
                >
                  <span className="text-2xl">
                    {CATEGORY_ICONS[service.category]}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white/90">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">
                    {service.description}
                  </p>
                  <p className="mt-3 text-xs font-medium text-brand-pink">
                    {formatDurationInHours(service.durationMinutes)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-pink transition hover:text-brand-rose"
            >
              View All Services <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      {(loadingPortfolio || portfolio.length > 0) && (
        <section className="relative py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,165,116,0.05)_0%,transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-4">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={0}
              className="mb-3 text-center text-3xl font-bold"
            >
              Recent Work
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={1}
              className="mx-auto mb-14 max-w-lg text-center text-white/40"
            >
              A glimpse of our latest transformations.
            </motion.p>

            {loadingPortfolio ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-white/6 bg-white/3"
                  >
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <div className="p-4">
                      <Skeleton className="mb-2 h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {portfolio.map((item, i) => (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    custom={i + 2}
                    className="group overflow-hidden rounded-2xl border border-white/6 bg-white/3 transition hover:border-brand-pink/20"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.modelName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-brand-pink backdrop-blur-sm">
                        {item.makeupType}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-white/90">
                        {item.modelName}
                      </h3>
                      <p className="mt-1 text-xs text-white/40 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-10 text-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-pink transition hover:text-brand-rose"
              >
                View Full Portfolio <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Reviews Carousel */}
      {(loadingReviews || reviews.length > 0) && (
        <ReviewsSection reviews={reviews} loading={loadingReviews} />
      )}

      {/* Classes CTA */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-white/6 bg-white/3 p-10 text-center backdrop-blur-sm sm:p-14">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-sm font-semibold uppercase tracking-wider text-brand-gold"
            >
              Learn With Harsh
            </motion.p>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="mt-3 text-3xl font-bold"
            >
              Makeup Classes & Workshops
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="mx-auto mt-4 max-w-xl text-white/40"
            >
              Want to learn professional makeup techniques? Join our classes and
              workshops for beginners and advanced artists alike.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={3}
            >
              <Link
                href="/classes"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-brand-gold to-brand-rose px-8 py-3 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90"
              >
                Explore Classes <FiArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-3xl font-bold"
          >
            Ready to book your look?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className="mt-4 text-white/40"
          >
            Book an appointment or reach out with any questions.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={2}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/book"
              className="inline-flex rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-8 py-3 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90"
            >
              Book Appointment
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white/70 transition hover:scale-[1.03] hover:border-brand-pink/40 hover:text-brand-pink"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

function ReviewsSection({
  reviews,
  loading,
}: {
  reviews: Review[];
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.04)_0%,transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="mb-3 text-center text-3xl font-bold"
        >
          What Our Clients Say
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          className="mx-auto mb-14 max-w-lg text-center text-white/40"
        >
          Real reviews from real clients.
        </motion.p>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/6 bg-white/3 p-6"
              >
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-4 h-4 w-3/4" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                className="rounded-2xl border border-white/6 bg-white/3 p-6 backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <FiStar
                      key={j}
                      className={`h-4 w-4 ${
                        j < review.rating
                          ? "fill-brand-gold text-brand-gold"
                          : "text-white/15"
                      }`}
                    />
                  ))}
                </div>
                {review.reviewText && (
                  <p className="mb-4 text-sm leading-relaxed text-white/60">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">
                    {review.user.name}
                  </span>
                  <span className="text-xs text-white/30">
                    {CATEGORY_LABELS[review.booking.service.category]}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
