import { describe, expect, it } from "vitest";

import { resolveFallbackDisplayName } from "./sessionDisplayName";

describe("resolveFallbackDisplayName", () => {
  it("returns a profile name from known metadata keys", () => {
    expect(resolveFallbackDisplayName({ full_name: "홍길동" }, "user@example.com")).toBe("홍길동");
    expect(resolveFallbackDisplayName({ name: "홍길동" }, "user@example.com")).toBe("홍길동");
  });

  it("does not use email as a display name fallback", () => {
    expect(resolveFallbackDisplayName(undefined, "user@example.com")).toBe("");
  });
});
