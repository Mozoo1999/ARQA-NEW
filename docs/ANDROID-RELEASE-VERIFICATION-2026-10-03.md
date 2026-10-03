# تحقق حزمة Android الداخلية — 2026-10-03

## مصدر الإصدار

- مستودع: `Mozoo1999/ARQA-NEW`
- فرع وإصدار المصدر: `main` عند الالتزام `ef7bd431195160e0400523a3d2bbdc15b99aa866`
- GitHub Actions: `Build Internal Android APK`، التشغيل `37140265504`
- النتيجة: **ناجح**؛ مرّت خطوات تثبيت الاعتمادات، TypeScript للجوال، prebuild، بناء APK، تحقق artifact، ورفعه.

## الحزمة المتحققة

| خاصية | النتيجة |
|---|---|
| اسم الملف | `NARQA-EBOS-ef7bd43-arm64-internal.apk` |
| الحجم | 36MB تقريباً |
| SHA-256 | `704dbe90d492a596368367191436c0ef233bb2b78457991afc35ec05d57517be` |
| المعرّف | `com.narqa.ebos` |
| النسخة | `0.1.0` (`versionCode=1`) |
| ABI | `arm64-v8a` فقط |
| الاسم الظاهر | `NARQA EBOS` |
| JavaScript | `assets/index.android.bundle` موجود داخل APK |
| التوقيع | `apksigner verify --verbose` ناجح وفق APK Signature Scheme v2 |

هذه حزمة داخلية موقعة بمفتاح Android Debug الخاص بسير العمل؛ تثبت على جهاز Android arm64 يسمح بتثبيت تطبيقات من خارج المتجر، لكنها ليست حزمة Google Play موقعة بمفتاح إصدار تجاري.

## مراجعة الأذونات الفعلية

استُخدم `aapt dump badging` على الحزمة الناتجة، لا على `app.json` فقط.

الأذونات الموجودة: `CAMERA`، `INTERNET`، `READ_CONTACTS`، `READ_MEDIA_IMAGES`، `RECORD_AUDIO`، `VIBRATE`، و`ACCESS_NETWORK_STATE`.

حُظرت وتحقق غيابها فعلياً: `WRITE_CONTACTS`، `READ_EXTERNAL_STORAGE`، `WRITE_EXTERNAL_STORAGE`، `SYSTEM_ALERT_WINDOW`، `USE_BIOMETRIC`، و`USE_FINGERPRINT`.

أضيفت هذه الضوابط إلى ملف Expo وCI بعد اكتشاف أن اعتماد التخزين الآمن كان يضيف إذني القياسات الحيوية رغم أن التطبيق لا يستخدم مصادقة بيومترية. وُلد Android prebuild محلياً للتحقق من غيابهما من manifest ثم أُزيل مجلد Android المولد من مساحة المصدر.

## ما تثبته وما لا تثبته الحزمة

تثبت الحزمة أن إصدار Android مستقل حقيقي يضم bundle وليس مجرد عميل Metro، وأنه يتضمن واجهة سياق التشغيل ومسار تخزين Native الآمن، لأن GitHub Actions مرر TypeScript ثم Metro/Gradle prebuild والبناء.

لا يثبت هذا السجل عودة OAuth على هاتف فعلي، أو إذن ميكروفون حقيقي، أو تعرف صوتي، أو تحليل نموذج فعلي، أو إدراج قاعدة بيانات من جهاز. تبقى هذه اختبارات جهاز مادية مفتوحة. iOS/iPad يتطلب حساب Apple Developer وتوقيعاً وبناءاً منفصلاً.
