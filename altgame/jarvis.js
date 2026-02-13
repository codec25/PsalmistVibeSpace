(() => {
  const STORAGE_KEY = "jarvis_enabled";
  const VIEW_KEY = "jarvis_collapsed";
  const isEnabled = () => localStorage.getItem(STORAGE_KEY) !== "false";
  const setEnabled = (v) => localStorage.setItem(STORAGE_KEY, v ? "true" : "false");
  const isCollapsed = () => localStorage.getItem(VIEW_KEY) !== "false";
  const setCollapsed = (v) => localStorage.setItem(VIEW_KEY, v ? "true" : "false");

  let card;
  let miniBtn;
  let panel;
  let textNode;
  let toggleBtn;

  function safeSpeak(message) {
    if (!("speechSynthesis" in window) || !isEnabled()) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(message || ""));
      u.rate = 0.97;
      u.pitch = 1.02;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (_err) {}
  }

  function pageGuide() {
    const path = (location.pathname.split("/").pop() || "page").replace(".html", "");
    const pretty = path.replace(/[_-]+/g, " ").trim();
    return `You are on ${pretty || "this page"}. I can guide you.`;
  }

  function setMessage(message, speak = false) {
    if (!textNode) return;
    textNode.textContent = message;
    if (speak) safeSpeak(message);
  }

  function toggleJarvis() {
    const next = !isEnabled();
    setEnabled(next);
    toggleBtn.textContent = next ? "Voice ON" : "Voice OFF";
    setMessage(next ? "Jarvis enabled. Ask: where am I?" : "Jarvis disabled.", next);
  }

  function askWhereAmI() {
    setMessage(pageGuide(), true);
  }

  function syncView() {
    const collapsed = isCollapsed();
    if (!card || !miniBtn) return;
    card.style.display = collapsed ? "none" : "block";
    miniBtn.style.display = collapsed ? "inline-flex" : "none";
  }

  function expandJarvis() {
    setCollapsed(false);
    syncView();
  }

  function collapseJarvis() {
    setCollapsed(true);
    syncView();
  }

  function buildUI() {
    const root = document.createElement("div");
    root.id = "jarvis-widget";
    root.style.position = "fixed";
    root.style.right = "14px";
    root.style.bottom = "14px";
    root.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    root.style.zIndex = "9999";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "flex-end";

    miniBtn = document.createElement("button");
    miniBtn.textContent = "Jarvis";
    miniBtn.style.border = "1px solid rgba(125,175,255,0.45)";
    miniBtn.style.background = "rgba(13,20,33,0.9)";
    miniBtn.style.color = "#dce9ff";
    miniBtn.style.borderRadius = "999px";
    miniBtn.style.padding = "8px 12px";
    miniBtn.style.fontSize = "12px";
    miniBtn.style.cursor = "pointer";
    miniBtn.style.boxShadow = "0 10px 24px rgba(0,0,0,0.35)";
    miniBtn.onclick = expandJarvis;

    card = document.createElement("div");
    card.style.width = "224px";
    card.style.maxWidth = "calc(100vw - 28px)";
    card.style.background = "rgba(13,20,33,0.9)";
    card.style.border = "1px solid rgba(125,175,255,0.45)";
    card.style.borderRadius = "12px";
    card.style.color = "#e9f2ff";
    card.style.boxShadow = "0 10px 24px rgba(0,0,0,0.35)";
    card.style.backdropFilter = "blur(6px)";
    card.style.padding = "8px";

    const title = document.createElement("div");
    title.style.display = "flex";
    title.style.alignItems = "center";
    title.style.justifyContent = "space-between";
    title.style.marginBottom = "6px";

    const titleText = document.createElement("span");
    titleText.textContent = "JARVIS GUIDE";
    titleText.style.fontWeight = "700";
    titleText.style.fontSize = "11px";
    titleText.style.letterSpacing = "0.08em";
    titleText.style.color = "#98c0ff";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.border = "none";
    closeBtn.style.background = "transparent";
    closeBtn.style.color = "#9db5da";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.lineHeight = "1";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.padding = "0 2px";
    closeBtn.onclick = collapseJarvis;

    title.appendChild(titleText);
    title.appendChild(closeBtn);

    panel = document.createElement("div");
    panel.style.fontSize = "11px";
    panel.style.lineHeight = "1.45";
    panel.style.marginBottom = "8px";
    panel.style.minHeight = "28px";

    textNode = document.createElement("div");
    panel.appendChild(textNode);

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "6px";

    const whereBtn = document.createElement("button");
    whereBtn.textContent = "Where?";
    whereBtn.style.flex = "1";
    whereBtn.style.border = "1px solid #5f86c7";
    whereBtn.style.background = "#20314d";
    whereBtn.style.color = "#dce9ff";
    whereBtn.style.borderRadius = "7px";
    whereBtn.style.padding = "6px";
    whereBtn.style.fontSize = "11px";
    whereBtn.style.cursor = "pointer";
    whereBtn.onclick = askWhereAmI;

    toggleBtn = document.createElement("button");
    toggleBtn.textContent = isEnabled() ? "Voice ON" : "Voice OFF";
    toggleBtn.style.flex = "1";
    toggleBtn.style.border = "1px solid #5f86c7";
    toggleBtn.style.background = "#20314d";
    toggleBtn.style.color = "#dce9ff";
    toggleBtn.style.borderRadius = "7px";
    toggleBtn.style.padding = "6px";
    toggleBtn.style.fontSize = "11px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.onclick = toggleJarvis;

    row.appendChild(whereBtn);
    row.appendChild(toggleBtn);

    card.appendChild(title);
    card.appendChild(panel);
    card.appendChild(row);
    root.appendChild(miniBtn);
    root.appendChild(card);
    document.body.appendChild(root);

    setMessage(pageGuide(), false);
    syncView();
    if (isEnabled()) safeSpeak(pageGuide());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
