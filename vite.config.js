import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { pcStoragePlugin } from "./vite-plugin-pc-storage.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), pcStoragePlugin()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('highlight.js')) {
              return 'vendor-highlight';
            }
            if (
              id.includes('@codemirror') ||
              id.includes('@uiw/react-codemirror') ||
              id.includes('codemirror')
            ) {
              return 'vendor-codemirror';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('rehype') ||
              id.includes('unified') ||
              id.includes('micromark') ||
              id.includes('mdast')
            ) {
              return 'vendor-markdown';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
