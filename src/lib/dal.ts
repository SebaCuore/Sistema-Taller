import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, COOKIE_NAME } from "./session";

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get(COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login");
  }

  return session;
});
