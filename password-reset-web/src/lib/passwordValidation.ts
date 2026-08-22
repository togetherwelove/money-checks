import { PasswordRequirements } from "../config/passwordReset";

export type PasswordValidation = {
  confirmation: boolean;
  digit: boolean;
  lowercase: boolean;
  minimumLength: boolean;
  uppercase: boolean;
};

export function validatePassword(password: string, confirmPassword: string): PasswordValidation {
  return {
    confirmation: Boolean(confirmPassword) && password === confirmPassword,
    digit: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    minimumLength: password.length >= PasswordRequirements.minimumLength,
    uppercase: /[A-Z]/.test(password),
  };
}

export function isPasswordValidationComplete(validation: PasswordValidation): boolean {
  return Object.values(validation).every(Boolean);
}
