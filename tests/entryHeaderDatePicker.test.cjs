const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });
const flatten = (node) =>
  Array.isArray(node)
    ? node.flatMap(flatten)
    : node?.props
      ? [node, ...flatten(node.props.children)]
      : [];

for (const platform of ["ios", "android"]) {
  test(`${platform} header uses a native date picker, preserves the local date and locks changes`, () => {
    const state = hooks();
    const changes = [];
    const load = modules({
      react: state.react,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        View: "View",
        Pressable: "Trigger",
        Text: "Text",
        Keyboard: { dismiss() {} },
        StyleSheet: { create: (x) => x },
      },
      "@react-native-community/datetimepicker": { __esModule: true, default: "Dialog" },
      "@expo/ui/swift-ui": { Host: "Host", DatePicker: "DatePicker" },
      "@expo/ui/swift-ui/modifiers": Object.fromEntries(
        ["accessibilityLabel", "datePickerStyle", "disabled", "labelsHidden", "font", "tint"].map(
          (name) => [name, (value) => ({ name, value })],
        ),
      ),
    });
    const { EntryHeaderDatePicker } = load(
      `src/components/entryComposer/EntryHeaderDatePicker${platform === "ios" ? ".ios" : ""}.tsx`,
    );
    const props = {
      selectedDate: "2026-11-09",
      onSelectDate: (date) => changes.push(date),
      disabled: false,
      variant: "navigation",
    };
    const render = () => flatten(state.render(() => EntryHeaderDatePicker(props)));
    if (platform === "ios") {
      const picker = render().find((n) => n.type === "DatePicker");
      assert.ok(
        picker.props.modifiers.some((m) => m.name === "datePickerStyle" && m.value === "compact"),
      );
      picker.props.onDateChange(new Date(2026, 10, 12));
      assert.deepEqual(changes, ["2026-11-12"]);
      props.disabled = true;
      const locked = render().find((n) => n.type === "DatePicker");
      assert.ok(locked.props.modifiers.some((m) => m.name === "disabled" && m.value));
      locked.props.onDateChange(new Date(2026, 10, 13));
    } else {
      render()
        .find((n) => n.type === "Trigger")
        .props.onPress();
      render()
        .find((n) => n.type === "Dialog")
        .props.onChange({ type: "dismissed" }, new Date(2026, 10, 10));
      assert.equal(changes.length, 0);
      render()
        .find((n) => n.type === "Trigger")
        .props.onPress();
      render()
        .find((n) => n.type === "Dialog")
        .props.onChange({ type: "set" }, new Date(2026, 10, 12));
      assert.equal(
        render().some((n) => n.type === "Dialog"),
        false,
      );
      props.disabled = true;
      render()
        .find((n) => n.type === "Trigger")
        .props.onPress();
      assert.equal(
        render().some((n) => n.type === "Dialog"),
        false,
      );
    }
    assert.deepEqual(changes, ["2026-11-12"]);
  });
}
