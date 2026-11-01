// Negm Lodaing Content Script - Floating Video Grabber, Stream Sniffer & Link Interceptor
(function () {
  if (window.__negm_sniffer_installed__) return;
  window.__negm_sniffer_installed__ = true;

  let activeVideo = null;
  let snifferBar = null;
  let hideTimer = null;
  let autoInterceptEnabled = true;

  const INTERCEPT_EXTS = [
    ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".iso",
    ".exe", ".msi", ".apk", ".dmg", ".deb", ".rpm",
    ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv",
    ".mp3", ".m4a", ".flac", ".wav", ".aac", ".ogg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".epub",
    ".torrent", ".bin", ".img"
  ];

  // Synchronous cache of autoIntercept setting
  try {
    chrome.storage.local.get({ autoIntercept: true }, (cfg) => {
      autoInterceptEnabled = Boolean(cfg.autoIntercept);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.autoIntercept !== undefined) {
        autoInterceptEnabled = Boolean(changes.autoIntercept.newValue);
      }
    });
  } catch (_) {}

  const I18N = {
    ar: {
      btnTitle: "تحميل هذا الفيديو",
      bestVideo: "🎬 فيديو MP4 (أفضل جودة)",
      audioOnly: "🎵 استخراج الصوت (MP3)",
      openDialog: "⚙ خيارات الجودة المتقدمة",
      sent: "✔ تم الإرسال لـ Negm Lodaing",
    },
    en: {
      btnTitle: "Download Video",
      bestVideo: "🎬 MP4 Video (Best)",
      audioOnly: "🎵 Audio Only (MP3)",
      openDialog: "⚙ Advanced Quality Dialog",
      sent: "✔ Sent to Negm Lodaing",
    },
  };

  function getLang() {
    const docLang = (document.documentElement.lang || navigator.language || "ar").toLowerCase();
    return docLang.startsWith("ar") ? "ar" : "en";
  }

  function isMediaPlatformPage() {
    const host = location.hostname.toLowerCase();
    return [
      "youtube.com", "youtu.be", "tiktok.com", "facebook.com", "instagram.com",
      "twitter.com", "x.com", "vimeo.com", "dailymotion.com", "bilibili.com",
      "twitch.tv", "soundcloud.com", "vk.com", "reddit.com"
    ].some((p) => host === p || host.endsWith("." + p));
  }

  function createSnifferBar() {
    if (window !== window.top) return null;
    if (snifferBar && snifferBar.isConnected) return snifferBar;

    const lang = getLang();
    const t = I18N[lang];
    const isRtl = lang === "ar";

    const bar = document.createElement("div");
    bar.id = "negm-video-sniffer-bar";
    bar.setAttribute("data-dir", isRtl ? "rtl" : "ltr");
    bar.innerHTML = `
      <div class="negm-sniffer-pill" title="Negm Lodaing Video Grabber">
        <svg class="negm-sniffer-icon" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
        </svg>
        <span class="negm-sniffer-label">${t.btnTitle}</span>
        <span class="negm-sniffer-badge">Negm</span>
        <span class="negm-sniffer-toggle" title="خيارات إضافية">▼</span>
      </div>
      <div class="negm-sniffer-dropdown">
        <div class="negm-dropdown-item" data-action="best">
          <span>${t.bestVideo}</span>
          <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
        </div>
        <div class="negm-dropdown-item" data-action="audio">
          <span>${t.audioOnly}</span>
          <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <div class="negm-dropdown-item" data-action="dialog">
          <span>${t.openDialog}</span>
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </div>
      </div>
    `;

    const pill = bar.querySelector(".negm-sniffer-pill");
    const toggle = bar.querySelector(".negm-sniffer-toggle");

    // Clicking the toggle opens the dropdown
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      bar.classList.toggle("open");
    });

    // Clicking the pill itself triggers default download action
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      if (bar.classList.contains("open")) {
        bar.classList.remove("open");
        return;
      }
      triggerDownload("best");
    });

    bar.querySelectorAll(".negm-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        bar.classList.remove("open");
        const action = item.getAttribute("data-action");
        triggerDownload(action);
      });
    });

    // Keep visible while hovering over bar
    bar.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
    });

    bar.addEventListener("mouseleave", () => {
      scheduleHide();
    });

    document.addEventListener("click", (e) => {
      if (!bar.contains(e.target)) {
        bar.classList.remove("open");
      }
    });

    // Always attach to top-level document element for viewport-fixed isolation
    (document.body || document.documentElement).appendChild(bar);
    snifferBar = bar;
    return bar;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (snifferBar && !snifferBar.matches(":hover") && !snifferBar.classList.contains("open")) {
        // If on a dedicated video platform watch page, keep docked rather than fully removing
        if (isMediaPlatformPage()) {
          // keep docked subtly
          snifferBar.classList.remove("open");
        } else {
          snifferBar.classList.remove("visible");
          snifferBar.classList.remove("open");
        }
      }
    }, 2400);
  }

  function positionBarForVideo(video) {
    if (window !== window.top) return;
    const bar = createSnifferBar();
    if (!bar) return;
    if (!video || !video.isConnected) {
      if (isMediaPlatformPage()) {
        bar.style.top = "16px";
        bar.style.right = "16px";
        bar.style.left = "auto";
        bar.classList.add("visible");
      }
      return;
    }

    const rect = video.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 70) {
      return;
    }

    activeVideo = video;
    clearTimeout(hideTimer);

    // Dynamic viewport positioning: 10px inside top-right of the video bounding box
    const topPos = Math.max(12, Math.min(window.innerHeight - 60, rect.top + 10));
    const rightPos = Math.max(12, Math.min(window.innerWidth - 120, window.innerWidth - rect.right + 12));

    bar.style.top = `${topPos}px`;
    bar.style.right = `${rightPos}px`;
    bar.style.left = "auto";
    bar.classList.add("visible");
  }

  function getTargetMediaUrl() {
    if (isMediaPlatformPage()) {
      return location.href;
    }

    if (activeVideo) {
      if (activeVideo.currentSrc && !activeVideo.currentSrc.startsWith("blob:")) {
        return activeVideo.currentSrc;
      }
      if (activeVideo.src && !activeVideo.src.startsWith("blob:")) {
        return activeVideo.src;
      }
      const source = activeVideo.querySelector("source[src]");
      if (source && source.src && !source.src.startsWith("blob:")) {
        return source.src;
      }
    }

    // Check all page videos for a non-blob src
    const videos = document.querySelectorAll("video");
    for (const v of videos) {
      const src = v.currentSrc || v.src;
      if (src && !src.startsWith("blob:")) {
        return src;
      }
    }

    return location.href;
  }

  function triggerDownload(action) {
    const url = getTargetMediaUrl();
    const t = I18N[getLang()];
    const bar = createSnifferBar();
    const pill = bar.querySelector(".negm-sniffer-pill");
    const label = bar.querySelector(".negm-sniffer-label");

    let mode = "media";
    let isAudio = false;

    if (action === "audio") {
      mode = "media";
      isAudio = true;
    } else if (action === "dialog") {
      mode = "dialog";
    }

    chrome.runtime.sendMessage(
      {
        type: "Negm Lodaing_ACTION",
        payload: {
          url: url,
          referrer: location.href,
          mode: mode,
          title: document.title,
          audio_only: isAudio,
        },
      },
      (res) => {
        if (res && res.ok) {
          pill.classList.add("negm-sniffer-success");
          label.textContent = t.sent;
          setTimeout(() => {
            pill.classList.remove("negm-sniffer-success");
            label.textContent = t.btnTitle;
          }, 3500);
        }
      }
    );
  }

  function bindVideoEvents(video) {
    if (!video || video.__negm_bound__) return;
    video.__negm_bound__ = true;

    const onActive = () => positionBarForVideo(video);

    video.addEventListener("mouseenter", onActive);
    video.addEventListener("mousemove", onActive);
    video.addEventListener("play", onActive);
    video.addEventListener("playing", onActive);
    video.addEventListener("canplay", onActive);
    video.addEventListener("mouseleave", () => scheduleHide());

    // Also bind to player container if any
    const player = video.closest(
      ".html5-video-player, ytd-player, #movie_player, #player, .video-js, .jwplayer, .plyr, " +
      "[class*='video-player'], [class*='player-container'], [class*='PlayerContainer'], " +
      "[class*='player_container'], [id*='player']"
    );
    if (player && !player.__negm_bound__) {
      player.__negm_bound__ = true;
      player.addEventListener("mouseenter", onActive);
      player.addEventListener("mousemove", onActive);
      player.addEventListener("mouseleave", () => scheduleHide());
    }
  }

  function scanForVideos() {
    const videos = document.querySelectorAll("video");
    for (const v of videos) {
      bindVideoEvents(v);
      const rect = v.getBoundingClientRect();
      if (rect.width >= 140 && rect.height >= 80 && !v.paused) {
        positionBarForVideo(v);
      }
    }

    if (isMediaPlatformPage() && window === window.top) {
      const bar = createSnifferBar();
      if (bar) bar.classList.add("visible");
    }
  }

  // Intercept Direct Download Link Clicks on Pages (Unless Alt is held)
  document.addEventListener("click", (e) => {
    if (e.altKey) return; // Holding Alt allows native browser download
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.href || "";
    if (!href.startsWith("http://") && !href.startsWith("https://")) return;

    const cleanUrl = href.toLowerCase().split("?")[0].split("#")[0];
    const dlAttr = (a.getAttribute("download") || "").toLowerCase();

    const matchesExt = INTERCEPT_EXTS.some((ext) => cleanUrl.endsWith(ext) || dlAttr.endsWith(ext));
    if (matchesExt && autoInterceptEnabled) {
      // Synchronous cancellation to ensure browser does not initiate default navigation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      chrome.runtime.sendMessage({
        type: "Negm Lodaing_ACTION",
        payload: {
          url: href,
          referrer: location.href,
          mode: "auto",
          filename: a.getAttribute("download") || ""
        }
      });
      return false;
    }
  }, true);

  // Scan triggers
  window.addEventListener("load", scanForVideos);
  document.addEventListener("DOMContentLoaded", scanForVideos);
  setInterval(scanForVideos, 1500);

  // SPA navigation observers (YouTube, Twitter/X, TikTok, Facebook)
  window.addEventListener("yt-navigate-finish", scanForVideos);
  window.addEventListener("yt-page-data-updated", scanForVideos);
  window.addEventListener("spfdone", scanForVideos);
  window.addEventListener("popstate", scanForVideos);

  const obs = new MutationObserver(() => {
    scanForVideos();
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
