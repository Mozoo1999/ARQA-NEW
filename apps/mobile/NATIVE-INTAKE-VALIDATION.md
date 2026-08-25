# Native Voice and Document Intake Validation

## Build evidence

The current internal Android Release APK was built successfully by GitHub Actions run [32869901649](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32869901649) from commit `3dacd4d`. This build includes local in-app operational navigation, the invoice-draft screen, native Arabic speech recognition, a home-screen quick action for voice commands, native image selection/capture, document selection for PDF and supported images, on-device OCR, and the editable OCR review guidance indicator.

| Check | Verified result |
|---|---|
| Package | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode 1`) |
| Architecture | `arm64-v8a` |
| JavaScript bundle | `assets/index.android.bundle` is embedded; Metro is not required |
| Signature | APK Signature Scheme v2 verified |
| SHA-256 | `a1885db3a8f5a886013bd8768f1f46925055c3391869c88dd62a2a0c8d7e7a56` |
| Download path | `/manus-storage/NARQA-EBOS-v0.1.0-in-app-only-arm64_d867bb50.apk` |

## Voice intake behavior

The Commands screen now asks for microphone and speech-recognition permissions at the user’s request, starts native Arabic recognition with `ar-SA`, receives partial and final transcript events, reports native-service errors, and passes the resulting text to the existing Arabic intent parser. It never posts a transaction automatically; the user must explicitly open the authenticated review flow.

The app icon offers a system quick action labelled **بدء أمر صوتي** after the app has run at least once. Selecting it opens the in-app command screen and invokes the same visible permission/recognition flow. A raw two-second press on the launcher icon cannot be intercepted by an app; Android and iOS own that gesture and expose the quick-action menu as the supported integration point. Headset and global volume buttons are also not intercepted by this application.

## In-app navigation behavior

The home screen opens its operations spaces inside the mobile application. Sources, suppliers, customer contacts, projects, reports, and invoice drafting no longer open the web workspace when selected. Voice-command review and OCR review no longer contain browser-opening actions either; they retain a local review state and explain that a native authenticated handoff is required before official submission. The only remaining browser session is the user-initiated OAuth sign-in call when `EXPO_PUBLIC_AUTH_START_URL` is configured. Where live records require a native authenticated data session that has not yet been configured, the application states that condition in-app and does not fabricate data. The invoice screen validates a local review draft and never posts an official invoice or accounting entry automatically.

## Document intake behavior

The OCR screen lets the user capture a document, select an image, or select a supported PDF/image document file up to 10MB. It resizes images to a practical width, invokes on-device OCR for images, displays the raw text and extracted vendor, amount, date, tax, and reference fields as editable values, and directs the user to the published OCR review flow for any approval. PDF selection is confirmed locally and clearly states that its advanced OCR upload requires the authenticated review integration. Its review indicator flags sparse text or missing fields as weak or partial rather than presenting them as certain. Low-quality and handwritten documents are explicitly surfaced for human correction; the app does not claim automatic accuracy for handwriting.

## Device validation required

Build and archive checks do not substitute for a physical-device test. Install this APK after removing the prior version, allow microphone/camera/photo permissions when requested, speak a short Arabic command, and capture a well-lit receipt. Report any device-specific recognition-service or extraction error with a screenshot.
