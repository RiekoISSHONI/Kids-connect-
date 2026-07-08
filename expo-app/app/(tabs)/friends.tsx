import React, { useState } from "react";
import { Text, View } from "react-native";
import { colors } from "@/theme";
import { Avatar, Btn, Card, Empty, Note, Pill, Row, Screen, ScreenHeader, SectionTitle, useNow, text as T } from "@/ui";
import { useStore } from "@/store";
import { fmtTime, localAt } from "@/time";
import { hasPhone } from "@/links";
import type { Friend } from "@/types";
import { AddFriendSheet, CallSheet, ScheduleSheet } from "@/sheets";
import { RecordSheet } from "@/RecordSheet";

export default function Friends() {
  const { approved, pendingFriends } = useStore();
  useNow();
  const [target, setTarget] = useState<Friend | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="Friends" subtitle="You can only call friends a grown-up approved 💜" />

      <Btn title="＋ Add a new friend" variant="pink" block onPress={() => setShowAdd(true)} />

      {pendingFriends.length ? (
        <>
          <SectionTitle>Waiting for grown-up</SectionTitle>
          {pendingFriends.map((f) => (
            <Card key={f.id}>
              <Row>
                <Avatar emoji={f.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={T.name}>{f.name} {f.flag}</Text>
                  <Text style={T.sub}>{f.city}</Text>
                </View>
                <Pill text="⏳ Pending" variant="wait" />
              </Row>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle>My connected friends ({approved.length})</SectionTitle>
      {approved.length ? (
        approved.map((f) => (
          <Card key={f.id}>
            <Row>
              <Avatar emoji={f.avatar} size={60} online={f.online} showDot />
              <View style={{ flex: 1 }}>
                <Text style={T.name}>{f.name} {f.flag}</Text>
                <Text style={T.sub}>{f.city} • {fmtTime(localAt(f.offset))} • {f.online ? "online" : "offline"}</Text>
                {hasPhone(f) ? <Note>💬 {f.phone}</Note> : <Note danger>⚠️ No WhatsApp number — ask a grown-up</Note>}
              </View>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Btn title="🎬 Video" small onPress={() => { setTarget(f); setShowRecord(true); }} />
              <Btn title="📹 Call" variant="mint" small onPress={() => { setTarget(f); setShowCall(true); }} />
              <Btn title="📅 Plan" variant="ghost" small onPress={() => { setTarget(f); setShowSchedule(true); }} />
            </Row>
          </Card>
        ))
      ) : (
        <Empty emoji="👋" text="No friends yet — add one above!" />
      )}

      <AddFriendSheet visible={showAdd} onClose={() => setShowAdd(false)} />
      <CallSheet friend={target} visible={showCall} onClose={() => setShowCall(false)} />
      <RecordSheet visible={showRecord} onClose={() => setShowRecord(false)} initialFriendId={target?.id} />
      <ScheduleSheet visible={showSchedule} onClose={() => setShowSchedule(false)} initialFriendId={target?.id} />
    </Screen>
  );
}
