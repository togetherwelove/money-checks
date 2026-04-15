import { Text, TextInput, View } from "react-native";

import { SHARE_CODE_LENGTH } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { ActionButton } from "../ActionButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

const JOIN_REQUEST_BLOCKED_MESSAGE =
  "이미 다른 공유 가계부를 사용 중이라 다른 가계부에는 참여 요청을 보낼 수 없어요.";

type SharedLedgerJoinCardProps = {
  canLeaveSharedBook: boolean;
  hasJoinError: boolean;
  isJoinBlocked: boolean;
  onChangeShareCodeInput: (value: string) => void;
  onJoin: () => unknown;
  onLeave: () => unknown;
  shareCodeInput: string;
  statusMessage: string | null;
};

export function SharedLedgerJoinCard({
  canLeaveSharedBook,
  hasJoinError,
  isJoinBlocked,
  onChangeShareCodeInput,
  onJoin,
  onLeave,
  shareCodeInput,
  statusMessage,
}: SharedLedgerJoinCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{AppMessages.accountJoinTitle}</Text>
      <Text style={styles.helpText}>{AppMessages.accountJoinSubtitle}</Text>
      <TextInput
        autoCapitalize="characters"
        editable={!isJoinBlocked}
        maxLength={SHARE_CODE_LENGTH}
        onChangeText={onChangeShareCodeInput}
        placeholder={AppMessages.accountJoinPlaceholder}
        style={styles.input}
        value={shareCodeInput}
      />
      {isJoinBlocked ? (
        <Text style={[styles.hintText, styles.errorText]}>{JOIN_REQUEST_BLOCKED_MESSAGE}</Text>
      ) : null}
      {!statusMessage ? (
        <Text style={styles.hintText}>{AppMessages.accountJoinEmptyHint}</Text>
      ) : null}
      {statusMessage ? (
        <Text style={[styles.statusText, hasJoinError ? styles.errorText : styles.successText]}>
          {statusMessage}
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        <ActionButton
          disabled={isJoinBlocked}
          label={AppMessages.accountJoinAction}
          onPress={onJoin}
        />
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
  );
}
