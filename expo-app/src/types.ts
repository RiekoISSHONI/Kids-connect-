export type FriendStatus = "approved" | "pending";

export interface Friend {
  id: string;
  name: string;
  avatar: string; // emoji
  flag: string; // emoji
  city: string;
  offset: number; // UTC offset in hours (may be fractional, e.g. 5.5)
  lon: number;
  lat: number;
  online: boolean;
  status: FriendStatus;
  phone: string; // WhatsApp number, E.164-ish (may be empty)
}

export type CallStatus = "pending" | "approved" | "declined";

export interface ScheduledCall {
  id: string;
  friendId: string;
  when: number; // epoch ms
  status: CallStatus;
}

export interface LogEntry {
  text: string;
  when: number;
}

export interface Me {
  name: string;
  avatar: string;
  flag: string;
  city: string;
  offset: number;
  lon: number;
  lat: number;
}

export interface AppState {
  me: Me;
  friends: Friend[];
  calls: ScheduledCall[];
  log: LogEntry[];
}

export interface CityPreset {
  city: string;
  flag: string;
  offset: number;
  lon: number;
  lat: number;
}
