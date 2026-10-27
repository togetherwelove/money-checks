const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

function setup() {
  const state = hooks(), requests = [], animations = [];
  const load = modules({
    react: state.react,
    'react-native': {
      AccessibilityInfo: { isReduceMotionEnabled: () => new Promise(resolve => requests.push(resolve)) },
      Easing: { cubic: 'cubic', out: value => value },
      Animated: {
        Value: class { constructor(value) { this.value = value; } },
        timing: (value, config) => {
          const animation = { config, started: false, stopped: false };
          animations.push(animation);
          return { start: () => { animation.started = true; value.value = config.toValue; }, stop: () => { animation.stopped = true; } };
        },
      },
    },
  });
  const { useClipboardExpansionAnimation } = load('src/hooks/useClipboardExpansionAnimation.ts');
  const { ClipboardPromptUi } = load('src/constants/cardSmsClipboard.ts');
  return { render: expanded => state.render(() => useClipboardExpansionAnimation(expanded)),
    unmount: state.unmount, requests, animations, duration: ClipboardPromptUi.animationDurationMs };
}

test('clipboard expansion honors reduced motion and stops native animation on teardown', async () => {
  const ui = setup();
  ui.render(true); ui.requests[0](false); await Promise.resolve();
  assert.equal(ui.animations[0].config.toValue, 1);
  assert.equal(ui.animations[0].config.duration, ui.duration);
  assert.equal(ui.animations[0].config.useNativeDriver, true);
  ui.render(false);
  assert.equal(ui.animations[0].stopped, true);
  ui.requests[1](true); await Promise.resolve();
  assert.equal(ui.animations[1].config.toValue, 0);
  assert.equal(ui.animations[1].config.duration, 0);
  ui.unmount(); assert.equal(ui.animations[1].stopped, true);
});

test('late accessibility results cannot restart a dismissed or unmounted prompt', async () => {
  const ui = setup();
  ui.render(true); ui.render(false);
  ui.requests[0](false); await Promise.resolve();
  assert.equal(ui.animations.length, 0);
  ui.unmount(); ui.requests[1](false); await Promise.resolve();
  assert.equal(ui.animations.length, 0);
});
