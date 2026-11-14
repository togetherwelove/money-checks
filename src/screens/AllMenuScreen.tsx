import { useAppTheme } from "../hooks/useAppTheme";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { AppVersionFooter } from "../components/AppVersionFooter";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { SettingsCategoryOrderModal } from "../components/appSettings/SettingsCategoryOrderModal";
import { SettingsMenuLinks } from "../components/appSettings/SettingsMenuLinks";
import { getMenuStyles } from "../constants/menuStyles";
import { useAllMenuActions, type AllMenuActionsOptions } from "../hooks/useAllMenuActions";
import type { AppMenuSection } from "../lib/menuItems";

export type AllMenuScreenProps = AllMenuActionsOptions & { menuSections: AppMenuSection[] };

export function AllMenuScreen(props: AllMenuScreenProps) {
  useAppTheme();
  const actions = useAllMenuActions(props);
  return (
    <>
      <KeyboardAwareScrollView
        style={getMenuStyles().screen}
        contentContainerStyle={getMenuStyles().content}
      >
        <SettingsMenuLinks sections={props.menuSections} onSelect={actions.selectMenuItem} />
        <AppVersionFooter />
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
