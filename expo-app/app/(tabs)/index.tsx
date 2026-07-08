import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius } from "@/theme";
import { Avatar, Btn, Card, Row, Screen, SectionTitle, useNow, text as T } from "@/ui";
import { useStore } from "@/store";
import { fmtTime, localAt } from "@/time";
import type { Friend } from "@/types";
import { CallSheet, ScheduleSheet } from "@/sheets";
import { RecordSheet } from "@/RecordSheet";

export default function Home() {
  const { state, approved, approvalCount } = useStore();
  useNow();
  const online = approved.filter((f) => f.online);
  const [callFriend, setCall] = useState<Friend | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const openCall = (f: Friend) => { setCall(f); setShowCall(true); };

  return (
    <Screen>
      <Row style={{ marginTop: 8, marginBottom: 14 }}>
        <View style={styles.logo}><Text style={{ fontSize: 22 }}>💜</Text></View>
        <Text style={styles.brand}>KidsConnect</Text>
      </Row>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Hi {state.me.name} {state.me.avatar}</Text>
        <Text style={styles.heroSub}>{online.length} friend{online.length === 1 ? "" : "s"} online now • {approved.length} connected</Text>
      </View>

      <Card style={{ backgroundColor: "#eafff6" }}>
        <Row>
          <Avatar emoji="💬" />
          <View style={{ flex: 1 }}>
            <Text style={T.name}>Calls happen in WhatsApp / FaceTime</Text>
            <Text style={T.sub}>KidsConnect keeps your friends, times & plans organised.</Text>
          </View>
        </Row>
      </Card>

      {approvalCount > 0 ? (
        <Card style={{ borderLeftWidth: 5, borderLeftColor: colors.sun }}>
          <Row>
            <Avatar emoji="⏳" />
            <View style={{ flex: 1 }}>
              <Text style={T.name}>Waiting for a grown-up</Text>
              <Text style={T.sub}>{approvalCount} thing{approvalCount === 1 ? "" : "s"} need approval</Text>
            </View>
          </Row>
        </Card>
      ) : null}

      <SectionTitle>What do you want to do?</SectionTitle>
      <View style={styles.grid}>
        <QuickBtn emoji="🎬" label="Send a video" desc="Share via WhatsApp" onPress={() => setShowRecord(true)} />
        <QuickBtn emoji="🌍" label="World map" desc="See their local time" onPress={() => router.navigate("/world")} />
        <QuickBtn emoji="📹" label="Video call" desc="Open WhatsApp / FaceTime" onPress={() => router.navigate("/calls")} />
        <QuickBtn emoji="📅" label="Plan a call" desc="Pick a day & time" onPress={() => setShowSchedule(true)} />
      </View>

      <SectionTitle>Online right now</SectionTitle>
      {online.length ? (
        online.map((f) => (
          <Card key={f.id}>
            <Row>
              <Avatar emoji={f.avatar} online showDot />
              <View style={{ flex: 1 }}>
                <Text style={T.name}>{f.name} {f.flag}</Text>
                <Text style={T.sub}>{f.city} • {fmtTime(localAt(f.offset))}</Text>
              </View>
              <Btn title="📹 Call" variant="mint" small onPress={() => openCall(f)} />
            </Row>
          </Card>
        ))
      ) : (
        <Card><Text style={T.sub}>No friends online yet — check the World map to see when they wake up! 😴</Text></Card>
      )}

      <CallSheet friend={callFriend} visible={showCall} onClose={() => setShowCall(false)} />
      <RecordSheet visible={showRecord} onClose={() => setShowRecord(false)} />
      <ScheduleSheet visible={showSchedule} onClose={() => setShowSchedule(false)} />
    </Screen>
  );
}

function QuickBtn({ emoji, label, desc, onPress }: { emoji: string; label: string; desc: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { transform: [{ scale: 0.97 }] }]}>
      <Text style={{ fontSize: 30, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ fontWeight: "800", fontSize: 15, color: colors.ink }}>{label}</Text>
      <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700" }}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 24, fontWeight: "800", color: colors.purple },
  hero: { backgroundColor: colors.purple, borderRadius: 26, padding: 20, marginBottom: 14 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  heroSub: { color: "#fff", opacity: 0.92, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quick: { width: "47.5%", flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, shadowColor: colors.purple, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
});
