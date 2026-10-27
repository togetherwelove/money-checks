import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import type { AppMenuItem } from "../lib/menuItems";

export type AllMenuActionsOptions = {
  activeBookId: string | null;
  canManageCategories: boolean;
  onSelectMenuItem: (item: AppMenuItem) => void;
};

export function useAllMenuActions({
  activeBookId,
  canManageCategories,
  onSelectMenuItem,
}: AllMenuActionsOptions) {
  const [categoryBookId, setCategoryBookId] = useState<string | null>(null);
  useEffect(() => {
    setCategoryBookId(null);
  }, [activeBookId, canManageCategories]);

  const selectMenuItem = (item: AppMenuItem) => {
    if (item.disabled) return;
    Keyboard.dismiss();
    if ("action" in item && item.action === "manage-categories") {
      if (activeBookId && canManageCategories) setCategoryBookId(activeBookId);
      return;
    }
    onSelectMenuItem(item);
  };

  return {
    categoryBookId: canManageCategories && categoryBookId === activeBookId ? categoryBookId : null,
    selectMenuItem,
    closeCategories: () => setCategoryBookId(null),
  };
}
