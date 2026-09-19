# Android Release Artifact Verification — 2026-09-19

## Scope and provenance

This report records a reproducible inspection of the Android artifact produced by GitHub Actions run [`35415106352`](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/35415106352) from `Mozoo1999/ARQA-NEW` commit `be4fd88d01ee1e8ab6e6e41049b545487c82c94d`. The workflow completed its dependency installation, mobile TypeScript check, Expo Android prebuild, arm64 release assembly, bundle check, manifest checks, and artifact upload successfully.

The artifact was downloaded from that workflow and saved as `NARQA-EBOS-be4fd88-arm64-release.apk`. It is a native standalone APK with the JavaScript bundle packaged inside the application; it is not a Metro-dependent development client.

## Artifact evidence

| Verification item | Observed result |
|---|---|
| Application ID | `com.narqa.ebos` |
| Version | `0.1.0` (`versionCode` 1) |
| Minimum / target SDK | 24 / 36 |
| JavaScript bundle | `assets/index.android.bundle` exists in the APK |
| Native ABI | `arm64-v8a` only |
| APK SHA-256 | `5d2583af200fa669050ad556436fd5aae9e0db9cebd30f53ee6bce99ef81d6b9` |
| APK size | 36,785,690 bytes |
| APK signing | APK Signature Scheme v2 verifies successfully |
| Signer | `CN=Android Debug` test signer |

## Least-privilege manifest result

The final packaged manifest contains `CAMERA`, `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, and `READ_CONTACTS`, along with normal framework/runtime permissions such as network state and vibration. The APK does **not** contain `WRITE_CONTACTS`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, or `SYSTEM_ALERT_WINDOW`.

This result was not inferred from `app.json` alone. The `expo-contacts` plugin had added `WRITE_CONTACTS` to the intermediate configuration. The app now uses Expo `android.blockedPermissions` for that and the unnecessary legacy/storage/overlay permissions. The GitHub workflow uses `aapt dump badging` against every resulting APK and fails if any blocked permission reappears. Expo documents `android.blockedPermissions` as the mechanism for removing permissions introduced by package-level manifests.[1]

## Limitations and next evidence required

This is an **internal test APK** because it is signed with the Android Debug certificate. It may be installed for controlled internal testing, but it must not be represented as a production-signed release or distributed through a store. A user-owned release keystore, protected CI signing configuration, certificate provenance, and a new signed build are required before production distribution.

No physical-device evidence is claimed here. The remaining required tests are installation on an arm64 Android device, OAuth return, home-screen shortcut launch, microphone allow/deny and speech turns, full PDF/image analysis, contact selection/cancellation, approved insertion with audit evidence, and the absence of unwanted permission prompts. iPhone and iPad behavior require a separate native build and physical-device validation.

## Reference

[1] [Expo, “Permissions”](https://docs.expo.dev/guides/permissions/).
