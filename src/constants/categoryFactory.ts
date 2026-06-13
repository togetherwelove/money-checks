import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

export function createSystemCategory(
  id: string,
  label: string,
  iconName: CategoryIconName,
  type: LedgerEntryType,
): CategoryDefinition {
  return { iconName, id, label, source: "system", type };
}
