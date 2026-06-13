type DeleteAccountSession = {
  access_token?: string | null;
};

type DeleteAccountAuthClient = {
  getSession: () => Promise<{
    data: {
      session: DeleteAccountSession | null;
    };
  }>;
  refreshSession: () => Promise<{
    data: {
      session: DeleteAccountSession | null;
    };
    error: Error | null;
  }>;
};

export async function resolveDeleteAccountAccessToken(
  authClient: DeleteAccountAuthClient,
): Promise<string> {
  const refreshResult = await authClient.refreshSession();
  if (refreshResult.error) {
    console.error("[resolveDeleteAccountAccessToken] Refresh failed", refreshResult.error);
  }

  const refreshedToken = refreshResult.data.session?.access_token?.trim();
  if (refreshedToken) {
    return refreshedToken;
  }

  const {
    data: { session },
  } = await authClient.getSession();
  const storedToken = session?.access_token?.trim();
  if (storedToken) {
    return storedToken;
  }

  throw new Error("계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
}
