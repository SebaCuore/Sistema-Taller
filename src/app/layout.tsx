import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "./NavLinks";

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
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded bg-yellow-400 text-lg font-black text-black md:h-11 md:w-11 md:text-xl">
                R
              </span>
              <span className="text-lg font-bold tracking-wide text-white md:text-xl">
                RENATO
              </span>
            </div>
            <DesktopNav />
          </div>
        </header>

        <main className="flex flex-1 flex-col pb-20 md:pb-10">{children}</main>

        <MobileNav />
      </body>
    </html>
  );
}
