import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // يسمح بفتح خادم التطوير عبر نفق مؤقت (اختبار من الهاتف)
    allowedHosts: [".trycloudflare.com"],
  },
});
