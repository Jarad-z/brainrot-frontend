"use client";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { AccountMenu } from "./AccountMenu";
import { Input } from "@/components/brand/input";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { TooltipProvider } from "@/components/brand/tooltip";
import type { User } from "@/lib/api/types";

interface ThreeColumnShellProps {
  user: User;
  children: React.ReactNode;
}

export function ThreeColumnShell({ user, children }: ThreeColumnShellProps) {
  return (
    <TooltipProvider>
      <div
        className="app-shell relative h-screen flex flex-col overflow-hidden"
        style={{
          /* Windows 7 default Harmony — deep navy at top, electric mid,
             soft cyan at the bottom. The strong vertical range is what
             makes Aero windows pop in front. Theme=y2k overrides this. */
          background:
            "linear-gradient(180deg, " +
            "#0d2746 0%, " +     /* near-black navy */
            "#143e6b 14%, " +    /* deep cobalt */
            "#1f5a96 30%, " +    /* mid blue */
            "#3a87c2 50%, " +    /* hero blue band */
            "#73b3df 68%, " +    /* sky */
            "#a8d4f0 85%, " +    /* light cyan */
            "#cfe9f7 100%)",     /* near-white horizon */
        }}
      >
        {/* The "sun" — a single bright off-center light source, just like
            the Win7 Harmony wallpaper. Bright core, broad halo. */}
        <div
          aria-hidden
          className="app-shell-bg-sun pointer-events-none absolute"
          style={{
            top: "32%",
            left: "62%",
            width: "780px",
            height: "780px",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, " +
              "rgba(255,255,255,0.85) 0%, " +
              "rgba(255,250,235,0.50) 8%, " +
              "rgba(220,235,250,0.32) 22%, " +
              "rgba(160,200,235,0.18) 40%, " +
              "transparent 65%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Aurora band — single broad sweep below the sun */}
        <div
          aria-hidden
          className="app-shell-bg-aurora pointer-events-none absolute inset-x-0"
          style={{
            top: "45%",
            height: "180px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(220,240,255,0.32) 50%, transparent 100%)",
            filter: "blur(28px)",
            mixBlendMode: "screen",
          }}
        />

        {/* A few subtle sparkles, much fewer than before */}
        <div
          aria-hidden
          className="app-shell-bg-stars pointer-events-none absolute inset-0 opacity-55"
          style={{
            background:
              "radial-gradient(1.2px 1.2px at 22% 18%, white, transparent)," +
              "radial-gradient(1px 1px at 78% 9%, white, transparent)," +
              "radial-gradient(1.2px 1.2px at 14% 62%, white, transparent)," +
              "radial-gradient(1px 1px at 88% 72%, white, transparent)," +
              "radial-gradient(1px 1px at 48% 88%, white, transparent)",
            mixBlendMode: "screen",
          }}
        />

        {/* Subtle film grain */}
        <div
          aria-hidden
          className="app-shell-bg-grain pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />

        <OfflineBanner />
        <div className="relative flex flex-1 min-h-0 gap-2 p-2" style={{ zIndex: 2 }}>
          {/* Sidebar — Aero glass island (under y2k: candy snow plastic).
              The inner <aside> already has .aero-glass, which our theme
              overrides for y2k. Don't double-stack a background here. */}
          <div className="shrink-0 flex flex-col">
            <Sidebar />
          </div>

          {/* Main glass island */}
          <div
            className="app-shell-main-island flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, " +
                "rgba(220,238,252,0.42) 0%, " +
                "rgba(190,220,245,0.32) 50%, " +
                "rgba(165,205,235,0.30) 100%)",
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
              border: "1px solid rgba(155,200,235,0.55)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.65)," +
                "inset 0 -1px 0 rgba(20,62,107,0.18)," +
                "inset 0 0 0 1px rgba(255,255,255,0.18)," +
                "0 2px 6px rgba(20,62,107,0.20)," +
                "0 22px 42px rgba(20,62,107,0.22)",
            }}
          >
            <header
              className="app-shell-titlebar h-11 px-3 flex items-center gap-3 shrink-0"
              style={{
                borderBottom: "1px solid rgba(155,200,235,0.40)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              {/* iMac window chrome — only visible under y2k theme */}
              <div className="imac-chrome">
                <div className="imac-lights">
                  <span className="imac-light red" aria-hidden />
                  <span className="imac-light yellow" aria-hidden />
                  <span className="imac-light green" aria-hidden />
                </div>
              </div>

              <Breadcrumb />
              <div className="flex-1" />
              <span className="imac-window-stamp imac-chrome">
                Mac OS · iMac G3 · 800 × 600
              </span>
              <Input
                placeholder="搜任务、消息、@agent..."
                disabled
                className="w-[240px] !rounded-full !bg-white/55 !border-white/60"
              />
              <NotificationBell />
              <AccountMenu user={user} />
            </header>
            <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
