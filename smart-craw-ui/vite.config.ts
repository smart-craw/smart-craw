/// <reference types="vite" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:8080",
        changeOrigin: true,
        ws: true,
        rewrite: (path: string) => path,
      },
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    //setupFiles: ["./src/tests/setup.ts"],
    //globals: true,
    coverage: {
      include: ["src"],
    },
  },
});
