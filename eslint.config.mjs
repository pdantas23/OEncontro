import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
  {
    rules: {
      // TypeScript — any proibido (CLAUDE.md §8)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      // Qualidade (CLAUDE.md §23)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",

      // React
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
    },
  },
]);

export default eslintConfig;
