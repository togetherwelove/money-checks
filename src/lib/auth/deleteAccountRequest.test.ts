import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { deleteAccountRequest } from "./deleteAccountRequest";

describe("deleteAccountRequest", () => {
  const accessToken = "sample-token";
  const functionUrl = "https://example.supabase.co/functions/v1/delete-account";
  const publishableKey = "publishable-key";

  it("throws the server error message when the request is rejected", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "?ㅻⅨ 硫ㅻ쾭瑜?癒쇱? ?뺣━??二쇱꽭??" }), {
          status: 409,
        }),
    );

    await expect(
      deleteAccountRequest({
        accessToken,
        fetchFn,
        functionUrl,
        publishableKey,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow("?ㅻⅨ 硫ㅻ쾭瑜?癒쇱? ?뺣━??二쇱꽭??");
  });

  it("falls back to the generic error when the function response has no body", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 500 }));

    await expect(
      deleteAccountRequest({
        accessToken,
        fetchFn,
        functionUrl,
        publishableKey,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow(AccountDeletionMessages.errorFallback);
  });

  it("uses the plain text response when the function body is not JSON", async () => {
    const fetchFn = vi.fn(async () => new Response("Invalid JWT", { status: 401 }));

    await expect(
      deleteAccountRequest({
        accessToken,
        fetchFn,
        functionUrl,
        publishableKey,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow("Invalid JWT");
  });

  it("signs out locally on success", async () => {
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const onDeleted = vi.fn(async () => undefined);

    await deleteAccountRequest({
      accessToken,
      fetchFn,
      functionUrl,
      publishableKey,
      onDeleted,
    });

    expect(fetchFn).toHaveBeenCalledWith(functionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
    });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
