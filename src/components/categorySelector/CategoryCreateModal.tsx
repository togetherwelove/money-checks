import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { NativePickerSheet } from "../NativePickerSheet";
import { Feather } from "../AppIcons";
import { useRef } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";

import { CATEGORY_ICON_PICKER_OPTIONS } from "../../constants/categories";
import {
  CUSTOM_CATEGORY_MAX_NAME_LENGTH,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import {
  CATEGORY_CREATE_MODAL_ICON_GAP,
  CATEGORY_CREATE_MODAL_ICON_SIZE,
} from "../../constants/categorySelector";
import { getAppColors } from "../../constants/colors";
import {
  getFormInputTextStyle,
  getFormLabelTextStyle,
  ModalActionRowStyle,
  StatusMessageTextStyle,
} from "../../constants/uiStyles";
import type { CategoryIconName } from "../../types/category";
import { ActionButton } from "../ActionButton";

type CategoryCreateModalProps = {
  actionLabel?: string;
  errorMessage: string | null;
  iconName: CategoryIconName;
  isOpen: boolean;
  isBusy?: boolean;
  label: string;
  title?: string;
  onCancel: () => void;
  onChangeIcon: (iconName: CategoryIconName) => void;
  onChangeLabel: (label: string) => void;
  onSubmit: () => void;
};

export function CategoryCreateModal({
  actionLabel = CategoryCustomizerCopy.createAction,
  errorMessage,
  iconName,
  isOpen,
  isBusy = false,
  label,
  title = CategoryCustomizerCopy.createModalTitle,
  onCancel,
  onChangeIcon,
  onChangeLabel,
  onSubmit,
}: CategoryCreateModalProps) {
  const styles = getStyles();
  useAppTheme();
  const inputRef = useRef<TextInputInstance>(null);

  return (
    <NativePickerSheet
      isOpen={isOpen}
      onClose={handleCancel}
      dismissible={!isBusy}
      title={title}
      onShow={() => inputRef.current?.focus()}
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{CategoryCustomizerCopy.createIconLabel}</Text>
        <View style={styles.iconGrid}>
          {CATEGORY_ICON_PICKER_OPTIONS.map((nextIconName) => (
            <Pressable
              key={nextIconName}
              disabled={isBusy}
              onPress={() => onChangeIcon(nextIconName)}
              style={[
                styles.iconButton,
                iconName === nextIconName ? styles.activeIconButton : null,
              ]}
            >
              <Feather
                color={
                  iconName === nextIconName ? getAppColors().primary : getAppColors().mutedText
                }
                name={nextIconName}
                size={18}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{CategoryCustomizerCopy.createNameLabel}</Text>
        <TextInput
          editable={!isBusy}
          blurOnSubmit
          maxLength={CUSTOM_CATEGORY_MAX_NAME_LENGTH}
          onChangeText={onChangeLabel}
          onSubmitEditing={handleSubmit}
          placeholder={CategoryCustomizerCopy.namePlaceholder}
          placeholderTextColor={getAppColors().mutedStrongText}
          ref={inputRef}
          returnKeyType="done"
          style={styles.input}
          value={label}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          disabled={isBusy}
          label={actionLabel}
          onPress={handleSubmit}
          size="inline"
          variant="primary"
        />
      </View>
    </NativePickerSheet>
  );

  function handleCancel() {
    if (isBusy) return;
    Keyboard.dismiss();
    onCancel();
  }

  function handleSubmit() {
    if (isBusy) return;
    Keyboard.dismiss();
    onSubmit();
  }
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    fieldGroup: {
      gap: 8,
    },
    label: getFormLabelTextStyle(),
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "flex-start",
      gap: CATEGORY_CREATE_MODAL_ICON_GAP,
    },
    iconButton: {
      width: CATEGORY_CREATE_MODAL_ICON_SIZE,
      height: CATEGORY_CREATE_MODAL_ICON_SIZE,
      borderWidth: 1,
      borderColor: getAppColors().border,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().background,
    },
    activeIconButton: {
      borderColor: getAppColors().primary,
      backgroundColor: getAppColors().surfaceStrong,
    },
    input: getFormInputTextStyle(),
    errorText: {
      ...StatusMessageTextStyle,
      color: getAppColors().expense,
    },
    actionRow: ModalActionRowStyle,
  }),
);
