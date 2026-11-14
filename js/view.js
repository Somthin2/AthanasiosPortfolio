/* =====================================================================
   VIEW — everything that draws to the screen. No app logic lives here.
   ===================================================================== */

const View = {

  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  _poseTimer: null,

  els: {
    screens:    {},
    menuItems:  [],
    wipe:       document.getElementById("wipe"),
    featGrid:   document.getElementById("feat-grid"),
    opsGrid:    document.getElementById("ops-grid"),
    stats:      document.getElementById("stats"),
    skillsBody: document.getElementById("skills-body"),
    sfx:        document.getElementById("sfx-select"),
    cursor:     document.getElementById("cursor"),
    clock:      document.getElementById("clock"),
    heroA:      document.getElementById("hero-a"),
    heroFlash:  document.getElementById("hero-flash"),
  },

  init() {
    document.querySelectorAll(".screen").forEach(s => {
      this.els.screens[s.id.replace("screen-", "")] = s;
    });
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    if (this.els.sfx) this.els.sfx.volume = 0.45;
    this.startClock();
    this.startParallax();
    this.startCursor();
    document.body.classList.add("loaded");
  },

  hash(str) {
    let h = 9;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489);
    return (h ^ h >>> 9) >>> 0;
  },

  ransomize(el) {
    const text = el.dataset.ransom || el.textContent;
    el.textContent = "";
    [...text].forEach((c, i) => {
      const span = document.createElement("span");
      span.className = "ch display";
      span.textContent = c;
      const h = this.hash(text + i);
      const rot = (h % 17) - 8;
      const scale = 0.86 + ((h >> 3) % 30) / 100;
      const dy = ((h >> 5) % 9) - 4;
      const t = `rotate(${rot}deg) scale(${scale}) translateY(${dy}px)`;
      span.style.setProperty("--t", t);
      span.style.transform = t;
      const variant = (h >> 7) % 10;
      if (variant === 0) span.classList.add("box");
      else if (variant === 1) span.classList.add("boxw");
      else if (variant === 2) span.classList.add("red");
      el.appendChild(span);
    });
  },

  showScreen(name) {
    const s = this.els.screens;
    Object.values(s).forEach(sc => sc.classList.remove("active"));
    s[name].classList.add("active");
    s[name].scrollTop = 0;
    document.body.dataset.screen = name;
  },

  setMenuSelection(index) {
    this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === index));
  },

  wipe(swap, done) {
    if (this.reducedMotion) { swap(); done(); return; }
    const w = this.els.wipe;
    w.classList.remove("go"); void w.offsetWidth;
    w.classList.add("go");
    setTimeout(swap, 340);
    setTimeout(done, 720);
  },

  playSelect() {
    if (!this.els.sfx) return;
    try {
      this.els.sfx.currentTime = 0;
      const p = this.els.sfx.play();
      if (p && p.catch) p.catch(() => {});
    } catch {}
  },

  cardThumb(src) {
    return `<div class="thumb"><img src="${src}" alt="" loading="lazy" width="330" height="150"
      onerror="this.closest('.thumb').remove()"></div>`;
  },

  splitTitle(title) {
    const first = title.split(" ")[0];
    return `<em>${first}</em>${title.slice(first.length)}`;
  },

  renderFeatured(list) {
    if (this.els.featGrid.childElementCount) return;
    list.forEach((f, i) => {
      const a = document.createElement("a");
      a.className = "card feat";
      a.href = f.url; a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--tilt", ((this.hash(f.title) % 5) - 2) * 0.8 + "deg");
      a.style.setProperty("--d", i * 70 + "ms");
      a.innerHTML = `
        ${this.cardThumb(f.img)}
        <span class="lang" style="--lc:${f.color}">${f.tag}</span>
        <h3>${f.live ? '<span class="live-dot"></span>' : ""}${this.splitTitle(f.title)}</h3>
        <p>${f.desc}</p>
        <div class="meta"><span>${f.live ? "LIVE NOW" : "HIGHLIGHT"}</span><span class="go">${f.cta}</span></div>`;
      this.els.featGrid.appendChild(a);
    });
  },

  renderStats(stats) {
    if (this.els.stats.childElementCount) return;
    stats.forEach((st, i) => {
      const d = document.createElement("div");
      d.className = "stat";
      d.style.setProperty("--tilt", ((this.hash(st.big) % 5) - 2) * 0.9 + "deg");
      d.style.setProperty("--d", i * 60 + "ms");
      d.innerHTML = `<span class="big display">${st.big}</span><span class="small">${st.small}</span>`;
      this.els.stats.appendChild(d);
    });
  },

  renderOps(ops) {
    if (this.els.opsGrid.childElementCount) return;
    ops.forEach((o, i) => {
      const d = document.createElement("article");
      d.className = "card op";
      d.style.setProperty("--tilt", ((this.hash(o.title) % 5) - 2) * 0.6 + "deg");
      d.style.setProperty("--d", 160 + i * 70 + "ms");
      d.innerHTML = `
        <span class="lang">${o.tag}</span>
        <h3>${this.splitTitle(o.title)}</h3>
        <p>${o.desc}</p>`;
      this.els.opsGrid.appendChild(d);
    });
  },

  renderSkills(groups) {
    groups.forEach((g, gi) => {
      const div = document.createElement("section");
      div.className = "skill-group";
      div.style.setProperty("--d", gi * 90 + "ms");
      const chips = g.items.map(([name, key], i) =>
        `<li class="chip${key ? " key" : ""}" style="--i:${i}"><span>${name}</span></li>`).join("");
      div.innerHTML = `<h3>${g.group}</h3><ul class="chips">${chips}</ul>`;
      this.els.skillsBody.appendChild(div);
    });
  },

  startClock() {
    const tick = () => {
      this.els.clock.textContent =
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" }) + " · KLU";
    };
    tick();
    setInterval(tick, 1000);
  },

  startParallax() {
    if (this.reducedMotion) return;
    const stripes = document.getElementById("bg-stripes");
    const halftone = document.getElementById("bg-halftone");
    const arts = [...document.querySelectorAll(".menu-art")];
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      stripes.style.transform = `translate(${cx * 22}px, ${cy * 14}px)`;
      halftone.style.transform = `translate(${cx * -34}px, ${cy * -22}px)`;
      arts.forEach(a => {
        if (a.isConnected)
          a.style.transform = `translate(${cx * 14}px, ${cy * 9}px) scale(1.04)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  },

  setJokerPose(src, instant = false, forceAnim = false) {
    const hero = this.els.heroA;
    if (!hero) return;
    const isSame = hero.src.endsWith(src.split('/').pop());
    if (!forceAnim && isSame) return;
    if (this._poseTimer) { clearTimeout(this._poseTimer); this._poseTimer = null; }

    if (instant || this.reducedMotion) { hero.src = src; return; }

    const fl = this.els.heroFlash;
    fl.classList.remove('active');
    void fl.offsetWidth;
    fl.classList.add('active');

    this._poseTimer = setTimeout(() => {
      hero.src = src;
      hero.classList.remove('burst');
      void hero.offsetWidth;
      hero.classList.add('burst');
      hero.addEventListener('animationend', () => hero.classList.remove('burst'), { once: true });
      this._poseTimer = null;
    }, 105);
  },

  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reducedMotion) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    let x = -100, y = -100, frame = 0, last = 0, visible = false;

    addEventListener("mousemove", e => {
      x = e.clientX; y = e.clientY;
      if (!visible) { cur.style.display = "block"; visible = true; }
      const t = e.target;
      const overLink = t.closest &&
        t.closest("a,button,.card,.menu-item,.back-hint,.contact-chip,#big-name");
      cur.classList.toggle("link", !!overLink);
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
      cur.style.display = "none"; visible = false;
    });

    const tick = ts => {
      if (ts - last >= 50) {
        frame = (frame + 1) % 30; last = ts;
        cur.style.backgroundPosition = -frame * 48 + "px 0";
      }
      cur.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
};
