import type { FooterTabScreen } from "../lib/footerTabs";
import type { SignedInStackNavigatorProps } from "./SignedInStackNavigator";

export type SignedInTabNavigatorProps = SignedInStackNavigatorProps & {
  disabled: boolean;
  badges: FooterTabScreen[];
  onOpenEntry: () => void;
  onFooterHeightChange: (height: number) => void;
};
