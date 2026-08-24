# ARQA NEW
IMPORTANT STOR

## ARQA Supply Core — المرحلة الأولى

النواة الأولى لمنصة **ARQA** للمقاولات والتوريدات: تسعير مبني على **سلسلة التكلفة** بدلًا من سعر ثابت للمنتج.

### ما أُضيف في هذا الفرع

- [وثيقة الرؤية والنطاق](docs/01-supply-core-vision-ar.md)
- [محرك سلسلة التكلفة وقرار المصدر](docs/02-cost-chain-and-decision-engine.md)
- [نموذج البيانات](docs/03-data-model.md) و[مخطط PostgreSQL](database/001_supply_core.sql)
- [خارطة التنفيذ](docs/04-delivery-roadmap.md) و[حدود API](docs/05-api-contract.md)
- محرك TypeScript في `packages/cost-engine/`
- [نموذج التسعير التفاعلي](apps/web/README.md)

> لا يُسعّر المنتج منفصلًا عن مصدره وطريقة نقله وموقع التسليم وتاريخ السعر. كل عرض سعر يحتفظ بلقطة قابلة للمراجعة من عناصر تكلفته.

### التوسع إلى MVP المقاولات

- [رؤية ARQA كمنصة تشغيل ذكية](docs/00-arqa-platform-vision-ar.md)
- [نطاق MVP للمقاولات والتوريدات](docs/06-contracting-mvp-module-map-ar.md)
- [المعمارية القابلة للتوسع](docs/07-platform-architecture-ar.md)
- [الحوكمة التشغيلية والبيانية](docs/08-operating-governance-ar.md)

### الرؤية المستقبلية

- [ARQA كمنصة تشغيل ذكية عالمية](docs/09-future-operating-platform-vision-ar.md)

### التحصيل والمدخلات الذكية

- [مواصفات الصوت والصور والمستندات وواتساب والتحصيل](docs/10-multimodal-inputs-collections-ar.md)
- [متطلبات واتساب Business وعقود التكامل](docs/11-whatsapp-integration-ar.md)
- [مخطط بيانات التحصيل والمدخلات](database/002_multimodal_collections.sql)

### ذكاء إشعارات الهاتف

- [مواصفات إشعارات الهاتف والاقتراحات المالية](docs/12-mobile-notification-intelligence-ar.md)
- [مخطط بيانات الإشعارات والمطابقات والاقتراحات](database/003_mobile_notification_suggestions.sql)

### النسخة المحمولة متعددة المنصات

أُضيف تطبيق Expo في `apps/mobile/` ليعمل على iPhone وAndroid والأجهزة اللوحية. التطبيق يعيد استخدام `packages/cost-engine/` و`packages/command-intake/` مباشرة، ويقدم حاسبة سلسلة تكلفة فعلية وتحليل أوامر عربية مع طلب تأكيد قبل أي تنفيذ. التخطيط يتكيف إلى تنقل سفلي في الهاتف وشريط جانبي في الشاشات اللوحية بعرض 768 نقطة أو أكثر.

للتشغيل:

```bash
pnpm install
cd apps/mobile
pnpm install
pnpm start
```

للتأكد من حزمة الويب:

```bash
pnpm exec expo export --platform web
```

للتشغيل المحلي على Android أو iOS:

```bash
pnpm run android
pnpm run ios
```

حالة التسليم الحالية: **APK/AAB وiOS IPA غير مولدة** لأن مستودع ARQA-NEW لا يحتوي على إعداد توقيع Android أو Apple Developer. استخدم `apps/mobile/README.md` لأوامر EAS Build الدقيقة بعد توفير بيانات التوقيع. الواجهة الحالية صريحة في أن المستودع لا يوفر backend إنتاجياً بعد؛ لذلك لا تدعي حفظ بيانات أو إشعارات أصلية.
