export const DisabledAutofillProps = {
  autoCapitalize: "none" as const,
  autoComplete: "off" as const,
  autoCorrect: false,
  importantForAutofill: "no" as const,
  textContentType: "none" as const,
};

export const OnboardingNicknameInputProps = {
  autoCapitalize: "words" as const,
  autoComplete: "off" as const,
  autoCorrect: false,
  importantForAutofill: "no" as const,
  spellCheck: false,
  textContentType: "none" as const,
};

export const NicknameAutofillProps = {
  autoCapitalize: "words" as const,
  autoComplete: "nickname" as const,
  autoCorrect: false,
  importantForAutofill: "yes" as const,
  textContentType: "nickname" as const,
};
