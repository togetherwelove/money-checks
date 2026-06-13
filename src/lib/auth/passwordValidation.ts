const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_PATTERN = /\d/;
const PASSWORD_MINIMUM_LENGTH = 8;

export type PasswordRequirementKey = "containsLetter" | "containsNumber" | "minimumLength";

export type PasswordRequirementState = {
  isMet: boolean;
  key: PasswordRequirementKey;
  label: string;
};

export function getPasswordRequirementStates(password: string): PasswordRequirementState[] {
  return [
    {
      isMet: password.length >= PASSWORD_MINIMUM_LENGTH,
      key: "minimumLength",
      label: `${PASSWORD_MINIMUM_LENGTH}자 이상 입력`,
    },
    {
      isMet: LETTER_PATTERN.test(password),
      key: "containsLetter",
      label: "영문을 1자 이상 포함",
    },
    {
      isMet: NUMBER_PATTERN.test(password),
      key: "containsNumber",
      label: "숫자를 1자 이상 포함",
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRequirementStates(password).every((requirement) => requirement.isMet);
}

export function isPasswordConfirmationValid(password: string, confirmPassword: string): boolean {
  return Boolean(confirmPassword) && password === confirmPassword;
}
