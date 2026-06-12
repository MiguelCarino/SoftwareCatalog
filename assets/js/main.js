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

// ── Slice configuration ──────────────────────────────────────
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
    }
];

// ── FA diagnostic ────────────────────────────────────────────
(function checkFA() {
    const probe = document.createElement('i');
    probe.className = 'fa-solid fa-circle-check';
    probe.style.cssText = 'position:fixed;top:-999px;visibility:hidden;font-size:16px';
    document.body.appendChild(probe);
    requestAnimationFrame(() => {
        const w = getComputedStyle(probe).width;
        console.log('[SoftwareCatalog] FA probe:', w,
            parseFloat(w) > 0 ? '✓ loaded' : '✗ NOT loaded');
        document.body.removeChild(probe);
    });
})();

// ── Main app ─────────────────────────────────────────────────
fetch('assets/json/software.json')
    .then(r => r.json())
    .then(data => {
        console.log('[SoftwareCatalog] JSON loaded:', data.length, 'items');

        const allServices = data;
        const sliceMenu   = document.getElementById('sliceMenu');
        const stage       = document.getElementById('stage');
        const searchInput = document.getElementById('search-input');
        const platformBtn = document.getElementById('platform-btn');
        const myListBtn   = document.getElementById('my-list-btn');
        const myListCount = document.getElementById('my-list-count');

        let currentView = null; // slice id | 'search' | 'mylist' | null

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

        function toggleCustom(service, cardEl) {
            if (isInCustom(service)) {
                customLinks = customLinks.filter(l => l !== service.link);
            } else {
                customLinks.push(service.link);
            }
            saveCustomLinks();
            refreshMyListCount();
            if (cardEl) cardEl.classList.toggle('in-list', isInCustom(service));
            // If currently viewing My List, re-render it
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
            platformBtn.dataset.tooltip = meta.tip;
            platformBtn.disabled        = (detectedPlatform === 'unknown');
        }

        if (platformBtn) {
            refreshPlatformBtn();
            platformBtn.addEventListener('click', () => {
                if (detectedPlatform === 'unknown') return;
                allPlatformsMode = !allPlatformsMode;
                refreshPlatformBtn();
                // Re-render current panel with updated platform filter
                if (currentView === 'search') {
                    filterLinks(searchInput.value);
                } else if (currentView === 'mylist') {
                    renderMyList();
                } else if (currentView) {
                    const panel = document.getElementById('panel-' + currentView);
                    if (panel) rebuildSlicePanel(currentView, panel);
                }
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
                ()  => showNotification('Install command copied! Paste it in your terminal.'),
                ()  => showNotification('Could not copy to clipboard.')
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
            webA.dataset.tooltip = 'Open website';
            webA.addEventListener('click', e => e.stopPropagation());
            row.appendChild(webA);

            for (const def of osDefs) {
                if (service[def.key] && platformAllows(def.platform)) {
                    const btn = document.createElement('button');
                    btn.className = 'os-icon';
                    btn.innerHTML = '<i class="' + def.icon + '"></i>';
                    btn.dataset.tooltip = def.tip;
                    const cmd = def.cmd(service[def.key]);
                    btn.addEventListener('click', e => { e.stopPropagation(); copyToClipboard(cmd); });
                    row.appendChild(btn);
                }
            }

            return row;
        }

        // ── Card builder ──────────────────────────────────────
        function buildCard(service) {
            const item = document.createElement('div');
            item.classList.add('sub-grid-item');
            if (isInCustom(service)) item.classList.add('in-list');

            item.addEventListener('click', e => {
                if (e.target.closest('a, .sub-row')) return;
                toggleCustom(service, item);
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

            item.appendChild(icon);
            item.appendChild(link);
            item.appendChild(desc);
            item.appendChild(buildOsRow(service));

            return item;
        }

        // ── Grid builder (flat, no dividers) ──────────────────
        function buildGrid(services, container) {
            container.innerHTML = '';
            if (!services.length) {
                const msg = document.createElement('p');
                msg.className = 'empty-list-msg';
                msg.textContent = 'Nothing here yet.';
                container.appendChild(msg);
                return;
            }
            const grid = document.createElement('div');
            grid.classList.add('sub-grid');
            services.forEach(s => grid.appendChild(buildCard(s)));
            container.appendChild(grid);
        }

        // ── Grid builder (with subcategory dividers) ──────────
        function buildGridWithDividers(sliceDef, container) {
            container.innerHTML = '';
            let first = true;
            for (const catName of sliceDef.categories) {
                // Collect services for this subcategory
                const services = allServices.filter(s =>
                    (s.categories || []).includes(catName)
                );
                if (!services.length) continue;

                // Only add divider if this slice has more than one subcategory
                if (sliceDef.categories.length > 1) {
                    const div = document.createElement('div');
                    div.className = 'subcat-divider';
                    if (first) div.classList.add('subcat-divider--first');
                    div.textContent = catName;
                    container.appendChild(div);
                }

                const grid = document.createElement('div');
                grid.classList.add('sub-grid');
                services.forEach(s => grid.appendChild(buildCard(s)));
                container.appendChild(grid);
                first = false;
            }
        }

        // ── Build all slice panels in stage (once at init) ────
        function buildAllPanels() {
            SLICES.forEach(slice => {
                const section = document.createElement('section');
                section.id = 'panel-' + slice.id;
                section.className = 'panel';

                const header = document.createElement('div');
                header.className = 'panel-header';
                header.innerHTML =
                    '<div class="panel-title">' + slice.label + '</div>' +
                    '<div class="panel-num">'   + slice.num   + '</div>';
                section.appendChild(header);

                const body = document.createElement('div');
                body.className = 'panel-body';
                section.appendChild(body);

                buildGridWithDividers(slice, body);
                stage.appendChild(section);
            });

            // Search results panel
            const searchPanel = document.createElement('section');
            searchPanel.id = 'panel-search';
            searchPanel.className = 'panel';
            searchPanel.innerHTML = '<div class="panel-header"><div class="panel-title">Search Results</div></div><div class="panel-body"></div>';
            stage.appendChild(searchPanel);

            // My List panel
            const mylistPanel = document.createElement('section');
            mylistPanel.id = 'panel-mylist';
            mylistPanel.className = 'panel';
            mylistPanel.innerHTML = '<div class="panel-header"><div class="panel-title">My List</div></div><div class="panel-body"></div>';
            stage.appendChild(mylistPanel);
        }

        // ── Rebuild a single slice panel (after platform toggle) ─
        function rebuildSlicePanel(sliceId, panelEl) {
            const slice = SLICES.find(s => s.id === sliceId);
            if (!slice) return;
            const body = panelEl.querySelector('.panel-body');
            if (body) buildGridWithDividers(slice, body);
        }

        // ── Build slice nav ────────────────────────────────────
        function buildSliceMenu() {
            SLICES.forEach(slice => {
                const el = document.createElement('div');
                el.className = 'slice';
                el.dataset.target = slice.id;
                el.innerHTML =
                    '<div class="slice-bg"></div>' +
                    '<div class="slice-large">' +
                        '<span class="slice-num-lg">' + slice.num + '</span>' +
                        '<h2 class="slice-text-lg">'  + slice.label + '</h2>' +
                        '<i class="' + slice.icon + ' slice-icon"></i>' +
                    '</div>' +
                    '<div class="slice-small">' +
                        '<span class="slice-text-sm">' + slice.label + '</span>' +
                        '<i class="' + slice.icon + ' slice-icon"></i>' +
                    '</div>';

                el.addEventListener('click', () => selectSlice(slice.id));
                sliceMenu.appendChild(el);
            });
        }

        // ── Navigation ────────────────────────────────────────
        function selectSlice(id) {
            currentView = id;
            searchInput.value = '';
            updateURL(null);

            document.body.classList.add('state-selected');

            // Activate slice tab
            document.querySelectorAll('.slice').forEach(s => {
                s.classList.toggle('active', s.dataset.target === id);
            });

            // Show panel
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('panel-' + id);
            if (panel) {
                panel.classList.add('active');
                stage.scrollTop = 0;
            }
        }

        function showSpecialPanel(id) {
            currentView = id;
            document.body.classList.add('state-selected');

            // Deactivate all slices (My List / Search has no slice)
            document.querySelectorAll('.slice').forEach(s => s.classList.remove('active'));

            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('panel-' + id);
            if (panel) {
                panel.classList.add('active');
                stage.scrollTop = 0;
            }
        }

        function resetView() {
            currentView = null;
            searchInput.value = '';
            updateURL(null);
            document.body.classList.remove('state-selected');
            document.querySelectorAll('.slice').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        }

        // ── Search ────────────────────────────────────────────
        function filterLinks(query) {
            currentView = 'search';
            const q = query.toLowerCase();
            const seen = new Set();
            const results = allServices.filter(s => {
                if (seen.has(s.link)) return false;
                seen.add(s.link);
                return s.value.toLowerCase().includes(q);
            });

            const panel = document.getElementById('panel-search');
            const body  = panel.querySelector('.panel-body');
            buildGrid(results, body);

            const header = panel.querySelector('.panel-title');
            header.textContent = results.length
                ? 'Search Results (' + results.length + ')'
                : 'No Results';

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
                msg.textContent = 'Your list is empty. Click any software card to bookmark it.';
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

        // ── Click logo → back to Highlights ──────────────────
        const brandLogo = document.querySelector('.brand-logo');
        if (brandLogo) brandLogo.addEventListener('click', () => selectSlice('highlights'));

        // ── Search input ──────────────────────────────────────
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.trim();
                if (q) {
                    filterLinks(q);
                } else if (currentView === 'search') {
                    selectSlice('highlights');
                }
            });
        }

        // ── Init ──────────────────────────────────────────────
        buildSliceMenu();
        buildAllPanels();
        refreshMyListCount();
        refreshPlatformBtn();

        // Restore from URL or default to Highlights
        const urlSearch = initialParams.get('search');
        if (urlSearch) {
            searchInput.value = urlSearch;
            filterLinks(urlSearch);
        } else {
            selectSlice('highlights');
        }
    })
    .catch(err => console.error('[SoftwareCatalog] Failed to load JSON:', err));
