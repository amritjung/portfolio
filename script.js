// ===== CONFIG =====
// Paste a Formspree (or similar) endpoint here to receive messages directly,
// e.g. "https://formspree.io/f/abcdwxyz". Leave empty to fall back to the visitor's email app.
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "amritthapa555@gmail.com";

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

// ===== Contact form =====
const form = $("#contactForm"), status = $("#formStatus");
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (FORM_ENDPOINT) {
    status.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      form.reset();
      status.textContent = "Thanks! I'll get back to you soon.";
    } catch {
      status.textContent = `Something went wrong — please email ${CONTACT_EMAIL} directly.`;
    }
  } else {
    const subject = encodeURIComponent(`Portfolio enquiry from ${data.name}`);
    const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
    location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    status.textContent = "Opening your email app…";
  }
});

$("#year").textContent = new Date().getFullYear();
