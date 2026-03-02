import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
      provider: "playwright", // or 'webdriverio'
      enabled: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
      headless: true,
      viewport: { width: 1920, height: 1080 },
    },
  },
});
