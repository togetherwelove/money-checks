import { Alert, Text, View } from "react-native";
import { AppTextBreakProps } from "../../constants/textLayout";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { getAppColors } from "../../constants/colors";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AppMessages } from "../../constants/messages";
import { ActionButton } from "../ActionButton";
import { Feather } from "../AppIcons";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type SharedLedgerJoinCardProps = {
  disabled?: boolean;
  onChangeShareCodeInput: (value: string) => void;
  onJoin: (shareCode: string) => unknown;
  shareCodeInput: string;
};

export function SharedLedgerJoinCard({
  disabled = false,
  onChangeShareCodeInput,
  onJoin,
  shareCodeInput,
}: SharedLedgerJoinCardProps) {
  useAppTheme();
  const openShareCodePrompt = () =>
    new Promise<void>((resolve) => {
      Alert.prompt(
        AppMessages.accountJoinPlaceholder,
        undefined,
        [
          {
            text: LedgerBookManagementCopy.cancelAction,
            style: "cancel",
            onPress: () => resolve(),
          },
          {
            text: AppMessages.accountJoinAction,
            onPress: async (value?: string) => {
              const nextShareCode = value ?? "";
              try {
                onChangeShareCodeInput(nextShareCode);
                await onJoin(nextShareCode);
              } finally {
                resolve();
              }
            },
          },
        ],
        "plain-text",
        shareCodeInput,
        "ascii-capable",
      );
    });
  return (
    <View style={getSettingsGroupStyles().section}>
      <ActionButton
        disabled={disabled}
        shape="capsule"
        variant="secondary"
        label={AppMessages.accountJoinTitle}
        onPress={openShareCodePrompt}
        labelContent={
          <View style={getSharedLedgerPanelStyles().capsuleActionContent}>
            <Feather name="users" size={SettingsGroupDesign.iconSize} color={getAppColors().text} />
            <Text style={getSharedLedgerPanelStyles().capsuleActionText}>
              {AppMessages.accountJoinTitle}
            </Text>
          </View>
        }
      />
      <Text {...AppTextBreakProps} style={getSettingsGroupStyles().caption}>
        {AppMessages.accountJoinSubtitle}
      </Text>
    </View>
  );
}
