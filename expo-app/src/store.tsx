import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppState, CityPreset, Friend, ScheduledCall } from "./types";

const STORE_KEY = "kidsconnect.native.v1";
export const PARENT_PIN = "1234";

/** City presets so the world map + local time work for any friend you add. */
export const CITIES: CityPreset[] = [
  { city: "Tokyo", flag: "🇯🇵", offset: 9, lon: 139.7, lat: 35.7 },
  { city: "London", flag: "🇬🇧", offset: 1, lon: -0.1, lat: 51.5 },
  { city: "New York", flag: "🇺🇸", offset: -4, lon: -74.0, lat: 40.7 },
  { city: "Los Angeles", flag: "🇺🇸", offset: -7, lon: -118.2, lat: 34.1 },
  { city: "Toronto", flag: "🇨🇦", offset: -4, lon: -79.4, lat: 43.7 },
  { city: "São Paulo", flag: "🇧🇷", offset: -3, lon: -46.6, lat: -23.5 },
  { city: "Dublin", flag: "🇮🇪", offset: 1, lon: -6.3, lat: 53.3 },
  { city: "Paris", flag: "🇫🇷", offset: 2, lon: 2.4, lat: 48.9 },
  { city: "Berlin", flag: "🇩🇪", offset: 2, lon: 13.4, lat: 52.5 },
  { city: "Dubai", flag: "🇦🇪", offset: 4, lon: 55.3, lat: 25.2 },
  { city: "Mumbai", flag: "🇮🇳", offset: 5.5, lon: 72.8, lat: 19.0 },
  { city: "Singapore", flag: "🇸🇬", offset: 8, lon: 103.8, lat: 1.35 },
  { city: "Sydney", flag: "🇦🇺", offset: 10, lon: 151.2, lat: -33.9 },
  { city: "Auckland", flag: "🇳🇿", offset: 12, lon: 174.8, lat: -36.8 },
  { city: "Cape Town", flag: "🇿🇦", offset: 2, lon: 18.4, lat: -33.9 },
];

export const AVATARS = ["🐰", "🦁", "🐨", "🐯", "🦄", "🐼", "🐱", "🐵", "🦋", "🐧", "🐢", "🦊", "🐶", "🐸", "🐙", "🦉"];

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}`;
}

function seedState(): AppState {
  const now = Date.now();
  const nextSat16 = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    d.setHours(16, 0, 0, 0);
    return d.getTime();
  };
  return {
    me: { name: "You", avatar: "🦊", flag: "🇺🇸", city: "San Francisco", offset: -7, lon: -122.4, lat: 37.8 },
    friends: [
      { id: "mia", name: "Mia", avatar: "🐰", flag: "🇯🇵", city: "Tokyo", offset: 9, lon: 139.7, lat: 35.7, online: true, status: "approved", phone: "+81 90 1234 5678" },
      { id: "leo", name: "Leo", avatar: "🦁", flag: "🇬🇧", city: "London", offset: 1, lon: -0.1, lat: 51.5, online: true, status: "approved", phone: "+44 7700 900123" },
      { id: "aria", name: "Aria", avatar: "🐨", flag: "🇺🇸", city: "New York", offset: -4, lon: -74.0, lat: 40.7, online: false, status: "approved", phone: "+1 212 555 0142" },
      { id: "kai", name: "Kai", avatar: "🐯", flag: "🇦🇺", city: "Sydney", offset: 10, lon: 151.2, lat: -33.9, online: false, status: "approved", phone: "" },
      { id: "sofia", name: "Sofia", avatar: "🦄", flag: "🇧🇷", city: "São Paulo", offset: -3, lon: -46.6, lat: -23.5, online: true, status: "approved", phone: "+55 11 91234 5678" },
      { id: "emma", name: "Emma", avatar: "🐼", flag: "🇮🇳", city: "Mumbai", offset: 5.5, lon: 72.8, lat: 19.0, online: true, status: "pending", phone: "+91 98765 43210" },
    ],
    calls: [{ id: makeId(), friendId: "mia", when: nextSat16(), status: "approved" }],
    log: [{ text: "Welcome to KidsConnect!", when: now }],
  };
}

interface StoreValue {
  state: AppState;
  ready: boolean;
  approved: Friend[];
  pendingFriends: Friend[];
  pendingCalls: ScheduledCall[];
  approvalCount: number;
  friendById: (id: string) => Friend | undefined;
  addFriend: (name: string, phone: string, cityIndex: number, avatar: string) => void;
  approveFriend: (id: string) => void;
  declineFriend: (id: string) => void;
  removeFriend: (id: string) => void;
  setPhone: (id: string, phone: string) => void;
  scheduleCall: (friendId: string, when: number) => void;
  approveCall: (id: string) => void;
  declineCall: (id: string) => void;
  addLog: (text: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) setState(JSON.parse(raw));
      } catch {
        // ignore — fall back to seed
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const friendById = (id: string) => state.friends.find((f) => f.id === id);

  const withLog = (s: AppState, text: string): AppState => ({
    ...s,
    log: [...s.log, { text, when: Date.now() }],
  });

  const value: StoreValue = {
    state,
    ready,
    approved: state.friends.filter((f) => f.status === "approved"),
    pendingFriends: state.friends.filter((f) => f.status === "pending"),
    pendingCalls: state.calls.filter((c) => c.status === "pending"),
    approvalCount:
      state.friends.filter((f) => f.status === "pending").length +
      state.calls.filter((c) => c.status === "pending").length,
    friendById,
    addFriend: (name, phone, cityIndex, avatar) =>
      setState((s) => {
        const c = CITIES[cityIndex] ?? CITIES[0];
        const friend: Friend = {
          id: makeId(),
          name,
          avatar,
          phone,
          flag: c.flag,
          city: c.city,
          offset: c.offset,
          lon: c.lon,
          lat: c.lat,
          online: false,
          status: "pending",
        };
        return withLog({ ...s, friends: [...s.friends, friend] }, `${s.me.name} asked to add ${name}`);
      }),
    approveFriend: (id) =>
      setState((s) => {
        const f = s.friends.find((x) => x.id === id);
        return withLog(
          { ...s, friends: s.friends.map((x) => (x.id === id ? { ...x, status: "approved" } : x)) },
          `Parent approved friend: ${f?.name ?? id}`
        );
      }),
    declineFriend: (id) =>
      setState((s) => {
        const f = s.friends.find((x) => x.id === id);
        return withLog({ ...s, friends: s.friends.filter((x) => x.id !== id) }, `Parent declined friend: ${f?.name ?? id}`);
      }),
    removeFriend: (id) =>
      setState((s) => {
        const f = s.friends.find((x) => x.id === id);
        return withLog({ ...s, friends: s.friends.filter((x) => x.id !== id) }, `Parent removed friend: ${f?.name ?? id}`);
      }),
    setPhone: (id, phone) =>
      setState((s) => {
        const f = s.friends.find((x) => x.id === id);
        return withLog(
          { ...s, friends: s.friends.map((x) => (x.id === id ? { ...x, phone } : x)) },
          `Parent updated ${f?.name ?? id}'s number`
        );
      }),
    scheduleCall: (friendId, when) =>
      setState((s) => {
        const f = s.friends.find((x) => x.id === friendId);
        const call: ScheduledCall = { id: makeId(), friendId, when, status: "pending" };
        return withLog({ ...s, calls: [...s.calls, call] }, `${s.me.name} requested a call with ${f?.name ?? friendId}`);
      }),
    approveCall: (id) =>
      setState((s) => ({ ...withLog(s, "Parent approved a scheduled call"), calls: s.calls.map((c) => (c.id === id ? { ...c, status: "approved" } : c)) })),
    declineCall: (id) =>
      setState((s) => ({ ...withLog(s, "Parent declined a scheduled call"), calls: s.calls.map((c) => (c.id === id ? { ...c, status: "declined" } : c)) })),
    addLog: (text) => setState((s) => withLog(s, text)),
    resetDemo: () => setState(seedState()),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
