const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const exportsObject = {};
const source = fs.readFileSync(path.join(__dirname, "../src/constants/typography.ts"), "utf8");
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: exportsObject },
);

module.exports = exportsObject;
