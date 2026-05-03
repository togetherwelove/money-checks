import { Text, TextInput, View } from "react-native";

import { SHARE_CODE_LENGTH } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { ActionButton } from "../ActionButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerJoinCardProps = {
  canLeaveSharedBook: boolean;
  onChangeShareCodeInput: (value: string) => void;
  onJoin: () => unknown;
  onLeave: () => unknown;
  shareCodeInput: string;
};

export function SharedLedgerJoinCard({
  canLeaveSharedBook,
  onChangeShareCodeInput,
  onJoin,
  onLeave,
  shareCodeInput,
}: SharedLedgerJoinCardProps) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionContent, styles.sectionBottomInset]}>
        <Text style={styles.sectionTitle}>{AppMessages.accountJoinTitle}</Text>
        <Text style={styles.helpText}>{AppMessages.accountJoinSubtitle}</Text>
        <TextInput
          autoCapitalize="characters"
          maxLength={SHARE_CODE_LENGTH}
          onChangeText={onChangeShareCodeInput}
          placeholder={AppMessages.accountJoinPlaceholder}
          style={styles.input}
          value={shareCodeInput}
        />
        <Text style={styles.hintText}>{AppMessages.accountJoinEmptyHint}</Text>
        <View style={styles.actionRow}>
          <ActionButton label={AppMessages.accountJoinAction} onPress={onJoin} />
        </View>
        {canLeaveSharedBook ? (
          <View style={styles.leaveSection}>
            <Text style={styles.helpText}>{AppMessages.accountDisconnectHint}</Text>
            <ActionButton
              label={AppMessages.accountDisconnectAction}
              onPress={onLeave}
              variant="destructive"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
