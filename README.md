# 💜 KidsConnect

A **private, parent-supervised** mobile app prototype that lets kids stay close to
friends around the world — safely. This is a clickable front-end prototype you can
open in any browser (it looks and behaves like a phone app).

> ⚠️ **Prototype only.** No real network, camera, accounts, or video. Everything is
> mock data stored locally in your browser (`localStorage`) so the demo remembers
> your actions. It's built to *show the idea* and gather feedback.

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

1. **🎬 Send video messages** — Kids record a short video (simulated) and send it to a
   friend. Videos can **only** go to friends a grown-up has approved.
2. **🌍 World map with local time** — A world map shows where each friend is, with a
   live clock. Each friend card teaches the time difference ("3 hours ahead of you").
3. **📹 See who's online → video call** — Online friends show a green dot so kids know
   who they can call right now.
4. **📅 Schedule a video call** — Pick a friend, day and time (it even shows the
   friend's local time). The request goes to a grown-up to approve.

### 🔑 Adding friends by code
Every kid has their **own unique friend code** (e.g. `FOX-2468`). To connect, a kid
shares their code and types a friend's code — there's no public list to browse. A
grown-up **still has to approve** every new connection. Try demo codes like
`CAT-1357`, `MON-9081`, or `FLY-4422` in **Friends → Add a new friend**.

### 🔒 Parent Zone
Tap the **Parent** tab and enter the demo PIN **`1234`**. Grown-ups can:
- Approve / decline **friend requests**
- Approve / decline **scheduled calls**
- See the **approved circle** and remove anyone
- Review a **recent activity** log

## 🗂️ Project structure

| File         | Purpose                                                        |
|--------------|---------------------------------------------------------------|
| `index.html` | Phone frame, status bar, and bottom tab navigation            |
| `styles.css` | Kid-friendly visual design (colors, cards, phone chrome)      |
| `app.js`     | All app logic, mock data, screens, and the four features      |

## 🧭 Notes for turning this into a real app
This prototype deliberately fakes the hard parts. A production version would need:
- Real auth + a backend for friend codes, presence, and message delivery
- Real video (recording + WebRTC for live calls) with encryption
- Server-enforced parental controls (approvals can't be bypassed client-side)
- Privacy & safety review (COPPA/GDPR-K), reporting/blocking, content moderation
- Push notifications and offline handling
