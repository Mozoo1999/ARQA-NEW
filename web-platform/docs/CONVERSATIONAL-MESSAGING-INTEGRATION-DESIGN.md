# Conversational Operations and Messaging Integration Design

## Implemented operational model

Every approved message or voice-led request creates a persisted conversation session. The server identifies an allowlisted operation, asks only for the missing required fields, retains typed or spoken turns, produces an editable review summary, and applies only the allowed database operation after explicit confirmation. The resulting operational event records the actor, input channel, date, source transcript, analysis provenance, and created record identifier.

A user-selected device contact is not an address-book import. The mobile client receives a single picker result, retains only the chosen display name and first usable telephone number, and requires user-approved pasted or shared content. It then invokes the protected message-import endpoint, which creates a reviewable conversation rather than an automatically executed business record.

## Current messaging state

| Channel | Current supported entry | What is intentionally not implemented | Data-creation rule |
|---|---|---|---|
| Manual approved content | Single selected contact plus explicitly pasted/shared text and consent confirmation. | Background message collection. | Creates a conversation draft only. |
| SMS | User-controlled OS composer or manually approved text. | Inbox reading, monitoring, and synchronization. | Creates a conversation draft only. |
| WhatsApp | Manually approved content may be labelled as WhatsApp source. | WhatsApp Web scraping, unofficial APIs, and fabricated inbound messages. | Creates a conversation draft only. |
| WhatsApp Business official inbound | Reserved Meta webhook contract and review-event table. It is **not configured** in the current environment. | Automatic operational insertion, autonomous replies, and secret storage in the client. | A manager/admin must approve an individual received event; the normal conversation confirmation remains required. |

## Official WhatsApp Business webhook design

The webhook is event-driven and designed for a short-lived public Express handler. It is not a polling worker and requires no continuous process while inactive. Before launch, the deployment must have a Meta Business account, the relevant WhatsApp permissions, a public TLS URL, a retention/consent policy, and server-only values for `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_BUSINESS_ACCOUNT_ID`.

Meta verifies a callback through a GET request containing `hub.mode`, `hub.verify_token`, and `hub.challenge`. The configured endpoint returns the challenge only when the stored verification token matches. For POST deliveries, Meta supplies `X-Hub-Signature-256`; the server preserves the raw body, calculates HMAC-SHA256 with the app secret, and compares the digest in constant time before parsing JSON.[1] Any absent configuration, invalid verification request, or invalid signature is rejected.

A valid signed batch can contain multiple message updates. The parser stores only actual inbound message evidence, retaining the provider message identifier as a unique key. Since Meta may retry failed deliveries over a seven-day period, a duplicate key is treated as an acknowledged duplicate rather than another message or another operational action.[1] A stored event begins in `received` state with no conversation, invoice, load, receiving note, payment, or ledger action. A manager or administrator can claim one text-bearing event after explicit consent. That action creates a standard review conversation, links the event to that conversation, and still requires the ordinary role and confirmation controls for any subsequent operation.

## Security and retention controls

The app secret and verification token are server-only deployment configuration. They are not stored in `app.json`, mobile source, repository history, client-side storage, or logs. Payload storage exists for signed event traceability and must be covered by the organization’s formal retention, access-control, deletion, and incident-response policy before production activation. The mobile app and web UI must state the connection status honestly; a setup screen is not a claim that official WhatsApp is connected.

## Implementation evidence

The server contains `server/whatsappBusiness.ts`, which owns status determination, signature verification, Meta payload parsing, duplicate handling, reviewer authorization, and webhook route registration before the global JSON middleware. The `whatsapp_inbound_events` schema has a unique `providerMessageId` and short named foreign-key constraints. Unit coverage verifies not-configured status, HMAC acceptance and rejection, payload extraction, role restriction, and duplicate handling. A database migration creates the review-event table; its successful application is a prerequisite for inbound processing.

## Production activation checklist

1. Obtain formal Meta Business and WhatsApp Business authorization, permissions, consent text, and retention approval.
2. Set server-only secrets in deployment configuration; never place them in the mobile application.
3. Publish the TLS webhook URL and complete Meta's verification request.
4. Subscribe only to approved inbound fields and test valid signature, invalid signature, duplicate delivery, non-text media, reviewer approval, rejection, and retention deletion paths.
5. Test that a normal user receives `403` on reviewer conversion and that no inbound delivery can autonomously create a business or financial record.
6. Record real-device and live-account evidence before representing the integration as connected.

## References

[1] [Meta for Developers, “Create a webhook endpoint”](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/).

[2] [Expo, “Contacts”](https://docs.expo.dev/versions/latest/sdk/contacts/).

[3] [Android Developers, “Permissions used only in default handlers”](https://developer.android.com/guide/topics/permissions/default-handlers).
