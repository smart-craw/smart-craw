// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    publicDir: "test/public", // only applies here, overrides the merged-in value if any
    test: {
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }],
      },
      coverage: {
        include: ["src"],
      },
    },
  }),
);
