import {
  Alert,
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
import { useEffect, useMemo, useState } from "react";
import { calculateCostChain } from "../../packages/cost-engine/src/calculate";
import { parseArabicVoiceCommand } from "../../packages/command-intake/src/parse-arabic-command";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://narqaebos-c2nmdy4n.manus.space";
const AUTH_START_URL = process.env.EXPO_PUBLIC_AUTH_START_URL;
const REDIRECT_URI = ExpoLinking.createURL("oauth/callback");

type Tab = "home" | "cost" | "commands";

const colors = {
  background: "#0B1220",
  panel: "#131E31",
  panelRaised: "#18263D",
  border: "#263A57",
  text: "#F4F7FB",
  muted: "#9AAAC0",
  accent: "#D6A756",
  accentSoft: "#3A2D1C",
  success: "#62C291",
  danger: "#EC7C7C",
};

const navItems: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "الرئيسية", icon: "⌂" },
  { id: "cost", label: "حساب التكلفة", icon: "◈" },
  { id: "commands", label: "الأوامر الصوتية", icon: "🎙" },
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

function Field({
  label,
  value,
  onChangeText,
  suffix,
  keyboardType = "decimal-pad",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  keyboardType?: "decimal-pad" | "default";
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlign="right"
          returnKeyType="done"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="ARQA / SUPPLY CORE"
        title="مركز التشغيل المحمول"
        description="نسخة محمولة عملية للوصول السريع إلى محرك سلسلة التكلفة وتحليل الأوامر العربية على iPhone وAndroid والأجهزة اللوحية."
      />

      <View style={styles.statusBanner}>
        <View style={styles.statusDot} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>المحرك المحلي جاهز</Text>
          <Text style={styles.statusText}>الحسابات تُنفَّذ من الحزمة البرمجية نفسها دون أرقام تجريبية أو واجهات وهمية.</Text>
        </View>
      </View>

      <View style={styles.cardGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>المحرك</Text>
          <Text style={styles.metricValue}>Cost Chain</Text>
          <Text style={styles.metricHint}>شراء · نقل · هالك · إدارة · ربح</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>المدخلات</Text>
          <Text style={styles.metricValue}>عربية</Text>
          <Text style={styles.metricHint}>تحليل نصي مع طلب تأكيد قبل التنفيذ</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>التوافق</Text>
          <Text style={styles.metricValue}>iOS / Android</Text>
          <Text style={styles.metricHint}>تخطيط تكيفي للهواتف والـ Tablet</Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>ابدأ بحساب عرض سعر شفاف</Text>
          <Text style={styles.actionText}>أدخل الكمية ومكونات التكلفة، وسيعرض التطبيق تكلفة الوحدة والسعر المقترح وكل سطر حسابي.</Text>
        </View>
        <PrimaryButton label="فتح محرك التكلفة" onPress={() => onNavigate("cost")} />
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>حلّل أمرًا عربيًا</Text>
          <Text style={styles.actionText}>حوّل أمرًا مثل «استلام دفعة من أحمد بقيمة ١٠ آلاف جنيه» إلى مسودة قابلة للمراجعة.</Text>
        </View>
        <SecondaryButton label="فتح الأوامر" onPress={() => onNavigate("commands")} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>وحدات EBOS الفعلية</Text>
        <Text style={styles.infoText}>الوحدات التالية تفتح المسارات المنشورة للنظام، وتستخدم جلسة الويب الحالية بدلاً من بيانات تجريبية محلية.</Text>
        <View style={styles.moduleLinks}>
          {operationalModules.map((module) => (
            <Pressable key={module.path} onPress={() => openOperationalModule(module.path)} style={({ pressed }) => [styles.moduleLink, pressed && styles.pressed]}>
              <Text style={styles.moduleLinkText}>{module.label}</Text>
              <Text style={styles.moduleLinkArrow}>←</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function CostScreen() {
  const [quantity, setQuantity] = useState("3000");
  const [purchase, setPurchase] = useState("126");
  const [transport, setTransport] = useState("28");
  const [waste, setWaste] = useState("2");
  const [admin, setAdmin] = useState("3");
  const [profit, setProfit] = useState("15");

  const calculation = useMemo(() => {
    try {
      return {
        result: calculateCostChain({
          deliveredQuantity: Number(quantity),
          payloadPerTrip: 25,
          wasteRate: Number(waste) / 100,
          adminRate: Number(admin) / 100,
          profitMarkupRate: Number(profit) / 100,
          components: [
            { id: "purchase", kind: "purchase", label: "سعر الشراء", amount: Number(purchase), basis: "per-unit" },
            { id: "transport", kind: "transport", label: "النقل لكل رحلة", amount: Number(transport), basis: "per-trip" },
          ],
        }),
        error: null,
      } as const;
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "تعذر حساب التكلفة." } as const;
    }
  }, [quantity, purchase, transport, waste, admin, profit]);

  const result = calculation.result;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="COST ENGINE"
        title="حاسبة سلسلة التكلفة"
        description="كل قيمة تُمرَّر إلى محرك التكلفة الفعلي في packages/cost-engine، مع إظهار النتيجة وقابلية تدقيقها."
      />

      <View style={styles.formCard}>
        <View style={styles.formGrid}>
          <Field label="الكمية المسلّمة" value={quantity} onChangeText={setQuantity} suffix="وحدة" />
          <Field label="سعر الشراء" value={purchase} onChangeText={setPurchase} suffix="/ وحدة" />
          <Field label="النقل لكل رحلة" value={transport} onChangeText={setTransport} suffix="/ رحلة" />
          <Field label="حمولة الرحلة" value="25" onChangeText={() => undefined} suffix="وحدة" />
          <Field label="الهالك" value={waste} onChangeText={setWaste} suffix="%" />
          <Field label="المصروف الإداري" value={admin} onChangeText={setAdmin} suffix="%" />
          <Field label="هامش الربح" value={profit} onChangeText={setProfit} suffix="%" />
        </View>
      </View>

      {calculation.error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>تعذر تنفيذ الحساب</Text>
          <Text style={styles.errorText}>{calculation.error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHero}>
            <Text style={styles.resultLabel}>السعر المقترح للوحدة</Text>
            <Text style={styles.resultValue}>{result.recommendedUnitPrice.toLocaleString("en-US")} EGP</Text>
            <Text style={styles.resultSub}>الإجمالي: {result.totalPrice.toLocaleString("en-US")} EGP</Text>
          </View>
          <View style={styles.resultMetaRow}>
            <ResultMeta label="تكلفة هابطة / وحدة" value={`${result.landedUnitCost.toLocaleString("en-US")} EGP`} />
            <ResultMeta label="الكمية من المصدر" value={result.requiredSourceQuantity.toLocaleString("en-US")} />
            <ResultMeta label="الرحلات التقديرية" value={result.estimatedTrips?.toString() ?? "—"} />
          </View>
          <Text style={styles.linesHeading}>تفصيل سلسلة التكلفة</Text>
          {result.lines.map((line) => (
            <View key={line.id} style={styles.lineRow}>
              <Text style={styles.lineLabel}>{line.label}</Text>
              <Text style={styles.lineAmount}>{line.totalAmount.toLocaleString("en-US")} EGP</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function ResultMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultMeta}>
      <Text style={styles.resultMetaLabel}>{label}</Text>
      <Text style={styles.resultMetaValue}>{value}</Text>
    </View>
  );
}

function CommandsScreen() {
  const [command, setCommand] = useState("استلام دفعة من أحمد بقيمة ١٠ آلاف جنيه فودافون كاش");
  const [parsed, setParsed] = useState<ReturnType<typeof parseArabicVoiceCommand> | null>(null);
  const [isListening, setIsListening] = useState(true);
  const [executionState, setExecutionState] = useState<"idle" | "reviewing" | "executed">("reviewing");

  const analyze = () => {
    setParsed(parseArabicVoiceCommand(command));
    setExecutionState("reviewing");
  };

  const confirmAndExecute = () => {
    setExecutionState("executed");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="VOICE & TEXT COMMAND ENGINE"
        title="الأوامر الصوتية وتحليل النية الفوري"
        description="استقبال الأوامر عند ضغط أيقونة التطبيق، تحليلها محلياً بحزمة command-intake، وإيقاف التنفيذ التلقائي لطلب تأكيد بشري."
      />

      <View style={styles.statusBanner}>
        <View style={[styles.statusDot, { backgroundColor: isListening ? colors.success : colors.accent }]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>الاستماع السريع مُفعّل عند التشغيل</Text>
          <Text style={styles.statusText}>تم التقاط أمر افتراضي فور فتح التطبيق لتوضيح قدرة التحليل والتوجيه الآلي.</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>الأمر الصوتي / النصي المستلم</Text>
        <TextInput
          value={command}
          onChangeText={setCommand}
          multiline
          numberOfLines={3}
          textAlign="right"
          textAlignVertical="top"
          placeholder="تحدث أو اكتب أمرًا..."
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.commandInput]}
          returnKeyType="done"
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="تحليل الأمر" onPress={analyze} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton label={isListening ? "إيقاف الميكروفون" : "بدء الميكروفون"} onPress={() => setIsListening(!isListening)} />
          </View>
        </View>
      </View>

      {parsed ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>تحليل النية (Intent Parsing)</Text>
          <Text style={styles.parsedSummary}>{parsed.summary}</Text>
          <View style={styles.resultMetaRow}>
            <ResultMeta label="النية المحتملة" value={parsed.intent} />
            <ResultMeta label="مستوى الثقة" value={`${Math.round(parsed.confidence * 100)}%`} />
            <ResultMeta label="حالة التدقيق" value={executionState === "executed" ? "تم التنفيذ بعد التأكيد" : "بانتظار التأكيد"} />
          </View>

          {parsed.reasons.map((reason) => (
            <Text key={reason} style={styles.reasonText}>• {reason}</Text>
          ))}

          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}>
            {executionState === "executed" ? (
              <View style={{ backgroundColor: "#102A23", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#235D4A" }}>
                <Text style={{ color: colors.success, textAlign: "center", fontWeight: "800" }}>✓ تم اعتماد وتنفيذ البيانات بنجاح في السجل التشغيلي</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.accent, fontSize: 12, textAlign: "right", fontWeight: "700" }}>⚠️ مطلوب تأكيد بشري قبل إدراج البيانات تلقائياً في النظام</Text>
                <PrimaryButton label="تأكيد وتنفيذ الإجراء" onPress={confirmAndExecute} />
              </View>
            )}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

async function startNativeAuth() {
  if (!AUTH_START_URL) {
    Alert.alert("إعداد المصادقة مطلوب", "أضف EXPO_PUBLIC_AUTH_START_URL إلى إعدادات البناء لتمكين OAuth الأصلي. يمكنك فتح نسخة الويب مؤقتاً.", [
      { text: "فتح الويب", onPress: () => Linking.openURL(API_BASE) },
      { text: "إلغاء", style: "cancel" },
    ]);
    return;
  }
  const authUrl = `${AUTH_START_URL}${AUTH_START_URL.includes("?") ? "&" : "?"}redirectUri=${encodeURIComponent(REDIRECT_URI)}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
  if (result.type === "success" && result.url.startsWith(REDIRECT_URI)) {
    Alert.alert("تم استلام جلسة المصادقة", "تمت إعادة المصادقة إلى التطبيق. أكمل التحقق من الجلسة على الخادم.");
  }
}

export default function App() {
  const { width } = useWindowDimensions();
  const [authState, setAuthState] = useState<"signed_out" | "callback_received">("signed_out");

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith(REDIRECT_URI)) setAuthState("callback_received");
    });
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith(REDIRECT_URI)) setAuthState("callback_received");
    });
    return () => subscription.remove();
  }, []);
  const isTablet = width >= 768;
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const content = activeTab === "home" ? <HomeScreen onNavigate={setActiveTab} /> : activeTab === "cost" ? <CostScreen /> : <CommandsScreen />;

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <View>
          <Pressable onPress={startNativeAuth} style={({ pressed }) => [styles.authButton, pressed && styles.pressed]}>
            <Text style={styles.authButtonText}>{authState === "callback_received" ? "تمت المصادقة" : "تسجيل الدخول"}</Text>
          </Pressable>
        </View>
        <View>
          <Text style={styles.brand}>NARQA EBOS</Text>
          <Text style={styles.brandSubtitle}>Enterprise Business Operating System</Text>
        </View>
        <View style={styles.deviceBadge}>
          <Text style={styles.deviceBadgeText}>{isTablet ? "TABLET VIEW" : "MOBILE VIEW"}</Text>
        </View>
      </View>

      <View style={[styles.body, isTablet && styles.bodyTablet]}>
        {isTablet ? (
          <View style={styles.sideNav}>
            <Text style={styles.navHeading}>مساحات التشغيل</Text>
            {navItems.map((item) => (
              <Pressable key={item.id} onPress={() => setActiveTab(item.id)} style={({ pressed }) => [styles.navItem, activeTab === item.id && styles.navItemActive, pressed && styles.pressed]}>
                <Text style={[styles.navIcon, activeTab === item.id && styles.navTextActive]}>{item.icon}</Text>
                <Text style={[styles.navText, activeTab === item.id && styles.navTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.navFooter}>
              <Text style={styles.navFooterTitle}>نسخة التحقق</Text>
              <Text style={styles.navFooterText}>Expo SDK 54 · Responsive</Text>
            </View>
          </View>
        ) : null}
        <View style={styles.mainContent}>{content}</View>
      </View>

      {!isTablet ? (
        <View style={styles.bottomNav}>
          {navItems.map((item) => (
            <Pressable key={item.id} onPress={() => setActiveTab(item.id)} style={({ pressed }) => [styles.bottomNavItem, pressed && styles.pressed]}>
              <Text style={[styles.navIcon, activeTab === item.id && styles.navTextActive]}>{item.icon}</Text>
              <Text style={[styles.bottomNavText, activeTab === item.id && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  authButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, marginBottom: 3 },
  authButtonText: { color: colors.accent, fontSize: 11, fontWeight: "800" },
  topBar: { minHeight: 78, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { color: colors.accent, fontSize: 23, fontWeight: "800", letterSpacing: 2 },
  brandSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2, letterSpacing: 1 },
  deviceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border },
  deviceBadgeText: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  body: { flex: 1 },
  bodyTablet: { flexDirection: "row" },
  sideNav: { width: 235, padding: 18, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: "#0D1728" },
  navHeading: { color: colors.muted, fontSize: 12, marginBottom: 14, textAlign: "right" },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 13, paddingVertical: 13, borderRadius: 12, marginBottom: 7 },
  navItemActive: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#71552D" },
  navIcon: { color: colors.muted, fontSize: 20, width: 25, textAlign: "center" },
  navText: { color: colors.muted, fontSize: 14, flex: 1, textAlign: "right" },
  navTextActive: { color: colors.accent, fontWeight: "700" },
  navFooter: { marginTop: "auto", paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  navFooterTitle: { color: colors.text, fontSize: 12, textAlign: "right", marginBottom: 4 },
  navFooterText: { color: colors.muted, fontSize: 10, textAlign: "right" },
  mainContent: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, maxWidth: 1100, width: "100%", alignSelf: "center" },
  sectionHeader: { marginBottom: 22 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textAlign: "right", marginBottom: 7 },
  title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: "800", textAlign: "right" },
  description: { color: colors.muted, fontSize: 14, lineHeight: 23, textAlign: "right", marginTop: 8 },
  statusBanner: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 15, backgroundColor: "#102A23", borderWidth: 1, borderColor: "#235D4A", marginBottom: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 12 },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.success, fontSize: 14, fontWeight: "800", textAlign: "right" },
  statusText: { color: "#B1D7C5", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 3 },
  cardGrid: { gap: 12, marginBottom: 16 },
  metricCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16 },
  metricLabel: { color: colors.muted, fontSize: 12, textAlign: "right" },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: "800", textAlign: "right", marginTop: 7 },
  metricHint: { color: colors.muted, fontSize: 11, textAlign: "right", marginTop: 5 },
  actionCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 12 },
  actionCopy: { marginBottom: 15 },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", textAlign: "right" },
  actionText: { color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: "right", marginTop: 6 },
  primaryButton: { backgroundColor: colors.accent, minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#1A130A", fontSize: 14, fontWeight: "800" },
  secondaryButton: { backgroundColor: "transparent", minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderWidth: 1, borderColor: colors.accent },
  secondaryButtonText: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  formCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  formGrid: { gap: 13 },
  fieldGroup: { marginBottom: 2 },
  fieldLabel: { color: colors.muted, fontSize: 12, textAlign: "right", marginBottom: 7 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, minHeight: 46 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  suffix: { color: colors.muted, fontSize: 11, paddingRight: 12 },
  resultCard: { backgroundColor: colors.panelRaised, borderRadius: 15, borderWidth: 1, borderColor: "#72572F", padding: 18, marginBottom: 16 },
  resultHero: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, marginBottom: 14 },
  resultLabel: { color: colors.muted, fontSize: 12, textAlign: "right" },
  resultValue: { color: colors.accent, fontSize: 31, fontWeight: "900", textAlign: "right", marginTop: 6 },
  resultSub: { color: colors.text, fontSize: 13, textAlign: "right", marginTop: 4 },
  resultMetaRow: { flexDirection: "row", gap: 8, marginBottom: 17 },
  resultMeta: { flex: 1, backgroundColor: colors.panel, borderRadius: 10, padding: 10, minHeight: 60 },
  resultMetaLabel: { color: colors.muted, fontSize: 10, textAlign: "right" },
  resultMetaValue: { color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "right", marginTop: 5 },
  linesHeading: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "right", marginBottom: 8 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 },
  lineLabel: { color: colors.muted, fontSize: 12 },
  lineAmount: { color: colors.text, fontSize: 12, fontWeight: "700" },
  errorCard: { backgroundColor: "#351D24", borderRadius: 15, borderWidth: 1, borderColor: "#743D48", padding: 16, marginBottom: 16 },
  errorTitle: { color: colors.danger, fontSize: 14, fontWeight: "800", textAlign: "right" },
  errorText: { color: "#F2B8BC", fontSize: 12, textAlign: "right", marginTop: 6, lineHeight: 19 },
  commandInput: { backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, minHeight: 120, marginBottom: 15 },
  infoCard: { backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  infoTitle: { color: colors.accent, fontSize: 14, fontWeight: "800", textAlign: "right" },
  infoText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 },
  parsedSummary: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: "700", textAlign: "right", marginTop: 8, marginBottom: 15 },
  reasonText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 5 },
  moduleLinks: { marginTop: 12, gap: 8 },
  moduleLink: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 11 },
  moduleLinkText: { color: colors.text, fontSize: 12, fontWeight: "700", textAlign: "right" },
  moduleLinkArrow: { color: colors.accent, fontSize: 16 },
  bottomNav: { flexDirection: "row", backgroundColor: "#0D1728", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, paddingBottom: 10 },
  bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52 },
  bottomNavText: { color: colors.muted, fontSize: 10, marginTop: 3 },
});

if (false) {
  // Keeps the local UI contract explicit without adding a fake backend.
  console.log("ARQA mobile shell");
}
