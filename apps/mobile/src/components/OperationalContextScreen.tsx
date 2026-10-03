import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchMobileOperationalProfile, updateMobileOperationalProfile, type MobileOperationalProfile, type OperationalBusinessLevel, type OperationalSector } from "../mobileOperationalProfileApi";

type SessionUser = { id: number } | null;

type Props = {
  user: SessionUser;
  apiBaseUrl: string;
  getToken: () => Promise<string>;
  onSignIn: () => void;
  onBack: () => void;
};

const sectors: Array<{ id: OperationalSector; label: string; detail: string }> = [
  { id: "construction", label: "مقاولات", detail: "مواد خام ومواقع ومشروعات تنفيذ." },
  { id: "supply", label: "توريدات", detail: "توريد مواد ومعدات وخدمات تشغيلية." },
  { id: "logistics", label: "لوجستيات", detail: "نقل وحمولات وأذون استلام." },
  { id: "general", label: "عام", detail: "ابدأ بدون افتراضات قطاعية." },
];

const levels: Array<{ id: OperationalBusinessLevel; label: string; detail: string }> = [
  { id: "construction_company", label: "شركة مقاولات", detail: "يسأل عن وحدة الخام؛ يمكن ضبط متر مكعب كإعداد افتراضي." },
  { id: "supply_office", label: "مكتب توريدات", detail: "يجمع المحجر أو الكسارة والخصم والنقل والحجر والمصاريف وإجمالي العملية." },
  { id: "logistics_operator", label: "مشغل نقل", detail: "يركز على السيارة ومسار الحمولة والتسليم." },
  { id: "general", label: "تشغيل عام", detail: "يجمع فقط الحقول التشغيلية الأساسية." },
];

const defaultProfile: MobileOperationalProfile = {
  primaryLanguage: "ar",
  dialect: "ar-SA",
  sector: "general",
  businessLevel: "general",
  defaultUnit: "",
  materialVocabulary: [],
  configured: false,
};

export function OperationalContextScreen({ user, apiBaseUrl, getToken, onSignIn, onBack }: Props) {
  const [profile, setProfile] = useState<MobileOperationalProfile>(defaultProfile);
  const [vocabularyText, setVocabularyText] = useState("");
  const [loading, setLoading] = useState(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); setProfile(defaultProfile); return; }
    const controller = new AbortController();
    setLoading(true); setError(null);
    void getToken()
      .then(token => fetchMobileOperationalProfile({ apiBaseUrl, token, signal: controller.signal }))
      .then(next => { if (!controller.signal.aborted) { setProfile(next); setVocabularyText(next.materialVocabulary.join("، ")); } })
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "تعذر تحميل سياق التشغيل."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiBaseUrl, getToken, user?.id]);

  const profileDescription = useMemo(() => {
    const sector = sectors.find(item => item.id === profile.sector)?.label ?? "عام";
    const level = levels.find(item => item.id === profile.businessLevel)?.label ?? "تشغيل عام";
    return `${sector} · ${level} · ${profile.dialect}`;
  }, [profile.businessLevel, profile.dialect, profile.sector]);

  const save = async () => {
    if (!user) { onSignIn(); return; }
    const materialVocabulary = Array.from(new Set(vocabularyText.split(/[،,\n]/).map(value => value.trim()).filter(Boolean))).slice(0, 32);
    try {
      setSaving(true); setError(null); setSaved(null);
      const next = await updateMobileOperationalProfile({ apiBaseUrl, token: await getToken(), primaryLanguage: profile.primaryLanguage, dialect: profile.dialect.trim() || "ar-SA", sector: profile.sector, businessLevel: profile.businessLevel, defaultUnit: profile.defaultUnit.trim(), materialVocabulary });
      setProfile(next); setVocabularyText(next.materialVocabulary.join("، "));
      setSaved("تم حفظ سياقك. سيُستخدم في الأسئلة التالية فقط، وتبقى كل عملية مسودة حتى تؤكدها.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر حفظ سياق التشغيل."); }
    finally { setSaving(false); }
  };

  return <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>OPERATIONAL CONTEXT</Text>
    <Text style={styles.title}>سياق العمل واللغة</Text>
    <Text style={styles.description}>يضبط هذا الملف أسئلة المساعد والتحليل، مثل وحدة الخام ومسار التوريدات. لا يغيّر بيانات الشركة ولا يسمح بإدراج تلقائي.</Text>
    {!user ? <View style={styles.card}><Text style={styles.cardTitle}>تسجيل الدخول مطلوب</Text><Text style={styles.cardDetail}>يحفظ سياق التشغيل تحت هويتك ويُثبت في كل جلسة محادثة قابلة للمراجعة.</Text><Pressable onPress={onSignIn} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>تسجيل الدخول</Text></Pressable></View> : null}
    {loading ? <View style={styles.card}><Text style={styles.cardDetail}>يجري تحميل سياق العمل المعتمد…</Text></View> : null}
    {user && !loading ? <>
      <View style={styles.contextBadge}><Text style={styles.contextBadgeText}>{profile.configured ? "سياق محفوظ" : "سياق عام غير معرّف"}</Text><Text style={styles.contextBadgeDetail}>{profileDescription}</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>القطاع</Text>{sectors.map(option => <Pressable key={option.id} onPress={() => setProfile(current => ({ ...current, sector: option.id }))} style={({ pressed }) => [styles.option, profile.sector === option.id && styles.optionSelected, pressed && styles.pressed]}><Text style={styles.optionTitle}>{profile.sector === option.id ? "✓ " : "○ "}{option.label}</Text><Text style={styles.optionDetail}>{option.detail}</Text></Pressable>)}</View>
      <View style={styles.card}><Text style={styles.cardTitle}>مستوى العمل</Text>{levels.map(option => <Pressable key={option.id} onPress={() => setProfile(current => ({ ...current, businessLevel: option.id }))} style={({ pressed }) => [styles.option, profile.businessLevel === option.id && styles.optionSelected, pressed && styles.pressed]}><Text style={styles.optionTitle}>{profile.businessLevel === option.id ? "✓ " : "○ "}{option.label}</Text><Text style={styles.optionDetail}>{option.detail}</Text></Pressable>)}</View>
      <View style={styles.card}><Text style={styles.cardTitle}>اللغة واللهجة والمفردات</Text><Text style={styles.label}>رمز اللغة واللهجة للتعرف على الصوت</Text><TextInput value={profile.dialect} onChangeText={dialect => setProfile(current => ({ ...current, dialect }))} style={styles.input} textAlign="right" autoCapitalize="none" placeholder="ar-SA أو ar-EG" placeholderTextColor="#7990AE" /><Text style={styles.label}>وحدة افتراضية عند إدخال خامات</Text><TextInput value={profile.defaultUnit} onChangeText={defaultUnit => setProfile(current => ({ ...current, defaultUnit }))} style={styles.input} textAlign="right" placeholder="مثال: متر مكعب" placeholderTextColor="#7990AE" /><Text style={styles.label}>مواد أو مسميات محلية مفصولة بفاصلة</Text><TextInput value={vocabularyText} onChangeText={setVocabularyText} style={[styles.input, styles.multiline]} textAlign="right" textAlignVertical="top" multiline placeholder="مثال: سن، زلط، رمل" placeholderTextColor="#7990AE" /><Text style={styles.help}>تُستخدم هذه الكلمات لتوضيح السؤال وإعطاء محرك الكلام سياقاً، ولا تُحوّل إلى بيانات أعمال قبل أن تراجعها وتؤكدها.</Text></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {saved ? <View style={styles.success}><Text style={styles.successText}>{saved}</Text></View> : null}
      <Pressable onPress={() => void save()} disabled={saving} style={({ pressed }) => [styles.primary, saving && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{saving ? "يجري حفظ السياق…" : "حفظ سياق العمل"}</Text></Pressable>
    </> : null}
    <Pressable onPress={onBack} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>العودة إلى مركز التشغيل</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 40, backgroundColor: "#0B1220", minHeight: "100%" },
  eyebrow: { color: "#D6A756", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textAlign: "right" },
  title: { color: "#F4F7FB", fontSize: 30, fontWeight: "900", lineHeight: 38, textAlign: "right", marginTop: 8 },
  description: { color: "#9AAAC0", fontSize: 14, lineHeight: 23, textAlign: "right", marginTop: 8, marginBottom: 16 },
  contextBadge: { borderRadius: 14, backgroundColor: "#142B42", borderWidth: 1, borderColor: "#3B567A", padding: 14, marginBottom: 14 },
  contextBadgeText: { color: "#D6A756", fontSize: 13, fontWeight: "800", textAlign: "right" }, contextBadgeDetail: { color: "#C4D6EB", fontSize: 12, textAlign: "right", marginTop: 5 },
  card: { backgroundColor: "#131E31", borderColor: "#263A57", borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 13 },
  cardTitle: { color: "#F4F7FB", fontSize: 15, fontWeight: "800", textAlign: "right" }, cardDetail: { color: "#9AAAC0", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 8 },
  option: { borderWidth: 1, borderColor: "#263A57", borderRadius: 11, padding: 12, marginTop: 10, backgroundColor: "#0B1220" }, optionSelected: { borderColor: "#D6A756", backgroundColor: "#3A2D1C" }, optionTitle: { color: "#F4F7FB", fontSize: 13, fontWeight: "800", textAlign: "right" }, optionDetail: { color: "#9AAAC0", fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 4 },
  label: { color: "#9AAAC0", fontSize: 12, textAlign: "right", marginTop: 14, marginBottom: 7 }, input: { color: "#F4F7FB", borderColor: "#263A57", borderWidth: 1, backgroundColor: "#0B1220", minHeight: 46, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, multiline: { minHeight: 90 }, help: { color: "#9AAAC0", fontSize: 11, lineHeight: 19, textAlign: "right", marginTop: 9 },
  primary: { backgroundColor: "#D6A756", minHeight: 47, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginBottom: 12 }, primaryText: { color: "#1A130A", fontSize: 14, fontWeight: "900" }, secondary: { borderColor: "#D6A756", borderWidth: 1, minHeight: 47, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, secondaryText: { color: "#D6A756", fontSize: 14, fontWeight: "800" }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  error: { backgroundColor: "#351D24", borderColor: "#743D48", borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 12 }, errorText: { color: "#F2B8BC", fontSize: 12, lineHeight: 19, textAlign: "right" }, success: { backgroundColor: "#102A23", borderColor: "#235D4A", borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 12 }, successText: { color: "#B1D7C5", fontSize: 12, lineHeight: 19, textAlign: "right" },
});
