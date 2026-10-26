import { useState } from "react";
import { Feather } from "../AppIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppSettingsCopy as Copy, AppSettingsUi } from "../../constants/appSettings";
import { AppSettingsRowStyles as Row } from "../../constants/appSettingsStyles";
import { AppColors } from "../../constants/colors";
import { CardTitleTextStyle, ListGroupStyle, SupportingTextStyle } from "../../constants/uiStyles";
import { SettingsCategoryOrderModal } from "./SettingsCategoryOrderModal";

export function CategoryAdditionSettings({ bookId, bookName, canAdd }: {
  bookId: string | null; bookName: string; canAdd: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const disabled = !bookId || !canAdd;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={CardTitleTextStyle}>{Copy.categorySectionTitle}</Text>
      <View style={ListGroupStyle}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [Row.row, Row.lastRow, disabled && Row.disabled, pressed && Row.pressed]}>
          <View style={Row.textBlock}>
            <Text style={Row.title}>{Copy.categoryMenuTitle}</Text>
            <Text style={SupportingTextStyle}>{disabled ? Copy.categoryBookUnavailable : `${Copy.categoryBookPrefix}${bookName}`}</Text>
          </View>
          <Feather name="chevron-right" size={AppSettingsUi.selectionChevronIconSize} color={AppColors.mutedStrongText} />
        </Pressable>
      </View>
      {bookId && canAdd && isOpen ? <SettingsCategoryOrderModal bookId={bookId} onClose={() => setIsOpen(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: AppSettingsUi.sectionGap },
});
