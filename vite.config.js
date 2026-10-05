import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
    base: "/kaos-ar/",
  plugins: [react(), basicSsl()],
  server: { host: true },
});
