import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api → FastAPI so the SPA can call /api/v1/... without CORS during dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
