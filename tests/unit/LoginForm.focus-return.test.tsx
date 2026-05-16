import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/auth", () => ({
  auth: { login: vi.fn() },
}));

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm focus return on 401", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears password and focuses email after 401", async () => {
    (auth.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ApiError(401, "Unauthorized"),
    );

    renderForm();

    const emailInput = screen.getByLabelText("邮箱") as HTMLInputElement;
    const passwordInput = screen.getByLabelText("密码") as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "qa@brainrot.local" } });
    fireEvent.change(passwordInput, { target: { value: "wrong-pass" } });
    fireEvent.click(screen.getByText("登录"));

    await waitFor(() => {
      expect(passwordInput.value).toBe("");
      expect(document.activeElement).toBe(emailInput);
    });
  });
});
