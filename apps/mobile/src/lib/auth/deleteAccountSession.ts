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
): Promise<string | null> {
  const { data: refreshedData } = await authClient.refreshSession();
  const refreshedAccessToken = refreshedData.session?.access_token ?? null;
  if (refreshedAccessToken) {
    return refreshedAccessToken;
  }

  const {
    data: { session },
  } = await authClient.getSession();

  return session?.access_token ?? null;
}
