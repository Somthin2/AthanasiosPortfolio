/* =====================================================================
   CONTROLLER — listens to the user, updates Model, tells View.
   ===================================================================== */

const Controller = {

  transitioning: false,
  audioUnlocked: false,

  init() {
    View.init();
    this.bindMenu();
    this.bindKeyboard();
    this.bindAudioUnlock();
    this.bindContactForm();
    // Set pose for the initially highlighted menu item without animation
    const initItem = View.els.menuItems[Model.state.menuIndex];
    if (initItem && this._poses) {
      View.setJokerPose(this._poses[initItem.dataset.target] || "assets/joker-hand-clear.png", true);
    }
    setTimeout(() => this.pingVisitor(), 2000);
  },

  /* Email relay: Web3Forms first (reliable CORS), FormSubmit as fallback.
     Fields use FormSubmit-style names (_subject, _replyto); mapped for Web3Forms.
     Returns { ok: true|false|null, via, data } — null = sent, reply unreadable. */
  WEB3FORMS_KEY: "ff7fc382-1107-4b0d-9eb3-233bff231407",

  async relay(fields) {
    const tries = [];
    if (!this.WEB3FORMS_KEY.startsWith("__")) {
      const fd = new FormData();
      fd.append("access_key", this.WEB3FORMS_KEY);
      fd.append("from_name", "Portfolio Radar");
      for (const [k, v] of Object.entries(fields)) {
        if (k === "_subject") fd.append("subject", v);
        else if (k === "_replyto") fd.append("replyto", v);
        else if (!k.startsWith("_")) fd.append(k, v);
      }
      try {
        const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd, signal: AbortSignal.timeout(10000) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) return { ok: true, via: "web3forms", data };
        tries.push({ via: "web3forms", status: res.status, data });
      } catch (e) { tries.push({ via: "web3forms", err: e.message }); }
    }
    // Fallback: FormSubmit as plain form fields (no CORS preflight)
    const url = `https://formsubmit.co/ajax/${Model.contactEmail}`;
    const body = new URLSearchParams(fields);
    try {
      const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" }, body, signal: AbortSignal.timeout(10000) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && String(data.success) === "true") return { ok: true, via: "formsubmit", data };
      tries.push({ via: "formsubmit", status: res.status, data });
    } catch (e) {
      tries.push({ via: "formsubmit", err: e.message });
      try {
        await fetch(url, { method: "POST", mode: "no-cors", body, signal: AbortSignal.timeout(10000) });
        return { ok: null, via: "formsubmit-opaque", data: tries };
      } catch (e2) { tries.push({ via: "formsubmit-opaque", err: e2.message }); }
    }
    return { ok: false, data: tries };
  },

  /* Visit alert: emails the owner at most once per browser per 24h.
     Add ?debug to the URL to bypass the 24h limit and log every step to the console. */
  async pingVisitor() {
    const KEY = "vp_ts", COUNT = "vp_n";
    const DAY = 864e5;
    const params = new URLSearchParams(location.search);
    const debug = params.has("debug");
    const log = (...a) => debug && console.log("[visit-ping]", ...a);
    const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } } };

    if (!debug && Date.now() - +(store.get(KEY) || 0) < DAY) return log("skipped: already pinged in the last 24h");

    const getJSON = async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
      return res.json();
    };

    // ── Geo lookup (two free providers; failure never blocks the alert)
    let geo = {};
    try {
      const g = await getJSON("https://ipapi.co/json/");
      if (g.error) throw new Error(g.reason || "ipapi error");
      geo = { ip: g.ip, city: g.city, region: g.region, country: g.country_name, cc: g.country_code,
              org: g.org, lat: g.latitude, lon: g.longitude };
    } catch (e1) {
      log("ipapi failed:", e1.message);
      try {
        const g = await getJSON("https://ipwho.is/");
        geo = { ip: g.ip, city: g.city, region: g.region, country: g.country, cc: g.country_code,
                org: g.connection?.org || g.connection?.isp, lat: g.latitude, lon: g.longitude };
      } catch (e2) { log("ipwho.is failed:", e2.message); }
    }
    const flag = geo.cc ? String.fromCodePoint(...[...geo.cc.toUpperCase()].map(c => 0x1F1A5 + c.charCodeAt(0))) : "🌐";
    const place = [geo.city, geo.country].filter(Boolean).join(", ") || "Unknown location";

    // ── Where they came from
    let ref = "";
    try { if (document.referrer) ref = new URL(document.referrer).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
    const tag = params.get("ref");
    const SOURCES = { github: "GitHub", "github.com": "GitHub", linkedin: "LinkedIn", "linkedin.com": "LinkedIn",
                      "lnkd.in": "LinkedIn", cv: "CV / résumé", "google.com": "Google search", "t.co": "X / Twitter" };
    const source = SOURCES[tag] || SOURCES[ref] || tag || ref || "Direct / bookmark";

    // ── Device, readable
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox"
                  : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
    const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS"
             : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
    const mobile = /Mobi|iPhone|Android/.test(ua);

    // ── Returning visitor?
    const n = +(store.get(COUNT) || 0) + 1;
    const ord = n === 1 ? "First visit 🆕" : `Returning — visit #${n} 🔁`;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = (zone) => new Date().toLocaleString("en-GB", { timeZone: zone, weekday: "short", day: "numeric",
                            month: "short", hour: "2-digit", minute: "2-digit" });

    const r = await this.relay({
      _subject: `Portfolio visitor from ${place}${source !== "Direct / bookmark" ? ` · via ${source}` : ""}`,
      "🎯 Visitor": `${flag} ${place}${n > 1 ? " (returning)" : ""}`,
      "🔗 Came from": source,
      "🏢 Network / organisation": geo.org || "—",
      "🗺️ Location": [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "—",
      "📍 Map": geo.lat != null ? `https://www.google.com/maps?q=${geo.lat},${geo.lon}` : "—",
      "💻 Device": `${browser} on ${os} · ${mobile ? "📱 mobile" : "🖥️ desktop"} · ${screen.width}×${screen.height}`,
      "🗣️ Language": navigator.language || "—",
      "🔁 History": ord,
      "🕒 Your time (Klagenfurt)": fmt("Europe/Vienna"),
      "🕓 Their local time": `${fmt(tz)} (${tz})`,
      "🌐 IP address": geo.ip || "—",
      "📄 Page": location.href,
    });
    log("formsubmit result:", r);
    // Start the 24h cooldown only once the alert went out (null = sent, reply unreadable)
    if (r.ok !== false) { store.set(KEY, Date.now()); store.set(COUNT, n); }
  },


  bindContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const status = document.getElementById("form-status");
    const btn = form.querySelector(".form-send");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data._honey) return;
      if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
        status.textContent = "Fill in all three fields first.";
        return;
      }
      btn.disabled = true;
      status.textContent = "Sending…";
      try {
        const r = await this.relay({
          name: data.name,
          email: data.email,
          message: data.message,
          _replyto: data.email,
          _subject: `Portfolio message from ${data.name}`,
          "💬 Sent from": "Portfolio contact form",
        });
        if (r.ok === false) throw new Error(JSON.stringify(r.data));
        status.textContent = "Sent. I'll get back to you.";
        form.reset();
        this.play();
      } catch {
        status.textContent = "Relay unreachable — opening your mail app…";
        const subject = encodeURIComponent(`Portfolio message from ${data.name}`);
        const body = encodeURIComponent(`${data.message}\n\nReply to: ${data.email}`);
        location.href = `mailto:${Model.contactEmail}?subject=${subject}&body=${body}`;
      } finally {
        btn.disabled = false;
      }
    });
  },

  goTo(screen) {
    if (this.transitioning || screen === Model.state.screen) return;
    this.transitioning = true;
    this.play();

    View.wipe(
      () => {
        Model.state.screen = screen;
        View.showScreen(screen);
        if (screen === "projects") this.loadProjects();
        if (screen === "skills") this.loadSkills();
        if (screen === "home") View.setJokerPose("assets/joker-hand-clear.png", true);
      },
      () => { this.transitioning = false; }
    );
  },

  select(index) {
    const n = View.els.menuItems.length;
    const next = (index + n) % n;
    if (next !== Model.state.menuIndex) this.play();
    Model.state.menuIndex = next;
    View.setMenuSelection(next);
    if (this._poses) {
      const target = View.els.menuItems[next].dataset.target;
      View.setJokerPose(this._poses[target] || "assets/joker-hand-clear.png", false, false);
    }
  },

  loadProjects() {
    View.renderFeatured(Model.featured);
  },

  loadSkills() {
    if (!Model.state.skillsBuilt) {
      View.renderSkills(Model.skills);
      Model.state.skillsBuilt = true;
    }
    View.animateSkillBars();
  },

  play() {
    if (this.audioUnlocked) View.playSelect();
  },

  bindAudioUnlock() {
    const unlock = () => { this.audioUnlocked = true; };
    addEventListener("pointerdown", unlock, { once: true, capture: true });
    addEventListener("keydown", unlock, { once: true, capture: true });
  },

  bindMenu() {
    this._poses = {
      projects: "assets/joker-hand-clear.png",
      skills:   "assets/joker-hand-clear.png",
      about:    "assets/joker-hand-clear.png",
      contact:  "assets/joker-hand-clear.png",
    };

    // Preload all pose images so first hover is instant
    [...new Set(Object.values(this._poses))].forEach(s => { new Image().src = s; });

    View.els.menuItems.forEach((item, i) => {
      item.addEventListener("mouseenter", () => this.select(i));
      item.addEventListener("click", () => this.goTo(item.dataset.target));
    });

    document.querySelectorAll("[data-back]").forEach(b =>
      b.addEventListener("click", () => this.goTo("home")));

    const bigName = document.getElementById("big-name");
    bigName.addEventListener("click", () => {
      if (Model.state.screen !== "home") this.goTo("home");
      else this.play();
    });
    bigName.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (Model.state.screen !== "home") this.goTo("home");
        else this.play();
      }
    });
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      if (Model.state.screen === "home") {
        if (e.key === "ArrowDown") { this.select(Model.state.menuIndex + 1); e.preventDefault(); }
        else if (e.key === "ArrowUp") { this.select(Model.state.menuIndex - 1); e.preventDefault(); }
        else if (e.key === "Enter") {
          this.goTo(View.els.menuItems[Model.state.menuIndex].dataset.target);
        }
      } else if (e.key === "Escape") {
        this.goTo("home");
      }
    });
  },
};

Controller.init();
