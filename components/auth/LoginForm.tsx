"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { isValidEmail, isValidPassword } from "@/lib/validation";
import { messages } from "@/lib/messages";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!isValidEmail(email)) {
      setEmailError(messages.auth.invalidEmail);
      ok = false;
    }
    if (!isValidPassword(password)) {
      setPasswordError(messages.auth.shortPassword);
      ok = false;
    }
    return ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!validate()) return;
    setPending(true);
    setFormError(null);
    try {
      await auth.login(email, password);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      router.replace(searchParams.get("next") ?? "/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setFormError(messages.auth.loginFailed);
        else if (err.status >= 500) setFormError(messages.auth.serverError);
        else setFormError(err.body || messages.errors.genericRetry);
      } else {
        setFormError(messages.errors.genericRetry);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <ErrorBanner kind="inline" variant="error">
          {formError}
        </ErrorBanner>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={() => {
            if (email && !isValidEmail(email)) setEmailError(messages.auth.invalidEmail);
          }}
          aria-invalid={!!emailError}
          autoFocus
        />
        {emailError && <p className="text-xs text-state-failed">{emailError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          onBlur={() => {
            if (password && !isValidPassword(password))
              setPasswordError(messages.auth.shortPassword);
          }}
          aria-invalid={!!passwordError}
        />
        {passwordError && <p className="text-xs text-state-failed">{passwordError}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "登录中…" : messages.auth.loginCta}
      </Button>
      <p className="text-xs text-ink-2 text-center">
        还没有账号？
        <Link href="/register" className="underline">
          注册 →
        </Link>
      </p>
    </form>
  );
}
