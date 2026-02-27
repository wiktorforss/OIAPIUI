"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, BookOpen, BarChart2, Briefcase, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import clsx from "clsx";

const nav = [
  { href: "/",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/insider",     label: "Insider",    icon: TrendingUp },
  { href: "/my-trades",   label: "My Trades",  icon: BookOpen },
  { href: "/performance", label: "Performance",icon: BarChart2 },
  { href: "/portfolio",   label: "Portfolio",  icon: Briefcase },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <span className="text-green-400 font-bold text-lg tracking-tight">📈 InsiderTrack</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-green-900/50 text-green-400"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors w-full">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <span className="text-green-400 font-bold tracking-tight">📈 InsiderTrack</span>
        <button onClick={logout} className="text-gray-500 hover:text-red-400 p-1 transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors",
            pathname === href || (href !== "/" && pathname.startsWith(href))
              ? "text-green-400"
              : "text-gray-500"
          )}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
