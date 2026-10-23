/**
 * Mahiru7229 Homepage & Portal Controller
 * Xử lý điều hướng tab, sao chép Discord, probe hình nền và hiệu ứng
 */

(() => {
    // 1. Background image probe
    // Nếu có ./assets/img/bg/custom_bg.jpg thì dùng, không thì giữ ./assets/img/bg/user_bg.jpg
    const customBg = './assets/img/bg/custom_bg.jpg';
    const fallbackBg = './assets/img/bg/user_bg.jpg';
    const probe = new Image();
    probe.onload = () => {
        document.documentElement.style.setProperty('--active-bg', `url('${customBg}')`);
    };
    probe.onerror = () => {
        document.documentElement.style.setProperty('--active-bg', `url('${fallbackBg}')`);
    };
    probe.src = customBg;

    // 2. Tab Navigation System
    const tabs = document.querySelectorAll('.nav-tab-btn');
    const sections = document.querySelectorAll('.view-section');

    function switchToTab(tabId, pushState = true) {
        if (!tabId) tabId = 'profile';

        // Normalize
        const cleanTabId = tabId.replace(/^#/, '');
        const targetSection = document.getElementById(`view-${cleanTabId}`);
        if (!targetSection) return;

        // Update active class on nav buttons
        tabs.forEach(btn => {
            if (btn.dataset.tab === cleanTabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update active class on sections
        sections.forEach(sec => {
            if (sec.id === `view-${cleanTabId}`) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        if (pushState) {
            window.location.hash = cleanTabId;
        }

        // Close mobile menu if opened
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) mobileNav.classList.remove('open');

        // Scroll to top of content smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.switchToTab = switchToTab;

    tabs.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const target = btn.dataset.tab;
            switchToTab(target);
        });
    });

    // Hash change listener
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            switchToTab(hash, false);
        }
    });

    // Check initial hash on page load
    const initialHash = window.location.hash.slice(1);
    if (initialHash && ['profile', 'wiki', 'projects', 'storage'].includes(initialHash)) {
        switchToTab(initialHash, false);
    }

    // 3. Copy Discord username button
    const copyDiscordBtn = document.getElementById('copy-discord');
    const copyDiscordBadge = document.getElementById('discord-toast');

    if (copyDiscordBtn) {
        copyDiscordBtn.addEventListener('click', async () => {
            const username = '@mahiru7229';
            try {
                await navigator.clipboard.writeText(username);
                showDiscordFeedback(`Đã chép: ${username}`);
            } catch {
                showDiscordFeedback(`Discord: ${username}`);
            }
        });
    }

    function showDiscordFeedback(msg) {
        if (copyDiscordBadge) {
            copyDiscordBadge.textContent = msg;
            copyDiscordBadge.classList.add('show');
            setTimeout(() => {
                copyDiscordBadge.classList.remove('show');
            }, 2500);
        }
    }

    // 4. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
        });
    }

    // 5. Hero Quick Wiki CTA Button
    const heroWikiBtn = document.getElementById('hero-quick-upload');
    if (heroWikiBtn) {
        heroWikiBtn.addEventListener('click', e => {
            e.preventDefault();
            switchToTab('wiki');
        });
    }
})();
