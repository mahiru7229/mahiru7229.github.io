(() => {
  "use strict";

  const REPO = "mahiru7229/mcw-launcher";
  const API = `https://api.github.com/repos/${REPO}/releases?per_page=100`;
  const RELEASES_URL = `https://github.com/${REPO}/releases`;
  const CACHE_KEY = "mcw-releases-v4";
  const CACHE_TTL = 10 * 60 * 1000;

  const state = {
    releases: [],
    stable: [],
    beta: [],
    channel: "release",
    selectedTag: null,
    query: "",
    loading: false,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const byId = (id) => document.getElementById(id);

  const els = {
    root: document.documentElement,
    topbar: $("[data-topbar]"),
    navToggle: $(".nav-toggle"),
    nav: byId("site-nav"),
    themeToggle: $(".theme-toggle"),
    pages: $$("[data-page]"),
    cursorGlow: $(".cursor-glow"),
    releaseList: byId("release-list"),
    releaseSearch: byId("release-search"),
    emptyState: byId("empty-state"),
    dataStatus: byId("data-status"),
    refreshButton: byId("refresh-releases"),
    detailPlaceholder: byId("detail-placeholder"),
    detailContent: byId("detail-content"),
    betaWarning: byId("beta-warning"),
    toast: $(".toast"),
  };

  function init() {
    initTheme();
    initNav();
    initReveal();
    initPointerEffects();
    initReleaseControls();
    byId("current-year").textContent = String(new Date().getFullYear());

    window.addEventListener("hashchange", () => routeFromHash({ scroll: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    routeFromHash({ scroll: false });
    loadReleases();
  }

  /* ------------------------- theme ------------------------- */
  function initTheme() {
    const stored = localStorage.getItem("mcw-theme");
    const preferred = window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const theme = stored === "light" || stored === "dark" ? stored : preferred;
    setTheme(theme);

    els.themeToggle?.addEventListener("click", () => {
      const next = els.root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("mcw-theme", next);
    });
  }

  function setTheme(theme) {
    els.root.dataset.theme = theme;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#07090d" : "#f4f4f0";
  }

  /* ------------------------- nav / route ------------------------- */
  function initNav() {
    els.navToggle?.addEventListener("click", () => {
      const open = els.nav?.classList.toggle("is-open");
      els.navToggle.setAttribute("aria-expanded", String(Boolean(open)));
    });

    els.nav?.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
      if (event.key === "/" && currentPage() === "download" && document.activeElement !== els.releaseSearch) {
        event.preventDefault();
        els.releaseSearch?.focus();
      }
    });
  }

  function closeNav() {
    els.nav?.classList.remove("is-open");
    els.navToggle?.setAttribute("aria-expanded", "false");
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw || raw === "home") return { page: "home", anchor: raw || "home" };
    if (["features", "workflow"].includes(raw)) return { page: "home", anchor: raw };

    const parts = raw.split("/").filter(Boolean);
    if (["download", "downloads"].includes(parts[0])) {
      const channel = parts[1] === "beta" ? "beta" : "release";
      const tag = parts[2] ? safeDecode(parts.slice(2).join("/")) : null;
      return { page: "download", channel, tag };
    }
    return { page: "home", anchor: "home" };
  }

  function routeFromHash({ scroll }) {
    const route = parseRoute();
    showPage(route.page);

    if (route.page === "download") {
      state.channel = route.channel || "release";
      state.selectedTag = route.tag || state.selectedTag;
      syncChannelUI();
      renderReleaseList();
      if (state.releases.length) {
        const desired = findByTag(state.selectedTag, state.channel) || channelItems()[0];
        if (desired) selectRelease(desired, { updateHash: false });
      }
      if (scroll) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      return;
    }

    if (scroll) {
      const target = route.anchor === "home" ? document.body : byId(route.anchor);
      requestAnimationFrame(() => target?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }));
    }
  }

  function showPage(name) {
    els.pages.forEach((page) => {
      const active = page.dataset.page === name;
      page.hidden = !active;
      page.classList.toggle("is-active", active);
    });
    document.body.dataset.page = name;
  }

  function currentPage() {
    return document.body.dataset.page || "home";
  }

  function onScroll() {
    els.topbar?.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  /* ------------------------- reveal / pointer ------------------------- */
  function initReveal() {
    $$(".reveal").forEach((el) => {
      const delay = Number(el.dataset.delay || 0);
      el.style.setProperty("--delay", `${delay}ms`);
    });

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    $$(".reveal").forEach((el) => io.observe(el));
  }

  function initPointerEffects() {
    if (window.matchMedia?.("(pointer: coarse)").matches || prefersReducedMotion()) return;

    window.addEventListener("pointermove", (event) => {
      if (els.cursorGlow) {
        els.cursorGlow.style.opacity = "1";
        els.cursorGlow.style.left = `${event.clientX}px`;
        els.cursorGlow.style.top = `${event.clientY}px`;
      }
    }, { passive: true });

    const stage = $(".hero-stage");
    const app = $("[data-parallax]");
    stage?.addEventListener("pointermove", (event) => {
      if (!app) return;
      const r = stage.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      app.style.transform = `rotateY(${(-9 + x * 7).toFixed(2)}deg) rotateX(${(3 - y * 5).toFixed(2)}deg) rotateZ(-1.4deg)`;
    });
    stage?.addEventListener("pointerleave", () => {
      if (app) app.style.transform = "rotateY(-9deg) rotateX(3deg) rotateZ(-1.4deg)";
    });

    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const r = el.getBoundingClientRect();
        const x = (event.clientX - r.left - r.width / 2) * 0.06;
        const y = (event.clientY - r.top - r.height / 2) * 0.06;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  /* ------------------------- release data ------------------------- */
  function initReleaseControls() {
    $$(".channel-tab").forEach((button) => {
      button.addEventListener("click", () => {
        const channel = button.dataset.channel === "beta" ? "beta" : "release";
        navigateToChannel(channel);
      });
    });

    els.releaseSearch?.addEventListener("input", () => {
      state.query = els.releaseSearch.value.trim().toLowerCase();
      renderReleaseList();
    });

    els.refreshButton?.addEventListener("click", () => loadReleases({ force: true }));

    byId("copy-release-link")?.addEventListener("click", async () => {
      const url = location.href;
      try {
        await navigator.clipboard.writeText(url);
        showToast("Đã sao chép liên kết release.");
      } catch {
        showToast("Không thể sao chép tự động. Hãy copy URL trên thanh địa chỉ.");
      }
    });
  }

  async function loadReleases({ force = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    setLoading(true);
    setStatus("loading", "Connecting to GitHub…");

    try {
      if (!force) {
        const cached = readCache();
        if (cached) {
          applyReleaseData(cached);
          setStatus("ready", "GitHub data · cached");
          return;
        }
      }

      const response = await fetch(API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);

      const data = await response.json();
      const releases = Array.isArray(data) ? data.filter((release) => !release.draft) : [];
      writeCache(releases);
      applyReleaseData(releases);
      setStatus("ready", "Live from GitHub");
    } catch (error) {
      const stale = readCache({ allowStale: true });
      if (stale?.length) {
        applyReleaseData(stale);
        setStatus("error", "GitHub unavailable · stale cache");
        showToast("GitHub API tạm thời không phản hồi. Đang dùng dữ liệu cache gần nhất.");
      } else {
        state.releases = [];
        state.stable = [];
        state.beta = [];
        renderAllReleaseMeta();
        renderReleaseList();
        setStatus("error", "GitHub unavailable");
        setDownloadFallbacks();
      }
      console.warn("MCW release fetch failed", error);
    } finally {
      state.loading = false;
      setLoading(false);
    }
  }

  function applyReleaseData(releases) {
    state.releases = releases;
    state.stable = releases.filter((r) => !r.prerelease);
    state.beta = releases.filter((r) => r.prerelease && isBetaOrRc(r));
    renderAllReleaseMeta();
    renderReleaseList();

    const route = parseRoute();
    if (route.page === "download") {
      const selected = findByTag(route.tag, state.channel) || channelItems()[0];
      if (selected) selectRelease(selected, { updateHash: false });
    }
  }

  function renderAllReleaseMeta() {
    const stable = state.stable[0];
    const beta = state.beta[0];
    const stableTag = stable?.tag_name || "Latest stable";
    const betaTag = beta?.tag_name || "No preview";

    setText("hero-stable-version", stable ? `Stable ${stableTag}` : "Stable channel");
    const stableWindows = stable ? platformAsset(stable, "windows") : null;
    const stableLinux = stable ? platformAsset(stable, "linux") : null;
    setText("hero-windows-version", stableWindows ? `Windows x64 · ${stableTag}` : "Windows x64 · archive");
    setText("hero-linux-version", stableLinux ? `Linux x64 · ${stableTag}` : "Linux x64 · awaiting build");
    setText("float-stable-version", stableTag);
    setText("float-beta-version", betaTag);
    setText("quick-stable-version", stableTag);
    setText("quick-beta-version", betaTag);
    setText("footer-stable-version", stableTag);
    setText("nav-version", stable?.tag_name || "latest");
    setText("stable-count", `${state.stable.length} release${state.stable.length === 1 ? "" : "s"}`);
    setText("beta-count", `${state.beta.length} preview${state.beta.length === 1 ? "" : "s"}`);
    setText("sidebar-stable-count", String(state.stable.length));
    setText("sidebar-beta-count", String(state.beta.length));

    configureHeroDownload("hero-windows-download", stableWindows, "Windows");
    configureHeroDownload("hero-linux-download", stableLinux, "Linux");

    const navDownload = byId("nav-download");
    if (navDownload) {
      navDownload.href = "#download/release";
      navDownload.removeAttribute("target");
      navDownload.removeAttribute("rel");
    }
  }

  function configureHeroDownload(id, asset, platformLabel) {
    const link = byId(id);
    if (!link) return;
    if (asset?.browser_download_url) {
      link.href = asset.browser_download_url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.setAttribute("aria-label", `Tải MCW Launcher Stable cho ${platformLabel}`);
      return;
    }
    link.href = "#download/release";
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.setAttribute("aria-label", `Xem các bản phát hành cho ${platformLabel}`);
  }

  function setDownloadFallbacks() {
    const heroWindows = byId("hero-windows-download");
    const heroLinux = byId("hero-linux-download");
    const nav = byId("nav-download");
    [heroWindows, heroLinux, nav].forEach((link) => {
      if (!link) return;
      link.href = RELEASES_URL;
      link.target = "_blank";
      link.rel = "noreferrer";
    });
    setText("hero-stable-version", "View GitHub releases");
    setText("hero-windows-version", "Windows x64 · GitHub");
    setText("hero-linux-version", "Linux x64 · GitHub");
  }

  function navigateToChannel(channel) {
    state.channel = channel;
    state.selectedTag = null;
    state.query = "";
    if (els.releaseSearch) els.releaseSearch.value = "";
    location.hash = `download/${channel}`;
  }

  function syncChannelUI() {
    $$(".channel-tab").forEach((button) => {
      const active = button.dataset.channel === state.channel;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    if (els.betaWarning) els.betaWarning.hidden = state.channel !== "beta";
  }

  function channelItems() {
    return state.channel === "beta" ? state.beta : state.stable;
  }

  function renderReleaseList() {
    if (!els.releaseList) return;
    syncChannelUI();
    const query = state.query;
    const items = channelItems().filter((release) => {
      if (!query) return true;
      const haystack = `${release.tag_name || ""} ${release.name || ""}`.toLowerCase();
      return haystack.includes(query);
    });

    els.releaseList.textContent = "";
    if (els.emptyState) els.emptyState.hidden = items.length > 0;

    items.forEach((release, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "release-item";
      if (release.tag_name === state.selectedTag) button.classList.add("is-active");
      button.dataset.tag = release.tag_name || "";

      const title = document.createElement("strong");
      title.textContent = release.tag_name || release.name || "Untitled release";
      const date = document.createElement("time");
      date.textContent = formatDate(release.published_at || release.created_at, true);
      const desc = document.createElement("small");
      desc.textContent = release.name && release.name !== release.tag_name ? release.name : index === 0 ? "Latest in this channel" : "GitHub release";
      const badge = document.createElement("span");
      badge.className = "release-badge";
      badge.textContent = index === 0 ? "LATEST" : releaseBadge(release);

      button.append(title, date, desc, badge);
      button.addEventListener("click", () => selectRelease(release, { updateHash: true }));
      els.releaseList.appendChild(button);
    });

    if (!items.length && !state.releases.length) {
      const link = document.createElement("a");
      link.href = RELEASES_URL;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.className = "release-item";
      const strong = document.createElement("strong");
      strong.textContent = "Open GitHub Releases ↗";
      const small = document.createElement("small");
      small.textContent = "Release data could not be loaded here.";
      link.append(strong, small);
      els.releaseList.appendChild(link);
      if (els.emptyState) els.emptyState.hidden = true;
    }
  }

  function selectRelease(release, { updateHash = true } = {}) {
    if (!release) return;
    state.selectedTag = release.tag_name;
    renderReleaseList();
    renderReleaseDetail(release);

    if (updateHash) {
      const next = `#download/${state.channel}/${encodeURIComponent(release.tag_name || "release")}`;
      history.replaceState(null, "", next);
    }
  }

  function renderReleaseDetail(release) {
    if (els.detailPlaceholder) els.detailPlaceholder.hidden = true;
    if (els.detailContent) els.detailContent.hidden = false;

    const latest = release === channelItems()[0];
    const windowsAsset = platformAsset(release, "windows");
    const linuxAsset = platformAsset(release, "linux");
    const buildCount = [windowsAsset, linuxAsset].filter(Boolean).length;

    setText("detail-channel", releaseChannelLabel(release));
    byId("detail-channel")?.classList.toggle("is-beta", Boolean(release.prerelease));
    setText("detail-tag", release.tag_name || "untagged");
    setText("detail-title", release.name || release.tag_name || "MCW Launcher release");
    setText("detail-date", formatDate(release.published_at || release.created_at));
    setText("detail-build-count", `${buildCount}/2 available`);

    const latestPill = byId("detail-latest");
    if (latestPill) latestPill.hidden = !latest;

    const github = byId("detail-github");
    if (github) github.href = release.html_url || RELEASES_URL;

    renderPlatformPackage("windows", windowsAsset, release);
    renderPlatformPackage("linux", linuxAsset, release);
    const notes = byId("release-notes");
    if (notes) notes.innerHTML = renderMarkdown(release.body || "_Không có release notes cho phiên bản này._");
  }

  function renderPlatformPackage(platform, asset, release) {
    const container = $(`[data-platform-package="${platform}"]`);
    const assetName = byId(`${platform}-asset-name`);
    const message = byId(`${platform}-asset-message`);
    const download = byId(`${platform}-download`);
    const label = platform === "windows" ? "Windows" : "Linux";

    container?.classList.toggle("is-unavailable", !asset);
    if (assetName) assetName.textContent = asset?.name || `${label} package not published`;
    if (message) message.textContent = asset
      ? `${formatBytes(asset.size)} · GitHub Release asset`
      : "Không có asset phù hợp trong release này";

    if (download) {
      if (asset?.browser_download_url) {
        download.href = asset.browser_download_url;
        download.classList.remove("is-disabled");
        download.setAttribute("aria-label", `Tải ${asset.name}`);
      } else {
        download.href = release.html_url || RELEASES_URL;
        download.classList.add("is-disabled");
        download.setAttribute("aria-label", `Chưa có gói ${label} cho release này`);
      }
    }

    renderChecksum(`${platform}-checksum`, checksumAsset(release, asset, platform));
  }

  async function renderChecksum(rowId, asset) {
    const row = byId(rowId);
    if (!row) return;
    if (!asset?.browser_download_url) {
      row.hidden = true;
      row.textContent = "";
      delete row.dataset.asset;
      return;
    }

    row.hidden = false;
    row.dataset.asset = asset.name || "checksum";
    row.textContent = `SHA-256: ${asset.name}`;
    try {
      if ((asset.size || 0) > 64 * 1024) return;
      const response = await fetch(asset.browser_download_url);
      if (!response.ok) return;
      const text = (await response.text()).trim();
      if (!text || text.length > 500) return;
      if (row.dataset.asset !== (asset.name || "checksum")) return;
      row.textContent = `SHA-256 · ${text}`;
    } catch {
      // Keep the checksum asset name as a useful fallback.
    }
  }

  function platformAsset(release, platform) {
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const files = assets.filter((asset) => /\.zip$/i.test(asset.name || "") && !/sha(?:256)?|checksum/i.test(asset.name || ""));
    const matchers = platform === "linux"
      ? [/linux[-_.]?x64/i, /x64[-_.]?linux/i, /linux[-_.]?(?:amd64|x86_64)/i]
      : [/windows[-_.]?x64/i, /x64[-_.]?windows/i, /win(?:dows)?[-_.]?(?:64|x64)/i];
    return files.find((asset) => matchers.some((pattern) => pattern.test(asset.name || ""))) || null;
  }

  function checksumAsset(release, packageAsset, platform) {
    if (!packageAsset) return null;
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const packageName = String(packageAsset.name || "");
    const exactNames = new Set([
      `${packageName}.sha256`.toLowerCase(),
      packageName.replace(/\.zip$/i, ".sha256").toLowerCase(),
      packageName.replace(/\.zip$/i, ".zip.sha256").toLowerCase(),
    ]);
    return (
      assets.find((asset) => exactNames.has(String(asset.name || "").toLowerCase())) ||
      assets.find((asset) => {
        const name = String(asset.name || "");
        return /sha(?:256)?|checksum/i.test(name) && new RegExp(platform, "i").test(name);
      }) ||
      null
    );
  }

  function releaseChannelLabel(release) {
    const tag = String(release?.tag_name || "").toLowerCase();
    if (!release?.prerelease) return "STABLE";
    if (/-rc(?:\.|-|$)/.test(tag)) return "RELEASE CANDIDATE";
    if (/-beta(?:\.|-|$)/.test(tag)) return "BETA";
    return "PRE-RELEASE";
  }

  function isBetaOrRc(release) {
    const tag = String(release?.tag_name || "").toLowerCase();
    return /-(?:beta|rc)(?:\.|-|$)/.test(tag);
  }

  function releaseBadge(release) {
    const label = releaseChannelLabel(release);
    if (label === "RELEASE CANDIDATE") return "RC";
    if (label === "PRE-RELEASE") return "PRE";
    if (label === "BETA") return "BETA";
    return "REL";
  }

  function findByTag(tag, channel = state.channel) {
    if (!tag) return null;
    const source = channel === "beta" ? state.beta : state.stable;
    return source.find((release) => release.tag_name === tag) || null;
  }

  /* ------------------------- cache / status ------------------------- */
  function readCache({ allowStale = false } = {}) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.data) || !parsed.time) return null;
      if (!allowStale && Date.now() - parsed.time > CACHE_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
    } catch {
      // Storage can be disabled; the site still works without cache.
    }
  }

  function setStatus(kind, text) {
    if (!els.dataStatus) return;
    els.dataStatus.classList.remove("is-ready", "is-error");
    if (kind === "ready") els.dataStatus.classList.add("is-ready");
    if (kind === "error") els.dataStatus.classList.add("is-error");
    const span = $("span", els.dataStatus);
    if (span) span.textContent = text;
  }

  function setLoading(active) {
    els.refreshButton?.classList.toggle("is-loading", active);
    if (els.refreshButton) els.refreshButton.disabled = active;
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast?.classList.remove("is-visible"), 2600);
  }

  /* ------------------------- formatting ------------------------- */
  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value;
  }

  function formatDate(value, short = false) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("vi-VN", short
      ? { day: "2-digit", month: "2-digit", year: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }
    ).format(date);
  }

  function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "—";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
    const value = n / 1024 ** i;
    return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
  }

  function safeDecode(value) {
    try { return decodeURIComponent(value); } catch { return value; }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeLink(url) {
    const clean = url.replaceAll("&amp;", "&");
    if (/^(https?:\/\/|mailto:)/i.test(clean)) return escapeHtml(clean);
    return "#";
  }

  function inlineMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => `<a href="${safeLink(url)}" target="_blank" rel="noreferrer">${label}</a>`);
    return html;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
    const output = [];
    let listType = null;
    let inCode = false;
    let codeBuffer = [];
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const closeList = () => {
      if (!listType) return;
      output.push(`</${listType}>`);
      listType = null;
    };
    const openList = (type) => {
      if (listType === type) return;
      closeList();
      listType = type;
      output.push(`<${type}>`);
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, "");

      if (/^```/.test(line.trim())) {
        flushParagraph(); closeList();
        if (inCode) {
          output.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
          codeBuffer = [];
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) { codeBuffer.push(rawLine); continue; }

      if (!line.trim()) {
        flushParagraph(); closeList();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph(); closeList();
        const level = heading[1].length;
        output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }

      const ul = line.match(/^\s*[-*+]\s+(.+)$/);
      if (ul) {
        flushParagraph(); openList("ul");
        output.push(`<li>${inlineMarkdown(ul[1])}</li>`);
        continue;
      }

      const ol = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (ol) {
        flushParagraph(); openList("ol");
        output.push(`<li>${inlineMarkdown(ol[1])}</li>`);
        continue;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph(); closeList();
        output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
        continue;
      }

      closeList();
      paragraph.push(line.trim());
    }

    if (inCode) output.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    flushParagraph(); closeList();
    return output.join("\n");
  }

  init();
})();
