// ── i18n bridge (i18n.js loads deferred, after this file) ────
function tr(key) { return (typeof window.scT === 'function') ? window.scT(key) : key; }

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
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch (e) {}
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

// ── Licence caveats ─────────────────────────────────────────
// `licence` carries two vocabularies: these four caveat tokens, and free-text
// SPDX ids (MIT, GPL-3.0, Apache-2.0 …) on the 60 entries that are plainly
// open. Nothing renders the field any more — it exists only to drive the open
// source only toggle, so an SPDX id has to read as "open", never as a caveat.
const LICENCE_CAVEATS = ['open-core', 'source', 'closed', 'reference'];

function isCaveatLicence(licence) {
    if (!licence) return false;
    return LICENCE_CAVEATS.indexOf(licence) >= 0 ||
           licence.toLowerCase().indexOf('proprietary') === 0;
}

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
        // The fleet's own tools lead, then the wider picks.
        categories: ['Carino Systems', 'Curated Highlights']
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
// A Reference page (Branding #pagetypes): hero, then a sticky bar of facet
// chips — Category, Platform, Open source — with a Find after them for the
// 1,300-odd entries, then the cards, each ending in its source line.
const DATA_FILE = 'assets/json/software.json';
const META_FILE = 'assets/json/meta.json';
const PAGE = 120;   // cards drawn at once when no category narrows the list

const PLATFORMS = [
    { id: 'windows', label: 'Windows', keys: ['windows'] },
    { id: 'mac',     label: 'macOS',   keys: ['macos'] },
    { id: 'linux',   label: 'Linux',   keys: ['fedora', 'debian', 'rhel', 'suse', 'flatpak'] },
];

// Install ids per platform; `platform` ties each to a Platform chip.
const osDefs = [
    { key: 'windows', icon: 'fa-brands fa-windows',  platform: 'windows', cmd: v => 'winget install -e --id ' + v,  tip: 'Copy Windows install command' },
    { key: 'macos',   icon: 'fa-brands fa-apple',    platform: 'mac',     cmd: v => 'brew install ' + v,            tip: 'Copy macOS install command'   },
    { key: 'debian',  icon: 'fa-brands fa-debian',   platform: 'linux',   cmd: v => 'sudo apt install ' + v,        tip: 'Copy Debian/Ubuntu command'   },
    { key: 'fedora',  icon: 'fa-brands fa-fedora',   platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy Fedora command'          },
    { key: 'suse',    icon: 'fa-brands fa-opensuse', platform: 'linux',   cmd: v => 'sudo zypper install ' + v,     tip: 'Copy openSUSE command'        },
    { key: 'rhel',    icon: 'fa-brands fa-redhat',   platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy RHEL command'            },
    { key: 'flatpak', icon: 'fa-brands fa-linux',    platform: 'linux',   cmd: v => 'flatpak install flathub ' + v, tip: 'Copy Flatpak command'         },
];

function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
}

function showLoadError(file) {
    const el = document.getElementById('loadErr');
    el.innerHTML = escapeHtml(tr('Could not load')) + ' <code>' + escapeHtml(file) + '</code>. ' +
        escapeHtml(tr('Serve this folder over http:// or check that the data/ directory is intact.')) +
        ' <code>python3 -m http.server</code>';
    el.hidden = false;
    document.getElementById('chips').hidden = true;
}

Promise.all([
    fetch(DATA_FILE).then(r => { if (!r.ok) throw new Error(DATA_FILE); return r.json().catch(() => { throw new Error(DATA_FILE); }); }),
    // The checked date is optional: without meta.json the cards simply omit it.
    fetch(META_FILE).then(r => r.ok ? r.json() : {}).catch(() => ({})),
])
    .then(([data, meta]) => start(data, meta || {}))
    .catch(err => showLoadError(err && /^assets\//.test(err.message) ? err.message : DATA_FILE));

function start(allServices, meta) {
    const UPDATED   = meta.updated || '';
    const chipsEl   = document.getElementById('chips');
    const results   = document.getElementById('results');
    const myListBtn = document.getElementById('my-list-btn');
    const myListCount = document.getElementById('my-list-count');

    // One choice per facet; `open` is persisted (a stance, not a per-visit
    // filter), the rest start fresh. Category opens on Highlights.
    const F = { cat: 'highlights', plat: null, open: openOnlyMode, find: '', mylist: false };
    let limit = PAGE;
    let findOpen = false;

    // ── Category helpers ──────────────────────────────────
    // The divider icon is whatever icon the category's entries use most, so
    // it labels the group without a second hardcoded map to keep in sync.
    const iconCache = {};
    function categoryIcon(cat) {
        if (iconCache[cat]) return iconCache[cat];
        const counts = {};
        allServices.forEach(s => {
            if ((s.categories || []).includes(cat)) counts[s.icon] = (counts[s.icon] || 0) + 1;
        });
        let best = 'fas fa-tag', top = 0;
        for (const k in counts) if (counts[k] > top) { top = counts[k]; best = k; }
        return (iconCache[cat] = best);
    }

    const catsCache = {};
    function sliceCategories(slice) {
        if (slice.categories) return slice.categories;
        if (catsCache[slice.id]) return catsCache[slice.id];
        const out = [], seen = new Set();
        allServices.forEach(s => {
            if (s.status !== slice.status) return;
            (s.categories || []).forEach(c => { if (!seen.has(c)) { seen.add(c); out.push(c); } });
        });
        return (catsCache[slice.id] = out);
    }

    function inSlice(slice, s) {
        if (slice.status && s.status !== slice.status) return false;
        return (s.categories || []).some(c => sliceCategories(slice).includes(c));
    }

    // ── Facets ────────────────────────────────────────────
    function passPlatform(s) {
        if (!F.plat) return true;
        const p = PLATFORMS.find(x => x.id === F.plat);
        return p.keys.some(k => s[k]);
    }
    function passOpen(s) { return !F.open || !isCaveatLicence(s.licence); }
    function passFind(s, q) {
        if (!q) return true;
        // `tags` is the hidden keyword field — how the offline stack stays
        // findable. Matched by WHOLE TOKEN: a substring match would let "out"
        // and "age" hit every entry tagged "outage".
        const hay = (s.name + ' ' + s.description + ' ' + (s.value || '')).toLowerCase();
        return hay.includes(q) || !!(s.tags && s.tags.split(' ').indexOf(q.replace(/[\s-]/g, '')) >= 0);
    }
    function passAll(s) {
        const slice = F.cat && SLICES.find(x => x.id === F.cat);
        return (!slice || inSlice(slice, s)) && passPlatform(s) && passOpen(s) && passFind(s, F.find);
    }
    // Two entries can share a link (one tool under two headings): show it once.
    function dedupe(list) {
        const seen = new Set();
        return list.filter(s => { if (seen.has(s.link)) return false; seen.add(s.link); return true; });
    }

    // ── URL sync ─────────────────────────────────────────
    function updateURL() {
        const url = new URL(window.location);
        if (F.find)             url.searchParams.set('search', F.find); else url.searchParams.delete('search');
        if (customLinks.length) url.searchParams.set('mylist', encodeLinks(customLinks)); else url.searchParams.delete('mylist');
        window.history.replaceState({}, '', url);
    }

    // ── My List ───────────────────────────────────────────
    function isInCustom(service) { return customLinks.includes(service.link); }
    function saveCustomLinks() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customLinks)); } catch (e) {}
        updateURL();
    }
    function refreshMyListCount() {
        const n = customLinks.length;
        myListCount.textContent = n > 9 ? '9+' : n;
        myListCount.classList.toggle('visible', n > 0);
        myListBtn.setAttribute('aria-pressed', F.mylist ? 'true' : 'false');
    }
    function toggleCustom(service, cardEl, starEl) {
        if (isInCustom(service)) customLinks = customLinks.filter(l => l !== service.link);
        else customLinks.push(service.link);
        saveCustomLinks();
        refreshMyListCount();
        const on = isInCustom(service);
        cardEl.classList.toggle('in-list', on);
        starEl.setAttribute('aria-pressed', on ? 'true' : 'false');
        starEl.dataset.tooltip = tr(on ? 'Remove from My List' : 'Save to My List');
        if (F.mylist) render();
    }

    // ── Notification (Branding .toast) ────────────────────
    function showNotification(msg) {
        document.querySelectorAll('.notification').forEach(el => el.remove());
        const n = document.createElement('div');
        n.className = 'notification';
        n.setAttribute('role', 'status');
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => {
            n.classList.add('fade-out');
            setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 400);
        }, 2600);
    }
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(
            () => showNotification(tr('Install command copied! Paste it in your terminal.')),
            () => showNotification(tr('Could not copy to clipboard.'))
        );
    }

    // ── Card (carino-ui.css .card.entry) ─────────────────
    // Clicking the card opens the site; the bookmark and install buttons are
    // their own controls, and the source line names where the link goes.
    function buildOsRow(service) {
        const row = document.createElement('div');
        row.className = 'sub-row';
        for (const def of osDefs) {
            if (!service[def.key] || (F.plat && F.plat !== def.platform)) continue;
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
        return row;
    }

    function buildCard(service, query) {
        const item = document.createElement('article');
        item.className = 'card entry sw' + (isInCustom(service) ? ' in-list' : '');
        item.addEventListener('click', e => {
            if (e.target.closest('a, button')) return;
            window.open(service.link, '_blank', 'noopener,noreferrer');
        });

        const head = document.createElement('div');
        head.className = 'sw-head';
        const icon = document.createElement('i');
        icon.className = service.icon + ' sw-icon';
        icon.setAttribute('aria-hidden', 'true');
        const link = document.createElement('a');
        link.className = 'e-title';
        link.href = service.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = highlight(service.name, query);
        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star-btn';
        star.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        star.setAttribute('aria-pressed', isInCustom(service) ? 'true' : 'false');
        star.setAttribute('aria-label', tr('Save to My List') + ' — ' + service.name);
        star.dataset.tooltip = tr(isInCustom(service) ? 'Remove from My List' : 'Save to My List');
        star.addEventListener('click', e => { e.stopPropagation(); toggleCustom(service, item, star); });
        head.append(icon, link, star);

        const desc = document.createElement('p');
        desc.className = 'e-desc';
        desc.innerHTML = highlight(service.description, query);

        const src = document.createElement('div');
        src.className = 'src-line';
        const when = service.updated || UPDATED;
        src.innerHTML = '<span>' + escapeHtml(tr('Source:')) + '</span><a href="' + escapeHtml(service.link) +
            '" target="_blank" rel="noopener noreferrer">' + escapeHtml(domainOf(service.link)) + ' ↗</a>' +
            (when ? '<span class="src-date">' + escapeHtml(tr('checked')) + ' ' + escapeHtml(when) + '</span>' : '');

        item.append(head, desc);
        const row = buildOsRow(service);
        if (row.childNodes.length) item.appendChild(row);
        item.appendChild(src);
        return item;
    }

    function grid(list, query) {
        const g = document.createElement('div');
        g.className = 'sub-grid';
        list.forEach(s => g.appendChild(buildCard(s, query)));
        return g;
    }

    function emptyMsg(text, withClear) {
        const p = document.createElement('p');
        p.className = 'empty-list-msg';
        p.textContent = tr(text);
        if (withClear) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'fchip clear';
            b.dataset.clear = '1';
            b.textContent = tr('Clear filters');
            p.appendChild(b);
        }
        return p;
    }

    // ── Chips ─────────────────────────────────────────────
    function chip(facet, val, on, label) {
        return '<button type="button" class="fchip' + (on ? ' active' : '') + '" aria-pressed="' + on +
            '" data-facet="' + facet + '" data-val="' + escapeHtml(val) + '">' + label + '</button>';
    }
    function anyOn() { return !!(F.cat || F.plat || F.open || F.find); }

    function renderChips(shown) {
        let h = '<span class="fchip-lbl">' + escapeHtml(tr('Category')) + '</span>';
        SLICES.forEach(s => { h += chip('cat', s.id, F.cat === s.id, escapeHtml(tr(s.label))); });
        h += '<span class="fchip-sep"></span><span class="fchip-lbl">' + escapeHtml(tr('Platform')) + '</span>';
        PLATFORMS.forEach(p => { h += chip('plat', p.id, F.plat === p.id, p.label); });
        h += '<span class="fchip-sep"></span>' + chip('open', '1', F.open, escapeHtml(tr('Open source only')));
        h += '<span class="fchip-sep"></span>';
        // Find comes after the chips, never first: a chip that opens into a
        // field (also the "/" key). It searches every category.
        h += findOpen || F.find
            ? '<input type="search" id="find" class="input find-input" value="' + escapeHtml(F.find) + '" placeholder="' +
              escapeHtml(tr('Find software')) + '" aria-label="' + escapeHtml(tr('Find software')) + '">'
            : '<button type="button" class="fchip find-chip" data-find="1"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> ' +
              escapeHtml(tr('Find')) + ' <span class="kbd">/</span></button>';
        if (anyOn()) h += '<button type="button" class="fchip clear" data-clear="1">' + escapeHtml(tr('Clear')) + '</button>';
        h += '<span class="fchips-count">' + shown + ' ' + escapeHtml(tr('shown')) + '</span>';
        const hadFocus = document.activeElement && document.activeElement.id === 'find';
        const caret = hadFocus ? document.activeElement.selectionStart : null;
        chipsEl.innerHTML = h;
        const input = document.getElementById('find');
        if (input) {
            input.addEventListener('input', onFind);
            input.addEventListener('keydown', e => { if (e.key === 'Escape') { F.find = ''; findOpen = false; render(); } });
            if (hadFocus || (findOpen && !F.find)) { input.focus(); if (caret != null) input.setSelectionRange(caret, caret); }
        }
    }

    let findTimer = null;
    function onFind(e) {
        const v = e.target.value.trim().toLowerCase();
        clearTimeout(findTimer);
        findTimer = setTimeout(() => {
            // a typed query searches the whole catalogue; a category chip can narrow it again
            if (v && !F.find) F.cat = null;
            F.find = v;
            limit = PAGE;
            updateURL();
            render();
        }, 140);
    }

    // ── Render ────────────────────────────────────────────
    function render() {
        results.innerHTML = '';
        let shown = 0;
        if (F.mylist) {
            const saved = dedupe(allServices.filter(s => customLinks.includes(s.link)));
            shown = saved.length;
            const h = document.createElement('h2');
            h.className = 'panel-title';
            h.textContent = tr('My List');
            results.appendChild(h);
            results.appendChild(saved.length ? grid(saved)
                : emptyMsg('Your list is empty. Tap the bookmark icon on a card to save it here.'));
        } else if (F.cat && !F.find) {
            // One category: its subcategories as dividers, as the slices had them.
            const slice = SLICES.find(x => x.id === F.cat);
            const cats = sliceCategories(slice);
            const seen = new Set();
            cats.forEach(catName => {
                const list = allServices.filter(s => (s.categories || []).includes(catName) && passAll(s));
                if (!list.length) return;
                list.forEach(s => seen.add(s.link));
                if (cats.length > 1) {
                    const div = document.createElement('div');
                    div.className = 'subcat-divider';
                    div.id = 'cat-' + slugify(catName);
                    div.innerHTML = '<i class="' + categoryIcon(catName) + '" aria-hidden="true"></i><span>' +
                        escapeHtml(tr(catName)) + '</span><span class="subcat-count">' + list.length + '</span>';
                    results.appendChild(div);
                }
                results.appendChild(grid(list));
            });
            shown = seen.size;
            if (!shown) results.appendChild(emptyMsg('Nothing matches these filters.', true));
        } else {
            const list = dedupe(allServices.filter(passAll));
            shown = list.length;
            if (!shown) results.appendChild(emptyMsg('Nothing matches these filters.', true));
            else {
                results.appendChild(grid(list.slice(0, limit), F.find));
                if (list.length > limit) {
                    const more = document.createElement('button');
                    more.type = 'button';
                    more.className = 'btn show-more';
                    more.dataset.more = '1';
                    more.textContent = tr('Show more') + ' (' + (list.length - limit) + ')';
                    results.appendChild(more);
                }
            }
        }
        renderChips(shown);
        refreshMyListCount();
    }

    // ── Hero counts and the footer line ───────────────────
    function renderMeta() {
        const n = dedupe(allServices).length;
        document.getElementById('heroStats').textContent = n + ' ' + tr('programs') + ' · ' + SLICES.length + ' ' +
            tr('categories') + (UPDATED ? ' · ' + tr('reviewed') + ' ' + UPDATED : '');
        document.getElementById('footLine').textContent =
            tr('Runs entirely in your browser. Every entry links to its source; checked {date}.').replace('{date}', UPDATED);
    }

    // ── Events ────────────────────────────────────────────
    chipsEl.addEventListener('click', e => {
        const b = e.target.closest('.fchip');
        if (!b) return;
        F.mylist = false;
        if (b.dataset.find) { findOpen = true; render(); return; }
        if (b.dataset.clear) return;   // handled below, with the empty-state button
        const k = b.dataset.facet, v = b.dataset.val;
        if (k === 'open') {
            F.open = !F.open;
            openOnlyMode = F.open;
            try { localStorage.setItem(OPEN_KEY, F.open ? '1' : '0'); } catch (err) {}
        } else {
            F[k] = F[k] === v ? null : v;
        }
        limit = PAGE;
        render();
        if (k === 'cat') history.replaceState({}, '', location.pathname + location.search + (F.cat ? '#' + F.cat : ''));
    });
    document.addEventListener('click', e => {
        if (e.target.closest('[data-clear]')) {
            F.cat = F.plat = null; F.open = false; F.find = ''; F.mylist = false; findOpen = false;
            openOnlyMode = false;
            try { localStorage.setItem(OPEN_KEY, '0'); } catch (err) {}
            limit = PAGE; updateURL(); render();
        } else if (e.target.closest('[data-more]')) {
            limit += PAGE * 2; render();
        }
    });
    myListBtn.addEventListener('click', () => { F.mylist = !F.mylist; render(); window.scrollTo(0, 0); });
    // "/" opens Find from anywhere that is not already a text field.
    document.addEventListener('keydown', e => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        e.preventDefault();
        F.mylist = false; findOpen = true; render();
        const input = document.getElementById('find');
        if (input) input.focus();
    });
    window.addEventListener('carino:langchange', () => { render(); renderMeta(); });

    // #<slice> picks a category; #cat-<slug> picks the slice owning that
    // subcategory and scrolls to its divider.
    function openFromHash() {
        const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
        if (!hash) return false;
        if (SLICES.some(s => s.id === hash)) { F.cat = hash; F.find = ''; render(); return true; }
        if (!hash.startsWith('cat-')) return false;
        for (const slice of SLICES) {
            const hit = sliceCategories(slice).find(c => 'cat-' + slugify(c) === hash);
            if (hit) {
                F.cat = slice.id; F.find = ''; render();
                const el = document.getElementById(hash);
                if (el) el.scrollIntoView();
                return true;
            }
        }
        return false;
    }

    // ── Init ──────────────────────────────────────────────
    renderMeta();
    const urlSearch = initialParams.get('search');
    if (urlSearch) { F.find = urlSearch.trim().toLowerCase(); F.cat = null; render(); }
    else if (!openFromHash()) render();
    window.addEventListener('hashchange', openFromHash);
}
