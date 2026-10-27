import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { SettingsCategoryOrderModal } from "../components/appSettings/SettingsCategoryOrderModal";
import { SettingsMenuLinks } from "../components/appSettings/SettingsMenuLinks";
import { MenuStyles } from "../constants/menuStyles";
import { useAllMenuActions, type AllMenuActionsOptions } from "../hooks/useAllMenuActions";
import type { AppMenuSection } from "../lib/menuItems";

export type AllMenuScreenProps = AllMenuActionsOptions & { menuSections: AppMenuSection[] };

export function AllMenuScreen(props: AllMenuScreenProps) {
  const actions = useAllMenuActions(props);
  return (
    <>
      <KeyboardAwareScrollView style={MenuStyles.screen} contentContainerStyle={MenuStyles.content}>
        <SettingsMenuLinks sections={props.menuSections} onSelect={actions.selectMenuItem} />
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
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
