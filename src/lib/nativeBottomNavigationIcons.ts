import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppColors } from "../constants/colors";
import { FooterTabBarUi } from "../constants/menu";
import { NativeBottomNavigationTabs } from "../constants/nativeBottomNavigation";

type IconSource = Awaited<ReturnType<typeof MaterialCommunityIcons.getImageSource>>;
export type NativeBottomNavigationIcons = {
  tabs: { normal: IconSource; selected: IconSource }[];
};

let cachedIcons: NativeBottomNavigationIcons | undefined;
let pendingIcons: Promise<NativeBottomNavigationIcons> | undefined;

export const getCachedNativeBottomNavigationIcons = () => cachedIcons;

export function loadNativeBottomNavigationIcons() {
  if (cachedIcons) return Promise.resolve(cachedIcons);
  if (pendingIcons) return pendingIcons;
  pendingIcons = Promise.all(NativeBottomNavigationTabs.map(async tab => {
    const [normal, selected] = await Promise.all([
      MaterialCommunityIcons.getImageSource(tab.icon, FooterTabBarUi.iconSize, AppColors.text),
      MaterialCommunityIcons.getImageSource(tab.selectedIcon, FooterTabBarUi.iconSize, AppColors.text),
    ]);
    return { normal, selected };
  })).then(tabs => {
    cachedIcons = { tabs };
    return cachedIcons;
  }).finally(() => { pendingIcons = undefined; });
  return pendingIcons;
}
