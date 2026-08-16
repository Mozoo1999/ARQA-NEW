# نموذج بيانات المرحلة الأولى

## مبدأ التصميم

تستعمل الجداول سجلات مؤرخة بدلاً من أعمدة سعر قابلة للكتابة فوقها. كل تسعير يعتمد على **لقطة** من السجلات السارية وقت إنشائه.

## الكيانات

| الكيان | الغرض | حقول أساسية |
| --- | --- | --- |
| `products` | تعريف المادة ووحدة القياس | id, code, name, base_unit, active |
| `suppliers` | بيانات المورد وتقييمه | id, name, tax_no, quality_score, on_time_rate |
| `quarries` | مواقع الإنتاج أو التحميل | id, supplier_id, name, latitude, longitude, daily_capacity |
| `product_sources` | ربط منتج بمصدر | id, product_id, quarry_id, minimum_qty, available_qty, loading_minutes |
| `supplier_prices` | سعر شراء مؤرخ للمصدر | id, product_source_id, amount, currency, unit, valid_from, valid_to |
| `delivery_zones` | مناطق/مواقع التسليم | id, name, latitude, longitude |
| `transport_modes` | نوع المركبة وحمولتها | id, name, capacity, capacity_unit |
| `transport_prices` | سعر مسار مؤرخ | id, quarry_id, delivery_zone_id, transport_mode_id, amount, pricing_basis, valid_from, valid_to |
| `cost_adjustments` | تحميل، رسوم، انتظار، إكرامية، هالك | id, scope, kind, amount, basis, valid_from, valid_to |
| `customers` | عميل له سياسة سعر خاصة | id, name, credit_limit |
| `projects` | مشروع العميل وموقعه | id, customer_id, delivery_zone_id, name, start_date, end_date |
| `project_material_requirements` | الطلب المخطط للمادة | id, project_id, product_id, quantity, due_date |
| `quote_requests` | مدخلات طلب التسعير | id, project_id, product_id, quantity, requested_date |
| `quotes` | لقطة تسعير معتمدة | id, quote_request_id, status, currency, subtotal, profit, total |
| `quote_cost_lines` | عناصر تكلفة العرض غير القابلة للتغيير | id, quote_id, category, source_record_id, amount, unit_amount |
| `purchase_orders` | أمر شراء للمورد | id, supplier_id, status, ordered_at |
| `supply_orders` | أمر توريد للموقع | id, project_id, quote_id, status |
| `truck_trips` | النقلة المخططة أو الفعلية | id, supply_order_id, transport_mode_id, quantity, departed_at, delivered_at |
| `expenses` | مصروف فعلي قابل للإسناد | id, trip_id, cost_center_id, kind, amount |
| `cost_centers` | مركز تكلفة مشروع/تشغيل | id, code, name |

## قيود البيانات

- فريد: `products.code` و`suppliers.tax_no` عند وجوده.
- لا تتداخل فترات السعر الساري لنفس المصدر والوحدة والعملة.
- `valid_to >= valid_from` إذا وُجدت.
- مجموع الكميات المؤكدة لا يتجاوز الطاقة المتاحة ما لم يمنح مستخدم مخوّل استثناءً.
- كل `quote_cost_line` يخزن `source_record_id` وقيمة البند المحسوبة؛ السجل التاريخي لا يُعاد حسابه.
- يحفظ التدقيق: `created_at, created_by, updated_at, updated_by` لكل سجل تشغيلي.

## علاقات مهمة

```text
Supplier 1 ── * Quarry 1 ── * ProductSource * ── 1 Product
ProductSource 1 ── * SupplierPrice
Quarry + DeliveryZone + TransportMode 1 ── * TransportPrice
Project * ── 1 Customer
Project 1 ── * QuoteRequest 1 ── * QuoteCostLine
Quote 1 ── * SupplyOrder 1 ── * TruckTrip 1 ── * Expense
```
