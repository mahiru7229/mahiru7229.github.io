(() => {
  "use strict";

  const REPO = "mahiru7229/mcw-launcher";
  const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=10`;
  const FALLBACK_RELEASE = {
    name: "MCW Launcher v0.5.1 RC 1",
    tag_name: "v0.5.1-rc.1",
    html_url: `https://github.com/${REPO}/releases/tag/v0.5.1-rc.1`,
    prerelease: true,
    published_at: "2026-07-16T11:46:00Z",
    assets: [{
      name: "MCW-Launcher-v0.5.1-rc.1-windows-x64.zip",
      browser_download_url: `https://github.com/${REPO}/releases/download/v0.5.1-rc.1/MCW-Launcher-v0.5.1-rc.1-windows-x64.zip`,
      size: 0
    }]
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "Gói ZIP Windows x64";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(index >= 2 ? 1 : 0)} ${units[index]} · Windows x64`;
  }

  function findWindowsAsset(release) {
    const assets = Array.isArray(release.assets) ? release.assets : [];
    return assets.find(asset => /windows.*x64.*\.zip$/i.test(asset.name) && !/sha256/i.test(asset.name))
      || assets.find(asset => /\.zip$/i.test(asset.name) && !/sha256/i.test(asset.name));
  }

  function updateRelease(release) {
    const asset = findWindowsAsset(release) || findWindowsAsset(FALLBACK_RELEASE);
    if (!asset) return;

    const title = release.name || release.tag_name || FALLBACK_RELEASE.name;
    const releaseUrl = release.html_url || FALLBACK_RELEASE.html_url;
    const published = release.published_at ? new Date(release.published_at) : new Date(FALLBACK_RELEASE.published_at);
    const dateText = Number.isNaN(published.getTime())
      ? "Cập nhật gần đây"
      : `Cập nhật ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(published)}`;

    $("#download-version").textContent = title;
    $("#release-size").textContent = formatBytes(asset.size);
    $("#release-date").textContent = dateText;
    $("#release-state").textContent = release.prerelease ? "Bản thử nghiệm mới nhất cho Windows x64" : "Bản ổn định mới nhất cho Windows x64";
    $("#cta-release-text").textContent = `Bản hiện tại: ${title} cho Windows x64.`;

    [$("#download-button"), $("#download-button-bottom")].forEach(link => {
      link.href = asset.browser_download_url;
      link.setAttribute("data-release", release.tag_name || "latest");
    });

    $("#release-link").href = releaseUrl;
  }

  async function loadLatestRelease() {
    updateRelease(FALLBACK_RELEASE);
    try {
      const response = await fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
      const releases = await response.json();
      const release = releases.find(item => !item.draft && findWindowsAsset(item));
      if (release) updateRelease(release);
    } catch (error) {
      console.info("Không thể tải metadata release mới nhất; đang dùng liên kết dự phòng.", error);
    }
  }

  function setupTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem("mcw-site-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    root.dataset.theme = saved || (prefersLight ? "light" : "dark");

    $(".theme-toggle")?.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("mcw-site-theme", next);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0b120d" : "#f2f7ef");
    });
  }

  function setupMobileMenu() {
    const button = $(".menu-toggle");
    const nav = $(".site-nav");
    if (!button || !nav) return;

    const close = () => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Mở menu");
      nav.classList.remove("open");
      document.body.classList.remove("menu-open");
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
      nav.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
    });

    $$("a", nav).forEach(link => link.addEventListener("click", close));
    window.addEventListener("resize", () => { if (window.innerWidth > 760) close(); }, { passive: true });
  }

  function setupReveal() {
    const elements = $$(".reveal");
    elements.forEach(element => {
      const delay = Number(element.dataset.delay || 0);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -40px" });

    elements.forEach(element => observer.observe(element));
  }

  function setupHeader() {
    const header = $(".site-header");
    if (!header) return;
    const update = () => header.classList.toggle("scrolled", window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function setupLauncherTilt() {
    const stage = $(".launcher-stage");
    const windowMock = $("#launcher-window");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!stage || !windowMock || reduceMotion || window.innerWidth <= 760) return;

    let frame = 0;
    stage.addEventListener("pointermove", event => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        windowMock.style.transform = `rotateY(${x * 7 - 4}deg) rotateX(${-y * 5 + 2}deg) translateY(-2px)`;
      });
    });

    stage.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      windowMock.style.transform = "rotateY(-4deg) rotateX(2deg)";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTheme();
    setupMobileMenu();
    setupReveal();
    setupHeader();
    setupLauncherTilt();
    loadLatestRelease();
    $("#current-year").textContent = String(new Date().getFullYear());
  });
})();
