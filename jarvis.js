(() => {
  const OWNER_NAME = "Moise T. Sahouo";
  const MANIFEST_PATH = "./manifest.webmanifest";
  const SW_PATH = "./sw.js";
  const CHAT_STORAGE_KEY = "chatbot_lang";
  const VOICE_STORAGE_KEY = "chatbot_voice_on";

  const I18N = {
    en: {
      title: "Ninja Chat",
      placeholder: "Type a message...",
      send: "Send",
      voiceOn: "Voice ON",
      voiceOff: "Voice OFF",
      hello: "Hello. I can guide you through this app.",
      help: "Try: where am I, xp, return, help.",
      unknown: "I can help with navigation, XP, and page guidance.",
      page: "You are on",
      canReturn: "Use Return to go to",
      xp: "Your XP is",
      noXp: "I could not find XP yet.",
      returning: "Returning to",
      returnLabel: "RETURN"
    },
    fr: {
      title: "Ninja Chat",
      placeholder: "Ecris un message...",
      send: "Envoyer",
      voiceOn: "Voix ON",
      voiceOff: "Voix OFF",
      hello: "Bonjour. Je peux te guider dans cette application.",
      help: "Essaye: ou suis-je, xp, retour, aide.",
      unknown: "Je peux aider avec navigation, XP et guidance de page.",
      page: "Tu es sur",
      canReturn: "Utilise Retour pour aller a",
      xp: "Ton XP est",
      noXp: "Je ne trouve pas encore le XP.",
      returning: "Retour vers",
      returnLabel: "RETOUR"
    }
  };

  const RETURN_MAP = {
    "admin.html": { href: "index.html", label: "Login" },
    "battle_engine.html": { href: "pitch_hub.html", label: "Pitch Hub" },
    "beat_machine.html": { href: "hub.html", label: "Hub" },
    "dashboard.html": { href: "hub.html", label: "Hub" },
    "hub.html": { href: "index.html", label: "Login" },
    "it_manager.html": { href: "index.html", label: "Login" },
    "it_recovery.html": { href: "index.html", label: "Login" },
    "it_vault.html": { href: "it_manager.html", label: "IT Manager" },
    "mini_studio.html": { href: "hub.html", label: "Hub" },
    "ninja_portal.html": { href: "index.html", label: "Login" },
    "pitch_hub.html": { href: "hub.html", label: "Hub" },
    "pitch_recognition.html": { href: "pitch_hub.html", label: "Pitch Hub" },
    "pitch_vocal.html": { href: "pitch_hub.html", label: "Pitch Hub" },
    "rhythm_hub.html": { href: "hub.html", label: "Hub" },
    "rhythm_ident.html": { href: "rhythm_hub.html", label: "Rhythm Hub" },
    "rhythm_practice.html": { href: "rhythm_hub.html", label: "Rhythm Hub" },
    "rhythm_strike.html": { href: "rhythm_hub.html", label: "Rhythm Hub" },
    "scroll_archive.html": { href: "sensei_dash.html", label: "Sensei Dash" },
    "studio.html": { href: "rhythm_hub.html", label: "Rhythm Hub" },
    "system_manual.html": { href: "it_manager.html", label: "IT Manager" },
    "system_status.html": { href: "it_manager.html", label: "IT Manager" }
  };

  let chatMessages;
  let chatInput;
  let chatPanel;
  let chatToggle;
  let voiceBtn;

  function getPageFile() {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase();
  }

  function getPageName() {
    return getPageFile().replace(".html", "").replace(/[_-]+/g, " ").trim() || "page";
  }

  function getLang() {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    return saved === "fr" ? "fr" : "en";
  }

  function setLang(lang) {
    localStorage.setItem(CHAT_STORAGE_KEY, lang === "fr" ? "fr" : "en");
  }

  function voiceEnabled() {
    return localStorage.getItem(VOICE_STORAGE_KEY) !== "false";
  }

  function setVoiceEnabled(enabled) {
    localStorage.setItem(VOICE_STORAGE_KEY, enabled ? "true" : "false");
  }

  function resolveReturnTarget() {
    const file = getPageFile();
    if (RETURN_MAP[file]) return RETURN_MAP[file];
    if (file.startsWith("pitch_")) return { href: "pitch_hub.html", label: "Pitch Hub" };
    if (file.startsWith("rhythm_")) return { href: "rhythm_hub.html", label: "Rhythm Hub" };
    if (file.startsWith("guitar_")) return { href: "hub.html", label: "Hub" };
    if (file.startsWith("it_")) return { href: "it_manager.html", label: "IT Manager" };
    if (file === "theory_vault.html") {
      return { href: "hub.html", label: "Hub" };
    }
    if (["interval_relations.html", "modal_logic.html"].includes(file)) {
      return { href: "pitch_hub.html", label: "Pitch Hub" };
    }
    return { href: "hub.html", label: "Hub" };
  }

  function safeSpeak(message, lang) {
    if (!("speechSynthesis" in window) || !voiceEnabled()) return;
    const text = String(message || "").trim();
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "fr" ? "fr-FR" : "en-US";
      utter.rate = 0.98;
      utter.pitch = 1.0;
      utter.volume = 0.9;

      const voices = window.speechSynthesis.getVoices() || [];
      const selected = voices.find((v) => (lang === "fr" ? v.lang.startsWith("fr") : v.lang.startsWith("en")));
      if (selected) utter.voice = selected;
      window.speechSynthesis.speak(utter);
    } catch (_err) {}
  }

  function appendMessage(role, text) {
    if (!chatMessages) return;
    const line = document.createElement("div");
    line.style.margin = "6px 0";
    line.style.fontSize = "12px";
    line.style.lineHeight = "1.35";
    line.style.color = role === "bot" ? "#dce9ff" : "#89ffcc";
    line.textContent = `${role === "bot" ? "Bot" : "You"}: ${text}`;
    chatMessages.appendChild(line);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getXPValue() {
    const raw = localStorage.getItem("totalXP");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
    return null;
  }

  function botReplyFor(message, lang) {
    const t = I18N[lang];
    const m = String(message || "").toLowerCase().trim();
    const target = resolveReturnTarget();

    if (!m) return t.help;
    if (/(help|aide|commands|commandes)/.test(m)) return t.help;
    if (/(where am i|where|ou suis-je|ou suis je|page)/.test(m)) return `${t.page} ${getPageName()}. ${t.canReturn} ${target.label}.`;
    if (/(xp|score|points?)/.test(m)) {
      const xp = getXPValue();
      return xp === null ? t.noXp : `${t.xp} ${xp}.`;
    }
    if (/(return|retour|back|go back)/.test(m)) {
      setTimeout(() => {
        location.href = target.href;
      }, 300);
      return `${t.returning} ${target.label}...`;
    }
    if (/(hello|hi|bonjour|salut)/.test(m)) return `${t.hello} ${t.help}`;
    return `${t.unknown} ${t.help}`;
  }

  function sendMessage() {
    const lang = getLang();
    const text = chatInput ? chatInput.value.trim() : "";
    if (!text) return;
    appendMessage("you", text);
    if (chatInput) chatInput.value = "";
    const reply = botReplyFor(text, lang);
    appendMessage("bot", reply);
    safeSpeak(reply, lang);
  }

  function ensurePWAHead() {
    if (!document.head) return;

    const upsertMeta = (attr, value, content) => {
      let node = document.head.querySelector(`meta[${attr}="${value}"]`);
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attr, value);
        document.head.appendChild(node);
      }
      node.setAttribute("content", content);
    };

    let manifest = document.head.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      manifest.href = MANIFEST_PATH;
      document.head.appendChild(manifest);
    }

    if (!document.head.querySelector('link[rel="icon"][href*="pitch-icon.svg"]')) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/svg+xml";
      icon.href = "icons/pitch-icon.svg";
      document.head.appendChild(icon);
    }

    upsertMeta("name", "theme-color", "#020406");
    upsertMeta("name", "apple-mobile-web-app-capable", "yes");
    upsertMeta("name", "apple-mobile-web-app-status-bar-style", "black-translucent");
    upsertMeta("name", "apple-mobile-web-app-title", "Ninja Music Academy");
  }

  function ensureOwnerFooter() {
    if (!document.body || !document.head) return;

    if (!document.getElementById("codex-owner-style")) {
      const style = document.createElement("style");
      style.id = "codex-owner-style";
      style.textContent = `
        #codex-owner-footer {
          position: fixed;
          left: 50%;
          bottom: 8px;
          transform: translateX(-50%);
          z-index: 9996;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(79, 172, 254, 0.35);
          background: rgba(2, 4, 6, 0.8);
          color: #9fceff;
          font-size: 10px;
          letter-spacing: 0.08em;
          pointer-events: none;
          font-family: "Orbitron", system-ui, -apple-system, "Segoe UI", sans-serif;
          backdrop-filter: blur(4px);
        }
      `;
      document.head.appendChild(style);
    }

    const existing = document.querySelector(".maker-footer, .owner-footer, #codex-owner-footer");
    if (existing) {
      existing.id = "codex-owner-footer";
      existing.textContent = OWNER_NAME;
      return;
    }

    const footer = document.createElement("footer");
    footer.id = "codex-owner-footer";
    footer.textContent = OWNER_NAME;
    document.body.appendChild(footer);
  }

  function isLegacyReturnNode(el) {
    if (!el || el.id === "codex-return-btn") return false;
    if (!(el instanceof HTMLElement)) return false;

    const text = (el.textContent || "").trim().toUpperCase();
    const cls = (el.className || "").toString().toUpperCase();
    const id = (el.id || "").toUpperCase();
    const href = el.tagName === "A" ? (el.getAttribute("href") || "") : "";
    const onclick = (el.getAttribute("onclick") || "").toUpperCase();

    const hasReturnWords = /(RETURN|BACK|EXIT|ABORT_MISSION|MISSION CONTROL)/.test(text) ||
      /(RETURN|BACK|EXIT)/.test(cls) ||
      /(RETURN|BACK|EXIT)/.test(id);

    if (!hasReturnWords) return false;

    const navigates = (el.tagName === "A" && /\.html($|[?#])/.test(href)) ||
      /LOCATION\.HREF|WINDOW\.LOCATION/.test(onclick);

    return navigates;
  }

  function hideLegacyReturnButtons() {
    const nodes = document.querySelectorAll("a,button");
    nodes.forEach((node) => {
      if (isLegacyReturnNode(node)) {
        node.style.display = "none";
      }
    });
  }

  function ensureReturnButton() {
    if (!document.body || !document.head) return;
    if (getPageFile() === "index.html") return;

    const lang = getLang();
    const t = I18N[lang];
    const target = resolveReturnTarget();

    if (!document.getElementById("codex-return-style")) {
      const style = document.createElement("style");
      style.id = "codex-return-style";
      style.textContent = `
        #codex-return-btn {
          position: fixed;
          left: 12px;
          top: 12px;
          z-index: 9997;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(2, 4, 6, 0.88);
          color: #ffffff;
          padding: 8px 11px;
          border-radius: 10px;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-decoration: none;
          font-family: "Orbitron", system-ui, -apple-system, "Segoe UI", sans-serif;
          box-shadow: 0 8px 18px rgba(0,0,0,0.35);
        }
      `;
      document.head.appendChild(style);
    }

    let btn = document.getElementById("codex-return-btn");
    if (!btn) {
      btn = document.createElement("a");
      btn.id = "codex-return-btn";
      document.body.appendChild(btn);
    }

    btn.href = target.href;
    btn.textContent = `${t.returnLabel}: ${target.label}`;
  }

  function ensureServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(SW_PATH).catch(() => {});
    });
  }

  function buildChatbot() {
    if (!document.body) return;
    const lang = getLang();
    const t = I18N[lang];

    if (!document.getElementById("codex-chat-style")) {
      const style = document.createElement("style");
      style.id = "codex-chat-style";
      style.textContent = `
        #codex-chat-toggle {
          position: fixed;
          right: 12px;
          bottom: 44px;
          z-index: 9999;
          border: 1px solid rgba(125,175,255,0.45);
          background: rgba(13,20,33,0.95);
          color: #dce9ff;
          border-radius: 999px;
          width: 42px;
          height: 42px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(0,0,0,0.35);
        }
        #codex-chat-panel {
          position: fixed;
          right: 12px;
          bottom: 92px;
          z-index: 9999;
          width: 260px;
          max-width: calc(100vw - 24px);
          border: 1px solid rgba(125,175,255,0.45);
          background: rgba(13,20,33,0.95);
          border-radius: 12px;
          color: #e9f2ff;
          box-shadow: 0 10px 24px rgba(0,0,0,0.35);
          backdrop-filter: blur(6px);
          padding: 8px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          display: none;
        }
        #codex-chat-panel.open { display: block; }
      `;
      document.head.appendChild(style);
    }

    chatToggle = document.getElementById("codex-chat-toggle");
    if (!chatToggle) {
      chatToggle = document.createElement("button");
      chatToggle.id = "codex-chat-toggle";
      chatToggle.type = "button";
      chatToggle.textContent = "CHAT";
      chatToggle.title = t.title;
      document.body.appendChild(chatToggle);
    }

    chatPanel = document.getElementById("codex-chat-panel");
    if (!chatPanel) {
      chatPanel = document.createElement("div");
      chatPanel.id = "codex-chat-panel";

      const titleRow = document.createElement("div");
      titleRow.style.display = "flex";
      titleRow.style.justifyContent = "space-between";
      titleRow.style.alignItems = "center";
      titleRow.style.marginBottom = "6px";

      const title = document.createElement("div");
      title.textContent = t.title;
      title.style.fontSize = "12px";
      title.style.fontWeight = "700";
      title.style.letterSpacing = "0.08em";
      title.style.color = "#98c0ff";

      const langBox = document.createElement("div");
      langBox.style.display = "flex";
      langBox.style.gap = "4px";

      const enBtn = document.createElement("button");
      enBtn.type = "button";
      enBtn.textContent = "EN";
      enBtn.style.fontSize = "10px";
      enBtn.style.border = "1px solid #5f86c7";
      enBtn.style.background = lang === "en" ? "#2b4d80" : "#20314d";
      enBtn.style.color = "#dce9ff";
      enBtn.style.borderRadius = "6px";
      enBtn.style.padding = "4px 6px";
      enBtn.style.cursor = "pointer";
      enBtn.onclick = () => { setLang("en"); location.reload(); };

      const frBtn = document.createElement("button");
      frBtn.type = "button";
      frBtn.textContent = "FR";
      frBtn.style.fontSize = "10px";
      frBtn.style.border = "1px solid #5f86c7";
      frBtn.style.background = lang === "fr" ? "#2b4d80" : "#20314d";
      frBtn.style.color = "#dce9ff";
      frBtn.style.borderRadius = "6px";
      frBtn.style.padding = "4px 6px";
      frBtn.style.cursor = "pointer";
      frBtn.onclick = () => { setLang("fr"); location.reload(); };

      langBox.appendChild(enBtn);
      langBox.appendChild(frBtn);
      titleRow.appendChild(title);
      titleRow.appendChild(langBox);

      chatMessages = document.createElement("div");
      chatMessages.style.height = "110px";
      chatMessages.style.overflowY = "auto";
      chatMessages.style.border = "1px solid rgba(255,255,255,0.1)";
      chatMessages.style.borderRadius = "8px";
      chatMessages.style.padding = "7px";
      chatMessages.style.background = "rgba(0,0,0,0.22)";
      chatMessages.style.marginBottom = "7px";

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "5px";

      chatInput = document.createElement("input");
      chatInput.type = "text";
      chatInput.placeholder = t.placeholder;
      chatInput.style.flex = "1";
      chatInput.style.border = "1px solid #5f86c7";
      chatInput.style.background = "#13263e";
      chatInput.style.color = "#e6f0ff";
      chatInput.style.borderRadius = "7px";
      chatInput.style.padding = "7px";
      chatInput.style.fontSize = "12px";
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
      });

      const sendBtn = document.createElement("button");
      sendBtn.type = "button";
      sendBtn.textContent = t.send;
      sendBtn.style.border = "1px solid #5f86c7";
      sendBtn.style.background = "#20314d";
      sendBtn.style.color = "#dce9ff";
      sendBtn.style.borderRadius = "7px";
      sendBtn.style.padding = "7px 8px";
      sendBtn.style.fontSize = "12px";
      sendBtn.style.cursor = "pointer";
      sendBtn.onclick = sendMessage;

      row.appendChild(chatInput);
      row.appendChild(sendBtn);

      voiceBtn = document.createElement("button");
      voiceBtn.type = "button";
      voiceBtn.textContent = voiceEnabled() ? t.voiceOn : t.voiceOff;
      voiceBtn.style.marginTop = "6px";
      voiceBtn.style.width = "100%";
      voiceBtn.style.border = "1px solid #5f86c7";
      voiceBtn.style.background = "#20314d";
      voiceBtn.style.color = "#dce9ff";
      voiceBtn.style.borderRadius = "7px";
      voiceBtn.style.padding = "6px";
      voiceBtn.style.fontSize = "11px";
      voiceBtn.style.cursor = "pointer";
      voiceBtn.onclick = () => {
        const next = !voiceEnabled();
        setVoiceEnabled(next);
        voiceBtn.textContent = next ? t.voiceOn : t.voiceOff;
      };

      chatPanel.appendChild(titleRow);
      chatPanel.appendChild(chatMessages);
      chatPanel.appendChild(row);
      chatPanel.appendChild(voiceBtn);
      document.body.appendChild(chatPanel);

      const target = resolveReturnTarget();
      appendMessage("bot", `${t.hello} ${t.page} ${getPageName()}. ${t.canReturn} ${target.label}.`);
    }

    chatToggle.onclick = () => {
      const isOpen = chatPanel.classList.contains("open");
      if (isOpen) {
        chatPanel.classList.remove("open");
      } else {
        chatPanel.classList.add("open");
      }
    };
  }

  function bootstrapGlobalAppFeatures() {
    ensurePWAHead();
    ensureOwnerFooter();
    hideLegacyReturnButtons();
    ensureReturnButton();
    ensureServiceWorker();
    buildChatbot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapGlobalAppFeatures);
  } else {
    bootstrapGlobalAppFeatures();
  }
})();
