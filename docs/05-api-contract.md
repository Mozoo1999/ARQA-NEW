# حدود واجهة الخدمة (API)

هذه صياغة مبدئية للواجهة الخلفية. تعتمد كل واجهة كتابة على مستخدم مخوّل وتسجل أثر التدقيق.

## الموارد

| الأسلوب والمسار | الغرض |
| --- | --- |
| `POST /v1/suppliers` | إضافة مورد |
| `POST /v1/quarries` | إضافة محجر/مصدر |
| `POST /v1/products` | إضافة منتج |
| `POST /v1/product-sources` | ربط منتج بمصدر |
| `POST /v1/product-sources/{id}/prices` | إضافة سعر شراء مؤرخ |
| `POST /v1/transport-prices` | إضافة سعر نقل لمسار |
| `GET /v1/products/{id}/options?zoneId=&quantity=&date=` | بدائل التوريد مرتبة |
| `POST /v1/quote-requests` | طلب تسعير لمشروع |
| `POST /v1/quote-requests/{id}/calculate` | حساب العرض وحفظ اللقطة |
| `POST /v1/quotes/{id}/approve` | اعتماد العرض |
| `POST /v1/supply-orders` | تحويل عرض معتمد إلى أمر توريد |

## مثال حساب عرض سعر

### الطلب

```json
{
  "projectId": "project-91",
  "productId": "aggregate-1",
  "deliveryZoneId": "october",
  "quantity": 3000,
  "unit": "ton",
  "deliveryDate": "2026-09-10",
  "adminRate": 0.03,
  "profitMarkupRate": 0.15
}
```

### الاستجابة

```json
{
  "quoteId": "quote-440",
  "currency": "EGP",
  "recommendedUnitPrice": 182.67,
  "landedUnitCost": 154,
  "totalPrice": 548010,
  "selectedOption": {
    "productSourceId": "source-b",
    "transportModeId": "six-wheel",
    "reasons": ["أقل تكلفة هابطة", "الكمية متاحة"]
  },
  "costLines": [
    {"kind": "purchase", "unitAmount": 126},
    {"kind": "transport", "unitAmount": 28},
    {"kind": "administration", "unitAmount": 4.62},
    {"kind": "profit", "unitAmount": 23.83}
  ],
  "pricingSnapshotAt": "2026-08-16T10:00:00Z"
}
```

## أخطاء عمل متوقعة

- `PRICE_NOT_AVAILABLE`: لا يوجد سعر شراء أو نقل ساري للتاريخ المطلوب.
- `INSUFFICIENT_CAPACITY`: الكمية أو الموعد يتجاوزان قدرة المصدر أو الناقل.
- `UNIT_CONVERSION_REQUIRED`: تعذر مقارنة السعر بالكمية لاختلاف الوحدة.
- `PRICE_PERIOD_CONFLICT`: تداخل فترة السعر الجديد مع سجل ساري قائم.
