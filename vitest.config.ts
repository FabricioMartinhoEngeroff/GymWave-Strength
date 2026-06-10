import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/data/**/*.ts",
        "src/utils/**/*.ts",
        "src/components/**/*.tsx",
        "src/hooks/**/*.ts",
      ],
      exclude: ["src/__tests__/**", "src/main.tsx", "src/styles/**"],
    },
  },
});
