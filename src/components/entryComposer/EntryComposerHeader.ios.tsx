import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Button, Host, Image, Picker, ProgressView, Text } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled,
  frame,
  glassEffect,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, Text as HeaderTitle, View, useWindowDimensions } from "react-native";

import { getAppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import type { LedgerEntryType } from "../../types/ledger";
import type { EntryComposerHeaderProps } from "./EntryComposerHeader.types";

const supportsGlass = isLiquidGlassAvailable();
const buttonFrame = frame({ width: Ui.sheetControlSize, height: Ui.sheetControlSize });
const pickerGlass = supportsGlass
  ? [glassEffect({ glass: { variant: "regular", interactive: false }, shape: "capsule" })]
  : [];
const closeGlass = supportsGlass
  ? [glassEffect({ glass: { variant: "regular", interactive: true }, shape: "circle" })]
  : [];
const getActionGlass = createThemeValue(() =>
  supportsGlass
    ? [
        glassEffect({
          glass: { variant: "regular", interactive: true, tint: getAppColors().primary },
          shape: "circle",
        }),
      ]
    : [],
);

export function EntryComposerHeader({
  title,
  centerContent,
  type = "expense",
  onSelectType,
  typeDisabled = false,
  saving = false,
  actionDisabled = false,
  actionLabel,
  onAction,
  onClose,
}: EntryComposerHeaderProps) {
  const styles = getStyles();
  const colorScheme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <View style={styles.header}>
      <Host style={styles.button} colorScheme={colorScheme} alignment="center">
        <Button
          role="cancel"
          onPress={() => {
            if (!saving) onClose();
          }}
          modifiers={[
            buttonStyle(supportsGlass ? "plain" : "bordered"),
            buttonBorderShape("circle"),
            controlSize("large"),
            buttonFrame,
            ...closeGlass,
            labelStyle("iconOnly"),
            disabled(saving),
            tint(getAppColors().text),
            accessibilityLabel(Copy.closeSheet),
          ]}
        >
          <Image
            systemName="xmark"
            size={Ui.sheetIconSize}
            color={getAppColors().text}
            modifiers={[buttonFrame]}
          />
        </Button>
      </Host>
      {centerContent ? (
        <View style={styles.centerSlot}>{centerContent}</View>
      ) : title ? (
        <HeaderTitle accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </HeaderTitle>
      ) : (
        <View style={styles.pickerSlot}>
          <Host
            style={[styles.picker, { width: Ui.sheetTypePickerWidth * Math.max(1, fontScale) }]}
            colorScheme={colorScheme}
            alignment="center"
          >
            <Picker<LedgerEntryType>
              label={Copy.typeLabel}
              selection={type}
              onSelectionChange={(value) => {
                if (!typeDisabled) onSelectType?.(value);
              }}
              modifiers={[
                pickerStyle("segmented"),
                controlSize("regular"),
                ...pickerGlass,
                disabled(typeDisabled),
              ]}
            >
              <Text modifiers={[tag("expense")]}>{Copy.expense}</Text>
              <Text modifiers={[tag("income")]}>{Copy.income}</Text>
            </Picker>
          </Host>
        </View>
      )}
      {onAction ? (
        <Host style={styles.button} colorScheme={colorScheme} alignment="center">
          <Button
            onPress={() => {
              if (!actionDisabled && !saving) onAction();
            }}
            modifiers={[
              buttonStyle(supportsGlass ? "plain" : "borderedProminent"),
              buttonBorderShape("circle"),
              controlSize("large"),
              buttonFrame,
              ...getActionGlass(),
              labelStyle("iconOnly"),
              disabled(actionDisabled || saving),
              tint(getAppColors().primary),
              accessibilityLabel(actionLabel ?? Copy.save),
            ]}
          >
            {saving ? (
              <ProgressView modifiers={[buttonFrame]} />
            ) : (
              <Image
                systemName="checkmark"
                size={Ui.sheetIconSize}
                color={getAppColors().onPrimary}
                modifiers={[buttonFrame]}
              />
            )}
          </Button>
        </Host>
      ) : (
        <View style={styles.button} />
      )}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    centerSlot: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" },
    title: {
      flex: 1,
      textAlign: "center",
      color: getAppColors().text,
      fontSize: Ui.sheetFieldFontSize,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: AppLayout.cardGap,
      padding: Ui.sheetPadding,
    },
    button: { width: Ui.sheetControlSize, height: Ui.sheetControlSize },
    pickerSlot: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" },
    picker: { maxWidth: "100%", height: Ui.sheetControlSize },
  }),
);
