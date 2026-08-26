import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, GitCommit, Layers, Server, ShieldCheck, Table as TableIcon } from "lucide-react";

const erdEntities = [
  {
    name: "company",
    description: "الشركة الأم (إدارة الهوية الرئيسية للمؤسسة)",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف الشركة" },
      { name: "name", type: "varchar", pk: false, note: "اسم الشركة" },
      { name: "nameAr", type: "varchar", pk: false, note: "الاسم بالعربية" },
      { name: "industry", type: "varchar", pk: false, note: "قطاع النشاط" },
      { name: "address", type: "varchar", pk: false, note: "العنوان الرئيسي" },
      { name: "phone", type: "varchar", pk: false, note: "هاتف الاتصال" },
      { name: "email", type: "varchar", pk: false, note: "البريد الإلكتروني" },
    ],
    relations: ["تتفرع إلى عدة فروع (branches)"]
  },
  {
    name: "branches",
    description: "فروع الشركة التشغيلية والميدانية",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف الفرع" },
      { name: "companyId", type: "int", fk: true, note: "معرف الشركة الأم" },
      { name: "name", type: "varchar", pk: false, note: "اسم الفرع" },
      { name: "city", type: "varchar", pk: false, note: "المدينة" },
      { name: "isHeadquarters", type: "boolean", pk: false, note: "هل هو المقر الرئيسي" },
    ],
    relations: ["تتبع الشركة (company)", "تضم أقسامًا (departments)", "تدير مشاريع (projects)"]
  },
  {
    name: "departments",
    description: "الأقسام الإدارية والفنية داخل الفروع",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف القسم" },
      { name: "branchId", type: "int", fk: true, note: "معرف الفرع" },
      { name: "name", type: "varchar", pk: false, note: "اسم القسم" },
      { name: "code", type: "varchar", pk: false, note: "رمز القسم" },
      { name: "managerId", type: "int", fk: true, note: "معرف مدير القسم" },
    ],
    relations: ["تتبع الفرع (branches)", "يعمل بها موظفون (users)"]
  },
  {
    name: "users",
    description: "المستخدمون والموظفون والمديرون وصناع القرار",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف المستخدم" },
      { name: "name", type: "varchar", pk: false, note: "الاسم الكامل" },
      { name: "email", type: "varchar", pk: false, note: "البريد الإلكتروني" },
      { name: "role", type: "enum", pk: false, note: "الدور (admin, manager, user)" },
      { name: "departmentId", type: "int", fk: true, note: "معرف القسم التابع له" },
    ],
    relations: ["ينتمي للقسم (departments)", "ينفذ أنشطة (activity_log)", "يوافق على طلبات الشراء (purchase_requests)", "يعتمد قرارات البنية (architecture_decisions)"]
  },
  {
    name: "supplier_categories",
    description: "فئات وتصنيفات الموردين والمقاولين",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف الفئة" },
      { name: "name", type: "varchar", pk: false, note: "اسم الفئة" },
      { name: "description", type: "text", pk: false, note: "وصف النشاط" },
    ],
    relations: ["ترتبط بالموردين (suppliers)"]
  },
  {
    name: "suppliers",
    description: "الموردون المعتمدون والمقاولون ومقدمو الخدمات",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف المورد" },
      { name: "name", type: "varchar", pk: false, note: "اسم المورد" },
      { name: "categoryId", type: "int", fk: true, note: "معرف الفئة" },
      { name: "contactPerson", type: "varchar", pk: false, note: "مسؤول الاتصال" },
      { name: "rating", type: "decimal", pk: false, note: "تقييم الاعتماد" },
    ],
    relations: ["تتبع فئة الموردين (supplier_categories)", "ترتبط بطلبات الشراء (purchase_requests)"]
  },
  {
    name: "projects",
    description: "المشاريع الهندسية والإنشائية والتشغيلية",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف المشروع" },
      { name: "name", type: "varchar", pk: false, note: "اسم المشروع" },
      { name: "branchId", type: "int", fk: true, note: "معرف الفرع التابع" },
      { name: "budget", type: "decimal", pk: false, note: "الميزانية المعتمدة" },
      { name: "status", type: "enum", pk: false, note: "حالة المشروع" },
    ],
    relations: ["تتبع الفرع (branches)", "ترتبط بفريق العمل (project_team_members)", "تصدر عنها طلبات الشراء (purchase_requests)"]
  },
  {
    name: "purchase_requests",
    description: "طلبات الشراء والتعاقد والتوريد",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف الطلب" },
      { name: "projectId", type: "int", fk: true, note: "معرف المشروع" },
      { name: "supplierId", type: "int", fk: true, note: "معرف المورد" },
      { name: "amount", type: "decimal", pk: false, note: "إجمالي المبلغ" },
      { name: "status", type: "enum", pk: false, note: "حالة الطلب (draft, submitted, approved)" },
    ],
    relations: ["تتبع المشروع (projects)", "تتبع المورد (suppliers)", "تحتوي على بنود (purchase_request_items)"]
  },
  {
    name: "architecture_decisions (ADRs)",
    description: "قرارات البنية المؤسسية والهندسية المعتمَدة",
    columns: [
      { name: "id", type: "int", pk: true, note: "معرف القرار" },
      { name: "title", type: "varchar", pk: false, note: "عنوان القرار" },
      { name: "status", type: "enum", pk: false, note: "الحالة (proposed, approved)" },
      { name: "category", type: "varchar", pk: false, note: "الفئة التقنية" },
    ],
    relations: ["ترتبط بمصفوفة التتبع (traceability_matrix)"]
  }
];

export default function ErdExplorerPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Database className="h-4 w-4" />
            NARQA EBOS Entity Relationship Model · مطابقة مخطط قاعدة البيانات (ERD)
          </div>
          <h1 className="text-3xl font-bold tracking-tight">مستكشف كيانات وعلاقات قاعدة البيانات (ERD)</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            استعراض الجداول والكيانات والعلاقات الهيكلية المعتمَدة في النظام وفق مخطط قاعدة البيانات والمواصفات المؤسسية.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-card font-medium text-xs">
            <Layers className="h-3.5 w-3.5 text-primary" /> 15 جدولاً وعلاقة أساسية
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-emerald-500/10 text-emerald-600 font-medium text-xs border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" /> مطابق بالكامل لـ ERD
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              هيكل المنظمة المؤسسية
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>company</strong>: الشركة الأم.</p>
            <p>• <strong>branches</strong>: الفروع الجغرافية.</p>
            <p>• <strong>departments</strong>: الأقسام الإدارية.</p>
            <p>• <strong>users</strong>: صلاحيات الموظفين والمديرين.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              سلسلة التوريد والمشاريع
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>projects</strong>: المشاريع الإنشائية والتنفيذية.</p>
            <p>• <strong>suppliers & categories</strong>: الموردون والمقاولون.</p>
            <p>• <strong>purchase_requests</strong>: طلبات الشراء والموازنات.</p>
            <p>• <strong>purchase_request_items</strong>: تفاصيل بنود الشراء.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-primary" />
              الحوكمة والتتبع والتدقيق
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>architecture_reviews</strong>: مراجعات البنية والتدقيق.</p>
            <p>• <strong>architecture_decisions</strong>: قرارات البنية (ADRs).</p>
            <p>• <strong>traceability_matrix</strong>: مصفوفة التتبع والامتثال.</p>
            <p>• <strong>activity_log</strong>: سجل النشاط والعمليات المالية.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {erdEntities.map((entity, idx) => (
          <Card key={idx} className="overflow-hidden border-primary/15">
            <CardHeader className="bg-muted/30 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-mono tracking-wide text-primary">{entity.name}</CardTitle>
                </div>
                <Badge variant="outline" className="font-sans text-xs">{entity.description}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">حقل الجدول (Column)</TableHead>
                      <TableHead className="text-right">نوع البيانات (Type)</TableHead>
                      <TableHead className="text-right">مفتاح / قيد (Constraints)</TableHead>
                      <TableHead className="text-right">الوصف الوظيفي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entity.columns.map((col, cIdx) => (
                      <TableRow key={cIdx}>
                        <TableCell className="font-mono font-medium">{col.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{col.type}</TableCell>
                        <TableCell>
                          {col.pk && <Badge className="bg-amber-600 text-[10px] py-0">Primary Key</Badge>}
                          {col.fk && <Badge variant="outline" className="text-[10px] py-0 border-primary/40 text-primary">Foreign Key</Badge>}
                          {!col.pk && !col.fk && <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{col.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/20 p-3 rounded-lg border text-xs space-y-1">
                <span className="font-semibold text-primary block mb-1">العلاقات الارتباطية المرتبطة (ERD Relations):</span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {entity.relations.map((rel, rIdx) => (
                    <li key={rIdx}>{rel}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
