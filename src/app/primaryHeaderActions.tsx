import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import { IconActionButton } from "../components/IconActionButton";
import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { NativeBottomNavigationUi } from "../constants/nativeBottomNavigation";

const actionRow = { flexDirection: "row", alignItems: "center" } as const;

export function getPrimaryHeaderActions(renderActions: () => ReactNode, onOpenEntry?: () => void, disabled = false):
  Pick<NativeStackNavigationOptions, "headerRight" | "unstable_headerRightItems"> {
  return {
    headerRight: Platform.OS === "android" && onOpenEntry ? () => (
      <View style={actionRow}>
        {renderActions()}
        <IconActionButton icon={NativeBottomNavigationUi.addIcon} accessibilityLabel={AppMessages.entryScreenTitle}
          disabled={disabled} onPress={onOpenEntry} />
      </View>
    ) : renderActions,
    unstable_headerRightItems: Platform.OS === "ios" && onOpenEntry ? () => [
      { type: "custom", element: <>{renderActions()}</> },
      { type: "button", label: AppMessages.entryScreenTitle,
        accessibilityLabel: AppMessages.entryScreenTitle,
        icon: { type: "sfSymbol", name: NativeBottomNavigationUi.addIcon },
        variant: "prominent", tintColor: AppColors.primary, sharesBackground: false,
        disabled, onPress: () => { if (!disabled) onOpenEntry(); },
      },
    ] : undefined,
  };
}
