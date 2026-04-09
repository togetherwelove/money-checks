import {
  DELETE_BLOCKED_MESSAGE,
  DELETE_FAILED_MESSAGE,
  type DeleteAccountAdminClient,
  extractBearerToken,
  handleDeleteAccountRequest,
} from "./deleteAccountHandler";

describe("deleteAccountHandler", () => {
  it("extracts a bearer token only from valid authorization headers", () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Token abc")).toBeNull();
    expect(extractBearerToken("Bearer sample-token")).toBe("sample-token");
  });

  it("rejects requests without an access token", async () => {
    const response = await handleDeleteAccountRequest(
      new Request("https://example.com", {
        method: "POST",
      }),
      {
        createAdminClient: () => createAdminClientMock(),
        serviceRoleKey: "service-role-key",
        supabaseUrl: "https://example.supabase.co",
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects requests when the authenticated user cannot be resolved", async () => {
    const response = await handleDeleteAccountRequest(createAuthorizedRequest(), {
      createAdminClient: () =>
        createAdminClientMock({
          userError: new Error("invalid user"),
        }),
      serviceRoleKey: "service-role-key",
      supabaseUrl: "https://example.supabase.co",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("blocks account deletion for owners who still have shared members", async () => {
    const response = await handleDeleteAccountRequest(createAuthorizedRequest(), {
      createAdminClient: () =>
        createAdminClientMock({
          otherMembers: [{ book_id: "book-1" }],
        }),
      serviceRoleKey: "service-role-key",
      supabaseUrl: "https://example.supabase.co",
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: DELETE_BLOCKED_MESSAGE });
  });

  it("returns a server error when the auth delete call fails", async () => {
    const response = await handleDeleteAccountRequest(createAuthorizedRequest(), {
      createAdminClient: () =>
        createAdminClientMock({
          deleteUserError: new Error("delete failed"),
        }),
      serviceRoleKey: "service-role-key",
      supabaseUrl: "https://example.supabase.co",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: DELETE_FAILED_MESSAGE });
  });

  it("returns success when the user is authenticated and not blocked", async () => {
    const response = await handleDeleteAccountRequest(createAuthorizedRequest(), {
      createAdminClient: () => createAdminClientMock(),
      serviceRoleKey: "service-role-key",
      supabaseUrl: "https://example.supabase.co",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns success when the user does not own any ledger books", async () => {
    const response = await handleDeleteAccountRequest(createAuthorizedRequest(), {
      createAdminClient: () =>
        createAdminClientMock({
          ownedBooks: [],
        }),
      serviceRoleKey: "service-role-key",
      supabaseUrl: "https://example.supabase.co",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});

function createAuthorizedRequest(): Request {
  return new Request("https://example.com", {
    method: "POST",
    headers: {
      Authorization: "Bearer sample-token",
    },
  });
}

type AdminClientMockOptions = {
  deleteUserError?: Error | null;
  otherMembers?: Array<{ book_id: string }>;
  ownedBooks?: Array<{ id: string }>;
  userError?: Error | null;
  userId?: string;
};

function createAdminClientMock(options: AdminClientMockOptions = {}): DeleteAccountAdminClient {
  const userId = options.userId ?? "user-1";
  const ownedBooks = options.ownedBooks ?? [{ id: "book-1" }];
  const otherMembers = options.otherMembers ?? [];

  return {
    auth: {
      admin: {
        deleteUser: async () => ({
          error: options.deleteUserError ?? null,
        }),
      },
      getUser: async () => ({
        data: {
          user: options.userError ? null : { id: userId },
        },
        error: options.userError ?? null,
      }),
    },
    from: (tableName) => {
      if (tableName === "ledger_books") {
        return {
          select: () => ({
            eq: async () => ({
              data: ownedBooks,
              error: null,
            }),
          }),
        };
      }

      return {
        select: () => ({
          in: () => ({
            neq: () => ({
              limit: async () => ({
                data: otherMembers,
                error: null,
              }),
            }),
          }),
        }),
      };
    },
  };
}
