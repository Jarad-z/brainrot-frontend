"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/brand/button";
import { Input } from "@/components/brand/input";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { isValidEmail, isValidPassword } from "@/lib/validation";
import { messages } from "@/lib/messages";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!name.trim()) {
      setNameError("请填写姓名");
      ok = false;
    }
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
      await auth.register(email, name, password);
      await auth.login(email, password);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me.self() });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setFormError(messages.auth.registerConflict);
          setPassword("");
          emailRef.current?.focus();
          emailRef.current?.select();
        } else if (err.status >= 500) setFormError(messages.auth.serverError);
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
        <label htmlFor="name" className="text-xs font-bold text-ink-1">
          姓名
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          aria-invalid={!!nameError}
          autoFocus
        />
        {nameError && <p className="text-xs text-state-failed">{nameError}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-bold text-ink-1">
          邮箱
        </label>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={() => {
            if (email && !isValidEmail(email))
              setEmailError(messages.auth.invalidEmail);
          }}
          aria-invalid={!!emailError}
        />
        {emailError && <p className="text-xs text-state-failed">{emailError}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-bold text-ink-1">
          密码
        </label>
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
        {passwordError && (
          <p className="text-xs text-state-failed">{passwordError}</p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "注册中…" : messages.auth.registerCta}
      </Button>
      <p className="text-xs text-ink-2 text-center">
        已有账号？
        <Link href="/login" className="underline ml-1">
          登录 →
        </Link>
      </p>
    </form>
  );
}
