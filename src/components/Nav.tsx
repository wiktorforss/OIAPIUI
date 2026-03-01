"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, BookOpen, BarChart2, Briefcase, Eye, LogOut, Zap } from "lucide-react";
import { logout } from "@/lib/auth";
import { useCurrency } from "@/lib/CurrencyContext";
import clsx from "clsx";

const desktopNav = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/insider",     label: "Insider",     icon: TrendingUp },
  { href: "/signals",     label: "Signals",     icon: Zap },
  { href: "/my-trades",   label: "My Trades",   icon: BookOpen },
  { href: "/performance", label: "Performance", icon: BarChart2 },
  { href: "/portfolio",   label: "Portfolio",   icon: Briefcase },
  { href: "/watchlist",   label: "Watchlist",   icon: Eye },
];

const mobileNav = [
  { href: "/",            label: "Home",      icon: LayoutDashboard },
  { href: "/insider",     label: "Insider",   icon: TrendingUp },
  { href: "/signals",     label: "Signals",   icon: Zap },
  { href: "/my-trades",   label: "Trades",    icon: BookOpen },
  { href: "/watchlist",   label: "Watchlist", icon: Eye },
];

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
      <span className={currency === "SEK" ? "text-blue-300" : "text-gray-500"}>kr</span>
    </button>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0 bg-gray-900 border-r border-gray-800 p-4 gap-1">
        <div className="mb-4 px-2">
          <p className="text-xs font-bold text-green-400 tracking-widest uppercase">Insider Tracker</p>
        </div>

        {desktopNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-green-500/10 text-green-400"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        <div className="mt-auto space-y-2">
          <CurrencyToggle />
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <p className="text-xs font-bold text-green-400 tracking-widest uppercase">Insider Tracker</p>
        <CurrencyToggle compact />
      </header>

      {/* ── Mobile bottom tabs ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex">
        {mobileNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              pathname === href ? "text-green-400" : "text-gray-500"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}