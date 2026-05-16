"use client";

import { useSession } from "@/hooks/useSession";
import { WSProvider } from "@/lib/ws/provider";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ThreeColumnShell } from "@/components/nav/ThreeColumnShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isPending, data: user } = useSession();
  if (isPending) return <PageSkeleton />;
  if (!user) return null;
  return (
    <WSProvider>
      <ThreeColumnShell user={user}>{children}</ThreeColumnShell>
    </WSProvider>
  );
}
