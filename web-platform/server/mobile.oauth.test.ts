import { describe, expect, it } from "vitest";
import { __mobileOAuthTestUtils } from "./_core/oauth";

describe("mobile OAuth state", () => {
  it("round-trips the fixed native callback and client nonce", () => {
    const nonce = "f3ce857b75ee4f3b8d010702ce64c6a4";
    const encoded = __mobileOAuthTestUtils.encodeMobileOAuthState({
      redirectUri: __mobileOAuthTestUtils.MOBILE_REDIRECT_URI,
      nonce,
    });

    expect(__mobileOAuthTestUtils.decodeMobileOAuthState(encoded)).toEqual({
      redirectUri: "narqa-ebos://oauth/callback",
      nonce,
    });
  });

  it("rejects short nonces and untrusted mobile redirect targets", () => {
    const invalidDestination = Buffer.from(JSON.stringify({ redirectUri: "https://attacker.invalid", nonce: "f3ce857b75ee4f3b8d010702ce64c6a4" })).toString("base64url");
    const shortNonce = Buffer.from(JSON.stringify({ redirectUri: "narqa-ebos://oauth/callback", nonce: "short" })).toString("base64url");

    expect(__mobileOAuthTestUtils.decodeMobileOAuthState(invalidDestination)).toBeNull();
    expect(__mobileOAuthTestUtils.decodeMobileOAuthState(shortNonce)).toBeNull();
  });
});
