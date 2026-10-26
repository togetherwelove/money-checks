import { createNativeBottomTabNavigator, type NativeBottomTabNavigationOptions } from "@react-navigation/bottom-tabs/unstable";
import { useEffect, useState } from "react";
import { AppColors } from "../constants/colors";
import { NativeBottomNavigationTabs as destinations, NativeBottomNavigationUi as Ui } from "../constants/nativeBottomNavigation";
import { getCachedNativeBottomNavigationIcons, loadNativeBottomNavigationIcons, type NativeBottomNavigationIcons } from "../lib/nativeBottomNavigationIcons";
import { SessionLoadingScreen } from "../components/SessionLoadingScreen";
import { SignedInStackNavigator } from "./SignedInStackNavigator";
import { NativeTabScene } from "./NativeTabScene";
import { PrimaryTabRoutes, type SignedInTabParamList } from "./signedInNavigation";
import type { SignedInTabNavigatorProps } from "./SignedInTabNavigator.types";

const Tab = createNativeBottomTabNavigator<SignedInTabParamList>();
const options: NativeBottomTabNavigationOptions = {
  headerShown: false, lazy: false, tabBarActiveTintColor: AppColors.primary,
  tabBarMinimizeBehavior: "none", tabBarControllerMode: "tabBar",
  overrideScrollViewContentInsetAdjustmentBehavior: false,
  tabBarRepeatedPressBehavior: { scrollToTop: false, popToTop: true },
};

export function SignedInTabNavigator(props: SignedInTabNavigatorProps) {
  const [icons, setIcons] = useState<NativeBottomNavigationIcons | null | undefined>(getCachedNativeBottomNavigationIcons);
  useEffect(() => {
    if (icons !== undefined) return;
    let active = true;
    void loadNativeBottomNavigationIcons().then(value => { if (active) setIcons(value); })
      .catch(() => { if (active) setIcons(null); });
    return () => { active = false; };
  }, [icons]);
  if (icons === undefined) return <SessionLoadingScreen />;
  return <Tab.Navigator initialRouteName={PrimaryTabRoutes.calendar} backBehavior="history" screenOptions={options}>
    {destinations.map((tab, index) => <Tab.Screen key={tab.screen} name={PrimaryTabRoutes[tab.screen]}
      options={{ title: tab.label, tabBarLabel: tab.label, tabBarSelectionEnabled: !props.disabled,
        tabBarBadge: props.badges.includes(tab.screen) ? Ui.badgeDot : undefined,
        tabBarIcon: ({ focused }) => {
          const source = focused ? icons?.tabs[index]?.selected : icons?.tabs[index]?.normal;
          return source ? { type: "image", source } : { type: "sfSymbol", name: focused ? tab.selectedSymbol : tab.symbol };
        },
      }}>
      {() => <NativeTabScene onBottomInsetChange={props.onFooterHeightChange}>
        <SignedInStackNavigator {...props} initialScreen={tab.screen} entryActionDisabled={props.disabled} />
      </NativeTabScene>}
    </Tab.Screen>)}
  </Tab.Navigator>;
}
