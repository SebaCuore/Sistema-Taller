"use client";

export default function HistorialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 p-8 text-center">
      <p className="rounded-lg border-4 border-yellow-400 bg-black px-6 py-4 text-lg font-bold tracking-wide text-white uppercase">
        No se pudo cargar el historial
      </p>
      <p className="text-sm font-medium text-black/70">
        {error.message || "Intentá de nuevo."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
      >
        Reintentar
      </button>
    </div>
  );
}
