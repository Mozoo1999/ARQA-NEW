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
