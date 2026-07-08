import React, { useState } from "react";
import { Text, View } from "react-native";
import { Avatar, Btn, Card, Empty, Note, Pill, Row, Screen, ScreenHeader, SectionTitle, useNow, text as T } from "@/ui";
import { useStore } from "@/store";
import { fmtTime, fmtWhen, inFriendTime, localAt } from "@/time";
import type { Friend } from "@/types";
import { CallSheet, ScheduleSheet } from "@/sheets";

export default function Calls() {
  const { approved, state, friendById } = useStore();
  useNow();
  const online = approved.filter((f) => f.online);
  const offline = approved.filter((f) => !f.online);
  const upcoming = [...state.calls].sort((a, b) => a.when - b.when);

  const [target, setTarget] = useState<Friend | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);

  const call = (f: Friend) => { setTarget(f); setShowCall(true); };
  const plan = (id?: string) => { setScheduleFor(id ?? null); setShowSchedule(true); };

  return (
    <Screen>
      <ScreenHeader title="Video calls 📹" subtitle="Call online friends now, or plan one for later" />

      <SectionTitle>Online now — call right away</SectionTitle>
      {online.length ? (
        online.map((f) => (
          <Card key={f.id}>
            <Row>
              <Avatar emoji={f.avatar} online showDot />
              <View style={{ flex: 1 }}>
                <Text style={T.name}>{f.name} {f.flag}</Text>
                <Text style={T.sub}>{f.city} • {fmtTime(localAt(f.offset))}</Text>
              </View>
              <Btn title="📹 Call" variant="green" small onPress={() => call(f)} />
            </Row>
          </Card>
        ))
      ) : (
        <Card><Text style={T.sub}>Nobody's online — plan a call instead! 🌙</Text></Card>
      )}

      {offline.length ? (
        <>
          <SectionTitle>Offline</SectionTitle>
          {offline.map((f) => (
            <Card key={f.id}>
              <Row>
                <Avatar emoji={f.avatar} showDot />
                <View style={{ flex: 1 }}>
                  <Text style={T.name}>{f.name} {f.flag}</Text>
                  <Text style={T.sub}>{f.city} • {fmtTime(localAt(f.offset))} (asleep?)</Text>
                </View>
                <Btn title="📅 Plan" variant="ghost" small onPress={() => plan(f.id)} />
              </Row>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle>Planned calls</SectionTitle>
      <Btn title="＋ Schedule a video call" variant="pink" block onPress={() => plan()} style={{ marginBottom: 12 }} />
      {upcoming.length ? (
        upcoming.map((c) => {
          const f = friendById(c.friendId);
          const pill =
            c.status === "approved" ? <Pill text="✅ Approved" variant="ok" />
            : c.status === "declined" ? <Pill text="✋ Not now" variant="no" />
            : <Pill text="⏳ Waiting for grown-up" variant="wait" />;
          return (
            <Card key={c.id}>
              <Row>
                <Avatar emoji={f?.avatar ?? "📅"} />
                <View style={{ flex: 1 }}>
                  <Text style={T.name}>{f?.name ?? "Friend"} {f?.flag ?? ""}</Text>
                  <Text style={T.sub}>{fmtWhen(c.when)}</Text>
                </View>
                {pill}
              </Row>
              {f ? <Note>🕐 That's {fmtTime(inFriendTime(c.when, f.offset, state.me.offset))} for {f.name} in {f.city}</Note> : null}
              {c.status === "approved" && f ? (
                <Btn title="Join call now" variant="green" small block style={{ marginTop: 10 }} onPress={() => call(f)} />
              ) : null}
            </Card>
          );
        })
      ) : (
        <Empty emoji="🗓️" text="No calls planned yet" />
      )}

      <CallSheet friend={target} visible={showCall} onClose={() => setShowCall(false)} />
      <ScheduleSheet visible={showSchedule} onClose={() => setShowSchedule(false)} initialFriendId={scheduleFor} />
    </Screen>
  );
}
