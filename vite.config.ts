import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as fs from "fs";

const httpsConfig =
  fs.existsSync("./server.key") && fs.existsSync("./server.crt")
    ? { key: fs.readFileSync("./server.key"), cert: fs.readFileSync("./server.crt") }
    : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsConfig,
    port: 5173,
  },
});
