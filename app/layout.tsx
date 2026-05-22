import type { Metadata } from "next";
/* eslint-disable camelcase */
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Noto_Serif_SC,
  VT323,
  Press_Start_2P,
} from "next/font/google";
/* eslint-enable camelcase */
import { QueryProvider } from "@/providers/QueryProvider";
import { themeBootScript } from "@/hooks/useTheme";
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

/* Y2K theme fonts — VT323 (90s terminal pixel) + Press Start 2P (chunky
   8-bit display). Loaded for all themes (cost is one variable font each)
   but only used when [data-theme="y2k-imac"] is active. */
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-tiny",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brainrot",
  description: "协作 AI 工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh"
      className={`${display.variable} ${mono.variable} ${serifCjk.variable} ${vt323.variable} ${pressStart.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
