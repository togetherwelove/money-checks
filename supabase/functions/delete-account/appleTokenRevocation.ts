import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "npm:jose@6.2.12";
import { AppleDeletionErrors } from "./appleDeletionMessages.ts";

const AppleAuth = {
  issuer: "https://appleid.apple.com",
  keysUrl: "https://appleid.apple.com/auth/keys",
  tokenUrl: "https://appleid.apple.com/auth/token",
  revokeUrl: "https://appleid.apple.com/auth/revoke",
  signingAlgorithm: "ES256",
  identityAlgorithm: "RS256",
  clientSecretLifetime: "5m",
  requestTimeoutMs: 15_000,
} as const;

export type AppleRevocationConfig = {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};

const appleKeys = createRemoteJWKSet(new URL(AppleAuth.keysUrl));

export async function revokeAppleAuthorization(
  authorizationCode: string,
  expectedSubject: string,
  config: AppleRevocationConfig,
): Promise<void> {
  if (!config.clientId || !config.teamId || !config.keyId || !config.privateKey) {
    throw new Error(AppleDeletionErrors.configuration);
  }
  const key = await importPKCS8(config.privateKey.replace(/\\n/g, "\n"), AppleAuth.signingAlgorithm);
  const clientSecret = await new SignJWT({})
    .setProtectedHeader({ alg: AppleAuth.signingAlgorithm, kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(config.clientId)
    .setAudience(AppleAuth.issuer)
    .setIssuedAt()
    .setExpirationTime(AppleAuth.clientSecretLifetime)
    .sign(key);

  const response = await postAppleForm(AppleAuth.tokenUrl, {
    client_id: config.clientId, client_secret: clientSecret,
    code: authorizationCode, grant_type: "authorization_code",
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(AppleDeletionErrors.authorization);
  }
  const tokens = await response.json();
  if (typeof tokens.id_token !== "string" || typeof tokens.refresh_token !== "string") {
    throw new Error(AppleDeletionErrors.unavailable);
  }
  const { payload } = await jwtVerify(tokens.id_token, appleKeys, {
    issuer: AppleAuth.issuer, audience: config.clientId, algorithms: [AppleAuth.identityAlgorithm],
  });
  if (payload.sub !== expectedSubject) throw new Error(AppleDeletionErrors.mismatch);

  const revoked = await postAppleForm(AppleAuth.revokeUrl, {
    client_id: config.clientId, client_secret: clientSecret,
    token: tokens.refresh_token, token_type_hint: "refresh_token",
  });
  await revoked.body?.cancel();
  if (!revoked.ok) throw new Error(AppleDeletionErrors.unavailable);
}

function postAppleForm(url: string, fields: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields), signal: AbortSignal.timeout(AppleAuth.requestTimeoutMs),
  });
}
