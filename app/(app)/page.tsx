"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { PageSkeleton } from "@/components/common/PageSkeleton";

export default function AppEntry() {
  const router = useRouter();
  const { data: wsList, isLoading } = useWorkspaces();

  useEffect(() => {
    if (isLoading || !wsList) return;
    if (wsList.length === 0) {
      router.replace("/onboarding");
      return;
    }
    let target: string = wsList[0]!.id;
    try {
      const stored = localStorage.getItem("brainrot.lastWsId");
      if (stored && wsList.some((w) => w.id === stored)) target = stored;
    } catch {
      // localStorage unavailable; fall through to wsList[0]
    }
    router.replace(`/w/${target}`);
  }, [isLoading, wsList, router]);

  return <PageSkeleton />;
}
