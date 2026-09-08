/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { iwsdkDev } from "@iwsdk/vite-plugin-dev";

import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Emulator device/activation now lives in `iwsdk.config.json` (`dev.emulator`);
    // passing them here throws since IWSDK 0.5.
    iwsdkDev({
      // Replit terminates TLS at its proxy and forwards plain HTTP to port 5000,
      // so the origin must stay HTTP. IWSDK otherwise self-signs a certificate.
      https: false,
      verbose: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    open: false,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
    rollupOptions: { input: "./index.html" },
  },
  esbuild: { target: "esnext" },
  // @drawcall/uikitml otherwise pulls a second three/@pmndrs/uikit graph
  // (three@0.185 vs app super-three@0.181). Duplicate Component classes break
  // instanceof checks → "Only pmndrs/uikit components can be added as children".
  resolve: {
    dedupe: [
      "three",
      "@pmndrs/uikit",
      "@pmndrs/uikit-horizon",
      "@pmndrs/uikit-lucide",
    ],
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
    include: [
      "@pmndrs/uikit",
      "@pmndrs/uikit-horizon",
      "@pmndrs/uikit-lucide",
      "@drawcall/uikitml",
    ],
    esbuildOptions: { target: "esnext" },
  },
  publicDir: "public",
  base: process.env.VITE_BASE_PATH || "/",
});
