"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import { isValidUuid } from "@/lib/validation";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";

export default function OnboardingPage() {
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);

  const [wsId, setWsId] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    if (!isValidUuid(wsId)) {
      setFieldError(messages.workspace.onboardingInvalidUuid);
      return;
    }
    setFieldError(null);
    setPending(true);
    try {
      await projectsApi.list(wsId);
      if (remember) localStorage.setItem("brainrot.lastWsId", wsId);
      setSelection({ wsId });
      router.replace(`/w/${wsId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setFormError(messages.workspace.notMember);
        else if (err.status === 404) setFormError(messages.workspace.notFound);
        else setFormError(`${err.status} ${err.body}`);
      } else {
        setFormError(messages.errors.genericRetry);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card className="p-8 bg-paper-0 border-hairline shadow-1">
        <h1 className="text-xl font-display font-bold mb-2 text-ink-0">
          {messages.workspace.onboardingTitle}
        </h1>
        <p className="text-sm text-ink-2 mb-6">{messages.workspace.onboardingHelp}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <ErrorBanner kind="inline" variant="error">
              {formError}
            </ErrorBanner>
          )}
          <div className="space-y-1">
            <Label htmlFor="wsId">工作区 ID</Label>
            <Input
              id="wsId"
              value={wsId}
              onChange={(e) => {
                setWsId(e.target.value);
                setFieldError(null);
              }}
              placeholder="00000000-0000-0000-0000-000000000000"
              autoFocus
              aria-invalid={!!fieldError}
            />
            {fieldError && <p className="text-xs text-state-failed">{fieldError}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-1">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4"
            />
            {messages.workspace.onboardingRemember}
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "进入中…" : messages.workspace.onboardingCta}
          </Button>
        </form>
      </Card>
    </div>
  );
}
