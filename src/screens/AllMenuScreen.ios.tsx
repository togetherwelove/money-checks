import { Host, List } from "@expo/ui/swift-ui";
import { StyleSheet } from "react-native";
import { SettingsCategoryOrderModal } from "../components/appSettings/SettingsCategoryOrderModal";
import { SettingsMenuLinks } from "../components/appSettings/SettingsMenuLinks";
import { AppColors } from "../constants/colors";
import { NativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { useAllMenuActions } from "../hooks/useAllMenuActions";
import type { AllMenuScreenProps } from "./AllMenuScreen";

export function AllMenuScreen(props: AllMenuScreenProps) {
  const actions = useAllMenuActions(props);
  return (
    <>
      <Host
        style={styles.screen}
        useViewportSizeMeasurement
        colorScheme="light"
        seedColor={AppColors.primary}
      >
        <List modifiers={NativeSettingsStyles.list}>
          <SettingsMenuLinks sections={props.menuSections} onSelect={actions.selectMenuItem} />
        </List>
      </Host>
      {actions.categoryBookId ? (
        <SettingsCategoryOrderModal
          key={actions.categoryBookId}
          bookId={actions.categoryBookId}
          onClose={actions.closeCategories}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
