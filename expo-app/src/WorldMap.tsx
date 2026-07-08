import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polygon, Rect } from "react-native-svg";
import { colors } from "./theme";
import { localAt, fmtTime } from "./time";
import type { Friend, Me } from "./types";
import { useNow } from "./ui";

// Rough continent outlines as [lon, lat] points — a friendly, simplified world.
const CONTINENTS: number[][][] = [
  [[-168, 65], [-150, 71], [-95, 72], [-62, 70], [-52, 47], [-66, 46], [-80, 25], [-98, 18], [-110, 23], [-125, 40], [-140, 60]],
  [[-80, 9], [-60, 11], [-35, -5], [-40, -23], [-58, -40], [-72, -53], [-75, -30], [-81, -4]],
  [[-10, 36], [-6, 44], [4, 60], [28, 70], [42, 60], [40, 45], [28, 40], [10, 38]],
  [[-17, 33], [11, 37], [33, 32], [43, 12], [40, -12], [25, -34], [18, -34], [8, 4], [-17, 15]],
  [[40, 45], [60, 68], [100, 73], [145, 66], [170, 66], [150, 45], [122, 32], [105, 16], [95, 8], [78, 8], [60, 25], [45, 40]],
  [[113, -12], [131, -11], [145, -12], [153, -25], [148, -39], [130, -32], [115, -22]],
];

const VW = 1000;
const VH = 500;
const toXY = ([lon, lat]: number[]) => `${((lon + 180) / 360) * VW},${((90 - lat) / 180) * VH}`;

function pct(lon: number, lat: number) {
  return { left: `${((lon + 180) / 360) * 100}%`, top: `${((90 - lat) / 180) * 100}%` };
}

export function WorldMap({ me, friends }: { me: Me; friends: Friend[] }) {
  useNow(); // re-render each second so pin times stay live
  const pins = [{ ...me, id: "me", isMe: true } as Friend & { isMe?: boolean }, ...friends];
  return (
    <View style={styles.map}>
      <Svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" preserveAspectRatio="none">
        <Rect x={0} y={0} width={VW} height={VH} fill="#93e4ff" />
        {CONTINENTS.map((pts, i) => (
          <Polygon key={i} points={pts.map(toXY).join(" ")} fill="#7bd88f" stroke="#5cc174" strokeWidth={2} strokeLinejoin="round" />
        ))}
      </Svg>
      {pins.map((p) => {
        const pos = pct(p.lon, p.lat);
        const isMe = (p as { isMe?: boolean }).isMe;
        return (
          <View key={p.id} style={[styles.pin, { left: pos.left as any, top: pos.top as any }]}>
            <View style={[styles.flagBubble, isMe && { borderColor: colors.sun }]}>
              <Text style={{ fontSize: 14 }}>{isMe ? "🟡" : p.flag}</Text>
            </View>
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>{fmtTime(localAt(p.offset))}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", aspectRatio: 2, borderRadius: 20, overflow: "hidden", marginBottom: 8, backgroundColor: "#93e4ff" },
  pin: { position: "absolute", alignItems: "center", transform: [{ translateX: -13 }, { translateY: -13 }] },
  flagBubble: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
  timeTag: { marginTop: 2, backgroundColor: "rgba(45,42,69,0.82)", paddingHorizontal: 6, borderRadius: 999 },
  timeTagText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
