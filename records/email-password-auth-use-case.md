# Email Password Auth Use Case

Last updated: 2026-04-09
Status: active

## Goal

Keep the first screen focused on sign-in, and move account creation into a separate sign-up screen with email OTP verification.

## Sign-in Flow

1. The user opens the app and lands on the sign-in screen.
2. The user enters an email address and password.
3. The app signs the user in with Supabase email/password auth.
4. If authentication succeeds, onboarding continues only when still required.
5. If onboarding is already complete, the calendar screen opens.

## Sign-up Flow

1. The user opens the sign-in screen.
2. The user chooses the sign-up action and moves to the dedicated sign-up screen.
3. The user enters an email address.
4. The user enters a new password using native password suggestions when available.
5. The user confirms the password.
6. The app requests sign-up from Supabase.
7. If Supabase requires email confirmation, the sign-up screen moves to the OTP step.
8. The user enters the email OTP code on the same sign-up screen.
9. The app verifies the code with Supabase.
10. Once verification succeeds, the signed-in onboarding flow continues.

## Guardrails

- The sign-in screen and sign-up screen are separate views.
- Technical auth errors are logged to the console, not rendered as raw error text.
- Sign-up must not proceed until email, password, and password confirmation are all valid.
- OTP verification must not proceed with an empty code.
- The flow must not depend on OAuth redirects, browser origins, or deep links.

## External Requirement

- Supabase Email Auth must be enabled.
- `Confirm email` must stay enabled for OTP-based sign-up verification.
- The Supabase `Confirm signup` email template must expose `{{ .Token }}` so the user receives a code, not only a confirmation link.

## Failure Flow

- If sign-in fails, the user stays on the sign-in screen.
- If sign-up fails, the user stays on the credential step.
- If OTP verification fails, the user stays on the OTP step.
- If session restoration fails, the app returns to the sign-in screen.
