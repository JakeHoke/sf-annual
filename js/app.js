// ===== Config =====
const LOGGING_ENABLED_DEFAULT = true; // easy flag variable
const LOG_BUFFER_LIMIT = 500;

// ===== Logging (console + exportable file) =====
function createLogger({ enabledDefault, bufferLimit }) {
  let enabled = Boolean(enabledDefault);
  /** @type {{ts:string, level:string, msg:string, data?:any}[]} */
  const buffer = [];

  function nowIso() {
    return new Date().toISOString();
  }

  function addToBuffer(entry) {
    buffer.push(entry);
    if (buffer.length > bufferLimit) buffer.splice(0, buffer.length - bufferLimit);
  }

  function formatLine(entry) {
    const base = `[${entry.ts}] [${entry.level}] ${entry.msg}`;
    if (entry.data === undefined) return base;
    try {
      return `${base} ${JSON.stringify(entry.data)}`;
    } catch {
      return `${base} [unserializable data]`;
    }
  }

  function log(level, msg, data) {
    const entry = { ts: nowIso(), level, msg, data };
    addToBuffer(entry);

    if (enabled) {
      // print lines while coding
      if (level === "WARN") console.warn(msg, data ?? "");
      else if (level === "ERROR") console.error(msg, data ?? "");
      else console.log(msg, data ?? "");
    }

    return entry;
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    log("INFO", `Logging toggled: ${enabled ? "on" : "off"}`);
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function toText() {
    return buffer.map(formatLine).join("\n") + "\n";
  }

  function download(filename = "sf-logs.txt") {
    const blob = new Blob([toText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    log("INFO", "Downloaded logs file", { filename, bytes: blob.size });
  }

  return { log, setEnabled, isEnabled, toText, download };
}

// ===== UI helpers =====
function setActiveNavLink() {
  const sections = ["home", "features", "about", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const links = Array.from(document.querySelectorAll(".navbar a.nav-link"));
  if (links.length === 0 || sections.length === 0) return;

  function markActive(id) {
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("active", href === `#${id}`);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
      if (visible?.target?.id) markActive(visible.target.id);
    },
    { root: null, threshold: [0.2, 0.35, 0.5] }
  );

  sections.forEach((s) => observer.observe(s));
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ===== App =====
(function main() {
  const logger = createLogger({
    enabledDefault: LOGGING_ENABLED_DEFAULT,
    bufferLimit: LOG_BUFFER_LIMIT,
  });

  const $downloadLogsBtn = document.getElementById("downloadLogsBtn");
  const $toggleLogsBtn = document.getElementById("toggleLogsBtn");
  const $demoLogBtn = document.getElementById("demoLogBtn");
  const $demoWarnBtn = document.getElementById("demoWarnBtn");
  const $contactForm = document.getElementById("contactForm");
  const $clearFormBtn = document.getElementById("clearFormBtn");

  function updateLoggingUi() {
    if (!$toggleLogsBtn) return;
    const on = logger.isEnabled();
    $toggleLogsBtn.textContent = `Logging: ${on ? "on" : "off"}`;
  }

  function onLog(entry) {
    setText("lastLogLine", `[${entry.level}] ${entry.msg}`);
  }

  function info(msg, data) {
    const entry = logger.log("INFO", msg, data);
    onLog(entry);
    return entry;
  }

  function warn(msg, data) {
    const entry = logger.log("WARN", msg, data);
    onLog(entry);
    return entry;
  }

  info("Page loaded", {
    userAgent: navigator.userAgent,
    language: navigator.language,
  });

  setActiveNavLink();

  updateLoggingUi();

  $toggleLogsBtn?.addEventListener("click", () => {
    logger.setEnabled(!logger.isEnabled());
    updateLoggingUi();
  });

  $downloadLogsBtn?.addEventListener("click", () => {
    logger.download();
  });

  $demoLogBtn?.addEventListener("click", () => {
    info("Demo log clicked", { from: "about section" });
  });

  $demoWarnBtn?.addEventListener("click", () => {
    warn("Demo warning clicked", { from: "about section" });
    const pill = document.getElementById("statusPill");
    if (pill) {
      pill.className = "badge text-bg-warning";
      pill.textContent = "Check console";
    }
  });

  $clearFormBtn?.addEventListener("click", () => {
    $contactForm?.reset();
    setText("formStatus", "Cleared.");
    info("Contact form cleared");
  });

  $contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = /** @type {HTMLInputElement|null} */ (document.getElementById("nameInput"))?.value?.trim();
    const email = /** @type {HTMLInputElement|null} */ (document.getElementById("emailInput"))?.value?.trim();
    const message = /** @type {HTMLTextAreaElement|null} */ (document.getElementById("messageInput"))?.value?.trim();

    info("Contact form submitted", { name, email, messageLen: message?.length ?? 0 });
    setText("formStatus", "Sent (frontend-only). Check console + download logs if needed.");

    const pill = document.getElementById("statusPill");
    if (pill) {
      pill.className = "badge text-bg-success";
      pill.textContent = "Sent";
    }
  });
})();

