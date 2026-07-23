"use strict";

const REPOSITORY = "mahiru7229/mcw-launcher";
const GITHUB_API = `https://api.github.com/repos/${REPOSITORY}/releases`;
const GITHUB_RELEASES = `https://github.com/${REPOSITORY}/releases`;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const CACHE_KEY = "mcw-launcher-release-cache-v2";
const CACHE_TTL_MS = 15 * 60 * 1000;

const FALLBACK_RELEASES = [
  {
    id: "fallback-stable",
    tag_name: "v0.5.1",
    name: "MCW Launcher v0.5.1",
    body: "## MCW Launcher v0.5.1\n\nBản Stable đầu tiên của dòng v0.5.x. Không thể tải dữ liệu release note mới từ GitHub ở thời điểm hiện tại. Hãy mở trang GitHub Release để xem nội dung đầy đủ.",
    prerelease: false,
    draft: false,
    published_at: "2026-07-16T00:00:00Z",
    html_url: `${GITHUB_RELEASES}/tag/v0.5.1`,
    assets: [{
      name: "MCW-Launcher-v0.5.1-windows-x64.zip",
      size: 0,
      download_count: 0,
      browser_download_url: `${GITHUB_RELEASES}/download/v0.5.1/MCW-Launcher-v0.5.1-windows-x64.zip`
    }]
  },
  {
    id: "fallback-beta",
    tag_name: "v0.6.0-rc.1",
    name: "MCW Launcher v0.6.0 RC 1",
    body: "## MCW Launcher v0.6.0 RC 1\n\nRelease Candidate của dòng 0.6. Không thể tải dữ liệu release note mới từ GitHub ở thời điểm hiện tại. Hãy mở trang GitHub Release để xem nội dung đầy đủ.",
    prerelease: true,
    draft: false,
    published_at: "2026-07-23T00:00:00Z",
    html_url: `${GITHUB_RELEASES}/tag/v0.6.0-rc.1`,
    assets: [{
      name: "MCW-Launcher-v0.6.0-rc.1-windows-x64.zip",
      size: 0,
      download_count: 0,
      browser_download_url: `${GITHUB_RELEASES}/download/v0.6.0-rc.1/MCW-Launcher-v0.6.0-rc.1-windows-x64.zip`
    }]
  }
];

const state = {
  releases: [],
  channels: { release: [], beta: [] },
  activePage: "home",
  activeChannel: "release",
  selectedTag: null,
  search: "",
  usingFallback: false
};

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function renderInlineMarkdown(value) {
  let text = escapeHtml(value);
  const codeTokens = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@INLINE_CODE_${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${label}</a>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, "$1<em>$2</em>");
  codeTokens.forEach((code, index) => { text = text.replace(`@@INLINE_CODE_${index}@@`, code); });
  return text;
}

function markdownToHtml(markdown) {
  const source = String(markdown || "").replace(/\r\n?/g, "\n").trim();
  if (!source) return "<p>Phiên bản này chưa có release note.</p>";

  const codeBlocks = [];
  const protectedSource = source.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    const className = language.trim() ? ` class="language-${escapeHtml(language.trim())}"` : "";
    codeBlocks.push(`<pre><code${className}>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return `\n${token}\n`;
  });

  const lines = protectedSource.split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let quoteLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${renderInlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listType || !listItems.length) return;
    output.push(`<${listType}>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };
  const flushQuote = () => {
    if (!quoteLines.length) return;
    output.push(`<blockquote>${quoteLines.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join("")}</blockquote>`);
    quoteLines = [];
  };
  const flushBlocks = () => { flushParagraph(); flushList(); flushQuote(); };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (/^@@CODE_BLOCK_\d+@@$/.test(trimmed)) {
      flushBlocks();
      const index = Number(trimmed.match(/\d+/)[0]);
      output.push(codeBlocks[index]);
      continue;
    }
    if (!trimmed) {
      flushBlocks();
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushBlocks();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (/^(?:---+|\*\*\*+|___+)$/.test(trimmed)) {
      flushBlocks();
      output.push("<hr>");
      continue;
    }
    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      quoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unordered[1]);
      continue;
    }
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(ordered[1]);
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flushBlocks();
  return output.join("\n");
}

function formatDate(value) {
  if (!value) return "Chưa rõ ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ ngày";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "Kích thước chưa rõ";
  const units = ["B", "KB", "MB", "GB"];
  let result = value;
  let unit = 0;
  while (result >= 1024 && unit < units.length - 1) {
    result /= 1024;
    unit += 1;
  }
  const digits = result >= 100 || unit === 0 ? 0 : 1;
  return `${result.toFixed(digits)} ${units[unit]}`;
}

function releaseName(release) {
  return (release.name || release.tag_name || "MCW Launcher").trim();
}

function getDownloadAsset(release) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const usable = assets.filter((asset) => !/\.sha256(?:\.txt)?$/i.test(asset.name || ""));
  return usable.find((asset) => /windows[-_. ]?x64.*\.zip$/i.test(asset.name || ""))
    || usable.find((asset) => /\.zip$/i.test(asset.name || ""))
    || null;
}

function getChecksumAsset(release, downloadAsset) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  if (downloadAsset) {
    const exact = assets.find((asset) => asset.name === `${downloadAsset.name}.sha256` || asset.name === `${downloadAsset.name}.sha256.txt`);
    if (exact) return exact;
  }
  return assets.find((asset) => /\.sha256(?:\.txt)?$/i.test(asset.name || "")) || null;
}

function sortReleases(releases) {
  return [...releases].sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
}

function splitChannels(releases) {
  const publicReleases = releases.filter((release) => !release.draft);
  state.channels.release = sortReleases(publicReleases.filter((release) => !release.prerelease));
  state.channels.beta = sortReleases(publicReleases.filter((release) => release.prerelease));
}

function readCache() {
  try {
    const payload = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!payload || !Array.isArray(payload.releases)) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeCache(releases) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), releases }));
  } catch {
    // The site still works when localStorage is unavailable.
  }
}

async function fetchPage(page) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${GITHUB_API}?per_page=${PAGE_SIZE}&page=${page}`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new TypeError("Invalid GitHub releases response");
    return payload;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchAllReleases() {
  const releases = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await fetchPage(page);
    releases.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return releases;
}

function setDataStatus(message, type = "loading") {
  const status = $("data-status");
  status.className = `data-status ${type}`;
  status.querySelector("span:last-child").textContent = message;
}

async function loadReleases({ force = false } = {}) {
  const refreshButton = $("refresh-releases");
  refreshButton.classList.add("is-loading");
  refreshButton.disabled = true;
  setDataStatus("Đang tải danh sách từ GitHub...", "loading");

  const cache = readCache();
  if (!force && cache?.releases?.length) {
    state.releases = cache.releases;
    state.usingFallback = false;
    splitChannels(state.releases);
    renderEverything();
    const age = Date.now() - Number(cache.savedAt || 0);
    setDataStatus(age < CACHE_TTL_MS ? "Đã tải từ bộ nhớ đệm · đang đồng bộ" : "Dữ liệu cũ · đang đồng bộ", "ready");
    if (age < CACHE_TTL_MS) {
      refreshButton.classList.remove("is-loading");
      refreshButton.disabled = false;
      return;
    }
  }

  try {
    const releases = await fetchAllReleases();
    if (!releases.length) throw new Error("No public releases found");
    state.releases = releases;
    state.usingFallback = false;
    writeCache(releases);
    splitChannels(releases);
    renderEverything();
    setDataStatus(`Đã đồng bộ ${releases.length} phiên bản từ GitHub`, "ready");
  } catch (error) {
    console.warn("Unable to load GitHub releases", error);
    if (cache?.releases?.length) {
      state.releases = cache.releases;
      state.usingFallback = false;
      splitChannels(state.releases);
      renderEverything();
      setDataStatus("Không thể kết nối GitHub · đang dùng dữ liệu đã lưu", "error");
    } else {
      state.releases = FALLBACK_RELEASES;
      state.usingFallback = true;
      splitChannels(state.releases);
      renderEverything();
      setDataStatus("Không thể kết nối GitHub · đang dùng dữ liệu dự phòng", "error");
    }
  } finally {
    refreshButton.classList.remove("is-loading");
    refreshButton.disabled = false;
  }
}

function updateHomeVersions() {
  const stable = state.channels.release[0];
  const beta = state.channels.beta[0];
  if (stable) {
    const name = releaseName(stable);
    $("hero-stable-version").textContent = name;
    $("float-stable-version").textContent = stable.tag_name;
    $("quick-stable-version").textContent = name;
    $("hero-stable-download").href = `#download/release/${encodeURIComponent(stable.tag_name)}`;
  }
  if (beta) {
    const name = releaseName(beta);
    $("float-beta-version").textContent = beta.tag_name;
    $("quick-beta-version").textContent = name;
    $("home-beta-link").href = `#download/beta/${encodeURIComponent(beta.tag_name)}`;
  }
}

function getFilteredReleases() {
  const list = state.channels[state.activeChannel] || [];
  const query = state.search.trim().toLocaleLowerCase("vi");
  if (!query) return list;
  return list.filter((release) => `${release.tag_name || ""} ${releaseName(release)}`.toLocaleLowerCase("vi").includes(query));
}

function renderReleaseList() {
  const listElement = $("release-list");
  const emptyState = $("empty-state");
  const releases = getFilteredReleases();
  listElement.replaceChildren();
  emptyState.hidden = releases.length > 0;
  listElement.hidden = releases.length === 0;

  releases.forEach((release, index) => {
    const asset = getDownloadAsset(release);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `release-item${release.tag_name === state.selectedTag ? " active" : ""}`;
    button.dataset.tag = release.tag_name;
    button.innerHTML = `
      <div class="release-item-top">
        <span class="release-item-tag">${escapeHtml(release.tag_name)}</span>
        ${index === 0 && !state.search ? '<span class="release-item-latest">MỚI NHẤT</span>' : ""}
      </div>
      <strong>${escapeHtml(releaseName(release))}</strong>
      <div class="release-item-bottom">
        <span>${formatDate(release.published_at)}</span>
        <span>${asset ? formatBytes(asset.size) : "Không có ZIP"}</span>
      </div>`;
    button.addEventListener("click", () => selectRelease(release.tag_name, true));
    listElement.append(button);
  });
}

function renderReleaseDetail() {
  const releases = state.channels[state.activeChannel] || [];
  let release = releases.find((item) => item.tag_name === state.selectedTag);
  if (!release && releases.length) {
    release = releases[0];
    state.selectedTag = release.tag_name;
  }

  $("detail-placeholder").hidden = Boolean(release);
  $("detail-content").hidden = !release;
  if (!release) return;

  const detail = $("release-detail");
  const asset = getDownloadAsset(release);
  const checksum = getChecksumAsset(release, asset);
  const isLatest = releases[0]?.tag_name === release.tag_name;
  const download = $("detail-download");

  detail.classList.toggle("beta-detail", state.activeChannel === "beta");
  $("detail-channel").textContent = state.activeChannel === "beta" ? "BETA / RC" : "RELEASE";
  $("detail-latest").hidden = !isLatest;
  $("detail-title").textContent = releaseName(release);
  $("detail-tag").textContent = release.tag_name;
  $("detail-date").textContent = `Phát hành ${formatDate(release.published_at)}`;
  $("detail-size").textContent = asset ? `${formatBytes(asset.size)} · ${Number(asset.download_count || 0).toLocaleString("vi-VN")} lượt tải` : "Chưa có gói Windows x64";
  $("detail-github").href = safeUrl(release.html_url || `${GITHUB_RELEASES}/tag/${encodeURIComponent(release.tag_name)}`);
  $("release-notes").innerHTML = markdownToHtml(release.body);

  if (asset) {
    download.href = safeUrl(asset.browser_download_url);
    download.removeAttribute("aria-disabled");
    $("detail-asset-name").textContent = asset.name;
    $("asset-message").hidden = true;
  } else {
    download.href = "#";
    download.setAttribute("aria-disabled", "true");
    $("detail-asset-name").textContent = "Chưa có file ZIP";
    $("asset-message").textContent = "Release này chưa có asset Windows x64. Hãy mở GitHub để kiểm tra các file hiện có.";
    $("asset-message").hidden = false;
  }

  const checksumLink = $("detail-checksum");
  checksumLink.hidden = !checksum;
  if (checksum) checksumLink.href = safeUrl(checksum.browser_download_url);
}

function renderChannelState() {
  const isBeta = state.activeChannel === "beta";
  $$(".channel-tab").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.channel === state.activeChannel)));
  $("beta-warning").hidden = !isBeta;
  $("release-browser").classList.toggle("beta-mode", isBeta);
  $("stable-count").textContent = String(state.channels.release.length);
  $("beta-count").textContent = String(state.channels.beta.length);
}

function renderEverything() {
  updateHomeVersions();
  renderChannelState();
  renderReleaseList();
  renderReleaseDetail();
}

function selectRelease(tag, updateHash = false) {
  state.selectedTag = tag;
  renderReleaseList();
  renderReleaseDetail();
  if (updateHash) setHash("download", state.activeChannel, tag);
  if (window.innerWidth <= 820) $("release-detail").scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectChannel(channel, tag = null, updateHash = false) {
  if (!["release", "beta"].includes(channel)) channel = "release";
  state.activeChannel = channel;
  state.search = "";
  $("release-search").value = "";
  const releases = state.channels[channel] || [];
  state.selectedTag = tag && releases.some((release) => release.tag_name === tag) ? tag : releases[0]?.tag_name || null;
  renderChannelState();
  renderReleaseList();
  renderReleaseDetail();
  if (updateHash) setHash("download", channel, state.selectedTag);
}

function setPage(page) {
  state.activePage = page === "download" ? "download" : "home";
  $$('[data-page]').forEach((section) => { section.hidden = section.dataset.page !== state.activePage; });
  $$('[data-page-link]').forEach((link) => link.classList.toggle("active", link.dataset.pageLink === state.activePage));
  document.body.classList.toggle("download-page-open", state.activePage === "download");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setHash(page, channel, tag) {
  const parts = [page];
  if (page === "download") parts.push(channel || "release");
  if (tag) parts.push(encodeURIComponent(tag));
  const hash = `#${parts.join("/")}`;
  if (window.location.hash !== hash) window.history.pushState(null, "", hash);
}

function applyRoute() {
  const segments = window.location.hash.replace(/^#/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const page = segments[0] === "download" ? "download" : "home";
  setPage(page);
  if (page === "download") selectChannel(segments[1] || "release", segments[2] || null, false);
}

function setupNavigation() {
  const menuButton = document.querySelector(".menu-button");
  const navigation = $("main-navigation");
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));
  window.addEventListener("hashchange", applyRoute);
  window.addEventListener("popstate", applyRoute);
}

function setupTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("mcw-site-theme");
  if (stored === "light" || stored === "dark") root.dataset.theme = stored;
  document.querySelector(".theme-button").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("mcw-site-theme", root.dataset.theme);
  });
}

function setupInteractions() {
  $$(".channel-tab").forEach((button) => button.addEventListener("click", () => selectChannel(button.dataset.channel, null, true)));
  $("release-search").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderReleaseList();
  });
  $("refresh-releases").addEventListener("click", () => loadReleases({ force: true }));
  $("copy-release-link").addEventListener("click", async () => {
    const button = $("copy-release-link");
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "Đã sao chép";
    } catch {
      button.textContent = "Không thể sao chép";
    }
    window.setTimeout(() => { button.textContent = "Sao chép liên kết"; }, 1600);
  });
  window.addEventListener("scroll", () => document.querySelector(".site-header").classList.toggle("is-scrolled", window.scrollY > 10), { passive: true });
}

function setupReveal() {
  const elements = $$(".reveal");
  elements.forEach((element) => element.style.setProperty("--delay", `${Number(element.dataset.delay || 0)}ms`));
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  elements.forEach((element) => observer.observe(element));
}

function initialize() {
  $("current-year").textContent = String(new Date().getFullYear());
  setupTheme();
  setupNavigation();
  setupInteractions();
  setupReveal();

  const cache = readCache();
  state.releases = cache?.releases?.length ? cache.releases : FALLBACK_RELEASES;
  state.usingFallback = !cache?.releases?.length;
  splitChannels(state.releases);
  applyRoute();
  renderEverything();
  loadReleases();
}

document.addEventListener("DOMContentLoaded", initialize);
