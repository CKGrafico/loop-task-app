// Browser-only dev server for the renderer (no Electron). window.api is absent,
// so the renderer falls back to the built-in mock adapter — used for UI preview
// and screenshots without launching the desktop shell.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: "src/renderer",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer/src"),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5183,
    strictPort: true,
  },
});
