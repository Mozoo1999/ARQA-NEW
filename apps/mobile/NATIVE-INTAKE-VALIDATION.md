# Native Voice and Document Intake Validation

## Build evidence

The current internal Android Release APK was built successfully by GitHub Actions run [32797202992](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32797202992) from commit `dc69c0d`. This build includes the operations home, native Arabic speech recognition, native image selection/capture, document selection for PDF and supported images, on-device OCR, and the editable OCR review guidance indicator.

| Check | Verified result |
|---|---|
| Package | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode 1`) |
| Architecture | `arm64-v8a` |
| JavaScript bundle | `assets/index.android.bundle` is embedded; Metro is not required |
| Signature | APK Signature Scheme v2 verified |
| SHA-256 | `e5a121b900a59b855488cfbd9ae774d8b2f8dd1a48d15d9a89bf55f81a9e5dd3` |
| Download path | `/manus-storage/NARQA-EBOS-v0.1.0-operations-home-document-picker-arm64_4df7b9ae.apk` |

## Voice intake behavior

The Commands screen now asks for microphone and speech-recognition permissions at the user’s request, starts native Arabic recognition with `ar-SA`, receives partial and final transcript events, reports native-service errors, and passes the resulting text to the existing Arabic intent parser. It never posts a transaction automatically; the user must explicitly open the authenticated review flow.

## Document intake behavior

The OCR screen lets the user capture a document, select an image, or select a supported PDF/image document file up to 10MB. It resizes images to a practical width, invokes on-device OCR for images, displays the raw text and extracted vendor, amount, date, tax, and reference fields as editable values, and directs the user to the published OCR review flow for any approval. PDF selection is confirmed locally and clearly states that its advanced OCR upload requires the authenticated review integration. Its review indicator flags sparse text or missing fields as weak or partial rather than presenting them as certain. Low-quality and handwritten documents are explicitly surfaced for human correction; the app does not claim automatic accuracy for handwriting.

## Device validation required

Build and archive checks do not substitute for a physical-device test. Install this APK after removing the prior version, allow microphone/camera/photo permissions when requested, speak a short Arabic command, and capture a well-lit receipt. Report any device-specific recognition-service or extraction error with a screenshot.
