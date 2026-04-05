export const DELETE_BLOCKED_MESSAGE =
  "다른 멤버가 있는 공유 가계부 소유자는 먼저 멤버를 정리하거나 공유를 종료해야 합니다.";
export const DELETE_FAILED_MESSAGE = "계정을 삭제하지 못했습니다.";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
} as const;

type AuthenticatedUser = {
  id: string;
};

type DeleteAccountRequestBody = {
  accessToken?: string;
};

type OwnedBookRow = {
  id: string;
};

type OtherMemberRow = {
  book_id: string;
};

type QueryBuilderResult<Row> = Promise<{
  data: Row[] | null;
  error: Error | null;
}>;

type LedgerBooksQueryBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => QueryBuilderResult<OwnedBookRow>;
  };
};

type LedgerBookMembersQueryBuilder = {
  select: (columns: string) => {
    in: (column: string, values: string[]) => {
      neq: (nextColumn: string, value: string) => {
        limit: (count: number) => QueryBuilderResult<OtherMemberRow>;
      };
    };
  };
};

export type DeleteAccountAdminClient = {
  auth: {
    admin: {
      deleteUser: (userId: string) => Promise<{ error: Error | null }>;
    };
    getUser: (
      accessToken: string,
    ) => Promise<{ data: { user: AuthenticatedUser | null }; error: Error | null }>;
  };
  from: (tableName: "ledger_book_members" | "ledger_books") =>
    | LedgerBookMembersQueryBuilder
    | LedgerBooksQueryBuilder;
};

type DeleteAccountHandlerOptions = {
  createAdminClient: () => DeleteAccountAdminClient;
  serviceRoleKey: string;
  supabaseUrl: string;
};

export async function handleDeleteAccountRequest(
  request: Request,
  options: DeleteAccountHandlerOptions,
): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    if (!options.supabaseUrl || !options.serviceRoleKey) {
      return createJsonResponse(500, { error: DELETE_FAILED_MESSAGE });
    }

    const requestBody = await readDeleteAccountRequestBody(request);
    const accessToken =
      extractBearerToken(request.headers.get("Authorization")) ??
      requestBody.accessToken?.trim() ??
      null;
    if (!accessToken) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const adminClient = options.createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken);

    if (userError || !user) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const hasSharedMembers = await ownsSharedLedgerWithOtherMembers(adminClient, user.id);
    if (hasSharedMembers) {
      return createJsonResponse(409, { error: DELETE_BLOCKED_MESSAGE });
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[delete-account] deleteUser failed", deleteError);
      return createJsonResponse(500, { error: DELETE_FAILED_MESSAGE });
    }

    return createJsonResponse(200, { success: true });
  } catch (error) {
    console.error("[delete-account] unexpected error", error);
    return createJsonResponse(500, { error: DELETE_FAILED_MESSAGE });
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

async function readDeleteAccountRequestBody(request: Request): Promise<DeleteAccountRequestBody> {
  try {
    const parsedBody = (await request.json()) as DeleteAccountRequestBody | null;
    return parsedBody ?? {};
  } catch {
    return {};
  }
}

async function ownsSharedLedgerWithOtherMembers(
  adminClient: DeleteAccountAdminClient,
  userId: string,
): Promise<boolean> {
  const ledgerBooksQuery = adminClient.from("ledger_books") as LedgerBooksQueryBuilder;
  const { data: ownedBooks, error: ownedBooksError } = await ledgerBooksQuery
    .select("id")
    .eq("owner_id", userId);

  if (ownedBooksError) {
    throw ownedBooksError;
  }

  const ownedBookIds = (ownedBooks ?? []).map((book) => book.id);
  if (ownedBookIds.length === 0) {
    return false;
  }

  const membersQuery = adminClient.from("ledger_book_members") as LedgerBookMembersQueryBuilder;
  const { data: otherMembers, error: otherMembersError } = await membersQuery
    .select("book_id")
    .in("book_id", ownedBookIds)
    .neq("user_id", userId)
    .limit(1);

  if (otherMembersError) {
    throw otherMembersError;
  }

  return (otherMembers ?? []).length > 0;
}

function createJsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
