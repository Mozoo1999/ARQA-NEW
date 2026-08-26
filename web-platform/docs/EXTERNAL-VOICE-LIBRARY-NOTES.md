# Expo Speech Recognition — Integration Notes

Source reviewed: <https://github.com/jamsch/expo-speech-recognition>

The library provides native speech recognition through Android `SpeechRecognizer`, iOS `SFSpeechRecognizer`, and a Web SpeechRecognition implementation. Its Expo config plugin declares the microphone and speech-recognition permissions and configures Android package visibility for Google Speech Recognition.

The documented `app.json` plugin configuration is `expo-speech-recognition`, optionally with `microphonePermission`, `speechRecognitionPermission`, and `androidSpeechServicePackages`, including `com.google.android.googlequicksearchbox` for Google Speech Recognition. The application must be prebuilt and rebuilt after adding this native module and plugin.

This source is used only to guide the native speech-capture integration. The application continues to require a review and explicit user confirmation before any business action is executed.
