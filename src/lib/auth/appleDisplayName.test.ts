import { afterEach, describe, expect, it, vi } from "vitest";

const readStoredLanguageMock = vi.hoisted(() => vi.fn<() => "ko" | "en" | null>());

vi.mock("../../i18n/languageStorage", () => ({
  readStoredLanguage: readStoredLanguageMock,
}));

describe("resolveAppleDisplayName", () => {
  afterEach(() => {
    readStoredLanguageMock.mockReset();
    vi.resetModules();
  });

  it("uses family-given order for Korean", async () => {
    readStoredLanguageMock.mockReturnValue("ko");
    const { resolveAppleDisplayName } = await import("./appleDisplayName");

    expect(
      resolveAppleDisplayName({
        fullName: {
          familyName: "강",
          givenName: "찬욱",
          middleName: null,
        },
      } as never),
    ).toEqual({
      familyName: "강",
      fullName: "강찬욱",
      givenName: "찬욱",
    });
  });

  it("uses given-family order for English", async () => {
    readStoredLanguageMock.mockReturnValue("en");
    const { resolveAppleDisplayName } = await import("./appleDisplayName");

    expect(
      resolveAppleDisplayName({
        fullName: {
          familyName: "Kang",
          givenName: "Chanwook",
          middleName: null,
        },
      } as never),
    ).toEqual({
      familyName: "Kang",
      fullName: "Chanwook Kang",
      givenName: "Chanwook",
    });
  });
});
