import { AppFontSize, AppLineHeight } from "./typography";
export const SharedLedgerPanelUi = {
  sectionTitleFontSize: AppFontSize.title,
  sectionTitleLineHeight: AppLineHeight.title,
  joinRequestActionGap: 8,
  joinRequestAvatarSize: 28,
  joinRequestCardGap: 10,
  joinRequestCardPaddingHorizontal: 10,
  joinRequestCardPaddingVertical: 10,
  joinRequestHeaderGap: 8,
  joinRequestMetaGap: 3,
  joinRequestStatusPaddingHorizontal: 8,
  joinRequestStatusPaddingVertical: 4,
  joinRequestStatusRadius: 8,
  joinRequestStatusBottom: 12,
  joinRequestStatusReservedWidth: 112,
  joinRequestStatusTextLineHeight: AppLineHeight.caption,
  copyActionGap: 6,
  copyActionIconSize: 16,
  copyActionTextFontSize: AppFontSize.label,
  ledgerBookMembersBlockTopPadding: 8,
  pendingRequestBadgeSize: 8,
  shareCodePreviewPrefixLength: 4,
  shareCodePreviewMask: "••••",
} as const;

export const SharedLedgerJoinRequestUi = {
  requesterFallbackInitial: "?",
} as const;
