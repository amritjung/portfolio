// ===== CONFIG =====
// Contact form is delivered by Web3Forms (https://web3forms.com).
// The access key is safe to keep in front-end code — it only allows sending to your inbox.
const WEB3FORMS_KEY = "4dd9c5d2-81f8-47c4-9f30-46dd6e2654bd";
// Email is assembled at runtime so simple scrapers can't harvest it from the HTML.
const CONTACT_EMAIL = ["amritthapa555", "gmail.com"].join("@");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ===== Theme =====
const root = document.documentElement;
const savedTheme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
if (savedTheme) root.dataset.theme = savedTheme;
$("#themeToggle").addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
});

// ===== Nav =====
const nav = $(".nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 30), { passive: true });
const menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
});
$$("#navLinks a").forEach(a => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", false);
  document.body.style.overflow = "";
}));

// ===== Hero word rotator =====
const words = ["ship.", "scale.", "sell.", "delight."];
let wi = 0;
const rot = $("#rotator");
setInterval(() => {
  rot.classList.add("out");
  setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove("out"); }, 300);
}, 2400);

// ===== Reveal on scroll + counters =====
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    $$(".counter", e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach(el => io.observe(el));

function countUp(el) {
  const target = +el.dataset.target, suffix = el.dataset.suffix || "";
  const start = performance.now(), dur = 1400;
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : "");
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ===== Custom cursor + magnetic buttons (pointer devices only) =====
if (matchMedia("(hover: hover)").matches) {
  const cursor = $(".cursor");
  addEventListener("mousemove", e => {
    cursor.style.opacity = 1;
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });
  $$("a, button, .project").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("big"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("big"));
  });
  $$(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}

// ===== Project filters =====
$$(".filter").forEach(btn => btn.addEventListener("click", () => {
  $$(".filter").forEach(b => b.classList.toggle("active", b === btn));
  const f = btn.dataset.filter;
  $$(".project").forEach(p => {
    const show = f === "all" || p.dataset.cat === f;
    p.classList.toggle("hidden", !show);
    if (show) p.classList.add("in");
  });
}));

// ===== Mini pokie demo =====
const symbols = ["💎", "🍒", "⭐", "🔔", "7️⃣", "🍀"];
const spinBtn = $("#spinBtn");
spinBtn.addEventListener("click", () => {
  if (spinBtn.disabled) return;
  spinBtn.disabled = true;
  const visual = spinBtn.parentElement;
  $(".win-flash", visual)?.remove();
  const reels = $$(".reel");
  const results = [];
  reels.forEach((reel, i) => {
    reel.classList.add("spinning");
    const span = $("span", reel);
    const iv = setInterval(() => (span.textContent = symbols[Math.floor(Math.random() * symbols.length)]), 70);
    setTimeout(() => {
      clearInterval(iv);
      // small boost so visitors see a win now and then
      const sym = i > 0 && Math.random() < 0.35 ? results[0] : symbols[Math.floor(Math.random() * symbols.length)];
      results[i] = sym;
      span.textContent = sym;
      reel.classList.remove("spinning");
      if (i === reels.length - 1) {
        spinBtn.disabled = false;
        const allMatch = results.every(s => s === results[0]);
        const twoMatch = results[0] === results[1] || results[1] === results[2];
        if (allMatch || twoMatch) {
          const msg = document.createElement("div");
          msg.className = "win-flash";
          msg.textContent = allMatch ? "★ BIG WIN ★" : "Nice!";
          visual.appendChild(msg);
        }
      }
    }, 600 + i * 350);
  });
});

// ===== Loan calculator demo (approx. 12% p.a. over 5 years) =====
const range = $("#loanRange"), amt = $("#loanAmt"), repay = $("#loanRepay");
const fmt = n => "$" + Math.round(n).toLocaleString("en-AU");
function updateLoan() {
  const P = +range.value, r = 0.12 / 12, n = 60;
  amt.textContent = fmt(P);
  repay.textContent = fmt((P * r) / (1 - Math.pow(1 + r, -n))) + "/mo";
}
range.addEventListener("input", updateLoan);
updateLoan();

// ===== Contact email link (obfuscated) =====
$$("[data-email]").forEach(a => {
  a.href = "mailto:" + CONTACT_EMAIL;
  const label = $(".email-text", a);
  if (label) label.textContent = CONTACT_EMAIL;
});

// ===== Contact form (hardened) =====
const form = $("#contactForm"), status = $("#formStatus"), submitBtn = $("button[type=submit]", form);
const setStatus = (msg, type = "") => { status.textContent = msg; status.dataset.type = type; };

const LOADED_AT = Date.now();
const MIN_FILL_MS = 4000;          // humans take longer than 4s to fill a form
const COOLDOWN_MS = 60 * 1000;     // one message per minute per browser
const MAX_PER_SESSION = 3;         // cap per tab session
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;
const URL_RE = /(https?:\/\/|www\.)/gi;

const store = {
  get(k) { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } },
  set(k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch {} },
};
// Strip control/invisible characters and collapse whitespace
const clean = (v, multiline = false) => {
  let t = String(v ?? "").normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, "");
  t = multiline ? t.replace(/\r\n?/g, "\n").replace(/\n{4,}/g, "\n\n\n") : t.replace(/\s+/g, " ");
  return t.trim();
};

function validate({ name, email, message }) {
  if (!name) return ["name", "Name is required."];
  if (name.length < 2 || name.length > 100) return ["name", "Please enter your name (2–100 characters)."];
  if (URL_RE.test(name) || /[<>{}]/.test(name)) { URL_RE.lastIndex = 0; return ["name", "Your name can't contain links or special symbols."]; }
  URL_RE.lastIndex = 0;
  if (!email) return ["email", "Email is required."];
  if (!EMAIL_RE.test(email) || email.length > 150) return ["email", "Please enter a valid email address."];
  if (!message) return ["message", "Message is required."];
  if (message.length < 10) return ["message", "Your message is a bit short — tell me a little more."];
  if (message.length > 5000) return ["message", "Please keep your message under 5,000 characters."];
  const links = message.match(URL_RE) || [];
  URL_RE.lastIndex = 0;
  if (links.length > 2) return ["message", "Please include no more than 2 links."];
  return null;
}

// Clear the error highlight as soon as the visitor edits a field
$$("input, textarea", form).forEach(el => el.addEventListener("input", () => el.removeAttribute("aria-invalid")));

form.addEventListener("submit", async e => {
  e.preventDefault();
  const raw = Object.fromEntries(new FormData(form));

  // Bot traps: hidden honeypot field or impossibly fast submission → pretend success, send nothing
  const allFilled = ["name", "email", "message"].every(k => clean(raw[k]));
  if (raw.botcheck || (allFilled && Date.now() - LOADED_AT < MIN_FILL_MS)) {
    form.reset();
    setStatus("Thanks! Your message is on its way.", "success");
    return;
  }

  // Throttling
  const last = +store.get("contact_last") || 0;
  const count = +store.get("contact_count") || 0;
  if (Date.now() - last < COOLDOWN_MS) {
    setStatus("Please wait a minute before sending another message.", "error");
    return;
  }
  if (count >= MAX_PER_SESSION) {
    setStatus(`You've sent a few messages already — please email ${CONTACT_EMAIL} instead.`, "error");
    return;
  }

  const data = { name: clean(raw.name), email: clean(raw.email).toLowerCase(), message: clean(raw.message, true) };
  $$("[aria-invalid]", form).forEach(el => el.removeAttribute("aria-invalid"));
  const problem = validate(data);
  if (problem) {
    const [field, msg] = problem;
    const el = form.elements[field];
    el.setAttribute("aria-invalid", "true");
    el.focus();
    setStatus(msg, "error");
    return;
  }

  const captcha = raw["h-captcha-response"];
  if (!captcha) { setStatus("Please complete the “I am human” check.", "error"); return; }

  submitBtn.disabled = true;
  const label = submitBtn.innerHTML;
  submitBtn.textContent = "Sending…";
  setStatus("");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Portfolio enquiry from ${data.name}`.slice(0, 150),
        from_name: "amritthapa.com",
        replyto: data.email,
        name: data.name,
        email: data.email,
        message: data.message,
        "h-captcha-response": captcha,
      }),
      signal: ctrl.signal,
      credentials: "omit",
      referrerPolicy: "strict-origin",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
    store.set("contact_last", String(Date.now()));
    store.set("contact_count", String(count + 1), true);
    form.reset();
    setStatus("Thanks! Your message is on its way — I'll reply soon.", "success");
  } catch (err) {
    console.error("Contact form error:", err);
    setStatus(err.name === "AbortError"
      ? `That took too long. Please try again or email ${CONTACT_EMAIL}.`
      : `Sorry, that didn't send. Please try again or email ${CONTACT_EMAIL}.`, "error");
  } finally {
    clearTimeout(timer);
    try { window.hcaptcha?.reset(); } catch {}
    submitBtn.disabled = false;
    submitBtn.innerHTML = label;
  }
});

$("#year").textContent = new Date().getFullYear();
