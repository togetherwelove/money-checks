import { selectStaticCopy } from "../i18n/staticCopy";
import { CommonActionCopy } from "./commonActions";

export const SharedLedgerJoinPreviewCopy = {
  ...selectStaticCopy({
    en: {
      alreadyPending: "A join request is already pending.",
      accessibleLimit: "You have used all available ledgers.",
      approvalMergeReady: "Personal ledger will be merged on approval.",
      approvalNeedsMergeConfirmation: "Ask this member to request again after confirming merge.",
      confirmMergeAction: "Send Request",
      confirmMergeMessage:
        "Your current personal ledger records will be moved to the shared ledger after approval. The personal ledger will be deleted.",
      confirmMergeTitle: "Merge Personal Ledger",
      confirmRequestAction: "Send Request",
      confirmRequestMessage: "After approval, this ledger will be added to your ledger list.",
      confirmRequestTitle: "Request Access",
      editorBlocked:
        "Free plan can use one ledger. Leave your current shared ledger before joining another one.",
      invalidCode: "Enter a valid share code.",
      joinCooldown: "Please wait before requesting this ledger again.",
      ownerBlocked:
        "Owners of shared ledgers with members cannot join another ledger on the Free plan.",
      targetMemberLimit: "This shared ledger has reached its member limit.",
    },
    ko: {
      alreadyPending: "이미 참여 요청이 대기 중이에요.",
      accessibleLimit: "사용 가능한 가계부 개수를 모두 사용했어요.",
      approvalMergeReady: "승인 시 개인 가계부가 병합돼요.",
      approvalNeedsMergeConfirmation: "상대가 병합에 동의한 뒤 다시 요청해야 해요.",
      confirmMergeAction: "요청 보내기",
      confirmMergeMessage:
        "승인되면 현재 개인 가계부의 기록이 공유 가계부로 옮겨지고 개인 가계부는 삭제돼요.",
      confirmMergeTitle: "개인 가계부 병합",
      confirmRequestAction: "요청 보내기",
      confirmRequestMessage: "승인되면 이 가계부가 내 가계부 목록에 추가돼요.",
      confirmRequestTitle: "참여 요청",
      editorBlocked:
        "Free 플랜에서는 하나의 가계부만 사용할 수 있어요. 현재 공유 가계부에서 나간 뒤 다시 시도해 주세요.",
      invalidCode: "올바른 공유 코드를 입력해 주세요.",
      joinCooldown: "이 가계부는 잠시 후 다시 요청할 수 있어요.",
      ownerBlocked: "구성원이 있는 가계부의 소유자는 Free 플랜에서 다른 가계부에 참여할 수 없어요.",
      targetMemberLimit: "이 공유 가계부는 구성원 한도에 도달했어요.",
    },
  } as const),
  cancelAction: CommonActionCopy.cancel,
} as const;
