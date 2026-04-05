# Testing Workflow

Last updated: 2026-04-03
Status: active

## Goal

Keep feature work aligned with use cases, automated tests, and environment separation.

## Environment Split

Mobile app env files:

- `apps/mobile/.env.development`
- `apps/mobile/.env.test`

Switch commands:

- `pnpm env:mobile:dev`
- `pnpm env:mobile:test`

Supabase target mapping:

- `/.supabase/projects.example.json`
- `pnpm supabase:link:dev`
- `pnpm supabase:link:test`
- `pnpm supabase:functions:deploy:dev`
- `pnpm supabase:functions:deploy:test`

Always keep the app env target and Supabase target aligned before testing destructive flows.

## Default Delivery Order

1. Review or update the relevant use case.
2. Add or update automated tests.
3. Implement the feature.
4. Refactor if needed.
5. Run `pnpm verify:mobile`.

## Reference Records

- [records/use-cases.md](/C:/git/money-checks/records/use-cases.md)
- [records/email-password-auth-use-case.md](/C:/git/money-checks/records/email-password-auth-use-case.md)
- [records/test-inventory.md](/C:/git/money-checks/records/test-inventory.md)
- [records/email-password-auth-testing.md](/C:/git/money-checks/records/email-password-auth-testing.md)

## Notes

- `pnpm --filter mobile test` includes mobile tests and pure handler tests under `supabase/functions`.
- `pnpm verify:mobile` is the compact final verification command.
