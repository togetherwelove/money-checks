import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerBookJoinRequest } from "../types/ledgerBookJoinRequest";
import { ActionButton } from "./ActionButton";

type LedgerBookJoinRequestsProps = {
  onApproveRequest: (requestId: string) => Promise<boolean>;
  onRejectRequest: (requestId: string) => Promise<boolean>;
  requests: LedgerBookJoinRequest[];
};

export function LedgerBookJoinRequests({
  onApproveRequest,
  onRejectRequest,
  requests,
}: LedgerBookJoinRequestsProps) {
  if (!requests.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{AppMessages.accountJoinRequestsTitle}</Text>
      <View style={styles.list}>
        {requests.map((request) => (
          <View key={request.id} style={styles.row}>
            <Text style={styles.name}>{request.requesterDisplayName}</Text>
            <View style={styles.actions}>
              <ActionButton
                label={AppMessages.accountJoinRejectAction}
                onPress={() => void onRejectRequest(request.id)}
                variant="secondary"
              />
              <ActionButton
                label={AppMessages.accountJoinApproveAction}
                onPress={() => void onApproveRequest(request.id)}
                variant="primary"
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  title: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "700",
    paddingTop: 2,
  },
  list: {
    gap: 8,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  name: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
