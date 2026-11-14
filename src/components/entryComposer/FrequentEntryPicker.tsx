import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import { FrequentEntryCopy as Copy, FrequentEntryConfig } from "../../constants/frequentEntries";
import { EntryComposerUi as Ui } from "../../constants/entryComposer";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { appStorage } from "../../lib/appStorage";
import {
  readFrequentEntries,
  removeFrequentEntry,
  type FrequentEntry,
} from "../../lib/frequentEntries";
import { showNativeToast } from "../../lib/nativeToast";
import { formatCurrency } from "../../utils/calendar";
import { Feather } from "../AppIcons";

export function FrequentEntryPicker({
  userId,
  bookId,
  visible,
  disabled,
  onSelect,
}: {
  userId: string;
  bookId: string;
  visible: boolean;
  disabled: boolean;
  onSelect: (entry: FrequentEntry) => void;
}) {
  const styles = getStyles();
  useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<FrequentEntry[]>([]);
  useEffect(() => {
    setExpanded(false);
    setItems([]);
    if (!visible) return;
    try {
      setItems(readFrequentEntries(appStorage, userId, bookId));
    } catch {
      showNativeToast(Copy.error);
    }
  }, [userId, bookId, visible]);
  const actions: MenuAction[] = items.length
    ? items.map((item) => ({
        id: `${FrequentEntryConfig.entryActionPrefix}${item.id}`,
        title: `${item.content}${FrequentEntryConfig.separator}${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount)}${FrequentEntryConfig.separator}${item.category}`,
        subactions: [
          {
            id: `${FrequentEntryConfig.useActionPrefix}${item.id}`,
            title: Copy.use,
          },
          {
            id: `${FrequentEntryConfig.removeActionPrefix}${item.id}`,
            title: Copy.remove,
            attributes: { destructive: true },
          },
        ],
      }))
    : [{ id: FrequentEntryConfig.emptyAction, title: Copy.empty, attributes: { disabled: true } }];
  return (
    <View pointerEvents={disabled ? "none" : "auto"}>
      <MenuView
        actions={actions}
        isAnchoredToRight
        shouldOpenOnLongPress={false}
        onOpenMenu={() => {
          Keyboard.dismiss();
          setExpanded(true);
        }}
        onCloseMenu={() => setExpanded(false)}
        onPressAction={({ nativeEvent }) => {
          if (disabled || !visible) return;
          const selected = items.find(
            (item) => `${FrequentEntryConfig.useActionPrefix}${item.id}` === nativeEvent.event,
          );
          if (selected) {
            onSelect(selected);
            return;
          }
          const removed = items.find(
            (item) => `${FrequentEntryConfig.removeActionPrefix}${item.id}` === nativeEvent.event,
          );
          if (!removed) return;
          try {
            removeFrequentEntry(appStorage, userId, bookId, removed.id);
            setItems((current) => current.filter((item) => item.id !== removed.id));
            showNativeToast(Copy.removed);
          } catch {
            showNativeToast(Copy.error);
          }
        }}
      >
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={Copy.title}
          accessibilityState={{ expanded, disabled }}
          style={[styles.trigger, disabled && styles.disabled]}
        >
          <Text style={styles.link}>{Copy.title}</Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={Ui.bookDropdownIconSize}
            color={getAppColors().primary}
          />
        </View>
      </MenuView>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    trigger: {
      minHeight: Ui.fieldHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: AppLayout.compactGap,
    },
    link: { color: getAppColors().primary, fontSize: Ui.fontSize },
    disabled: { opacity: Ui.disabledOpacity },
  }),
);
