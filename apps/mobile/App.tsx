import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import ExpoTextExtractor from "expo-text-extractor";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useEffect, useMemo, useState } from "react";
import { calculateCostChain } from "../../packages/cost-engine/src/calculate";
import { parseArabicVoiceCommand } from "../../packages/command-intake/src/parse-arabic-command";
import { extractDocumentFields, getOcrReviewGuidance, type DocumentFields } from "./src/document-intake";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://narqaebos-c2nmdy4n.manus.space";
const AUTH_START_URL = process.env.EXPO_PUBLIC_AUTH_START_URL;
const REDIRECT_URI = ExpoLinking.createURL("oauth/callback");
type Tab = "home" | "cost" | "commands" | "intake" | "invoice" | "sources" | "suppliers" | "customers" | "projects" | "reports";

const colors = {
  background: "#0B1220", panel: "#131E31", panelRaised: "#18263D", border: "#263A57",
  text: "#F4F7FB", muted: "#9AAAC0", accent: "#D6A756", accentSoft: "#3A2D1C",
  success: "#62C291", danger: "#EC7C7C",
};

const navItems: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "الرئيسية", icon: "⌂" },
  { id: "cost", label: "حساب التكلفة", icon: "◈" },
  { id: "commands", label: "الأوامر الصوتية", icon: "🎙" },
  { id: "intake", label: "OCR والمستندات", icon: "▣" },
];

const operationalModules = [
  { label: "التنظيم المؤسسي", path: "/organization/company" },
  { label: "طلبات المشتريات", path: "/procurement/requests" },
  { label: "حوكمة العمارة", path: "/governance/reviews" },
  { label: "OCR والمستندات", path: "/ocr" },
  { label: "التقارير المالية", path: "/reports/export" },
] as const;

async function openOperationalModule(path: string) {
  await WebBrowser.openBrowserAsync(`${API_BASE}${path}`);
}


function Field({ label, value, onChangeText, suffix, keyboardType = "decimal-pad" }: {
  label: string; value: string; onChangeText: (value: string) => void; suffix?: string; keyboardType?: "decimal-pad" | "default";
}) {
  return <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={colors.muted} style={styles.input} textAlign="right" returnKeyType="done" />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  </View>;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function ResultMeta({ label, value }: { label: string; value: string }) {
  return <View style={styles.resultMeta}><Text style={styles.resultMetaLabel}>{label}</Text><Text style={styles.resultMetaValue}>{value}</Text></View>;
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const modules = [
    { title: "مصادر التوريد", description: "استعراض الجهات والمصادر المعتمدة", icon: "◉", action: () => onNavigate("sources") },
    { title: "الموردون", description: "إدارة الموردين وبيانات التواصل", icon: "▦", action: () => onNavigate("suppliers") },
    { title: "العملاء", description: "سجل جهات الاتصال والعملاء", icon: "◌", action: () => onNavigate("customers") },
    { title: "المشاريع", description: "متابعة المشاريع والحالة والفرق", icon: "◈", action: () => onNavigate("projects") },
    { title: "إدخال صوتي", description: "تحدث بالعربية ثم راجع الأمر", icon: "🎙", action: () => onNavigate("commands") },
    { title: "صور ومستندات", description: "التقاط، اختيار، وتحليل مسودة", icon: "▣", action: () => onNavigate("intake") },
    { title: "إصدار فاتورة", description: "إنشاء مسودة فاتورة ومراجعتها", icon: "▧", action: () => onNavigate("invoice") },
    { title: "تقرير مالي", description: "تصفية ومعاينة وتصدير التقارير", icon: "▤", action: () => onNavigate("reports") },
  ] as const;
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.homeHero}><Text style={styles.homeEyebrow}>NARQA EBOS / MOBILE OPERATIONS</Text><Text style={styles.homeTitle}>ماذا تريد أن تُدير الآن؟</Text><Text style={styles.homeSubtitle}>اختر وحدة تشغيل مباشرة. كل عملية مالية أو مستندية تمر بالمراجعة قبل الاعتماد.</Text></View>
    <View style={styles.statusBanner}><View style={styles.statusDot} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>مساحة العمل جاهزة</Text><Text style={styles.statusText}>الصوت، المستندات، الحسابات، والتقارير موزعة كمهام تشغيل مباشرة بدلاً من صفحة معلومات عامة.</Text></View></View>
    <Text style={styles.homeSectionLabel}>مساحات التشغيل</Text>
    <View style={styles.homeModuleGrid}>{modules.map(module => <Pressable key={module.title} onPress={module.action} style={({ pressed }) => [styles.homeModuleCard, pressed && styles.pressed]}><Text style={styles.homeModuleIcon}>{module.icon}</Text><View style={styles.homeModuleCopy}><Text style={styles.homeModuleTitle}>{module.title}</Text><Text style={styles.homeModuleDescription}>{module.description}</Text></View><Text style={styles.homeModuleArrow}>←</Text></Pressable>)}</View>
    <View style={styles.actionCard}><View style={styles.actionCopy}><Text style={styles.actionTitle}>محرك سلسلة التكلفة</Text><Text style={styles.actionText}>احسب تكلفة الوحدة والسعر المقترح مع تفصيل الشراء والنقل والهالك والإدارة والربح.</Text></View><PrimaryButton label="فتح حاسبة التكلفة" onPress={() => onNavigate("cost")} /></View>
    <View style={styles.infoCard}><Text style={styles.infoTitle}>تنقل جوال داخلي</Text><Text style={styles.infoText}>كل بطاقة أعلاه تبقيك داخل التطبيق. لن يفتح المتصفح إلا إذا اخترت لاحقاً مسار اعتماد محمي بعد اكتمال جلسة المصادقة الأصلية.</Text></View>
  </ScrollView>;
}

const workspaceDetails: Record<Extract<Tab, "sources" | "suppliers" | "customers" | "projects" | "reports">, { eyebrow: string; title: string; description: string; connection: string }> = {
  sources: { eyebrow: "SUPPLY SOURCES", title: "مصادر التوريد", description: "مساحة عمل داخلية لمتابعة مصدر التوريد والبيانات المرتبطة به.", connection: "سيظهر السجل المعتمد هنا بعد إكمال ربط جلسة الجوال بواجهة البيانات المحمية." },
  suppliers: { eyebrow: "SUPPLIERS", title: "الموردون", description: "مساحة العمل الداخلية للموردين وبيانات التواصل والتصنيف.", connection: "لا تُعرض بيانات بديلة أو مصطنعة. يتطلب الجلب الحقيقي جلسة مصادقة جوال معتمدة." },
  customers: { eyebrow: "CUSTOMER CONTACTS", title: "العملاء وجهات الاتصال", description: "مساحة داخلية لجهات العملاء؛ السجل الخلفي المخصص للعملاء لم يُنشأ بعد في المخطط المدقق.", connection: "لن ينقلك التطبيق إلى الويب. يُستكمل الربط عندما تتوفر وحدة العملاء وواجهة API المعتمدة." },
  projects: { eyebrow: "PROJECTS", title: "المشاريع", description: "مساحة العمل الداخلية لمتابعة المشروع والحالة والأطراف المشاركة.", connection: "تظل البيانات الحية محمية بالمصادقة، لذلك لا تُعرض أي سجلات حتى يتم ربط جلسة الجوال." },
  reports: { eyebrow: "FINANCIAL REPORTS", title: "التقرير المالي", description: "مساحة داخلية لتصفية ومعاينة تقرير مالي قبل التصدير.", connection: "يحتاج تحميل التقرير الفعلي إلى جلسة مصادقة والربط بواجهة التقارير، ولا ينفذ التطبيق تصديراً وهمياً." },
};

function WorkspaceScreen({ workspace, onNavigate }: { workspace: Extract<Tab, "sources" | "suppliers" | "customers" | "projects" | "reports">; onNavigate: (tab: Tab) => void }) {
  const details = workspaceDetails[workspace];
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SectionTitle eyebrow={details.eyebrow} title={details.title} description={details.description} />
    <View style={styles.localWorkspaceBanner}><Text style={styles.localWorkspaceTitle}>أنت داخل تطبيق NARQA EBOS</Text><Text style={styles.localWorkspaceText}>{details.connection}</Text></View>
    <View style={styles.infoCard}><Text style={styles.infoTitle}>حالة البيانات</Text><Text style={styles.infoText}>لا توجد بيانات محلية أو نتائج مصطنعة في هذه المساحة. عند اكتمال المصادقة الأصلية، تُحمّل هذه الشاشة نفس البيانات المعتمدة من النظام دون مغادرة التطبيق.</Text></View>
    <PrimaryButton label="العودة إلى مركز التشغيل" onPress={() => onNavigate("home")} />
  </ScrollView>;
}

function InvoiceScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [customer, setCustomer] = useState(""); const [invoiceNo, setInvoiceNo] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [reviewing, setReviewing] = useState(false); const [error, setError] = useState<string | null>(null);
  const review = () => { const parsedAmount = Number(amount); if (!customer.trim() || !invoiceNo.trim() || !description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) { setError("أدخل العميل ورقم الفاتورة والوصف ومبلغاً موجباً قبل المراجعة."); return; } setError(null); setReviewing(true); };
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SectionTitle eyebrow="INVOICE DRAFT" title="إصدار فاتورة" description="أنشئ مسودة داخل التطبيق وراجعها. لا يرحّل التطبيق فاتورة رسمية أو قيداً مالياً تلقائياً." />
    <View style={styles.localWorkspaceBanner}><Text style={styles.localWorkspaceTitle}>مسودة داخل التطبيق</Text><Text style={styles.localWorkspaceText}>لن تُصدر الفاتورة رسمياً حتى تتوفر المصادقة الأصلية وواجهة ترحيل الفواتير المعتمدة.</Text></View>
    <View style={styles.formCard}><View style={styles.formGrid}><Field label="اسم العميل" value={customer} onChangeText={setCustomer} keyboardType="default" /><Field label="رقم الفاتورة" value={invoiceNo} onChangeText={setInvoiceNo} keyboardType="default" /><Field label="المبلغ قبل الضريبة" value={amount} onChangeText={setAmount} suffix="ج.م" /><Field label="وصف الفاتورة" value={description} onChangeText={setDescription} keyboardType="default" /></View>{error ? <Text style={styles.inlineError}>{error}</Text> : null}<PrimaryButton label="مراجعة مسودة الفاتورة" onPress={review} /></View>
    {reviewing ? <View style={styles.resultCard}><Text style={styles.resultLabel}>بانتظار الاعتماد</Text><Text style={styles.parsedSummary}>فاتورة {invoiceNo} للعميل {customer}</Text><View style={styles.resultMetaRow}><ResultMeta label="المبلغ" value={`${Number(amount).toLocaleString("en-US")} ج.م`} /><ResultMeta label="الحالة" value="مسودة مراجعة" /></View><Text style={styles.reviewWarning}>لم تُرسل هذه الفاتورة ولم يُنشأ قيد مالي. يتطلب الإصدار الرسمي جلسة مصادقة وربطاً بواجهة الفواتير الخلفية.</Text></View> : null}
    <SecondaryButton label="العودة إلى مركز التشغيل" onPress={() => onNavigate("home")} />
  </ScrollView>;
}

function CostScreen() {
  const [quantity, setQuantity] = useState("3000"); const [purchase, setPurchase] = useState("126"); const [transport, setTransport] = useState("28"); const [waste, setWaste] = useState("2"); const [admin, setAdmin] = useState("3"); const [profit, setProfit] = useState("15");
  const calculation = useMemo(() => {
    try { return { result: calculateCostChain({ deliveredQuantity: Number(quantity), payloadPerTrip: 25, wasteRate: Number(waste) / 100, adminRate: Number(admin) / 100, profitMarkupRate: Number(profit) / 100, components: [{ id: "purchase", kind: "purchase", label: "سعر الشراء", amount: Number(purchase), basis: "per-unit" }, { id: "transport", kind: "transport", label: "النقل لكل رحلة", amount: Number(transport), basis: "per-trip" }] }), error: null } as const; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : "تعذر حساب التكلفة." } as const; }
  }, [quantity, purchase, transport, waste, admin, profit]);
  const result = calculation.result;
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SectionTitle eyebrow="COST ENGINE" title="حاسبة سلسلة التكلفة" description="كل قيمة تمر إلى محرك التكلفة الفعلي في packages/cost-engine مع نتيجة قابلة للتدقيق." />
    <View style={styles.formCard}><View style={styles.formGrid}><Field label="الكمية المسلّمة" value={quantity} onChangeText={setQuantity} suffix="وحدة" /><Field label="سعر الشراء" value={purchase} onChangeText={setPurchase} suffix="/ وحدة" /><Field label="النقل لكل رحلة" value={transport} onChangeText={setTransport} suffix="/ رحلة" /><Field label="حمولة الرحلة" value="25" onChangeText={() => undefined} suffix="وحدة" /><Field label="الهالك" value={waste} onChangeText={setWaste} suffix="%" /><Field label="المصروف الإداري" value={admin} onChangeText={setAdmin} suffix="%" /><Field label="هامش الربح" value={profit} onChangeText={setProfit} suffix="%" /></View></View>
    {calculation.error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>تعذر تنفيذ الحساب</Text><Text style={styles.errorText}>{calculation.error}</Text></View> : null}
    {result ? <View style={styles.resultCard}><View style={styles.resultHero}><Text style={styles.resultLabel}>السعر المقترح للوحدة</Text><Text style={styles.resultValue}>{result.recommendedUnitPrice.toLocaleString("en-US")} EGP</Text><Text style={styles.resultSub}>الإجمالي: {result.totalPrice.toLocaleString("en-US")} EGP</Text></View><View style={styles.resultMetaRow}><ResultMeta label="تكلفة هابطة / وحدة" value={`${result.landedUnitCost.toLocaleString("en-US")} EGP`} /><ResultMeta label="الكمية من المصدر" value={result.requiredSourceQuantity.toLocaleString("en-US")} /><ResultMeta label="الرحلات" value={result.estimatedTrips?.toString() ?? "—"} /></View><Text style={styles.linesHeading}>تفصيل سلسلة التكلفة</Text>{result.lines.map(line => <View key={line.id} style={styles.lineRow}><Text style={styles.lineLabel}>{line.label}</Text><Text style={styles.lineAmount}>{line.totalAmount.toLocaleString("en-US")} EGP</Text></View>)}</View> : null}
  </ScrollView>;
}

function CommandsScreen() {
  const [command, setCommand] = useState(""); const [parsed, setParsed] = useState<ReturnType<typeof parseArabicVoiceCommand> | null>(null); const [isListening, setIsListening] = useState(false); const [voiceError, setVoiceError] = useState<string | null>(null); const [voiceConfidence, setVoiceConfidence] = useState<number | null>(null);
  useSpeechRecognitionEvent("result", event => { const best = event.results[0]; if (!best?.transcript) return; setCommand(best.transcript); setVoiceConfidence(best.confidence >= 0 ? best.confidence : null); if (event.isFinal) { setIsListening(false); Speech.speak("تم استلام النص. راجعه ثم اضغط تحليل الأمر.", { language: "ar-SA", rate: 0.9 }); } });
  useSpeechRecognitionEvent("error", event => { setIsListening(false); setVoiceError(`${event.message || "تعذر التعرف على الصوت"} (${event.error})`); });
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  const startListening = async () => {
    setVoiceError(null); const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) { setVoiceError("لم يتم منح إذن الميكروفون أو التعرف على الكلام. فعّل الإذن من إعدادات الجهاز."); return; }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { setVoiceError("خدمة التعرف على الكلام غير متاحة. فعّل Google Speech Recognition أو خدمة التعرف الافتراضية في الجهاز."); return; }
    setIsListening(true); ExpoSpeechRecognitionModule.start({ lang: "ar-SA", interimResults: true, maxAlternatives: 1, addsPunctuation: true, contextualStrings: ["NARQA", "EBOS", "فاتورة", "مورد", "شراء", "مصروف", "إيراد", "ضريبة", "قيد يومية"] });
  };
  const analyze = () => { if (!command.trim()) { Alert.alert("أدخل أمراً", "استخدم الميكروفون أو اكتب أمراً عربياً قبل التحليل."); return; } const parsedCommand = parseArabicVoiceCommand(command); setParsed(parsedCommand); Speech.speak(`تم تحليل الأمر. النية ${parsedCommand.intent}. راجع التفاصيل قبل الاعتماد.`, { language: "ar-SA", rate: 0.9 }); };
  const openReview = () => Alert.alert("مراجعة مطلوبة", "لن ينفذ التطبيق أي إجراء تلقائياً. افتح وحدة الأوامر في النظام لمراجعة واعتماد المسودة.", [{ text: "فتح وحدة الأوامر", onPress: () => openOperationalModule("/commands") }, { text: "إلغاء", style: "cancel" }]);
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SectionTitle eyebrow="VOICE & TEXT COMMAND ENGINE" title="الأوامر الصوتية وتحليل النية" description="اضغط بدء الميكروفون لاستقبال الكلام العربي فعلياً، ثم راجع النص والتحليل قبل إرسال أي إجراء إلى النظام." />
    <View style={styles.statusBanner}><View style={[styles.statusDot, { backgroundColor: isListening ? colors.success : colors.accent }]} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>{isListening ? "الميكروفون يستمع الآن" : "الميكروفون متوقف حتى تطلبه"}</Text><Text style={styles.statusText}>{isListening ? "تحدث بالعربية ثم أوقف الميكروفون أو انتظر النتيجة النهائية." : "يطلب التطبيق الإذن ويشغّل خدمة التعرف الأصلية عند الضغط على زر البدء."}</Text></View></View>
    <View style={styles.formCard}><Text style={styles.fieldLabel}>الأمر الصوتي / النصي المستلم</Text><TextInput value={command} onChangeText={setCommand} multiline numberOfLines={3} textAlign="right" textAlignVertical="top" placeholder="تحدث أو اكتب أمرًا..." placeholderTextColor={colors.muted} style={[styles.input, styles.commandInput]} returnKeyType="done" /><View style={styles.buttonRow}><View style={styles.flexButton}><PrimaryButton label="تحليل الأمر" onPress={analyze} /></View><View style={styles.flexButton}><SecondaryButton label={isListening ? "إيقاف الميكروفون" : "بدء الميكروفون"} onPress={isListening ? () => ExpoSpeechRecognitionModule.stop() : startListening} /></View></View>{voiceError ? <Text style={styles.inlineError}>{voiceError}</Text> : null}{voiceConfidence !== null ? <Text style={styles.hintText}>ثقة محرك الكلام: {Math.round(voiceConfidence * 100)}% — راجع النص قبل التحليل.</Text> : null}</View>
    {parsed ? <View style={styles.resultCard}><Text style={styles.resultLabel}>تحليل النية (Intent Parsing)</Text><Text style={styles.parsedSummary}>{parsed.summary}</Text><View style={styles.resultMetaRow}><ResultMeta label="النية المحتملة" value={parsed.intent} /><ResultMeta label="مستوى الثقة" value={`${Math.round(parsed.confidence * 100)}%`} /><ResultMeta label="الحالة" value="بانتظار مراجعة" /></View>{parsed.reasons.map(reason => <Text key={reason} style={styles.reasonText}>• {reason}</Text>)}<View style={styles.reviewDivider}><Text style={styles.reviewWarning}>مطلوب تأكيد بشري قبل إدراج البيانات في النظام</Text><PrimaryButton label="إرسال للمراجعة في النظام" onPress={openReview} /></View></View> : null}
  </ScrollView>;
}

function DocumentIntakeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null); const [sourceLabel, setSourceLabel] = useState(""); const [selectedFile, setSelectedFile] = useState<string | null>(null); const [rawText, setRawText] = useState(""); const [fields, setFields] = useState<DocumentFields>({ vendorName: "", amount: "", documentDate: "", taxNo: "", referenceNo: "" }); const [state, setState] = useState<"idle" | "processing" | "review">("idle"); const [error, setError] = useState<string | null>(null);
  const analyze = async (uri: string, label: string) => { setState("processing"); setError(null); try { const prepared = await manipulateAsync(uri, [{ resize: { width: 2048 } }], { compress: 0.95, format: SaveFormat.JPEG }); const lines = await ExpoTextExtractor.extractTextFromImage(prepared.uri); const text = lines.join("\n").trim(); setImageUri(prepared.uri); setSourceLabel(label); setRawText(text); setFields(extractDocumentFields(text)); setState("review"); } catch (caught) { setState("idle"); setError(caught instanceof Error ? caught.message : "تعذر تحليل الصورة. التقط صورة أوضح بإضاءة جيدة."); } };
  const choose = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { setError("يتطلب تحليل المستند إذن الوصول للصور. فعّل الإذن من إعدادات الجهاز."); return; } const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 }); if (!result.canceled && result.assets[0]) { setSelectedFile(null); await analyze(result.assets[0].uri, "صورة من الجهاز"); } };
  const capture = async () => { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) { setError("يتطلب التقاط المستند إذن الكاميرا. فعّل الإذن من إعدادات الجهاز."); return; } const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1, cameraType: ImagePicker.CameraType.back }); if (!result.canceled && result.assets[0]) await analyze(result.assets[0].uri, "صورة ملتقطة بالكاميرا"); };
  const chooseDocument = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) { setError("الحد الأقصى للمستند 10MB. اختر ملفاً أصغر ثم أعد المحاولة."); return; }
    setSelectedFile(asset.name);
    if (asset.mimeType?.startsWith("image/")) { await analyze(asset.uri, `مستند صورة: ${asset.name}`); return; }
    setImageUri(null); setSourceLabel(`مستند PDF: ${asset.name}`); setRawText(""); setFields({ vendorName: "", amount: "", documentDate: "", taxNo: "", referenceNo: "" }); setState("review");
  };
  const reviewGuidance = useMemo(() => getOcrReviewGuidance(rawText, fields), [rawText, fields]);
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SectionTitle eyebrow="DOCUMENT INTELLIGENCE" title="تحليل الصور والمستندات" description="التقط صورة، اختر صورة، أو اختر ملف PDF. تُراجع كل النتيجة قبل اعتمادها ولا تُسجّل أي بيانات تلقائياً." />
    <View style={styles.statusBanner}><View style={[styles.statusDot, { backgroundColor: state === "processing" ? colors.accent : colors.success }]} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>{state === "processing" ? "يجري تحسين الصورة وتحليلها" : "مراجعة بشرية إلزامية"}</Text><Text style={styles.statusText}>لتحسين الدقة: صوّر المستند كاملاً بإضاءة متساوية، وتجنب الظلال والانعكاسات. الخط اليدوي يحتاج تصحيحاً يدوياً عند انخفاض الوضوح.</Text></View></View>
    <View style={styles.formCard}><View style={styles.stack}><PrimaryButton label="التقاط مستند بالكاميرا" onPress={capture} /><SecondaryButton label="اختيار صورة من الجهاز" onPress={choose} /><SecondaryButton label="اختيار مستند PDF أو صورة" onPress={chooseDocument} /></View>{selectedFile ? <Text style={styles.selectedFileText}>الملف المختار: {selectedFile}</Text> : null}{error ? <Text style={styles.inlineError}>{error}</Text> : null}</View>
    {imageUri ? <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.documentPreview} /> : null}
    {state === "review" ? <View style={styles.resultCard}><Text style={styles.resultLabel}>مسودة الاستخراج — {sourceLabel}</Text><View style={[styles.qualityCard, reviewGuidance.level === "low" && styles.qualityLow, reviewGuidance.level === "medium" && styles.qualityMedium]}><Text style={styles.qualityTitle}>مؤشر قابلية المراجعة: {reviewGuidance.level === "high" ? "جيد" : reviewGuidance.level === "medium" ? "جزئي" : "ضعيف"}</Text><Text style={styles.qualityText}>{selectedFile?.toLowerCase().endsWith(".pdf") ? "تم اختيار ملف PDF بنجاح. التحليل المتقدم للـ PDF يحتاج جلسة مصادقة لرفعه إلى مسار OCR المنشور؛ لا تُنشأ أي بيانات محلية من الملف." : reviewGuidance.message}</Text></View><Field label="المورد / الجهة" value={fields.vendorName} onChangeText={vendorName => setFields(value => ({ ...value, vendorName }))} keyboardType="default" /><Field label="المبلغ" value={fields.amount} onChangeText={amount => setFields(value => ({ ...value, amount }))} /><Field label="التاريخ" value={fields.documentDate} onChangeText={documentDate => setFields(value => ({ ...value, documentDate }))} keyboardType="default" /><Field label="الرقم الضريبي" value={fields.taxNo} onChangeText={taxNo => setFields(value => ({ ...value, taxNo }))} keyboardType="default" /><Field label="رقم المرجع" value={fields.referenceNo} onChangeText={referenceNo => setFields(value => ({ ...value, referenceNo }))} keyboardType="default" /><Text style={styles.fieldLabel}>النص الخام المستخرج</Text><TextInput value={rawText} onChangeText={setRawText} multiline textAlign="right" textAlignVertical="top" style={[styles.input, styles.commandInput]} /><Text style={styles.hintText}>لن تنشأ قيود أو سجلات مالية من هذه الشاشة. افتح وحدة OCR المنشورة بعد تسجيل الدخول للاعتماد والتسجيل في النظام.</Text><PrimaryButton label="فتح OCR المتقدم للمراجعة والاعتماد" onPress={() => openOperationalModule("/ocr")} /></View> : null}
  </ScrollView>;
}

async function startNativeAuth() {
  if (!AUTH_START_URL) { Alert.alert("إعداد المصادقة مطلوب", "أضف EXPO_PUBLIC_AUTH_START_URL إلى إعدادات البناء لتمكين OAuth الأصلي. يمكنك فتح نسخة الويب مؤقتاً.", [{ text: "فتح الويب", onPress: () => Linking.openURL(API_BASE) }, { text: "إلغاء", style: "cancel" }]); return; }
  const authUrl = `${AUTH_START_URL}${AUTH_START_URL.includes("?") ? "&" : "?"}redirectUri=${encodeURIComponent(REDIRECT_URI)}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
  if (result.type === "success" && result.url.startsWith(REDIRECT_URI)) Alert.alert("تم استلام جلسة المصادقة", "اكتملت عودة المصادقة إلى التطبيق. أكمل التحقق من الجلسة على الخادم.");
}

export default function App() {
  const { width } = useWindowDimensions(); const [authState, setAuthState] = useState<"signed_out" | "callback_received">("signed_out"); const [activeTab, setActiveTab] = useState<Tab>("home"); const isTablet = width >= 768;
  useEffect(() => { const subscription = Linking.addEventListener("url", ({ url }) => { if (url.startsWith(REDIRECT_URI)) setAuthState("callback_received"); }); Linking.getInitialURL().then(url => { if (url?.startsWith(REDIRECT_URI)) setAuthState("callback_received"); }); return () => { subscription.remove(); Speech.stop(); try { ExpoSpeechRecognitionModule.abort(); } catch {} }; }, []);
  const content = activeTab === "home" ? <HomeScreen onNavigate={setActiveTab} /> : activeTab === "cost" ? <CostScreen /> : activeTab === "commands" ? <CommandsScreen /> : activeTab === "intake" ? <DocumentIntakeScreen /> : activeTab === "invoice" ? <InvoiceScreen onNavigate={setActiveTab} /> : <WorkspaceScreen workspace={activeTab} onNavigate={setActiveTab} />;
  return <View style={styles.app}><StatusBar style="light" /><View style={styles.topBar}><Pressable onPress={startNativeAuth} style={({ pressed }) => [styles.authButton, pressed && styles.pressed]}><Text style={styles.authButtonText}>{authState === "callback_received" ? "تمت المصادقة" : "تسجيل الدخول"}</Text></Pressable><View><Text style={styles.brand}>NARQA EBOS</Text><Text style={styles.brandSubtitle}>Enterprise Business Operating System</Text></View><View style={styles.deviceBadge}><Text style={styles.deviceBadgeText}>{isTablet ? "TABLET VIEW" : "MOBILE VIEW"}</Text></View></View><View style={[styles.body, isTablet && styles.bodyTablet]}>{isTablet ? <View style={styles.sideNav}><Text style={styles.navHeading}>مساحات التشغيل</Text>{navItems.map(item => <Pressable key={item.id} onPress={() => setActiveTab(item.id)} style={({ pressed }) => [styles.navItem, activeTab === item.id && styles.navItemActive, pressed && styles.pressed]}><Text style={[styles.navIcon, activeTab === item.id && styles.navTextActive]}>{item.icon}</Text><Text style={[styles.navText, activeTab === item.id && styles.navTextActive]}>{item.label}</Text></Pressable>)}<View style={styles.navFooter}><Text style={styles.navFooterTitle}>نسخة التحقق</Text><Text style={styles.navFooterText}>Native Voice · Native OCR · Responsive</Text></View></View> : null}<View style={styles.mainContent}>{content}</View></View>{!isTablet ? <View style={styles.bottomNav}>{navItems.map(item => <Pressable key={item.id} onPress={() => setActiveTab(item.id)} style={({ pressed }) => [styles.bottomNavItem, pressed && styles.pressed]}><Text style={[styles.navIcon, activeTab === item.id && styles.navTextActive]}>{item.icon}</Text><Text style={[styles.bottomNavText, activeTab === item.id && styles.navTextActive]}>{item.label}</Text></Pressable>)}</View> : null}</View>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  authButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.accent },
  authButtonText: { color: colors.accent, fontSize: 11, fontWeight: "800" },
  topBar: { minHeight: 78, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { color: colors.accent, fontSize: 23, fontWeight: "800", letterSpacing: 2 }, brandSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2, letterSpacing: 1 },
  deviceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border }, deviceBadgeText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  body: { flex: 1 }, bodyTablet: { flexDirection: "row" }, mainContent: { flex: 1 },
  sideNav: { width: 235, padding: 18, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: "#0D1728" }, navHeading: { color: colors.muted, fontSize: 12, marginBottom: 14, textAlign: "right" },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 13, paddingVertical: 13, borderRadius: 12, marginBottom: 7 }, navItemActive: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#71552D" }, navIcon: { color: colors.muted, fontSize: 20, width: 25, textAlign: "center" }, navText: { color: colors.muted, fontSize: 14, flex: 1, textAlign: "right" }, navTextActive: { color: colors.accent, fontWeight: "700" },
  navFooter: { marginTop: "auto", paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }, navFooterTitle: { color: colors.text, fontSize: 12, textAlign: "right", marginBottom: 4 }, navFooterText: { color: colors.muted, fontSize: 10, textAlign: "right" },
  scrollContent: { padding: 20, paddingBottom: 40, maxWidth: 1100, width: "100%", alignSelf: "center" }, sectionHeader: { marginBottom: 22 }, eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textAlign: "right", marginBottom: 7 }, title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: "800", textAlign: "right" }, description: { color: colors.muted, fontSize: 14, lineHeight: 23, textAlign: "right", marginTop: 8 },
  statusBanner: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 15, backgroundColor: "#102A23", borderWidth: 1, borderColor: "#235D4A", marginBottom: 16 }, statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 12 }, statusCopy: { flex: 1 }, statusTitle: { color: colors.success, fontSize: 14, fontWeight: "800", textAlign: "right" }, statusText: { color: "#B1D7C5", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 3 },
  cardGrid: { gap: 12, marginBottom: 16 }, metricCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16 }, metricLabel: { color: colors.muted, fontSize: 12, textAlign: "right" }, metricValue: { color: colors.text, fontSize: 20, fontWeight: "800", textAlign: "right", marginTop: 7 }, metricHint: { color: colors.muted, fontSize: 11, textAlign: "right", marginTop: 5 },
  actionCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 12 }, actionCopy: { marginBottom: 15 }, actionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", textAlign: "right" }, actionText: { color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: "right", marginTop: 6 },
  primaryButton: { backgroundColor: colors.accent, minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, primaryButtonText: { color: "#1A130A", fontSize: 14, fontWeight: "800" }, secondaryButton: { minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderWidth: 1, borderColor: colors.accent }, secondaryButtonText: { color: colors.accent, fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  formCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }, formGrid: { gap: 13 }, fieldGroup: { marginBottom: 10 }, fieldLabel: { color: colors.muted, fontSize: 12, textAlign: "right", marginBottom: 7 }, inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, minHeight: 46 }, input: { flex: 1, color: colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 }, suffix: { color: colors.muted, fontSize: 11, paddingRight: 12 },
  resultCard: { backgroundColor: colors.panelRaised, borderRadius: 15, borderWidth: 1, borderColor: "#72572F", padding: 18, marginBottom: 16 }, resultHero: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, marginBottom: 14 }, resultLabel: { color: colors.muted, fontSize: 12, textAlign: "right" }, resultValue: { color: colors.accent, fontSize: 31, fontWeight: "900", textAlign: "right", marginTop: 6 }, resultSub: { color: colors.text, fontSize: 13, textAlign: "right", marginTop: 4 },
  resultMetaRow: { flexDirection: "row", gap: 8, marginBottom: 17 }, resultMeta: { flex: 1, backgroundColor: colors.panel, borderRadius: 10, padding: 10, minHeight: 60 }, resultMetaLabel: { color: colors.muted, fontSize: 10, textAlign: "right" }, resultMetaValue: { color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "right", marginTop: 5 }, linesHeading: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "right", marginBottom: 8 }, lineRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }, lineLabel: { color: colors.muted, fontSize: 12 }, lineAmount: { color: colors.text, fontSize: 12, fontWeight: "700" },
  errorCard: { backgroundColor: "#351D24", borderRadius: 15, borderWidth: 1, borderColor: "#743D48", padding: 16, marginBottom: 16 }, errorTitle: { color: colors.danger, fontSize: 14, fontWeight: "800", textAlign: "right" }, errorText: { color: "#F2B8BC", fontSize: 12, textAlign: "right", marginTop: 6, lineHeight: 19 }, commandInput: { backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, minHeight: 120, marginBottom: 15 }, inlineError: { color: "#F2B8BC", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 12 }, hintText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 9, marginBottom: 12 },
  infoCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }, infoTitle: { color: colors.accent, fontSize: 14, fontWeight: "800", textAlign: "right" }, infoText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 }, parsedSummary: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: "700", textAlign: "right", marginTop: 8, marginBottom: 15 }, reasonText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 5 }, reviewDivider: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, gap: 10 }, reviewWarning: { color: colors.accent, fontSize: 12, textAlign: "right", fontWeight: "700" },
  moduleLinks: { marginTop: 12, gap: 8 }, moduleLink: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 11 }, moduleLinkText: { color: colors.text, fontSize: 12, fontWeight: "700", textAlign: "right" }, moduleLinkArrow: { color: colors.accent, fontSize: 16 },
  buttonRow: { flexDirection: "row", gap: 10 }, flexButton: { flex: 1 }, stack: { gap: 10 }, documentPreview: { width: "100%", height: 320, backgroundColor: "#07111F", borderRadius: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  bottomNav: { flexDirection: "row", backgroundColor: "#0D1728", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, paddingBottom: 10 }, bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52 }, bottomNavText: { color: colors.muted, fontSize: 10, marginTop: 3 },
  qualityCard: { backgroundColor: "#102A23", borderRadius: 10, borderWidth: 1, borderColor: "#235D4A", padding: 12, marginBottom: 14 }, qualityMedium: { backgroundColor: "#3A2D1C", borderColor: "#71552D" }, qualityLow: { backgroundColor: "#351D24", borderColor: "#743D48" }, qualityTitle: { color: colors.text, fontSize: 12, fontWeight: "800", textAlign: "right", marginBottom: 4 }, qualityText: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: "right" },
  homeHero: { backgroundColor: "#18263D", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#3B567A", marginBottom: 16 }, homeEyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textAlign: "right" }, homeTitle: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "right", marginTop: 8 }, homeSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: "right", marginTop: 8 }, homeSectionLabel: { color: colors.muted, fontSize: 12, fontWeight: "800", textAlign: "right", marginBottom: 10 }, homeModuleGrid: { gap: 10, marginBottom: 18 }, homeModuleCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row-reverse", alignItems: "center", minHeight: 82 }, homeModuleIcon: { color: colors.accent, fontSize: 24, width: 34, textAlign: "center" }, homeModuleCopy: { flex: 1, marginHorizontal: 10 }, homeModuleTitle: { color: colors.text, fontSize: 15, fontWeight: "800", textAlign: "right" }, homeModuleDescription: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 3 }, homeModuleArrow: { color: colors.accent, fontSize: 17 }, selectedFileText: { color: colors.success, fontSize: 12, textAlign: "right", marginTop: 12 },
  localWorkspaceBanner: { backgroundColor: "#142B42", borderRadius: 15, borderWidth: 1, borderColor: "#3B567A", padding: 16, marginBottom: 16 }, localWorkspaceTitle: { color: colors.accent, fontSize: 14, fontWeight: "800", textAlign: "right" }, localWorkspaceText: { color: "#C4D6EB", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 },
});
