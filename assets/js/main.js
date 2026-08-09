// ── i18n bridge (i18n.js loads deferred, after this file) ────
function tr(key) { return (typeof window.scT === 'function') ? window.scT(key) : key; }

// ── Platform detection ───────────────────────────────────────
function detectPlatform() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        const p = navigator.userAgentData.platform.toLowerCase();
        if (p.startsWith('win')) return 'windows';
        if (p === 'macos')       return 'mac';
        if (p === 'linux')       return 'linux';
    }
    const p = (navigator.platform || '').toLowerCase();
    if (p.startsWith('win'))                              return 'windows';
    if (p.startsWith('mac') || p === 'iphone' || p === 'ipad') return 'mac';
    if (p.startsWith('linux') || p === 'android')         return 'linux';
    return 'unknown';
}

const detectedPlatform = detectPlatform();
let allPlatformsMode = (detectedPlatform === 'unknown');

function platformAllows(platform) {
    if (allPlatformsMode) return true;
    return detectedPlatform === platform;
}

// ── Custom list (My List) — localStorage + URL ───────────────
const STORAGE_KEY  = 'sc_custom';
const OPEN_KEY     = 'sc_open_only';
const initialParams = new URLSearchParams(window.location.search);

function encodeLinks(links) {
    try {
        const bytes = new TextEncoder().encode(JSON.stringify(links));
        return btoa(String.fromCharCode(...bytes));
    } catch (e) { return ''; }
}

function decodeLinks(encoded) {
    try {
        const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
}

function loadCustomLinks() {
    const encoded = initialParams.get('mylist');
    if (encoded) {
        const links = decodeLinks(encoded);
        if (Array.isArray(links)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
            return links;
        }
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
}

let customLinks = loadCustomLinks();

// Hide everything carrying a licence caveat. Persisted, because it is a stance
// about what belongs in the catalog rather than a per-visit filter.
let openOnlyMode = (() => {
    try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; }
})();

// ── Licence classes ──────────────────────────────────────────
// An entry with no `licence` is plain open source and shows no chip: most of
// the catalog is open, so a badge on all of it would be noise. The chip only
// ever means "there is something here to read before you commit".
const LICENCE_LABELS = {
    'open-core': 'Open core',
    'source':    'Source available',
    'closed':    'Closed',
    'reference': 'Reference',
};
const LICENCE_TIPS = {
    'open-core': 'Open base with proprietary paid tiers',
    'source':    'Source available under a non-commercial or academic licence',
    'closed':    'Proprietary software or hosted product',
    'reference': 'Dataset, portal, standard or organisation — not software',
};
// Corner marks, so the card keeps its height whether or not it has a caveat.
// A glyph can only carry four states, which is exactly how many there are —
// the words live in the tooltip and the accessible name.
const LICENCE_ICONS = {
    'open-core': 'fa-solid fa-circle-half-stroke',
    'source':    'fa-solid fa-eye',
    'closed':    'fa-solid fa-lock',
    'reference': 'fa-solid fa-book',
};

// ── Slice configuration ──────────────────────────────────────
// A slice lists explicit `categories`, or names a `status` and derives its
// categories from the data — which keeps the 56 Reviewing domains in one place
// (the JSON) instead of duplicated here.
const SLICES = [
    {
        id: 'highlights',
        label: 'Highlights',
        icon: 'fa-solid fa-star',
        num: '01',
        categories: ['Curated Highlights']
    },
    {
        id: 'basic',
        label: 'Basic Software',
        icon: 'fa-solid fa-house',
        num: '02',
        categories: ['Essentials', 'Web Browsers', 'Language and Culture']
    },
    {
        id: 'general',
        label: 'General Software',
        icon: 'fa-solid fa-layer-group',
        num: '03',
        categories: ['Gaming and Entertainment', 'Multimedia and Design', 'AI / Machine learning']
    },
    {
        id: 'professional',
        label: 'Professional',
        icon: 'fa-solid fa-briefcase',
        num: '04',
        categories: ['Development', 'Open Source related', 'STEM and Research']
    },
    {
        id: 'it-systems',
        label: 'IT & Systems',
        icon: 'fa-solid fa-server',
        num: '05',
        categories: ['IT and DevOps', 'Operating Systems', 'Hardware', 'Monitoring and Status']
    },
    {
        id: 'security',
        label: 'Security',
        icon: 'fa-solid fa-shield-halved',
        num: '06',
        categories: ['(Cyber)Security']
    },
    {
        // Staging ground: entries land here first and graduate into the slices
        // above once vetted. Membership is the `status` field on the entry, so
        // promoting one is a single-word edit.
        id: 'reviewing',
        label: 'Reviewing',
        icon: 'fa-solid fa-flask',
        num: '07',
        status: 'reviewing',
        dense: true
    }
];

// ── Helpers ──────────────────────────────────────────────────
function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));
}

// Escaped text with the first match of `q` wrapped in <mark>.
function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) +
           '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' +
           escapeHtml(text.slice(i + q.length));
}

function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Main app ─────────────────────────────────────────────────
fetch('assets/json/software.json')
    .then(r => r.json())
    .then(data => {
        const allServices = data;
        const sliceMenu   = document.getElementById('sliceMenu');
        const stage       = document.getElementById('stage');
        const searchInput = document.getElementById('search-input');
        const platformBtn = document.getElementById('platform-btn');
        const openBtn     = document.getElementById('open-only-btn');
        const myListBtn   = document.getElementById('my-list-btn');
        const myListCount = document.getElementById('my-list-count');

        let currentView = null; // slice id | 'search' | 'mylist' | null
        let spy = null;         // scroll listener backing the category rail

        // ── Category helpers ──────────────────────────────────
        // The divider icon is whatever icon the category's entries use most, so
        // it labels the group without a second hardcoded map to keep in sync.
        const iconCache = {};
        function categoryIcon(cat) {
            if (iconCache[cat]) return iconCache[cat];
            const counts = {};
            allServices.forEach(s => {
                if ((s.categories || []).includes(cat)) {
                    counts[s.icon] = (counts[s.icon] || 0) + 1;
                }
            });
            let best = 'fas fa-tag', top = 0;
            for (const k in counts) if (counts[k] > top) { top = counts[k]; best = k; }
            iconCache[cat] = best;
            return best;
        }

        const catsCache = {};
        function sliceCategories(slice) {
            if (slice.categories) return slice.categories;
            if (catsCache[slice.id]) return catsCache[slice.id];
            const out = [], seen = new Set();
            allServices.forEach(s => {
                if (s.status !== slice.status) return;
                (s.categories || []).forEach(c => {
                    if (!seen.has(c)) { seen.add(c); out.push(c); }
                });
            });
            catsCache[slice.id] = out;
            return out;
        }

        function servicesIn(slice, cat) {
            return allServices.filter(s =>
                (s.categories || []).includes(cat) &&
                (!slice.status || s.status === slice.status) &&
                licenceAllows(s)
            );
        }

        function licenceAllows(service) {
            return !openOnlyMode || !service.licence;
        }

        // ── URL sync ─────────────────────────────────────────
        function updateURL(query) {
            const url = new URL(window.location);
            if (query)              { url.searchParams.set('search', query); }
            else                    { url.searchParams.delete('search'); }
            if (customLinks.length) { url.searchParams.set('mylist', encodeLinks(customLinks)); }
            else                    { url.searchParams.delete('mylist'); }
            window.history.replaceState({}, '', url);
        }

        // ── Custom list helpers ───────────────────────────────
        function isInCustom(service)  { return customLinks.includes(service.link); }

        function saveCustomLinks() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customLinks));
            updateURL(searchInput.value || null);
        }

        function refreshMyListCount() {
            const n = customLinks.length;
            myListCount.textContent = n > 9 ? '9+' : n;
            myListCount.classList.toggle('visible', n > 0);
        }

        function toggleCustom(service, cardEl, starEl) {
            if (isInCustom(service)) {
                customLinks = customLinks.filter(l => l !== service.link);
            } else {
                customLinks.push(service.link);
            }
            saveCustomLinks();
            refreshMyListCount();
            const on = isInCustom(service);
            if (cardEl) cardEl.classList.toggle('in-list', on);
            if (starEl) {
                starEl.setAttribute('aria-pressed', on ? 'true' : 'false');
                starEl.dataset.tooltip = tr(on ? 'Remove from My List' : 'Save to My List');
            }
            if (currentView === 'mylist') renderMyList();
        }

        function getCustomServices() {
            const seen = new Set();
            return allServices.filter(s => {
                if (!customLinks.includes(s.link) || seen.has(s.link)) return false;
                seen.add(s.link);
                return true;
            });
        }

        // ── Platform button ───────────────────────────────────
        const platformMeta = {
            windows: { cls: 'plat-win', tip: 'Showing Windows only — click for all' },
            mac:     { cls: 'plat-mac', tip: 'Showing macOS only — click for all'   },
            linux:   { cls: 'plat-lnx', tip: 'Showing Linux only — click for all'   },
            unknown: { cls: 'plat-all', tip: 'Showing all platforms'                 },
            all:     { cls: 'plat-all', tip: 'All platforms — click to filter by OS' },
        };
        const platformIcons = {
            windows: 'fab fa-windows',
            mac:     'fab fa-apple',
            linux:   'fab fa-linux',
            unknown: 'fas fa-globe',
            all:     'fas fa-globe',
        };

        function refreshPlatformBtn() {
            if (!platformBtn) return;
            const key  = detectedPlatform === 'unknown' ? 'unknown' : allPlatformsMode ? 'all' : detectedPlatform;
            const meta = platformMeta[key];
            platformBtn.innerHTML       = '<i class="' + platformIcons[key] + '"></i>';
            platformBtn.className       = 'platform-btn ' + meta.cls;
            platformBtn.dataset.tooltip = tr(meta.tip);
            platformBtn.disabled        = (detectedPlatform === 'unknown');
        }

        if (platformBtn) {
            refreshPlatformBtn();
            platformBtn.addEventListener('click', () => {
                if (detectedPlatform === 'unknown') return;
                allPlatformsMode = !allPlatformsMode;
                refreshPlatformBtn();
                invalidatePanels();
            });
        }

        // ── Open-source-only button ───────────────────────────
        function refreshOpenBtn() {
            if (!openBtn) return;
            openBtn.classList.toggle('active', openOnlyMode);
            openBtn.setAttribute('aria-pressed', openOnlyMode ? 'true' : 'false');
            const tip = tr(openOnlyMode
                ? 'Showing fully open source only — click for everything'
                : 'Showing everything — click for fully open source only');
            openBtn.title = tip;
            openBtn.setAttribute('aria-label', tr('Open source only'));
        }

        if (openBtn) {
            refreshOpenBtn();
            openBtn.addEventListener('click', () => {
                openOnlyMode = !openOnlyMode;
                try { localStorage.setItem(OPEN_KEY, openOnlyMode ? '1' : '0'); } catch (e) {}
                refreshOpenBtn();
                invalidatePanels();
            });
        }

        // ── Notification ──────────────────────────────────────
        function showNotification(msg) {
            const n = document.createElement('div');
            n.className = 'notification';
            n.textContent = msg;
            document.body.appendChild(n);
            setTimeout(() => {
                n.classList.add('fade-out');
                setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 400);
            }, 2600);
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(
                ()  => showNotification(tr('Install command copied! Paste it in your terminal.')),
                ()  => showNotification(tr('Could not copy to clipboard.'))
            );
        }

        // ── OS install row ────────────────────────────────────
        const osDefs = [
            { key: 'windows', icon: 'fa-brands fa-windows',  platform: 'windows', cmd: v => 'winget install -e --id ' + v,  tip: 'Copy Windows install command' },
            { key: 'macos',   icon: 'fa-brands fa-apple',    platform: 'mac',     cmd: v => 'brew install ' + v,            tip: 'Copy macOS install command'   },
            { key: 'debian',  icon: 'fa-brands fa-debian',   platform: 'linux',   cmd: v => 'sudo apt install ' + v,        tip: 'Copy Debian/Ubuntu command'   },
            { key: 'fedora',  icon: 'fa-brands fa-fedora',   platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy Fedora command'          },
            { key: 'suse',    icon: 'fa-brands fa-opensuse', platform: 'linux',   cmd: v => 'sudo zypper install ' + v,     tip: 'Copy openSUSE command'        },
            { key: 'rhel',    icon: 'fa-brands fa-redhat',   platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy RHEL command'            },
            { key: 'flatpak', icon: 'fa-brands fa-linux',    platform: 'linux',   cmd: v => 'flatpak install flathub ' + v, tip: 'Copy Flatpak command'         },
        ];

        function buildOsRow(service) {
            const row = document.createElement('div');
            row.classList.add('sub-row');

            const webA = document.createElement('a');
            webA.className = 'os-icon os-web';
            webA.href = service.link;
            webA.target = '_blank';
            webA.rel = 'noopener noreferrer';
            webA.innerHTML = '<i class="fa-solid fa-globe"></i>';
            webA.dataset.tooltip = tr('Open website');
            webA.setAttribute('aria-label', tr('Open website') + ' — ' + service.name);
            webA.addEventListener('click', e => e.stopPropagation());
            row.appendChild(webA);

            for (const def of osDefs) {
                if (service[def.key] && platformAllows(def.platform)) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'os-icon';
                    btn.innerHTML = '<i class="' + def.icon + '"></i>';
                    btn.dataset.tooltip = tr(def.tip);
                    btn.setAttribute('aria-label', tr(def.tip) + ' — ' + service.name);
                    const cmd = def.cmd(service[def.key]);
                    btn.addEventListener('click', e => { e.stopPropagation(); copyToClipboard(cmd); });
                    row.appendChild(btn);
                }
            }

            return row;
        }

        // ── Card builder ──────────────────────────────────────
        // Clicking the card opens the site, which is what a card that looks like
        // a link should do. Bookmarking is its own focusable control, so it is
        // reachable by keyboard instead of being mouse-only.
        function buildCard(service, query) {
            const item = document.createElement('div');
            item.classList.add('sub-grid-item');
            if (isInCustom(service)) item.classList.add('in-list');

            item.addEventListener('click', e => {
                if (e.target.closest('a, button, .sub-row')) return;
                window.open(service.link, '_blank', 'noopener,noreferrer');
            });

            // Opposite corner from the star, absolutely positioned: it states a
            // fact about the entry without taking a line of the card.
            if (service.licence) {
                const label = tr(LICENCE_LABELS[service.licence] || service.licence);
                const tip   = tr(LICENCE_TIPS[service.licence] || '');
                const mark  = document.createElement('span');
                mark.className = 'lic-mark lic-' + service.licence;
                mark.innerHTML = '<i class="' + (LICENCE_ICONS[service.licence] || 'fa-solid fa-tag') + '"></i>';
                mark.dataset.tooltip = tip;
                mark.setAttribute('role', 'img');
                mark.setAttribute('aria-label', label + ' — ' + tip);
                item.appendChild(mark);
            }

            const star = document.createElement('button');
            star.type = 'button';
            star.className = 'star-btn';
            star.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
            star.setAttribute('aria-pressed', isInCustom(service) ? 'true' : 'false');
            star.setAttribute('aria-label', tr('Save to My List') + ' — ' + service.name);
            star.dataset.tooltip = tr(isInCustom(service) ? 'Remove from My List' : 'Save to My List');
            star.addEventListener('click', e => {
                e.stopPropagation();
                toggleCustom(service, item, star);
            });
            item.appendChild(star);

            const icon = document.createElement('i');
            icon.className = service.icon;
            icon.setAttribute('aria-hidden', 'true');

            const link = document.createElement('a');
            link.href = service.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.innerHTML = highlight(service.name, query);

            const desc = document.createElement('span');
            desc.innerHTML = highlight(service.description, query);

            item.appendChild(icon);
            item.appendChild(link);
            item.appendChild(desc);
            item.appendChild(buildOsRow(service));

            return item;
        }

        // ── Grid builder (flat, no dividers) ──────────────────
        function buildGrid(services, container, query) {
            container.innerHTML = '';
            if (!services.length) {
                const msg = document.createElement('p');
                msg.className = 'empty-list-msg';
                msg.setAttribute('data-i18n', '');
                msg.dataset.i18nKey = 'Nothing here yet.';
                msg.textContent = tr('Nothing here yet.');
                container.appendChild(msg);
                return;
            }
            const grid = document.createElement('div');
            grid.classList.add('sub-grid');
            services.forEach(s => grid.appendChild(buildCard(s, query)));
            container.appendChild(grid);
        }

        // ── Grid builder (with subcategory dividers) ──────────
        function buildGridWithDividers(sliceDef, container) {
            container.innerHTML = '';
            const cats = sliceCategories(sliceDef);
            const present = [];

            for (const catName of cats) {
                const services = servicesIn(sliceDef, catName);
                if (!services.length) continue;
                present.push({ name: catName, count: services.length });
            }

            if (!present.length) {
                const msg = document.createElement('p');
                msg.className = 'empty-list-msg';
                msg.textContent = tr('Nothing here yet.');
                container.appendChild(msg);
                return;
            }

            // A slice with this many domains is not scannable by scrolling, so
            // it gets a rail of its own categories that jumps and tracks.
            if (present.length > 6) {
                container.appendChild(buildCategoryRail(present));
            }

            for (const entry of present) {
                const catName = entry.name;

                if (cats.length > 1) {
                    const div = document.createElement('div');
                    div.className = 'subcat-divider';
                    div.id = 'cat-' + slugify(catName);

                    const dIcon = document.createElement('i');
                    dIcon.className = categoryIcon(catName);
                    dIcon.setAttribute('aria-hidden', 'true');

                    const dLabel = document.createElement('span');
                    dLabel.setAttribute('data-i18n', '');
                    dLabel.dataset.i18nKey = catName;
                    dLabel.textContent = tr(catName);

                    const dCount = document.createElement('span');
                    dCount.className = 'subcat-count';
                    dCount.textContent = entry.count;

                    div.appendChild(dIcon);
                    div.appendChild(dLabel);
                    div.appendChild(dCount);
                    container.appendChild(div);
                }

                const grid = document.createElement('div');
                grid.classList.add('sub-grid');
                servicesIn(sliceDef, catName).forEach(s => grid.appendChild(buildCard(s)));
                container.appendChild(grid);
            }
        }

        // ── Category rail ─────────────────────────────────────
        function buildCategoryRail(present) {
            const rail = document.createElement('nav');
            rail.className = 'cat-rail';
            rail.setAttribute('aria-label', tr('Categories'));

            present.forEach(entry => {
                const chip = document.createElement('a');
                chip.className = 'cat-chip';
                chip.href = '#cat-' + slugify(entry.name);
                chip.dataset.target = 'cat-' + slugify(entry.name);

                // The label carries data-i18n, not the chip: the i18n pass sets
                // textContent, which would wipe the count if it owned the node.
                const label = document.createElement('span');
                label.className = 'cat-chip-label';
                label.setAttribute('data-i18n', '');
                label.dataset.i18nKey = entry.name;
                label.textContent = tr(entry.name);

                const n = document.createElement('span');
                n.className = 'cat-chip-n';
                n.textContent = entry.count;

                chip.appendChild(label);
                chip.appendChild(n);

                chip.addEventListener('click', e => {
                    e.preventDefault();
                    jumpToCategory(entry.name);
                });
                rail.appendChild(chip);
            });

            return rail;
        }

        // Where the sticky rail's bottom edge sits, in viewport coordinates. The
        // rail sticks to the stage's padding box, so the padding has to be in
        // here or every jump parks the divider just underneath it.
        function railBottom(rail) {
            const pad = parseFloat(getComputedStyle(stage).paddingTop) || 0;
            return stage.getBoundingClientRect().top + pad + (rail ? rail.offsetHeight : 0);
        }

        // Scroll target for a divider, clearing the sticky rail that sits over it.
        function categoryOffset(el, rail) {
            return stage.scrollTop + el.getBoundingClientRect().top - railBottom(rail) - 16;
        }

        function jumpToCategory(catName) {
            const el = document.getElementById('cat-' + slugify(catName));
            if (!el) return;
            const rail = document.querySelector('.panel.active .cat-rail');
            stage.scrollTo({ top: Math.max(0, categoryOffset(el, rail)), behavior: 'smooth' });
            history.replaceState({}, '', '#cat-' + slugify(catName));
        }

        function detachSpy() {
            if (spy) { stage.removeEventListener('scroll', spy); spy = null; }
        }

        // Marks the rail chip for the section you are actually in. Watching for
        // dividers to intersect a band does not work here — sections are taller
        // than the viewport, so most scroll positions have no divider on screen
        // at all. The last divider scrolled past is the honest answer.
        function attachSpy(panel) {
            detachSpy();
            const rail = panel.querySelector('.cat-rail');
            if (!rail) return;
            const chips = Array.from(rail.querySelectorAll('.cat-chip'));
            const dividers = Array.from(panel.querySelectorAll('.subcat-divider'));
            if (!chips.length || !dividers.length) return;

            let queued = false;
            const update = () => {
                queued = false;
                const cutoff = railBottom(rail) + 12;
                let activeId = dividers[0].id;
                for (const d of dividers) {
                    if (d.getBoundingClientRect().top <= cutoff) activeId = d.id;
                    else break;
                }
                chips.forEach(c => {
                    const on = c.dataset.target === activeId;
                    if (on === c.classList.contains('active')) return;
                    c.classList.toggle('active', on);
                    // Keep the active chip in view by moving the rail only —
                    // scrollIntoView here would fight the user's own scrolling.
                    if (on && (c.offsetLeft < rail.scrollLeft ||
                               c.offsetLeft + c.offsetWidth > rail.scrollLeft + rail.clientWidth)) {
                        rail.scrollLeft = c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2;
                    }
                });
            };

            spy = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
            stage.addEventListener('scroll', spy, { passive: true });
            update();
        }

        // ── Panels ────────────────────────────────────────────
        // Shells only at startup. A panel body is built the first time it is
        // opened, so first paint costs one slice instead of the whole catalog.
        function buildPanelShells() {
            SLICES.forEach(slice => {
                const section = document.createElement('section');
                section.id = 'panel-' + slice.id;
                section.className = 'panel' + (slice.dense ? ' dense' : '');

                const header = document.createElement('div');
                header.className = 'panel-header';
                header.innerHTML =
                    '<div class="panel-title" data-i18n data-i18n-key="' + slice.label + '">' + tr(slice.label) + '</div>' +
                    '<div class="panel-num">'   + slice.num   + '</div>';
                section.appendChild(header);

                const body = document.createElement('div');
                body.className = 'panel-body';
                section.appendChild(body);

                stage.appendChild(section);
            });

            const searchPanel = document.createElement('section');
            searchPanel.id = 'panel-search';
            searchPanel.className = 'panel';
            searchPanel.innerHTML = '<div class="panel-header"><div class="panel-title">' + tr('Search Results') + '</div></div><div class="panel-body"></div>';
            stage.appendChild(searchPanel);

            const mylistPanel = document.createElement('section');
            mylistPanel.id = 'panel-mylist';
            mylistPanel.className = 'panel';
            mylistPanel.innerHTML = '<div class="panel-header"><div class="panel-title" data-i18n data-i18n-key="My List">' + tr('My List') + '</div></div><div class="panel-body"></div>';
            stage.appendChild(mylistPanel);
        }

        function ensurePanel(sliceId) {
            const panel = document.getElementById('panel-' + sliceId);
            if (!panel || panel.dataset.built === '1') return panel;
            const slice = SLICES.find(s => s.id === sliceId);
            if (!slice) return panel;
            buildGridWithDividers(slice, panel.querySelector('.panel-body'));
            panel.dataset.built = '1';
            if (typeof window.scApplyI18n === 'function') window.scApplyI18n();
            return panel;
        }

        // Platform or licence filter changed: drop every built body and rebuild
        // whichever panel is on screen.
        function invalidatePanels() {
            document.querySelectorAll('.panel[data-built="1"]').forEach(p => {
                p.dataset.built = '0';
                const body = p.querySelector('.panel-body');
                if (body) body.innerHTML = '';
            });
            if (currentView === 'search')      filterLinks(searchInput.value);
            else if (currentView === 'mylist') renderMyList();
            else if (currentView) {
                ensurePanel(currentView);
                attachSpy(document.getElementById('panel-' + currentView));
            }
        }

        // ── Build slice nav ────────────────────────────────────
        function buildSliceMenu() {
            SLICES.forEach(slice => {
                const el = document.createElement('div');
                el.className = 'slice';
                el.dataset.target = slice.id;
                el.setAttribute('role', 'button');
                el.setAttribute('tabindex', '0');
                el.innerHTML =
                    '<div class="slice-bg"></div>' +
                    '<div class="slice-large">' +
                        '<span class="slice-num-lg">' + slice.num + '</span>' +
                        '<h2 class="slice-text-lg" data-i18n data-i18n-key="' + slice.label + '">'  + tr(slice.label) + '</h2>' +
                        '<i class="' + slice.icon + ' slice-icon"></i>' +
                    '</div>' +
                    '<div class="slice-small">' +
                        '<span class="slice-text-sm" data-i18n data-i18n-key="' + slice.label + '">' + tr(slice.label) + '</span>' +
                        '<i class="' + slice.icon + ' slice-icon"></i>' +
                    '</div>';

                el.addEventListener('click', () => selectSlice(slice.id));
                el.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSlice(slice.id); }
                });
                sliceMenu.appendChild(el);
            });
        }

        // ── Navigation ────────────────────────────────────────
        function selectSlice(id) {
            currentView = id;
            searchInput.value = '';
            updateURL(null);

            document.body.classList.add('state-selected');

            document.querySelectorAll('.slice').forEach(s => {
                s.classList.toggle('active', s.dataset.target === id);
            });

            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            const panel = ensurePanel(id);
            if (panel) {
                panel.classList.add('active');
                stage.scrollTop = 0;
                attachSpy(panel);
            }
        }

        function showSpecialPanel(id) {
            currentView = id;
            document.body.classList.add('state-selected');
            detachSpy();

            document.querySelectorAll('.slice').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('panel-' + id);
            if (panel) {
                panel.classList.add('active');
                stage.scrollTop = 0;
            }
        }

        // ── Search ────────────────────────────────────────────
        function filterLinks(query) {
            currentView = 'search';
            const q = query.trim().toLowerCase();
            const seen = new Set();
            const results = allServices.filter(s => {
                if (seen.has(s.link)) return false;
                if (!licenceAllows(s)) return false;
                seen.add(s.link);
                return (s.value || (s.name + ' ' + s.description)).toLowerCase().includes(q);
            });

            const panel = document.getElementById('panel-search');
            const body  = panel.querySelector('.panel-body');
            buildGrid(results, body, q);

            const header = panel.querySelector('.panel-title');
            header.textContent = results.length
                ? tr('Search Results') + ' (' + results.length + ')'
                : tr('No Results');

            showSpecialPanel('search');
            updateURL(query);
        }

        // ── My List ───────────────────────────────────────────
        function renderMyList() {
            const panel = document.getElementById('panel-mylist');
            const body  = panel.querySelector('.panel-body');
            const services = getCustomServices();

            if (!services.length) {
                body.innerHTML = '';
                const msg = document.createElement('p');
                msg.className = 'empty-list-msg';
                msg.setAttribute('data-i18n', '');
                msg.dataset.i18nKey = 'Your list is empty. Click any software card to bookmark it.';
                msg.textContent = tr('Your list is empty. Click any software card to bookmark it.');
                body.appendChild(msg);
            } else {
                buildGrid(services, body);
            }
        }

        if (myListBtn) {
            myListBtn.addEventListener('click', () => {
                renderMyList();
                showSpecialPanel('mylist');
                searchInput.value = '';
            });
        }

        // ── Search input (debounced) ──────────────────────────
        if (searchInput) {
            let timer = null;
            searchInput.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const q = searchInput.value.trim();
                    if (q) {
                        filterLinks(q);
                    } else if (currentView === 'search') {
                        selectSlice('highlights');
                    }
                }, 120);
            });
        }

        // ── Init ──────────────────────────────────────────────
        buildSliceMenu();
        buildPanelShells();
        refreshMyListCount();
        refreshPlatformBtn();
        refreshOpenBtn();

        // #cat-<slug> opens whichever slice owns that category and scrolls to it.
        function openFromHash() {
            const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
            if (!hash.startsWith('cat-')) return false;
            for (const slice of SLICES) {
                const hit = sliceCategories(slice).find(c => 'cat-' + slugify(c) === hash);
                if (hit) {
                    selectSlice(slice.id);
                    requestAnimationFrame(() => jumpToCategory(hit));
                    return true;
                }
            }
            return false;
        }

        const urlSearch = initialParams.get('search');
        if (urlSearch) {
            searchInput.value = urlSearch;
            filterLinks(urlSearch);
        } else if (!openFromHash()) {
            selectSlice('highlights');
        }

        window.addEventListener('hashchange', openFromHash);
    })
    .catch(err => console.error('[SoftwareCatalog] Failed to load JSON:', err));
