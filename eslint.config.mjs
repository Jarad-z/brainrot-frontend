import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "eslint-config-next";

export default [
  {
    ignores: ["node_modules/", ".next/", "ui_design/", "_design_pkg/", "coverage/", "eslint.config.mjs", "next.config.ts", "postcss.config.mjs", "tailwind.config.ts", "**/*.css"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "camelcase": ["error", { properties: "never", ignoreDestructuring: true }]
    },
  },
];
