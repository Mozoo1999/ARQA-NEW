# Native Voice and Document Intake Validation

## Build evidence

The internal Android Release APK was built successfully by GitHub Actions run [32794556048](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32794556048) from commit `770944e`.

| Check | Verified result |
|---|---|
| Package | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode 1`) |
| Architecture | `arm64-v8a` |
| JavaScript bundle | `assets/index.android.bundle` is embedded; Metro is not required |
| Signature | APK Signature Scheme v2 verified |
| SHA-256 | `b9187731d4f1e916c341ed120f7ea6814682f362774cf731d465c3314cbeeaeb` |
| Download path | `/manus-storage/NARQA-EBOS-v0.1.0-native-intake-release-arm64_f78e45b9.apk` |

## Voice intake behavior

The Commands screen now asks for microphone and speech-recognition permissions at the user’s request, starts native Arabic recognition with `ar-SA`, receives partial and final transcript events, reports native-service errors, and passes the resulting text to the existing Arabic intent parser. It never posts a transaction automatically; the user must explicitly open the authenticated review flow.

## Document intake behavior

The OCR screen lets the user capture a document or select an image. It resizes the image to a practical width, invokes on-device OCR, displays the raw text and extracted vendor, amount, date, tax, and reference fields as editable values, and directs the user to the published OCR review flow for any approval. Low-quality and handwritten documents are explicitly surfaced for human correction; the app does not claim automatic accuracy for handwriting.

## Device validation required

Build and archive checks do not substitute for a physical-device test. Install this APK after removing the prior version, allow microphone/camera/photo permissions when requested, speak a short Arabic command, and capture a well-lit receipt. Report any device-specific recognition-service or extraction error with a screenshot.
