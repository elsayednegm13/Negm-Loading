const ENDPOINT = "http://127.0.0.1:45791";

const I18N = {
  ar: {
    dir: "rtl",
    langToggle: "EN",
    connTitle: "حالة الاتصال",
    checking: "جاري الفحص...",
    online: "متصل ونشط",
    offline: "البرنامج مغلق",
    autoTitle: "الالتقاط التلقائي للتنزيلات",
    autoSub: "اعتراض الروابط المباشرة وتمرير الكوكيز",
    btnVideo: "تحميل فيديو هذه الصفحة",
    btnSpider: "استخراج كل روابط وملفات الصفحة",
    btnDialog: "إضافة رابط الصفحة يدويًا",
    errNoTab: "افتح صفحة ويب صالحة أولاً",
    sending: "جاري الإرسال إلى Negm Lodaing...",
    sentOk: "✔ تم الإرسال إلى برنامج Negm Lodaing بنجاح",
    sentErr: "تأكد من تشغيل برنامج Negm Lodaing وتفعيل الجسر",
  },
  en: {
    dir: "ltr",
    langToggle: "عربي",
    connTitle: "Bridge Status",
    checking: "Checking...",
    online: "Connected",
    offline: "App Offline",
    autoTitle: "Auto-Capture Downloads",
    autoSub: "Intercept direct files & forward cookies",
    btnVideo: "Download Video on This Page",
    btnSpider: "Extract All Links & Media",
    btnDialog: "Send Page URL Manually",
    errNoTab: "Open a valid HTTP/HTTPS page first",
    sending: "Sending to Negm Lodaing...",
    sentOk: "✔ Sent to Negm Lodaing",
    sentErr: "Ensure Negm Lodaing is running with Bridge enabled",
  },
};

const hasChromeExt =
  typeof chrome !== "undefined" &&
  Boolean(chrome.storage && chrome.storage.local);

if (location.protocol === "chrome-extension:" || location.protocol === "moz-extension:") {
  document.documentElement.setAttribute("data-popup", "1");
}

const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const chkAuto = document.getElementById("chkAuto");
const msgBox = document.getElementById("msgBox");
const btnLang = document.getElementById("btnLang");
const btnTheme = document.getElementById("btnTheme");
const btnVideo = document.getElementById("btnVideo");
const btnSpider = document.getElementById("btnSpider");
const btnDialog = document.getElementById("btnDialog");

let state = {
  lang: "ar",
  theme: "dark",
  isOnline: null,
  isBusy: false,
};

function readPrefs(cb) {
  const defaults = { autoIntercept: true, uiLang: "ar", uiTheme: "dark" };
  if (hasChromeExt) {
    chrome.storage.local.get(defaults, (cfg) => cb(cfg || defaults));
    return;
  }
  try {
    cb({
      autoIntercept: localStorage.getItem("negm_auto") !== "0",
      uiLang: localStorage.getItem("negm_lang") || "ar",
      uiTheme: localStorage.getItem("negm_theme") || "dark",
    });
  } catch (_) {
    cb(defaults);
  }
}

function savePrefs(patch) {
  if (hasChromeExt) {
    chrome.storage.local.set(patch);
    return;
  }
  try {
    if ("autoIntercept" in patch) localStorage.setItem("negm_auto", patch.autoIntercept ? "1" : "0");
    if ("uiLang" in patch) localStorage.setItem("negm_lang", patch.uiLang);
    if ("uiTheme" in patch) localStorage.setItem("negm_theme", patch.uiTheme);
  } catch (_) {}
}

function t(key) {
  const dict = I18N[state.lang] || I18N.ar;
  return dict[key] || key;
}

function renderUI() {
  const dict = I18N[state.lang] || I18N.ar;
  document.documentElement.lang = state.lang;
  document.documentElement.dir = dict.dir;
  document.documentElement.setAttribute("data-theme", state.theme);

  btnLang.textContent = dict.langToggle;
  const sunIcon = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonIcon = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  btnTheme.innerHTML = state.theme === "dark" ? sunIcon : moonIcon;
  document.getElementById("lblConnTitle").textContent = dict.connTitle;
  document.getElementById("lblAutoTitle").textContent = dict.autoTitle;
  document.getElementById("lblAutoSub").textContent = dict.autoSub;
  document.getElementById("lblBtnVideo").textContent = dict.btnVideo;
  document.getElementById("lblBtnSpider").textContent = dict.btnSpider;
  document.getElementById("lblBtnDialog").textContent = dict.btnDialog;

  if (state.isOnline === true) {
    statusText.textContent = dict.online;
    statusPill.classList.add("online");
  } else if (state.isOnline === false) {
    statusText.textContent = dict.offline;
    statusPill.classList.remove("online");
  } else {
    statusText.textContent = dict.checking;
    statusPill.classList.remove("online");
  }
}

function setFeedback(text, kind = "") {
  msgBox.textContent = text;
  if (kind) {
    msgBox.setAttribute("data-state", kind);
  } else {
    msgBox.removeAttribute("data-state");
  }
}

function setBusy(busy) {
  state.isBusy = busy;
  btnVideo.disabled = busy;
  btnSpider.disabled = busy;
  btnDialog.disabled = busy;
}

async function checkStatus() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 900);
    const r = await fetch(`${ENDPOINT}/ping`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (r.ok) {
      state.isOnline = true;
      renderUI();
      return true;
    }
  } catch (_) {}
  state.isOnline = false;
  renderUI();
  return false;
}

async function sendCurrentTab(mode) {
  if (state.isBusy) return;
  if (!hasChromeExt || !chrome.tabs) {
    setFeedback(t("sentErr"), "err");
    return;
  }

  setBusy(true);
  setFeedback(t("sending"));
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith("http")) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs.length && tabs[0].url && tabs[0].url.startsWith("http")) {
        tab = tabs[0];
      }
    }
    if (!tab || !tab.url || !tab.url.startsWith("http")) {
      setFeedback(t("errNoTab"), "err");
      setBusy(false);
      return;
    }

    const payload = {
      url: tab.url,
      referrer: tab.url,
      title: tab.title || "",
      mode: mode
    };

    const directSend = async () => {
      try {
        let cookieStr = "";
        if (chrome.cookies) {
          try {
            const cookies = await chrome.cookies.getAll({ url: tab.url });
            if (cookies && cookies.length) {
              cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
            }
          } catch (_) {}
        }
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), 1800);
        const res = await fetch(`${ENDPOINT}/add`, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(Object.assign({}, payload, {
            cookies: cookieStr,
            userAgent: navigator.userAgent
          })),
          signal: ctrl.signal
        });
        clearTimeout(tm);
        return res.ok;
      } catch (_) {
        return false;
      }
    };

    let resolved = false;
    const finish = (ok) => {
      if (resolved) return;
      resolved = true;
      setBusy(false);
      if (ok) {
        state.isOnline = true;
        renderUI();
        setFeedback(t("sentOk"), "ok");
        setTimeout(() => window.close(), 650);
      } else {
        setFeedback(t("sentErr"), "err");
      }
    };

    try {
      chrome.runtime.sendMessage(
        { type: "Negm Lodaing_ACTION", payload },
        async (resp) => {
          if (resolved) return;
          if (resp && resp.ok) {
            finish(true);
            return;
          }
          const directOk = await directSend();
          finish(directOk);
        }
      );
    } catch (_) {
      const directOk = await directSend();
      finish(directOk);
    }

    setTimeout(async () => {
      if (resolved) return;
      const directOk = await directSend();
      finish(directOk);
    }, 2200);

  } catch (_) {
    setBusy(false);
    setFeedback(t("sentErr"), "err");
  }
}

// URL query overrides for deterministic responsive/theme/locale QA testing
const params = new URLSearchParams(location.search);

readPrefs((cfg) => {
  chkAuto.checked = Boolean(cfg.autoIntercept);
  state.lang = params.get("lang") || (cfg.uiLang === "en" ? "en" : "ar");
  state.theme = params.get("theme") || (cfg.uiTheme === "light" ? "light" : "dark");
  renderUI();
  checkStatus();
});

chkAuto.addEventListener("change", () => {
  savePrefs({ autoIntercept: chkAuto.checked });
});

btnLang.addEventListener("click", () => {
  state.lang = state.lang === "ar" ? "en" : "ar";
  savePrefs({ uiLang: state.lang });
  setFeedback("");
  renderUI();
});

btnTheme.addEventListener("click", (e) => {
  const newTheme = state.theme === "dark" ? "light" : "dark";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || prefersReduced) {
    state.theme = newTheme;
    savePrefs({ uiTheme: state.theme });
    renderUI();
    return;
  }

  const rect = btnTheme.getBoundingClientRect();
  const x = e.clientX || (rect.left + rect.width / 2);
  const y = e.clientY || (rect.top + rect.height / 2);
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  document.documentElement.style.setProperty("--reveal-x", `${x}px`);
  document.documentElement.style.setProperty("--reveal-y", `${y}px`);
  document.documentElement.style.setProperty("--reveal-r", `${endRadius}px`);

  const transition = document.startViewTransition(() => {
    state.theme = newTheme;
    savePrefs({ uiTheme: state.theme });
    renderUI();
  });

  transition.finished.finally(() => {
    document.documentElement.style.removeProperty("--reveal-x");
    document.documentElement.style.removeProperty("--reveal-y");
    document.documentElement.style.removeProperty("--reveal-r");
  });
});

btnVideo.addEventListener("click", () => sendCurrentTab("media"));
btnSpider.addEventListener("click", () => sendCurrentTab("spider"));
btnDialog.addEventListener("click", () => sendCurrentTab("dialog"));
