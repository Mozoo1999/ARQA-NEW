# اختبار أداء وحجم NARQA EBOS على Android

> **حالة التنفيذ:** توجد الآن بوابة CI قابلة لإعادة الإنتاج تفحص حجم حزمة `arm64-v8a`، وتلتقط مؤشرات الذاكرة والسلاسة، وتشغّل AndroidX Macrobenchmark في محاكي API 35. هذه البوابة تمنع انحدارات الحجم والبناء وتنتج أدلة قابلة للتنزيل. لا تجعل قياسات المحاكي قرار قبول الأداء النهائي؛ يجب تكرار القياس على هواتف فعلية ممثلة.

## ما ينفذ آلياً

سير العمل [`.github/workflows/android-internal-apk.yml`](../.github/workflows/android-internal-apk.yml) ينفذ بالترتيب:

1. `expo prebuild` ثم مهيئ `configure-android-performance-measurement.cjs` الذي يضيف وحدة `:macrobenchmark` إلى مشروع Android المتولد فقط. لا تدخل مخرجات Android المتولدة إلى Git.
2. يبني APK توزيع `arm64-v8a` مستقلاً، ويتحقق من معرف الحزمة، ABI، الـ JavaScript bundle المضمّن، التوقيع v2، والأذونات المحظورة.
3. يشغّل `check-android-release-artifact.cjs` ويصدر `android-size-report.json`.
4. يبني APK منفصلاً `x86_64` للمحاكي فقط، يثبت التطبيق ويشغله على Android Emulator API 35.
5. يجمع `dumpsys meminfo` و`dumpsys gfxinfo` قبل Macrobenchmark وبعده.
6. يشغّل خمسة تكرارات لكل من cold start وwarm start وتمريرة إطار على الصفحة الرئيسية عبر AndroidX Macrobenchmark 1.5.0، ثم يحفظ JSON وPerfetto traces إن صدرت.
7. يرفع ثلاث artifacts: APK الداخلي، دليل smoke، ودليل الأداء.

## ميزانية الحجم الحالية

ملف [`apps/mobile/performance/android-size-budget.json`](../apps/mobile/performance/android-size-budget.json) هو مصدر سياسة الحجم في CI.

| البند | القيمة |
|---|---:|
| baseline | 36,831,710 bytes |
| مصدر baseline | `NARQA-EBOS-9458d85-android-internal-arm64.apk` |
| حد النمو فوق baseline | 10% |
| السقف المطلق لحزمة APK الداخلية | 45,000,000 bytes |

يفشل البناء عند تجاوز أي حد. تحديث baseline ليس إجراءً آلياً: يجب ربطه بتفسير نمو الحجم، مراجعة فرق APK Analyzer، وبناء ناجح من المصدر المقصود.

> هذا الفحص يقيس حجم ملف APK الداخلي. حجم التحميل الذي يراه مستخدم Google Play يختلف بحسب ABI والكثافة واللغة. استخدم AAB موقعاً و`bundletool get-size total` لقياس جهاز حقيقي قبل النشر العام.

## تشغيل القياس محلياً

يتطلب ذلك Android SDK API 36 وBuild Tools 36.0.0، وجهازاً أو محاكي API 29+ متصلاً بـ ADB.

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.0.0:$PATH"

pnpm --dir apps/mobile exec expo prebuild --platform android --no-install --clean
node apps/mobile/scripts/configure-android-performance-measurement.cjs apps/mobile/android

cd apps/mobile/android
./gradlew :macrobenchmark:connectedCheck \
  -Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.suppressErrors=EMULATOR \
  -PreactNativeArchitectures=x86_64 \
  --no-daemon --max-workers=2
```

التشغيل على محاكي ينشئ baseline تقنياً قابلاً للمقارنة فقط. لا تستخدم خيار `suppressErrors=EMULATOR` عند اعتماد الأداء على هاتف فعلي؛ اترك Macrobenchmark يرفض بيئة غير صالحة بدلاً من إخفاء المشكلة.

لفحص حزمة APK بعد البناء:

```bash
export AAPT="$(find "$ANDROID_HOME/build-tools" -type f -name aapt | sort -V | tail -1)"
export APKSIGNER="$(find "$ANDROID_HOME/build-tools" -type f -name apksigner | sort -V | tail -1)"

node apps/mobile/scripts/check-android-release-artifact.cjs \
  narqa-ebos-arm64-v8a-internal.apk \
  apps/mobile/performance/android-size-budget.json \
  android-size-report.json
```

## اعتماد الأداء قبل النشر النهائي

نفّذ السيناريوهات نفسها على ثلاثة أجهزة فعلية على الأقل:

| الفئة | الحد الأدنى المطلوب |
|---|---|
| هاتف منخفض أو متوسط الأداء | Android 9–12، ذاكرة 3–4 GB، ABI `arm64-v8a` |
| هاتف حديث | Android 14–16، ذاكرة 8 GB أو أكثر، ABI `arm64-v8a` |
| جهاز لوحي | Android 12 أو أحدث، وضع أفقي وعمودي، ABI `arm64-v8a` |

على كل جهاز، سجّل خمس قياسات على الأقل لـ cold/warm start، والتنقل، واختيار صورة، ومعاينة PDF، وبدء الصوت ثم إلغاء المسودة. سجل الوسيط وP95 مع طراز الجهاز وإصدار النظام وحالة الشبكة والشحن والحرارة. لا تقارن أرقام جهازين مختلفين؛ قارن الإصدار المرشح والسابق على الجهاز وإصدار Android نفسيهما.

يفشل الاعتماد إذا ظهر crash أو ANR أو تسرب ذاكرة متزايد خلال تكرار الصورة/PDF والصوت، أو إذا تجاوز نمو APK الميزانية، أو إذا تراجع P95 عن baseline موثق من الجهاز نفسه من دون سبب مقبول ومثبت.

## ما لا تثبته بوابة CI

- لا تثبت سلوك الكاميرا أو الميكروفون أو موفر TTS/STT أو OAuth الفعلي على هاتف مادي.
- لا تثبت دقة OCR أو مزود AI أو الإدراج المصادق.
- لا تثبت iOS أو iPad؛ تلك منصة واختبارات مستقلة.
- لا تعادل الشهادة الداخلية Debug توقيع إنتاج أو توزيع Google Play.

## مراجع رسمية

- [قياس أداء Android](https://developer.android.com/topic/performance/measuring-performance)
- [AndroidX Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
- [APK Analyzer](https://developer.android.com/studio/debug/apk-analyzer)
- [bundletool وقياس حجم التوزيع المخصص للجهاز](https://developer.android.com/tools/bundletool)
