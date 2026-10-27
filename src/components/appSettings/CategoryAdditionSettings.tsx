import { SettingsActionRow } from "./SettingsActionRow";
import { useState } from "react";
import { StyleSheet,Text,View } from "react-native";
import { AppSettingsUi,AppSettingsCopy as Copy } from "../../constants/appSettings";
import { MenuStyles } from "../../constants/menuStyles";
import { SettingsCategoryOrderModal } from "./SettingsCategoryOrderModal";

export function CategoryAdditionSettings({ bookId, bookName, canAdd, showsSectionTitle = true, embeddedInNativeRow = false }: {
  bookId: string | null; bookName: string; canAdd: boolean; showsSectionTitle?: boolean; embeddedInNativeRow?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const disabled = !bookId || !canAdd;
  return (
    <View style={styles.section}>
      {showsSectionTitle ? <Text accessibilityRole="header" style={MenuStyles.sectionTitle}>{Copy.categorySectionTitle}</Text> : null}
      <SettingsActionRow label={Copy.categoryMenuTitle}
        description={disabled ? Copy.categoryBookUnavailable : `${Copy.categoryBookPrefix}${bookName}`}
        disabled={disabled} embeddedInNativeRow={embeddedInNativeRow} isLast
        onPress={() => setIsOpen(true)} />
      {bookId && canAdd && isOpen ? <SettingsCategoryOrderModal bookId={bookId} onClose={() => setIsOpen(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: AppSettingsUi.sectionGap },
});
