import type { Metadata } from "next";
// eslint-disable-next-line camelcase
import { Bricolage_Grotesque, JetBrains_Mono, Noto_Serif_SC } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serifCjk = Noto_Serif_SC({
  weight: ["700", "900"],
  variable: "--font-serif-cjk",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Brainrot",
  description: "协作 AI 工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh"
      className={`${display.variable} ${mono.variable} ${serifCjk.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
