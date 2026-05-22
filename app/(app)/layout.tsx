"use client";
import { useSession } from "@/hooks/useSession";
import { WSProvider } from "@/lib/ws/provider";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { ThreeColumnShell } from "@/components/nav/ThreeColumnShell";
import { DropZoneOverlay } from "@/components/upload/DropZoneOverlay";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isPending, data: user } = useSession();
  if (isPending) return <PageSkeleton />;
  if (!user) return null;
  return (
    <WorkspaceProvider>
      <WSProvider>
        <ThreeColumnShell user={user}>{children}</ThreeColumnShell>
        <DropZoneOverlay />
        <ThemeSwitcher />
      </WSProvider>
    </WorkspaceProvider>
  );
}
