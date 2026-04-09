# Testing Workflow

Last updated: 2026-04-03
Status: active

## Goal

Keep feature work aligned with use cases, automated tests, and a single app environment file.

## Environment

Supabase target mapping:

- `/.supabase/projects.example.json`
- `pnpm supabase:link:dev`
- `pnpm supabase:link:test`
- `pnpm supabase:functions:deploy:dev`
- `pnpm supabase:functions:deploy:test`

The app uses root `.env` only. If you need a different backend target, update `.env` explicitly before testing destructive flows.

## Default Delivery Order

1. Review or update the relevant use case.
2. Add or update automated tests.
3. Implement the feature.
4. Refactor if needed.
5. Run `pnpm verify`.

## Reference Records

- [records/use-cases.md](/C:/git/money-checks/records/use-cases.md)
- [records/email-password-auth-use-case.md](/C:/git/money-checks/records/email-password-auth-use-case.md)
- [records/test-inventory.md](/C:/git/money-checks/records/test-inventory.md)
- [records/email-password-auth-testing.md](/C:/git/money-checks/records/email-password-auth-testing.md)

## Notes

- `pnpm test` includes mobile tests and pure handler tests under `supabase/functions`.
- `pnpm verify` is the compact final verification command.

