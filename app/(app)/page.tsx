"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/common/PageSkeleton";

export default function AppEntry() {
  const router = useRouter();
  useEffect(() => {
    const last = localStorage.getItem("brainrot.lastWsId");
    router.replace(last ? `/w/${last}` : "/onboarding");
  }, [router]);
  return <PageSkeleton />;
}
