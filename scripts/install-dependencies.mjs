import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (readExecutionProfile() === "managed-linux") {
  run("bash", ["scripts/install-pnpm.sh", ...process.argv.slice(2)]);
} else {
  if (process.argv.length > 2) throw new Error("Portable installation takes no arguments.");
  // Corepack reads packageManager from package.json and honors its exact pin.
  const require = createRequire(import.meta.url);
  const { realpathSync } = await import("node:fs");
  const corepack = process.env.SITES_COREPACK_BIN || "corepack";
  const version = spawnSync(corepack, ["pnpm", "--version"], { cwd: root, encoding: "utf8" });
  if (version.error) throw version.error;
  const expected = require("../package.json").packageManager.split("@")[1];
  if (version.status !== 0 || version.stdout.trim() !== expected) {
    process.stderr.write(version.stderr || "");
    throw new Error(`Installation requires Corepack with pnpm ${expected}.`);
  }
  run(corepack, ["pnpm", "install", "--frozen-lockfile", "--prod=false", "--prefer-offline"], {
    env: { ...process.env, CI: "true" },
  });
  realpathSync(new URL("../node_modules/vinext/dist/cli.js", import.meta.url));
}
