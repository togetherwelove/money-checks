import { describe, expect, it } from "vitest";

import { isMissingUserRecordError } from "./missingUserRecordError";

describe("isMissingUserRecordError", () => {
  it("returns true for the deleted user profile bootstrap error", () => {
    expect(
      isMissingUserRecordError({
        code: "23503",
        details: 'Key is not present in table "users".',
        message:
          'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"',
      }),
    ).toBe(true);
  });

  it("returns false for unrelated database errors", () => {
    expect(
      isMissingUserRecordError({
        code: "23503",
        details: "Some other details",
        message: "Different constraint",
      }),
    ).toBe(false);
  });
});
