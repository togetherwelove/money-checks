import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import {
  EntryComposerCopy as Copy,
  EntryComposerUi as Ui,
  type EntryComposerUnavailableReason,
} from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import { ActionButton } from "../ActionButton";

type Props = {
  children: ReactNode;
  disabled: boolean;
  saving: boolean;
  unavailableReason?: EntryComposerUnavailableReason;
  onSelectBook?: () => void;
};

export function EntryComposerPanel({
  children,
  disabled,
  saving,
  unavailableReason,
  onSelectBook,
}: Props) {
  const styles = getStyles();
  useAppTheme();
  const [noticeHeight, setNoticeHeight] = useState(0);
  const showNotice = disabled && !saving;
  const loading = showNotice && !unavailableReason;
  const message = loading
    ? Copy.loading
    : unavailableReason === "no-book"
      ? Copy.selectBookHint
      : Copy.unavailable;

  return (
    <View
      accessible={saving}
      accessibilityLabel={saving ? Copy.saving : undefined}
      accessibilityState={{ busy: saving }}
      style={[
        styles.panel,
        styles.amountPanel,
        noticeHeight > 0 && { minHeight: noticeHeight + Ui.panelPadding * 2 },
      ]}
    >
      <View
        style={[styles.content, showNotice && !loading && styles.hiddenContent]}
        pointerEvents={disabled || saving ? "none" : "auto"}
        accessibilityElementsHidden={showNotice || saving}
        importantForAccessibility={showNotice || saving ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {showNotice ? (
        <View style={[styles.notice, loading ? styles.loadingNotice : styles.unavailableNotice]}>
          <View
            style={styles.noticeContent}
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              setNoticeHeight((current) => Math.max(current, height));
            }}
          >
            <View
              style={styles.messageRow}
              accessibilityLiveRegion="polite"
              accessibilityState={{ busy: loading }}
            >
              {loading ? <ActivityIndicator color={getAppColors().primary} /> : null}
              <Text style={styles.message}>{message}</Text>
            </View>
            {unavailableReason === "no-book" && onSelectBook ? (
              <ActionButton
                label={Copy.selectBook}
                onPress={onSelectBook}
                size="inline"
                variant="primary"
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    panel: { backgroundColor: getAppColors().surface, padding: Ui.sheetPadding },
    amountPanel: { paddingTop: AppLayout.compactGap },
    content: { gap: Ui.sheetSectionGap },
    hiddenContent: { opacity: 0 },
    notice: { ...StyleSheet.absoluteFill, justifyContent: "center", padding: Ui.panelPadding },
    loadingNotice: { backgroundColor: getAppColors().loadingPanelOverlay },
    unavailableNotice: { backgroundColor: getAppColors().surface },
    noticeContent: { alignItems: "center", gap: Ui.sectionGap },
    messageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: AppLayout.cardGap,
    },
    message: {
      flexShrink: 1,
      color: getAppColors().mutedText,
      fontSize: Ui.fontSize,
      textAlign: "center",
    },
  }),
);
