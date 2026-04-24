import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Y CRM",
  description: "The Y Company — affärspipeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-ink-950 text-white antialiased min-h-screen bg-ink-glow">
        {children}
      </body>
    </html>
  );
}
