const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function loadAdConfig(androidAppId) {
  const env = { EXPO_PUBLIC_ADMOB_IOS_APP_ID: 'ca-app-pub-1234567890123456~1234567890' };
  if (androidAppId !== undefined) env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID = androidAppId;
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../app.config.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, __dirname: path.resolve(__dirname, '..'), process: { env },
    require: name => {
      if (name === 'node:path') return path;
      if (name === 'node:fs') return { existsSync: () => true, readFileSync: () => '{"version":"1.0.0"}' };
      if (name === '@expo/env') return { loadProjectEnv() {} };
      if (name === './app-brand.json') return {};
      if (name === './eas-project.json') return { projectId: 'test' };
      throw Error(`Unexpected config dependency: ${name}`);
    },
  });
  return exports.default.plugins.find(plugin => Array.isArray(plugin)
    && plugin[0] === 'react-native-google-mobile-ads')[1];
}

test('local Expo config always passes the Android test App ID to the AdMob plugin', () => {
  const config = loadAdConfig();
  assert.equal(config.androidAppId, 'ca-app-pub-3940256099942544~3347511713');
  assert.equal(config.iosAppId, 'ca-app-pub-1234567890123456~1234567890');
});

test('configured Android App ID overrides the development default and invalid IDs fail early', () => {
  const appId = 'ca-app-pub-1234567890123456~0987654321';
  assert.equal(loadAdConfig(appId).androidAppId, appId);
  assert.throws(() => loadAdConfig('invalid'), /EXPO_PUBLIC_ADMOB_ANDROID_APP_ID/);
});
