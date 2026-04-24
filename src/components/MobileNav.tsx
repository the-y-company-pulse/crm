"use client";

import Link from "next/link";

type Props = {
  currentTab: string;
  isAdmin?: boolean;
  onClose: () => void;
};

export default function MobileNav({ currentTab, isAdmin, onClose }: Props) {
  const isActive = (tab: string) => currentTab === tab;

  return (
    <div className="mobile-nav-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="self-end text-white/60 hover:text-white text-4xl mb-8 -mr-2"
          aria-label="Stäng meny"
        >
          ×
        </button>

        <nav className="flex flex-col gap-4">
          <Link
            href="/"
            onClick={onClose}
            className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
              isActive("pipeline")
                ? "bg-neon text-ink-950"
                : "text-white/70 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Pipeline
          </Link>

          <Link
            href="/foretag"
            onClick={onClose}
            className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
              isActive("foretag")
                ? "bg-neon text-ink-950"
                : "text-white/70 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Företag
          </Link>

          <Link
            href="/kontakter"
            onClick={onClose}
            className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
              isActive("kontakter")
                ? "bg-neon text-ink-950"
                : "text-white/70 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Kontakter
          </Link>

          <Link
            href="/projekt"
            onClick={onClose}
            className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
              isActive("projekt")
                ? "bg-neon text-ink-950"
                : "text-white/70 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Projekt
          </Link>

          <Link
            href="/statistik"
            onClick={onClose}
            className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
              isActive("statistik")
                ? "bg-neon text-ink-950"
                : "text-white/70 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Statistik
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className={`px-5 py-3 text-lg font-medium rounded-md transition-colors ${
                isActive("admin")
                  ? "bg-neon text-ink-950"
                  : "text-white/70 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
