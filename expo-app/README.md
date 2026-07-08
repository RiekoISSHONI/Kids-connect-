# 📱 KidsConnect — Expo (React Native) app

The real cross-platform mobile version of the KidsConnect **companion** app for
iOS and Android, built with **Expo Router + TypeScript**. It keeps the kid-friendly
layer — friends, parental approvals, world map / time-zone learning, scheduling —
and **hands off the actual call to WhatsApp or FaceTime**.

> This is still a prototype: friends live **on-device** (AsyncStorage), presence is
> demoed, and there's no backend. See the roadmap in the repo root `README.md`.

## ▶️ Run it

```bash
cd expo-app
npm install
npx expo start          # then scan the QR code with the Expo Go app on your phone
```

- **On your phone:** install **Expo Go** (App Store / Play Store), scan the QR code.
- **iOS simulator / Android emulator:** press `i` or `a` in the terminal.
- **Browser preview:** `npx expo start --web` (camera recording is phone-only; the
  rest works on web).

If your installed Expo SDK differs, run `npx expo install --fix` to align versions.

## 🔑 Try the flow
1. **Parent** tab → enter PIN **`1234`**.
2. **Friends → Add a new friend** → enter a name, a real **WhatsApp number**
   (with country code, e.g. `+44 7700 900123`) and a city.
3. Approve them in the **Parent Zone**.
4. Tap **📹 Call** → choose **WhatsApp** or **FaceTime** — on a device it launches the real app.
5. **🎬 Video** records a clip with the camera and opens the share sheet to send it.

## 🧩 What's real vs. handed off
| In-app (this code) | Handed off |
|---|---|
| Friends, parental approval, PIN gate | The video **call** → WhatsApp / FaceTime deep links |
| World map + live local times | The video **message** → camera clip → share sheet / WhatsApp |
| Call scheduling (with approval) | — |

## 🗂️ Structure
```
app/
  _layout.tsx            Root: providers + stack
  (tabs)/_layout.tsx     Bottom tab navigator
  (tabs)/index.tsx       Home
  (tabs)/friends.tsx     Friends + add + video/call/plan
  (tabs)/world.tsx       World map + local times
  (tabs)/calls.tsx       Presence + scheduling
  (tabs)/parent.tsx      PIN-gated Parent Zone
src/
  store.tsx              State + AsyncStorage + mock data
  time.ts  links.ts      Time-difference + WhatsApp/FaceTime deep links
  ui.tsx  sheets.tsx     Reusable components + modals
  RecordSheet.tsx        Camera recorder (expo-camera) → share
  WorldMap.tsx           Simplified SVG world map with live pins
```

## 🛠️ Notes
- Camera recording uses `expo-camera`; permissions are declared in `app.json` and
  requested at runtime. Works in Expo Go and dev/production builds.
- Deep links: `https://wa.me/<number>` (WhatsApp) and `facetime://<number>` (FaceTime).
- `npm run typecheck` runs `tsc --noEmit`.
