// alt.html — optional console logging (toggle with ALT_LOG_ENABLED)

const ALT_LOG_ENABLED = true;

function altLog(msg, data) {
  const line = data !== undefined ? `${msg} ${JSON.stringify(data)}` : msg;
  if (ALT_LOG_ENABLED) console.log("[alt]", line);
}

document.addEventListener("DOMContentLoaded", () => {
  altLog("alt.html loaded", { path: window.location.pathname });
});
