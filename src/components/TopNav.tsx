"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import MobileNav from "./MobileNav";

type Props = {
  currentTab: "pipeline" | "statistik" | "foretag" | "kontakter" | "projekt";
  isAdmin?: boolean;
};

export default function TopNav({ currentTab, isAdmin }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="px-4 md:px-8 py-5 flex items-center justify-between gap-4 md:gap-6 border-b border-white/[0.06]">
        {/* Logo - kompaktare på mobil */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="y-brand w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-base md:text-lg lg:text-xl">
            Y
          </span>
          <h1 className="font-harabara text-xl md:text-2xl lg:text-3xl font-black">
            <span className="text-neon drop-shadow-[0_0_20px_rgba(222,255,0,0.6)]">
              The Y
            </span>{" "}
            <span className="text-white drop-shadow-[0_0_10px_rgba(245,244,244,0.3)]">
              CRM
            </span>
          </h1>
        </div>

        {/* Desktop nav - dölj på mobil */}
        <nav className="hidden md:flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
          <Link
            href="/"
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === "pipeline"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Pipeline
          </Link>
          <Link
            href="/statistik"
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === "statistik"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Statistik
          </Link>
          <Link
            href="/foretag"
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === "foretag"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Företag
          </Link>
          <Link
            href="/kontakter"
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === "kontakter"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Kontakter
          </Link>
          <Link
            href="/projekt"
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === "projekt"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Projekt
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors text-white/50 hover:text-white/80"
            >
              Admin
            </Link>
          )}
          <LogoutButton />
        </nav>

        {/* Hamburger (endast mobil) */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center touch-target"
          aria-label="Öppna meny"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <MobileNav
          currentTab={currentTab}
          isAdmin={isAdmin}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
