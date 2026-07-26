"use client";

import {
  BarChart3,
  CalendarDays,
  Mountain,
  Settings2,
  ShoppingBasket
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/shopping", label: "Shopping", icon: ShoppingBasket },
  { href: "/climbing", label: "Climb", icon: Mountain },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function BottomNav() {
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const currentPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? currentPath === "/" : currentPath.startsWith(href);
          return (
            <Link
              href={href}
              className="nav-link"
              data-active={active}
              aria-current={active ? "page" : undefined}
              key={href}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
