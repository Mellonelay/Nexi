import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      // React 19 / modern hooks diagnostics are migration hardening signals.
      // Keep them visible without forcing broad behavior refactors into the
      // framework-upgrade slice; repair them incrementally with focused tests.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);
