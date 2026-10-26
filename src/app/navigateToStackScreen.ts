import { CommonActions, StackActions, TabActions, type NavigationContainerRef } from "@react-navigation/native";
import { PrimaryTabRoutes, type PrimaryStackScreen, type SignedInTabParamList, type SignedInStackScreen } from "./signedInNavigation";

type Navigation = Pick<NavigationContainerRef<SignedInTabParamList>, "getRootState" | "dispatch">;

export function navigateToSingleInstanceStackScreen(navigation: Navigation, screen: SignedInStackScreen) {
  const state = navigation.getRootState();
  if (!state) return;
  const tab = screen in PrimaryTabRoutes
    ? state.routes.find(route => route.name === PrimaryTabRoutes[screen as PrimaryStackScreen])
    : state.routes[state.index];
  if (!tab) return;
  if (screen in PrimaryTabRoutes && tab.key !== state.routes[state.index].key) {
    navigation.dispatch({ ...TabActions.jumpTo(tab.name), target: state.key });
  }
  const stack = tab.state;
  if (!stack?.key || stack.routes[stack.index ?? 0]?.name === screen) return;
  navigation.dispatch({
    ...(stack.routes.some(route => route.name === screen) ? StackActions.popTo(screen) : CommonActions.navigate(screen)),
    target: stack.key,
  });
}
