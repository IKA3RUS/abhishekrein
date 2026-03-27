import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import svgr from "vite-plugin-svgr";

const config = defineConfig({
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact(), svgr()],
  server: {
    host: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
});

export default config;
