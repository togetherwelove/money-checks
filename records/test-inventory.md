# Test Inventory

Last updated: 2026-04-03
Status: active

## Goal

Track the automated tests that currently run in this project and clarify what each test protects.

## Commands

- `pnpm test:mobile`
- `pnpm test:mobile:watch`
- `pnpm test:mobile:coverage`
- `pnpm test`
- `pnpm verify:mobile`

## Active Tests

### Mobile logic

- [expenseThresholds.test.ts](/C:/git/money-checks/src/notifications/application/expenseThresholds.test.ts)
  - Expense threshold calculations and notification trigger boundaries
- [sharedLedgerJoinError.test.ts](/C:/git/money-checks/src/lib/sharedLedgerJoinError.test.ts)
  - Shared ledger join error mapping
- [deleteAccountRequest.test.ts](/C:/git/money-checks/src/lib/auth/deleteAccountRequest.test.ts)
  - Client account deletion request handling
- [authOnboarding.test.ts](/C:/git/money-checks/src/lib/authOnboarding.test.ts)
  - Nickname and notification onboarding step resolution
- [emailPasswordAuth.test.ts](/C:/git/money-checks/src/lib/auth/emailPasswordAuth.test.ts)
  - Email sign-up, sign-in, and sign-out behavior
- [sessionState.test.ts](/C:/git/money-checks/src/hooks/sessionState.test.ts)
  - Initial session loading and fallback behavior
- [monthlyInsights.test.ts](/C:/git/money-checks/src/utils/monthlyInsights.test.ts)
  - Monthly comparison and category insight calculations
- [menuItems.test.ts](/C:/git/money-checks/src/lib/menuItems.test.ts)
  - Menu item composition rules
- [joinRequestBlock.test.ts](/C:/git/money-checks/src/components/sharedLedgerPanel/joinRequestBlock.test.ts)
  - Shared ledger join blocking rules for owner and editor roles
- [appHeaderTitle.test.ts](/C:/git/money-checks/src/lib/appHeaderTitle.test.ts)
  - Header title selection rules
- [appPlatform.test.ts](/C:/git/money-checks/src/lib/appPlatform.test.ts)
  - Centralized platform capability rules
- [entryDatePickerMode.test.ts](/C:/git/money-checks/src/lib/entryDatePickerMode.test.ts)
  - Entry date picker mode selection
- [categoryOrder.test.ts](/C:/git/money-checks/src/lib/categoryOrder.test.ts)
  - Category order persistence rules
- [categoryGrid.test.ts](/C:/git/money-checks/src/lib/categoryGrid.test.ts)
  - Category grid positioning rules

### Supabase function handlers

- [deleteAccountHandler.test.ts](/C:/git/money-checks/supabase/functions/delete-account/deleteAccountHandler.test.ts)
  - Server-side account deletion handler branches

## Gaps

The following areas still rely mainly on manual checks:

- Shared ledger request approval and rejection end-to-end flows
- Realtime notifications for shared ledger membership and entries
- Input screen interaction details
- Chart screen presentation behavior
- Native date picker behavior on device

