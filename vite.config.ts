import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    minify: true,
  },
  plugins: [
    react(),
    monkey({
      entry: "src/userscript.tsx",
      userscript: {
        // namespace: "https://github.com/sqzw-x",
        match: ["https://*/*", "http://*/*"],
      },
      build: {
        externalGlobals: {},
      },
      server: {
        mountGmApi: false,
      },
    }),
  ],
});
