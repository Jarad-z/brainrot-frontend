import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: ["lib/**/*.d.ts", "lib/api/messages.ts"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
