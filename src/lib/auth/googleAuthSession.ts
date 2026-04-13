import { GoogleAuthCopy } from "../../constants/googleAuth";

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
    throw new Error(GoogleAuthCopy.missingSessionError);
  }

  return {
    accessToken,
    refreshToken,
  };
}
