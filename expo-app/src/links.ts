import { Linking, Alert } from "react-native";
import type { Friend } from "./types";

/** Digits only — wa.me wants a bare international number, no +, spaces or dashes. */
export function phoneDigits(p?: string): string {
  return String(p ?? "").replace(/[^\d]/g, "");
}

export function hasPhone(f?: { phone?: string } | null): boolean {
  return phoneDigits(f?.phone).length >= 6;
}

export function waLink(f: Friend, text?: string): string {
  const d = phoneDigits(f.phone);
  return `https://wa.me/${d}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}

export function facetimeLink(f: Friend): string {
  return `facetime://${phoneDigits(f.phone)}`;
}

/** Open a deep link, falling back to a friendly alert if the app isn't installed. */
export async function openExternal(url: string, appName: string): Promise<void> {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert(`${appName} not available`, `Couldn't open ${appName} on this device.`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(`Couldn't open ${appName}`, "Something went wrong opening the app.");
  }
}
