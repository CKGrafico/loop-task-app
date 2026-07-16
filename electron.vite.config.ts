import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    build: {
      sourcemap: false,
      rollupOptions: {
        external: [
          "electron",
          "electron-store",
          "@opencode-ai/sdk",
          /^node:/,
        ],
      },
    },
  },
  preload: {
    build: {
      sourcemap: false,
    },
  },
  renderer: {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "highlight": ["highlight.js"],
            "markdown": ["react-markdown", "rehype-highlight"],
            "react-vendor": ["react", "react-dom"],
            "intl": ["react-intl"],
          },
        },
      },
    },
  },
});
