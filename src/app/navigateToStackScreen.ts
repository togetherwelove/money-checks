import {
  CommonActions,
  StackActions,
  TabActions,
  type NavigationContainerRef,
} from "@react-navigation/native";
import {
  PrimaryTabRoutes,
  type PrimaryStackScreen,
  type SignedInStackParamList,
  type SignedInTabParamList,
  type SignedInStackScreen,
} from "./signedInNavigation";

type Navigation = Pick<NavigationContainerRef<SignedInTabParamList>, "getRootState" | "dispatch">;

export function navigateToSingleInstanceStackScreen(
  navigation: Navigation,
  screen: SignedInStackScreen,
): void;
export function navigateToSingleInstanceStackScreen(
  navigation: Navigation,
  screen: "all-entries",
  params: NonNullable<SignedInStackParamList["all-entries"]>,
): void;
export function navigateToSingleInstanceStackScreen(
  navigation: Navigation,
  screen: SignedInStackScreen,
  params?: SignedInStackParamList["all-entries"],
) {
  const state = navigation.getRootState();
  if (!state) return;
  const parentScreen = screen === "share" ? "all-menu" : screen;
  const tab =
    parentScreen in PrimaryTabRoutes
      ? state.routes.find(
          (route) => route.name === PrimaryTabRoutes[parentScreen as PrimaryStackScreen],
        )
      : state.routes[state.index];
  if (!tab) return;
  const stack = tab.state;
  if (params && !stack?.key) {
    navigation.dispatch({
      ...CommonActions.navigate(tab.name, { screen, params }),
      target: state.key,
    });
    return;
  }
  if (parentScreen in PrimaryTabRoutes && tab.key !== state.routes[state.index].key) {
    navigation.dispatch({ ...TabActions.jumpTo(tab.name), target: state.key });
  }
  if (!stack?.key) return;
  const currentRoute = stack.routes[stack.index ?? 0];
  if (currentRoute?.name === screen) {
    if (params) {
      navigation.dispatch({
        ...CommonActions.setParams(params),
        source: currentRoute.key,
        target: stack.key,
      });
    }
    return;
  }
  navigation.dispatch({
    ...(stack.routes.some((route) => route.name === screen)
      ? StackActions.popTo(screen, params)
      : CommonActions.navigate(screen, params)),
    target: stack.key,
  });
}
