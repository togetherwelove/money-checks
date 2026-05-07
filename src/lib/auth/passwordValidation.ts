import {
  PasswordValidationCopy,
  PasswordValidationPolicy,
} from "../../constants/passwordValidation";

const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_PATTERN = /\d/;

export type PasswordRequirementKey = "containsLetter" | "containsNumber" | "minimumLength";

export type PasswordRequirementState = {
  isMet: boolean;
  key: PasswordRequirementKey;
  label: string;
};

export function getPasswordRequirementStates(password: string): PasswordRequirementState[] {
  return [
    {
      isMet: password.length >= PasswordValidationPolicy.minimumLength,
      key: "minimumLength",
      label: PasswordValidationCopy.minimumLength,
    },
    {
      isMet: LETTER_PATTERN.test(password),
      key: "containsLetter",
      label: PasswordValidationCopy.containsLetter,
    },
    {
      isMet: NUMBER_PATTERN.test(password),
      key: "containsNumber",
      label: PasswordValidationCopy.containsNumber,
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRequirementStates(password).every((requirement) => requirement.isMet);
}

export function isPasswordConfirmationValid(password: string, confirmPassword: string): boolean {
  return Boolean(confirmPassword) && password === confirmPassword;
}
