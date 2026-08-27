# Conversational Operations and Messaging Integration Design

## Verified current state

The mobile application already has local speech recognition, OCR/PDF text extraction, editable operational drafts, and protected server endpoints. It does not yet persist a multi-turn conversational session, produce an operational Excel workbook, or have an enabled official WhatsApp connector. Its current source models raw source text and confirmed operational records, but not each question, answer, correction, or message-consent event.

## Required operating model

Every initiated request becomes a conversation session. The server detects the intended operation, asks only for missing required fields, stores each typed or spoken answer with its user and timestamp, produces an editable draft, and executes database changes only after an explicit approval. Execution must retain the input method, source transcript or selected document, analysis model/version, confirmation timestamp, actor, and resulting entity IDs.

For example, “مورد جديد العالمية” creates a supplier-registration session. The assistant asks “هل التوريد خامات أو معدات أو سيارات أو فنيين أو أخرى؟”, accepts a spoken or typed answer, continues only until the required name/category/contact data are collected, reads and displays the proposed supplier record, and inserts it after approval.

## Messaging integration boundary

No official WhatsApp connector is currently configured. Meta’s WhatsApp Business Platform supports inbound-message webhooks, but production use requires a public TLS endpoint, webhook verification and signed-payload validation, the relevant WhatsApp permissions, and message-capture/consent controls. It also requires recipient opt-in before a business initiates messages and policy-compliant handling of message content. The application must not scrape WhatsApp, silently read device messages, or fabricate conversation data.

Until an official WhatsApp Business account and credentials are supplied, the supported path is a user-selected contact plus manually pasted or explicitly shared message content. The app creates a reviewable draft only; it does not claim automatic WhatsApp or SMS synchronization.

## Implementation options requiring an executive choice

| Approach | Outcome | Setup and constraints |
|---|---|---|
| Manual selection and approved text import | Works immediately in the mobile app; user selects a contact and intentionally shares/pastes content for analysis and draft creation. | No external credentials; no message synchronization; preserves consent boundary. |
| Official WhatsApp Business Platform webhook | Receives permitted inbound WhatsApp messages at a secure endpoint and creates reviewable drafts under explicit policy/consent rules. | Requires Meta Business/WhatsApp Business Account, app credentials, a verification token, a signing secret, user consent, and webhook configuration. |

## References

1. Meta, “WhatsApp Business Platform Webhooks,” https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview
2. Meta, “Create a webhook endpoint,” https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/
3. Meta, “Get opt-in for WhatsApp,” https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in
4. WhatsApp, “WhatsApp Business Messaging Policy,” https://whatsappbusiness.com/policy/
