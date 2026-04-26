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

    "^react$",
    "^react/",
    "^vite$",
    "^@vitejs/",
    "^@tanstack",

    "<THIRD_PARTY_MODULES>",

    "^@/components/primitives/",
    "^@/components/composites/",
    "^@/components/layout/",
    "^@/components/effects/",

    "^@/(?!components/)(?!assets/)",

    "^[.]{1,2}/",

    "^@material-symbols",

    "\\.css$",

    "^@/assets/",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default config;
