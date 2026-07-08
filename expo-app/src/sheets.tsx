import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius } from "./theme";
import { Avatar, Btn, Note, Row, Sheet, text as T } from "./ui";
import { AVATARS, CITIES, useStore } from "./store";
import type { Friend } from "./types";
import { diffText, fmtTime, inFriendTime, localAt } from "./time";
import { facetimeLink, hasPhone, openExternal, waLink } from "./links";

/* ---------------- Call handoff to WhatsApp / FaceTime ---------------- */
export function CallSheet({ friend, visible, onClose }: { friend: Friend | null; visible: boolean; onClose: () => void }) {
  const { state, addLog } = useStore();
  if (!friend) return <Sheet visible={visible} onClose={onClose}><View /></Sheet>;

  if (!hasPhone(friend)) {
    return (
      <Sheet visible={visible} onClose={onClose}>
        <Text style={styles.h2}>No number yet 📵</Text>
        <Note>A grown-up needs to add {friend.name}'s WhatsApp number before you can call.</Note>
        <Btn title="OK" variant="ghost" block onPress={onClose} style={{ marginTop: 14 }} />
      </Sheet>
    );
  }

  const t = fmtTime(localAt(friend.offset));
  const d = diffText(friend.offset, state.me.offset).txt;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.h2}>Call {friend.name} {friend.flag}</Text>
      <Note>It's {t} for {friend.name} in {friend.city} — {d}. Pick an app to call in:</Note>
      <Btn
        title="💬 Open WhatsApp"
        variant="green"
        block
        style={{ marginTop: 14 }}
        onPress={() => {
          addLog(`${state.me.name} opened WhatsApp to call ${friend.name}`);
          openExternal(waLink(friend), "WhatsApp");
          onClose();
        }}
      />
      <Btn
        title="🍏 FaceTime (Apple)"
        variant="mint"
        block
        style={{ marginTop: 8 }}
        onPress={() => {
          addLog(`${state.me.name} opened FaceTime to call ${friend.name}`);
          openExternal(facetimeLink(friend), "FaceTime");
          onClose();
        }}
      />
      <Btn title="Cancel" variant="ghost" block style={{ marginTop: 8 }} onPress={onClose} />
      <Note>On a phone these open the real app. WhatsApp opens the chat — tap its 📹 to start the video call.</Note>
    </Sheet>
  );
}

/* ---------------- Schedule a call (parent approval) ---------------- */
function nextDays(n: number): { label: string; date: Date }[] {
  const out: { label: string; date: Date }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setSeconds(0, 0);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    out.push({ label, date: d });
  }
  return out;
}
const HOURS = [9, 12, 15, 17, 19];

export function ScheduleSheet({ visible, onClose, initialFriendId }: { visible: boolean; onClose: () => void; initialFriendId?: string | null }) {
  const { approved, state, scheduleCall } = useStore();
  const days = useMemo(() => nextDays(6), [visible]);
  const [friendId, setFriendId] = useState<string | null>(initialFriendId ?? null);
  const [dayIdx, setDayIdx] = useState(1);
  const [hour, setHour] = useState(16);

  React.useEffect(() => {
    if (visible) setFriendId(initialFriendId ?? approved[0]?.id ?? null);
  }, [visible, initialFriendId]);

  const friend = approved.find((f) => f.id === friendId) ?? null;
  const chosen = new Date(days[dayIdx]?.date ?? new Date());
  chosen.setHours(hour, 0, 0, 0);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.h2}>Schedule a call 📅</Text>
      <Note>A grown-up will get a request to approve it.</Note>

      <Text style={styles.label}>With which friend?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {approved.map((f) => (
          <Chip key={f.id} label={`${f.avatar} ${f.name}`} selected={f.id === friendId} onPress={() => setFriendId(f.id)} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Which day?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {days.map((d, i) => (
          <Chip key={i} label={d.label} selected={i === dayIdx} onPress={() => setDayIdx(i)} />
        ))}
      </ScrollView>

      <Text style={styles.label}>What time? (your time)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {HOURS.map((h) => (
          <Chip key={h} label={fmtTime(new Date(2020, 0, 1, h, 0))} selected={h === hour} onPress={() => setHour(h)} />
        ))}
      </ScrollView>

      {friend ? (
        <Note>🕐 That's {fmtTime(inFriendTime(chosen.getTime(), friend.offset, state.me.offset))} for {friend.name} in {friend.city}.</Note>
      ) : null}

      <Btn
        title="Ask a grown-up ✅"
        variant="pink"
        block
        style={{ marginTop: 14 }}
        onPress={() => {
          if (!friend) return;
          scheduleCall(friend.id, chosen.getTime());
          onClose();
        }}
      />
    </Sheet>
  );
}

/* ---------------- Add a friend (on-device, parent-approved) ---------------- */
export function AddFriendSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, addFriend } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityIdx, setCityIdx] = useState(0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (visible) {
      setName("");
      setPhone("");
      setCityIdx(0);
      setAvatar(AVATARS[0]);
      setError("");
    }
  }, [visible]);

  const submit = () => {
    const nm = name.trim();
    if (!nm) return setError("Type a name");
    if (!hasPhone({ phone })) return setError("Enter a valid WhatsApp number (with country code)");
    if (state.friends.some((f) => f.name.toLowerCase() === nm.toLowerCase())) return setError(`Already added ${nm}`);
    addFriend(nm, phone.trim(), cityIdx, avatar);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.h2}>Add a friend 👋</Text>
        <Note>A grown-up enters your friend's details. They still have to approve before you can call.</Note>

        <Text style={styles.label}>Friend's name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Mia" maxLength={20} placeholderTextColor={colors.muted} />

        <Text style={styles.label}>WhatsApp number (with country code)</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. +44 7700 900123" keyboardType="phone-pad" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>City (for the world map & local time)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CITIES.map((c, i) => (
            <Chip key={c.city} label={`${c.flag} ${c.city}`} selected={i === cityIdx} onPress={() => setCityIdx(i)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Pick an animal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {AVATARS.slice(0, 10).map((a) => (
            <Chip key={a} label={a} selected={a === avatar} onPress={() => setAvatar(a)} />
          ))}
        </ScrollView>

        {error ? <Note danger>{error}</Note> : null}
        <Btn title="Ask a grown-up to add ✅" variant="pink" block style={{ marginTop: 14 }} onPress={submit} />
      </ScrollView>
    </Sheet>
  );
}

/* ---------------- Edit a friend's WhatsApp number (Parent Zone) ---------------- */
export function EditPhoneSheet({ friend, visible, onClose }: { friend: Friend | null; visible: boolean; onClose: () => void }) {
  const { setPhone } = useStore();
  const [value, setValue] = useState("");
  React.useEffect(() => {
    if (visible && friend) setValue(friend.phone ?? "");
  }, [visible, friend]);
  if (!friend) return <Sheet visible={visible} onClose={onClose}><View /></Sheet>;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.h2}>{friend.avatar} {friend.name}'s number</Text>
      <Note>WhatsApp number with country code — used to launch the call.</Note>
      <TextInput style={styles.input} value={value} onChangeText={setValue} placeholder="+44 7700 900123" keyboardType="phone-pad" placeholderTextColor={colors.muted} />
      <Btn
        title="Save"
        variant="green"
        block
        style={{ marginTop: 12 }}
        onPress={() => {
          setPhone(friend.id, value.trim());
          onClose();
        }}
      />
    </Sheet>
  );
}

/* ---------------- Small selectable chip ---------------- */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSel]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 22, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  label: { fontWeight: "800", fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.line, backgroundColor: "#faf9ff", color: colors.ink, fontWeight: "700", fontSize: 15 },
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  chip: { borderWidth: 2, borderColor: colors.line, backgroundColor: "#faf9ff", borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: 12, fontWeight: "800", fontSize: 14, color: colors.ink, overflow: "hidden" },
  chipSel: { borderColor: colors.purple, backgroundColor: "#efeaff", color: colors.purple },
});
