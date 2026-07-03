// Browser-only dev server for the renderer (no Electron). window.api is absent,
// so the renderer falls back to the built-in mock adapter — used for UI preview
// and screenshots without launching the desktop shell.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
  },
});
