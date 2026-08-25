# Native Voice and Document Intake Validation

## Build evidence

The current internal Android Release APK was built successfully by GitHub Actions run [32795421522](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/32795421522) from commit `2b2c0f0`. This build includes native Arabic speech recognition, native image selection/capture, on-device OCR, and the editable OCR review guidance indicator.

| Check | Verified result |
|---|---|
| Package | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode 1`) |
| Architecture | `arm64-v8a` |
| JavaScript bundle | `assets/index.android.bundle` is embedded; Metro is not required |
| Signature | APK Signature Scheme v2 verified |
| SHA-256 | `c9c429dc46f0ee5cd6363e7490518abdf62bdb72720395ccae6f4e5bae86be09` |
| Download path | `/manus-storage/NARQA-EBOS-v0.1.0-native-voice-ocr-review-arm64_b19b5ed3.apk` |

## Voice intake behavior

The Commands screen now asks for microphone and speech-recognition permissions at the user’s request, starts native Arabic recognition with `ar-SA`, receives partial and final transcript events, reports native-service errors, and passes the resulting text to the existing Arabic intent parser. It never posts a transaction automatically; the user must explicitly open the authenticated review flow.

## Document intake behavior

The OCR screen lets the user capture a document or select an image. It resizes the image to a practical width, invokes on-device OCR, displays the raw text and extracted vendor, amount, date, tax, and reference fields as editable values, and directs the user to the published OCR review flow for any approval. Its review indicator flags sparse text or missing fields as weak or partial rather than presenting them as certain. Low-quality and handwritten documents are explicitly surfaced for human correction; the app does not claim automatic accuracy for handwriting.

## Device validation required

Build and archive checks do not substitute for a physical-device test. Install this APK after removing the prior version, allow microphone/camera/photo permissions when requested, speak a short Arabic command, and capture a well-lit receipt. Report any device-specific recognition-service or extraction error with a screenshot.
