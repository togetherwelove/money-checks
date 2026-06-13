type GoogleAuthSession = {
  accessToken: string;
  refreshToken: string;
};

function readParams(serializedParams: string) {
  const normalizedParams = serializedParams.replace(/^[#?]/, "");
  return new URLSearchParams(normalizedParams);
}

export function resolveGoogleAuthSession(redirectUrl: string): GoogleAuthSession {
  const parsedRedirectUrl = new URL(redirectUrl);
  const queryParams = readParams(parsedRedirectUrl.search);
  const hashParams = readParams(parsedRedirectUrl.hash);

  const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    throw new Error("Google 로그인 세션을 가져오지 못했어요.");
  }

  return {
    accessToken,
    refreshToken,
  };
}
