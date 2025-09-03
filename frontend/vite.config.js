// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable access from external devices
    port: 5173,
    strictPort: true,
    allowedHosts: ["dev.test.datafuseai.io"], // For Dev we allow access from this host, For Prod we use reverse proxy nginx
  },
  preview: { port: 5173, strictPort: true },
});
