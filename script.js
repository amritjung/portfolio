/*
 * amritthapa.com — main script
 * ---------------------------------------------------------------
 * Plain vanilla JS, no build step. Loaded with "defer", so it runs
 * once the HTML has been parsed.
 *
 * Shared by the home page and the case-study pages. Anything that
 * only exists on some pages is wrapped in an "if" so it simply
 * skips itself where it isn't needed.
 *
 * Sections:
 *   1. Frame protection
 *   2. Settings
 *   3. Small helpers
 *   4. Light / dark theme
 *   4b. Pause animations
 *   5. Navigation
 *   6. Hero word rotator
 *   7. Scroll reveal + number counters
 *   8. Custom cursor + magnetic buttons
 *   9. Project filters
 *  10. Opal Rush mini slot machine
 *  11. Lendly loan calculator
 *  12. Contact email link
 *  13. Contact form
 *  13b. Load hCaptcha only when needed
 *  14. Footer year
 */


/* ---------------------------------------------------------------
 * 1. Frame protection
 * GitHub Pages doesn't let me send an X-Frame-Options header, so
 * this is the fallback: if another site loads my page inside an
 * iframe (clickjacking), hide everything and stop the script.
 * ------------------------------------------------------------- */
if (window.top !== window.self) {
  document.documentElement.style.display = "none";

  try {
    window.top.location.replace(window.self.location.href);
  } catch {
    // Most browsers block this from inside a frame — the page is hidden anyway.
  }

  throw new Error("Page was loaded inside a frame, stopping.");
}


/* ---------------------------------------------------------------
 * 2. Settings
 * ------------------------------------------------------------- */

// Web3Forms access key. It's meant to be public — all it can do is
// deliver form submissions to my own inbox.
const WEB3FORMS_KEY = "4dd9c5d2-81f8-47c4-9f30-46dd6e2654bd";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

// My email is joined together here instead of being written in the
// HTML, so basic scraper bots can't pick it up.
const CONTACT_EMAIL = ["amritthapa555", "gmail.com"].join("@");


/* ---------------------------------------------------------------
 * 3. Small helpers
 * ------------------------------------------------------------- */

// Short versions of querySelector / querySelectorAll
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// localStorage can throw in private mode or when storage is blocked,
// so every read and write goes through these safe wrappers.
const storage = {
  get(key) {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value, sessionOnly = false) {
    try {
      const store = sessionOnly ? sessionStorage : localStorage;
      store.setItem(key, value);
    } catch {
      // Not the end of the world if we can't save — just carry on.
    }
  },
};


/* ---------------------------------------------------------------
 * 4. Light / dark theme
 * Remembers the visitor's choice for next time.
 * ------------------------------------------------------------- */
const root = document.documentElement;
const themeButton = $("#themeToggle");

const savedTheme = storage.get("theme");
if (savedTheme) {
  root.dataset.theme = savedTheme;
}

themeButton?.addEventListener("click", () => {
  const newTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = newTheme;
  storage.set("theme", newTheme);
});


/* ---------------------------------------------------------------
 * 4b. Pause animations
 * The ❚❚ button stops everything that loops (marquee, rotating
 * word, spinning badge). It starts paused if the visitor's device
 * is set to "reduce motion". The choice is remembered.
 * ------------------------------------------------------------- */
const motionButton = $("#motionToggle");
const motionIcon = motionButton && $(".motion-icon", motionButton);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const savedMotion = storage.get("motion");
let motionPaused = savedMotion ? savedMotion === "paused" : prefersReducedMotion;

function setMotionPaused(paused) {
  motionPaused = paused;
  root.dataset.motion = paused ? "paused" : "running";

  if (!motionButton) return;

  motionButton.setAttribute("aria-pressed", paused);
  motionButton.setAttribute("aria-label", paused ? "Play animations" : "Pause animations");
  motionIcon.textContent = paused ? "▶" : "❚❚";
}

setMotionPaused(motionPaused);

motionButton?.addEventListener("click", () => {
  setMotionPaused(!motionPaused);
  storage.set("motion", motionPaused ? "paused" : "running");
});


/* ---------------------------------------------------------------
 * 5. Navigation
 * - Adds a background to the nav once you scroll down a bit
 * - Opens/closes the full-screen menu on mobile
 * ------------------------------------------------------------- */
const nav = $(".nav");
const menuButton = $("#menuBtn");
const navLinks = $("#navLinks");

window.addEventListener(
  "scroll",
  () => nav.classList.toggle("scrolled", window.scrollY > 30),
  { passive: true }
);

function setMenuOpen(isOpen) {
  if (!menuButton || !navLinks) return;

  navLinks.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  // Stop the page behind the menu from scrolling
  document.body.style.overflow = isOpen ? "hidden" : "";
}

menuButton?.addEventListener("click", () => {
  setMenuOpen(!navLinks.classList.contains("open"));
});

// Close the menu after tapping a link
$$("#navLinks a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

// ...or when pressing Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks?.classList.contains("open")) {
    setMenuOpen(false);
    menuButton.focus();
  }
});


/* ---------------------------------------------------------------
 * 6. Hero word rotator
 * Cycles the orange word in "I build web things that ___".
 * ------------------------------------------------------------- */
const rotatingWords = ["ship.", "scale.", "sell.", "delight."];
const rotator = $("#rotator");
let wordIndex = 0;

if (rotator) {
  setInterval(() => {
    if (motionPaused) return; // respect the pause button

    rotator.classList.add("out"); // fade the current word out

    setTimeout(() => {
      wordIndex = (wordIndex + 1) % rotatingWords.length;
      rotator.textContent = rotatingWords[wordIndex];
      rotator.classList.remove("out"); // fade the new word in
    }, 300);
  }, 2400);
}


/* ---------------------------------------------------------------
 * 7. Scroll reveal + number counters
 * Elements with .reveal slide in the first time they scroll into
 * view. Any .counter inside them counts up from 0.
 * ------------------------------------------------------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("in");
      $$(".counter", entry.target).forEach(countUp);

      // Only animate once
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);

$$(".reveal").forEach((el) => revealObserver.observe(el));

// When printing, show the final numbers even if the visitor never
// scrolled down far enough to trigger the count-up.
window.addEventListener("beforeprint", () => {
  $$(".counter").forEach((el) => {
    el.textContent = el.dataset.target + (el.dataset.suffix || "");
  });
});

function countUp(el) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || "";

  // No counting animation if motion is turned off — just show the number
  if (motionPaused) {
    el.textContent = target + suffix;
    return;
  }

  const duration = 1400;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out, slows down at the end

    el.textContent = Math.round(target * eased) + (progress === 1 ? suffix : "");

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}


/* ---------------------------------------------------------------
 * 8. Custom cursor + magnetic buttons
 * Only on devices with a real mouse — skipped on phones/tablets.
 * ------------------------------------------------------------- */
const hasMouse = window.matchMedia("(hover: hover)").matches;

if (hasMouse) {
  const cursor = $(".cursor");

  // Dot follows the mouse
  window.addEventListener("mousemove", (e) => {
    if (!cursor) return;
    cursor.style.opacity = 1;
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });

  // Dot grows when hovering anything clickable
  $$("a, button, .project").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor?.classList.add("big"));
    el.addEventListener("mouseleave", () => cursor?.classList.remove("big"));
  });

  // Buttons lean slightly towards the mouse
  $$(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (e) => {
      const box = button.getBoundingClientRect();
      const offsetX = (e.clientX - box.left - box.width / 2) * 0.25;
      const offsetY = (e.clientY - box.top - box.height / 2) * 0.35;
      button.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}


/* ---------------------------------------------------------------
 * 9. Project filters
 * Each project card has a data-cat. The buttons show only the
 * matching cards (or all of them).
 * ------------------------------------------------------------- */
const filterButtons = $$(".filter");
const projects = $$(".project");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;

    filterButtons.forEach((b) => {
      const isActive = b === button;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", isActive);
    });

    projects.forEach((project) => {
      const visible = category === "all" || project.dataset.cat === category;
      project.classList.toggle("hidden", !visible);

      // Make sure cards that haven't been scrolled to yet still show up
      if (visible) project.classList.add("in");
    });
  });
});


/* ---------------------------------------------------------------
 * 10. Opal Rush mini slot machine
 * Just a fun demo on the project card. Each reel spins, then stops
 * a little after the one before it.
 * ------------------------------------------------------------- */
const SLOT_SYMBOLS = ["💎", "🍒", "⭐", "🔔", "7️⃣", "🍀"];
const spinButton = $("#spinBtn");
const slotResult = $("#slotResult");
const reels = $$(".reel");

const randomSymbol = () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];

function showWinMessage(container, text) {
  const message = document.createElement("div");
  message.className = "win-flash";
  message.textContent = text;
  container.appendChild(message);
}

if (spinButton) {
  spinButton.addEventListener("click", () => {
    if (spinButton.disabled) return;
    spinButton.disabled = true;

    const machine = spinButton.parentElement;
    $(".win-flash", machine)?.remove(); // clear the last win message

    const results = [];

    reels.forEach((reel, i) => {
      const symbol = $("span", reel);
      reel.classList.add("spinning");

      // Flick through random symbols while spinning
      const flicker = setInterval(() => {
        symbol.textContent = randomSymbol();
      }, 70);

      // Stop each reel a bit later than the previous one
      setTimeout(() => {
        clearInterval(flicker);

        // Slightly rig it so visitors actually see a win now and then
        const matchFirstReel = i > 0 && Math.random() < 0.35;
        results[i] = matchFirstReel ? results[0] : randomSymbol();

        symbol.textContent = results[i];
        reel.classList.remove("spinning");

        const isLastReel = i === reels.length - 1;
        if (!isLastReel) return;

        spinButton.disabled = false;

        const allMatch = results.every((s) => s === results[0]);
        const twoMatch = results[0] === results[1] || results[1] === results[2];

        if (allMatch) showWinMessage(machine, "★ BIG WIN ★");
        else if (twoMatch) showWinMessage(machine, "Nice!");

        const outcome = allMatch ? "Big win!" : twoMatch ? "Two in a row!" : "No win, try again.";
        slotResult.textContent = `Result: ${results.join(" ")}. ${outcome}`;
      }, 600 + i * 350);
    });
  });
}


/* ---------------------------------------------------------------
 * 11. Lendly loan calculator
 * Demo only — assumes roughly 12% p.a. over 5 years.
 * ------------------------------------------------------------- */
const loanSlider = $("#loanRange");
const loanAmount = $("#loanAmt");
const loanRepayment = $("#loanRepay");

const ANNUAL_RATE = 0.12;
const LOAN_MONTHS = 60;

const formatDollars = (n) => "$" + Math.round(n).toLocaleString("en-AU");

if (loanSlider) {
  function updateLoan() {
    const principal = Number(loanSlider.value);
    const monthlyRate = ANNUAL_RATE / 12;

    // Standard amortised loan repayment formula
    const repayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -LOAN_MONTHS));

    loanAmount.textContent = formatDollars(principal);
    loanRepayment.textContent = `${formatDollars(repayment)}/mo`;
  }

  loanSlider.addEventListener("input", updateLoan);
  updateLoan();
}


/* ---------------------------------------------------------------
 * 12. Contact email link
 * Fills in the real mailto link (see CONTACT_EMAIL above).
 * ------------------------------------------------------------- */
$$("[data-email]").forEach((link) => {
  link.href = `mailto:${CONTACT_EMAIL}`;

  const label = $(".email-text", link);
  if (label) label.textContent = CONTACT_EMAIL;
});


/* ---------------------------------------------------------------
 * 13. Contact form
 * Sent through Web3Forms so there's no backend to look after.
 *
 * Layers of protection, roughly in the order they run:
 *   - hidden "botcheck" checkbox (bots tick it, people never see it)
 *   - too-fast check (nobody fills the form in under 4 seconds)
 *   - one message per minute, max 3 per visit
 *   - cleaning + validating every field
 *   - hCaptcha must be completed
 *   - 15 second timeout on the request
 * ------------------------------------------------------------- */
const form = $("#contactForm");

// The rest of this section only runs on pages that have the form
if (form) {
  const formStatus = $("#formStatus");
  const submitButton = $("button[type=submit]", form);

  const pageLoadedAt = Date.now();

  const MIN_FILL_TIME = 4000;        // 4 seconds
  const COOLDOWN = 60 * 1000;        // 1 minute between messages
  const MAX_MESSAGES_PER_VISIT = 3;
  const REQUEST_TIMEOUT = 15000;     // 15 seconds

  const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;
  const LINK_PATTERN = /(https?:\/\/|www\.)/i;
  const LINK_PATTERN_ALL = /(https?:\/\/|www\.)/gi;

  // Control characters and invisible "zero-width" characters that
  // spammers sometimes use to sneak things past filters.
  const HIDDEN_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

  function showStatus(message, type = "") {
    formStatus.textContent = message;
    formStatus.dataset.type = type; // "success" or "error" changes the colour
  }

  // Tidy up whatever the visitor typed before checking it
  function cleanInput(value, allowLineBreaks = false) {
    let text = String(value ?? "")
      .normalize("NFKC")
      .replace(HIDDEN_CHARACTERS, "");

    if (allowLineBreaks) {
      text = text
        .replace(/\r\n?/g, "\n")       // Windows line endings → \n
        .replace(/\n{4,}/g, "\n\n\n"); // no huge gaps
    } else {
      text = text.replace(/\s+/g, " ");
    }

    return text.trim();
  }

  // Returns [fieldName, errorMessage] for the first problem found,
  // or null if everything looks fine.
  function findProblem({ name, email, message }) {
    if (!name) return ["name", "Name is required."];
    if (name.length < 2 || name.length > 100) return ["name", "Please enter your name (2–100 characters)."];
    if (LINK_PATTERN.test(name) || /[<>{}]/.test(name)) return ["name", "Your name can't contain links or special symbols."];

    if (!email) return ["email", "Email is required."];
    if (email.length > 150 || !EMAIL_PATTERN.test(email)) return ["email", "Please enter a valid email address."];

    if (!message) return ["message", "Message is required."];
    if (message.length < 10) return ["message", "Your message is a bit short — tell me a little more."];
    if (message.length > 5000) return ["message", "Please keep your message under 5,000 characters."];

    const linkCount = (message.match(LINK_PATTERN_ALL) || []).length;
    if (linkCount > 2) return ["message", "Please include no more than 2 links."];

    return null;
  }

  function highlightField(fieldName) {
    const field = form.elements[fieldName];
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }

  function clearHighlights() {
    $$("[aria-invalid]", form).forEach((field) => field.removeAttribute("aria-invalid"));
  }

  // Remove the red highlight as soon as they start fixing a field
  $$("input, textarea", form).forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
  });

  async function sendToWeb3Forms(data, captchaToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio enquiry from ${data.name}`.slice(0, 150),
          from_name: "amritthapa.com",
          replyto: data.email,
          name: data.name,
          email: data.email,
          message: data.message,
          "h-captcha-response": captchaToken,
        }),
        signal: controller.signal,
        credentials: "omit",          // never send cookies
        referrerPolicy: "strict-origin",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const raw = Object.fromEntries(new FormData(form));

    // --- Bot traps -------------------------------------------------
    // If it looks like a bot, pretend it worked so it doesn't retry.
    const everythingFilled = ["name", "email", "message"].every((key) => cleanInput(raw[key]));
    const tooFast = Date.now() - pageLoadedAt < MIN_FILL_TIME;

    if (raw.botcheck || (everythingFilled && tooFast)) {
      form.reset();
      showStatus("Thanks! Your message is on its way.", "success");
      return;
    }

    // --- Rate limiting ---------------------------------------------
    const lastSentAt = Number(storage.get("contact_last")) || 0;
    const sentThisVisit = Number(storage.get("contact_count")) || 0;

    if (Date.now() - lastSentAt < COOLDOWN) {
      showStatus("Please wait a minute before sending another message.", "error");
      return;
    }

    if (sentThisVisit >= MAX_MESSAGES_PER_VISIT) {
      showStatus(`You've sent a few messages already — please email ${CONTACT_EMAIL} instead.`, "error");
      return;
    }

    // --- Validation ------------------------------------------------
    const data = {
      name: cleanInput(raw.name),
      email: cleanInput(raw.email).toLowerCase(),
      message: cleanInput(raw.message, true),
    };

    clearHighlights();

    const problem = findProblem(data);
    if (problem) {
      const [fieldName, errorMessage] = problem;
      highlightField(fieldName);
      showStatus(errorMessage, "error");
      return;
    }

    // --- Captcha ---------------------------------------------------
    const captchaToken = raw["h-captcha-response"];
    if (!captchaToken) {
      showStatus("Please complete the “I am human” check.", "error");
      return;
    }

    // --- Send ------------------------------------------------------
    const originalButtonHTML = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    showStatus("");

    try {
      await sendToWeb3Forms(data, captchaToken);

      storage.set("contact_last", String(Date.now()));
      storage.set("contact_count", String(sentThisVisit + 1), true);

      form.reset();
      showStatus("Thanks! Your message is on its way — I'll reply soon.", "success");
    } catch (error) {
      console.error("Contact form error:", error);

      const tookTooLong = error.name === "AbortError";
      showStatus(
        tookTooLong
          ? `That took too long. Please try again or email ${CONTACT_EMAIL}.`
          : `Sorry, that didn't send. Please try again or email ${CONTACT_EMAIL}.`,
        "error"
      );
    } finally {
      // A captcha token only works once, so reset it for the next try
      try {
        window.hcaptcha?.reset();
      } catch {
        /* captcha not loaded — nothing to reset */
      }

      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHTML;
    }
  });
}


/* ---------------------------------------------------------------
 * 13b. Load hCaptcha only when needed
 * The captcha script is ~100 KB+ from a third party. Rather than
 * loading it for every visitor, wait until the contact section is
 * about to scroll into view (or someone starts typing in the form).
 * ------------------------------------------------------------- */
if (form) {
  let captchaRequested = false;

  function loadCaptcha() {
    if (captchaRequested) return;
    captchaRequested = true;

    const captchaScript = document.createElement("script");
    captchaScript.src = "https://js.hcaptcha.com/1/api.js";
    captchaScript.async = true;
    document.head.appendChild(captchaScript);
  }

  const captchaObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadCaptcha();
        captchaObserver.disconnect();
      }
    },
    { rootMargin: "600px 0px" } // start loading a little before it's visible
  );

  captchaObserver.observe($("#contact"));
  form.addEventListener("focusin", loadCaptcha, { once: true });
}


/* ---------------------------------------------------------------
 * 14. Footer year
 * ------------------------------------------------------------- */
const yearSpan = $("#year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
