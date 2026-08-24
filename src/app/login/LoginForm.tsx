"use client";

import { useState, useTransition } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!password) {
      setErrorMsg("Ingresá la contraseña.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await login(password);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-4">
      <h1 className="text-center text-xl font-bold tracking-wide uppercase">Ingresar</h1>

      {errorMsg && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border-2 border-yellow-400 bg-black px-4 py-3 text-sm font-bold text-white"
        >
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-wide uppercase" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          className="rounded-lg border-2 border-black px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </div>
  );
}
