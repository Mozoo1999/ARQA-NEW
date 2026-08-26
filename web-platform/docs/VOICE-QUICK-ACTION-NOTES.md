# Native Voice Quick Action Notes

## Verified platform behavior

The requested two-second press cannot be intercepted as a raw press gesture on the launcher icon. Android and iOS expose the supported alternative: a system home-screen quick-action menu that appears after the operating system recognizes a long press. The user must then tap the explicit action, such as **بدء أمر صوتي**. Android describes app shortcuts as intents that launch a specific in-app action; supported launchers typically display up to four shortcuts. [1]

The selected implementation path is `expo-quick-actions`, which wraps Android App Shortcuts and iOS Home Screen Quick Actions. It exposes runtime action registration and callbacks. On Android, shortcuts can also be pinned as a separate home-screen entry point. [2] [3]

## Safety decision

The quick action will open the in-app Arabic voice-command screen. It may request microphone and speech-recognition permission, but it must not record or execute an action invisibly in the background. The user will see the app and explicitly begin or confirm listening before speech recognition starts.

## References

[1]: https://developer.android.com/develop/ui/compose/system/shortcuts
[2]: https://expo.dev/blog/expo-quick-actions
[3]: https://github.com/EvanBacon/expo-quick-actions
