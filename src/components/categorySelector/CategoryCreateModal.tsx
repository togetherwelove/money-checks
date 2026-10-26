import { NativePickerSheet } from "../NativePickerSheet";
import { AppScrollBehavior } from "../../constants/scroll";
import { Feather } from "../AppIcons";
import { useRef } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { AppColors } from "../../constants/colors";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
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
  const inputRef = useRef<TextInputInstance>(null);

  return (
    <NativePickerSheet isOpen={isOpen} onClose={handleCancel} dismissible={!isBusy} title={title}
      onShow={() => inputRef.current?.focus()}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{CategoryCustomizerCopy.createIconLabel}</Text>
            <ScrollView {...AppScrollBehavior}
              contentContainerStyle={styles.iconGrid}
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              style={styles.iconPicker}
            >
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
                    color={iconName === nextIconName ? AppColors.primary : AppColors.mutedText}
                    name={nextIconName}
                    size={18}
                  />
                </Pressable>
              ))}
            </ScrollView>
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
              placeholderTextColor={AppColors.mutedStrongText}
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

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  label: FormLabelTextStyle,
  iconPicker: {},
  iconGrid: {
    flexDirection: "row",
    gap: CATEGORY_CREATE_MODAL_ICON_GAP,
  },
  iconButton: {
    width: CATEGORY_CREATE_MODAL_ICON_SIZE,
    height: CATEGORY_CREATE_MODAL_ICON_SIZE,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
  },
  activeIconButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  input: FormInputTextStyle,
  errorText: {
    ...StatusMessageTextStyle,
    color: AppColors.expense,
  },
  actionRow: ModalActionRowStyle,
});
