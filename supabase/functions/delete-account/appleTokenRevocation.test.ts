import assert from "node:assert/strict";
import { exportJWK, exportPKCS8, generateKeyPair, jwtVerify, SignJWT } from "npm:jose@6.2.12";
import { revokeAppleAuthorization } from "./appleTokenRevocation.ts";

const issuer = "https://appleid.apple.com";
const clientId = "test.bundle.id";
const teamId = "test-team";
const keyId = "test-key";
const subject = "test-apple-user";
const identityKey = await generateKeyPair("RS256");
const signingKey = await generateKeyPair("ES256", { extractable: true });
const jwk = { ...await exportJWK(identityKey.publicKey), kid: keyId, alg: "RS256", use: "sig" };
const config = { clientId, teamId, keyId, privateKey: await exportPKCS8(signingKey.privateKey) };

for (const scenario of ["success", "different-account", "invalid-signature", "exchange-failure", "revoke-failure"] as const) {
  Deno.test(`Apple token exchange and revocation: ${scenario}`, async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    const tokenKey = scenario === "invalid-signature" ? await generateKeyPair("RS256") : identityKey;
    const idToken = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: keyId }).setIssuer(issuer).setAudience(clientId)
      .setSubject(scenario === "different-account" ? "another-user" : subject)
      .setIssuedAt().setExpirationTime("5m").sign(tokenKey.privateKey);
    globalThis.fetch = (async (input: Request | string | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/keys")) return Response.json({ keys: [jwk] });
      const form = new URLSearchParams(String(init?.body));
      assert.equal(form.get("client_id"), clientId);
      const secret = await jwtVerify(form.get("client_secret")!, signingKey.publicKey, {
        issuer: teamId, audience: issuer, subject: clientId, algorithms: ["ES256"],
      });
      assert.equal(secret.protectedHeader.kid, keyId);
      if (url.endsWith("/auth/token")) {
        calls.push("exchange");
        assert.equal(form.get("code"), "fresh-code");
        assert.equal(form.get("grant_type"), "authorization_code");
        if (scenario === "exchange-failure") return Response.json({ error: "invalid_grant" }, { status: 400 });
        return Response.json({ id_token: idToken, refresh_token: "apple-refresh-token" });
      }
      assert.equal(url, `${issuer}/auth/revoke`);
      calls.push("revoke");
      assert.equal(form.get("token"), "apple-refresh-token");
      assert.equal(form.get("token_type_hint"), "refresh_token");
      return new Response(null, { status: scenario === "revoke-failure" ? 503 : 200 });
    }) as typeof fetch;
    try {
      if (scenario === "success") {
        await revokeAppleAuthorization("fresh-code", subject, config);
        assert.deepEqual(calls, ["exchange", "revoke"]);
      } else {
        await assert.rejects(revokeAppleAuthorization("fresh-code", subject, config));
        assert.deepEqual(calls, scenario === "revoke-failure" ? ["exchange", "revoke"] : ["exchange"]);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
