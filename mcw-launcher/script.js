"use strict";

const REPOSITORY = "mahiru7229/mcw-launcher";
const RELEASES_API = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=30`;

const FALLBACK_STABLE = {
  tag_name: "v0.5.1",
  name: "MCW Launcher v0.5.1",
  prerelease: false,
  published_at: "2026-07-16T00:00:00Z",
  html_url: "https://github.com/mahiru7229/mcw-launcher/releases/tag/v0.5.1",
  assets: [{
    name: "MCW-Launcher-v0.5.1-windows-x64.zip",
    size: 0,
    browser_download_url: "https://github.com/mahiru7229/mcw-launcher/releases/download/v0.5.1/MCW-Launcher-v0.5.1-windows-x64.zip"
  }]
};

const FALLBACK_BETA = {
  tag_name: "v0.6.0-beta.5",
  name: "MCW Launcher v0.6.0 Beta 5",
  prerelease: true,
  published_at: "2026-07-22T00:00:00Z",
  html_url: "https://github.com/mahiru7229/mcw-launcher/releases/tag/v0.6.0-beta.5",
  assets: [{
    name: "MCW-Launcher-v0.6.0-beta.5-windows-x64.zip",
    size: 0,
    browser_download_url: "https://github.com/mahiru7229/mcw-launcher/releases/download/v0.6.0-beta.5/MCW-Launcher-v0.6.0-beta.5-windows-x64.zip"
  }]
};

const WINDOWS_ZIP_PATTERN = /windows-x64\.zip$/i;

function $(id) {
  return document.getElementById(id);
}

function findWindowsAsset(release) {
  return release.assets?.find((asset) => WINDOWS_ZIP_PATTERN.test(asset.name) && !asset.name.endsWith(".sha256")) ?? null;
}

function normalizeReleaseName(release) {
  const rawName = (release.name || release.tag_name || "MCW Launcher").trim();
  return /^mcw launcher/i.test(rawName) ? rawName : `MCW Launcher ${rawName}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Gói ZIP Windows x64";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]} · ZIP Windows x64`;
}

function formatDate(value) {
  if (!value) return "Ngày phát hành chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ngày phát hành chưa xác định";
  return `Cập nhật ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)}`;
}

function setLink(id, href) {
  const element = $(id);
  if (element && href) element.href = href;
}

function renderStable(release) {
  const asset = findWindowsAsset(release) || findWindowsAsset(FALLBACK_STABLE);
  const name = normalizeReleaseName(release);
  const downloadUrl = asset?.browser_download_url || FALLBACK_STABLE.assets[0].browser_download_url;
  const releaseUrl = release.html_url || FALLBACK_STABLE.html_url;

  $("stable-version").textContent = name;
  $("stable-version-card").textContent = name;
  $("stable-size").textContent = formatBytes(asset?.size || 0);
  $("stable-date").textContent = formatDate(release.published_at);
  $("cta-release-text").textContent = `Bản phát hành hiện tại: ${name} cho Windows x64.`;

  ["stable-download-button", "stable-download-card", "stable-download-bottom"].forEach((id) => setLink(id, downloadUrl));
  setLink("stable-release-link", releaseUrl);
}

function renderBeta(release) {
  const asset = findWindowsAsset(release) || findWindowsAsset(FALLBACK_BETA);
  const name = normalizeReleaseName(release);
  const shortName = name.replace(/^MCW Launcher\s*/i, "") || release.tag_name;
  const downloadUrl = asset?.browser_download_url || FALLBACK_BETA.assets[0].browser_download_url;
  const releaseUrl = release.html_url || FALLBACK_BETA.html_url;

  $("beta-version").textContent = shortName;
  $("beta-version-card").textContent = name;
  $("beta-meta").textContent = `${formatBytes(asset?.size || 0)} · ${formatDate(release.published_at).replace("Cập nhật ", "")}`;

  ["beta-download-button", "beta-download-card"].forEach((id) => setLink(id, downloadUrl));
  setLink("beta-release-link", releaseUrl);
}

async function loadReleaseChannels() {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const releases = await response.json();
    if (!Array.isArray(releases)) throw new TypeError("Invalid GitHub releases response");

    const stable = releases.find((release) => !release.draft && !release.prerelease && findWindowsAsset(release));
    const beta = releases.find((release) => !release.draft && release.prerelease && /(?:^|[-.])beta(?:[-.]|$)/i.test(release.tag_name) && findWindowsAsset(release));

    renderStable(stable || FALLBACK_STABLE);
    renderBeta(beta || FALLBACK_BETA);
  } catch (error) {
    console.warn("Không thể tải metadata release từ GitHub; đang dùng dữ liệu dự phòng.", error);
    renderStable(FALLBACK_STABLE);
    renderBeta(FALLBACK_BETA);
  }
}

function setupTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const storedTheme = localStorage.getItem("mcw-site-theme");
  if (storedTheme === "light" || storedTheme === "dark") root.dataset.theme = storedTheme;

  toggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    localStorage.setItem("mcw-site-theme", next);
  });
}

function setupNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const navigation = $("site-nav");
  if (!toggle || !navigation) return;

  toggle.addEventListener("click", () => {
    const open = navigation.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  elements.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.setProperty("--delay", `${delay}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => observer.observe(element));
}

function initialize() {
  $("current-year").textContent = String(new Date().getFullYear());
  setupTheme();
  setupNavigation();
  setupRevealAnimations();
  renderStable(FALLBACK_STABLE);
  renderBeta(FALLBACK_BETA);
  loadReleaseChannels();
}

document.addEventListener("DOMContentLoaded", initialize);
