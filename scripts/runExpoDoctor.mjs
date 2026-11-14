import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const variant = process.argv[2] === "development" ? "development" : "production";
const easConfig = JSON.parse(readFileSync(path.join(projectRoot, "eas.json"), "utf8"));
const environment = {
  ...process.env,
  ...easConfig.build.base.env,
  APP_VARIANT: variant,
  EXPO_PUBLIC_APP_VARIANT: variant,
  EXPO_NO_DOTENV: "1",
};
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["-y", "expo-doctor"], {
  cwd: projectRoot,
  env: environment,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
