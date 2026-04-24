import Link from "next/link";
import { auth } from "../../auth";

type Props = {
  currentTab: "pipeline" | "statistik";
};

export default async function TopNav({ currentTab }: Props) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  return (
    <header className="px-8 py-5 flex items-center justify-between gap-6 flex-wrap border-b border-white/[0.06]">
      <div className="font-harabara text-2xl md:text-3xl font-black">
        <span className="text-neon drop-shadow-[0_0_20px_rgba(222,255,0,0.6)]">
          The Y
        </span>{' '}
        <span className="text-white drop-shadow-[0_0_10px_rgba(245,244,244,0.3)]">
          CRM
        </span>
      </div>
      <nav className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
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
        {isAdmin && (
          <Link
            href="/admin"
            className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors text-white/50 hover:text-white/80"
          >
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
