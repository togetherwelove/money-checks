const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function mount(reduceMotion = false) {
  const handlers = {}, animations = [], cleanups = [];
  let closed = 0;
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    stopAnimation(callback) { callback(this.value); }
    interpolate() { return this; }
  }
  const gesture = {};
  for (const method of ["runOnJS", "activeOffsetY", "onStart", "onUpdate", "onEnd", "onFinalize"]) {
    gesture[method] = (value) => { handlers[method] = value; return gesture; };
  }
  const mocks = {
    react: {
      useCallback: (callback) => callback, useMemo: (factory) => factory(),
      useRef: (current) => ({ current }), useState: (value) => [value, () => {}],
      useEffect: (effect) => cleanups.push(effect()),
    },
    "react-native": {
      Animated: { Value, add: (_, offset) => offset, timing: (value, config) => {
        const animation = {
          config, stopped: false, start(callback) { this.callback = callback; },
          stop() { this.stopped = true; this.callback?.({ finished: false }); },
          finish() { value.setValue(config.toValue); this.callback?.({ finished: true }); },
        };
        animations.push(animation);
        return animation;
      } },
      Easing: { in: (value) => value, out: (value) => value, cubic: "cubic" },
    },
    "react-native-gesture-handler": { Gesture: { Pan: () => gesture } },
    "react-native-reanimated": { useReducedMotion: () => reduceMotion },
  };
  function load(file) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(source, { exports, require: (name) => {
      if (name === "../constants/allEntries") return load("src/constants/allEntries.ts");
      if (name in mocks) return mocks[name];
      throw new Error(name);
    } });
    return exports;
  }
  const hook = load("src/hooks/useFilterSheetAnimation.ts").useFilterSheetAnimation(() => closed++, 800);
  hook.open();
  animations.at(-1).finish();
  return { hook, handlers, animations, cleanups, closed: () => closed };
}

test("short drag follows the finger, clamps upward movement, and returns without closing", () => {
  const { hook, handlers, animations, closed } = mount();
  handlers.onStart();
  handlers.onUpdate({ translationY: 35 });
  assert.equal(hook.sheetStyle.transform[0].translateY.value, 35);
  handlers.onUpdate({ translationY: -10 });
  assert.equal(hook.sheetStyle.transform[0].translateY.value, 0);
  handlers.onEnd({ translationY: 35, velocityY: 0 });
  animations.at(-1).finish();
  assert.equal(closed(), 0);
  assert.equal(hook.sheetStyle.transform[0].translateY.value, 0);
});

test("long drag or downward flick closes once, after animation finishes", () => {
  for (const event of [{ translationY: 120, velocityY: 0 }, { translationY: 20, velocityY: 900 }]) {
    const { hook, handlers, animations, closed } = mount();
    handlers.onStart(); handlers.onUpdate(event); handlers.onEnd(event);
    const count = animations.length;
    hook.close();
    assert.equal(animations.length, count);
    assert.equal(closed(), 0);
    animations.at(-1).finish();
    assert.equal(closed(), 1);
  }
});

test("cancelled gesture restores the sheet and unmount stops animations", () => {
  const { handlers, animations, cleanups, closed } = mount();
  handlers.onStart(); handlers.onUpdate({ translationY: 130 });
  handlers.onFinalize({}, false);
  animations.at(-1).finish();
  assert.equal(closed(), 0);
  cleanups.forEach((cleanup) => cleanup());
  assert.ok(animations.at(-1).stopped);
});

test("reduced motion disables timing and apply runs before the sheet closes", () => {
  const { hook, animations, closed } = mount(true);
  let applied = false;
  hook.close(() => { assert.equal(closed(), 0); applied = true; });
  assert.ok(animations.every(({ config }) => config.duration === 0));
  animations.at(-1).finish();
  assert.equal(applied, true);
  assert.equal(closed(), 1);
});
