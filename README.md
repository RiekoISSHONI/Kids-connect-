# 💜 KidsConnect

A **private, parent-supervised** mobile app prototype that lets kids stay close to
friends around the world — safely. This is a clickable front-end prototype you can
open in any browser (it looks and behaves like a phone app).

**KidsConnect is a "companion" app:** it keeps the kid-friendly parts — the friend
list, parental approvals, the world map / time-zone learning, and call scheduling —
and **hands off the actual video call to WhatsApp or FaceTime**. That means no video
infrastructure to build and far less data to hold, while the call itself runs on an
app parents already trust.

> ⚠️ **Prototype only.** Data is stored locally in your browser (`localStorage`).
> The recorder is simulated; the **Call** and **Send video** buttons open real
> WhatsApp/FaceTime deep links (these fire the actual apps on a phone). Built to
> *show the idea* and gather feedback.

## ▶️ How to run

No build step, no install. Either:

- **Double-click `index.html`**, or
- Serve the folder and open it (nicer on a phone):
  ```bash
  cd Kids-connect-
  python3 -m http.server 8000
  # then open http://localhost:8000 on your computer or phone
  ```

Open it on a phone for the full effect — the layout is a phone screen.

## ✨ Features

1. **🎬 Send video messages** — Kids record a short clip (simulated), then it hands off
   to the phone's **share sheet → WhatsApp** to send. Only to approved friends.
2. **🌍 World map with local time** — A world map shows where each friend is, with a
   live clock. Each friend card teaches the time difference ("3 hours ahead of you").
3. **📹 See who's online → video call** — Online friends show a green dot; tapping
   **Call** opens **WhatsApp or FaceTime** to that friend.
4. **📅 Schedule a video call** — Pick a friend, day and time (it even shows the
   friend's local time). The request goes to a grown-up to approve.

### 👋 Adding friends (on-device)
A grown-up adds a friend by entering their **name + WhatsApp number + city** in
**Friends → Add a new friend**. The number powers the WhatsApp/FaceTime deep links;
the city powers the world map & local time. Every new friend still needs **parent
approval** before any calling.

> Friend *codes* were removed in this companion version — they need a shared backend
> directory to resolve a code to a real account, which this no-server build doesn't
> have. They'd come back in a full backend version (see roadmap below).

### 🔒 Parent Zone
Tap the **Parent** tab and enter the demo PIN **`1234`**. Grown-ups can:
- Approve / decline **friend requests** (the friend's WhatsApp number is shown to verify)
- Approve / decline **scheduled calls**
- **Edit a friend's WhatsApp number** or remove anyone from the approved circle
- Review a **recent activity** log

## 🧩 Why a companion app (the "workaround")
Building real, global, encrypted video + the legal machinery for a children's social
network is a large undertaking (accounts, presence, WebRTC/TURN, content moderation,
COPPA/GDPR-K verifiable parental consent). By **delegating the call to WhatsApp or
FaceTime**, this version:
- needs **no video infrastructure** and no live-calling backend,
- holds **far less personal data** (friends can live only on the device),
- piggybacks on apps and contacts **parents already manage**.

The trade-off: presence ("who's online") and true cross-device sync aren't real
without a backend — they're demoed here. A full version would add those.

## ☁️ Deploy to Vercel

This is a static site (no build step), so Vercel hosts it with zero config.

1. Go to **https://vercel.com/new**
2. **Import** the `RiekoISSHONI/Kids-connect-` repository
3. Framework Preset: **Other** · Build Command: *(leave empty)* · Output Directory: *(leave empty / `.`)*
4. Click **Deploy**

You'll get a live URL like `https://kids-connect.vercel.app`. Every push to `main`
auto-deploys. The included `vercel.json` enables clean URLs and sane headers.

Prefer the CLI? `npm i -g vercel && vercel` from this folder, then `vercel --prod`.

## 🗂️ Project structure

| File         | Purpose                                                        |
|--------------|---------------------------------------------------------------|
| `index.html` | Phone frame, status bar, and bottom tab navigation            |
| `styles.css` | Kid-friendly visual design (colors, cards, phone chrome)      |
| `app.js`     | All app logic, mock data, screens, and the four features      |

## 🧭 Roadmap to a real app
Two paths, depending on how far you want to go:

**A) Stay a companion app (lightest).** Keep delegating calls to WhatsApp/FaceTime.
Next steps: ship as a real React Native (Expo) app, store friends on-device, polish
the deep links, add push reminders for scheduled calls. Minimal backend, minimal
compliance burden.

**B) Make it fully native (heaviest).** Real accounts + backend, live WebRTC video
via a provider (Daily/LiveKit/Twilio), real presence, content moderation, and
**verifiable parental consent** (COPPA/GDPR-K) with a privacy/legal review. This is
where friend codes, true presence, and cross-device sync come back.

A pragmatic first real step: build path **A** for your own family only (no public
sign-up), prove the flow end-to-end, then decide if path B is worth it.
