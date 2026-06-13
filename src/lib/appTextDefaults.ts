import { Text, type TextProps } from "react-native";

import { AppTextBreakProps } from "../constants/textLayout";

type TextWithDefaultProps = typeof Text & {
  defaultProps?: TextProps;
};

let areAppTextDefaultsInstalled = false;

export function installAppTextDefaults(): void {
  if (areAppTextDefaultsInstalled) {
    return;
  }

  const textComponent = Text as TextWithDefaultProps;
  textComponent.defaultProps = {
    ...textComponent.defaultProps,
    ...AppTextBreakProps,
  };
  areAppTextDefaultsInstalled = true;
}
