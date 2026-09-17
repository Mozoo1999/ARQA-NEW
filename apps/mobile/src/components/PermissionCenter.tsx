import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getPermissionsAsync as getContactsPermissionsAsync, requestPermissionsAsync as requestContactsPermissionsAsync } from "expo-contacts";
import { getArabicVoicePermissionState, requestArabicVoicePermission } from "../voice/nativeVoiceSession";

type GrantState = "granted" | "denied" | "undetermined" | "unavailable";
type PermissionRow = { id: "voice" | "camera" | "photos" | "contacts" | "documents" | "sms" | "whatsapp"; title: string; detail: string; state: GrantState; action?: () => Promise<void> };

function statusLabel(state: GrantState) {
  if (state === "granted") return "مسموح";
  if (state === "denied") return "مرفوض";
  if (state === "undetermined") return "لم يُطلب";
  return "غير متاح";
}

function normalizeState(value: { granted: boolean; status: string }): GrantState {
  if (value.granted) return "granted";
  return value.status === "denied" ? "denied" : value.status === "undetermined" ? "undetermined" : "unavailable";
}

export function PermissionCenter({ onOpenMessages }: { onOpenMessages: () => void }) {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [refreshing, setRefreshing] = useState(true);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const [voice, camera, photos, contacts] = await Promise.all([
      getArabicVoicePermissionState(),
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      Platform.OS === "web" ? Promise.resolve({ granted: false, status: "unavailable" }) : getContactsPermissionsAsync(),
    ]);
    const requestVoice = async () => { await requestArabicVoicePermission(); await refresh(); };
    const requestCamera = async () => { await ImagePicker.requestCameraPermissionsAsync(); await refresh(); };
    const requestPhotos = async () => { await ImagePicker.requestMediaLibraryPermissionsAsync(); await refresh(); };
    const requestContacts = async () => { if (Platform.OS === "web") { Alert.alert("غير متاح في الويب", "اختر جهة اتصال من تطبيق Android أو iOS. لا يمكن لإصدار الويب قراءة دفتر العناوين."); return; } await requestContactsPermissionsAsync(); await refresh(); };
    setRows([
      { id: "voice", title: "الميكروفون والتعرف على الكلام", detail: "لإملاء الأمر ومتابعة الإجابات العربية داخل التطبيق فقط.", state: normalizeState(voice), action: requestVoice },
      { id: "camera", title: "الكاميرا", detail: "لالتقاط المستند الذي تختاره للمراجعة والتحليل.", state: normalizeState(camera), action: requestCamera },
      { id: "photos", title: "الصور والوسائط", detail: "لاختيار صورة أو مستند من جهازك فقط.", state: normalizeState(photos), action: requestPhotos },
      { id: "contacts", title: "جهات الاتصال", detail: Platform.OS === "web" ? "منتقي جهة اتصال واحدة متاح في Android وiOS فقط؛ إصدار الويب لا يصل إلى دفتر العناوين." : "لا يقرأ التطبيق الدفتر كاملاً؛ يفتح منتقي النظام لتختار جهة واحدة عند إنشاء مسودة رسالة.", state: Platform.OS === "web" ? "unavailable" : normalizeState(contacts), action: requestContacts },
      { id: "documents", title: "الملفات والمستندات", detail: "يستخدم منتقي الملفات الأصلي؛ لا توجد صلاحية مستقلة ولا يعمل في الخلفية.", state: "unavailable" },
      { id: "sms", title: "SMS", detail: "المدعوم الآن هو فتح تطبيق الرسائل لكتابة رسالة أو لصق محتوى معتمد يدوياً. لا يراقب التطبيق صندوق SMS ولا يطلب READ_SMS.", state: "unavailable", action: async () => { const supported = await Linking.canOpenURL("sms:"); if (!supported) { Alert.alert("تطبيق الرسائل غير متاح", "لم يعثر الجهاز على تطبيق رسائل متوافق."); return; } await Linking.openURL("sms:"); } },
      { id: "whatsapp", title: "WhatsApp Business", detail: "غير متصل. الوارد التلقائي لن يُفعّل حتى تتوفر بيانات حساب Meta Business الرسمية وWebhook متحقق وسياسة موافقة واحتفاظ بالبيانات.", state: "unavailable", action: async () => onOpenMessages() },
    ]);
    setRefreshing(false);
  }, [onOpenMessages]);

  useEffect(() => { void refresh(); }, [refresh]);
  return <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>PRIVACY & INTEGRATION CENTER</Text><Text style={styles.title}>الصلاحيات والتكاملات</Text><Text style={styles.description}>أنت تتحكم في الصلاحيات محلياً على الجهاز. لا يجمع التطبيق جهات الاتصال أو الرسائل أو الصوت في الخلفية.</Text>
    <Pressable onPress={() => void refresh()} style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}><Text style={styles.refreshText}>{refreshing ? "يجري تحديث الحالة…" : "تحديث حالات الصلاحيات"}</Text></Pressable>
    {rows.map(row => <View key={row.id} style={styles.card}><View style={styles.cardHead}><View style={[styles.badge, row.state === "granted" ? styles.badgeGranted : row.state === "denied" ? styles.badgeDenied : styles.badgeNeutral]}><Text style={styles.badgeText}>{statusLabel(row.state)}</Text></View><Text style={styles.cardTitle}>{row.title}</Text></View><Text style={styles.cardDetail}>{row.detail}</Text>{row.action ? <Pressable onPress={() => void row.action?.()} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>{row.id === "whatsapp" ? "فتح إدخال الرسالة المعتمد" : row.id === "sms" ? "فتح تطبيق الرسائل" : row.state === "granted" ? "مراجعة الحالة" : "طلب الإذن"}</Text></Pressable> : null}</View>)}
    <View style={styles.notice}><Text style={styles.noticeTitle}>حدود الحماية</Text><Text style={styles.noticeText}>لا يسمح هذا الإصدار بمراقبة SMS أو WhatsApp، أو نسخ دفتر العناوين، أو تسجيل الصوت خفية. أي مسودة رسالة تحتاج اختياراً صريحاً للمصدر وموافقة المستخدم قبل إرسالها للتحليل.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 40, backgroundColor: "#0B1220", minHeight: "100%" },
  eyebrow: { color: "#D6A756", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textAlign: "right" }, title: { color: "#F4F7FB", fontSize: 30, lineHeight: 38, fontWeight: "900", textAlign: "right", marginTop: 8 }, description: { color: "#9AAAC0", fontSize: 14, lineHeight: 23, textAlign: "right", marginTop: 8, marginBottom: 16 },
  refresh: { backgroundColor: "#D6A756", minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginBottom: 16 }, refreshText: { color: "#1A130A", fontSize: 14, fontWeight: "800" },
  card: { backgroundColor: "#131E31", borderColor: "#263A57", borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 11 }, cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, cardTitle: { color: "#F4F7FB", fontSize: 15, fontWeight: "800", textAlign: "right", flex: 1 }, cardDetail: { color: "#9AAAC0", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 9 },
  badge: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 }, badgeGranted: { backgroundColor: "#1C4939" }, badgeDenied: { backgroundColor: "#4A2930" }, badgeNeutral: { backgroundColor: "#263A57" }, badgeText: { color: "#F4F7FB", fontSize: 10, fontWeight: "800" },
  action: { borderColor: "#D6A756", borderWidth: 1, minHeight: 40, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 12 }, actionText: { color: "#D6A756", fontSize: 12, fontWeight: "800" }, notice: { backgroundColor: "#3A2D1C", borderColor: "#71552D", borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 6 }, noticeTitle: { color: "#D6A756", fontSize: 13, fontWeight: "800", textAlign: "right" }, noticeText: { color: "#EBD7A8", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
