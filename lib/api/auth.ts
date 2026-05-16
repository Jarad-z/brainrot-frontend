import { apiFetch } from "./client";
import type { User } from "./types";

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<void>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, name: string, password: string) =>
    apiFetch<User>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    }),
  logout: () => apiFetch<void>("/api/v1/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/api/v1/me"),
};
