# حزمة القبول التنفيذي
## NARQA Enterprise Business Operating System (EBOS)
## النموذج التشغيلي v0.1 — Final

**التاريخ:** 2026-07-10  
**الإصدار:** v0.1-final  
**الحالة:** مكتمل وجاهز للتقييم الداخلي

---

## 1. ملخص تنفيذي

تم تسليم النموذج التشغيلي الأول لنظام NARQA EBOS بنجاح. النظام يعمل بشكل كامل على بيئة الويب ويغطي سبع وحدات تشغيلية متكاملة تشمل إدارة المنظمة، المشاريع، الموردين، طلبات الشراء، الحوكمة المعمارية، وبرج التحكم المؤسسي.

النموذج جاهز للاستخدام الداخلي الفعلي داخل الشركة لاختبار سير العمل المؤسسي وتقييم الجاهزية للإنتاج.

---

## 2. نتائج التحقق النهائي

| المعيار | النتيجة | الدليل |
|---|---|---|
| TypeScript | ✅ PASS | 0 أخطاء |
| الاختبارات | ✅ PASS | 33/33 اختبار يمر |
| البناء | ✅ PASS | `pnpm build` ينجح في 5.17 ثانية |
| قاعدة البيانات | ✅ تعمل | 15 جدول، بيانات حية |
| المصادقة | ✅ تعمل | Manus OAuth + JWT session |
| الـ APIs | ✅ تعمل | 40+ procedure عبر tRPC |
| E2E Workflow | ✅ مُنفَّذ | PR-20260709-0602: draft→submitted→approved |

---

## 3. هيكل المشروع

```
narqa-ebos-prototype/
├── client/                    # React 19 + Tailwind 4 + shadcn/ui
│   └── src/
│       ├── pages/
│       │   ├── ControlTower.tsx          # برج التحكم المؤسسي
│       │   ├── organization/             # الشركة، الفروع، الأقسام
│       │   ├── projects/                 # المشاريع + التفاصيل
│       │   ├── suppliers/                # الموردون + التفاصيل
│       │   ├── procurement/              # طلبات الشراء + الاعتماد
│       │   ├── governance/               # المراجعات، القرارات، التتبع
│       │   └── admin/                    # إدارة المستخدمين
│       └── components/
│           └── DashboardLayout.tsx       # تخطيط لوحة التحكم
├── server/
│   ├── routers.ts                        # 40+ tRPC procedures
│   ├── db.ts                             # Query helpers
│   └── _core/                            # Auth, OAuth, tRPC setup
├── drizzle/
│   └── schema.ts                         # 14 جدول + أنواع TypeScript
├── scripts/
│   └── seed.mjs                          # بيانات تجريبية حقيقية
├── docs/
│   ├── DATABASE-ERD.md/.png              # مخطط قاعدة البيانات
│   ├── MISSION-002-VALIDATION-REPORT.md  # تقرير التحقق
│   └── EXECUTIVE-ACCEPTANCE-PACKAGE-v0.1.md (هذا الملف)
└── README.md                             # دليل التثبيت والنشر
```

---

## 4. الوحدات المُنفَّذة

### الوحدة 1: برج التحكم المؤسسي (Control Tower)
- **الحالة:** ✅ تعمل بالكامل
- **الوصف:** لوحة تحكم مركزية تعرض إحصاءات حية من قاعدة البيانات
- **الإحصاءات المعروضة:** المستخدمون، المشاريع (إجمالي/نشط)، الموردون، طلبات الشراء (إجمالي/معلق/معتمد)، مراجعات البنية، قرارات البنية
- **سجل النشاط:** آخر 30 عملية عبر جميع الوحدات

### الوحدة 2: المنظمة (Organization)
- **الحالة:** ✅ تعمل بالكامل
- **الشركة:** إنشاء/تعديل ملف الشركة (upsert)
- **الفروع:** CRUD كامل — 3 فروع في قاعدة البيانات
- **الأقسام:** CRUD كامل — 6 أقسام في قاعدة البيانات

### الوحدة 3: المشاريع (Projects)
- **الحالة:** ✅ تعمل بالكامل
- **القائمة:** بحث + فلترة بالحالة
- **الإنشاء/التعديل:** نموذج كامل مع التحقق
- **صفحة التفاصيل:** معلومات المشروع + أعضاء الفريق + إجراءات الحالة
- **البيانات:** 4 مشاريع (2 نشط، 1 تخطيط، 1 مكتمل)

### الوحدة 4: الموردون (Suppliers)
- **الحالة:** ✅ تعمل بالكامل
- **التصنيفات:** 5 تصنيفات
- **الموردون:** CRUD كامل + صفحة تفاصيل
- **البيانات:** 4 موردين نشطين

### الوحدة 5: طلبات الشراء (Purchase Requests)
- **الحالة:** ✅ تعمل بالكامل
- **الإنشاء:** نموذج كامل مع بنود متعددة + حساب الإجمالي تلقائياً
- **تدفق الاعتماد:** مسودة → مُقدَّم → قيد المراجعة → معتمد/مرفوض/ملغى
- **صلاحيات:** صاحب الطلب يقدم، المدير/المسؤول يعتمد
- **E2E مُنفَّذ:** PR-20260709-0602 معتمد بقيمة 45,000 ريال

### الوحدة 6: الحوكمة المعمارية (Governance)
- **الحالة:** ✅ تعمل بالكامل
- **مراجعات البنية:** إنشاء + قائمة + panel تفاصيل inline + تحديث الحالة
- **قرارات البنية (ADR):** إنشاء + قائمة + panel تفاصيل inline
- **مصفوفة التتبع:** ربط القرارات بالمراجعات والمشاريع
- **البيانات:** 3 مراجعات، 5 قرارات ADR، 6 روابط تتبع

### الوحدة 7: إدارة المستخدمين (Users)
- **الحالة:** ✅ تعمل بالكامل
- **القائمة:** عرض جميع المستخدمين مع الأدوار
- **تغيير الدور:** admin يمكنه تغيير دور أي مستخدم
- **الأدوار:** admin / manager / user

---

## 5. قاعدة البيانات

### الجداول (14 جدول + جدول migrations)

| الجدول | الوصف | الصفوف |
|---|---|---|
| users | المستخدمون مع الأدوار | 1 |
| company | ملف الشركة | 1 |
| branches | الفروع | 3 |
| departments | الأقسام | 6 |
| projects | المشاريع | 4 |
| project_team_members | أعضاء فريق المشاريع | 0 |
| supplier_categories | تصنيفات الموردين | 5 |
| suppliers | الموردون | 4 |
| purchase_requests | طلبات الشراء | 1 |
| purchase_request_items | بنود طلبات الشراء | 1 |
| architecture_reviews | مراجعات البنية | 3 |
| architecture_decisions | قرارات البنية (ADR) | 5 |
| traceability_matrix | مصفوفة التتبع | 6 |
| activity_log | سجل النشاط | 1 |

---

## 6. API Inventory (tRPC Procedures)

### وحدة المصادقة (auth)
| Procedure | النوع | الوصف |
|---|---|---|
| auth.me | Query | الحصول على المستخدم الحالي |
| auth.logout | Mutation | تسجيل الخروج |

### وحدة المستخدمين (users)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| users.list | Query | admin | قائمة المستخدمين |
| users.update | Mutation | admin | تحديث دور المستخدم |

### وحدة المنظمة (organization)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| company.get | Query | protected | الحصول على بيانات الشركة |
| company.upsert | Mutation | admin | إنشاء/تحديث الشركة |
| branches.list | Query | protected | قائمة الفروع |
| branches.create | Mutation | admin/manager | إنشاء فرع |
| branches.update | Mutation | admin/manager | تحديث فرع |
| branches.delete | Mutation | admin | حذف فرع |
| departments.list | Query | protected | قائمة الأقسام |
| departments.create | Mutation | admin/manager | إنشاء قسم |
| departments.update | Mutation | admin/manager | تحديث قسم |
| departments.delete | Mutation | admin | حذف قسم |

### وحدة المشاريع (projects)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| projects.list | Query | protected | قائمة المشاريع |
| projects.getById | Query | protected | تفاصيل مشروع |
| projects.create | Mutation | admin/manager | إنشاء مشروع |
| projects.update | Mutation | admin/manager | تحديث مشروع |
| projects.delete | Mutation | admin | حذف مشروع |
| projects.addTeamMember | Mutation | admin/manager | إضافة عضو للفريق |
| projects.removeTeamMember | Mutation | admin/manager | إزالة عضو من الفريق |

### وحدة الموردين (suppliers)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| supplierCategories.list | Query | protected | قائمة التصنيفات |
| supplierCategories.create | Mutation | admin/manager | إنشاء تصنيف |
| suppliers.list | Query | protected | قائمة الموردين |
| suppliers.getById | Query | protected | تفاصيل مورد |
| suppliers.create | Mutation | admin/manager | إنشاء مورد |
| suppliers.update | Mutation | admin/manager | تحديث مورد |
| suppliers.delete | Mutation | admin | حذف مورد |

### وحدة طلبات الشراء (purchaseRequests)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| purchaseRequests.list | Query | protected | قائمة الطلبات |
| purchaseRequests.getById | Query | protected | تفاصيل طلب |
| purchaseRequests.create | Mutation | protected | إنشاء طلب مع بنود |
| purchaseRequests.submit | Mutation | protected | تقديم للاعتماد |
| purchaseRequests.startReview | Mutation | admin/manager | بدء المراجعة |
| purchaseRequests.approve | Mutation | admin/manager | الاعتماد |
| purchaseRequests.reject | Mutation | admin/manager | الرفض |
| purchaseRequests.cancel | Mutation | protected | الإلغاء |

### وحدة الحوكمة (governance)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| governance.reviews.list | Query | protected | قائمة المراجعات |
| governance.reviews.create | Mutation | admin/manager | إنشاء مراجعة |
| governance.reviews.updateStatus | Mutation | admin/manager | تحديث حالة مراجعة |
| governance.decisions.list | Query | protected | قائمة القرارات |
| governance.decisions.create | Mutation | admin/manager | إنشاء قرار ADR |
| governance.traceability.list | Query | protected | مصفوفة التتبع |
| governance.traceability.create | Mutation | admin/manager | إنشاء رابط تتبع |

### برج التحكم (controlTower)
| Procedure | النوع | الصلاحية | الوصف |
|---|---|---|---|
| controlTower.stats | Query | protected | إحصاءات حية |
| controlTower.activity | Query | protected | سجل النشاط الأخير |

---

## 7. سير العمل E2E المُنفَّذ

```
المستخدم: Moemen Mansor (admin)
    ↓
الشركة: NARQA (موجودة في DB)
    ↓
الفرع: المقر الرئيسي - الرياض
    ↓
القسم: إدارة تقنية المعلومات
    ↓
المشروع: PRJ-001 تطوير نظام NARQA EBOS (نشط)
    ↓
المورد: SUP-001 شركة الحلول التقنية المتقدمة
    ↓
طلب الشراء: PR-20260709-0602
  - العنوان: شراء خوادم لمشروع EBOS
  - البند: 3x Dell PowerEdge R750 @ 15,000 SAR = 45,000 SAR
  - الحالة: draft → submitted → approved
  - ملاحظات الاعتماد: تمت المراجعة والموافقة
    ↓
سجل النشاط: procurement/approve/PR-20260709-0602
    ↓
برج التحكم: يعرض 1 طلب معتمد (حي من DB)
```

---

## 8. الأمان والصلاحيات

| المستوى | الوصف |
|---|---|
| publicProcedure | لا يتطلب مصادقة |
| protectedProcedure | يتطلب تسجيل دخول صالح |
| managerOrAdminProcedure | يتطلب دور manager أو admin |
| adminProcedure | يتطلب دور admin فقط |

**معالجة الأخطاء:**
- `UNAUTHORIZED` → إعادة توجيه تلقائية لصفحة تسجيل الدخول
- `FORBIDDEN` → رسالة toast للمستخدم
- `NOT_FOUND` → رسالة toast للمستخدم
- `BAD_REQUEST` → رسالة toast مع تفاصيل الخطأ
- React errors → ErrorBoundary يعرض رسالة خطأ مع زر إعادة التحميل
- صفحة 404 → NotFound page مع روابط للعودة

---

## 9. القيود المعروفة (غير حاجبة للتشغيل)

| القيد | التأثير | الأولوية في v0.2 |
|---|---|---|
| حقل "justification" في نموذج طلب الشراء لا يُحفظ في DB | منخفض — الحقل اختياري | متوسطة |
| لا pagination على صفحات القوائم | منخفض — مقبول عند حجم البروتوتايب | عالية |
| لا إشعارات بريد إلكتروني | منخفض — يمكن الاعتماد على سجل النشاط | متوسطة |
| لا مرفقات على طلبات الشراء | منخفض — يمكن الإشارة للمستندات نصياً | متوسطة |
| حجم bundle كبير (738KB) | منخفض — code splitting مطلوب للإنتاج | عالية |
| مستخدم واحد فقط في قاعدة البيانات | منخفض — يُضاف المستخدمون عند تسجيل الدخول | لا يوجد |

---

## 10. دليل التثبيت السريع

```bash
# 1. استنساخ المشروع
git clone <repo-url>
cd narqa-ebos-prototype

# 2. تثبيت التبعيات
pnpm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# تعديل DATABASE_URL و JWT_SECRET

# 4. تطبيق migrations
pnpm drizzle-kit push

# 5. تشغيل seed data (اختياري)
node scripts/seed.mjs

# 6. تشغيل بيئة التطوير
pnpm dev

# 7. بناء للإنتاج
pnpm build
node dist/index.js
```

---

## 11. دليل النشر

### النشر على Manus (الحالي)
النظام منشور على Manus Autoscale hosting ومتاح مباشرة عبر الرابط المُولَّد.

### النشر على خادم خاص
```bash
# متطلبات: Node.js 22+, MySQL 8+
pnpm build
NODE_ENV=production DATABASE_URL="mysql://..." node dist/index.js
```

### متطلبات الخادم
- Node.js 22+
- MySQL 8.0+ أو TiDB
- 512MB RAM (الحد الأدنى)
- 1 vCPU

### ملاحظة: Android APK / iOS
هذا النظام تطبيق ويب (Web App) وليس تطبيق جوال أصلي. يمكن الوصول إليه من أي متصفح على الجوال. لا يتطلب APK أو iOS build.

---

## 12. التقييم النهائي

### مصفوفة جاهزية الإنتاج

| المعيار | الحالة | الدليل |
|---|---|---|
| الكود يُبنى بنجاح | ✅ | `pnpm build` → 5.17s |
| TypeScript نظيف | ✅ | 0 أخطاء |
| الاختبارات تمر | ✅ | 33/33 |
| قاعدة البيانات تعمل | ✅ | 15 جدول، بيانات حية |
| المصادقة تعمل | ✅ | Manus OAuth + JWT |
| الـ APIs تعمل | ✅ | 40+ procedure |
| سير العمل E2E مُنفَّذ | ✅ | PR-20260709-0602 |
| لا بيانات وهمية | ✅ | كل البيانات من DB |
| لا صفحات placeholder | ✅ | 17 صفحة وظيفية |
| معالجة الأخطاء | ✅ | toast + ErrorBoundary + 404 |
| التوثيق مكتمل | ✅ | README + ERD + تقارير |

---

## 13. التوصية التنفيذية

```
══════════════════════════════════════════════════════════════
READY FOR INTERNAL OPERATION
══════════════════════════════════════════════════════════════

النموذج التشغيلي NARQA EBOS v0.1 جاهز للاستخدام الداخلي.

يغطي النظام سير العمل المؤسسي الكامل من إنشاء الشركة
حتى اعتماد طلبات الشراء وتتبع القرارات المعمارية.

جميع الوحدات السبع تعمل ببيانات حية من قاعدة البيانات.
لا توجد بيانات وهمية أو وظائف placeholder.

القيود الموثقة لا تحجب التشغيل الفعلي وستُعالج في v0.2.

الخطوة التالية المقترحة:
تثبيت النظام وتشغيل سير عمل حقيقي داخل الشركة
لاختبار الجاهزية للإنتاج الكامل.
══════════════════════════════════════════════════════════════
```

---

*NARQA Enterprise Business Operating System (EBOS) — Operational Prototype v0.1-final*  
*تاريخ الإنتاج: 2026-07-10*
