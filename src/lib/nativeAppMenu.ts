import type { MenuAction } from "@react-native-menu/menu";

import { AppColors } from "../constants/colors";
import { NativeAppMenuIcons } from "../constants/nativeAppMenu";
import type { AppMenuItem, AppMenuSection } from "./menuItems";

export function getAppMenuItemId(item: AppMenuItem): string {
  return "targetScreen" in item ? item.targetScreen : item.action;
}

export function buildNativeAppMenuActions(sections: AppMenuSection[]): MenuAction[] {
  return sections.filter((section) => section.items.length > 0).map((section) => ({
    title: section.label,
    displayInline: true,
    subactions: section.items.map((item) => ({
      id: getAppMenuItemId(item),
      title: item.label,
      image: NativeAppMenuIcons[item.icon],
      imageColor: AppColors.text,
    })),
  }));
}
