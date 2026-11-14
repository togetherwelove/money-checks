const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");

function resolveKey(env) {
  function evaluate(file, imports = {}) {
    const exports = {};
    const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    vm.runInNewContext(outputText, { exports, process: { env }, require: (name) => imports[name] });
    return exports;
  }
  return evaluate("src/lib/subscription/revenueCatApiKey.ts", {
    "../../constants/subscription": evaluate("src/constants/subscription.ts"),
  }).getRevenueCatPublicApiKey();
}

const storeEnv = {
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: "appl_fixture",
  EXPO_PUBLIC_REVENUECAT_API_KEY: "appl_fallback",
  EXPO_PUBLIC_REVENUECAT_TEST_API_KEY: "test_fixture",
};

test("development selects only Test Store and never falls back to Apple products", () => {
  const env = { ...storeEnv, EXPO_PUBLIC_APP_VARIANT: "development" };
  assert.equal(resolveKey(env), "test_fixture");
  assert.equal(resolveKey({ ...env, EXPO_PUBLIC_REVENUECAT_TEST_API_KEY: "" }), "");
  assert.throws(
    () => resolveKey({ ...env, EXPO_PUBLIC_REVENUECAT_TEST_API_KEY: "appl_wrong" }),
    /requires a test_/,
  );
});

test("production and an unspecified variant retain Apple keys even with Test Store configured", () => {
  assert.equal(resolveKey(storeEnv), "appl_fixture");
  assert.equal(resolveKey({ ...storeEnv, EXPO_PUBLIC_APP_VARIANT: "production" }), "appl_fixture");
  assert.equal(
    resolveKey({ ...storeEnv, EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: "" }),
    "appl_fallback",
  );
});

test("production rejects a test key in either Apple key variable", () => {
  assert.throws(
    () => resolveKey({ ...storeEnv, EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: "test_wrong" }),
    /production app/,
  );
  assert.throws(
    () => resolveKey({ EXPO_PUBLIC_REVENUECAT_API_KEY: "test_wrong" }),
    /production app/,
  );
});
