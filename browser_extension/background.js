const NegmLoading_ENDPOINT = "http://127.0.0.1:45791";

const INTERCEPT_EXTS = [
  ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".iso",
  ".exe", ".msi", ".apk", ".dmg", ".deb", ".rpm",
  ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv",
  ".mp3", ".m4a", ".flac", ".wav", ".aac", ".ogg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".epub",
  ".torrent", ".bin", ".img"
];

let autoIntercept = true;
const capturedDownloadIds = new Set();

// Synchronize autoIntercept settings cache
chrome.storage.local.get({ autoIntercept: true }, (cfg) => {
  autoIntercept = Boolean(cfg.autoIntercept);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.autoIntercept !== undefined) {
    autoIntercept = Boolean(changes.autoIntercept.newValue);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ autoIntercept: true }, (cfg) => {
    chrome.storage.local.set({ autoIntercept: cfg.autoIntercept });
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "negm_dl_link",
      title: "⬇ التحميل بواسطة Negm Lodaing",
      contexts: ["link", "video", "audio", "image"]
    });
    chrome.contextMenus.create({
      id: "negm_dl_video",
      title: "🎬 إرسال الفيديو لساحب فيديوهات Negm Lodaing",
      contexts: ["page", "link", "video"]
    });
    chrome.contextMenus.create({
      id: "negm_spider_page",
      title: "🌐 استخراج كل روابط وملفات الصفحة في Negm Lodaing",
      contexts: ["page"]
    });
  });
});

async function getCookieHeader(targetUrl) {
  if (!chrome.cookies || !targetUrl) return "";
  try {
    const p = chrome.cookies.getAll({ url: targetUrl });
    const timeout = new Promise((resolve) => setTimeout(() => resolve([]), 400));
    const cookies = await Promise.race([p, timeout]);
    if (!cookies || !cookies.length) return "";
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (_) {
    return "";
  }
}

async function sendToNegm(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1800);
  try {
    let cookieStr = "";
    try {
      cookieStr = await getCookieHeader(payload.url);
    } catch (_) {}
    const body = Object.assign({}, payload, {
      cookies: cookieStr,
      userAgent: navigator.userAgent
    });
    const res = await fetch(`${NegmLoading_ENDPOINT}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch (_) {
    clearTimeout(timer);
    return false;
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const pageUrl = (tab && tab.url) || info.pageUrl || "";
  if (info.menuItemId === "negm_dl_link") {
    const target = info.linkUrl || info.srcUrl;
    if (target) {
      await sendToNegm({ url: target, referrer: pageUrl, mode: "dialog" });
    }
  } else if (info.menuItemId === "negm_dl_video") {
    const target = info.linkUrl || info.srcUrl || pageUrl;
    if (target) {
      await sendToNegm({ url: target, referrer: pageUrl, mode: "media" });
    }
  } else if (info.menuItemId === "negm_spider_page") {
    if (pageUrl) {
      await sendToNegm({ url: pageUrl, referrer: pageUrl, mode: "spider" });
    }
  }
});

function shouldInterceptDownload(item) {
  if (!item) return false;
  // 1. Check determined filename
  const fn = (item.filename || "").toLowerCase();
  if (fn && INTERCEPT_EXTS.some((ext) => fn.endsWith(ext))) {
    return true;
  }

  // 2. Check target URL
  const url = (item.finalUrl || item.url || "").toLowerCase();
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  const pathPart = url.split("?")[0].split("#")[0];
  if (INTERCEPT_EXTS.some((ext) => pathPart.endsWith(ext))) return true;

  // 3. Check query string parameters for embedded filenames
  if (INTERCEPT_EXTS.some((ext) => url.includes(ext))) return true;

  // 4. Check MIME type
  const mime = (item.mime || "").toLowerCase();
  if (mime && (
    mime.includes("zip") || mime.includes("compressed") ||
    mime.includes("octet-stream") || mime.includes("video/") ||
    mime.includes("audio/") || mime.includes("pdf") ||
    mime.includes("x-msdownload") || mime.includes("x-iso") ||
    mime.includes("application/x-")
  )) {
    return true;
  }

  // 5. Check file size (files >= 2MB)
  const size = item.fileSize || item.totalBytes || 0;
  if (size >= 2 * 1024 * 1024) return true;

  return false;
}

// Intercept downloads at the determining filename stage (Standard Chrome Extension API)
if (chrome.downloads && chrome.downloads.onDeterminingFilename) {
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (!autoIntercept || !shouldInterceptDownload(item)) {
      suggest();
      return;
    }

    if (capturedDownloadIds.has(item.id)) {
      suggest();
      return;
    }
    capturedDownloadIds.add(item.id);

    const targetUrl = item.finalUrl || item.url;
    const cleanFn = item.filename ? item.filename.split(/[\\/]/).pop() : "";

    sendToNegm({
      url: targetUrl,
      filename: cleanFn,
      referrer: item.referrer || "",
      mode: "auto"
    }).then((ok) => {
      if (ok) {
        try {
          chrome.downloads.cancel(item.id, () => {
            chrome.downloads.erase({ id: item.id });
          });
        } catch (_) {}
      } else {
        suggest();
      }
    });

    return true; // asynchronous suggest resolution
  });
}

// Fallback trigger for instant downloads on created (if determiningFilename was bypassed)
if (chrome.downloads && chrome.downloads.onCreated) {
  chrome.downloads.onCreated.addListener((item) => {
    if (item.state && item.state !== "in_progress") return;
    if (!autoIntercept || !shouldInterceptDownload(item)) return;
    if (capturedDownloadIds.has(item.id)) return;

    // Small delay to allow onDeterminingFilename primary handler
    setTimeout(() => {
      if (capturedDownloadIds.has(item.id)) return;
      capturedDownloadIds.add(item.id);
      const targetUrl = item.finalUrl || item.url;
      const cleanFn = item.filename ? item.filename.split(/[\\/]/).pop() : "";

      sendToNegm({
        url: targetUrl,
        filename: cleanFn,
        referrer: item.referrer || "",
        mode: "auto"
      }).then((ok) => {
        if (ok) {
          try {
            chrome.downloads.cancel(item.id, () => {
              chrome.downloads.erase({ id: item.id });
            });
          } catch (_) {}
        }
      });
    }, 200);
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && (msg.type === "NegmLoading_ACTION" || msg.type === "NEGM_ACTION")) {
    sendToNegm(msg.payload).then((ok) => sendResponse({ ok }));
    return true;
  }
  if (msg && msg.type === "PING") {
    sendResponse({ ok: true, version: "1.0.0" });
    return false;
  }
});
