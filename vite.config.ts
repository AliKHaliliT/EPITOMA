import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // GitHub Pages serves project sites under /<repo>/; the deploy workflow
  // sets this. Local dev and plain builds stay at "/".
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // A fixed, unique port in the ecosystem (VITA runs on 3000). Failing
    // loudly beats hopping ports: localStorage (documents, the imported
    // portfolio) is per-origin, so a silent port change looks like data loss.
    port: 3200,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // The stable vendor libraries split into their own cached chunk, so editing
        // content or app code no longer invalidates the bytes that never changed.
        manualChunks: {
          vendor: ["react", "react-dom", "framer-motion"],
        },
      },
    },
  },
});
