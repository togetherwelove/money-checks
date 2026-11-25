import {
  LedgerBookManagementHeaderContext,
  useLedgerBookManagementHeader,
} from "./ledgerBookManagementHeader";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { getAppColors } from "../../constants/colors";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useSheetTransition } from "../../hooks/useSheetTransition";
import { ActionButton } from "../ActionButton";
import { Feather } from "../AppIcons";
import { BlockingOverlay } from "../BlockingOverlay";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import { NativeSelectionSheet } from "../NativeSelectionSheet";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type Props = {
  inline?: boolean;
  isBusy?: boolean;
  onOpenSubscription: () => void;
  children: (onOpenSubscription: () => void) => ReactNode;
};

export function LedgerBookManagementAccess({
  inline = false,
  isBusy = false,
  onOpenSubscription,
  children,
}: Props) {
  useAppTheme();
  const sheet = useSheetTransition();
  const header = useLedgerBookManagementHeader();
  if (inline) return children(onOpenSubscription);
  return (
    <>
      <ActionButton
        shape="capsule"
        variant="secondary"
        label={LedgerBookManagementCopy.manageMembersAction}
        disabled={isBusy || sheet.isPresented}
        onPress={() => sheet.setOpen(true)}
        labelContent={
          <View style={getSharedLedgerPanelStyles().capsuleActionContent}>
            <Feather name="users" size={SettingsGroupDesign.iconSize} color={getAppColors().text} />
            <Text style={getSharedLedgerPanelStyles().capsuleActionText}>
              {LedgerBookManagementCopy.manageMembersAction}
            </Text>
          </View>
        }
      />
      {sheet.isPresented ? (
        <NativeSelectionSheet
          isOpen={sheet.isOpen}
          title={LedgerBookManagementCopy.manageMembersAction}
          action={header.action}
          dismissible={!isBusy}
          onClose={() => {
            if (!isBusy) sheet.setOpen(false);
          }}
          onDismiss={sheet.onDismiss}
        >
          <LedgerBookManagementHeaderContext.Provider value={header.setAction}>
            <KeyboardAwareScrollView contentContainerStyle={getSettingsGroupStyles().page}>
              {children(() => sheet.closeAfterDismiss(onOpenSubscription))}
            </KeyboardAwareScrollView>
          </LedgerBookManagementHeaderContext.Provider>
          {isBusy ? <BlockingOverlay /> : null}
        </NativeSelectionSheet>
      ) : null}
    </>
  );
}
