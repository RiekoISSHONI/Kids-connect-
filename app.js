/* ============================================================
   KidsConnect — a private, parent-supervised mobile app prototype
   ------------------------------------------------------------
   This is a front-end-only prototype. All data is mock data kept
   in localStorage so the demo "remembers" your actions. There is
   no real network, camera, or video — the recorder and calls are
   simulated so the experience can be explored safely in a browser.

   Four core features (see README):
     1. Send video messages to connected friends   (connection needs parent approval)
     2. World map with local time                   (learn time differences)
     3. See who's online                            (then video call)
     4. Schedule a video call                       (needs parent approval)
   ============================================================ */

const PARENT_PIN = "1234"; // demo PIN for the Parent Zone

/* ---------- Default / seed data ---------- */
function seedState() {
  return {
    me: {
      name: "You",
      avatar: "🦊",
      flag: "🇺🇸",
      city: "San Francisco",
      offset: -7,          // UTC offset in hours (PDT in June)
      lon: -122.4, lat: 37.8,
    },
    // status: "approved" = parent-approved connection, "pending" = waiting on parent
    // phone = the friend's WhatsApp number (E.164), used to launch WhatsApp/FaceTime
    friends: [
      { id: "mia",   name: "Mia",   avatar: "🐰", flag: "🇯🇵", city: "Tokyo",     offset: 9,  lon: 139.7, lat: 35.7, online: true,  status: "approved", phone: "+81 90 1234 5678" },
      { id: "leo",   name: "Leo",   avatar: "🦁", flag: "🇬🇧", city: "London",    offset: 1,  lon: -0.1,  lat: 51.5, online: true,  status: "approved", phone: "+44 7700 900123" },
      { id: "aria",  name: "Aria",  avatar: "🐨", flag: "🇺🇸", city: "New York",  offset: -4, lon: -74.0, lat: 40.7, online: false, status: "approved", phone: "+1 212 555 0142" },
      { id: "kai",   name: "Kai",   avatar: "🐯", flag: "🇦🇺", city: "Sydney",    offset: 10, lon: 151.2, lat: -33.9, online: false, status: "approved", phone: "" },
      { id: "sofia", name: "Sofia", avatar: "🦄", flag: "🇧🇷", city: "São Paulo", offset: -3, lon: -46.6, lat: -23.5, online: true,  status: "approved", phone: "+55 11 91234 5678" },
      // A connection request already waiting for a grown-up to approve:
      { id: "emma",  name: "Emma",  avatar: "🐼", flag: "🇮🇳", city: "Mumbai",    offset: 5.5, lon: 72.8, lat: 19.0, online: true, status: "pending", phone: "+91 98765 43210" },
    ],
    // recorded video messages are sent THROUGH WhatsApp, so we just keep a small history
    videos: [],
    // scheduled video calls; status: pending | approved | declined
    calls: [
      { id: vid(), friend: "mia", when: nextSat(16), status: "approved" },
    ],
    log: [], // parent activity log
  };
}

function vid() { return Math.random().toString(36).slice(2, 9); }
function nextSat(hour) {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/* ---------- Persistence ---------- */
const STORE_KEY = "kidsconnect.v1";
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return seedState();
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function resetDemo() { localStorage.removeItem(STORE_KEY); state = seedState(); save(); render(); toast("Demo reset 🔄"); }

/* ---------- App nav state ---------- */
let activeTab = "home";
let parentUnlocked = false;

/* ---------- Helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const friendsApproved = () => state.friends.filter(f => f.status === "approved");
const friendById = (id) => state.friends.find(f => f.id === id);
const pendingFriends = () => state.friends.filter(f => f.status === "pending");
const pendingCalls = () => state.calls.filter(c => c.status === "pending");
const approvalCount = () => pendingFriends().length + pendingCalls().length;

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* time at a UTC offset, returns Date in that local wall-clock */
function localAt(offset) {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + offset * 3600000);
}
function fmtTime(d) {
  let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
function fmtDay(d) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function diffText(offset) {
  const d = offset - state.me.offset;
  if (d === 0) return { txt: "same time as you", cls: "diff--same" };
  const abs = Math.abs(d);
  const hrs = Number.isInteger(abs) ? `${abs} hour${abs === 1 ? "" : "s"}` : `${abs} hours`;
  return d > 0
    ? { txt: `${hrs} ahead of you`, cls: "diff--ahead" }
    : { txt: `${hrs} behind you`, cls: "diff--behind" };
}
function fmtWhen(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    + " · " + fmtTime(d);
}

/* ---------- Deep links: hand off to WhatsApp / FaceTime ---------- */
function phoneDigits(p) { return String(p || "").replace(/[^\d]/g, ""); }
function hasPhone(f) { return phoneDigits(f && f.phone).length >= 6; }
function waLink(f, text) {
  const d = phoneDigits(f.phone);
  return `https://wa.me/${d}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}
function ftLink(f) { return `facetime://${phoneDigits(f.phone)}`; }
function openExternal(url) {
  // open in a new tab so the prototype stays put; on a phone this fires the app
  window.open(url, "_blank");
}

/* ---------- Render router ---------- */
function render() {
  const app = $("#app");
  app.scrollTop = app.scrollTop; // keep
  const views = { home: viewHome, friends: viewFriends, world: viewWorld, calls: viewCalls, parent: viewParent };
  app.innerHTML = (views[activeTab] || viewHome)();
  renderTabs();
  bindScreen();
  startClocks();
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach(t => {
    const isActive = t.dataset.tab === activeTab;
    t.classList.toggle("tab--active", isActive);
    // approval badge on parent tab
    if (t.dataset.tab === "parent") {
      const n = approvalCount();
      let b = t.querySelector(".badge-count");
      if (n > 0) {
        if (!b) { b = document.createElement("span"); b.className = "badge-count"; t.appendChild(b); }
        b.textContent = n;
      } else if (b) { b.remove(); }
    }
  });
}

/* ============================================================
   SCREENS
   ============================================================ */

function viewHome() {
  const online = friendsApproved().filter(f => f.online);
  const waiting = approvalCount();
  return `
    <div class="row" style="margin:8px 2px 14px">
      <div class="brand"><span class="brand__logo">💜</span> KidsConnect</div>
    </div>

    <div class="hero">
      <h2>Hi ${esc(state.me.name)} ${state.me.avatar}</h2>
      <p>${online.length} friend${online.length === 1 ? "" : "s"} online now • ${friendsApproved().length} connected</p>
    </div>

    <div class="card row" style="background:#eafff6">
      <div class="avatar">💬</div>
      <div><div class="name">Calls happen in WhatsApp / FaceTime</div>
      <div class="note">KidsConnect keeps your friends, times & plans organised — tap Call to open the real app.</div></div>
    </div>

    ${waiting ? `<div class="card row" style="border-left:5px solid var(--sun)">
        <div class="avatar">⏳</div>
        <div><div class="name">Waiting for a grown-up</div>
        <div class="sub">${waiting} thing${waiting === 1 ? "" : "s"} need${waiting === 1 ? "s" : ""} parent approval</div></div>
      </div>` : ""}

    <div class="section-title">What do you want to do?</div>
    <div class="quick">
      <button class="quick__btn" data-act="record">
        <span class="em">🎬</span><span class="lbl">Send a video</span>
        <div class="desc">Share via WhatsApp</div>
      </button>
      <button class="quick__btn" data-go="world">
        <span class="em">🌍</span><span class="lbl">World map</span>
        <div class="desc">See their local time</div>
      </button>
      <button class="quick__btn" data-go="calls">
        <span class="em">📹</span><span class="lbl">Video call</span>
        <div class="desc">Open WhatsApp / FaceTime</div>
      </button>
      <button class="quick__btn" data-act="schedule">
        <span class="em">📅</span><span class="lbl">Plan a call</span>
        <div class="desc">Pick a day & time</div>
      </button>
    </div>

    <div class="section-title">Online right now</div>
    ${online.length ? online.map(friendRowOnline).join("") :
      `<div class="empty"><span class="big">😴</span>No friends online yet — check the World map to see when they wake up!</div>`}
  `;
}

function friendRowOnline(f) {
  const t = fmtTime(localAt(f.offset));
  return `<div class="card row">
    <div class="avatar">${f.avatar}<span class="dot dot--on"></span></div>
    <div><div class="name">${esc(f.name)} ${f.flag}</div><div class="sub">${esc(f.city)} • ${t}</div></div>
    <div class="spacer"></div>
    <button class="btn btn--mint btn--sm" data-call="${f.id}">📹 Call</button>
  </div>`;
}

/* ---------- Friends + video messages ---------- */
function viewFriends() {
  const approved = friendsApproved();
  const pend = pendingFriends();
  return `
    <div class="screen-head"><h1>Friends</h1><p>You can only call friends a grown-up approved 💜</p></div>

    <button class="btn btn--block btn--pink" data-act="addfriend">＋ Add a new friend</button>

    ${pend.length ? `<div class="section-title">Waiting for grown-up</div>
      ${pend.map(f => `<div class="card row">
        <div class="avatar">${f.avatar}</div>
        <div><div class="name">${esc(f.name)} ${f.flag}</div><div class="sub">${esc(f.city)}</div></div>
        <div class="spacer"></div><span class="pill pill--wait">⏳ Pending</span>
      </div>`).join("")}` : ""}

    <div class="section-title">My connected friends (${approved.length})</div>
    ${approved.length ? approved.map(f => {
      const t = fmtTime(localAt(f.offset));
      return `<div class="card">
        <div class="row">
          <div class="avatar avatar--lg">${f.avatar}<span class="dot ${f.online ? "dot--on" : ""}"></span></div>
          <div>
            <div class="name">${esc(f.name)} ${f.flag}</div>
            <div class="sub">${esc(f.city)} • ${t} ${f.online ? "• online" : "• offline"}</div>
            ${hasPhone(f) ? `<div class="note">💬 ${esc(f.phone)}</div>` : `<div class="note" style="color:var(--red)">⚠️ No WhatsApp number — ask a grown-up to add it</div>`}
          </div>
        </div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn btn--sm" data-record="${f.id}">🎬 Video</button>
          <button class="btn btn--sm btn--mint" data-call="${f.id}">📹 Call</button>
          <button class="btn btn--sm btn--ghost" data-schedulewith="${f.id}">📅 Plan</button>
        </div>
      </div>`;
    }).join("") : `<div class="empty"><span class="big">👋</span>No friends yet — add one above!</div>`}
  `;
}

/* ---------- World map ---------- */
function viewWorld() {
  return `
    <div class="screen-head"><h1>World map 🌍</h1><p>See where your friends are and what time it is for them</p></div>
    <div class="map" id="worldMap">${worldSVG()}${mapPins()}</div>
    <div class="note" style="margin:6px 2px 12px">🟡 = you · tap a friend below to learn the time difference</div>
    ${[ {...state.me, id: "me", name: "You (" + state.me.name + ")"}, ...friendsApproved() ].map(clockCard).join("")}
  `;
}

function clockCard(f) {
  const d = localAt(f.offset);
  const isMe = f.id === "me";
  const diff = isMe ? { txt: "this is your time", cls: "diff--same" } : diffText(f.offset);
  return `<div class="card clockrow">
    <div class="row">
      <div class="avatar">${f.avatar}</div>
      <div>
        <div class="name">${esc(f.name)} ${f.flag}</div>
        <div class="sub">${esc(f.city)} • ${fmtDay(d)}</div>
      </div>
      <div class="spacer"></div>
      <div style="text-align:right">
        <div class="time" data-clock="${f.offset}">${fmtTime(d)}</div>
        <div class="diff ${diff.cls}">${diff.txt}</div>
      </div>
    </div>
  </div>`;
}

/* project lon/lat -> percentage inside the map box (equirectangular) */
function project(lon, lat) {
  return { x: (lon + 180) / 360 * 100, y: (90 - lat) / 180 * 100 };
}
function mapPins() {
  const pins = [{ ...state.me, id: "me", me: true }, ...friendsApproved()];
  return pins.map(f => {
    const p = project(f.lon, f.lat);
    const t = fmtTime(localAt(f.offset));
    return `<div class="map__pin ${f.me ? "me" : ""}" style="left:${p.x}%;top:${p.y}%">
      <div class="flag">${f.me ? "🟡" : f.flag}</div>
      <div class="ttime">${t}</div>
    </div>`;
  }).join("");
}

/* a friendly, simplified world map drawn from rough continent outlines */
function worldSVG() {
  const continents = {
    NA: [[-168,65],[-150,71],[-95,72],[-62,70],[-52,47],[-66,46],[-80,25],[-98,18],[-110,23],[-125,40],[-140,60]],
    SA: [[-80,9],[-60,11],[-35,-5],[-40,-23],[-58,-40],[-72,-53],[-75,-30],[-81,-4]],
    EU: [[-10,36],[-6,44],[4,60],[28,70],[42,60],[40,45],[28,40],[10,38]],
    AF: [[-17,33],[11,37],[33,32],[43,12],[40,-12],[25,-34],[18,-34],[8,4],[-17,15]],
    AS: [[40,45],[60,68],[100,73],[145,66],[170,66],[150,45],[122,32],[105,16],[95,8],[78,8],[60,25],[45,40]],
    OC: [[113,-12],[131,-11],[145,-12],[153,-25],[148,-39],[130,-32],[115,-22]],
  };
  const toPt = ([lon, lat]) => `${(lon + 180) / 360 * 1000},${(90 - lat) / 180 * 500}`;
  const polys = Object.values(continents)
    .map(pts => `<polygon points="${pts.map(toPt).join(" ")}" fill="#7bd88f" stroke="#5cc174" stroke-width="2" stroke-linejoin="round"/>`)
    .join("");
  return `<svg viewBox="0 0 1000 500" preserveAspectRatio="none">${polys}</svg>`;
}

/* ---------- Calls: presence + scheduling ---------- */
function viewCalls() {
  const online = friendsApproved().filter(f => f.online);
  const offline = friendsApproved().filter(f => !f.online);
  const upcoming = state.calls.slice().sort((a, b) => a.when - b.when);
  return `
    <div class="screen-head"><h1>Video calls 📹</h1><p>Call online friends now, or plan one for later</p></div>

    <div class="section-title">Online now — call right away</div>
    ${online.length ? online.map(f => `<div class="card row">
        <div class="avatar">${f.avatar}<span class="dot dot--on"></span></div>
        <div><div class="name">${esc(f.name)} ${f.flag}</div><div class="sub">${esc(f.city)} • ${fmtTime(localAt(f.offset))}</div></div>
        <div class="spacer"></div>
        <button class="btn btn--green btn--sm" data-call="${f.id}">📹 Call</button>
      </div>`).join("") : `<div class="empty"><span class="big">🌙</span>Nobody's online — plan a call instead!</div>`}

    ${offline.length ? `<div class="section-title">Offline</div>
      ${offline.map(f => `<div class="card row">
        <div class="avatar">${f.avatar}<span class="dot"></span></div>
        <div><div class="name">${esc(f.name)} ${f.flag}</div><div class="sub">${esc(f.city)} • ${fmtTime(localAt(f.offset))} (asleep?)</div></div>
        <div class="spacer"></div>
        <button class="btn btn--ghost btn--sm" data-schedulewith="${f.id}">📅 Plan</button>
      </div>`).join("")}` : ""}

    <div class="section-title">Planned calls</div>
    <button class="btn btn--block btn--pink" data-act="schedule" style="margin-bottom:12px">＋ Schedule a video call</button>
    ${upcoming.length ? upcoming.map(c => {
      const f = friendById(c.friend);
      const pill = c.status === "approved" ? '<span class="pill pill--ok">✅ Approved</span>'
        : c.status === "declined" ? '<span class="pill pill--no">✋ Not now</span>'
        : '<span class="pill pill--wait">⏳ Waiting for grown-up</span>';
      const theirTime = f ? fmtTime(new Date(new Date(c.when).getTime() + (f.offset - state.me.offset) * 3600000)) : "";
      return `<div class="card">
        <div class="row">
          <div class="avatar">${f ? f.avatar : "📅"}</div>
          <div><div class="name">${f ? esc(f.name) : "Friend"} ${f ? f.flag : ""}</div>
          <div class="sub">${fmtWhen(c.when)}</div></div>
          <div class="spacer"></div>${pill}
        </div>
        ${f ? `<div class="note" style="margin-top:8px">🕐 That's ${theirTime} for ${esc(f.name)} in ${esc(f.city)}</div>` : ""}
        ${c.status === "approved" ? `<button class="btn btn--green btn--sm btn--block" style="margin-top:10px" data-call="${c.friend}">Join call now</button>` : ""}
      </div>`;
    }).join("") : `<div class="empty"><span class="big">🗓️</span>No calls planned yet</div>`}
  `;
}

/* ---------- Parent Zone ---------- */
function viewParent() {
  if (!parentUnlocked) {
    return `<div class="screen-head"><h1>Parent Zone 🔒</h1><p>This area is for grown-ups</p></div>
      <div class="card" style="text-align:center">
        <div class="avatar avatar--lg" style="margin:0 auto 8px">🔒</div>
        <div class="name">Enter parent PIN</div>
        <div class="note" style="margin:6px 0 4px">Demo PIN is <b>1234</b></div>
        <div class="pindots" id="pindots"><i></i><i></i><i></i><i></i></div>
        <div class="pinpad" id="pinpad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button data-pin="${n}">${n}</button>`).join("")}
          <button data-pin="clear">⌫</button><button data-pin="0">0</button><button data-pin="ok">OK</button>
        </div>
      </div>`;
  }
  const pf = pendingFriends(), pc = pendingCalls();
  return `
    <div class="screen-head"><h1>Parent Zone 👋</h1><p>Approve connections & calls, manage your child's circle</p></div>

    <div class="card row">
      <div class="avatar">🛡️</div>
      <div><div class="name">${approvalCount()} item${approvalCount() === 1 ? "" : "s"} need approval</div>
      <div class="note">Nothing happens without your OK</div></div>
      <div class="spacer"></div><button class="btn btn--ghost btn--sm" data-act="lock">Lock</button>
    </div>

    <div class="section-title">Friend requests</div>
    ${pf.length ? pf.map(f => `<div class="card approve-item">
      <div class="row">
        <div class="avatar avatar--lg">${f.avatar}</div>
        <div><div class="name">${esc(f.name)} ${f.flag}</div><div class="sub">${esc(f.city)}</div>
        <div class="note">💬 ${esc(f.phone || "no number")} — wants to connect with your child</div></div>
      </div>
      <div class="row" style="margin-top:12px;gap:8px">
        <button class="btn btn--green btn--sm" data-approvefriend="${f.id}">✅ Approve</button>
        <button class="btn btn--ghost btn--sm" data-declinefriend="${f.id}">Decline</button>
      </div>
    </div>`).join("") : `<div class="empty">No pending friend requests</div>`}

    <div class="section-title">Call requests</div>
    ${pc.length ? pc.map(c => {
      const f = friendById(c.friend);
      return `<div class="card approve-item">
        <div class="row">
          <div class="avatar avatar--lg">${f ? f.avatar : "📅"}</div>
          <div><div class="name">Call with ${f ? esc(f.name) : "friend"} ${f ? f.flag : ""}</div>
          <div class="sub">${fmtWhen(c.when)}</div></div>
        </div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn btn--green btn--sm" data-approvecall="${c.id}">✅ Approve</button>
          <button class="btn btn--ghost btn--sm" data-declinecall="${c.id}">Decline</button>
        </div>
      </div>`;
    }).join("") : `<div class="empty">No pending call requests</div>`}

    <div class="section-title">Approved circle (${friendsApproved().length})</div>
    ${friendsApproved().map(f => `<div class="card">
      <div class="row">
        <div class="avatar">${f.avatar}</div>
        <div><div class="name">${esc(f.name)} ${f.flag}</div>
        <div class="sub">${esc(f.city)}</div>
        <div class="note">${hasPhone(f) ? "💬 " + esc(f.phone) : '<span style="color:var(--red)">⚠️ no WhatsApp number</span>'}</div></div>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        <button class="btn btn--ghost btn--sm" data-editphone="${f.id}">✏️ Edit number</button>
        <button class="btn btn--ghost btn--sm" data-removefriend="${f.id}">Remove</button>
      </div>
    </div>`).join("")}

    <div class="section-title">Recent activity</div>
    ${state.log.length ? state.log.slice(-8).reverse().map(l =>
      `<div class="card row" style="padding:12px"><div class="avatar" style="width:34px;height:34px;font-size:16px">📝</div>
      <div><div class="sub" style="color:var(--ink);font-weight:800">${esc(l.text)}</div>
      <div class="note">${fmtWhen(l.when)}</div></div></div>`).join("")
      : `<div class="empty">No activity yet</div>`}

    <button class="btn btn--block btn--ghost" style="margin-top:14px" data-act="reset">Reset demo data</button>
    <div style="height:10px"></div>
  `;
}

/* ============================================================
   Interactions
   ============================================================ */
function bindScreen() {
  const app = $("#app");

  app.querySelectorAll("[data-go]").forEach(el => el.onclick = () => switchTab(el.dataset.go));
  app.querySelectorAll("[data-call]").forEach(el => el.onclick = () => startCall(el.dataset.call));
  app.querySelectorAll("[data-record]").forEach(el => el.onclick = () => openRecorder(el.dataset.record));
  app.querySelectorAll("[data-schedulewith]").forEach(el => el.onclick = () => openSchedule(el.dataset.schedulewith));

  app.querySelectorAll("[data-act]").forEach(el => el.onclick = () => {
    const a = el.dataset.act;
    if (a === "record") openRecorder();
    else if (a === "schedule") openSchedule();
    else if (a === "addfriend") openAddFriend();
    else if (a === "lock") { parentUnlocked = false; render(); }
    else if (a === "reset") resetDemo();
  });

  // parent approvals
  app.querySelectorAll("[data-approvefriend]").forEach(el => el.onclick = () => approveFriend(el.dataset.approvefriend));
  app.querySelectorAll("[data-declinefriend]").forEach(el => el.onclick = () => declineFriend(el.dataset.declinefriend));
  app.querySelectorAll("[data-removefriend]").forEach(el => el.onclick = () => removeFriend(el.dataset.removefriend));
  app.querySelectorAll("[data-editphone]").forEach(el => el.onclick = () => editPhone(el.dataset.editphone));
  app.querySelectorAll("[data-approvecall]").forEach(el => el.onclick = () => approveCall(el.dataset.approvecall));
  app.querySelectorAll("[data-declinecall]").forEach(el => el.onclick = () => declineCall(el.dataset.declinecall));

  // PIN pad
  bindPinPad();
}

/* ---------- PIN ---------- */
let pinBuffer = "";
function bindPinPad() {
  const pad = $("#pinpad"); if (!pad) return;
  pinBuffer = "";
  pad.querySelectorAll("[data-pin]").forEach(b => b.onclick = () => {
    const k = b.dataset.pin;
    if (k === "clear") pinBuffer = pinBuffer.slice(0, -1);
    else if (k === "ok") { checkPin(); return; }
    else if (pinBuffer.length < 4) pinBuffer += k;
    updatePinDots();
    if (pinBuffer.length === 4) checkPin();
  });
}
function updatePinDots() {
  const dots = $("#pindots"); if (!dots) return;
  dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("full", i < pinBuffer.length));
}
function checkPin() {
  if (pinBuffer === PARENT_PIN) { parentUnlocked = true; toast("Welcome, grown-up 👋"); render(); }
  else { toast("Wrong PIN — try 1234"); pinBuffer = ""; updatePinDots(); }
}

/* ---------- Tab switching ---------- */
function switchTab(tab) {
  activeTab = tab;
  if (tab !== "parent") {} // parent stays locked until PIN
  render();
}

/* ============================================================
   Feature actions
   ============================================================ */

/* 1. Record & send a video message (only to approved friends) */
function openRecorder(friendId) {
  const approved = friendsApproved();
  if (!approved.length) { toast("Ask a grown-up to approve a friend first 💜"); return; }
  let target = friendId || approved[0].id;
  let recording = false, seconds = 0, timer = null;

  openSheet(`
    <h2>Send a video 🎬</h2>
    <div class="note">Videos only go to friends a grown-up approved.</div>
    <div class="recorder" id="rec">
      <div class="selfie">${state.me.avatar}</div>
      <div class="rec-dot" id="recDot" style="display:none"><i></i> REC</div>
      <div class="timer" id="recTimer" style="display:none">0:00</div>
    </div>
    <div class="field">
      <label>Send to</label>
      <div class="chips" id="recChips">
        ${approved.map(f => `<button class="chip ${f.id === target ? "chip--sel" : ""}" data-pick="${f.id}">${f.avatar} ${esc(f.name)}</button>`).join("")}
      </div>
    </div>
    <div class="field">
      <label>Add a message (optional)</label>
      <input id="recCaption" placeholder="Say something fun!" maxlength="80" />
    </div>
    <button class="btn btn--block" id="recToggle">● Start recording</button>
    <button class="btn btn--block btn--green" id="recSend" style="margin-top:8px;display:none">Send in WhatsApp 💬</button>
    <div class="note" style="margin-top:10px">Your video opens in WhatsApp so you can send it to your friend.</div>
  `);

  const sheet = $(".sheet");
  sheet.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    target = b.dataset.pick;
    sheet.querySelectorAll(".chip").forEach(c => c.classList.toggle("chip--sel", c === b));
  });

  const toggle = $("#recToggle"), dot = $("#recDot"), tEl = $("#recTimer"), sendBtn = $("#recSend");
  toggle.onclick = () => {
    if (!recording) {
      recording = true; seconds = 0;
      dot.style.display = "flex"; tEl.style.display = "block";
      toggle.textContent = "■ Stop recording"; toggle.classList.add("btn--pink");
      timer = setInterval(() => {
        seconds++; tEl.textContent = `0:${String(seconds).padStart(2, "0")}`;
        if (seconds >= 15) toggle.onclick(); // auto-stop at 15s
      }, 1000);
    } else {
      recording = false; clearInterval(timer);
      dot.style.display = "none";
      toggle.textContent = "↺ Record again"; toggle.classList.remove("btn--pink");
      sendBtn.style.display = "block";
    }
  };
  sendBtn.onclick = () => {
    const f = friendById(target);
    const cap = $("#recCaption").value.trim() || `Hi ${f.name}! Here's a video for you 🎬`;
    addLog(`${state.me.name} shared a video to ${f.name} via WhatsApp`);
    save();
    // Hand off to the phone's share sheet (lets them attach the clip + pick WhatsApp);
    // fall back to opening the WhatsApp chat with the caption prefilled.
    if (navigator.share) {
      navigator.share({ title: "KidsConnect video", text: cap }).catch(() => {});
    } else if (hasPhone(f)) {
      openExternal(waLink(f, cap));
    } else {
      toast("Ask a grown-up to add a WhatsApp number");
      return;
    }
    closeSheet();
    toast(`Opening WhatsApp to send to ${f.name} 💬`);
  };
}

/* 2 & 3 handled in views (world map / presence) */

/* Launch a real video call by handing off to WhatsApp or FaceTime.
   (KidsConnect never carries the video itself — it just opens the trusted app.) */
function startCall(friendId) {
  const f = friendById(friendId); if (!f) return;
  if (f.status !== "approved") { toast("This friend isn't approved yet"); return; }
  if (!hasPhone(f)) {
    openSheet(`
      <h2>No number yet 📵</h2>
      <div class="note">A grown-up needs to add ${esc(f.name)}'s WhatsApp number before you can call.</div>
      <button class="btn btn--block btn--ghost" id="closeNoNum" style="margin-top:14px">OK</button>
    `);
    $("#closeNoNum").onclick = closeSheet;
    return;
  }
  const t = fmtTime(localAt(f.offset));
  openSheet(`
    <h2>Call ${esc(f.name)} ${f.flag}</h2>
    <div class="note">It's ${t} for ${esc(f.name)} in ${esc(f.city)} — ${diffText(f.offset).txt}. Pick an app to call in:</div>
    <button class="btn btn--block btn--green" id="callWa" style="margin-top:14px">💬 Open WhatsApp</button>
    <button class="btn btn--block btn--mint" id="callFt" style="margin-top:8px">🍏 FaceTime (Apple)</button>
    <button class="btn btn--block btn--ghost" id="callCancel" style="margin-top:8px">Cancel</button>
    <div class="note" style="margin-top:10px">On a phone these open the real app. WhatsApp opens the chat — tap its 📹 to start the video call.</div>
  `);
  $("#callWa").onclick = () => { addLog(`${state.me.name} opened WhatsApp to call ${f.name}`); save(); openExternal(waLink(f)); closeSheet(); toast("Opening WhatsApp 💬"); };
  $("#callFt").onclick = () => { addLog(`${state.me.name} opened FaceTime to call ${f.name}`); save(); openExternal(ftLink(f)); closeSheet(); toast("Opening FaceTime 🍏"); };
  $("#callCancel").onclick = closeSheet;
}

/* 4. Schedule a call -> needs parent approval */
function openSchedule(friendId) {
  const approved = friendsApproved();
  if (!approved.length) { toast("Ask a grown-up to approve a friend first 💜"); return; }
  let target = friendId || approved[0].id;
  // default to tomorrow 4pm
  const def = new Date(); def.setDate(def.getDate() + 1); def.setHours(16, 0, 0, 0);
  const defVal = new Date(def.getTime() - def.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  openSheet(`
    <h2>Schedule a call 📅</h2>
    <div class="note">A grown-up will get a request to approve it.</div>
    <div class="field">
      <label>With which friend?</label>
      <div class="chips" id="schChips">
        ${approved.map(f => `<button class="chip ${f.id === target ? "chip--sel" : ""}" data-pick="${f.id}">${f.avatar} ${esc(f.name)}</button>`).join("")}
      </div>
    </div>
    <div class="field">
      <label>When? (your time)</label>
      <input type="datetime-local" id="schWhen" value="${defVal}" />
    </div>
    <div class="note" id="schHint"></div>
    <button class="btn btn--block btn--pink" id="schSend" style="margin-top:14px">Ask a grown-up ✅</button>
  `);

  const sheet = $(".sheet");
  const hint = $("#schHint");
  function updateHint() {
    const f = friendById(target);
    const val = $("#schWhen").value;
    if (f && val) {
      const local = new Date(val);
      const theirs = new Date(local.getTime() + (f.offset - state.me.offset) * 3600000);
      hint.textContent = `🕐 That will be ${fmtTime(theirs)} for ${f.name} in ${f.city}.`;
    }
  }
  sheet.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    target = b.dataset.pick;
    sheet.querySelectorAll(".chip").forEach(c => c.classList.toggle("chip--sel", c === b));
    updateHint();
  });
  $("#schWhen").onchange = updateHint;
  updateHint();

  $("#schSend").onclick = () => {
    const val = $("#schWhen").value;
    if (!val) { toast("Pick a day and time"); return; }
    state.calls.push({ id: vid(), friend: target, when: new Date(val).getTime(), status: "pending" });
    addLog(`${state.me.name} requested a call with ${friendById(target).name}`);
    save(); closeSheet();
    toast("Sent to a grown-up for approval ⏳");
    if (activeTab === "calls" || activeTab === "home") render();
  };
}

/* Add friend -> creates a pending request for parent approval */
/* City presets so the world map + time difference work for a new friend */
const CITIES = [
  { city: "Tokyo",       flag: "🇯🇵", offset: 9,    lon: 139.7, lat: 35.7 },
  { city: "London",      flag: "🇬🇧", offset: 1,    lon: -0.1,  lat: 51.5 },
  { city: "New York",    flag: "🇺🇸", offset: -4,   lon: -74.0, lat: 40.7 },
  { city: "Los Angeles", flag: "🇺🇸", offset: -7,   lon: -118.2, lat: 34.1 },
  { city: "Toronto",     flag: "🇨🇦", offset: -4,   lon: -79.4, lat: 43.7 },
  { city: "São Paulo",   flag: "🇧🇷", offset: -3,   lon: -46.6, lat: -23.5 },
  { city: "Dublin",      flag: "🇮🇪", offset: 1,    lon: -6.3,  lat: 53.3 },
  { city: "Paris",       flag: "🇫🇷", offset: 2,    lon: 2.4,   lat: 48.9 },
  { city: "Berlin",      flag: "🇩🇪", offset: 2,    lon: 13.4,  lat: 52.5 },
  { city: "Dubai",       flag: "🇦🇪", offset: 4,    lon: 55.3,  lat: 25.2 },
  { city: "Mumbai",      flag: "🇮🇳", offset: 5.5,  lon: 72.8,  lat: 19.0 },
  { city: "Singapore",   flag: "🇸🇬", offset: 8,    lon: 103.8, lat: 1.35 },
  { city: "Sydney",      flag: "🇦🇺", offset: 10,   lon: 151.2, lat: -33.9 },
  { city: "Auckland",    flag: "🇳🇿", offset: 12,   lon: 174.8, lat: -36.8 },
  { city: "Cape Town",   flag: "🇿🇦", offset: 2,    lon: 18.4,  lat: -33.9 },
];
const AVATARS = ["🐰","🦁","🐨","🐯","🦄","🐼","🐱","🐵","🦋","🐧","🐢","🦊","🐶","🐸","🐙","🦉"];

function openAddFriend() {
  openSheet(`
    <h2>Add a friend 👋</h2>
    <div class="note">A grown-up enters your friend's details. They still have to approve before you can call.</div>
    <div class="field">
      <label>Friend's name</label>
      <input id="afName" placeholder="e.g. Mia" maxlength="20" autocomplete="off" />
    </div>
    <div class="field">
      <label>WhatsApp number (with country code)</label>
      <input id="afPhone" type="tel" placeholder="e.g. +44 7700 900123" autocomplete="off" />
    </div>
    <div class="field">
      <label>City (for the world map & local time)</label>
      <select id="afCity">${CITIES.map((c, i) => `<option value="${i}">${c.flag} ${c.city}</option>`).join("")}</select>
    </div>
    <div class="field">
      <label>Pick an animal</label>
      <div class="chips" id="afAvatars">
        ${AVATARS.slice(0, 8).map((a, i) => `<button class="chip ${i === 0 ? "chip--sel" : ""}" data-av="${a}">${a}</button>`).join("")}
      </div>
    </div>
    <button class="btn btn--block btn--pink" id="afAdd">Ask a grown-up to add ✅</button>
  `);

  let avatar = AVATARS[0];
  const sheet = $(".sheet");
  sheet.querySelectorAll("[data-av]").forEach(b => b.onclick = () => {
    avatar = b.dataset.av;
    sheet.querySelectorAll(".chip").forEach(c => c.classList.toggle("chip--sel", c === b));
  });

  $("#afAdd").onclick = () => {
    const name = $("#afName").value.trim();
    const phone = $("#afPhone").value.trim();
    if (!name) { toast("Type a name"); return; }
    if (!hasPhone({ phone })) { toast("Enter a valid WhatsApp number"); return; }
    if (state.friends.some(x => x.name.toLowerCase() === name.toLowerCase())) { toast(`Already added ${name}`); return; }
    const c = CITIES[parseInt($("#afCity").value, 10)] || CITIES[0];
    state.friends.push({ id: vid(), name, avatar, phone, ...c, online: false, status: "pending" });
    addLog(`${state.me.name} asked to add ${name} (${phone})`);
    save(); closeSheet();
    toast("Request sent to a grown-up ⏳");
    render();
  };
}

/* ---------- Parent approval actions ---------- */
function approveFriend(id) {
  const f = friendById(id); if (!f) return;
  f.status = "approved"; addLog(`Parent approved friend: ${f.name}`); save(); render(); toast(`${f.name} approved ✅`);
}
function declineFriend(id) {
  const f = friendById(id); if (!f) return;
  state.friends = state.friends.filter(x => x.id !== id);
  addLog(`Parent declined friend: ${f.name}`); save(); render(); toast("Request declined");
}
function removeFriend(id) {
  const f = friendById(id); if (!f) return;
  state.friends = state.friends.filter(x => x.id !== id);
  addLog(`Parent removed friend: ${f.name}`); save(); render(); toast(`${f.name} removed`);
}
function editPhone(id) {
  const f = friendById(id); if (!f) return;
  openSheet(`
    <h2>${f.avatar} ${esc(f.name)}'s number</h2>
    <div class="note">WhatsApp number with country code — used to launch the call.</div>
    <div class="field"><input id="epPhone" type="tel" value="${esc(f.phone || "")}" placeholder="+44 7700 900123" /></div>
    <button class="btn btn--block btn--green" id="epSave">Save</button>
  `);
  $("#epSave").onclick = () => {
    f.phone = $("#epPhone").value.trim();
    addLog(`Parent updated ${f.name}'s number`); save(); closeSheet(); render();
    toast("Number saved 💬");
  };
}
function approveCall(id) {
  const c = state.calls.find(x => x.id === id); if (!c) return;
  c.status = "approved"; addLog(`Parent approved a call with ${friendById(c.friend)?.name || "friend"}`); save(); render(); toast("Call approved ✅");
}
function declineCall(id) {
  const c = state.calls.find(x => x.id === id); if (!c) return;
  c.status = "declined"; addLog(`Parent declined a call`); save(); render(); toast("Call declined");
}

function addLog(text) { state.log.push({ text, when: Date.now() }); }

/* ============================================================
   Modal + toast helpers
   ============================================================ */
function openSheet(html) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-bg" id="modalBg"><div class="sheet"><div class="grip"></div>${html}</div></div>`;
  $("#modalBg").onclick = (e) => { if (e.target.id === "modalBg") closeSheet(); };
}
function closeSheet() { $("#modalRoot").innerHTML = ""; }

let toastTimer = null;
function toast(msg) {
  const old = $(".toast"); if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $(".device__screen").appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2200);
}

/* ============================================================
   Live clocks (status bar + world map + cards)
   ============================================================ */
let clockTimer = null;
function startClocks() {
  if (clockTimer) clearInterval(clockTimer);
  tickClocks();
  clockTimer = setInterval(tickClocks, 1000);
}
function tickClocks() {
  const sb = $("#statusClock");
  if (sb) sb.textContent = fmtTime(localAt(state.me.offset));
  document.querySelectorAll("[data-clock]").forEach(el => {
    el.textContent = fmtTime(localAt(parseFloat(el.dataset.clock)));
  });
  // update map pin times
  document.querySelectorAll(".map__pin").forEach((pin, i) => {
    // handled on re-render; cheap enough to leave static between renders
  });
}

/* ---------- Boot ---------- */
document.querySelectorAll(".tab").forEach(t => t.onclick = () => switchTab(t.dataset.tab));
render();
