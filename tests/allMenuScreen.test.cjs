const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node?.props
      ? [node, ...nodes(node.props.children)]
      : [];

function loader(react, extra = {}) {
  const overrides = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Keyboard: { dismiss() {} },
      Linking: {},
      Text: "Text",
      View: "View",
      StyleSheet: { create: (value) => value },
    },
    "@expo/ui/swift-ui/modifiers": { tint: (value) => ({ name: "tint", value }) },
    "@expo/ui/swift-ui": Object.fromEntries(
      ["Host", "List", "Section", "Text", "VStack", "RNHostView", "Button", "Toggle"].map(
        (name) => [name, name],
      ),
    ),
    "src/constants/nativeSettingsGroupStyles.ios.ts": {
      getNativeSettingsGroupStyles: () => ({ row: [], title: [], description: [] }),
    },
    "src/constants/nativeSettingsStyles.ts": {
      getNativeSettingsStyles: () => ({
        list: [],
        row: [],
        sectionTitle: [],
        title: [],
        description: [],
      }),
    },
    "src/components/KeyboardAwareScrollView.tsx": { KeyboardAwareScrollView: "Scroll" },
    "src/components/AppFooterContentInset.tsx": { AppFooterContentInset: "Inset" },
    "src/components/AppVersionFooter.tsx": { AppVersionFooter: "Footer" },
    "src/components/appSettings/MenuSubscriptionCard.tsx": {
      MenuSubscriptionCard: "SubscriptionCard",
    },
    "src/components/appSettings/SettingsCategoryOrderModal.tsx": {
      SettingsCategoryOrderModal: "Categories",
    },
    "src/components/appSettings/SettingsMenuLinks.tsx": { SettingsMenuLinks: "Links" },
    "src/components/appSettings/SettingsActionRow.tsx": { SettingsActionRow: "Row" },
    "src/components/accountScreen/NotificationSettingsCard.tsx": {
      NotificationSettingsCard: "Notifications",
    },
    "src/components/accountScreen/NotificationThresholdField.tsx": {
      NotificationThresholdField: "Threshold",
    },
    ...extra,
  };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] === undefined) delete overrides[key];
  }
  return modules(overrides);
}

for (const suffix of ["", ".ios"]) {
  test(`all menu ${suffix || "shared"} opens categories for the current book and delegates other actions`, () => {
    const h = hooks(),
      selected = [],
      load = loader(h.react);
    const { AllMenuScreen } = load(`src/screens/AllMenuScreen${suffix}.tsx`);
    const { buildAllMenuSections } = load("src/lib/menuItems.ts");
    const props = {
      isPlusActive: false,
      activeBookId: "a",
      canManageCategories: true,
      menuSections: buildAllMenuSections({
        canManageCategories: true,
        activeBookName: "A",
        showAnnualReportDownload: true,
      }),
      onSelectMenuItem: (item) => selected.push(item),
    };
    const items = props.menuSections.flatMap((section) => section.items);
    const category = items.find((item) => item.action === "manage-categories");
    const account = items.find((item) => item.targetScreen === "account");
    const download = items.find((item) => item.action === "annual-report-download");
    const render = () => nodes(h.render(() => AllMenuScreen(props)));
    const card = render().find((node) => node.type === "SubscriptionCard");
    assert.equal(card.props.isPlusActive, false);
    const visible = render();
    assert.ok(
      visible.findIndex((node) => node.type === "SubscriptionCard") <
        visible.findIndex((node) => node.type === "Links"),
    );
    card.props.onPress();
    assert.equal(selected.pop().targetScreen, "subscription");
    assert.equal(
      items.some((item) => item.targetScreen === "subscription"),
      false,
    );
    props.isPlusActive = true;
    assert.equal(
      render().find((node) => node.type === "SubscriptionCard").props.isPlusActive,
      true,
    );

    const select = (item) =>
      render()
        .find((node) => node.type === "Links")
        .props.onSelect(item);
    select(category);
    const modal = render().find((node) => node.type === "Categories");
    assert.equal(modal.props.bookId, "a");
    assert.equal(selected.length, 0);
    modal.props.onClose();
    assert.equal(
      render().some((node) => node.type === "Categories"),
      false,
    );
    select(account);
    select(download);
    assert.deepEqual(selected, [account, download]);
    select(category);
    props.activeBookId = "b";
    assert.equal(
      render().some((node) => node.type === "Categories"),
      false,
    );
    props.activeBookId = "a";
    props.canManageCategories = false;
    select(category);
    assert.equal(
      render().some((node) => node.type === "Categories"),
      false,
    );
    select({ ...account, disabled: true });
    assert.equal(selected.length, 2);
    h.unmount();
  });

  test(`menu rows ${suffix || "shared"} expose icons and descriptions, block disabled items and dispatch downloads once`, () => {
    const load = loader({}, { "src/components/appSettings/SettingsMenuLinks.tsx": undefined });
    const { SettingsMenuLinks } = load(`src/components/appSettings/SettingsMenuLinks${suffix}.tsx`);
    const { buildAllMenuSections } = load("src/lib/menuItems.ts");
    const selected = [],
      sections = buildAllMenuSections({
        showAnnualReportDownload: true,
        hasSharedLedgerNotifications: true,
      });
    const all = nodes(SettingsMenuLinks({ sections, onSelect: (item) => selected.push(item) }));
    const rows = all.filter((node) => node.type === "Row");
    const downloadRow = rows.find((row) => row.props.leadingIcon === "file-excel-outline");
    assert.ok(downloadRow);
    assert.ok(rows.every((row) => row.props.trailingIcon !== "download"));
    assert.ok(rows.filter((row) => row !== downloadRow).every((row) => row.props.leadingIcon));
    assert.equal(rows.filter((row) => row.props.hasBadge).length, 1);
    const category = rows.find((row) => row.props.disabled);
    const disabledItem = sections.flatMap((section) => section.items).find((item) => item.disabled);
    const describedGroup = all.find((node) => node.props.description === disabledItem.description);
    assert.ok(describedGroup);
    assert.deepEqual(
      rows.slice(0, 3).map((row) => row.props.leadingIcon),
      ["user", "users", "grid"],
    );
    assert.equal(rows[2].props.isLast, true);
    assert.equal(rows[0].props.isLast, false);
    if (downloadRow) assert.equal(nodes(describedGroup).includes(downloadRow), false);
    assert.equal(category.props.description, undefined);
    assert.equal(category.props.trailingIcon, null);
    assert.equal(category.props.leadingIcon, "grid");
    assert.equal(downloadRow.props.trailingIcon, null);
    const contactRow = rows.find((row) => row.props.leadingIcon === "mail");
    assert.equal(contactRow.props.trailingIcon, null);
    assert.ok(
      rows
        .filter((row) => row !== category && row !== downloadRow && row !== contactRow)
        .every((row) => row.props.trailingIcon !== null),
    );
    assert.deepEqual(
      nodes(describedGroup).filter((node) => node.type === "Row"),
      rows.slice(0, 3),
    );
    category.props.onPress();
    assert.equal(selected.length, 0);
    downloadRow.props.onPress();
    assert.equal(selected.length, 1);
    assert.equal(selected[0].action, "annual-report-download");
  });

  test(`notification detail ${suffix || "shared"} handles OS permission actions and unsupported devices`, () => {
    let requested = 0,
      settings = 0;
    const load = loader(
      {},
      {
        "react-native": {
          Linking: {
            openSettings: () => {
              settings++;
            },
          },
          StyleSheet: { create: (value) => value },
          Text: "Text",
          View: "View",
        },
      },
    );
    const { NotificationSettingsScreen } = load(
      `src/screens/NotificationSettingsScreen${suffix}.tsx`,
    );
    const { PushNotificationCopy } = load("src/notifications/config/pushNotificationCopy.ts");
    const props = {
      screenTitle: null,
      showNotificationSettings: true,
      notificationPermissionState: "default",
      notificationPreferenceGroups: [],
      onRequestNotificationPermission: async () => {
        requested++;
      },
    };
    const openPermission = () => {
      const all = nodes(NotificationSettingsScreen(props));
      if (suffix) all.find((node) => node.type === "Button").props.onPress();
      else
        all.find((node) => node.type === "Notifications").props.onOpenDeviceNotificationSettings();
    };
    openPermission();
    assert.equal(requested, 1);
    props.notificationPermissionState = "denied";
    openPermission();
    assert.equal(settings, 1);
    props.showNotificationSettings = false;
    const all = nodes(NotificationSettingsScreen(props));
    assert.ok(
      all.some((node) => node.props.children === PushNotificationCopy.permissionUnsupported),
    );
    assert.equal(
      all.some((node) => node.type === "Notifications" || node.type === "Toggle"),
      false,
    );
  });
}

test("the final tab is labeled menu and retains the transaction list label and tab identity", () => {
  const load = modules();
  const { NativeBottomNavigationTabs } = load("src/constants/nativeBottomNavigation.ts");
  const { buildFooterTabs } = load("src/lib/footerTabs.ts");
  const { PrimaryTabRoutes } = load("src/app/signedInNavigation.ts");
  assert.equal(NativeBottomNavigationTabs.at(-1).screen, "all-menu");
  assert.equal(NativeBottomNavigationTabs.at(-1).label, "메뉴");
  assert.equal(NativeBottomNavigationTabs[1].label, "전체 내역");
  assert.equal(buildFooterTabs().at(-1).targetScreen, "all-menu");
  assert.equal(PrimaryTabRoutes["all-menu"], "settings-tab");
  assert.equal("app-settings" in PrimaryTabRoutes, false);
});

test("shared-ledger requests badge the all menu tab and its sharing row", () => {
  const load = modules({
    "expo-notifications": {},
    "src/lib/appStorage.ts": {},
    "src/lib/supabase.ts": {},
  });
  const { resolveFooterBadgeScreens } = load("src/lib/notifications/notificationBadges.ts");
  const { buildAllMenuSections } = load("src/lib/menuItems.ts");
  const badges = resolveFooterBadgeScreens({
    totalUnreadCount: 2,
    byBookId: { book: { joinRequestUnreadCount: 1, ledgerEntryUnreadCount: 1 } },
  });
  assert.deepEqual(Array.from(badges), ["all-entries", "all-menu"]);
  const items = buildAllMenuSections({
    hasSharedLedgerNotifications: badges.includes("all-menu"),
  }).flatMap((section) => section.items);
  assert.equal(items.find((item) => item.targetScreen === "share").hasBadge, true);
});

test("Excel menu icon bypasses the system-symbol fallback and retains the standard trailing chevron", () => {
  const load = loader(
    {},
    {
      "src/components/appSettings/SettingsActionRow.tsx": undefined,
      "@expo/vector-icons/MaterialCommunityIcons": "ExcelIcon",
      "src/components/AppIcons.tsx": { Feather: "SystemIcon" },
    },
  );
  const { SettingsActionRow } = load("src/components/appSettings/SettingsActionRow.tsx");
  const tree = nodes(
    SettingsActionRow({
      label: "Export",
      leadingIcon: "file-excel-outline",
      grouped: true,
      onPress() {},
    }),
  );
  assert.equal(tree.find((node) => node.type === "ExcelIcon").props.name, "file-excel-outline");
  assert.equal(tree.find((node) => node.type === "SystemIcon").props.name, "chevron-right");
});
