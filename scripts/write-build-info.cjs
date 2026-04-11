const fs = require("node:fs");
const path = require("node:path");

const appConfigPath = path.join(__dirname, "..", "app.json");
const outputPath = path.join(__dirname, "..", "src", "generated", "buildInfo.ts");

const appConfig = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
const appVersion = appConfig?.expo?.version ?? "0.0.0";
const builtAt = new Date();

const buildParts = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
}).formatToParts(builtAt);

const getPart = (type) => buildParts.find((part) => part.type === type)?.value ?? "00";

const buildDate = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
const buildTime = `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
const buildId = `${getPart("year")}${getPart("month")}${getPart("day")}-${getPart("hour")}${getPart("minute")}${getPart("second")}`;
const builtAtLabel = `${buildDate} ${buildTime} KST`;

const fileContent = `export const AppBuildInfo = {
  appVersion: ${JSON.stringify(appVersion)},
  buildId: ${JSON.stringify(buildId)},
  builtAtIso: ${JSON.stringify(builtAt.toISOString())},
  builtAtLabel: ${JSON.stringify(builtAtLabel)},
} as const;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existingFileContent = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;

if (existingFileContent !== fileContent) {
  fs.writeFileSync(outputPath, fileContent, "utf8");
}
