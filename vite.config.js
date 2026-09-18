import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { pcStoragePlugin } from "./vite-plugin-pc-storage.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), pcStoragePlugin()],
});
