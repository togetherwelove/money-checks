import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  CUSTOM_CATEGORY_MAX_NAME_LENGTH,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import { CATEGORY_INLINE_CREATOR_ICON_SIZE } from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import type { CategoryIconName } from "../../types/category";

type InlineCategoryCreatorProps = {
  errorMessage: string | null;
  iconName: CategoryIconName;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  onChangeLabel: (label: string) => void;
  onCancel: () => void;
  onPressIcon: () => void;
  onPressInIcon: () => void;
  onSubmit: () => void;
};

export function InlineCategoryCreator({
  errorMessage,
  iconName,
  label,
  left,
  top,
  width,
  height,
  onChangeLabel,
  onCancel,
  onPressIcon,
  onPressInIcon,
  onSubmit,
}: InlineCategoryCreatorProps) {
  return (
    <View style={[styles.container, { height, left, top, width }]}>
      <Pressable
        accessibilityLabel={CategoryCustomizerCopy.inlineIconAccessibilityLabel}
        onPress={onPressIcon}
        onPressIn={onPressInIcon}
        style={styles.iconButton}
      >
        <Feather
          color={AppColors.primary}
          name={iconName}
          size={CATEGORY_INLINE_CREATOR_ICON_SIZE}
        />
      </Pressable>
      <TextInput
        autoFocus
        blurOnSubmit
        maxLength={CUSTOM_CATEGORY_MAX_NAME_LENGTH}
        onBlur={onCancel}
        onChangeText={onChangeLabel}
        onSubmitEditing={onSubmit}
        placeholder={CategoryCustomizerCopy.namePlaceholder}
        placeholderTextColor={AppColors.mutedStrongText}
        returnKeyType="done"
        style={styles.input}
        value={label}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconButton: {
    width: 24,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 0,
  },
  errorText: {
    color: AppColors.expense,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
});
