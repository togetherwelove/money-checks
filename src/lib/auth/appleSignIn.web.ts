import { AppleAuthCopy } from "../../constants/appleAuth";

export function canUseAppleSignIn(): boolean {
  return false;
}

export function isAppleSignInCancelled(_error: unknown): boolean {
  return false;
}

export async function signInWithApple(): Promise<void> {
  throw new Error(AppleAuthCopy.unavailableError);
}
