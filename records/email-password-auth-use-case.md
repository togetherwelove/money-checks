# Email Password Auth Use Case

Last updated: 2026-04-04
Status: active

## Goal

Replace email OTP with email sign-up and sign-in that works consistently in Expo Go, native builds, and web.

## Sign-up Flow

1. The user opens the login screen.
2. The user switches to sign-up mode.
3. The user enters an email address.
4. The user enters a password in a field that can use native password suggestions.
5. The user confirms the password.
6. The app asks Supabase to create the account.
7. If Supabase returns a session immediately, onboarding continues.
8. If Supabase requires email confirmation, the app stays on the auth screen and clearly tells the user to verify the email before logging in.

## Sign-in Flow

1. The user opens the login screen.
2. The user stays in sign-in mode.
3. The user enters an email address and password.
4. The app asks Supabase to sign the user in.
5. If authentication succeeds, onboarding continues if needed.
6. If onboarding is already complete, the calendar screen opens.

## Guardrails

- Technical errors are logged to the console, not rendered as raw error banners.
- Submit actions stay disabled until the required fields are filled.
- Sign-up stays disabled until the password confirmation matches.
- The flow must not depend on OAuth redirects, browser origin values, or deep links.

## Failure Flow

- If sign-up fails, the app stays on the auth screen and logs the error.
- If sign-in fails, the app stays on the auth screen and logs the error.
- If session restoration fails, the auth screen is shown again.

## Follow-up Flow

- The user can switch between sign-up and sign-in without leaving the screen.
- Account logout returns to the email auth screen.
