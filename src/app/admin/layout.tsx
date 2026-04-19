"use client";

import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiImage,
  FiMail,
  FiMenu,
  FiSearch,
  FiShield,
  FiStar,
  FiX,
} from "react-icons/fi";

const navItems = [
  { href: "/admin", label: "Bookings", Icon: FiCalendar },
  { href: "/admin/inquiries", label: "Inquiries", Icon: FiMail },
  { href: "/admin/reviews", label: "Reviews", Icon: FiStar },
  { href: "/admin/portfolio", label: "Portfolio", Icon: FiImage },
  { href: "/admin/slots", label: "Blocked Slots", Icon: FiClock },
  { href: "/admin/users", label: "User Search", Icon: FiSearch },
  { href: "/admin/security", label: "Security", Icon: FiShield },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpenPath, setSidebarOpenPath] = useState<string | null>(null);
  const sidebarOpen = sidebarOpenPath === pathname;

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [isLoading, user, isAdmin, router]);

  const toggleSidebar = () => {
    setSidebarOpenPath((current) => (current === pathname ? null : pathname));
  };

  const closeSidebar = () => {
    setSidebarOpenPath(null);
  };

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const linkClass = (href: string) => {
    const active =
      href === "/admin"
        ? pathname === "/admin" || pathname.startsWith("/admin/bookings/")
        : pathname.startsWith(href);
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      active
        ? "bg-brand-pink/10 text-brand-pink"
        : "text-white/50 hover:bg-white/5 hover:text-white/80"
    }`;
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-r border-white/8 p-4 lg:block">
        <h2 className="mb-6 px-4 text-xs font-bold uppercase tracking-widest text-white/30">
          Admin Panel
        </h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <item.Icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink text-black shadow-lg shadow-brand-pink/25"
        >
          {sidebarOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -240 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -240 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-40 w-60 border-r border-white/8 bg-[#0a0a0a]/95 p-4 pt-20 backdrop-blur-xl lg:hidden"
          >
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
