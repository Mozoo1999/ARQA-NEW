# Mobile Permissions and Quick-Action Audit

## Verified scope

This audit records the **implemented source configuration** for the Expo mobile application as of 2026-09-17. It does not assert that an Android or iOS device has been tested. The application is configured for `com.narqa.ebos`, supports iPad/tablet layouts, and declares only the native permissions necessary for user-initiated voice input, camera/photo selection, and a single contact selection.

| Capability | Implemented boundary | Native configuration | Current verification state |
|---|---|---|---|
| Arabic voice interaction | Starts after a user action or supported home-screen shortcut; recognition is limited to an in-app session. | `RECORD_AUDIO`, iOS microphone and speech-recognition usage descriptions. | Type-checked and unit-tested; physical-device verification remains open. |
| Camera and photo intake | Opens a system camera or media picker for the document the user selects. | `CAMERA`, `READ_MEDIA_IMAGES`, iOS camera/photo usage descriptions. | Type-checked; physical-device verification remains open. |
| Device contact | Requests access only when the user selects **one** contact through `Contact.presentPicker`; retains only the selected name and first usable phone number for the approved-message form. | `READ_CONTACTS`, `NSContactsUsageDescription`, `expo-contacts` config plugin. | Type-checked and selection logic unit-tested; physical-device verification remains open. |
| File picker | Uses the native file picker; it does not need a background file permission. | No broad storage permission declared. | Type-checked; physical-device verification remains open. |
| SMS | Can open the user's messaging composer. It does not read, monitor, upload, or synchronize an SMS inbox. | No `READ_SMS`, `RECEIVE_SMS`, or default-handler role. | Source-audited. |
| WhatsApp Business | Shows an explicit unconfigured state and routes manually approved content into a review draft only. | No client secret, no scraping, no WhatsApp Web automation. | Official webhook contract and unit tests complete; account setup remains open. |

## Contact privacy controls

The user must make two distinct choices: grant the operating-system contact permission and select a specific contact in the native picker. Cancelling the picker returns no selection, and the application does not enumerate, cache, or upload the address book. The message-intake screen requires separately pasted or explicitly shared content and a consent checkbox before it sends the selected name, first phone number, and content to the authenticated review endpoint.

Expo documents `Contact.presentPicker()` as a native single-contact picker that returns `null` when the user cancels. Its documentation also identifies Android contact permission and the iOS usage description as build-time configuration requirements.[1] The app therefore shows a clear unsupported message in the web preview instead of attempting access to browser contacts.

## SMS boundary

SMS inbox collection is intentionally out of scope. Android treats call-log and SMS access as sensitive and restricts it for Play-distributed apps; an app normally has to become the relevant default handler before requesting `READ_SMS`.[2] The app does not have SMS-handler functionality and consequently declares none of those permissions. The only supported flow is user-controlled composition or user-approved pasted/shared text, followed by review.

## WhatsApp Business boundary

There is no configured WhatsApp connector or Meta credential in the current server environment. The server exposes an authenticated status contract that reports `not_configured`; it does not pretend that a connection exists. The reserved webhook path is `/api/integrations/whatsapp/webhook` and returns a configuration error until the necessary server-only variables and formal business setup are supplied.

When configured in a later controlled deployment, the endpoint will retain the raw body before JSON parsing, verify `X-Hub-Signature-256` by HMAC-SHA256 with the server-only Meta app secret, validate Meta's GET verification challenge, and deduplicate inbound messages on `providerMessageId`. Meta specifies this exact GET challenge and signed POST flow and warns that webhook deliveries may be retried for up to seven days, requiring deduplication.[3] Signed incoming messages are stored only as `received` review events. They do **not** create operational records. A manager or administrator must expressly approve a text-bearing event before it becomes a conversation draft; the normal conversation approval and role checks still apply before any permitted record can be created.

## Home-screen and background limits

The supported Android and iOS shortcut opens the application’s voice-command screen. It does not intercept a raw two-second press on the launcher icon, headset buttons, or hardware keys, and it never begins hidden/background recording. Operating-system launchers own those gestures. The application requests speech permission before recognition and uses a visible 20-second listening window with a user-controlled extension action.

## Release verification still required

Before promoting a native build, verify on a physical Android device and an iPhone/iPad: permission allow/deny/revoke behavior, contact-picker cancellation and selection, home-screen shortcut launch, microphone recognition, OAuth return, multi-page PDF analysis, and the absence of an SMS/WhatsApp background access prompt. These checks are not satisfied by TypeScript or unit tests alone.

## References

[1] [Expo, “Contacts”](https://docs.expo.dev/versions/latest/sdk/contacts/).

[2] [Android Developers, “Permissions used only in default handlers”](https://developer.android.com/guide/topics/permissions/default-handlers).

[3] [Meta for Developers, “Create a webhook endpoint”](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/).
