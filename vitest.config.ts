import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: [
        "lib/**/*.d.ts",
        // pure type-only files — no runtime statements to cover
        "lib/api/types.ts",
        // thin apiFetch wrappers — covered indirectly via client.test.ts; unit-testing
        // these would just re-test the fetch mock, not business logic
        "lib/api/auth.ts",
        "lib/api/projects.ts",
        "lib/api/tasks.ts",
        "lib/api/task.ts",
        // WebSocket provider — React-Context-only; exercised via component renders in S2
        "lib/ws/provider.tsx",
        // constant object — no branches or functions to exercise
        "lib/messages.ts",
        // shadcn cn() wrapper — 1-line utility, covered by component renders in S2
        "lib/utils.ts",
      ],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
