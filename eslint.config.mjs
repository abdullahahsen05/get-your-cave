import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Project uses <img> for user-uploaded images intentionally.
      "@next/next/no-img-element": "off",
      // App Router doesn't use pages/_document.js — this rule is a false positive.
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
