"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Vehículos es la pantalla principal: va primero y vive en "/".
const LINKS = [
  { href: "/", label: "Vehículos" },
  { href: "/venta", label: "Ventas" },
  { href: "/historial", label: "Historial" },
  { href: "/productos", label: "Productos" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav className="hidden gap-2 md:flex">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg border-2 px-6 py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
              active
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-white/30 bg-transparent text-white hover:border-yellow-400 hover:text-yellow-400"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t-4 border-yellow-400 bg-black md:hidden">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-center py-3.5 text-sm font-bold tracking-wide uppercase active:scale-[0.97] ${
              active ? "bg-yellow-400 text-black" : "text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
