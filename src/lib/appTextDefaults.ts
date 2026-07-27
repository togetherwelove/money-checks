import { Text, TextInput, type TextInputProps, type TextProps } from "react-native";

import { AppTextBreakProps, ContentTextProps } from "../constants/textLayout";

type TextWithDefaultProps = typeof Text & {
  defaultProps?: TextProps;
};

type TextInputWithDefaultProps = typeof TextInput & {
  defaultProps?: TextInputProps;
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
    ...ContentTextProps,
  };

  const textInputComponent = TextInput as TextInputWithDefaultProps;
  textInputComponent.defaultProps = {
    ...textInputComponent.defaultProps,
    maxFontSizeMultiplier: ContentTextProps.maxFontSizeMultiplier,
  };
  areAppTextDefaultsInstalled = true;
}
