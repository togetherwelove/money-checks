import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CATEGORY_ICON_PICKER_OPTIONS } from "../../constants/categories";
import {
  CUSTOM_CATEGORY_MAX_NAME_LENGTH,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import {
  CATEGORY_CREATE_MODAL_ICON_GAP,
  CATEGORY_CREATE_MODAL_ICON_SIZE,
  CATEGORY_CREATE_MODAL_INPUT_FOCUS_DELAY_MS,
  CATEGORY_CREATE_MODAL_MAX_HEIGHT,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { CommonActionCopy } from "../../constants/commonActions";
import { AppLayout } from "../../constants/layout";
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
  label,
  title = CategoryCustomizerCopy.createModalTitle,
  onCancel,
  onChangeIcon,
  onChangeLabel,
  onSubmit,
}: CategoryCreateModalProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, CATEGORY_CREATE_MODAL_INPUT_FOCUS_DELAY_MS);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={handleCancel} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={handleCancel} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={handleCancel}>
              <Text style={styles.closeText}>{CommonActionCopy.close}</Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{CategoryCustomizerCopy.createIconLabel}</Text>
            <ScrollView
              contentContainerStyle={styles.iconGrid}
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              style={styles.iconPicker}
            >
              {CATEGORY_ICON_PICKER_OPTIONS.map((nextIconName) => (
                <Pressable
                  key={nextIconName}
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
              label={actionLabel}
              onPress={handleSubmit}
              size="inline"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  function handleCancel() {
    Keyboard.dismiss();
    onCancel();
  }

  function handleSubmit() {
    Keyboard.dismiss();
    onSubmit();
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: 16,
    maxHeight: CATEGORY_CREATE_MODAL_MAX_HEIGHT,
    padding: 16,
    gap: 14,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
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
