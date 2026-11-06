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

  /* POST to FormSubmit as plain form fields (a CORS "simple request": no preflight).
     If the browser still can't read the reply, fire it again opaquely (no-cors) so it's delivered anyway.
     Returns { ok: true|false|null, data } — null means "sent, but reply unreadable". */
  async relay(fields) {
    const url = `https://formsubmit.co/ajax/${Model.contactEmail}`;
    const body = new URLSearchParams(fields);
    try {
      const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" }, body, signal: AbortSignal.timeout(10000) });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok && String(data.success) === "true", data, status: res.status };
    } catch (err) {
      try {
        await fetch(url, { method: "POST", mode: "no-cors", body, signal: AbortSignal.timeout(10000) });
        return { ok: null, data: { note: "sent opaquely (CORS reply blocked)", err: err.message } };
      } catch (err2) {
        return { ok: false, data: { err: err2.message } };
      }
    }
  },

  /* Visit alert: emails the owner at most once per browser per 24h.
     Add ?debug to the URL to bypass the 24h limit and log every step to the console. */
  async pingVisitor() {
    const KEY = "vp_ts";
    const DAY = 864e5;
    const params = new URLSearchParams(location.search);
    const debug = params.has("debug");
    const log = (...a) => debug && console.log("[visit-ping]", ...a);

    let last = 0;
    try { last = +(localStorage.getItem(KEY) || 0); } catch { /* storage blocked */ }
    if (!debug && Date.now() - last < DAY) return log("skipped: already pinged in the last 24h");

    const getJSON = async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
      return res.json();
    };

    // Geo lookup: try two free providers; failure never blocks the ping
    let ip = "—", where = "—";
    try {
      const g = await getJSON("https://ipapi.co/json/");
      if (g.error) throw new Error(g.reason || "ipapi error");
      ip = g.ip; where = [g.city, g.region, g.country_name].filter(Boolean).join(", ");
    } catch (e1) {
      log("ipapi failed:", e1.message);
      try {
        const g = await getJSON("https://ipwho.is/");
        ip = g.ip ?? "—"; where = [g.city, g.region, g.country].filter(Boolean).join(", ") || "—";
      } catch (e2) { log("ipwho.is failed:", e2.message); }
    }

    let ref = "direct";
    try { if (document.referrer) ref = new URL(document.referrer).hostname; } catch { /* ignore */ }
    const source = params.get("ref") || ref;

    const r = await this.relay({
      _subject: `👁 Portfolio visit${source !== "direct" ? ` via ${source}` : ""}`,
      _template: "table",
      "Time": new Date().toUTCString(),
      "IP": ip,
      "Location": where || "—",
      "Source": source,
      "Referrer": ref,
      "Page": location.href,
      "Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      "Screen": `${screen.width}×${screen.height}`,
      "Browser": navigator.userAgent,
    });
    log("formsubmit result:", r);
    // Start the 24h cooldown only once the alert went out (null = sent, reply unreadable)
    if (r.ok !== false) { try { localStorage.setItem(KEY, Date.now()); } catch { /* ignore */ } }
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
