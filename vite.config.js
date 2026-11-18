import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep the heavy 3D code in its own file so the page shell loads fast.
        manualChunks: {
          three: ["three", "@react-three/fiber"],
        },
      },
    },
  },
});
