"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, BookOpen, BarChart2 } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/",            label: "Dashboard",      icon: LayoutDashboard },
  { href: "/insider",     label: "Insider Trades",  icon: TrendingUp },
  { href: "/my-trades",   label: "My Trades",       icon: BookOpen },
  { href: "/performance", label: "Performance",     icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-green-400 font-bold text-lg tracking-tight">
          📈 InsiderTrack
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-green-900/50 text-green-400"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-600">
        Personal use only
      </div>
    </aside>
  );
}
