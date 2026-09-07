import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react/") ||
              id.includes("react-dom/") ||
              id.includes("react-router/") ||
              id.includes("react-router-dom/")
            ) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            if (id.includes("react-icons") || id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("@reduxjs") || id.includes("react-redux")) {
              return "vendor-redux";
            }
            if (id.includes("@tanstack")) {
              return "vendor-query";
            }
            return "vendor-libs";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
