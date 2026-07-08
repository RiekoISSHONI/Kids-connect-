import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme";
import { Avatar, Btn, Card, Empty, Note, Row, Screen, ScreenHeader, SectionTitle, text as T } from "@/ui";
import { PARENT_PIN, useStore } from "@/store";
import { hasPhone } from "@/links";
import { fmtWhen } from "@/time";
import type { Friend } from "@/types";
import { EditPhoneSheet } from "@/sheets";

export default function Parent() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <ParentZone onLock={() => setUnlocked(false)} />;
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const press = (k: string) => {
    if (k === "clear") return setPin((p) => p.slice(0, -1));
    if (k === "ok") return check(pin);
    setPin((p) => {
      const next = p.length < 4 ? p + k : p;
      if (next.length === 4) check(next);
      return next;
    });
  };
  const check = (val: string) => {
    if (val === PARENT_PIN) onUnlock();
    else {
      Alert.alert("Wrong PIN", "The demo PIN is 1234.");
      setPin("");
    }
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "ok"];
  return (
    <Screen>
      <ScreenHeader title="Parent Zone 🔒" subtitle="This area is for grown-ups" />
      <Card style={{ alignItems: "center" }}>
        <Avatar emoji="🔒" size={64} />
        <Text style={[T.name, { marginTop: 8 }]}>Enter parent PIN</Text>
        <Note>Demo PIN is 1234</Note>
        <Row style={{ marginVertical: 14, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.pinDot, i < pin.length && { backgroundColor: colors.purple }]} />
          ))}
        </Row>
        <View style={styles.pad}>
          {keys.map((k) => (
            <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.purple }]}>
              <Text style={styles.keyText}>{k === "clear" ? "⌫" : k === "ok" ? "OK" : k}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function ParentZone({ onLock }: { onLock: () => void }) {
  const { state, approved, pendingFriends, pendingCalls, approvalCount, friendById, approveFriend, declineFriend, removeFriend, approveCall, declineCall, resetDemo } = useStore();
  const [editing, setEditing] = useState<Friend | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const confirmReset = () =>
    Alert.alert("Reset demo?", "This clears friends, plans and activity back to the demo.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetDemo },
    ]);

  return (
    <Screen>
      <ScreenHeader title="Parent Zone 👋" subtitle="Approve connections & calls, manage the circle" />

      <Card>
        <Row>
          <Avatar emoji="🛡️" />
          <View style={{ flex: 1 }}>
            <Text style={T.name}>{approvalCount} item{approvalCount === 1 ? "" : "s"} need approval</Text>
            <Note>Nothing happens without your OK</Note>
          </View>
          <Btn title="Lock" variant="ghost" small onPress={onLock} />
        </Row>
      </Card>

      <SectionTitle>Friend requests</SectionTitle>
      {pendingFriends.length ? (
        pendingFriends.map((f) => (
          <Card key={f.id} style={{ borderLeftWidth: 5, borderLeftColor: colors.sun }}>
            <Row>
              <Avatar emoji={f.avatar} size={60} />
              <View style={{ flex: 1 }}>
                <Text style={T.name}>{f.name} {f.flag}</Text>
                <Text style={T.sub}>{f.city}</Text>
                <Note>💬 {f.phone || "no number"} — wants to connect</Note>
              </View>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Btn title="✅ Approve" variant="green" small onPress={() => approveFriend(f.id)} />
              <Btn title="Decline" variant="ghost" small onPress={() => declineFriend(f.id)} />
            </Row>
          </Card>
        ))
      ) : (
        <Empty emoji="🙂" text="No pending friend requests" />
      )}

      <SectionTitle>Call requests</SectionTitle>
      {pendingCalls.length ? (
        pendingCalls.map((c) => {
          const f = friendById(c.friendId);
          return (
            <Card key={c.id} style={{ borderLeftWidth: 5, borderLeftColor: colors.sun }}>
              <Row>
                <Avatar emoji={f?.avatar ?? "📅"} size={60} />
                <View style={{ flex: 1 }}>
                  <Text style={T.name}>Call with {f?.name ?? "friend"} {f?.flag ?? ""}</Text>
                  <Text style={T.sub}>{fmtWhen(c.when)}</Text>
                </View>
              </Row>
              <Row style={{ marginTop: 12 }}>
                <Btn title="✅ Approve" variant="green" small onPress={() => approveCall(c.id)} />
                <Btn title="Decline" variant="ghost" small onPress={() => declineCall(c.id)} />
              </Row>
            </Card>
          );
        })
      ) : (
        <Empty emoji="🗓️" text="No pending call requests" />
      )}

      <SectionTitle>Approved circle ({approved.length})</SectionTitle>
      {approved.map((f) => (
        <Card key={f.id}>
          <Row>
            <Avatar emoji={f.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={T.name}>{f.name} {f.flag}</Text>
              <Text style={T.sub}>{f.city}</Text>
              {hasPhone(f) ? <Note>💬 {f.phone}</Note> : <Note danger>⚠️ no WhatsApp number</Note>}
            </View>
          </Row>
          <Row style={{ marginTop: 10 }}>
            <Btn title="✏️ Edit number" variant="ghost" small onPress={() => { setEditing(f); setShowEdit(true); }} />
            <Btn title="Remove" variant="ghost" small onPress={() => removeFriend(f.id)} />
          </Row>
        </Card>
      ))}

      <SectionTitle>Recent activity</SectionTitle>
      {state.log.slice(-8).reverse().map((l, i) => (
        <Card key={i} style={{ padding: 12 }}>
          <Row>
            <Avatar emoji="📝" size={34} />
            <View style={{ flex: 1 }}>
              <Text style={[T.sub, { color: colors.ink, fontWeight: "800" }]}>{l.text}</Text>
              <Note>{fmtWhen(l.when)}</Note>
            </View>
          </Row>
        </Card>
      ))}

      <Btn title="Reset demo data" variant="ghost" block style={{ marginTop: 14 }} onPress={confirmReset} />

      <EditPhoneSheet friend={editing} visible={showEdit} onClose={() => setShowEdit(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pinDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.line },
  pad: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: 232, justifyContent: "center" },
  key: { width: 70, height: 60, borderRadius: radius.md, backgroundColor: colors.line, alignItems: "center", justifyContent: "center" },
  keyText: { fontSize: 22, fontWeight: "800", color: colors.ink },
});
