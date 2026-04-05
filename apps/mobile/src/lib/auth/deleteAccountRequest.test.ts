import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { deleteAccountRequest } from "./deleteAccountRequest";

describe("deleteAccountRequest", () => {
  it("throws the fallback message when the access token is missing", async () => {
    await expect(
      deleteAccountRequest({
        accessToken: null,
        invokeFn: vi.fn(async () => ({
          data: { success: true },
          error: null,
        })),
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow(AccountDeletionMessages.errorFallback);
  });

  it("throws the server error message when the request is rejected", async () => {
    const invokeFn = vi.fn(async () => ({
      data: null,
      error: {
        context: new Response(JSON.stringify({ error: "다른 멤버를 먼저 정리해 주세요." }), {
          status: 409,
        }),
        message: "Edge Function returned a non-2xx status code",
      },
    }));

    await expect(
      deleteAccountRequest({
        accessToken: "token",
        invokeFn,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow("다른 멤버를 먼저 정리해 주세요.");
  });

  it("falls back to the generic error when the function response has no JSON body", async () => {
    const invokeFn = vi.fn(async () => ({
      data: null,
      error: {
        context: new Response(null, {
          status: 500,
        }),
        message: "",
      },
    }));

    await expect(
      deleteAccountRequest({
        accessToken: "token",
        invokeFn,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow(AccountDeletionMessages.errorFallback);
  });

  it("falls back to the generic error when the function error has no context", async () => {
    const invokeFn = vi.fn(async () => ({
      data: null,
      error: {
        message: "",
      },
    }));

    await expect(
      deleteAccountRequest({
        accessToken: "token",
        invokeFn,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow(AccountDeletionMessages.errorFallback);
  });

  it("uses the error message when the context body is plain text", async () => {
    const invokeFn = vi.fn(async () => ({
      data: null,
      error: {
        context: new Response("Invalid JWT", {
          status: 401,
        }),
        message: "Invalid JWT",
      },
    }));

    await expect(
      deleteAccountRequest({
        accessToken: "token",
        invokeFn,
        onDeleted: vi.fn(async () => undefined),
      }),
    ).rejects.toThrow("Invalid JWT");
  });

  it("signs out locally on success", async () => {
    const invokeFn = vi.fn(async () => ({
      data: { success: true },
      error: null,
    }));
    const onDeleted = vi.fn(async () => undefined);

    await deleteAccountRequest({
      accessToken: "token",
      invokeFn,
      onDeleted,
    });

    expect(invokeFn).toHaveBeenCalledWith("delete-account", {
      body: { accessToken: "token" },
    });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
