"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { logout } from "./login/actions";

export function LogoutButton() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (pathname === "/login") return null;

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await logout(); })}
      disabled={pending}
      className="rounded-lg border-2 border-white/30 bg-transparent px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-white transition active:scale-[0.97] hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50"
    >
      {pending ? "..." : "Salir"}
    </button>
  );
}
