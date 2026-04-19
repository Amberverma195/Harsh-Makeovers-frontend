import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { formatPhoneDisplay } from "@/lib/phone";
import Link from "next/link";
import {
  FiInstagram,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Harsh Makeovers — Professional Makeup Artist",
  description:
    "Book bridal, party, and special occasion makeup services with Harsh Makeovers. Based in Canada.",
};

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/harsh_makeovers_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    Icon: FiInstagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@harsh_makeovers_?_r=1&_t=ZS-94cHX6x9inV",
    Icon: () => (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.22z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:harshgodara367@gmail.com",
    Icon: FiMail,
  },
  {
    label: "Phone",
    href: "tel:+16728553363",
    Icon: FiPhone,
  },
];

const quickLinks = [
  { label: "Services", href: "/services" },
  { label: "Book Now", href: "/book" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Contact", href: "/contact" },
  { label: "Classes", href: "/classes" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} antialiased bg-[#0a0a0a] text-white/90`}
      >
        <AuthProvider>
          <AuthModalProvider>
            <ToastProvider>
              <Navbar />
              <AuthModal />
              <main className="min-h-[calc(100vh-4rem)]">{children}</main>

              <footer className="border-t border-white/10 bg-black/40">
                <div className="mx-auto max-w-6xl px-4 py-12">
                  <div className="grid gap-10 md:grid-cols-3">
                    <div>
                      <Link
                        href="/"
                        className="text-xl font-bold tracking-tight"
                      >
                        Harsh{" "}
                        <span className="bg-linear-to-r from-brand-pink to-brand-rose bg-clip-text text-transparent">
                          Makeovers
                        </span>
                      </Link>
                      <p className="mt-3 max-w-xs text-sm text-white/40">
                        Professional makeup artistry for brides, parties, and
                        every occasion that deserves perfection.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                        Quick Links
                      </h4>
                      <ul className="space-y-2">
                        {quickLinks.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="text-sm text-white/40 transition hover:text-brand-pink"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                        Connect
                      </h4>
                      <div className="flex items-center gap-3">
                        {socials.map((s) => (
                          <a
                            key={s.label}
                            href={s.href}
                            target={
                              s.href.startsWith("http") ? "_blank" : undefined
                            }
                            rel={
                              s.href.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            aria-label={s.label}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-brand-pink/50 hover:text-brand-pink"
                          >
                            <s.Icon />
                          </a>
                        ))}
                      </div>
                      <div className="mt-4 space-y-1 text-sm text-white/40">
                        <p>harshgodara367@gmail.com</p>
                        <p>{formatPhoneDisplay("+16728553363")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-white/30">
                    &copy; {new Date().getFullYear()} Harsh Makeovers. All
                    rights reserved.
                  </div>
                </div>
              </footer>
            </ToastProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
