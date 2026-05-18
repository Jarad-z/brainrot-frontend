import { use } from "react";
import { ApprovalsHubPage } from "@/components/approvals/ApprovalsHubPage";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function Page({ params }: PageProps) {
  const { wsId } = use(params);
  return <ApprovalsHubPage wsId={wsId} />;
}
