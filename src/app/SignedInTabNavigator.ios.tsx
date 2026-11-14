import { useAppTheme } from "../hooks/useAppTheme";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { getAppColors } from "../constants/colors";
import {
  NativeBottomNavigationTabs as destinations,
  NativeBottomNavigationUi as Ui,
} from "../constants/nativeBottomNavigation";
import { SignedInStackNavigator } from "./SignedInStackNavigator";
import { NativeTabScene } from "./NativeTabScene";
import { PrimaryTabRoutes, type SignedInTabParamList } from "./signedInNavigation";
import type { SignedInTabNavigatorProps } from "./SignedInTabNavigator.types";

const Tab = createNativeBottomTabNavigator<SignedInTabParamList>();

export function SignedInTabNavigator(props: SignedInTabNavigatorProps) {
  useAppTheme();
  return (
    <Tab.Navigator
      initialRouteName={PrimaryTabRoutes.calendar}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: getAppColors().primary,
        tabBarMinimizeBehavior: "none",
        tabBarControllerMode: "tabBar",
        overrideScrollViewContentInsetAdjustmentBehavior: false,
        tabBarRepeatedPressBehavior: { scrollToTop: false, popToTop: true },
      }}
    >
      {destinations.map((tab) => (
        <Tab.Screen
          key={tab.screen}
          name={PrimaryTabRoutes[tab.screen]}
          options={{
            title: tab.label,
            tabBarLabel: tab.label,
            tabBarSelectionEnabled: !props.disabled,
            tabBarBadge: props.badges.includes(tab.screen) ? Ui.badgeDot : undefined,
            tabBarIcon: ({ focused }) => ({
              type: "sfSymbol",
              name: focused ? tab.selectedSymbol : tab.symbol,
            }),
          }}
        >
          {() => (
            <NativeTabScene onBottomInsetChange={props.onFooterHeightChange}>
              {"renderGuestScreen" in props ? (
                props.renderGuestScreen(tab.screen)
              ) : (
                <SignedInStackNavigator {...props} initialScreen={tab.screen} />
              )}
            </NativeTabScene>
          )}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}
