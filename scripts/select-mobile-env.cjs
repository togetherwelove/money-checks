const fs = require("node:fs");
const path = require("node:path");

const ENV_TARGETS = {
  development: ".env.development",
  test: ".env.test",
};

const [, , targetName] = process.argv;

if (!targetName || !ENV_TARGETS[targetName]) {
  console.error("Usage: node scripts/select-mobile-env.cjs <development|test>");
  process.exit(1);
}

const mobileDir = path.join(__dirname, "..", "apps", "mobile");
const sourcePath = path.join(mobileDir, ENV_TARGETS[targetName]);
const destinationPath = path.join(mobileDir, ".env");

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing environment file: ${sourcePath}`);
  console.error(`Create it from ${sourcePath}.example before running this script.`);
  process.exit(1);
}

fs.copyFileSync(sourcePath, destinationPath);

console.log(`Selected mobile environment: ${targetName}`);
console.log(`Copied ${path.basename(sourcePath)} -> .env`);
