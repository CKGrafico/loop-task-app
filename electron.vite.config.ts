import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

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
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "index.cjs",
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src/renderer/src"),
      },
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "highlight": ["highlight.js"],
            "markdown": ["react-markdown", "rehype-highlight"],
            "react-vendor": ["react", "react-dom"],
            "intl": ["react-intl"],
            "radix-ui": [
              /@radix-ui\/react-/,
              "class-variance-authority",
              "clsx",
              "tailwind-merge",
            ],
          },
        },
      },
    },
  },
});
