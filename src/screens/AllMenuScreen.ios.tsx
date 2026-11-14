import { useAppTheme } from "../hooks/useAppTheme";
import { Host, List, RNHostView, VStack } from "@expo/ui/swift-ui";
import { AppVersionFooter } from "../components/AppVersionFooter";
import { StyleSheet } from "react-native";
import { SettingsCategoryOrderModal } from "../components/appSettings/SettingsCategoryOrderModal";
import { SettingsMenuLinks } from "../components/appSettings/SettingsMenuLinks";
import { getAppColors } from "../constants/colors";
import { getNativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { useAllMenuActions } from "../hooks/useAllMenuActions";
import type { AllMenuScreenProps } from "./AllMenuScreen";

export function AllMenuScreen(props: AllMenuScreenProps) {
  const colorScheme = useAppTheme();
  const actions = useAllMenuActions(props);
  return (
    <>
      <Host
        style={styles.screen}
        useViewportSizeMeasurement
        colorScheme={colorScheme}
        seedColor={getAppColors().primary}
      >
        <List modifiers={getNativeSettingsStyles().list}>
          <SettingsMenuLinks sections={props.menuSections} onSelect={actions.selectMenuItem} />
          <VStack modifiers={getNativeSettingsStyles().footer}>
            <RNHostView matchContents={{ vertical: true }}>
              <AppVersionFooter />
            </RNHostView>
          </VStack>
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
