import { BrandMark } from "@/components/brand/brand-mark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-paper-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(at 18% 12%, var(--accent-wash) 0%, transparent 42%), radial-gradient(at 82% 88%, var(--accent-wash-2) 0%, transparent 38%)",
      }}
    >
      <header className="mb-10 flex flex-col items-center gap-4">
        <BrandMark logo="B" size={56} />
        <div className="text-center">
          <h1 className="text-[28px] font-semibold tracking-tight text-ink-0 m-0 hero-title">
            Brainrot
          </h1>
          <p className="mt-1.5 text-sm text-ink-2 m-0">
            协作 AI 工作台
          </p>
        </div>
      </header>
      <main className="w-full max-w-[420px] relative">
        <div className="bg-paper-0 border border-hairline rounded-2xl p-8 shadow-[var(--shadow-2)]">
          {children}
        </div>
      </main>
      <footer className="mt-8 text-xs text-ink-3">v0.1</footer>
    </div>
  );
}
