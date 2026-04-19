"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

const publicLinks = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
  { href: "/classes", label: "Classes" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuOpen = menuOpenPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpenPath((current) => (current === pathname ? null : pathname));
  };

  const closeMenu = () => {
    setMenuOpenPath(null);
  };

  const handleLogout = async () => {
    closeMenu();
    router.replace("/");
    await logout();
    showToast("Logged out");
  };

  const linkClass = (href: string) =>
    `text-sm font-medium transition ${
      pathname === href
        ? "text-brand-pink"
        : "text-white/60 hover:text-brand-pink"
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-black/70 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Harsh{" "}
          <span className="bg-linear-to-r from-brand-pink to-brand-rose bg-clip-text text-transparent">
            Makeovers
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 md:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}

          {!isLoading && !user && (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <Link
                href="/my-bookings"
                className={linkClass("/my-bookings")}
              >
                My Bookings
              </Link>
              <Link
                href="/profile"
                className={linkClass("/profile")}
              >
                Profile
              </Link>
              <span className="text-sm text-white/40">
                Hi, {user.name.split(" ")[0]}
              </span>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-brand-pink transition hover:text-brand-rose"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white/60 transition hover:border-brand-pink/40 hover:text-brand-pink"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={toggleMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition hover:text-brand-pink md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-5">
              {publicLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={linkClass(l.href)}
                >
                  {l.label}
                </Link>
              ))}

              {!isLoading && !user && (
                <>
                  <Link href="/login" className={linkClass("/login")}>
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium text-brand-pink"
                  >
                    Register
                  </Link>
                </>
              )}

              {!isLoading && user && (
                <>
                  <Link
                    href="/my-bookings"
                    className={linkClass("/my-bookings")}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    className={linkClass("/profile")}
                  >
                    Profile
                  </Link>
                  <span className="text-sm text-white/40">
                    Hi, {user.name.split(" ")[0]}
                  </span>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-sm font-medium text-brand-pink"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-left text-sm font-medium text-white/60 transition hover:text-brand-pink"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
