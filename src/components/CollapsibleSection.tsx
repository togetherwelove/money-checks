import { type ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import Collapsible from "react-native-collapsible";

import { COLLAPSIBLE_DURATION_MS } from "../constants/animation";

type CollapsibleSectionProps = {
  children: ReactNode;
  isCollapsed: boolean;
};

export function CollapsibleSection({ children, isCollapsed }: CollapsibleSectionProps) {
  const [hasActivatedAnimation, setHasActivatedAnimation] = useState(isCollapsed);

  useEffect(() => {
    if (isCollapsed) {
      setHasActivatedAnimation(true);
    }
  }, [isCollapsed]);

  if (!hasActivatedAnimation && !isCollapsed) {
    return <View>{children}</View>;
  }

  return (
    <Collapsible collapsed={isCollapsed} duration={COLLAPSIBLE_DURATION_MS} renderChildrenCollapsed>
      {children}
    </Collapsible>
  );
}
