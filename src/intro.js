/* ══ MYCO — app intro, GSAP timeline ══════════════════════════════
   GSAP core only, no plugins — every path is "drawn" with plain
   stroke-dashoffset.

   ▸ THE PART THAT PORTS TO ANDROID starts at `APP` below: a spark,
     roots growing outward into the Myco mark, the ring closing. Then
     it stops and waits for the user. Timings and easings map onto
     Compose animations one for one.

   ▸ The stage around the phone (background mycelium, spores, the
     copy on the left, the app screenshot behind the pupil) is site
     dressing. Don't port it.

   Intro beats, app-relative:
     0.0  a single spark at the centre
     0.4  primary roots push outward
     0.6→2.6  they branch, generation by generation
     2.4  the ring closes around them
     2.9  the four nodes ignite
     3.9  nutrients start running the filaments
     ~5.5 the mark settles and breathes — WAITS FOR A TAP
     +3s  no tap yet? a tendril grows out and "tap to start" comes up
     tap  → startIntro(), where the rest of the intro will live
   ═════════════════════════════════════════════════════════════════ */
import { gsap } from "gsap";

const NS = "http://www.w3.org/2000/svg";
const R = (min, max) => min + Math.random() * (max - min);

/* ═════════════════════════════════════════════════════════════════
   1. The mark.

   docs/myco-logo.png is a fourfold mandala of branching filaments
   inside a ring. So: grow ONE quadrant of hyphae out from the
   centre, then <use> it three times at 90/180/270°. The clones
   mirror the source live, so animating the quadrant animates the
   whole mark — a quarter of the tweens, perfect symmetry.
   ═════════════════════════════════════════════════════════════════ */
function buildMark(svg, opts = {}) {
  const {
    cx = 200, cy = 200, r0 = 22, depth = 5,
    len = 44, decay = 0.84, arms = [-32, -6, 20, 44]   // degrees, one quadrant
  } = opts;

  const wrap = svg.querySelector(".net-wrap");
  const quad = document.createElementNS(NS, "g");
  quad.setAttribute("id", "myco-quad");
  wrap.appendChild(quad);

  const paths = [];   // { el, gen }
  const nodes = [];   // { el, gen }
  const spines = [];  // the longest filaments — nutrients run these later

  function grow(x, y, angle, length, d, gen, curl, trunk) {
    if (d <= 0) return;

    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;

    // control point pushed off the perpendicular — this is what gives
    // the logo its woven, S-curved filaments instead of straight spokes
    const perp = angle + Math.PI / 2;
    const bow = length * R(0.26, 0.42) * curl;
    const cxp = (x + x2) / 2 + Math.cos(perp) * bow;
    const cyp = (y + y2) / 2 + Math.sin(perp) * bow;

    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} Q${cxp.toFixed(1)} ${cyp.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute("class", "fil");
    p.setAttribute("pathLength", "1");
    // presentation attributes, NOT css: <use> clones live in a shadow
    // tree that document stylesheets don't reach, so anything styled in
    // style.css would render as a black blob in the three copies.
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", d >= depth - 1 ? "#a5f3fc" : "#22d3ee");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-opacity", (0.55 + d * 0.09).toFixed(2));
    p.setAttribute("stroke-width", (d * 0.62 + 0.5).toFixed(2));
    quad.appendChild(p);
    // r0/r1 = how far this segment's ends sit from the centre. The pupil
    // uses them to work out how much of each filament it has swallowed.
    paths.push({ el: p, gen });
    if (trunk) spines.push(p);

    // a swollen node where the trunk first forks — the logo has four
    if (trunk && d === depth - 1) {
      const n = document.createElementNS(NS, "circle");
      n.setAttribute("class", "node");
      n.setAttribute("cx", x2.toFixed(1));
      n.setAttribute("cy", y2.toFixed(1));
      n.setAttribute("r", "5.5");
      n.setAttribute("fill", "#67e8f9");
      // where it sits, in polar terms, so the pupil can push it outward
      // along its own filament instead of swallowing it
      n.dataset.r = Math.hypot(x2 - cx, y2 - cy).toFixed(1);
      n.dataset.a = Math.atan2(y2 - cy, x2 - cx).toFixed(4);
      quad.appendChild(n);
      nodes.push({ el: n, gen: gen + 1 });
    }

    const branches = d > 2 ? 2 : (Math.random() < 0.7 ? 2 : 1);
    for (let i = 0; i < branches; i++) {
      const fan = (i - (branches - 1) / 2) * R(0.34, 0.6);
      grow(
        x2, y2,
        angle + fan + R(-0.06, 0.06),
        length * R(decay - 0.06, decay + 0.06),
        d - 1, gen + 1,
        -curl,                                  // alternate the bow: weave
        trunk && i === Math.floor(branches / 2) // one trunk carries on
      );
    }
  }

  arms.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    grow(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, a, len, depth, 0,
         i % 2 ? 1 : -1, true);
  });

  // nutrients: a short lit dash that runs a spine from centre to tip
  const pulses = spines.slice(0, 10).map(src => {
    const p = src.cloneNode();
    p.setAttribute("class", "pulse");
    p.setAttribute("stroke", "#ecfeff");
    p.setAttribute("stroke-opacity", "1");
    p.setAttribute("stroke-width", "2.6");
    quad.appendChild(p);
    return p;
  });

  // the three rotated clones — this is the fourfold symmetry
  [90, 180, 270].forEach(deg => {
    const u = document.createElementNS(NS, "use");
    u.setAttribute("href", "#myco-quad");
    u.setAttribute("transform", `rotate(${deg} ${cx} ${cy})`);
    wrap.appendChild(u);
  });

  gsap.set(paths.map(p => p.el), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(nodes.map(n => n.el), { scale: 0, opacity: 0, transformOrigin: "center" });
  gsap.set(pulses, { strokeDasharray: "0.1 0.9", strokeDashoffset: 1, opacity: 0 });

  return { paths, nodes, pulses };
}

/* generation N starts `step` after N-1, so growth runs root → tip */
function addGrowth(tl, net, at, step, dur, nodeDur) {
  const byGen = items => items.reduce((acc, it) => {
    (acc[it.gen] = acc[it.gen] || []).push(it.el);
    return acc;
  }, {});

  const gens = byGen(net.paths);
  Object.keys(gens).forEach(gen => {
    tl.to(gens[gen], {
      strokeDashoffset: 0, duration: dur, ease: "power2.out",
      stagger: { each: step * 0.3, from: "random" }
    }, at + gen * step);
  });

  if (net.nodes) {
    const nodeGens = byGen(net.nodes);
    Object.keys(nodeGens).forEach(gen => {
      tl.to(nodeGens[gen], {
        scale: 1, opacity: 1, duration: nodeDur, ease: "back.out(3)"
      }, at + gen * step);
    });
  }
}

/* ═════════════════════════════════════════════════════════════════
   2. The stage — loose background mycelium + drifting spores.
      Demo-page only.
   ═════════════════════════════════════════════════════════════════ */
function buildStageNet(svg, roots) {
  const paths = [];
  function grow(x, y, angle, length, d, gen) {
    if (d <= 0 || length < 4) return;
    const a = angle + R(-0.35, 0.35);
    const x2 = x + Math.cos(a) * length;
    const y2 = y + Math.sin(a) * length;
    const mx = (x + x2) / 2 + R(-1, 1) * length * 0.3;
    const my = (y + y2) / 2 + R(-1, 1) * length * 0.3;

    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute("class", Math.random() < 0.16 ? "hypha hypha-lit" : "hypha");
    p.setAttribute("pathLength", "1");
    p.setAttribute("stroke-width", (d * 0.34 + 0.3).toFixed(2));
    svg.appendChild(p);
    paths.push({ el: p, gen });

    const branches = d > 2 ? 2 : (Math.random() < 0.55 ? 2 : 1);
    for (let i = 0; i < branches; i++) {
      grow(x2, y2, a + (i - (branches - 1) / 2) * R(0.45, 0.9),
           length * R(0.68, 0.86), d - 1, gen + 1);
    }
  }
  roots.forEach(r => grow(r.x, r.y, r.angle, r.len, 5, 0));
  gsap.set(paths.map(p => p.el), { strokeDasharray: 1, strokeDashoffset: 1 });
  return { paths };
}

const bgNet = buildStageNet(document.querySelector(".mycelium"), [
  { x: 120,  y: 920, angle: -1.45, len: 130 },
  { x: 430,  y: 950, angle: -1.62, len: 120 },
  { x: 800,  y: 960, angle: -1.5,  len: 140 },
  { x: 1180, y: 940, angle: -1.7,  len: 120 },
  { x: 1500, y: 930, angle: -1.85, len: 125 },
  { x: -40,  y: 420, angle: -0.15, len: 110 },
  { x: 1640, y: 380, angle: 3.3,   len: 110 }
]);

const sporeLayer = document.querySelector(".spores");
const spores = Array.from({ length: 34 }, () => {
  const s = document.createElement("i");
  const lit = Math.random() < 0.3;
  s.className = lit ? "spore spore-lit" : "spore";
  const size = R(1.5, lit ? 4 : 3);
  s.style.width = s.style.height = `${size.toFixed(1)}px`;
  s.style.left = `${R(0, 100).toFixed(1)}%`;
  s.style.top = `${R(15, 100).toFixed(1)}%`;
  sporeLayer.appendChild(s);
  return s;
});

/* build the mark */
const mark = buildMark(document.querySelector(".logo-net"));

/* ═════════════════════════════════════════════════════════════════
   3. Starting state — the timeline owns every frame
   ═════════════════════════════════════════════════════════════════ */
gsap.set(".ring", { strokeDasharray: 1, strokeDashoffset: 1, rotation: -90, transformOrigin: "center" });
gsap.set(".core", { scale: 0, opacity: 0, transformOrigin: "center" });
gsap.set(".logo-net", { scale: 0.86, transformOrigin: "50% 50%" });
gsap.set(".phone", { autoAlpha: 0 });

const stage = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

/* ═════════════════════════════════════════════════════════════════
   4. Stage entrance — demo page only
   ═════════════════════════════════════════════════════════════════ */
addGrowth(stage, bgNet, 0, 0.09, 0.7);

stage.to(spores, {
  opacity: () => R(0.2, 0.8), duration: 1.0,
  stagger: { each: 0.025, from: "random" }, ease: "sine.out"
}, 0.2);

stage.fromTo(".phone",
  { autoAlpha: 0, y: 90, rotationY: -26, rotationX: 12, scale: 0.9 },
  { autoAlpha: 1, y: 0, rotationY: -7, rotationX: 3, scale: 1, duration: 0.9, ease: "power3.out" },
  0.55);
stage.from(".phone-glow", { opacity: 0, scale: 0.6, duration: 0.9, ease: "power2.out" }, 0.7);

stage.from(".eyebrow", { x: -20, opacity: 0, duration: 0.4 }, 1.05)
  .from(".wm-letter", {
    y: 90, opacity: 0, rotationX: -70, transformOrigin: "50% 100%",
    duration: 0.6, stagger: 0.05, ease: "power4.out"
  }, 1.12)
  .from(".tagline", { y: 22, opacity: 0, duration: 0.5 }, 1.4)
  .from(".blurb", { y: 18, opacity: 0, duration: 0.5 }, 1.52)
  .from(".hero-get > *:not([hidden])", { y: 20, opacity: 0, duration: 0.45, stagger: 0.07 }, 1.65)
  .from(".scroll-cue", { opacity: 0, duration: 0.6 }, 2.4);

/* ═════════════════════════════════════════════════════════════════
   ▼▼▼  THE APP INTRO  ▼▼▼   this is the Android sequence
   ═════════════════════════════════════════════════════════════════ */
const APP = 1.1;              // when the app launches on the stage

/* its own timeline, on its own clock, so it can be read (and ported)
   on its own — and replayed without re-running the page around it */
const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 }, delay: APP });
const at = t => t;

/* ── 0.0  one spark in the dark ──────────────────────────────── */
tl.to(".core", {
  scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.6)"
}, at(0))
  .fromTo(".core", { scale: 1 }, { scale: 1.7, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, at(0.18));

/* ── 0.2  the roots push out and keep branching ──────────────── */
addGrowth(tl, mark, at(0.2), 0.21, 0.45, 0.26);

/* the whole mark swells slightly as it fills out */
tl.to(".logo-net", { scale: 1, duration: 1.7, ease: "power2.out" }, at(0.2));

/* ── 1.15  the ring closes around it ─────────────────────────── */
tl.to(".ring", { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }, at(1.15))
  .fromTo(".ring", { opacity: 0.3 }, { opacity: 0.85, duration: 0.5 }, at(1.15));

/* ── 1.95  nutrients start running the filaments ─────────────── */
tl.to(mark.pulses, {
  opacity: 1, duration: 0.18,
  stagger: { each: 0.045, from: "random" }
}, at(1.95))
  .to(mark.pulses, {
    strokeDashoffset: 0.1, duration: 0.75, ease: "sine.inOut",
    stagger: { each: 0.07, from: "random" }
  }, at(1.98));

/* one deep breath, and the mark is alive */
tl.to(".core", { scale: 1.35, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 }, at(2.2))
  .to(".net-wrap", { rotation: 6, transformOrigin: "50% 50%", duration: 1.5, ease: "sine.inOut" }, at(1.8));

/* …and that's where the timeline stops. Everything after this point
   is driven by the user. ─────────────────────────────────────────*/

/* ═════════════════════════════════════════════════════════════════
   5. The wait.

   The mark lands, and a tendril grows down out of it carrying the
   words. A tap at any point — including while the mark is still
   growing — skips straight to startIntro().
   ═════════════════════════════════════════════════════════════════ */
const IDLE_MS = 150;      // after the mark lands, near enough to "straight away"

const screenEl   = document.querySelector(".screen");
const promptEl   = document.querySelector(".tap-prompt");
const wordsEl    = document.querySelector(".tap-words");
const vineEl     = document.querySelector(".tap-vine");

/* one letter per span so they can come up staggered */
const letters = [...wordsEl.dataset.text].map(ch => {
  const s = document.createElement("span");
  s.className = "tw";
  s.textContent = ch;
  wordsEl.appendChild(s);
  return s;
});

/* the tendril the words sit on — grown, not drawn */
const vine = (() => {
  const paths = [];
  function grow(x, y, angle, length, d, gen) {
    if (d <= 0) return;
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    const perp = angle + Math.PI / 2;
    const bow = length * R(0.15, 0.3) * (gen % 2 ? 1 : -1);
    const cx = (x + x2) / 2 + Math.cos(perp) * bow;
    const cy = (y + y2) / 2 + Math.sin(perp) * bow;

    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute("pathLength", "1");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#22d3ee");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-opacity", (0.35 + d * 0.14).toFixed(2));
    p.setAttribute("stroke-width", (d * 0.45 + 0.35).toFixed(2));
    vineEl.appendChild(p);
    paths.push({ el: p, gen });

    // it runs sideways along the words as it thins out
    for (let i = 0; i < 2; i++) {
      const fan = (i ? 1 : -1) * R(0.5, 1.15);
      grow(x2, y2, angle + fan, length * R(0.62, 0.82), d - 1, gen + 1);
    }
  }
  grow(100, 0, Math.PI / 2, 17, 4, 0);   // straight down out of the mark
  gsap.set(paths.map(p => p.el), { strokeDasharray: 1, strokeDashoffset: 1 });
  return { paths };
})();

gsap.set(letters, { opacity: 0, y: 8, filter: "blur(6px)" });

let idleTimer = null;
let promptTl  = null;
let started   = false;

function showPrompt() {
  gsap.set(promptEl, { visibility: "visible" });
  promptTl = gsap.timeline();
  addGrowth(promptTl, vine, 0, 0.1, 0.3);
  promptTl.to(letters, {
    opacity: 1, y: 0, filter: "blur(0px)",
    duration: 0.45, stagger: 0.035, ease: "power2.out"
  }, 0.28)
    /* then it just breathes, waiting */
    .to(wordsEl, {
      opacity: 0.45, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut"
    }, ">0.3");
}

/* the tap works from the first frame — no reason to make someone watch
   the mark grow if they already know what they want. Only the phone
   screen listens: the rest of the site has its own buttons. */
function armTap() {
  started = false;
  screenEl.addEventListener("click", onTap);
}

/* …the prompt, though, waits for the mark to finish and then follows
   it straight away */
function armWait() {
  armTap();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(showPrompt, IDLE_MS);
}

function disarmWait() {
  clearTimeout(idleTimer);
  screenEl.removeEventListener("click", onTap);
  if (promptTl) { promptTl.kill(); promptTl = null; }
}

function onTap() {
  if (started) return;
  started = true;
  disarmWait();
  gsap.to(promptEl, { autoAlpha: 0, y: 8, duration: 0.3, ease: "power2.in" });
  startIntro();
}

/* ═════════════════════════════════════════════════════════════════
   6. THE PUPIL.

   Nothing is drawn and nothing moves. The dark spot in the middle of
   the mark simply grows outward and the filaments inside it are cut
   away. The mark stays exactly where and what it is — a hole opens
   in it.

   The hole is a mask (see #pupil in the HTML), so the cut is
   geometric. Working it out per filament from its two endpoint radii
   is cheaper but wrong: a filament that bows inward mid-curve reads
   as "outside the pupil" on its endpoints, and every one of those
   left a bead of itself floating in the black.
   ═════════════════════════════════════════════════════════════════ */
const filaments = mark.paths.map(p => p.el);
const nodeEls   = mark.nodes.map(n => n.el);
const holeEl    = document.querySelector(".pupil-hole");
const rimEl     = document.querySelector(".pupil-rim");
const strokeOf  = el => parseFloat(el.getAttribute("stroke-width"));

const pupil = { r: 0 };            // radius, in viewBox units

function drawPupil() {
  const R0 = pupil.r;
  holeEl.setAttribute("r", R0.toFixed(1));

  /* the rim rides the cut. Its fade is derived from the radius rather
     than tweened separately, so it can never drift off the edge — and
     it comes up over the first few units instead of popping. */
  rimEl.setAttribute("r", R0.toFixed(1));
  rimEl.setAttribute("opacity", (Math.min(R0 / 35, 1) * 0.75).toFixed(3));

  /* the nodes don't get swallowed — the pupil pushes them out ahead of
     itself, so they ride its edge like beads on their own filament.
     +7 keeps them clear of the cut instead of sliced in half. */
  nodeEls.forEach(el => {
    const a = +el.dataset.a;
    const rr = Math.max(+el.dataset.r, R0 + 7);
    el.setAttribute("cx", (200 + Math.cos(a) * rr).toFixed(1));
    el.setAttribute("cy", (200 + Math.sin(a) * rr).toFixed(1));
  });
}

const DIVE = 15;

function startIntro() {
  stopMarkAmbient();

  const t = gsap.timeline();

  /* ── 0.0  the spark in the middle goes out ── */
  t.to(".core", { scale: 0.35, opacity: 0, duration: 0.45, ease: "power2.in" }, 0)
    .to(mark.pulses, { opacity: 0, duration: 0.2 }, 0)

  /* ── 0.25  the dark spot opens outward ── */
    .to(pupil, {
      r: 112, duration: 1.5, ease: "power2.inOut", onUpdate: drawPupil
    }, 0.25)

  /* ── 1.8  one light response, and that's the tell.
       Constriction is fast and dilation is slow — that asymmetry is
       most of what makes it read as an eye rather than a circle. ── */
    .to(pupil, { r: 72,  duration: 0.28, ease: "power4.out",   onUpdate: drawPupil }, 1.80)
    .to(pupil, { r: 100, duration: 1.05, ease: "power1.inOut", onUpdate: drawPupil }, 2.12)

  /* ── 3.3  it opens wide, and we go in ── */
    .to(".logo-net", { scale: DIVE, duration: 2.2, ease: "power2.in" }, 3.4)
    .to(pupil, { r: 175, duration: 2.0, ease: "power2.in", onUpdate: drawPupil }, 3.3)
    .to(".ring", { opacity: 0, duration: 0.9 }, 3.8)
    /* tighten the bloom as we accelerate, or the blur smears the whole
       frame once everything is 15× its own size */
    .to("#glow feGaussianBlur", { attr: { stdDeviation: 0.6 }, duration: 1.6 }, 3.6)
    .to(filaments, {
      strokeWidth: i => strokeOf(filaments[i]) * 0.08,
      strokeOpacity: 0,
      duration: 1.6, ease: "power2.in"
    }, 4.0)

  /* ── 5.6  through ── */
    .call(onThroughThePupil, null, 5.6);

  return t;
}

/* ▼▼▼  WE ARE INSIDE THE PUPIL  ▼▼▼
   Site only: the app comes up out of the black. Another tap on it
   plays the intro again. */
const appEl = document.querySelector(".scr-app");
gsap.set(appEl, { autoAlpha: 0 });

function onThroughThePupil() {
  gsap.fromTo(appEl,
    { autoAlpha: 0, scale: 1.08 },
    { autoAlpha: 1, scale: 1, duration: 0.9, ease: "power2.out",
      onComplete: () => screenEl.addEventListener("click", replay, { once: true }) });
}

/* ═════════════════════════════════════════════════════════════════
   7. Ambient — the mark stays alive while it waits
   ═════════════════════════════════════════════════════════════════ */
const ambient = [];      // stage dressing
const markLoops = [];    // inside the phone

const BREATH = 2.3;      // seconds per half-breath (in, then out)

function startMarkAmbient() {
  stopMarkAmbient();

  /* ── the breath ──
     One timeline, yoyo'd, so everything inhales and exhales together:
     the whole mark swells, the filaments brighten, the ring gives a
     little as it takes the pressure, and the core leads slightly —
     the pulse arrives at the centre before the body moves. */
  const breath = gsap.timeline({
    repeat: -1, yoyo: true,
    defaults: { duration: BREATH, ease: "sine.inOut" }
  });
  breath
    .to(".logo-net", { scale: 1.05 }, 0)
    .to(".net-wrap", { opacity: 1 }, 0)
    .to(".ring",     { scale: 0.985, opacity: 0.55 }, 0)
    .to(".core",     { scale: 1.3 }, BREATH * 0.12);     // leads the body

  /* The breath cycles between a dim exhale and a bright inhale, so it
     has to begin from the dim end. Getting there with a set() snapped
     the mark's brightness the instant the intro handed over; this
     eases down into the first exhale, and the loop picks up from
     there. */
  const settle = gsap.timeline();
  settle
    .to(".net-wrap", { opacity: 0.72, duration: BREATH * 0.8, ease: "sine.inOut" })
    .add(breath);
  markLoops.push(settle, breath);

  /* filaments shimmer out of phase with each other, so the mark never
     reads as one flat object breathing */
  markLoops.push(gsap.to(mark.paths.map(p => p.el), {
    strokeOpacity: "-=0.3",
    duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut",
    stagger: { each: 0.02, from: "random" }
  }));

  // nutrients keep circulating
  markLoops.push(gsap.fromTo(mark.pulses,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0.1, duration: 2.6, ease: "sine.inOut",
      repeat: -1, repeatDelay: 0.8,
      stagger: { each: 0.22, from: "random" } }));

  // slow drift, so it never sits perfectly still
  markLoops.push(gsap.to(".net-wrap", {
    rotation: "+=8", transformOrigin: "50% 50%",
    duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut"
  }));
}

function stopMarkAmbient() {
  markLoops.forEach(t => t.kill());
  markLoops.length = 0;
}

function startAmbient() {
  stopAmbient();

  spores.forEach(s => {
    ambient.push(gsap.to(s, {
      y: () => R(-140, -50), x: () => R(-40, 40),
      duration: () => R(9, 18),
      repeat: -1, yoyo: true, ease: "sine.inOut", delay: R(0, 3)
    }));
  });

  ambient.push(gsap.to(".mycelium .hypha-lit", {
    opacity: 0.5, duration: 2.2, repeat: -1, yoyo: true,
    stagger: { each: 0.12, from: "random" }, ease: "sine.inOut"
  }));

  ambient.push(gsap.to(".phone", { y: -10, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" }));
  ambient.push(gsap.to(".phone-glow", {
    scale: 1.08, opacity: 0.7, duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut"
  }));
}

function stopAmbient() {
  ambient.forEach(t => t.kill());
  ambient.length = 0;
  gsap.set(spores, { x: 0, y: 0 });
}

armTap();                          // tappable from the first frame

/* the mark has finished growing — go live, and bring the prompt up */
tl.eventCallback("onComplete", () => {
  startAmbient();
  startMarkAmbient();
  armWait();
});

/* handy while building:
     ?t=4.6     freeze the timeline at that second
     ?prompt    jump to the settled mark with the idle prompt already up
     ?eye=1.2   jump past the growth and freeze the eye/dive at 1.2s */
const params = new URLSearchParams(location.search);
if (params.has("t")) tl.pause(parseFloat(params.get("t")));
if (params.has("prompt")) {
  tl.progress(1);
  startMarkAmbient();
  showPrompt();
  screenEl.addEventListener("click", onTap);
}
if (params.has("eye")) {
  tl.progress(1);
  started = true;
  const eyeTl = startIntro();
  const eyeAt = parseFloat(params.get("eye"));
  if (!Number.isNaN(eyeAt)) {
    eyeTl.pause(eyeAt);
    drawPupil();          // seeking suppresses onUpdate, so paint it here
  }
}

function replay() {
  disarmWait();
  gsap.set(appEl, { autoAlpha: 0 });
  stopMarkAmbient();
  /* the breath and the dive both leave state behind — put it back */
  gsap.set(".net-wrap", { opacity: 1, rotation: 0, scale: 1 });
  gsap.set(".ring", { scale: 1, opacity: 0.85 });
  gsap.set("#glow feGaussianBlur", { attr: { stdDeviation: 3.2 } });
  gsap.set(filaments, { clearProps: "strokeOpacity,stroke,strokeWidth" });
  pupil.r = 0;
  drawPupil();                       // closes the hole, puts the nodes back
  gsap.set(filaments, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(mark.pulses, {
    opacity: 0, strokeDasharray: "0.1 0.9", strokeDashoffset: 1
  });
  gsap.set(promptEl, { visibility: "hidden", autoAlpha: 1, y: 0 });
  gsap.set(wordsEl, { opacity: 1 });
  gsap.set(letters, { opacity: 0, y: 8, filter: "blur(6px)" });
  gsap.set(vine.paths.map(p => p.el), { strokeDashoffset: 1 });
  tl.restart();
}

/* keyboard: the screen is a button */
screenEl.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); screenEl.click(); }
});
