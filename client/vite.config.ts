import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "bpmn-font": path.resolve(__dirname, "node_modules/bpmn-font/dist"),
    },
  },
  assetsInclude: ["**/*.woff", "**/*.ttf"],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
