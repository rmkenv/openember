// vite-plugin-jurisdiction.js
// Runs build-config.js before Vite starts so src/config/jurisdiction.js is always fresh.

import { execSync } from "child_process"
import path from "path"

export default function jurisdictionConfigPlugin() {
  return {
    name: "vite-jurisdiction-config",
    buildStart() {
      try {
        execSync("node scripts/build-config.js", { stdio: "inherit" })
      } catch (e) {
        console.warn("⚠  Could not build jurisdiction config:", e.message)
      }
    },
  }
}
