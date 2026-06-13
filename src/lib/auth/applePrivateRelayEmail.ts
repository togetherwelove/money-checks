const APPLE_PRIVATE_RELAY_EMAIL_DOMAIN = "@privaterelay.appleid.com";

export function isApplePrivateRelayEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(APPLE_PRIVATE_RELAY_EMAIL_DOMAIN);
}
