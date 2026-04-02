import { type Config } from "prettier";

const config: Config = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  tailwindStylesheet: "src/styles/globals.css",
  tailwindFunctions: ["cn", "twMerge", "tw", "clsx", "cva"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "^react",
    "^vite$",
    "^@vitejs/",
    "^@tanstack",
    "<THIRD_PARTY_MODULES>",
    "^@/(?!assets)",
    "^./",
    "^@material-symbols",
    ".css$",
    "^@/assets",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default config;
