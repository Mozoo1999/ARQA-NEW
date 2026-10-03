import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { listMobileNotifications, markAllMobileNotificationsRead, markMobileNotificationRead, type MobileInAppNotification } from "../mobileNotificationsApi";

const colors = { background: "#0B1220", panel: "#131E31", border: "#263A57", text: "#F4F7FB", muted: "#9AAAC0", accent: "#D6A756", success: "#62C291", danger: "#EC7C7C" };

type Props = {
  apiBaseUrl: string;
  getToken: () => Promise<string>;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onUnreadChange?: (value: number) => void;
  onBack: () => void;
  onNavigate: (destination: "commands" | "intake" | "reports" | "messages") => void;
};

const categoryLabel: Record<string, string> = { task: "مهمة مراجعة", approval: "قرار واعتماد", update: "تحديث تشغيلي", system: "النظام" };
const priorityLabel: Record<string, string> = { low: "منخفضة", normal: "عادية", high: "مهمة", urgent: "عاجلة" };

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function resolveDestination(actionUrl: string | null): "commands" | "intake" | "reports" | "messages" | null {
  if (!actionUrl) return null;
  if (actionUrl.startsWith("/ocr")) return "intake";
  if (actionUrl.startsWith("/commands")) return "commands";
  if (actionUrl.startsWith("/reports")) return "reports";
  if (actionUrl.startsWith("/integrations")) return "messages";
  return null;
}

export function NotificationInboxScreen({ apiBaseUrl, getToken, isAuthenticated, onSignIn, onUnreadChange, onBack, onNavigate }: Props) {
  const [items, setItems] = useState<MobileInAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!isAuthenticated) { setLoading(false); setItems([]); onUnreadChange?.(0); return; }
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const list = await listMobileNotifications({ apiBaseUrl, token: await getToken(), limit: 60 });
      setItems(list);
      onUnreadChange?.(list.filter(item => !item.isRead).length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تحميل الإشعارات.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [apiBaseUrl, getToken, isAuthenticated, onUnreadChange]);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (item: MobileInAppNotification) => {
    if (item.isRead) return;
    setBusyId(item.id);
    try {
      await markMobileNotificationRead({ apiBaseUrl, token: await getToken(), id: item.id });
      setItems(current => {
        const next = current.map(value => value.id === item.id ? { ...value, isRead: true, readAt: new Date().toISOString() } : value);
        onUnreadChange?.(next.filter(value => !value.isRead).length);
        return next;
      });
    } catch (caught) { Alert.alert("تعذر تحديث الإشعار", caught instanceof Error ? caught.message : "حاول لاحقاً."); }
    finally { setBusyId(null); }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllMobileNotificationsRead({ apiBaseUrl, token: await getToken() });
      setItems(current => current.map(value => ({ ...value, isRead: true, readAt: value.readAt ?? new Date().toISOString() })));
      onUnreadChange?.(0);
    } catch (caught) { Alert.alert("تعذر تحديث الإشعارات", caught instanceof Error ? caught.message : "حاول لاحقاً."); }
    finally { setMarkingAll(false); }
  };

  const unread = items.filter(item => !item.isRead).length;

  return <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.accent} />}>
    <View style={styles.headerRow}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>رجوع</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>IN-APP NOTIFICATIONS</Text><Text style={styles.title}>مركز الإشعارات</Text><Text style={styles.description}>مهام مراجعة وتحديثات موثقة من مسارات العمل المعتمدة.</Text></View></View>
    {!isAuthenticated ? <View style={styles.signInCard}><Text style={styles.signInTitle}>تسجيل الدخول مطلوب</Text><Text style={styles.signInText}>الإشعارات مرتبطة بحسابك وصلاحياتك؛ لا تُحمّل قبل المصادقة.</Text><Pressable onPress={onSignIn} style={styles.primary}><Text style={styles.primaryText}>تسجيل الدخول</Text></Pressable></View> : <>
      <View style={styles.summary}><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{unread ? `${unread} إشعارات غير مقروءة` : "لا توجد إشعارات غير مقروءة"}</Text><Text style={styles.summaryText}>يتم تحديث القائمة عند فتحها أو سحبها للتحديث.</Text></View>{unread ? <Pressable onPress={() => void markAll()} disabled={markingAll} style={styles.markAll}><Text style={styles.markAllText}>{markingAll ? "يجري التحديث…" : "قرأت الكل"}</Text></Pressable> : null}</View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View> : error ? <View style={styles.error}><Text style={styles.errorTitle}>تعذر تحميل الإشعارات</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()} style={styles.secondary}><Text style={styles.secondaryText}>إعادة المحاولة</Text></Pressable></View> : !items.length ? <View style={styles.empty}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.emptyTitle}>صندوق الإشعارات فارغ</Text><Text style={styles.emptyText}>ستظهر طلبات المراجعة وقرارات الاعتماد هنا عندما تحدث في النظام.</Text></View> : <View style={styles.list}>{items.map(item => {
        const destination = resolveDestination(item.actionUrl);
        return <View key={item.id} style={[styles.item, !item.isRead && styles.itemUnread]}><View style={styles.itemHead}><View style={styles.itemMeta}><Text style={[styles.priority, (item.priority === "high" || item.priority === "urgent") && styles.priorityHigh]}>{priorityLabel[item.priority]}</Text><Text style={styles.category}>{categoryLabel[item.category]}</Text></View>{!item.isRead ? <View style={styles.dot} /> : null}</View><Text style={styles.itemTitle}>{item.title}</Text>{item.body ? <Text style={styles.itemBody}>{item.body}</Text> : null}<Text style={styles.itemDate}>{formatWhen(item.createdAt)}</Text><View style={styles.itemActions}>{!item.isRead ? <Pressable onPress={() => void markRead(item)} disabled={busyId === item.id} style={styles.textAction}><Text style={styles.textActionLabel}>{busyId === item.id ? "يجري الحفظ…" : "قرأت الإشعار"}</Text></Pressable> : null}{destination ? <Pressable onPress={() => { void markRead(item); onNavigate(destination); }} style={styles.action}><Text style={styles.actionText}>فتح المسار</Text></Pressable> : null}</View></View>;
      })}</View>}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 42, maxWidth: 900, width: "100%", alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }, headerCopy: { flex: 1, alignItems: "flex-end" }, eyebrow: { color: colors.accent, fontWeight: "800", fontSize: 10, letterSpacing: 1.1 }, title: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "right", marginTop: 6 }, description: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 }, back: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, backText: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  summary: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#102A23", borderWidth: 1, borderColor: "#235D4A", borderRadius: 15, padding: 15, marginBottom: 15 }, summaryCopy: { flex: 1 }, summaryTitle: { color: colors.success, fontSize: 14, fontWeight: "900", textAlign: "right" }, summaryText: { color: "#B1D7C5", fontSize: 11, textAlign: "right", marginTop: 4 }, markAll: { borderWidth: 1, borderColor: "#3E7A65", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, marginRight: 12 }, markAllText: { color: colors.success, fontSize: 11, fontWeight: "800" },
  signInCard: { backgroundColor: "#142B42", borderWidth: 1, borderColor: "#3B567A", borderRadius: 16, padding: 18 }, signInTitle: { color: colors.accent, fontSize: 15, fontWeight: "900", textAlign: "right" }, signInText: { color: "#C4D6EB", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 6 }, primary: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 15 }, primaryText: { color: "#1A130A", fontWeight: "900", fontSize: 12 },
  loading: { minHeight: 200, alignItems: "center", justifyContent: "center" }, empty: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 28, alignItems: "center" }, emptyIcon: { color: colors.muted, fontSize: 34 }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 8 }, emptyText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 7, maxWidth: 280 }, error: { backgroundColor: "#351D24", borderWidth: 1, borderColor: "#743D48", borderRadius: 16, padding: 17 }, errorTitle: { color: colors.danger, fontSize: 14, fontWeight: "900", textAlign: "right" }, errorText: { color: "#F2B8BC", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 5 }, secondary: { borderWidth: 1, borderColor: colors.danger, borderRadius: 9, padding: 10, alignItems: "center", marginTop: 12 }, secondaryText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  list: { gap: 11 }, item: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 15 }, itemUnread: { backgroundColor: "#142B42", borderColor: "#3B567A" }, itemHead: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, itemMeta: { flexDirection: "row-reverse", gap: 7, alignItems: "center" }, category: { color: colors.muted, fontSize: 10 }, priority: { color: colors.muted, fontSize: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }, priorityHigh: { color: colors.accent, borderColor: "#71552D", backgroundColor: "#3A2D1C" }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }, itemTitle: { color: colors.text, fontSize: 15, fontWeight: "900", textAlign: "right", marginTop: 11 }, itemBody: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 6 }, itemDate: { color: colors.muted, fontSize: 10, textAlign: "right", marginTop: 10 }, itemActions: { flexDirection: "row-reverse", gap: 10, justifyContent: "flex-start", marginTop: 12 }, action: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, actionText: { color: "#1A130A", fontSize: 11, fontWeight: "900" }, textAction: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, textActionLabel: { color: colors.accent, fontSize: 11, fontWeight: "800" },
});
