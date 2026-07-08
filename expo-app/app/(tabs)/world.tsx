import React from "react";
import { Text, View } from "react-native";
import { colors } from "@/theme";
import { Avatar, Card, Note, Row, Screen, ScreenHeader, useNow, text as T } from "@/ui";
import { useStore } from "@/store";
import { diffText, fmtDay, fmtTime, localAt } from "@/time";
import { WorldMap } from "@/WorldMap";
import type { Friend, Me } from "@/types";

export default function World() {
  const { state, approved } = useStore();
  useNow();

  const rows: { key: string; name: string; avatar: string; flag: string; city: string; offset: number; isMe?: boolean }[] = [
    { key: "me", name: `You (${state.me.name})`, avatar: state.me.avatar, flag: state.me.flag, city: state.me.city, offset: state.me.offset, isMe: true },
    ...approved.map((f) => ({ key: f.id, name: f.name, avatar: f.avatar, flag: f.flag, city: f.city, offset: f.offset })),
  ];

  return (
    <Screen>
      <ScreenHeader title="World map 🌍" subtitle="See where your friends are and what time it is for them" />
      <WorldMap me={state.me} friends={approved} />
      <Note>🟡 = you · each card shows the time difference</Note>

      <View style={{ height: 8 }} />
      {rows.map((r) => {
        const d = localAt(r.offset);
        const diff = r.isMe ? { txt: "this is your time", kind: "same" as const } : diffText(r.offset, state.me.offset);
        const color = diff.kind === "ahead" ? colors.pink : diff.kind === "behind" ? colors.mint : colors.muted;
        return (
          <Card key={r.key}>
            <Row>
              <Avatar emoji={r.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={T.name}>{r.name} {r.flag}</Text>
                <Text style={T.sub}>{r.city} • {fmtDay(d)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{fmtTime(d)}</Text>
                <Text style={{ fontSize: 12, fontWeight: "800", color }}>{diff.txt}</Text>
              </View>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
