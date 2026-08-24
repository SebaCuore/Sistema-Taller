"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

function esPasswordValido(intento: string) {
  const esperada = process.env.AUTH_PASSWORD ?? "";
  const bufferIntento = Buffer.from(intento);
  const bufferEsperado = Buffer.from(esperada);

  if (bufferIntento.length !== bufferEsperado.length) {
    return false;
  }
  return timingSafeEqual(bufferIntento, bufferEsperado);
}

export async function login(password: string) {
  if (!esPasswordValido(password)) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    throw new Error("Contraseña incorrecta.");
  }

  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
