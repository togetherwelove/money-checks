# Email Password Auth Testing

Last updated: 2026-04-04
Status: active

## Covered Tests

- Email normalization trims whitespace and lowercases the address.
- Sign-up calls Supabase with the expected email and password payload.
- Sign-in calls Supabase with the expected email and password payload.
- Sign-up result distinguishes between immediate session creation and email confirmation.
- Logout signs the user out without OAuth-specific logic.
- Platform config stays independent from OAuth URL callbacks.

## Manual Checks

1. Open the app in Expo Go.
2. Switch to sign-up mode.
3. Enter an email address and a new password.
4. Confirm that the password field can use native password suggestions on supported devices.
5. Complete sign-up.
6. If email confirmation is required, confirm that the screen clearly says email verification is required before login.
7. Switch to sign-in mode and log in with the created account.
8. Confirm nickname onboarding appears for a first login.
9. Confirm notification permission onboarding appears after nickname setup.
10. Confirm logout returns to the email auth screen.

## External Requirements

- Supabase email auth must be enabled.
- If email confirmation is enabled, email delivery must be configured in Supabase.
