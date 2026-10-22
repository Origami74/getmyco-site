/* ══ getmyco.app ═══════════════════════════════════════════════════
   intro.js   the phone in the hero — the real app intro
   release.js the latest Myco release, read live from Zapstore
   this file  wires the download buttons and the scroll reveals
   ═════════════════════════════════════════════════════════════════ */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./intro.js";
import { getLatestRelease, ZAPSTORE_URL } from "./release.js";

gsap.registerPlugin(ScrollTrigger);

/* ── download buttons ─────────────────────────────────────────────
   Both buttons work before the relay answers: "Download Myco" falls
   back to the Zapstore page, which has the same file. Once the latest
   release is known it points straight at the APK. */
const downloads = document.querySelectorAll("[data-download]");
const metas = document.querySelectorAll("[data-release-meta]");

const megabytes = bytes => `${Math.round(bytes / 1e6)} MB`;

getLatestRelease()
  .then(release => {
    if (!release?.url) return;
    downloads.forEach(a => {
      a.href = release.url;
      a.setAttribute("download", `myco-${release.version}.apk`);
      a.title = `Myco ${release.version} for Android`;
    });
    const parts = [`Version ${release.version}`];
    if (release.size) parts.push(megabytes(release.size));
    parts.push("Free", "Android 10 or newer");
    metas.forEach(p => { p.textContent = parts.join(" · "); });
  })
  .catch(err => {
    console.warn("Couldn't reach Zapstore for the latest release:", err);
    downloads.forEach(a => { a.href = ZAPSTORE_URL; });
  });

/* on a computer, say where to install it */
const isAndroid = /android/i.test(navigator.userAgent);
const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
if (!isMobile) {
  document.querySelectorAll(".not-android").forEach(el => { el.hidden = false; });
} else if (!isAndroid) {
  document.querySelectorAll(".not-android").forEach(el => {
    el.hidden = false;
    el.textContent = "Myco is for Android phones for now — not iPhone yet.";
  });
}

/* ── scroll reveals ─────────────────────────────────────────────── */
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!calm) {
  gsap.utils.toArray(".reveal").forEach(el => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  /* the park drifts a little behind its words */
  gsap.fromTo(".mesh-photo img", { yPercent: -8 }, {
    yPercent: 8, ease: "none",
    scrollTrigger: { trigger: ".chapter-mesh", start: "top bottom", end: "bottom top", scrub: true }
  });

  /* the game photo settles in as it arrives */
  gsap.fromTo(".play-photo img", { scale: 1.12 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".play-photo", start: "top bottom", end: "center center", scrub: true }
  });

  /* the hero's phone eases away as you scroll past it */
  gsap.to(".phone-wrap", {
    yPercent: 14, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".stage", start: "top top", end: "bottom top", scrub: true }
  });
}

/* topbar gets a backing once you leave the hero */
ScrollTrigger.create({
  start: 80,
  onToggle: self => document.body.classList.toggle("scrolled", self.isActive)
});
