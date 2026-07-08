import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "./theme";

/** A Date that updates every second — for live world clocks. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginTop: 6, marginBottom: 12 }}>
      <Text style={styles.h1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Note({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return <Text style={[styles.note, danger && { color: colors.red }]}>{children}</Text>;
}

export function Avatar({ emoji, size = 46, online, showDot }: { emoji: string; size?: number; online?: boolean; showDot?: boolean }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 3 }]}>
      <Text style={{ fontSize: size * 0.52 }}>{emoji}</Text>
      {showDot ? <View style={[styles.dot, online ? styles.dotOn : styles.dotOff]} /> : null}
    </View>
  );
}

type BtnVariant = "purple" | "pink" | "mint" | "green" | "ghost" | "red";
const BTN_BG: Record<BtnVariant, string> = {
  purple: colors.purple,
  pink: colors.pink,
  mint: colors.mint,
  green: colors.green,
  red: colors.red,
  ghost: colors.line,
};

export function Btn({
  title,
  onPress,
  variant = "purple",
  small,
  block,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: BtnVariant;
  small?: boolean;
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = variant === "ghost" ? colors.ink : "#fff";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: BTN_BG[variant] },
        small && styles.btnSm,
        block && { alignSelf: "stretch" },
        disabled && { opacity: 0.5 },
        pressed && !disabled && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: textColor, fontSize: small ? 13 : 15 }]}>{title}</Text>
    </Pressable>
  );
}

type PillVariant = "on" | "wait" | "ok" | "no" | "muted";
const PILL_STYLE: Record<PillVariant, { bg: string; fg: string }> = {
  on: { bg: "#d8fff5", fg: "#009f8f" },
  wait: { bg: "#fff2cf", fg: "#b58a00" },
  ok: { bg: "#d8ffe7", fg: "#009f5a" },
  no: { bg: "#ffe0e0", fg: "#d63333" },
  muted: { bg: colors.line, fg: colors.muted },
};

export function Pill({ text, variant = "muted" }: { text: string; variant?: PillVariant }) {
  const s = PILL_STYLE[variant];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={{ color: s.fg, fontWeight: "800", fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/** Bottom-sheet style modal. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grip} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const text = {
  name: { fontWeight: "800" as const, fontSize: 16, color: colors.ink },
  sub: { color: colors.muted, fontWeight: "700" as const, fontSize: 13 },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontWeight: "700", fontSize: 14, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, shadowColor: colors.purple, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 18, marginBottom: 8, marginHorizontal: 4 },
  note: { fontSize: 12, color: colors.muted, fontWeight: "700", lineHeight: 17 },
  avatar: { alignItems: "center", justifyContent: "center", backgroundColor: colors.line },
  dot: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.card },
  dotOn: { backgroundColor: colors.green },
  dotOff: { backgroundColor: "#c9c6dd" },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  btnText: { fontWeight: "800" },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: "flex-start" },
  empty: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 10 },
  emptyText: { color: colors.muted, fontWeight: "700", textAlign: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(21,19,43,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  grip: { width: 44, height: 5, borderRadius: 99, backgroundColor: colors.line, alignSelf: "center", marginBottom: 12 },
});

export { styles as uiStyles };
