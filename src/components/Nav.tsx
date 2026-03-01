"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, BookOpen, BarChart2,
  Briefcase, Eye, LogOut, Zap, Menu, X,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useCurrency } from "@/lib/CurrencyContext";
import clsx from "clsx";
import { useState, useEffect } from "react";

// ── Nav config ────────────────────────────────────────────────────────────────

const desktopNav = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/insider",     label: "Insider",     icon: TrendingUp },
  { href: "/signals",     label: "Signals",     icon: Zap },
  { href: "/my-trades",   label: "My Trades",   icon: BookOpen },
  { href: "/performance", label: "Performance", icon: BarChart2 },
  { href: "/portfolio",   label: "Portfolio",   icon: Briefcase },
  { href: "/watchlist",   label: "Watchlist",   icon: Eye },
];

// 5 primary tabs always visible in the mobile bottom bar
const mobileBottomNav = [
  { href: "/",          label: "Home",      icon: LayoutDashboard },
  { href: "/insider",   label: "Insider",   icon: TrendingUp },
  { href: "/my-trades", label: "Trades",    icon: BookOpen },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
];

// Extra pages accessible from the hamburger drawer
const mobileDrawerNav = [
  { href: "/signals",     label: "Signals",     icon: Zap },
  { href: "/performance", label: "Performance", icon: BarChart2 },
];

// ── Currency toggle ───────────────────────────────────────────────────────────

function CurrencyToggle({ compact = false }: { compact?: boolean }) {
  const { currency, toggle, rate } = useCurrency();
  return (
    <button
      onClick={toggle}
      title={`Rate: 1 USD = ${rate.toFixed(2)} SEK`}
      className={clsx(
        "flex items-center gap-1.5 rounded-lg font-mono font-bold transition-colors border",
        compact
          ? "px-2 py-1 text-xs"
          : "px-3 py-2 text-sm w-full justify-center",
        currency === "SEK"
          ? "bg-blue-900/40 border-blue-700 text-blue-300 hover:bg-blue-900/60"
          : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
      )}
    >
      <span className={currency === "USD" ? "text-green-400" : "text-gray-500"}>$</span>
      <span className="text-gray-600">/</span>
      <span className={currency === "SEK" ? "text-blue-400" : "text-gray-500"}>kr</span>
      <span className="ml-1 text-xs font-normal opacity-60">{currency}</span>
    </button>
  );
}

// ── Main Nav ──────────────────────────────────────────────────────────────────

export default function Nav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else            document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <span className="text-green-400 font-bold text-lg tracking-tight">📈 OIMG</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {desktopNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-green-900/50 text-green-400"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 space-y-2">
          <CurrencyToggle />
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors w-full">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0 sticky top-0 z-40">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 -ml-1 text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <span className="text-green-400 font-bold tracking-tight">📈 OIMG</span>

        <CurrencyToggle compact />
      </div>

      {/* ── Mobile side drawer backdrop ───────────────────────────── */}
      <div
        className={clsx(
          "md:hidden fixed inset-0 z-50 bg-black/60 transition-opacity duration-200",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Mobile side drawer panel ──────────────────────────────── */}
      <div className={clsx(
        "md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200 ease-out",
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <span className="text-green-400 font-bold text-lg tracking-tight">📈 OIMG</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-1">Main</p>
          {mobileBottomNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-green-900/50 text-green-400"
                : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
            )}>
              <Icon size={17} />
              {label}
            </Link>
          ))}

          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-1 pt-4">More</p>
          {mobileDrawerNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-green-900/50 text-green-400"
                : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
            )}>
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-6 pt-2 border-t border-gray-800 space-y-2">
          <CurrencyToggle />
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Mobile bottom tabs ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex">
        {mobileBottomNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors",
            isActive(href) ? "text-green-400" : "text-gray-500"
          )}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}