import { defineConfig, perEnvironmentPlugin } from "vite";

import viteReact from "@vitejs/plugin-react";

import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import svgr from "vite-plugin-svgr";

const config = defineConfig({
  plugins: [
    perEnvironmentPlugin("visualizer", (environment) =>
      visualizer({
        filename: `dist/stats-${environment.name}.html`,
        title: `Bundle Stats — ${environment.name}`,
        gzipSize: true,
        brotliSize: true,
      }),
    ),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    contentCollections(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
      importProtection: {
        server: {
          specifiers: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    }),
    viteReact(),
    svgr(),
    devtools(),
  ],
  server: {
    host: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "mdx",
              test: /node_modules[\\/](safe-mdx|micromark|acorn|mdast|htmlparser2|linkedom|cssom|entities)/,
            },
            {
              name: "three",
              test: /node_modules[\\/](@react-three|three)/,
            },
          ],
        },
      },
    },
  },
});

export default config;
