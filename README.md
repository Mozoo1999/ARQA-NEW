# ARQA NEW — NARQA EBOS

مستودع **NARQA EBOS** للتشغيل المؤسسي: منصة ويب React/Express/TiDB-MySQL، وتطبيق Expo أصلي لأندرويد وiOS/iPad، مع محركات مشتركة لسلسلة التكلفة وتحليل الأوامر العربية.

> هذه وثيقة تسليم تشغيلية دقيقة. لا تعني الحزمة أو الاختبارات أن كل تكامل خارجي أو اختبار جهاز مادي مكتمل؛ الحدود المفتوحة موثقة صراحةً أدناه.

## البنية

| المسار | المسؤولية |
|---|---|
| `web-platform/` | تطبيق الويب والخادم: React 19، Express، tRPC، Drizzle، MySQL/TiDB، OAuth، تحليل مستندات محكوم، وإشعارات داخلية. |
| `apps/mobile/` | تطبيق Expo/React Native عربي RTL للهاتف واللوحي: إدخال صوتي/نصي، مراجعة مستندات وصور وPDF، جهات اتصال باختيار فردي، وإشعارات داخلية. |
| `packages/cost-engine/` | حساب سلسلة التكلفة وترتيب المصادر مع أدلة التكلفة والجودة والقدرة والنقل. |
| `packages/command-intake/` | تحليل أولي لأوامر عربية؛ التنفيذ الفعلي محكوم بالسجل الخادمي والموافقة الصريحة. |
| `packages/document-intelligence/` | أنواع ودمج حتمي لأدلة تحليل صفحات المستندات. |
| `docs/` | أدلة التحقق، حدود الخصوصية، وإثباتات حزم Android. |

## قدرات متحققة في المصدر

- سجلات أوامر عربية مركزية، أسئلة متعددة الجولات، أدوار، تأكيد/رفض، وتدقيق المستخدم/الوقت/القناة.
- تحليل بصري من الخادم للصور وصفحات PDF المتسلسلة مع أدلة وثقة وتعارضات وصفحات غير مقروءة؛ لا إدراج تلقائي من الذكاء الاصطناعي.
- عقود وقت تشغيل خادمية لمخرجات الذكاء الاصطناعي وحماية من جعل النص المستخرج أو ملف المستخدم تعليمات للنموذج.
- إدخال تشغيلي لمورد/عميل/مشروع/نقلة/حمولة/إذن استلام ومسودات مالية ضمن التفويض والموافقة.
- مركز صلاحيات للجوال، اختيار جهة اتصال واحدة فقط، وعدم قراءة SMS أو كشط WhatsApp.
- إشعارات داخلية دائمة مرتبطة بالمستخدم، حالة قراءة، وصفحات ويب وجوال، وتنبيه لمسارات المراجعة والاعتماد.
- تغذية صوتية عربية أصلية موحدة تتبع اللهجة المعتمدة عند دعمها؛ لا يوجد تسجيل خفي أو تشغيل صوت في الخلفية.

## التشغيل والتحقق من نسخة نظيفة

### المتطلبات

- Node.js 22 أو أحدث.
- Corepack/pnpm (المستودع يثبت إصدار pnpm المقترح في الحزمة).
- MySQL 8 أو TiDB متوافق لتشغيل منصة الويب.
- Android SDK/JDK 21 لبناء APK محلياً، أو GitHub Actions المرفق.
- حساب Apple Developer وجهاز/خدمات Apple فقط عند إصدار IPA موقّع.

### تثبيت محرك التكلفة والجوال

```bash
git clone https://github.com/Mozoo1999/ARQA-NEW.git
cd ARQA-NEW
corepack enable
pnpm install --frozen-lockfile
pnpm test:cost-engine
pnpm --dir apps/mobile exec tsc --noEmit
```

### تثبيت وتشغيل منصة الويب

`web-platform` حزمة مستقلة بقفل تبعياتها الخاص:

```bash
cd web-platform
pnpm install --ignore-workspace --frozen-lockfile
cp .env.example .env
# عيّن القيم الحقيقية في .env محلياً أو في مدير أسرار بيئة النشر.
pnpm check
pnpm test
pnpm build
pnpm dev
```

طبّق **الهجرات الموجودة فقط** إلى قاعدة بيانات مصرح بها بعد مراجعة SQL ونسخه الاحتياطي. لا تُنشئ هجرة جديدة في بيئة إنتاج لمجرد تثبيت التطبيق.

```bash
pnpm drizzle-kit migrate
```

## Android: إصدار داخلي قابل للتثبيت

آخر حزمة تحقق منها المشروع بنيت من الالتزام `9458d85be15774906b30b411106a9fcdf105551c` عبر GitHub Actions التشغيل [`37815936802`](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/37815936802). شغّل الخط نفسه نسخة `x86_64` منفصلة على Android Emulator API 35 وثبت الإقلاع وواجهة التطبيق؛ تظل حزمة الهاتف القابلة للتوزيع `arm64-v8a` فقط.

| البند | القيمة |
|---|---|
| اسم الحزمة | `com.narqa.ebos` |
| المعمارية | `arm64-v8a` |
| JavaScript | `assets/index.android.bundle` مضمّن؛ لا تحتاج Metro |
| التوقيع | APK v2 صالح (مفتاح Debug داخلي) |
| SHA-256 | `d4af26a5b6ee86960d172ededa6719df7b8b36c9121f2d65e021c7632b27928f` |

لتثبيت نسخة اختبارية: نزّل artifact باسم `narqa-ebos-internal-release-apk` من [تشغيل البناء الناجح](https://github.com/Mozoo1999/ARQA-NEW/actions/runs/37815936802)، فك الضغط، ثم انقل `narqa-ebos-arm64-v8a-internal.apk` إلى هاتف arm64، واسمح لمدير الملفات بالتثبيت من هذا المصدر. تحقق من SHA-256 قبل التثبيت.

توجد نسخة تحقق محلية مؤقتة في بيئة العمل؛ للاحتفاظ بها داخل الفريق استخدم artifact أو اصنع release داخلياً جديداً، لأن GitHub Actions يحتفظ به لمدة 14 يوماً فقط.

### تحويل Android إلى إصدار موقّع للمؤسسة

أضيف سير عمل منفصل `Build Signed Android Release` محمي ببيئة GitHub باسم `android-production`. لا يستخدم أي مفتاح Debug ولا ينفذ قبل توفر الأسرار وموافقة مراجعي البيئة. اتبع [دليل إعداد توقيع Android في GitHub Secrets](docs/ANDROID-RELEASE-SIGNING-SETUP.md) لإنشاء المفتاح محلياً، حفظه في Environment secrets، وبناء APK/AAB موقّعين. لا تضع المفتاح أو كلمة المرور في ملفات المستودع.

## iOS وiPad

المصدر يدعم iOS/iPad من إعداد Expo، لكن **لا يوجد IPA موقّع أو اختبار جهاز iOS مادي موثق**. يلزم حساب Apple Developer وشهادات وتوفير وتوقيع مناسب قبل أي تثبيت على iPhone/iPad. لا تستنتج جاهزية iOS من نجاح APK Android.

## الخصوصية والتكاملات

- جهات الاتصال: منتقٍ واحد فقط يبدأه المستخدم؛ لا رفع جماعي لدفتر العناوين.
- SMS: لا قراءة لصندوق الرسائل أو مراقبة خلفية؛ متطلبات Android للعميل الافتراضي لا تنطبق على هذا التطبيق.
- WhatsApp: حالة التكامل `not_configured` إلى أن تتوافر بيانات Meta Business الرسمية، webhook موقّع، سياسة موافقة/احتفاظ، ومعالجة تكرار؛ لا يوجد كشط WhatsApp Web.
- الذكاء الاصطناعي: الطلبات الحساسة تمر بالخادم فقط. لا تضع مفاتيح Forge أو Meta في تطبيق الجوال أو المصدر.

## وثائق إثبات رئيسية

- `docs/AI-ANALYSIS-AND-SPEECH-VERIFICATION-2026-10-04.md`
- `docs/AI-SPEECH-ANDROID-RELEASE-VERIFICATION-2026-10-04.md`
- `docs/ANDROID-INTERNAL-EMULATOR-VERIFICATION-2026-10-08.md`
- `docs/ANDROID-RELEASE-SIGNING-SETUP.md`
- `docs/FOUR-PROPOSALS-AND-MOBILE-RELEASE-2026-10-04.md`
- `docs/FOUR-PROPOSALS-REVALIDATION-2026-10-08.md`
- `web-platform/docs/IOS-IPAD-READINESS-2026-09-24.md`
- `docs/IN-APP-NOTIFICATIONS-2026-10-03.md`

## حدود يجب ألا تُخفى

1. يتطلب إثبات OAuth الفعلي والميكروفون والكاميرا وتحليل PDF وإدراج سجل من هاتف Android مصادق عليه اختباراً ميدانياً.
2. لا تتوافر حزمة iOS/iPad موقعة أو تحقق مادي بعد.
3. WhatsApp Business وSMS ليسا متصلين إنتاجياً من دون بيانات الاعتماد والسياسات الرسمية.
4. حزمة Android الداخلية موقعة بمفتاح Debug؛ لا تُستخدم للنشر العام أو Google Play.
