import { EntryRegistrationCopy } from "../constants/entryRegistration";

export function resolveLedgerSaveErrorMessage(error: unknown): string {
  const errorText = extractLedgerSaveErrorText(error);

  if (isMissingInstallmentTransactionMigration(error)) {
    return EntryRegistrationCopy.saveMigrationError;
  }

  if (
    errorText.includes("column") &&
    (errorText.includes("content") ||
      errorText.includes("installment_group_id") ||
      errorText.includes("installment_months") ||
      errorText.includes("installment_order")) &&
    errorText.includes("does not exist")
  ) {
    return EntryRegistrationCopy.saveMigrationError;
  }

  return EntryRegistrationCopy.saveError;
}

export function isMissingInstallmentTransactionMigration(error: unknown): boolean {
  const errorText = extractLedgerSaveErrorText(error);
  const referencesInstallmentTransaction =
    errorText.includes("delete_installment_group") ||
    errorText.includes("prepay_installment_group");
  return (
    referencesInstallmentTransaction &&
    (errorText.includes("could not find") || errorText.includes("does not exist"))
  );
}

function extractLedgerSaveErrorText(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as {
    details?: string | null;
    hint?: string | null;
    message?: string | null;
  };

  return [candidate.message, candidate.details, candidate.hint].filter(Boolean).join(" ");
}
