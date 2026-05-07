import { selectStaticCopy } from "../../i18n/staticCopy";

const PushNotificationLocalizedCopy = selectStaticCopy({
  en: {
    androidChannelName: "Ledger Notifications",
    joinRequestNotificationBody: "{requesterName} requested access to {bookName}.",
    joinRequestNotificationTitle: "New Join Request",
    permissionBlocked:
      "Device notification permission is blocked. Allow notifications in phone settings.",
    permissionGranted: "Allowed",
    permissionPrompt: "Not selected yet",
    permissionUnsupported: "Remote push notifications are unavailable on this device.",
    statusUnsupported: "Test push notifications are unavailable on this device.",
  },
  ko: {
    androidChannelName: "가계부 알림",
    joinRequestNotificationBody: "{requesterName}님이 {bookName} 참여를 요청했어요.",
    joinRequestNotificationTitle: "새 참여 요청",
    permissionBlocked: "기기 알림 권한이 차단되어 있어요. 휴대폰 설정에서 알림을 허용해 주세요.",
    permissionGranted: "허용됨",
    permissionPrompt: "아직 선택 안 함",
    permissionUnsupported: "현재 기기에서는 원격 푸시 알림을 사용할 수 없어요.",
    statusUnsupported: "현재 기기에서는 테스트 푸시 알림을 사용할 수 없어요.",
  },
} as const);

export const PushNotificationCopy = {
  ...PushNotificationLocalizedCopy,
  androidChannelId: "ledger-updates",
} as const;
