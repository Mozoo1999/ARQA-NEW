# Native Voice and Document Intake Validation

## Build evidence

The current internal Android Release APK was built successfully by GitHub Actions run [32959823559](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32959823559) from commit `0f21640`. This build includes local in-app operational navigation, the invoice-draft screen, native Arabic speech recognition, a home-screen quick action for voice commands, native image selection/capture, document selection for PDF and supported images, on-device OCR, native digital-PDF text extraction, editable OCR review guidance, mobile OAuth Bearer sessions, live database reads, draft submission, and server-side NARQA AI analysis after explicit user review.

| Check | Verified result |
|---|---|
| Package | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode 1`) |
| Architecture | `arm64-v8a` |
| JavaScript bundle | `assets/index.android.bundle` is embedded; Metro is not required |
| Signature | APK Signature Scheme v2 verified |
| SHA-256 | `c5ed6095bb10dc5537b4746cd5c631039c9c56c3673626dca19dcbe601e7f2ba` |
| Download path | `/manus-storage/NARQA-EBOS-v0.1.0-backend-ai-arm64_61cd6ac7.apk` |

## Voice intake behavior

The Commands screen now asks for microphone and speech-recognition permissions at the user’s request, starts native Arabic recognition with `ar-SA`, receives partial and final transcript events, reports native-service errors, and passes the resulting text to the existing Arabic intent parser. It never posts a transaction automatically; the user must explicitly open the authenticated review flow.

The app icon offers a system quick action labelled **بدء أمر صوتي** after the app has run at least once. Selecting it opens the in-app command screen and invokes the same visible permission/recognition flow. A raw two-second press on the launcher icon cannot be intercepted by an app; Android and iOS own that gesture and expose the quick-action menu as the supported integration point. Headset and global volume buttons are also not intercepted by this application.

## In-app navigation behavior

The home screen opens its operations spaces inside the mobile application. Sources, suppliers, customer contacts, projects, reports, and invoice drafting no longer open the web workspace when selected. Voice-command review and OCR review stay inside the application. The sole browser session is the explicit user-selected OAuth sign-in, which returns to `narqa-ebos://oauth/callback`, verifies a nonce, and stores a Bearer session in secure storage. Authenticated screens load live supplier, project, contact, report, and draft data from the server. The invoice screen still validates a local review draft and never posts an official invoice or accounting entry automatically.

## Backend and project-AI behavior

After mobile OAuth completes, the application calls the protected mobile endpoints for current operational data and for draft submission. Voice text and locally extracted image/PDF text are sent to the NARQA AI server endpoint only after the user chooses **تحليل عبر نموذج NARQA AI**. The server returns structured, editable review fields and never persists a financial or accounting result until the user explicitly chooses to create a `pending_review` draft. The model receives extracted text, not a direct local file path or an app-embedded API key.

## OAuth redirect correction

The prior APK constructed its OAuth provider callback from an internal deployment host (`*.a.run.app`), which the provider rejected. The corrected flow sends the verified public frontend origin `https://narqaebos-c2nmdy4n.manus.space` to the mobile OAuth start endpoint. The server allows only a root HTTPS `*.manus.space` callback origin and builds the provider callback as `https://narqaebos-c2nmdy4n.manus.space/api/mobile/oauth/callback`. The public start response was verified after deployment. The replacement APK was built by [GitHub Actions run 32964757499](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32964757499), has SHA-256 `ecaa5e2c67292ab48f75d6a6330ac2405fd441c996057183ff1d56a30d6a31f1`, and is available at `/manus-storage/NARQA-EBOS-v0.1.0-oauth-redirect-fix-arm64_5f62b758.apk`.

## Native PDF analysis

Digital PDFs are analysed in-app using native PDF text extraction, then routed through the same editable financial-field and review-guidance flow as images. Password-protected PDFs show an in-app error and never open a browser. For a scanned PDF with no embedded text, the app converts the first page to a cached image and runs the native image OCR path. Multi-page scanned-document aggregation has not been claimed or enabled; the user must review each source page explicitly.

## Document intake behavior

The OCR screen lets the user capture a document, select an image, or select a supported PDF/image document file up to 10MB. It resizes images to a practical width, invokes on-device OCR for images, displays the raw text and extracted vendor, amount, date, tax, and reference fields as editable values, and directs the user to the published OCR review flow for any approval. PDF selection is confirmed locally and clearly states that its advanced OCR upload requires the authenticated review integration. Its review indicator flags sparse text or missing fields as weak or partial rather than presenting them as certain. Low-quality and handwritten documents are explicitly surfaced for human correction; the app does not claim automatic accuracy for handwriting.

## Device validation required

Build and archive checks do not substitute for a physical-device test. Install this APK after removing the prior version, allow microphone/camera/photo permissions when requested, speak a short Arabic command, and capture a well-lit receipt. Report any device-specific recognition-service or extraction error with a screenshot.

## Vehicle loads and receiving notes

The operational intake flow now analyses a voice transcript, image, or PDF-derived text into an editable **vehicle-load** or **receiving-note** proposal. The reviewer corrects client, vehicle plate, material, date, quantity, unit, and price before confirmation. Confirmation records the authenticated user, timestamp, entry method, source analysis, and confirmation state. The server matches the confirmed quantity to client and vehicle records, creates missing customer/vehicle references only after the user explicitly permits it, and returns the quantity that remains unentered in receiving notes. The APK was built by [GitHub Actions run 32972242646](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32972242646), has SHA-256 `d8d0b1e18889eaa8e614ff58e25ec8a5ed694498388fe5f20a3db7428c135332`, and is available at `/manus-storage/NARQA-EBOS-v0.1.0-vehicle-loads-receiving-notes-arm64_a253da18.apk`.

## Conversational assistant, Excel, and approved-message intake

The app opens a saved Arabic conversation for a spoken or typed request. For example, a supplier request triggers a written and spoken category question, followed by additional questions until the draft is ready. The session retains channel, transcript, answers, user, timestamps, collection state, confirmation, and execution outcome. Only a confirmed session creates the permitted supplier or draft outcome. The finance-report workspace exports an authenticated workbook containing operational, audit, response, and exception sheets. The user may select up to ten images or PDFs, sees a result for every file, and reviews a combined draft. A user can choose an approved contact and manually paste approved WhatsApp/SMS content to create a draft; automatic WhatsApp/SMS ingestion requires an official provider integration and explicit consent. The app-icon quick action automatically begins voice listening and opens the conversation after final speech recognition. This build was produced by [GitHub Actions run 33026360831](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/33026360831), has SHA-256 `eac3de9ff206b2741b65b761eb98dda363c4edc6069da407a2d73c9c558fc09d`, and is available at `/manus-storage/NARQA-EBOS-v0.1.0-conversational-assistant-arm64_9fb33c07.apk`.

## Android visual-analysis correction

The error `Cannot read property 'extractTextFromImage' of undefined` was reproduced on Android. The installed `expo-text-extractor` package has no Android-native implementation, so the application must not call it unguarded. The corrected image path prepares the selected image, sends it through the authenticated `/api/mobile/ai/analyze-image` endpoint, and uses the NARQA visual model `gemini-3-flash-preview` to return evidence-only, editable fields. Native OCR is retained only as a guarded fallback on a platform that exposes that method. The replacement APK was built by [GitHub Actions run 33029585942](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/33029585942), has SHA-256 `126feb9b8f563081ad1adbbe7792c673e0b1bb7283c8a3c4378c16d70880962d`, and is available at `/manus-storage/NARQA-EBOS-v0.1.0-vision-voice-fixed-arm64_e883de63.apk`.
