const fs = require("node:fs");
const path = require("node:path");

const appConfigPath = path.join(__dirname, "..", "app.json");
const outputPath = path.join(__dirname, "..", "src", "generated", "buildInfo.ts");

const appConfig = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
const appVersion = appConfig?.expo?.version ?? "0.0.0";

const fileContent = `export const AppBuildInfo = {
  appVersion: ${JSON.stringify(appVersion)},
} as const;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existingFileContent = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;

if (existingFileContent !== fileContent) {
  fs.writeFileSync(outputPath, fileContent, "utf8");
}
