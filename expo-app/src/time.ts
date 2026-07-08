// Time helpers shared across screens. A friend's wall-clock time is derived from
// their UTC offset so kids can learn the difference relative to their own time.

/** Wall-clock Date for a given UTC offset (in hours). */
export function localAt(offset: number): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + offset * 3600000);
}

export function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function fmtWhen(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    fmtTime(d)
  );
}

export interface Diff {
  txt: string;
  kind: "ahead" | "behind" | "same";
}

/** Human-friendly time difference of `offset` relative to `myOffset`. */
export function diffText(offset: number, myOffset: number): Diff {
  const d = offset - myOffset;
  if (d === 0) return { txt: "same time as you", kind: "same" };
  const abs = Math.abs(d);
  const hrs = `${abs} hour${abs === 1 ? "" : "s"}`;
  return d > 0
    ? { txt: `${hrs} ahead of you`, kind: "ahead" }
    : { txt: `${hrs} behind you`, kind: "behind" };
}

/** Convert one wall-clock moment (in my offset) to a friend's wall-clock time. */
export function inFriendTime(when: number, friendOffset: number, myOffset: number): Date {
  return new Date(when + (friendOffset - myOffset) * 3600000);
}
