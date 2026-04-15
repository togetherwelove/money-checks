export const PushNotificationCopy = {
  androidChannelId: "ledger-updates",
  androidChannelName: "가계부 알림",
  joinRequestNotificationBody: "{requesterName}님이 {bookName} 참여를 요청했어요.",
  joinRequestNotificationTitle: "새 참여 요청",
  permissionBlocked: "기기 알림 권한이 차단되어 있습니다. 휴대폰 설정에서 알림을 허용해 주세요.",
  permissionGranted: "허용됨",
  permissionPrompt: "아직 선택 안 함",
  permissionUnsupported: "현재 기기에서는 원격 푸시 알림을 사용할 수 없습니다.",
  statusDefault: "이 기기에서 아직 푸시 알림 권한을 선택하지 않았습니다.",
  statusEnabled: "이 기기에서 푸시 알림을 받을 수 있습니다.",
  statusUnsupported: "현재 기기에서는 테스트 푸시 알림을 사용할 수 없습니다.",
} as const;
