import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const environment = {
  ...process.env,
  APP_VARIANT: "development",
  EXPO_PUBLIC_APP_VARIANT: "development",
  EXPO_NO_DOTENV: "0",
};

const command = ["expo", "start", "--dev-client", ...process.argv.slice(2)];
const result = spawnSync(npxCommand, command, {
  cwd: projectRoot,
  env: environment,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
