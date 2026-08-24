import type { Metadata } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Renato | Taller",
  description: "Renato — Gestión de ventas y catálogo del taller",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-black">
        <header className="sticky top-0 z-20 border-b-4 border-yellow-400 bg-black">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
            <div className="rounded-lg bg-white px-3 py-2 md:px-4 md:py-2.5">
              <Image
                src="/renato-logo.png"
                alt="Renato"
                width={1702}
                height={546}
                priority
                className="h-6 w-auto md:h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <DesktopNav />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col pb-20 md:pb-10">{children}</main>

        <MobileNav />
      </body>
    </html>
  );
}
