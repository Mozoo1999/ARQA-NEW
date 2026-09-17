import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export type MobileDesignId = "command_center" | "operational_canvas" | "adaptive_orbit";

export interface MobileDesignOption {
  id: MobileDesignId;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  imageUrl: string;
  strengths: string[];
}

export const mobileDesignOptions: MobileDesignOption[] = [
  {
    id: "command_center",
    title: "Command Center",
    subtitle: "مركز العمليات",
    description: "تجربة كحلية وذهبية تضع التحكم الصوتي والتفويض التشغيلي في مركز الشاشة.",
    accent: "#D8AE62",
    imageUrl: "https://narqaebos-c2nmdy4n.manus.space/manus-storage/narqa-mobile-concept-01-command-center_b510a966.png",
    strengths: ["تركيز قوي على الصوت", "مناسب للمشرفين", "تباين مرتفع"],
  },
  {
    id: "operational_canvas",
    title: "Operational Canvas",
    subtitle: "مساحة الأعمال",
    description: "واجهة نهارية عالية الوضوح تعطي الأولوية للاختصارات ومراجعة المستندات والنتائج المنظمة.",
    accent: "#1264E6",
    imageUrl: "https://narqaebos-c2nmdy4n.manus.space/manus-storage/narqa-mobile-concept-02-operational-canvas_6c8fa791.png",
    strengths: ["قراءة يومية مريحة", "أفضل لمراجعة المستندات", "ملائم للهاتف واللوحي"],
  },
  {
    id: "adaptive_orbit",
    title: "Adaptive Orbit",
    subtitle: "المساعد التكيفي",
    description: "واجهة داكنة تفاعلية تنظّم الأوامر والإدخال والمراجعة حول المهمة النشطة وسياقها.",
    accent: "#43DBB2",
    imageUrl: "https://narqaebos-c2nmdy4n.manus.space/manus-storage/narqa-mobile-concept-03-adaptive-orbit_5582b8cc.png",
    strengths: ["تدفق سياقي", "مناسب للعمل الميداني", "إبراز حالة الاستماع"],
  },
];

export function getMobileDesign(id: MobileDesignId): MobileDesignOption {
  return mobileDesignOptions.find((option) => option.id === id) ?? mobileDesignOptions[1];
}

interface DesignSelectorScreenProps {
  selectedDesign: MobileDesignId;
  onSelect: (design: MobileDesignId) => void;
  onBack: () => void;
}

export function DesignSelectorScreen({ selectedDesign, onSelect, onBack }: DesignSelectorScreenProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 3 : width >= 680 ? 2 : 1;
  const selected = getMobileDesign(selectedDesign);

  return (
    <FlatList
      data={mobileDesignOptions}
      key={columns}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>NARQA EBOS / DESIGN LAB</Text>
          <Text style={styles.title}>اختر تجربة العمل المناسبة</Text>
          <Text style={styles.description}>الاختيار محفوظ على هذا الجهاز ويغيّر هوية الغلاف التشغيلي. جميع الخيارات تستخدم نفس البيانات والصلاحيات والمراجعة قبل الإدراج.</Text>
          <View style={[styles.currentBanner, { borderColor: selected.accent }]}>
            <View style={[styles.currentDot, { backgroundColor: selected.accent }]} />
            <View style={styles.currentCopy}>
              <Text style={styles.currentLabel}>التصميم النشط</Text>
              <Text style={styles.currentValue}>{selected.subtitle} · {selected.title}</Text>
            </View>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const isSelected = item.id === selectedDesign;
        return (
          <View style={styles.cardCell}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`اختيار تصميم ${item.subtitle}`}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [
                styles.card,
                isSelected && { borderColor: item.accent, borderWidth: 2 },
                pressed && styles.pressed,
              ]}
            >
              <Image source={{ uri: item.imageUrl }} resizeMode="cover" style={styles.preview} accessibilityLabel={`معاينة ${item.subtitle}`} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeadingRow}>
                  <View style={[styles.selectionMark, { borderColor: item.accent, backgroundColor: isSelected ? item.accent : "transparent" }]}>
                    <Text style={styles.selectionMarkText}>{isSelected ? "✓" : ""}</Text>
                  </View>
                  <View style={styles.cardHeadingCopy}>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <View style={styles.tags}>{item.strengths.map((strength) => <View key={strength} style={styles.tag}><Text style={styles.tagText}>{strength}</Text></View>)}</View>
                <View style={[styles.selectAction, { backgroundColor: isSelected ? item.accent : "#17263B" }]}>
                  <Text style={[styles.selectActionText, isSelected && styles.selectActionTextActive]}>{isSelected ? "التصميم مختار" : "اختيار هذا التصميم"}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        );
      }}
      ListFooterComponent={<Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backButtonText}>العودة إلى مركز التشغيل</Text></Pressable>}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, maxWidth: 1180, width: "100%", alignSelf: "center" },
  header: { marginBottom: 18 },
  eyebrow: { color: "#D8AE62", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textAlign: "right", marginBottom: 7 },
  title: { color: "#F5F7FB", fontSize: 29, lineHeight: 38, fontWeight: "900", textAlign: "right" },
  description: { color: "#9EADC3", fontSize: 13, lineHeight: 22, textAlign: "right", marginTop: 8 },
  currentBanner: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#111E31", borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 15 },
  currentDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  currentCopy: { flex: 1 },
  currentLabel: { color: "#8392A8", fontSize: 11, textAlign: "right" },
  currentValue: { color: "#F5F7FB", fontSize: 14, fontWeight: "800", textAlign: "right", marginTop: 3 },
  row: { gap: 12 },
  cardCell: { flex: 1, padding: 6 },
  card: { overflow: "hidden", backgroundColor: "#101B2B", borderWidth: 1, borderColor: "#2A3B53", borderRadius: 18, minHeight: 430 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  preview: { width: "100%", height: 230, backgroundColor: "#08111D" },
  cardBody: { padding: 15, flex: 1 },
  cardHeadingRow: { flexDirection: "row", alignItems: "center" },
  cardHeadingCopy: { flex: 1 },
  cardSubtitle: { color: "#F5F7FB", fontSize: 16, fontWeight: "900", textAlign: "right" },
  cardTitle: { color: "#8392A8", fontSize: 11, textAlign: "right", marginTop: 2 },
  selectionMark: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12 },
  selectionMarkText: { color: "#07101C", fontSize: 15, fontWeight: "900" },
  cardDescription: { color: "#AAB6C8", fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: 12 },
  tags: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: "#17263B", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: "#C8D2E1", fontSize: 10 },
  selectAction: { minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: "auto" },
  selectActionText: { color: "#D8AE62", fontSize: 12, fontWeight: "800" },
  selectActionTextActive: { color: "#07101C" },
  backButton: { minHeight: 48, margin: 6, marginTop: 18, borderWidth: 1, borderColor: "#D8AE62", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backButtonText: { color: "#D8AE62", fontSize: 13, fontWeight: "800" },
});
