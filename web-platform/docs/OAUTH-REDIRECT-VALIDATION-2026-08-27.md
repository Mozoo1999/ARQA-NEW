# OAuth Redirect Validation — 2026-08-27

## Verified public start request

The mobile OAuth start endpoint was called with the same parameter names used by the Expo client:

```text
redirectUri=narqa-ebos://oauth/callback
callbackOrigin=https://narqaebos-c2nmdy4n.manus.space
nonce=<32-character value>
```

The endpoint returned an authorization URL whose provider callback is:

```text
https://narqaebos-c2nmdy4n.manus.space/api/mobile/oauth/callback
```

## Provider result

Navigating to the returned authorization URL reached the NARQA EBOS sign-in page. The provider displayed the available sign-in methods and did **not** return the prior `redirect_uri domain not allowed` error. This verifies that the public `manus.space` callback is accepted at authorization start.

## Remaining verification

The provider callback exchange, return to `narqa-ebos://oauth/callback`, nonce comparison, secure-session storage, and subsequent authenticated API calls still require a real mobile sign-in and device test.
