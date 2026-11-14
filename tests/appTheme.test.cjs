const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

function environment({ system = "light", storage = new Map(), overrides = {} } = {}) {
  let forced = "auto";
  const appearanceListeners = new Set();
  const h = hooks();
  h.react.useSyncExternalStore = (subscribe, getSnapshot) => {
    const [snapshot, update] = h.react.useState(getSnapshot);
    h.react.useEffect(() => {
      const refresh = () => update(getSnapshot());
      const unsubscribe = subscribe(refresh);
      refresh();
      return unsubscribe;
    }, [subscribe, getSnapshot]);
    return snapshot;
  };
  const currentScheme = () => (forced === "auto" ? system : forced);
  const emit = () => {
    for (const listener of appearanceListeners) listener({ colorScheme: currentScheme() });
  };
  const load = modules({
    "src/lib/appTheme.ts": undefined,
    "src/hooks/useAppTheme.ts": undefined,
    "src/lib/appStorage.ts": {
      appStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    },
    react: h.react,
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "react-native": {
      Appearance: {
        getColorScheme: currentScheme,
        setColorScheme: (value) => {
          forced = value;
          emit();
        },
        addChangeListener: (listener) => {
          appearanceListeners.add(listener);
          return { remove: () => appearanceListeners.delete(listener) };
        },
      },
      StyleSheet: { create: (styles) => styles },
      View: "View",
    },
    ...overrides,
  });
  return {
    load,
    h,
    storage,
    theme: load("src/lib/appTheme.ts"),
    nativeListeners: appearanceListeners,
    get forced() {
      return forced;
    },
    changeSystem(next) {
      system = next;
      emit();
    },
  };
}

test("system mode is the default, invalid saved values fall back, and explicit choices survive restart", () => {
  const e = environment({ system: "dark" });
  const { storageKey } = e.load("src/constants/theme.ts").ThemeSettings;
  assert.equal(e.theme.getThemeMode(), "system");
  assert.equal(e.theme.getAppColorScheme(), "dark");
  e.theme.setThemeMode("light");
  assert.equal(e.storage.get(storageKey), "light");
  assert.equal(e.forced, "light");
  const restarted = environment({ storage: e.storage, system: "dark" });
  assert.equal(restarted.theme.getThemeMode(), "light");
  const stop = restarted.theme.observeSystemTheme();
  assert.equal(restarted.forced, "light");
  stop();
  e.storage.set(storageKey, "invalid");
  assert.equal(environment({ storage: e.storage }).theme.getThemeMode(), "system");
});

test("system changes apply only in system mode and returning to system uses the latest appearance", () => {
  const e = environment();
  const stop = e.theme.observeSystemTheme();
  e.changeSystem("dark");
  assert.equal(e.theme.getAppColorScheme(), "dark");
  e.theme.setThemeMode("light");
  e.changeSystem("dark");
  assert.equal(e.theme.getAppColorScheme(), "light");
  e.theme.setThemeMode("system");
  assert.equal(e.forced, "auto");
  assert.equal(e.theme.getAppColorScheme(), "dark");
  stop();
  assert.equal(e.nativeListeners.size, 0);
});

test("theme subscriptions update selections even when the resolved palette stays the same and release listeners", () => {
  const e = environment();
  let changes = 0;
  const unsubscribe = e.theme.subscribeAppTheme(() => {
    changes++;
  });
  const before = e.theme.getThemeSnapshot();
  e.theme.setThemeMode("light");
  assert.notEqual(e.theme.getThemeSnapshot(), before);
  assert.equal(e.theme.getAppColorScheme(), "light");
  assert.equal(changes, 1);
  unsubscribe();
  e.theme.setThemeMode("dark");
  assert.equal(changes, 1);
});

test("shared and derived styles use the current palette and reuse their identity when switching back", () => {
  const e = environment();
  const colors = e.load("src/constants/colors.ts");
  const styles = e.load("src/constants/uiStyles.ts");
  const light = styles.getGroupedSectionStyle();
  assert.equal(light.backgroundColor, colors.getAppColors().screenBackground);
  assert.equal(light.borderColor, colors.getAppColors().border);
  const lightChart = colors.getAppChartColors();
  const lightHeatmap = colors.getAppHeatmapColors();
  e.theme.setThemeMode("dark");
  const dark = styles.getGroupedSectionStyle();
  assert.notStrictEqual(light, dark);
  assert.equal(dark.backgroundColor, colors.getAppColors().screenBackground);
  assert.equal(dark.borderColor, colors.getAppColors().border);
  assert.notDeepEqual(colors.getAppChartColors(), lightChart);
  assert.notDeepEqual(colors.getAppHeatmapColors(), lightHeatmap);
  assert.strictEqual(styles.getGroupedSectionStyle(), dark);
  e.theme.setThemeMode("light");
  assert.strictEqual(styles.getGroupedSectionStyle(), light);
});

test("a mounted theme consumer updates colors while retaining its input state", () => {
  const e = environment();
  const { useAppTheme } = e.load("src/hooks/useAppTheme.ts");
  const styles = e.load("src/constants/uiStyles.ts");
  let setDraft;
  function Form() {
    const scheme = useAppTheme();
    const [draft, updateDraft] = e.h.react.useState("");
    setDraft = updateDraft;
    return { scheme, draft, style: styles.getFormInputTextStyle() };
  }
  e.h.render(Form);
  setDraft("입력 중인 내역");
  const light = e.h.render(Form);
  e.theme.setThemeMode("dark");
  const dark = e.h.render(Form);
  assert.equal(dark.draft, "입력 중인 내역");
  assert.equal(dark.scheme, "dark");
  assert.notEqual(light.style.color, dark.style.color);
  e.h.unmount();
});

test("iOS settings expose all three modes and update the native host without remounting", () => {
  const modifier = (value) => ({ value });
  const e = environment({
    overrides: {
      "@expo/ui/swift-ui": Object.fromEntries(
        ["Host", "List", "Picker", "RNHostView", "Section", "Text", "VStack"].map((name) => [
          name,
          name,
        ]),
      ),
      "@expo/ui/swift-ui/modifiers": new Proxy({}, { get: () => modifier }),
      "src/components/appSettings/CalendarHeatmapSetting.tsx": {
        CalendarHeatmapSetting: "Heatmap",
      },
      "src/contexts/ExpenseTextColorContext.tsx": {
        useExpenseTextColor: () => ({ mode: "default-text", updateMode: () => {} }),
      },
    },
  });
  const { AppSettingsScreen } = e.load("src/screens/AppSettingsScreen.ios.tsx");
  const props = { calendarSummaryMode: "selected-month", isPlusActive: false };
  const render = () => e.h.render(() => AppSettingsScreen(props));
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node?.props
        ? [node, ...nodes(node.props.children)]
        : [];
  const findSelector = (tree) =>
    nodes(tree).find((node) => node.type === "Picker" && node.props.label === "화면 모드");
  let tree = render();
  const selector = findSelector(tree);
  assert.deepEqual(
    Array.from(selector.props.children, (node) => node.props.children),
    ["시스템 설정 따르기", "라이트", "다크"],
  );
  selector.props.onSelectionChange("dark");
  tree = render();
  assert.equal(tree.props.colorScheme, "dark");
  assert.equal(findSelector(tree).props.selection, "dark");
  findSelector(tree).props.onSelectionChange("system");
  tree = render();
  assert.equal(tree.props.colorScheme, "light");
  assert.equal(findSelector(tree).props.selection, "system");
  e.h.unmount();
});

test("dark surfaces and filled buttons keep readable foreground contrast", () => {
  const e = environment();
  const { DarkColors: colors } = e.load("src/constants/colorPalettes.ts");
  const luminance = (hex) => {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((value) => Number.parseInt(value, 16) / 255);
    const linear = rgb.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  for (const background of [colors.screenBackground, colors.surface, colors.surfaceStrong]) {
    for (const foreground of [colors.text, colors.mutedText, colors.mutedStrongText]) {
      assert.ok((luminance(foreground) + 0.05) / (luminance(background) + 0.05) >= 4.5);
    }
  }
  assert.ok((luminance(colors.primary) + 0.05) / (luminance(colors.onPrimary) + 0.05) >= 4.5);
});

test("guest expense text follows appearance without a signed-in provider", () => {
  const e = environment({
    overrides: {
      react: {
        createContext: (value) => ({ value }),
        useContext: (context) => context.value,
        useSyncExternalStore: (_, getSnapshot) => getSnapshot(),
      },
    },
  });
  const { useExpenseTextColor } = e.load("src/contexts/ExpenseTextColorContext.tsx");
  const colors = e.load("src/constants/colors.ts");
  const light = useExpenseTextColor();
  e.theme.setThemeMode("dark");
  const dark = useExpenseTextColor();
  assert.equal(dark.textStyle.color, colors.getAppColors().text);
  assert.notEqual(light.textStyle.color, dark.textStyle.color);
});

test("navigation uses the same surfaces and foregrounds as the screen palette", () => {
  const e = environment({
    overrides: {
      "@react-navigation/native": {
        DefaultTheme: { dark: false, colors: {}, fonts: {} },
        DarkTheme: { dark: true, colors: {}, fonts: {} },
      },
    },
  });
  const { getAppNavigationTheme } = e.load("src/lib/navigationTheme.ts");
  const { getAppColors } = e.load("src/constants/colors.ts");
  const light = getAppNavigationTheme();
  e.theme.setThemeMode("dark");
  const dark = getAppNavigationTheme();
  assert.equal(dark.dark, true);
  assert.equal(dark.colors.background, getAppColors().screenBackground);
  assert.equal(dark.colors.card, getAppColors().surface);
  assert.equal(dark.colors.text, getAppColors().text);
  e.theme.setThemeMode("light");
  assert.strictEqual(getAppNavigationTheme(), light);
});
