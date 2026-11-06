import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the export works at an IPFS gateway subpath or an ENS name.
// The export goes to the repository's dist/, which the publisher serves as committed.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 1500 },
});
