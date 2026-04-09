import type { Feather } from "@expo/vector-icons";

import type { LedgerEntryType } from "./ledger";

export type CategoryIconName = keyof typeof Feather.glyphMap;

export type CategorySource = "system" | "custom";

export type CategoryDefinition = {
  iconName: CategoryIconName;
  id: string;
  label: string;
  source: CategorySource;
  type: LedgerEntryType;
};

export type StoredCustomCategory = {
  iconName: CategoryIconName;
  id: string;
  label: string;
};
