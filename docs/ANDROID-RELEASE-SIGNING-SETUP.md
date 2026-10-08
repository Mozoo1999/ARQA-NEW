# إعداد توقيع إصدار Android في GitHub Secrets

> هذا الدليل يهيئ إصدار Android **موقّعاً بمفتاح مملوك للمؤسسة**. لا تنشئ المفتاح داخل GitHub Actions، ولا ترفعه إلى Git، ولا ترسله في محادثة أو بريد أو مساحة تخزين عامة.

## 1. قرار الملكية وقناة التوزيع

عيّن قبل إنشاء المفتاح مالكاً مؤسسياً مسؤولاً عن حفظه وعن صلاحية النشر. استخدم مدير أسرار مؤسسي أو مخزناً مشفراً مع نسخ احتياطي محكوم؛ فقدان المفتاح يمنع تحديث التطبيقات المثبتة التي تحمل التوقيع نفسه.

| قناة التوزيع | المفتاح المطلوب في GitHub |
|---|---|
| APK داخلي مباشر | مفتاح إصدار المؤسسة نفسه |
| Google Play مع Play App Signing | **Upload key** فقط؛ Google يحتفظ بـ App signing key |

> لا تخلط قناة APK المباشر وGoogle Play App Signing لنفس `applicationId` من دون خطة مفاتيح واضحة. APK المباشر الموقّع بمفتاح مختلف لا يحدّث تطبيقاً مثبّتاً من Play، والعكس صحيح.

## 2. إنشاء المفتاح محلياً لدى مسؤول المؤسسة

نفّذ هذه الأوامر على جهاز مسؤول موثوق ومشفّر، وليس داخل المستودع. سيطلب `keytool` كلمات المرور تفاعلياً؛ لا تمررها في سطر الأوامر.

```bash
mkdir -p ~/narqa-signing-secure
cd ~/narqa-signing-secure

keytool -genkeypair \
  -keystore narqa-ebos-release.jks \
  -storetype JKS \
  -alias narqa-ebos-release \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -v

# تحقق من الاسم المستعار والبصمة محلياً فقط.
keytool -list -v \
  -keystore narqa-ebos-release.jks \
  -alias narqa-ebos-release
```

احفظ في مخزن أسرار المؤسسة هذه القيم: ملف `narqa-ebos-release.jks`، كلمة مرور المخزن، الاسم المستعار، وكلمة مرور المفتاح. أنشئ نسخة احتياطية مشفرة مع إجراءات استرجاع محددة.

## 3. تجهيز قيم GitHub Secrets

نفّذ الأمرين التاليين محلياً داخل المجلد الآمن. لا تحفظ الملفين الناتجين في Git:

```bash
# Linux
base64 -w 0 narqa-ebos-release.jks > narqa-ebos-release.jks.base64
sha256sum narqa-ebos-release.jks | awk '{print $1}' > narqa-ebos-release.jks.sha256

# macOS بدلاً من سطر base64 أعلاه
# base64 < narqa-ebos-release.jks | tr -d '\n' > narqa-ebos-release.jks.base64
```

ستحتاج إلى خمس قيم فقط:

| GitHub Environment secret | القيمة |
|---|---|
| `ANDROID_RELEASE_KEYSTORE_BASE64` | كامل محتوى `narqa-ebos-release.jks.base64` في **سطر واحد** |
| `ANDROID_RELEASE_KEYSTORE_SHA256` | محتوى `narqa-ebos-release.jks.sha256` |
| `ANDROID_RELEASE_KEYSTORE_PASSWORD` | كلمة مرور مخزن المفاتيح |
| `ANDROID_RELEASE_KEY_ALIAS` | `narqa-ebos-release` أو الاسم المستعار الفعلي الذي اخترته |
| `ANDROID_RELEASE_KEY_PASSWORD` | كلمة مرور المفتاح |

لا تطبع هذه القيم للتحقق في سجل CI، ولا ترسلها إلى أي شخص عبر المحادثة. الاسم المستعار يمكن اعتباره سرياً هنا لتبسيط إدارة الإعدادات.

## 4. إنشاء بيئة GitHub محمية

يجب أن ينفذ مسؤول لديه صلاحية **Admin** في `Mozoo1999/ARQA-NEW` ما يلي:

1. افتح **Settings → Environments → New environment** في المستودع.
2. أنشئ بيئة بالاسم الحرفي: `android-production`.
3. فعّل **Required reviewers** وأضف مالك الإصدار/المسؤول الأمني. فعّل منع المراجعة الذاتية إن كانت سياسة المؤسسة تتطلب شخصين.
4. تحت **Deployment branches**، اسمح بـ `main` فقط أو بالفرع المحمي المعتمد للإصدار.
5. في **Environment secrets**، اختر **Add secret** خمس مرات وأدخل الأسماء والقيم المذكورة في الجدول السابق.
6. لا تضف هذه القيم في **Repository variables** أو `app.json` أو ملفات `.env` أو أي commit. الأسرار محصورة في البيئة المحمية.

لا يمكن لحساب CLI المستخدم في التحقق السابق إدارة هذه الأسرار؛ كانت النتيجة `403 Resource not accessible by integration`. هذه خطوة مقصودة تتطلب صلاحية المالك/المسؤول.

## 5. تشغيل إصدار موقّع والتحقق منه

بعد حفظ الأسرار، افتح **Actions → Build Signed Android Release → Run workflow** على فرع `main`.

1. راجع الالتزام المختار، ثم ابدأ التشغيل.
2. وافق على طلب البيئة `android-production` عند ظهور طلب المراجعة.
3. سيجري سير العمل: TypeScript، `expo prebuild`، فك المفتاح مؤقتاً في `RUNNER_TEMP`، فحص SHA-256 للمفتاح، تكوين Gradle، وبناء APK arm64 وAAB.
4. يفشل السير العمل صراحةً إذا غاب سر، أو لم تطابق بصمة المفتاح، أو بقي التوقيع `CN=Android Debug`، أو ظهرت أذونات محظورة، أو غاب الـ bundle المضمّن.
5. نزّل artifact باسم `narqa-ebos-signed-android-release`. يحتوي على:
   - `narqa-ebos-arm64-v8a-signed-release.apk` للتوزيع الداخلي المباشر.
   - `narqa-ebos-signed-release.aab` لرفع Google Play (عند اختيار هذا المسار).
   - `SHA256SUMS.txt` و`signed-apk-signature.txt` للتحقق المستقل.

نفّذ فحصاً مستقلاً قبل التوزيع:

```bash
apksigner verify --verbose --print-certs narqa-ebos-arm64-v8a-signed-release.apk
sha256sum -c SHA256SUMS.txt
```

يجب أن يظهر توقيع v2 صحيح وألا تكون هوية الشهادة `CN=Android Debug`.

## 6. الإصدار الأول والاختبار

- الحزمة الحالية على الهواتف موقعة بشهادة Debug. لا يمكن تحديثها بحزمة موقعة بمفتاح المؤسسة؛ احذف نسخة Debug أولاً من هاتف الاختبار، أو استخدم جهاز اختبار نظيف.
- قبل كل إصدار لاحق، زد `expo.version` و`android.versionCode` في `apps/mobile/app.json`. يجب أن يكون `versionCode` عدداً صحيحاً أكبر من الإصدار المثبت سابقاً.
- بعد نجاح التوقيع، نفّذ اختبار هاتف Android فعلي بحساب مصادق: OAuth، جلسة صوتية مع إذن ميكروفون، صورة أو PDF، مراجعة، ورفض/تأكيد لاختبار سجل التدقيق. لا يكفي نجاح المحاكي وحده.
- لا يعتبر وجود APK موقّع دليلاً على إصدار iOS؛ يحتاج iOS/iPad حساب Apple Developer وشهادات وprovisioning وTestFlight/اختبار جهاز مستقل.

## الملفات المسؤولة في المستودع

| الملف | الغرض |
|---|---|
| `.github/workflows/android-signed-release.yml` | بناء يدوي محمي ببيئة `android-production`؛ لا يستخدم الأسرار في سير العمل الداخلي. |
| `apps/mobile/scripts/configure-android-release-signing.cjs` | يهيئ مشروع Gradle الذي ينشئه Expo وقت CI، ويرفض البناء إذا لم توجد خصائص التوقيع المطلوبة. |
| `.github/workflows/android-internal-apk.yml` | يبقى للحزمة الداخلية ذات توقيع Debug واختبار المحاكي؛ ليس مسار إنتاج. |
| `.gitignore` | يمنع ملفات المفاتيح والتبعيات وملفات البيئة المحلية من دخول Git. |
