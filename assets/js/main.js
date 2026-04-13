// ============================================================
// Platform detection
// ============================================================
function detectPlatform() {
    // Modern API (Chrome 90+, Edge)
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        const p = navigator.userAgentData.platform.toLowerCase();
        if (p.startsWith('win')) return 'windows';
        if (p === 'macos') return 'mac';
        if (p === 'linux') return 'linux';
    }
    // Fallback for Firefox and older browsers that don't support userAgentData.
    // navigator.platform is deprecated but still the best cross-browser fallback here.
    // eslint-disable-next-line no-restricted-globals
    const p = (navigator.platform || '').toLowerCase();
    if (p.startsWith('win')) return 'windows';
    if (p.startsWith('mac') || p === 'iphone' || p === 'ipad') return 'mac';
    if (p.startsWith('linux') || p === 'android') return 'linux';
    return 'unknown';
}

const detectedPlatform = detectPlatform();
let allPlatformsMode = (detectedPlatform === 'unknown');

function platformAllows(platform) {
    if (allPlatformsMode) return true;
    return detectedPlatform === platform;
}

// ============================================================
// Custom list (My List) — localStorage + URL persistence
// ============================================================
const STORAGE_KEY = 'sc_custom';

// Parse URL once at startup; both loadCustomLinks and loadInitialSearch read from this.
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

// ============================================================
// Main app — runs after JSON is fetched
// ============================================================
fetch('assets/json/software.json')
    .then(r => r.json())
    .then(data => {
        // software.json is a flat array of services; each service declares its own
        // "categories" field (array of category title strings). Build the sidebar
        // categories in insertion order (order of first appearance across services).
        const allServices = data;
        const categoryMap = new Map();
        allServices.forEach(service => {
            (service.categories || []).forEach(title => {
                if (!categoryMap.has(title)) categoryMap.set(title, []);
                categoryMap.get(title).push(service);
            });
        });
        const categories = Array.from(categoryMap, ([title, services]) => ({ title, services }));

        const mainGrid      = document.getElementById('main-grid');
        const buttonRow     = document.getElementById('button-row');
        const categoryTitle = document.getElementById('category-title');
        const searchInput   = document.getElementById('search-input');
        const platformBtn   = document.getElementById('platform-btn');

        let activeButton = null;
        // Track current view for re-render on platform toggle.
        // index -1 = search, -2 = My List, ≥0 = category.
        // currentSearchQuery is only meaningful when currentViewIndex === -1.
        let currentViewIndex   = 0;
        let currentSearchQuery = '';

        // ---- URL sync ----
        function updateURL(query) {
            const url = new URL(window.location);
            if (query) { url.searchParams.set('search', query); }
            else        { url.searchParams.delete('search'); }
            if (customLinks.length > 0) {
                url.searchParams.set('mylist', encodeLinks(customLinks));
            } else {
                url.searchParams.delete('mylist');
            }
            window.history.replaceState({}, '', url);
        }

        // ---- Custom list helpers ----
        function isInCustom(service) {
            return customLinks.includes(service.link);
        }

        function saveCustomLinks() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customLinks));
            updateURL(searchInput.value || null);
        }

        function toggleCustom(service, cardBtn) {
            if (isInCustom(service)) {
                customLinks = customLinks.filter(l => l !== service.link);
            } else {
                customLinks.push(service.link);
            }
            saveCustomLinks();
            refreshCustomBtn();
            if (cardBtn) {
                const inList = isInCustom(service);
                cardBtn.dataset.tooltip = inList ? 'Remove from My List' : 'Save to My List';
                cardBtn.classList.toggle('in-list', inList);
            }
        }

        function getCustomServices() {
            const seen = new Set();
            return allServices.filter(s => {
                if (!customLinks.includes(s.link) || seen.has(s.link)) return false;
                seen.add(s.link);
                return true;
            });
        }

        // ---- Platform button ----
        // 'all' key: user toggled all-platforms on a known OS.
        // 'unknown' key: detection failed — same display but non-interactive.
        const platformMeta = {
            windows: { cls: 'plat-win', tip: 'Showing Windows only — click for all platforms' },
            mac:     { cls: 'plat-mac', tip: 'Showing macOS only — click for all platforms' },
            linux:   { cls: 'plat-lnx', tip: 'Showing Linux only — click for all platforms' },
            unknown: { cls: 'plat-all', tip: 'Showing all platforms' },
            all:     { cls: 'plat-all', tip: 'All platforms — click to filter by your OS' },
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
            const key = detectedPlatform === 'unknown' ? 'unknown'
                      : allPlatformsMode               ? 'all'
                      : detectedPlatform;
            const meta = platformMeta[key];
            platformBtn.innerHTML       = '<i class="' + platformIcons[key] + '"></i>';
            platformBtn.className       = 'platform-btn ' + meta.cls;
            platformBtn.dataset.tooltip = meta.tip;
            platformBtn.disabled        = (detectedPlatform === 'unknown');
        }

        if (platformBtn) {
            refreshPlatformBtn();
            platformBtn.addEventListener('click', function () {
                if (detectedPlatform === 'unknown') return;
                allPlatformsMode = !allPlatformsMode;
                refreshPlatformBtn();
                // Re-render current view with updated platform filter.
                // For search, re-run the filter so results reflect the new platform.
                if (currentViewIndex === -1) {
                    filterLinks(currentSearchQuery);
                } else {
                    showCategory(currentViewIndex);
                }
            });
        }

        // ---- Notification ----
        function showNotification(msg) {
            const n = document.createElement('div');
            n.className = 'notification';
            n.innerText = msg;
            document.body.appendChild(n);
            setTimeout(() => {
                n.classList.add('fade-out');
                setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 400);
            }, 2600);
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(
                ()  => showNotification('Install command copied! Paste it in your terminal.'),
                ()  => showNotification('Could not copy to clipboard.')
            );
        }

        // ---- OS install icons ----
        // FA icons used where Font Awesome Free has the brand icon.
        // Letter monograms used as placeholders for distros not in FA Free —
        // replace the <span> or swap cls to a real icon class when you have one.
        const osDefs = [
            { key: 'windows', type: 'fa',     icon: 'fab fa-windows',              platform: 'windows', cmd: v => 'winget install -e --id ' + v,  tip: 'Copy Windows install command' },
            { key: 'macos',   type: 'fa',     icon: 'fab fa-apple',                platform: 'mac',     cmd: v => 'brew install ' + v,            tip: 'Copy Mac install command' },
            { key: 'debian',  type: 'letter', letter: 'D', cls: 'os-deb',          platform: 'linux',   cmd: v => 'sudo apt install ' + v,        tip: 'Copy Debian/Ubuntu command' },
            { key: 'fedora',  type: 'letter', letter: 'F', cls: 'os-fed',          platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy Fedora command' },
            { key: 'suse',    type: 'letter', letter: 'S', cls: 'os-suse',         platform: 'linux',   cmd: v => 'sudo zypper install ' + v,     tip: 'Copy openSUSE command' },
            { key: 'rhel',    type: 'letter', letter: 'R', cls: 'os-rhel',         platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy RHEL command' },
            { key: 'flatpak', type: 'fa',     icon: 'fab fa-linux',                platform: 'linux',   cmd: v => 'flatpak install flathub ' + v, tip: 'Copy Flatpak command' },
        ];

        function buildOsRow(service) {
            const row = document.createElement('div');
            row.classList.add('sub-row');

            // Website link is always first
            const webA = document.createElement('a');
            webA.className = 'os-icon os-web';
            webA.href = service.link;
            webA.target = '_blank';
            webA.rel = 'noopener noreferrer';
            webA.innerHTML = '<i class="fas fa-globe"></i>';
            webA.dataset.tooltip = 'Open website';
            webA.addEventListener('click', e => e.stopPropagation());
            row.appendChild(webA);

            for (const def of osDefs) {
                if (service[def.key] && platformAllows(def.platform)) {
                    let el;
                    if (def.type === 'fa') {
                        el = document.createElement('i');
                        el.className = def.icon + ' os-icon';
                    } else {
                        el = document.createElement('span');
                        el.className = 'os-icon os-letter ' + def.cls;
                        el.textContent = def.letter;
                    }
                    el.dataset.tooltip = def.tip;
                    const cmd = def.cmd(service[def.key]);
                    el.addEventListener('click', e => { e.stopPropagation(); copyToClipboard(cmd); });
                    row.appendChild(el);
                }
            }

            return row;
        }

        // ---- Card builder ----
        function buildCard(service) {
            const item = document.createElement('div');
            item.classList.add('sub-grid-item');

            const addBtn = document.createElement('button');
            const inList = isInCustom(service);
            addBtn.className = 'card-add-btn' + (inList ? ' in-list' : '');
            addBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            addBtn.dataset.tooltip = inList ? 'Remove from My List' : 'Save to My List';
            addBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                toggleCustom(service, addBtn);
            });

            const icon = document.createElement('i');
            icon.className = service.icon;

            const link = document.createElement('a');
            link.href = service.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = service.name;

            const desc = document.createElement('span');
            desc.textContent = service.description;

            item.appendChild(addBtn);
            item.appendChild(icon);
            item.appendChild(link);
            item.appendChild(desc);
            item.appendChild(buildOsRow(service));

            return item;
        }

        // ---- Category rendering ----
        function showCategory(index, services = null) {
            currentViewIndex = index;
            mainGrid.innerHTML = '';

            let cat;
            if (index === -1) {
                cat = { title: 'Search Results', services: services || allServices };
            } else if (index === -2) {
                cat = { title: 'My List', services: getCustomServices() };
            } else {
                cat = categories[index];
            }

            categoryTitle.textContent = cat.title;

            if (index === -2 && cat.services.length === 0) {
                const msg = document.createElement('p');
                msg.className = 'empty-list-msg';
                msg.textContent = 'Your list is empty. Click the + on any software card to save it here.';
                mainGrid.appendChild(msg);
                return;
            }

            const grid = document.createElement('div');
            grid.classList.add('sub-grid');
            cat.services.forEach(s => grid.appendChild(buildCard(s)));
            mainGrid.appendChild(grid);
        }

        // ---- Sidebar buttons ----
        function highlightButton(btn) {
            if (activeButton) activeButton.classList.remove('active');
            btn.classList.add('active');
            activeButton = btn;
        }

        function createButton(category, index) {
            const btn = document.createElement('button');
            btn.textContent = category.title;
            btn.addEventListener('click', () => {
                showCategory(index);
                highlightButton(btn);
                searchInput.value = '';
                updateURL(null);
            });
            return btn;
        }

        // ---- Custom category button (orange, inserted after index 0) ----
        let customCatBtn = null;

        function refreshCustomBtn() {
            if (!customCatBtn) return;
            const n = customLinks.length;
            customCatBtn.textContent = 'My List' + (n > 0 ? ' (' + n + ')' : '');
            customCatBtn.style.display = n > 0 ? '' : 'none';
            // If the user is viewing My List and just removed the last item, go back.
            if (n === 0 && currentViewIndex === -2) {
                showCategory(0);
                const firstCatBtn = buttonRow.children[0];
                if (firstCatBtn) highlightButton(firstCatBtn);
            }
        }

        function createCustomCatBtn() {
            customCatBtn = document.createElement('button');
            customCatBtn.className = 'custom-cat-btn';
            refreshCustomBtn();
            customCatBtn.addEventListener('click', () => {
                showCategory(-2);
                highlightButton(customCatBtn);
                searchInput.value = '';
                currentSearchQuery = '';
                updateURL(null);
            });
            // Place right after "Curated Highlights" (first button)
            const first = buttonRow.children[0];
            if (first && first.nextSibling) {
                buttonRow.insertBefore(customCatBtn, first.nextSibling);
            } else {
                buttonRow.appendChild(customCatBtn);
            }
        }

        // ---- Search ----
        function filterLinks(query) {
            currentViewIndex   = -1;
            currentSearchQuery = query;
            const seen = new Set();
            const results = allServices.filter(s => {
                if (seen.has(s.link)) return false;
                seen.add(s.link);
                return s.value.toLowerCase().includes(query.toLowerCase());
            });
            showCategory(-1, results);
            updateURL(query);
        }

        function loadInitialSearch() {
            const q = initialParams.get('search');
            if (q) { searchInput.value = q; filterLinks(q); }
        }

        // ---- Init ----
        categories.forEach((cat, i) => {
            const btn = createButton(cat, i);
            buttonRow.appendChild(btn);
            if (i === 0) highlightButton(btn);
        });

        createCustomCatBtn();

        searchInput.addEventListener('input', () => filterLinks(searchInput.value));

        showCategory(0);
        loadInitialSearch();
    })
    .catch(err => console.error('Error loading software catalog:', err));
