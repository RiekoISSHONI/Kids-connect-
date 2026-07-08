import React, { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Sharing from "expo-sharing";
import { colors, radius } from "./theme";
import { Btn, Note, Sheet } from "./ui";
import { Chip } from "./sheets";
import { useStore } from "./store";
import { hasPhone, openExternal, waLink } from "./links";

type Phase = "setup" | "recording" | "recorded";

/**
 * Record a short video with the real camera, then hand off to WhatsApp / the
 * share sheet to actually send it. KidsConnect never uploads the clip itself.
 */
export function RecordSheet({ visible, onClose, initialFriendId }: { visible: boolean; onClose: () => void; initialFriendId?: string | null }) {
  const { approved, state, addLog } = useStore();
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const camRef = useRef<CameraView>(null);

  const [friendId, setFriendId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [seconds, setSeconds] = useState(0);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFriendId(initialFriendId ?? approved[0]?.id ?? null);
      setCaption("");
      setPhase("setup");
      setSeconds(0);
      setUri(null);
    }
  }, [visible, initialFriendId]);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const friend = approved.find((f) => f.id === friendId) ?? null;
  const canRecord = Platform.OS !== "web" && camPerm?.granted;

  const startRecording = async () => {
    if (!camRef.current) return;
    if (!micPerm?.granted) await requestMic();
    setPhase("recording");
    setSeconds(0);
    try {
      const video = await camRef.current.recordAsync({ maxDuration: 15 });
      if (video?.uri) {
        setUri(video.uri);
        setPhase("recorded");
      } else {
        setPhase("setup");
      }
    } catch {
      setPhase("setup");
    }
  };

  const stopRecording = () => camRef.current?.stopRecording();

  const send = async () => {
    if (!friend) return;
    const msg = caption.trim() || `Hi ${friend.name}! Here's a video for you 🎬`;
    addLog(`${state.me.name} shared a video to ${friend.name}`);
    try {
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { dialogTitle: `Send to ${friend.name}`, mimeType: "video/mp4" });
      } else if (hasPhone(friend)) {
        openExternal(waLink(friend, msg), "WhatsApp");
      }
    } catch {
      if (hasPhone(friend)) openExternal(waLink(friend, msg), "WhatsApp");
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.h2}>Send a video 🎬</Text>
        <Note>Record a short clip, then send it in WhatsApp. Only to approved friends.</Note>

        <View style={styles.camBox}>
          {canRecord ? (
            <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="front" mode="video" />
          ) : (
            <View style={styles.camFallback}>
              <Text style={{ fontSize: 60 }}>{state.me.avatar}</Text>
              <Text style={styles.camFallbackText}>
                {Platform.OS === "web" ? "Camera preview isn't available on web — you can still send a note in WhatsApp." : "Camera permission needed to record."}
              </Text>
            </View>
          )}
          {phase === "recording" ? (
            <View style={styles.recDot}>
              <View style={styles.recCircle} />
              <Text style={styles.recText}>REC 0:{String(seconds).padStart(2, "0")}</Text>
            </View>
          ) : null}
        </View>

        {!canRecord && Platform.OS !== "web" ? (
          <Btn title="Allow camera" variant="ghost" block style={{ marginTop: 10 }} onPress={() => requestCam()} />
        ) : null}

        <Text style={styles.label}>Send to</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {approved.map((f) => (
            <Chip key={f.id} label={`${f.avatar} ${f.name}`} selected={f.id === friendId} onPress={() => setFriendId(f.id)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Add a message (optional)</Text>
        <TextInput style={styles.input} value={caption} onChangeText={setCaption} placeholder="Say something fun!" maxLength={80} placeholderTextColor={colors.muted} />

        {canRecord && phase === "setup" ? (
          <Btn title="● Start recording" variant="purple" block style={{ marginTop: 14 }} onPress={startRecording} />
        ) : null}
        {canRecord && phase === "recording" ? (
          <Btn title="■ Stop recording" variant="pink" block style={{ marginTop: 14 }} onPress={stopRecording} />
        ) : null}
        {canRecord && phase === "recorded" ? (
          <Btn title="↺ Record again" variant="ghost" block style={{ marginTop: 14 }} onPress={() => { setUri(null); setPhase("setup"); }} />
        ) : null}

        <Btn
          title="Send in WhatsApp 💬"
          variant="green"
          block
          style={{ marginTop: 8 }}
          disabled={!friend || (canRecord ? phase !== "recorded" : false)}
          onPress={send}
        />
        <Note>Your video opens in WhatsApp so you can send it to your friend.</Note>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 22, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  label: { fontWeight: "800", fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.line, backgroundColor: "#faf9ff", color: colors.ink, fontWeight: "700", fontSize: 15 },
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  camBox: { marginTop: 12, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#15132b", aspectRatio: 3 / 4, alignItems: "center", justifyContent: "center" },
  camFallback: { alignItems: "center", padding: 20 },
  camFallbackText: { color: "#fff", opacity: 0.8, textAlign: "center", marginTop: 10, fontWeight: "700" },
  recDot: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  recCircle: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.red },
  recText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
