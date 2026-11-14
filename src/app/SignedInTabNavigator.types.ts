import type { FooterTabScreen } from "../lib/footerTabs";
import type { SignedInStackNavigatorProps } from "./SignedInStackNavigator";
import type { ReactNode } from "react";
import type { PrimaryStackScreen } from "./signedInNavigation";

type TabShellProps = {
  disabled: boolean;
  badges: FooterTabScreen[];
  onFooterHeightChange: (height: number) => void;
};

export type SignedInTabNavigatorProps = TabShellProps &
  (
    | SignedInStackNavigatorProps
    | {
        renderGuestScreen: (screen: PrimaryStackScreen) => ReactNode;
      }
  );
