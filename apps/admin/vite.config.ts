// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";

const adminOutputDir = process.env.NEXI_ADMIN_OUTPUT_DIR ?? "./.output";

export default defineConfig({
  plugins: [
    sentryTanstackStart({
      org: "mellonelay",
      project: "nexi",
      telemetry: false,
      autoInstrumentMiddleware: false,
      release: {
        name: process.env.VITE_SENTRY_RELEASE,
        create: false,
        finalize: false,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: [`${adminOutputDir}/public/**/*.map`],
      },
    }),
  ],
  nitro: {
    preset: "node-server",
    output: { dir: adminOutputDir },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      sourcemap: "hidden",
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
  },
});
