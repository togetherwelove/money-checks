import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import type { CategoryDefinition, CategoryIconName, StoredCustomCategory } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import type { LedgerBookCategoryCustomizationRow } from "../types/supabase";
import { logAppError } from "./logAppError";
import { supabase } from "./supabase";

const LEDGER_BOOK_CATEGORY_CUSTOMIZATIONS_TABLE = "ledger_book_category_customizations";
const REPLACE_LEDGER_BOOK_CUSTOM_CATEGORIES_FUNCTION = "replace_ledger_book_custom_categories";
const REPLACE_LEDGER_BOOK_SYSTEM_CATEGORY_CUSTOMIZATIONS_FUNCTION =
  "replace_ledger_book_system_category_customizations";
const LEDGER_BOOK_CATEGORY_CHANNEL_PREFIX = "ledger-book-categories";
const HTML_ERROR_RESPONSE_PREFIX = "<!DOCTYPE html>";
const BAD_GATEWAY_ERROR_TEXT = "Bad gateway";
const HTML_ERROR_LOG_MESSAGE = "Supabase returned an HTML error response.";
const BAD_GATEWAY_ERROR_LOG_MESSAGE = "Supabase returned a 502 Bad Gateway response.";

let categoryChannelSequence = 0;

type LedgerBookCustomCategoryPayload = {
  icon_name: CategoryIconName;
  id: string;
  label: string;
  sort_order: number | null;
};

export type LedgerBookCategoryCustomization = {
  categoryOrderIds: string[];
  customCategories: CategoryDefinition[];
  hiddenSystemCategoryIds: string[];
  systemCategoryIconOverrides: Record<string, CategoryIconName>;
  systemCategoryLabelOverrides: Record<string, string>;
};

export async function fetchLedgerBookCategoryCustomization(
  bookId: string,
  entryType: LedgerEntryType,
): Promise<LedgerBookCategoryCustomization> {
  const { data, error } = await supabase
    .from(LEDGER_BOOK_CATEGORY_CUSTOMIZATIONS_TABLE)
    .select("book_id, category_id, entry_type, icon_name, is_hidden, is_system, label, sort_order")
    .eq("book_id", bookId)
    .eq("entry_type", entryType)
    .returns<LedgerBookCategoryCustomizationRow[]>();

  if (error) {
    throw error;
  }

  return mapLedgerBookCategoryCustomization(entryType, data ?? []);
}

export async function replaceLedgerBookCustomCategories(
  bookId: string,
  entryType: LedgerEntryType,
  customCategories: readonly StoredCustomCategory[],
  categoryOrderIds: readonly string[] = [],
): Promise<void> {
  const uniqueCategoryOrderIds = uniqueStrings(categoryOrderIds);
  const categoriesPayload = uniqueCustomCategories(customCategories).map((category) =>
    toLedgerBookCustomCategoryPayload(category, uniqueCategoryOrderIds),
  );
  const { error } = await supabase.rpc(REPLACE_LEDGER_BOOK_CUSTOM_CATEGORIES_FUNCTION, {
    categories: categoriesPayload,
    target_book_id: bookId,
    target_entry_type: entryType,
  });

  if (error) {
    throw error;
  }
}

function toLedgerBookCustomCategoryPayload(
  category: StoredCustomCategory,
  categoryOrderIds: readonly string[],
): LedgerBookCustomCategoryPayload {
  const orderIndex = categoryOrderIds.indexOf(category.id);
  return {
    icon_name: category.iconName,
    id: category.id,
    label: category.label,
    sort_order: orderIndex >= 0 ? orderIndex : null,
  };
}

export async function replaceLedgerBookSystemCategoryCustomizations(
  bookId: string,
  entryType: LedgerEntryType,
  params: {
    hiddenSystemCategoryIds: readonly string[];
    categoryOrderIds: readonly string[];
    systemCategoryIconOverrides: Record<string, CategoryIconName>;
    systemCategoryLabelOverrides: Record<string, string>;
  },
): Promise<void> {
  const { error } = await supabase.rpc(
    REPLACE_LEDGER_BOOK_SYSTEM_CATEGORY_CUSTOMIZATIONS_FUNCTION,
    {
      category_order_ids: uniqueStrings(params.categoryOrderIds),
      hidden_category_ids: uniqueStrings(params.hiddenSystemCategoryIds),
      icon_overrides: params.systemCategoryIconOverrides,
      label_overrides: params.systemCategoryLabelOverrides,
      target_book_id: bookId,
      target_entry_type: entryType,
    },
  );

  if (error) {
    throw error;
  }
}

function uniqueCustomCategories(
  categories: readonly StoredCustomCategory[],
): StoredCustomCategory[] {
  const uniqueCategoriesById = new Map<string, StoredCustomCategory>();
  for (const category of categories) {
    uniqueCategoriesById.set(category.id, category);
  }

  return [...uniqueCategoriesById.values()];
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function subscribeToLedgerBookCategoryChanges(params: {
  bookId: string;
  entryType: LedgerEntryType;
  onChange: () => void;
}): () => void {
  const { bookId, entryType, onChange } = params;
  categoryChannelSequence += 1;
  const channel = supabase
    .channel(
      `${LEDGER_BOOK_CATEGORY_CHANNEL_PREFIX}-${bookId}-${entryType}-${categoryChannelSequence}`,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: LEDGER_BOOK_CATEGORY_CUSTOMIZATIONS_TABLE,
        filter: `book_id=eq.${bookId}`,
      },
      (payload) => {
        const changedRow = resolveChangedCategoryCustomizationRow(payload);
        if (changedRow && changedRow.entry_type !== entryType) {
          return;
        }

        onChange();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function mapLedgerBookCategoryCustomization(
  entryType: LedgerEntryType,
  rows: readonly LedgerBookCategoryCustomizationRow[],
): LedgerBookCategoryCustomization {
  const customCategories: CategoryDefinition[] = [];
  const hiddenSystemCategoryIds: string[] = [];
  const orderedRows = rows
    .filter((row) => typeof row.sort_order === "number")
    .sort((firstRow, secondRow) => (firstRow.sort_order ?? 0) - (secondRow.sort_order ?? 0));
  const categoryOrderIds = orderedRows.map((row) => row.category_id);
  const systemCategoryIconOverrides: Record<string, CategoryIconName> = {};
  const systemCategoryLabelOverrides: Record<string, string> = {};

  for (const row of rows) {
    if (row.is_system) {
      if (row.is_hidden) {
        hiddenSystemCategoryIds.push(row.category_id);
      }

      if (row.icon_name) {
        systemCategoryIconOverrides[row.category_id] = row.icon_name as CategoryIconName;
      }
      if (row.label) {
        systemCategoryLabelOverrides[row.category_id] = row.label;
      }
      continue;
    }

    if (!row.label || !row.icon_name) {
      continue;
    }

    customCategories.push({
      iconName: row.icon_name as CategoryIconName,
      id: row.category_id,
      label: row.label,
      source: "custom",
      type: entryType,
    });
  }

  return {
    categoryOrderIds,
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides,
  };
}

function resolveChangedCategoryCustomizationRow(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): LedgerBookCategoryCustomizationRow | null {
  const row = payload.eventType === "DELETE" ? payload.old : payload.new;
  if (!row || typeof row.entry_type !== "string") {
    return null;
  }

  return row as LedgerBookCategoryCustomizationRow;
}

export function logLedgerBookCategorySyncError(error: unknown, context: Record<string, unknown>) {
  logAppError("LedgerBookCategories", normalizeLedgerBookCategorySyncError(error), context);
}

function normalizeLedgerBookCategorySyncError(error: unknown) {
  const message = resolveErrorMessage(error);
  if (!message?.startsWith(HTML_ERROR_RESPONSE_PREFIX)) {
    return error;
  }

  return {
    message: message.includes(BAD_GATEWAY_ERROR_TEXT)
      ? BAD_GATEWAY_ERROR_LOG_MESSAGE
      : HTML_ERROR_LOG_MESSAGE,
  };
}

function resolveErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}
