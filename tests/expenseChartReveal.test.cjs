const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

function setup() {
  const state = hooks(),
    requests = [],
    animations = [];
  const listeners = new Set();
  const load = modules({
    react: state.react,
    "react-native": {
      AccessibilityInfo: {
        isReduceMotionEnabled: () =>
          new Promise((resolve, reject) => requests.push({ resolve, reject })),
        addEventListener: (_, listener) => {
          listeners.add(listener);
          return { remove: () => listeners.delete(listener) };
        },
      },
      Easing: { cubic: "cubic", inOut: (value) => value },
      Animated: {
        Value: class {
          constructor(value) {
            this.value = value;
          }
          setValue(value) {
            this.value = value;
          }
        },
        timing: (_, config) => {
          const animation = { config, started: false, stopped: false };
          animations.push(animation);
          return {
            start: () => {
              animation.started = true;
            },
            stop: () => {
              animation.stopped = true;
            },
          };
        },
      },
    },
  });
  const { useExpenseChartReveal } = load("src/hooks/useExpenseChartReveal.ts");
  return {
    render: (key = "november", active = true) =>
      state.render(() => useExpenseChartReveal(key, active)),
    unmount: state.unmount,
    requests,
    animations,
    listeners,
  };
}

test("only active pages draw; returning to the screen and changing months replay from day one", async () => {
  const ui = setup();
  const progress = ui.render("november", false);
  assert.equal(ui.requests.length, 0);
  ui.render();
  ui.requests[0].resolve(false);
  await Promise.resolve();
  assert.equal(ui.animations[0].started, true);
  assert.equal(ui.animations[0].config.toValue, 1);
  ui.render();
  assert.equal(ui.animations.length, 1);
  ui.render("november", false);
  assert.equal(ui.animations[0].stopped, true);
  assert.equal(progress.value, 0);
  ui.render();
  ui.requests[1].resolve(false);
  await Promise.resolve();
  assert.equal(ui.animations.length, 2);
  ui.render("december");
  assert.equal(ui.animations[1].stopped, true);
  ui.requests[2].resolve(false);
  await Promise.resolve();
  ui.unmount();
  assert.equal(ui.animations[2].stopped, true);
  assert.equal(ui.listeners.size, 0);
});

test("reduced motion immediately reveals the final curve, including settings changes during a pending check", async () => {
  const ui = setup();
  const progress = ui.render();
  ui.requests[0].resolve(true);
  await Promise.resolve();
  assert.equal(progress.value, 1);
  assert.equal(ui.animations.length, 0);
  ui.render("december");
  for (const listener of ui.listeners) listener(true);
  ui.requests[1].resolve(false);
  await Promise.resolve();
  assert.equal(progress.value, 1);
  assert.equal(ui.animations.length, 0);
  ui.unmount();
});

test("late accessibility checks cannot restart hidden or unmounted graphs", async () => {
  const ui = setup();
  ui.render();
  ui.render("november", false);
  ui.requests[0].resolve(false);
  await Promise.resolve();
  assert.equal(ui.animations.length, 0);
  ui.render();
  ui.unmount();
  ui.requests[1].resolve(false);
  await Promise.resolve();
  assert.equal(ui.animations.length, 0);
  assert.equal(ui.listeners.size, 0);
});

test("a failed accessibility check still draws and enabling reduced motion stops the running effect", async () => {
  const ui = setup();
  const progress = ui.render();
  ui.requests[0].reject(new Error("unavailable"));
  await Promise.resolve();
  assert.equal(ui.animations[0].started, true);
  for (const listener of ui.listeners) listener(true);
  assert.equal(ui.animations[0].stopped, true);
  assert.equal(progress.value, 1);
  ui.unmount();
});
