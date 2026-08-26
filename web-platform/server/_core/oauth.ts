import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const MOBILE_REDIRECT_URI = "narqa-ebos://oauth/callback";

type MobileOAuthState = {
  redirectUri: string;
  nonce: string;
};

function encodeMobileOAuthState(value: MobileOAuthState) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeMobileOAuthState(value: string): MobileOAuthState | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<MobileOAuthState>;
    if (parsed.redirectUri !== MOBILE_REDIRECT_URI || typeof parsed.nonce !== "string" || parsed.nonce.length < 24 || parsed.nonce.length > 256) return null;
    return { redirectUri: parsed.redirectUri, nonce: parsed.nonce };
  } catch {
    return null;
  }
}

function getAllowedMobileCallbackOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !/^[a-z0-9-]+\.manus\.space$/i.test(url.host) || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/mobile/oauth/start", (req: Request, res: Response) => {
    const redirectUri = getQueryParam(req, "redirectUri");
    const nonce = getQueryParam(req, "nonce");
    const callbackOrigin = getAllowedMobileCallbackOrigin(getQueryParam(req, "callbackOrigin"));
    if (redirectUri !== MOBILE_REDIRECT_URI || !nonce || nonce.length < 24 || nonce.length > 256 || !callbackOrigin) {
      res.status(400).json({ error: "Invalid mobile OAuth redirect or nonce" });
      return;
    }
    if (!ENV.oAuthPortalUrl || !ENV.appId) {
      res.status(503).json({ error: "Mobile OAuth is not configured" });
      return;
    }
    const authorizationUrl = new URL("/app-auth", ENV.oAuthPortalUrl);
    authorizationUrl.searchParams.set("appId", ENV.appId);
    authorizationUrl.searchParams.set("redirectUri", new URL("/api/mobile/oauth/callback", callbackOrigin).toString());
    authorizationUrl.searchParams.set("state", encodeMobileOAuthState({ redirectUri, nonce }));
    authorizationUrl.searchParams.set("type", "signIn");
    res.json({ authorizationUrl: authorizationUrl.toString() });
  });

  app.get("/api/mobile/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const mobileState = state ? decodeMobileOAuthState(state) : null;
    if (!code || !state || !mobileState) {
      res.status(400).json({ error: "Invalid mobile OAuth callback" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) throw new Error("openId missing from user info");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name || "", expiresInMs: ONE_YEAR_MS });
      const destination = new URL(mobileState.redirectUri);
      destination.searchParams.set("session_token", sessionToken);
      destination.searchParams.set("nonce", mobileState.nonce);
      res.redirect(302, destination.toString());
    } catch (error) {
      console.error("[OAuth] Mobile callback failed", error);
      const destination = new URL(mobileState.redirectUri);
      destination.searchParams.set("error", "oauth_callback_failed");
      res.redirect(302, destination.toString());
    }
  });

  app.get("/api/mobile/session/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch {
      res.status(401).json({ error: "Unauthorized mobile session" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

export const __mobileOAuthTestUtils = { encodeMobileOAuthState, decodeMobileOAuthState, getAllowedMobileCallbackOrigin, MOBILE_REDIRECT_URI };
