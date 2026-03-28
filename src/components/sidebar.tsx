"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/resources", label: "Resources" },
  { href: "/projects", label: "Projects" },
  { href: "/assignments", label: "Assignments" },
  { href: "/capacity", label: "Capacity" },
  { href: "/financials", label: "Financials" },
  { href: "/actuals", label: "Actuals" },
  { href: "/pto", label: "Time Off" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0f172a] text-white flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-tight">ResourceTracker</h1>
      </div>
      <nav className="flex-1 p-2">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm ${
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
