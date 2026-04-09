# Email Password Auth Testing

Last updated: 2026-04-09
Status: active

## Covered Tests

- Email normalization trims whitespace and lowercases the address.
- Sign-in calls Supabase with the expected email and password payload.
- Sign-up calls Supabase with the expected email and password payload.
- Sign-up result distinguishes between immediate session creation and OTP-required confirmation.
- OTP verification calls `verifyOtp` with the normalized email and code.
- OTP resend calls `resend` with the `signup` type.
- Logout signs the user out without OAuth-specific logic.

## Manual Checks

1. Open the app and confirm the first screen is the sign-in screen.
2. Move to the separate sign-up screen.
3. Enter an email address and a new password.
4. Confirm that the password field can use native password suggestions on supported devices.
5. Request the sign-up code.
6. Confirm the sign-up screen moves to the OTP step and keeps the user on the same screen.
7. Enter the email OTP code and complete verification.
8. Confirm nickname onboarding appears only after the verified first sign-in.
9. Confirm notification permission onboarding appears after nickname setup.
10. Confirm logout returns to the sign-in screen.

## External Requirements

- Supabase email auth must be enabled.
- Email delivery must be configured in Supabase.
- The `Confirm signup` email template must include `{{ .Token }}`.
