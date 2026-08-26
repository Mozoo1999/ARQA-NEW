# Native PDF Analysis Notes

## Selected approach

The mobile application can analyse **digital PDFs that contain selectable text** locally with `expo-pdf-text-extract`. The library uses native platform APIs: PDFKit on iOS and PDFBox on Android, supports Expo SDK 49+ and Android API 21+, and requires a native Expo build rather than Expo Go. [1]

The expected flow is: select a PDF, extract its text locally, pass that text through the existing financial-field extraction and review-guidance functions, and present editable draft fields in the current in-app review screen. Password-protected PDFs must yield an explicit review/error state; they must not silently open the web workspace.

## Scope boundary

Image-only or scanned PDFs have no embedded text for the selected native extractor. They require page rendering before the existing image OCR step can run. The implementation will label this as a separate supported path only if a compatible page-renderer can be verified; otherwise it will state that the PDF requires an image upload or secure server-side AI analysis after authentication.

## Verified scanned-PDF candidate

`react-native-pdf-to-image` documents Android and iOS support, accepts local document-picker URIs, and returns cached image paths for each PDF page. It requires a native React Native build and does not run in Expo Go. The APK delivery path already uses native Expo prebuild, so it is suitable for compatibility testing. The application will restrict automated OCR to the first page initially and label multi-page review explicitly to limit device work and avoid claiming complete multi-page analysis without verification. [2]

## Reference

[1]: https://github.com/gr8pathik/expo-pdf-text-extract
[2]: https://github.com/ajumal-ashraf-dev/react-native-pdf-to-image
