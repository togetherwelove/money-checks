import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppBottomNavigation } from "../components/AppBottomNavigation";
import { NativeBottomNavigationTabs as destinations } from "../constants/nativeBottomNavigation";
import { PrimaryTabRoutes, type SignedInTabParamList } from "./signedInNavigation";
import { SignedInStackNavigator } from "./SignedInStackNavigator";
import type { SignedInTabNavigatorProps } from "./SignedInTabNavigator.types";

const Tab = createBottomTabNavigator<SignedInTabParamList>();

export function SignedInTabNavigator(props: SignedInTabNavigatorProps) {
  return <Tab.Navigator initialRouteName={PrimaryTabRoutes.calendar} backBehavior="history" screenOptions={{ headerShown: false }}
    tabBar={({ state, navigation }) => <AppBottomNavigation
      activeScreen={destinations.find(tab => PrimaryTabRoutes[tab.screen] === state.routes[state.index].name)?.screen ?? "calendar"}
      disabled={props.disabled} badges={props.badges}
      onLayout={event => props.onFooterHeightChange(event.nativeEvent.layout.height)}
      onSelect={screen => {
        if (screen in PrimaryTabRoutes) navigation.navigate(PrimaryTabRoutes[screen as keyof typeof PrimaryTabRoutes]);
      }} />}>
    {destinations.map(tab => <Tab.Screen key={tab.screen} name={PrimaryTabRoutes[tab.screen]}>
      {() => <SignedInStackNavigator {...props} initialScreen={tab.screen} />}
    </Tab.Screen>)}
  </Tab.Navigator>;
}
