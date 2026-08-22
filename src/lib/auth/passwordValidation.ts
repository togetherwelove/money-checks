import { AuthRequirements } from "../../constants/authRequirements";

const LOWERCASE_LETTER_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /\d/;
const UPPERCASE_LETTER_PATTERN = /[A-Z]/;

export type PasswordRequirementKey =
  | "containsLowercaseLetter"
  | "containsNumber"
  | "containsUppercaseLetter"
  | "minimumLength";

export type PasswordRequirementState = {
  isMet: boolean;
  key: PasswordRequirementKey;
  label: string;
};

export function getPasswordRequirementStates(password: string): PasswordRequirementState[] {
  return [
    {
      isMet: password.length >= AuthRequirements.passwordMinimumLength,
      key: "minimumLength",
      label: `${AuthRequirements.passwordMinimumLength}자 이상 입력`,
    },
    {
      isMet: LOWERCASE_LETTER_PATTERN.test(password),
      key: "containsLowercaseLetter",
      label: "영문 소문자를 1자 이상 포함",
    },
    {
      isMet: UPPERCASE_LETTER_PATTERN.test(password),
      key: "containsUppercaseLetter",
      label: "영문 대문자를 1자 이상 포함",
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
