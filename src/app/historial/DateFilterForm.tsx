"use client";

import { useRouter } from "next/navigation";

export function DateFilterForm({ fecha }: { fecha: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      defaultValue={fecha}
      onChange={(e) => router.push(`/historial?fecha=${e.target.value}`)}
      className="w-full rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none sm:w-56"
    />
  );
}
