import { Card } from "@/components/brand/card";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-1 flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-0 page-title">
          Brainrot
        </h1>
      </header>
      <main className="w-full max-w-[420px]">
        <Card chunky className="p-8">
          {children}
        </Card>
      </main>
      <footer className="mt-8 text-xs text-ink-2">协作 AI 工作台 · v0.1</footer>
    </div>
  );
}
