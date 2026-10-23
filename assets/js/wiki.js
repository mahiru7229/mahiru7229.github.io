/**
 * Mahiru Wiki Engine — Pure Static Documentation System
 * Tự động đọc dữ liệu từ thư mục `wiki/` (được cấu trúc theo thư mục con)
 * Đồng bộ tĩnh hoàn toàn, tương thích GitHub Pages & Cloudflare Pages
 * Author: Huỳnh Ngọc Hoàng Tùng (@mahiru7229)
 */

class MahiruStaticWiki {
    constructor() {
        this.manifestPath = './wiki/manifest.json';
        this.wikiBasePath = './wiki/';
        this.categories = [];
        this.allDocuments = [];
        this.activeDocPath = null;
        this.searchQuery = '';
        this.collapsedCategories = new Set();
        this.documentCache = new Map();

        this.settings = {
            fontSize: 16,
            theme: 'cyber' // cyber, midnight, sepia, light
        };

        // Embedded default manifest fallback for 100% offline / file:// protocol safety
        this.fallbackManifest = {
            "categories": [
                {
                    "id": "01-gioi-thieu",
                    "name": "01. Giới thiệu",
                    "icon": "fa-solid fa-compass",
                    "items": [
                        { "id": "01-gioi-thieu/chao-mung.md", "title": "Chào mừng đến với Mahiru Wiki", "path": "01-gioi-thieu/chao-mung.md", "readTime": 3 },
                        { "id": "01-gioi-thieu/ve-tac-gia.md", "title": "Về tác giả Huỳnh Ngọc Hoàng Tùng", "path": "01-gioi-thieu/ve-tac-gia.md", "readTime": 2 }
                    ]
                },
                {
                    "id": "02-du-an",
                    "name": "02. Dự án & Phần mềm",
                    "icon": "fa-solid fa-cubes",
                    "items": [
                        { "id": "02-du-an/mcw-launcher.md", "title": "MCW Launcher — Trình khởi chạy Minecraft", "path": "02-du-an/mcw-launcher.md", "readTime": 2 },
                        { "id": "02-du-an/mcw-core-architecture.md", "title": "Kiến trúc kỹ thuật MCW Launcher Core", "path": "02-du-an/mcw-core-architecture.md", "readTime": 2 },
                        { "id": "02-du-an/game-terraria.md", "title": "Nhật ký phát triển Game 2D Sandbox (C++)", "path": "02-du-an/game-terraria.md", "readTime": 2 }
                    ]
                },
                {
                    "id": "03-lap-trinh-ky-thuat",
                    "name": "03. Lập trình & Kỹ thuật",
                    "icon": "fa-solid fa-code",
                    "items": [
                        { "id": "03-lap-trinh-ky-thuat/python-tips.md", "title": "Kinh nghiệm thực chiến với Python", "path": "03-lap-trinh-ky-thuat/python-tips.md", "readTime": 3 },
                        { "id": "03-lap-trinh-ky-thuat/cpp-modern.md", "title": "Các tính năng hiện đại trong C++", "path": "03-lap-trinh-ky-thuat/cpp-modern.md", "readTime": 3 },
                        { "id": "03-lap-trinh-ky-thuat/cu-phap-markdown.md", "title": "Showcase đầy đủ cú pháp Markdown hỗ trợ", "path": "03-lap-trinh-ky-thuat/cu-phap-markdown.md", "readTime": 3 }
                    ]
                },
                {
                    "id": "04-minecraft-modding",
                    "name": "04. Minecraft Modding",
                    "icon": "fa-solid fa-cube",
                    "items": [
                        { "id": "04-minecraft-modding/huong-dan-fabric.md", "title": "Hướng dẫn cơ bản lập trình Mod với Fabric", "path": "04-minecraft-modding/huong-dan-fabric.md", "readTime": 3 },
                        { "id": "04-minecraft-modding/toi-uu-modpack.md", "title": "Tối ưu hóa hiệu năng Minecraft & JVM", "path": "04-minecraft-modding/toi-uu-modpack.md", "readTime": 3 }
                    ]
                }
            ]
        };

        this.init();
    }

    async init() {
        this.loadSettings();
        await this.loadManifest();
        this.bindEvents();
        this.renderFolderTree();

        // Resolve requested doc from URL (e.g. #wiki?doc=02-du-an/mcw-launcher.md or ?doc=...)
        const initialDoc = this.resolveRequestedDoc();
        if (initialDoc) {
            this.loadDocument(initialDoc, false);
        } else if (this.allDocuments.length > 0) {
            this.loadDocument(this.allDocuments[0].path, false);
        }

        // Initialize Mermaid
        if (window.mermaid) {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                themeVariables: {
                    primaryColor: '#8b5cf6',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#a78bfa',
                    lineColor: '#38bdf8',
                    secondaryColor: '#ec4899',
                    tertiaryColor: '#1e293b'
                }
            });
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('mahiru_wiki_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {}
        this.applySettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('mahiru_wiki_settings', JSON.stringify(this.settings));
        } catch (e) {}
    }

    applySettings() {
        const viewer = document.getElementById('wiki-reader-content');
        if (viewer) {
            viewer.style.fontSize = `${this.settings.fontSize}px`;
        }
        const readerCard = document.getElementById('wiki-reader-wrapper');
        if (readerCard) {
            readerCard.setAttribute('data-theme', this.settings.theme);
        }
    }

    resolveRequestedDoc() {
        // Check query string ?doc=...
        const urlParams = new URLSearchParams(window.location.search);
        let doc = urlParams.get('doc');
        if (doc) return doc;

        // Check hash query #wiki?doc=...
        const hash = window.location.hash;
        if (hash.includes('?')) {
            const hashQuery = hash.split('?')[1];
            const hashParams = new URLSearchParams(hashQuery);
            doc = hashParams.get('doc');
            if (doc) return doc;
        }

        return null;
    }

    async loadManifest() {
        let loadedManifest = null;
        try {
            const res = await fetch(this.manifestPath);
            if (res.ok) {
                loadedManifest = await res.json();
            }
        } catch (e) {
            console.warn('Could not fetch manifest.json, using built-in fallback manifest:', e);
        }

        if (!loadedManifest || !loadedManifest.categories) {
            loadedManifest = this.fallbackManifest;
        }

        this.categories = loadedManifest.categories;
        this.allDocuments = [];

        this.categories.forEach(cat => {
            if (cat.items && Array.isArray(cat.items)) {
                cat.items.forEach(item => {
                    this.allDocuments.push({
                        ...item,
                        categoryId: cat.id,
                        categoryName: cat.name,
                        categoryIcon: cat.icon
                    });
                });
            }
        });

        const badge = document.getElementById('wiki-doc-count');
        if (badge) {
            badge.textContent = `${this.allDocuments.length} tài liệu`;
        }
    }

    // Render Folder Tree (Accordion Navigation)
    renderFolderTree() {
        const container = document.getElementById('wiki-tree-container');
        if (!container) return;

        const query = this.searchQuery.toLowerCase().trim();

        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="wiki-empty-search">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>Chưa có tài liệu nào trong Wiki</p>
                </div>
            `;
            return;
        }

        let html = '';

        this.categories.forEach(cat => {
            const items = cat.items || [];
            const filteredItems = items.filter(item => {
                if (!query) return true;
                const matchTitle = item.title.toLowerCase().includes(query);
                const matchPath = item.path.toLowerCase().includes(query);
                const matchDesc = (item.description || '').toLowerCase().includes(query);
                return matchTitle || matchPath || matchDesc;
            });

            // If searching and this category has no matches, skip
            if (query && filteredItems.length === 0) return;

            // Auto-expand folder if searching or if it contains active document
            const containsActive = items.some(item => item.path === this.activeDocPath);
            const isCollapsed = query ? false : (this.collapsedCategories.has(cat.id) && !containsActive);
            const chevronClass = isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down';
            const bodyClass = isCollapsed ? 'collapsed' : '';

            html += `
                <div class="wiki-tree-category" data-cat-id="${cat.id}">
                    <div class="wiki-cat-header" data-cat-toggle="${cat.id}">
                        <div class="cat-left">
                            <i class="fa-solid ${chevronClass} cat-chevron"></i>
                            <i class="${cat.icon || 'fa-solid fa-folder'} cat-icon"></i>
                            <span class="cat-name">${this.escapeHtml(cat.name)}</span>
                        </div>
                        <span class="cat-badge">${filteredItems.length}</span>
                    </div>
                    <div class="wiki-cat-items ${bodyClass}">
                        ${filteredItems.map(item => {
                            const isActive = item.path === this.activeDocPath ? 'active' : '';
                            return `
                                <div class="wiki-tree-item ${isActive}" data-doc-path="${this.escapeHtml(item.path)}">
                                    <i class="fa-regular fa-file-lines item-icon"></i>
                                    <span class="item-title" title="${this.escapeHtml(item.title)}">${this.escapeHtml(item.title)}</span>
                                    <span class="item-read">${item.readTime || 2}m</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        if (!html && query) {
            container.innerHTML = `
                <div class="wiki-empty-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>Không tìm thấy bài viết "${this.escapeHtml(query)}"</p>
                    <small>Thử tìm từ khóa khác</small>
                </div>
            `;
            return;
        }

        container.innerHTML = html;
    }

    // Load and render markdown document
    async loadDocument(docPath, pushState = true) {
        if (!docPath) return;

        this.activeDocPath = docPath;
        this.renderFolderTree();

        const docMeta = this.allDocuments.find(d => d.path === docPath) || {
            title: docPath.split('/').pop().replace(/\.md$/i, ''),
            path: docPath,
            categoryName: 'Tài liệu'
        };

        // Update Breadcrumb & Header
        const breadcrumbCat = document.getElementById('wiki-view-crumb-cat');
        const breadcrumbDoc = document.getElementById('wiki-view-crumb-doc');
        const titleElem = document.getElementById('wiki-view-title');
        const metaCategory = document.getElementById('wiki-view-category');
        const metaReadTime = document.getElementById('wiki-view-readtime');
        const metaWords = document.getElementById('wiki-view-words');
        const metaPath = document.getElementById('wiki-view-path');
        const contentContainer = document.getElementById('wiki-reader-content');

        if (breadcrumbCat) breadcrumbCat.textContent = docMeta.categoryName || 'Wiki';
        if (breadcrumbDoc) breadcrumbDoc.textContent = docMeta.title;
        if (titleElem) titleElem.textContent = docMeta.title;
        if (metaCategory) metaCategory.textContent = docMeta.categoryName || 'Tài liệu';
        if (metaReadTime) metaReadTime.textContent = `${docMeta.readTime || 3} phút đọc`;
        if (metaPath) metaPath.textContent = docMeta.path;

        if (contentContainer) {
            contentContainer.innerHTML = '<div class="wiki-loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải tài liệu...</div>';
        }

        // Fetch Markdown text
        let markdownText = '';
        try {
            if (this.documentCache.has(docPath)) {
                markdownText = this.documentCache.get(docPath);
            } else {
                const targetUrl = `${this.wikiBasePath}${docPath}`;
                const res = await fetch(targetUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                markdownText = await res.text();
                this.documentCache.set(docPath, markdownText);
            }
        } catch (err) {
            console.error('Failed to load markdown document:', err);
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="wiki-error-box">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h4>Không thể tải tài liệu này</h4>
                        <p>Đường dẫn: <code>${this.escapeHtml(docPath)}</code></p>
                        <small>${this.escapeHtml(err.message)}</small>
                    </div>
                `;
            }
            return;
        }

        // Parse Frontmatter & Body
        const { meta, body } = this.parseFrontmatter(markdownText);
        if (meta.title && titleElem) {
            titleElem.textContent = meta.title;
            if (breadcrumbDoc) breadcrumbDoc.textContent = meta.title;
        }

        // Calculate actual words
        const cleanBody = body.replace(/```[\s\S]*?```/g, '').replace(/[#*`~>-]/g, ' ');
        const wordCount = (cleanBody.match(/\S+/g) || []).length;
        if (metaWords) metaWords.textContent = `${wordCount} từ`;

        // Render Markdown to HTML
        let processedHtml = '';
        let headings = [];

        try {
            const { modifiedBody, extractedHeadings } = this.extractAndInjectHeadings(body);
            headings = extractedHeadings;

            const alertEnhancedBody = this.transformGitHubAlerts(modifiedBody);

            if (window.marked) {
                marked.setOptions({
                    gfm: true,
                    breaks: true,
                    headerIds: false
                });
                processedHtml = marked.parse(alertEnhancedBody);
            } else {
                processedHtml = `<pre>${this.escapeHtml(body)}</pre>`;
            }

            if (window.DOMPurify) {
                processedHtml = DOMPurify.sanitize(processedHtml, {
                    ADD_TAGS: ['iframe'],
                    ADD_ATTR: ['target', 'data-lang', 'id']
                });
            }
        } catch (parseErr) {
            console.error('Render error:', parseErr);
            processedHtml = `<pre>${this.escapeHtml(body)}</pre>`;
        }

        if (contentContainer) {
            contentContainer.innerHTML = processedHtml;

            // Enhancements
            this.enhanceCodeBlocks(contentContainer);
            this.renderMermaidDiagrams(contentContainer);
            this.renderKaTeXMath(contentContainer);
            this.enhanceInternalLinks(contentContainer, docPath);
        }

        // Render TOC
        const tocContainer = document.getElementById('wiki-toc-list');
        this.renderTableOfContents(headings, tocContainer);
        this.initScrollSpy();

        // Update URL
        if (pushState) {
            const newHash = `wiki?doc=${encodeURIComponent(docPath)}`;
            window.history.pushState({ doc: docPath }, '', `#${newHash}`);
        }

        // Scroll reader to top
        const readerWrapper = document.getElementById('wiki-reader-wrapper');
        if (readerWrapper && window.innerWidth < 1000) {
            readerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    parseFrontmatter(raw) {
        const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
        const match = raw.match(fmRegex);
        if (!match) return { meta: {}, body: raw };

        const yamlText = match[1];
        const body = raw.slice(match[0].length);
        const meta = {};

        yamlText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const idx = trimmed.indexOf(':');
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                let val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                meta[key] = val;
            }
        });

        return { meta, body };
    }

    extractAndInjectHeadings(markdownText) {
        const headings = [];
        const headingCounts = {};

        const modifiedBody = markdownText.replace(/^(#{1,4})\s+(.+)$/gm, (match, hashes, text) => {
            const level = hashes.length;
            const cleanText = text.replace(/[*_~`]/g, '').trim();
            let slug = cleanText
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            if (!slug) slug = `section-${headings.length + 1}`;

            if (headingCounts[slug]) {
                headingCounts[slug]++;
                slug = `${slug}-${headingCounts[slug]}`;
            } else {
                headingCounts[slug] = 1;
            }

            headings.push({ level, text: cleanText, id: slug });
            return `<h${level} id="${slug}">${cleanText}</h${level}>`;
        });

        return { modifiedBody, extractedHeadings: headings };
    }

    transformGitHubAlerts(text) {
        const alertTypes = {
            NOTE: { icon: 'fa-solid fa-circle-info', title: 'Ghi chú', class: 'callout-note' },
            TIP: { icon: 'fa-solid fa-lightbulb', title: 'Mẹo hữu ích', class: 'callout-tip' },
            IMPORTANT: { icon: 'fa-solid fa-circle-exclamation', title: 'Quan trọng', class: 'callout-important' },
            WARNING: { icon: 'fa-solid fa-triangle-exclamation', title: 'Cảnh báo', class: 'callout-warning' },
            CAUTION: { icon: 'fa-solid fa-skull-crossbones', title: 'Lưu ý khẩn cấp', class: 'callout-caution' }
        };

        const regex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gim;

        return text.replace(regex, (match, type, content) => {
            const upperType = type.toUpperCase();
            const config = alertTypes[upperType] || alertTypes.NOTE;
            const cleanContent = content
                .split('\n')
                .map(line => line.replace(/^>\s?/, ''))
                .join('\n')
                .trim();

            return `\n<div class="wiki-callout ${config.class}">
                <div class="callout-head">
                    <i class="${config.icon}"></i>
                    <span>${config.title}</span>
                </div>
                <div class="callout-content">
                    \n${cleanContent}\n
                </div>
            </div>\n`;
        });
    }

    enhanceCodeBlocks(container) {
        container.querySelectorAll('pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (!code) return;

            let lang = 'code';
            code.classList.forEach(cls => {
                if (cls.startsWith('language-')) {
                    lang = cls.replace('language-', '');
                }
            });

            if (window.hljs && !code.classList.contains('hljs')) {
                hljs.highlightElement(code);
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'wiki-code-block';

            const header = document.createElement('div');
            header.className = 'wiki-code-header';
            header.innerHTML = `
                <div class="code-lang-badge"><i class="fa-solid fa-code"></i> ${this.escapeHtml(lang.toUpperCase())}</div>
                <button type="button" class="btn-copy-code" title="Sao chép mã nguồn">
                    <i class="fa-regular fa-copy"></i>
                    <span>Copy</span>
                </button>
            `;

            const copyBtn = header.querySelector('.btn-copy-code');
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.innerText);
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Đã chép!</span>';
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy</span>';
                    }, 2000);
                } catch (e) {}
            });

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
    }

    renderMermaidDiagrams(container) {
        if (!window.mermaid) return;

        const blocks = container.querySelectorAll('.wiki-code-block code.language-mermaid, pre code.language-mermaid');
        blocks.forEach(async (codeBlock, index) => {
            const rawDiagram = codeBlock.innerText;
            const parentBlock = codeBlock.closest('.wiki-code-block') || codeBlock.closest('pre');
            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'wiki-mermaid-diagram';
            const uniqueId = `mermaid-chart-${Date.now()}-${index}`;

            try {
                const { svg } = await mermaid.render(uniqueId, rawDiagram);
                diagramContainer.innerHTML = svg;
                if (parentBlock && parentBlock.parentNode) {
                    parentBlock.parentNode.replaceChild(diagramContainer, parentBlock);
                }
            } catch (err) {
                console.warn('Mermaid rendering error:', err);
                diagramContainer.innerHTML = `<div class="wiki-error-box"><i class="fa-solid fa-triangle-exclamation"></i> Không thể vẽ sơ đồ Mermaid: ${this.escapeHtml(err.message)}</div>`;
                if (parentBlock && parentBlock.parentNode) {
                    parentBlock.parentNode.replaceChild(diagramContainer, parentBlock);
                }
            }
        });
    }

    renderKaTeXMath(container) {
        if (!window.renderMathInElement) return;

        try {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.warn('KaTeX math error:', e);
        }
    }

    enhanceInternalLinks(container, currentDocPath) {
        container.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (!href) return;

            // Same page anchor link
            if (href.startsWith('#')) {
                a.addEventListener('click', e => {
                    e.preventDefault();
                    const target = document.getElementById(href.slice(1));
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                });
                return;
            }

            // Internal markdown link (e.g. ./chao-mung.md or ../02-du-an/mcw-launcher.md)
            if (/\.md(#.*)?$/i.test(href)) {
                const [targetPath, hash] = href.split('#');
                // Resolve relative path
                const resolved = this.resolveRelativePath(currentDocPath, targetPath);
                const matchingDoc = this.allDocuments.find(d => d.path.toLowerCase() === resolved.toLowerCase() || d.path.endsWith(targetPath));

                if (matchingDoc) {
                    a.classList.add('wiki-internal-link');
                    a.title = `Mở bài viết: ${matchingDoc.title}`;
                    a.addEventListener('click', e => {
                        e.preventDefault();
                        this.loadDocument(matchingDoc.path, true).then(() => {
                            if (hash) {
                                const el = document.getElementById(hash);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    });
                    return;
                }
            }

            // External links
            if (/^https?:\/\//i.test(href)) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    resolveRelativePath(basePath, relativePath) {
        const baseParts = basePath.split('/');
        baseParts.pop(); // Remove file name
        const relParts = relativePath.split('/');

        for (const part of relParts) {
            if (part === '.' || part === '') continue;
            if (part === '..') {
                baseParts.pop();
            } else {
                baseParts.push(part);
            }
        }
        return baseParts.join('/');
    }

    renderTableOfContents(headings, container) {
        if (!container) return;

        if (!headings || headings.length === 0) {
            container.innerHTML = '<div class="toc-empty"><i class="fa-regular fa-compass"></i> Bài viết không có tiêu đề phân đoạn</div>';
            return;
        }

        container.innerHTML = headings.map(h => {
            const indentClass = `toc-level-${h.level}`;
            return `
                <a href="#${h.id}" class="toc-link ${indentClass}" data-target="${h.id}">
                    <span class="toc-dot"></span>
                    <span class="toc-text">${this.escapeHtml(h.text)}</span>
                </a>
            `;
        }).join('');

        container.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = document.getElementById(link.dataset.target);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    initScrollSpy() {
        if (this.scrollSpyHandler) {
            window.removeEventListener('scroll', this.scrollSpyHandler);
        }

        const headings = Array.from(document.querySelectorAll('#wiki-reader-content h1[id], #wiki-reader-content h2[id], #wiki-reader-content h3[id]'));
        const tocLinks = Array.from(document.querySelectorAll('#wiki-toc-list .toc-link'));

        if (headings.length === 0 || tocLinks.length === 0) return;

        this.scrollSpyHandler = () => {
            const scrollPos = window.scrollY + 130;
            let currentId = null;

            for (const h of headings) {
                if (h.offsetTop <= scrollPos) {
                    currentId = h.id;
                } else {
                    break;
                }
            }

            if (!currentId && headings.length > 0) {
                currentId = headings[0].id;
            }

            tocLinks.forEach(link => {
                if (link.dataset.target === currentId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        window.addEventListener('scroll', this.scrollSpyHandler, { passive: true });
        this.scrollSpyHandler();
    }

    bindEvents() {
        // Tree category collapse / expand toggle
        const treeContainer = document.getElementById('wiki-tree-container');
        if (treeContainer) {
            treeContainer.addEventListener('click', e => {
                const header = e.target.closest('[data-cat-toggle]');
                if (header) {
                    const catId = header.dataset.catToggle;
                    const catBox = header.closest('.wiki-tree-category');
                    const itemsBox = catBox?.querySelector('.wiki-cat-items');
                    const chevron = header.querySelector('.cat-chevron');

                    if (this.collapsedCategories.has(catId)) {
                        this.collapsedCategories.delete(catId);
                        itemsBox?.classList.remove('collapsed');
                        chevron?.classList.remove('fa-chevron-right');
                        chevron?.classList.add('fa-chevron-down');
                    } else {
                        this.collapsedCategories.add(catId);
                        itemsBox?.classList.add('collapsed');
                        chevron?.classList.remove('fa-chevron-down');
                        chevron?.classList.add('fa-chevron-right');
                    }
                    return;
                }

                // Item click
                const item = e.target.closest('[data-doc-path]');
                if (item) {
                    const docPath = item.dataset.docPath;
                    this.loadDocument(docPath, true);
                }
            });
        }

        // Search Bar in Tree Sidebar
        const searchInput = document.getElementById('wiki-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                this.searchQuery = e.target.value;
                this.renderFolderTree();
            });
        }

        // Toolbar: Font Size
        document.getElementById('btn-font-smaller')?.addEventListener('click', () => {
            if (this.settings.fontSize > 13) {
                this.settings.fontSize -= 1;
                this.saveSettings();
                this.applySettings();
            }
        });

        document.getElementById('btn-font-larger')?.addEventListener('click', () => {
            if (this.settings.fontSize < 24) {
                this.settings.fontSize += 1;
                this.saveSettings();
                this.applySettings();
            }
        });

        // Toolbar: Theme Dropdown
        const themeSelect = document.getElementById('wiki-theme-select');
        if (themeSelect) {
            themeSelect.value = this.settings.theme;
            themeSelect.addEventListener('change', e => {
                this.settings.theme = e.target.value;
                this.saveSettings();
                this.applySettings();
            });
        }

        // Toolbar: Copy Raw
        document.getElementById('btn-copy-raw')?.addEventListener('click', async () => {
            if (!this.activeDocPath) return;
            const text = this.documentCache.get(this.activeDocPath);
            if (text) {
                try {
                    await navigator.clipboard.writeText(text);
                    const btn = document.getElementById('btn-copy-raw');
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã chép!';
                    setTimeout(() => btn.innerHTML = orig, 1800);
                } catch (e) {}
            }
        });

        // Toolbar: Print / PDF
        document.getElementById('btn-print-doc')?.addEventListener('click', () => {
            window.print();
        });

        // Toolbar: Zen Mode
        document.getElementById('btn-zen-mode')?.addEventListener('click', () => {
            const container = document.getElementById('wiki-container');
            if (container) {
                container.classList.toggle('zen-mode-active');
                const isZen = container.classList.contains('zen-mode-active');
                const btn = document.getElementById('btn-zen-mode');
                if (btn) {
                    btn.innerHTML = isZen ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
                }
            }
        });

        // In-Document Search
        const inDocSearch = document.getElementById('wiki-in-doc-search');
        if (inDocSearch) {
            inDocSearch.addEventListener('input', e => {
                this.searchInDocument(e.target.value);
            });
        }

        // Listen to browser Back/Forward (popstate)
        window.addEventListener('popstate', () => {
            const doc = this.resolveRequestedDoc();
            if (doc && doc !== this.activeDocPath) {
                this.loadDocument(doc, false);
            }
        });

        // Listen to hash changes
        window.addEventListener('hashchange', () => {
            const doc = this.resolveRequestedDoc();
            if (doc && doc !== this.activeDocPath) {
                this.loadDocument(doc, false);
            }
        });
    }

    searchInDocument(term) {
        const container = document.getElementById('wiki-reader-content');
        if (!container) return;

        container.querySelectorAll('.wiki-highlight-text').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });

        const badge = document.getElementById('in-doc-match-count');
        if (!term || !term.trim()) {
            if (badge) badge.textContent = '';
            return;
        }

        const cleanTerm = term.trim().toLowerCase();
        let matchCount = 0;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentNode.nodeName !== 'SCRIPT' && 
                node.parentNode.nodeName !== 'STYLE' && 
                !node.parentNode.classList.contains('wiki-code-block')) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const val = textNode.nodeValue;
            const lower = val.toLowerCase();
            const index = lower.indexOf(cleanTerm);
            if (index !== -1) {
                const span = document.createElement('span');
                span.className = 'wiki-highlight-text';
                span.textContent = val.slice(index, index + cleanTerm.length);

                const after = textNode.splitText(index);
                after.nodeValue = after.nodeValue.slice(cleanTerm.length);
                textNode.parentNode.insertBefore(span, after);
                matchCount++;
            }
        });

        if (badge) {
            badge.textContent = matchCount > 0 ? `${matchCount} kết quả` : '0 kết quả';
        }

        const first = container.querySelector('.wiki-highlight-text');
        if (first) {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.mahiruWiki = new MahiruStaticWiki();
});
