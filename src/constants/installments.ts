export const InstallmentStatuses = {
  prepaid: "PREPAID",
  proceeding: "PROCEEDING",
} as const;

export const InstallmentMetadataKeys = {
  isPrepaymentEntry: "is_installment_prepayment_entry",
  prepaidAt: "installment_prepaid_at",
  prepaidInstallmentCount: "prepaid_installment_count",
  status: "installment_status",
} as const;

export type InstallmentStatus =
  (typeof InstallmentStatuses)[keyof typeof InstallmentStatuses];

export const InstallmentStatusBadgeUi = {
  borderRadius: 999,
  fontSize: 10,
  horizontalPadding: 7,
  verticalPadding: 2,
} as const;
