// ── i18n bridge (i18n.js loads deferred, after this file) ────
function tr(key) { return (typeof window.scT === 'function') ? window.scT(key) : key; }

// ── Theme: Gold & Black (default) / Colourful ────────────────
// The inline script in <head> has already set <html data-carino-theme> before
// first paint; this owns the orb that switches it and remembers the choice in
// localStorage and in a carino-theme cookie that the rest of the fleet can
// read later (Domain=.carino.systems only on that domain).
const THEME_KEY = 'carino-theme';
const Theme = (() => {
    const root = document.documentElement;
    const current = () => root.getAttribute('data-carino-theme') === 'color' ? 'color' : 'gold';
    // The theme a click asked for while its View Transition has not painted
    // it yet, so a quick second click toggles from there instead of being lost.
    let pending = null;

    function remember(t) {
        try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
        const domain = /(^|\.)carino\.systems$/.test(location.hostname) ? '; Domain=.carino.systems' : '';
        try {
            document.cookie = THEME_KEY + '=' + t + '; Path=/; Max-Age=31536000; SameSite=Lax' + domain +
                (location.protocol === 'https:' ? '; Secure' : '');
        } catch (e) {}
    }

    function paintMeta(t) {
        const meta = document.getElementById('carinoThemeColor');
        if (!meta) return;
        const dark = root.getAttribute('data-theme') !== 'light' && window.matchMedia &&
            matchMedia('(prefers-color-scheme: dark)').matches;
        meta.content = t === 'gold' ? '#050505' : (dark ? '#0e1420' : '#eef3fc');
    }

    function labelOrb(orb) {
        if (!orb) return;
        const t = current();
        // A switch: on means Colourful. Hovering shows the other theme's
        // mark, so the label only has to say what it is.
        orb.setAttribute('aria-checked', t === 'color' ? 'true' : 'false');
        orb.setAttribute('aria-label', tr('Toggle theme'));
        orb.title = tr('Toggle theme');
    }

    function apply(t) {
        root.setAttribute('data-carino-theme', t);
        paintMeta(t);
        labelOrb(document.getElementById('scOrb'));
        try { window.dispatchEvent(new CustomEvent('carino:themechange', { detail: { theme: t } })); } catch (e) {}
    }

    function toggle(orb) {
        const next = (pending || current()) === 'gold' ? 'color' : 'gold';
        pending = null;
        remember(next);
        // A ?theme= review link has done its job; drop it so a reload keeps
        // the choice the visitor just made.
        try {
            const url = new URL(location.href);
            if (url.searchParams.has('theme')) {
                url.searchParams.delete('theme');
                history.replaceState(history.state, '', url.pathname + url.search + url.hash);
            }
        } catch (e) {}
        const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!document.startViewTransition || still || document.visibilityState !== 'visible') { apply(next); return; }
        // The new theme grows out of the orb as a circle.
        const r = orb.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        root.style.setProperty('--vt-x', x + 'px');
        root.style.setProperty('--vt-y', y + 'px');
        root.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
        pending = next;
        let vt;
        try { vt = document.startViewTransition(() => apply(next)); } catch (e) { pending = null; apply(next); return; }
        // A newer click skips this transition; its promises then reject.
        const settle = () => { if (pending === next) pending = null; };
        vt.updateCallbackDone.then(settle, settle);
        vt.ready.catch(() => {});
        vt.finished.catch(() => {});
    }

    // carino-navbar.js builds #carinoNav after this file runs; put the orb
    // just left of its "Carino" once it exists.
    function mountOrb() {
        if (document.getElementById('scOrb')) return true;
        const brand = document.querySelector('#carinoNav .cn-brand');
        const name = brand && brand.querySelector('.brand-name');
        if (!name) return false;
        const orb = document.createElement('button');
        orb.type = 'button';
        orb.id = 'scOrb';
        orb.className = 'sc-orb';
        // the Software mark in both colourings; CSS shows the current theme's,
        // and the other one under a pointer
        orb.innerHTML = '<img class="sc-orb-gold" src="assets/images/logo.svg" alt="" width="28" height="28">' +
            '<img class="sc-orb-color" src="assets/images/logo-color.svg" alt="" width="28" height="28">';
        orb.setAttribute('role', 'switch');
        orb.addEventListener('click', () => toggle(orb));
        brand.insertBefore(orb, name);
        labelOrb(orb);
        // the navbar refits on resize; nudge it now that the brand is wider
        window.dispatchEvent(new Event('resize'));
        return true;
    }
    function whenNavbar() {
        if (mountOrb()) return;
        const mo = new MutationObserver(() => { if (mountOrb()) mo.disconnect(); });
        mo.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => mo.disconnect(), 10000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenNavbar);
    else whenNavbar();
    // after i18n.js has adopted the new language (its listener runs later)
    window.addEventListener('carino:langchange', () => setTimeout(() => labelOrb(document.getElementById('scOrb')), 0));
    // another open tab switched: follow it (no transition, it is not looking)
    window.addEventListener('storage', (e) => {
        if (e.key !== THEME_KEY) return;
        const t = e.newValue === 'color' ? 'color' : e.newValue === 'gold' ? 'gold' : null;
        if (t && t !== current()) apply(t);
    });
    if (window.matchMedia) {
        const mq = matchMedia('(prefers-color-scheme: dark)');
        const repaint = () => paintMeta(current());
        if (mq.addEventListener) mq.addEventListener('change', repaint);
    }
    // the orb's labels need i18n.js, which loads after this file
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => labelOrb(document.getElementById('scOrb')), 0));

    return { current, apply };
})();

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
        // The wider picks; the fleet's own tools have their own category.
        categories: ['Curated Highlights']
    },
    {
        id: 'carino',
        label: 'Carino Systems',
        icon: 'fa-solid fa-c',
        num: '02',
        categories: ['Carino Systems']
    },
    {
        id: 'basic',
        label: 'Basic Software',
        icon: 'fa-solid fa-house',
        num: '03',
        categories: ['Essentials', 'Web Browsers', 'Language and Culture']
    },
    {
        id: 'general',
        label: 'General Software',
        icon: 'fa-solid fa-layer-group',
        num: '04',
        categories: ['Gaming and Entertainment', 'Multimedia and Design', 'AI / Machine learning']
    },
    {
        id: 'professional',
        label: 'Professional',
        icon: 'fa-solid fa-briefcase',
        num: '05',
        categories: ['Development', 'Open Source related', 'STEM and Research']
    },
    {
        id: 'it-systems',
        label: 'IT & Systems',
        icon: 'fa-solid fa-server',
        num: '06',
        categories: ['IT and DevOps', 'Operating Systems', 'Hardware', 'Monitoring and Status']
    },
    {
        id: 'security',
        label: 'Security',
        icon: 'fa-solid fa-shield-halved',
        num: '07',
        categories: ['(Cyber)Security']
    },
    {
        // Staging ground: entries land here first and graduate into the slices
        // above once vetted. Membership is the `status` field on the entry, so
        // promoting one is a single-word edit.
        id: 'reviewing',
        label: 'Reviewing',
        icon: 'fa-solid fa-flask',
        num: '08',
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

// Each programme gets an app-tile colour derived from its name, so a card keeps
// the same colour across visits without a colour field in the data.
const TILE_HUES = 7;   // the seven category colours, so tiles and tabs are one family
function hueOf(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % TILE_HUES;
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
    { id: 'windows', label: 'Windows', icon: 'fa-brands fa-windows', keys: ['windows'] },
    { id: 'mac',     label: 'macOS',   icon: 'fa-brands fa-apple',   keys: ['macos'] },
    { id: 'linux',   label: 'Linux',   icon: 'fa-brands fa-linux',   keys: ['fedora', 'debian', 'rhel', 'suse', 'flatpak'] },
];

// Install ids per platform; `platform` ties each to a Platform chip. `label`
// names the button — a bare OS glyph never said that clicking it copies.
const osDefs = [
    { key: 'windows', icon: 'fa-brands fa-windows',  label: 'winget',  platform: 'windows', cmd: v => 'winget install -e --id ' + v,  tip: 'Copy Windows install command' },
    { key: 'macos',   icon: 'fa-brands fa-apple',    label: 'brew',    platform: 'mac',     cmd: v => 'brew install ' + v,            tip: 'Copy macOS install command'   },
    { key: 'debian',  icon: 'fa-brands fa-debian',   label: 'apt',     platform: 'linux',   cmd: v => 'sudo apt install ' + v,        tip: 'Copy Debian/Ubuntu command'   },
    { key: 'fedora',  icon: 'fa-brands fa-fedora',   label: 'dnf',     platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy Fedora command'          },
    { key: 'suse',    icon: 'fa-brands fa-opensuse', label: 'zypper',  platform: 'linux',   cmd: v => 'sudo zypper install ' + v,     tip: 'Copy openSUSE command'        },
    { key: 'rhel',    icon: 'fa-brands fa-redhat',   label: 'rhel',    platform: 'linux',   cmd: v => 'sudo dnf install ' + v,        tip: 'Copy RHEL command'            },
    { key: 'flatpak', icon: 'fa-brands fa-linux',    label: 'flatpak', platform: 'linux',   cmd: v => 'flatpak install flathub ' + v, tip: 'Copy Flatpak command'         },
];
const DEFAULT_CAT = 'highlights';

// ── Platform detection ───────────────────────────────────────
// The visitor's own OS decides which install buttons a card leads with; the
// others fold behind a "+N". Phones and tablets get null: there is nothing to
// paste a winget or apt command into, so every button shows.
function detectPlatform() {
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod/i.test(ua)) return null;
    const hint = navigator.userAgentData && navigator.userAgentData.platform;
    const p = (hint || navigator.platform || '').toLowerCase();
    if (p.startsWith('win')) return 'windows';
    if (p.startsWith('mac')) return navigator.maxTouchPoints > 1 ? null : 'mac';   // iPadOS reports "MacIntel"
    if (p.startsWith('linux') || p.includes('x11') || /CrOS/.test(ua)) return 'linux';
    return null;
}
const MY_OS = detectPlatform();

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
    document.getElementById('tabs').hidden = true;
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
    const tabsEl    = document.getElementById('tabs');
    const findEl    = document.getElementById('find');
    const findClear = document.getElementById('findClear');
    const headEl    = document.getElementById('scHead');
    const searchEl  = findEl.parentElement;
    const results   = document.getElementById('results');
    const myListBtn = document.getElementById('my-list-btn');
    const myListCount = document.getElementById('my-list-count');

    // One choice per facet; `open` is persisted (a stance, not a per-visit
    // filter), the rest start fresh. Category opens on Highlights.
    const F = { cat: DEFAULT_CAT, plat: null, open: openOnlyMode, find: '', mylist: false };
    let limit = PAGE;

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

    // ── Notification (carino-ui.css .toast) ───────────────
    // One toast, top-right under the navbar, as on Desk and Metadata.
    let toast = null;
    function showNotification(msg, err) {
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = (err ? '✖ ' : '✔ ') + msg;
        toast.className = 'toast show ' + (err ? 'err' : 'ok');
        clearTimeout(toast._to);
        toast._to = setTimeout(() => { toast.className = 'toast ' + (err ? 'err' : 'ok'); }, 2600);
    }
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(
            () => showNotification(tr('Install command copied! Paste it in your terminal.')),
            () => showNotification(tr('Could not copy to clipboard.'), true)
        );
    }

    // ── Card (carino-ui.css .card.entry) ─────────────────
    // Clicking the card opens the site; the bookmark and install buttons are
    // their own controls, and the source line names where the link goes.
    function buildOsRow(service) {
        const row = document.createElement('div');
        row.className = 'sub-row';
        // Nothing to install (a web app, a vendor page): the row's one button
        // is the site itself, so the card still ends on an action.
        if (!osDefs.some(d => service[d.key])) {
            row.classList.add('web');
            const a = document.createElement('a');
            a.className = 'os-icon p-web';
            a.href = service.link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = '<i class="fa-solid fa-globe" aria-hidden="true"></i><span>' + escapeHtml(tr('Website')) + '</span>';
            a.dataset.tooltip = domainOf(service.link);
            a.setAttribute('aria-label', tr('Open website') + ' — ' + service.name);
            row.appendChild(a);
            return row;
        }
        const lbl = document.createElement('span');
        lbl.className = 'sub-row-lbl';
        lbl.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i>' + escapeHtml(tr('Install'));
        row.appendChild(lbl);
        // A picked Platform chip shows only its buttons. Otherwise the visitor's
        // OS leads and the rest fold behind "+N" — unless the card has none for
        // that OS, when they all show.
        const defs = osDefs.filter(d => service[d.key] && (!F.plat || F.plat === d.platform));
        const lead = F.plat || !MY_OS ? defs : defs.filter(d => d.platform === MY_OS);
        const shown = lead.length ? lead : defs;
        for (const def of defs) {
            const btn = document.createElement('button');
            btn.type = 'button';
            // tonal chip, tinted by the platform it installs on
            btn.className = 'os-icon p-' + def.platform;
            btn.innerHTML = '<i class="' + def.icon + '" aria-hidden="true"></i><span>' + def.label + '</span>';
            const cmd = def.cmd(service[def.key]);
            // the tip is the command itself, so you know what lands on the clipboard
            btn.dataset.tooltip = cmd;
            btn.setAttribute('aria-label', tr(def.tip) + ' — ' + service.name);
            btn.addEventListener('click', e => { e.stopPropagation(); copyToClipboard(cmd); });
            btn.hidden = !shown.includes(def);
            row.appendChild(btn);
        }
        const rest = defs.length - shown.length;
        if (rest > 0) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'os-more';
            more.textContent = '+' + rest;
            more.setAttribute('aria-label', tr('Show other platforms') + ' — ' + service.name);
            more.dataset.tooltip = tr('Show other platforms');
            more.addEventListener('click', e => {
                e.stopPropagation();
                row.querySelectorAll('.os-icon[hidden]').forEach(b => { b.hidden = false; });
                more.remove();
            });
            row.appendChild(more);
        }
        return row;
    }

    // A store badge on the cover: the fleet's own tools, or a plainly open
    // licence (an SPDX id, never one of the caveat tokens).
    function badgeOf(service) {
        if ((service.categories || []).includes('Carino Systems')) return 'Carino';
        if (service.licence && !isCaveatLicence(service.licence)) return 'Open source';
        return '';
    }

    // App-store card: a cover with the programme's icon in its colour (and
    // the bookmark over it), then the name, its source, two lines of
    // description and the install chips.
    function buildCard(service, query) {
        const item = document.createElement('article');
        item.className = 'card entry sw' + (isInCustom(service) ? ' in-list' : '');
        item.addEventListener('click', e => {
            if (e.target.closest('a, button')) return;
            window.open(service.link, '_blank', 'noopener,noreferrer');
        });

        const cover = document.createElement('div');
        cover.className = 'sw-cover hue-' + hueOf(service.name);
        cover.innerHTML = '<i class="' + escapeHtml(service.icon) + ' sw-art" aria-hidden="true"></i>';
        const badge = badgeOf(service);
        if (badge) cover.insertAdjacentHTML('afterbegin', '<span class="sw-badge">' + escapeHtml(tr(badge)) + '</span>');

        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star-btn';
        star.innerHTML = '<i class="fa-regular fa-bookmark off"></i><i class="fa-solid fa-bookmark on"></i>';
        star.setAttribute('aria-pressed', isInCustom(service) ? 'true' : 'false');
        star.setAttribute('aria-label', tr('Save to My List') + ' — ' + service.name);
        star.dataset.tooltip = tr(isInCustom(service) ? 'Remove from My List' : 'Save to My List');
        star.addEventListener('click', e => { e.stopPropagation(); toggleCustom(service, item, star); });
        cover.appendChild(star);

        const body = document.createElement('div');
        body.className = 'sw-body';
        const link = document.createElement('a');
        link.className = 'e-title';
        link.href = service.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = highlight(service.name, query);
        const src = document.createElement('div');
        src.className = 'src-line';
        const when = service.updated || UPDATED;
        // The catalogue-wide check month sits in the head and the footer; a
        // card prints a date only when the entry carries its own. Hover (and
        // screen readers) still get the date on every card.
        const checked = when ? tr('checked') + ' ' + when : '';
        src.title = tr('Source:') + ' ' + domainOf(service.link) + (checked ? ' · ' + checked : '');
        src.innerHTML = '<span class="sr-only">' + escapeHtml(tr('Source:')) + '</span><a href="' + escapeHtml(service.link) +
            '" target="_blank" rel="noopener noreferrer" tabindex="-1">' + escapeHtml(domainOf(service.link)) + '</a>' +
            (service.updated ? '<span class="src-date">· ' + escapeHtml(checked) + '</span>'
                : (checked ? '<span class="sr-only">' + escapeHtml(checked) + '</span>' : ''));
        const desc = document.createElement('p');
        desc.className = 'e-desc';
        desc.innerHTML = highlight(service.description, query);
        body.append(link, src, desc);
        const row = buildOsRow(service);
        if (row.querySelector('.os-icon')) body.appendChild(row);

        item.append(cover, body);
        return item;
    }

    // Cards pop in on a fresh view, staggered by their place on the page and
    // capped so a long list does not keep the last ones waiting. Typing in
    // the search re-renders without it, or every keystroke would replay it.
    // "Show more" sets popFrom, so only the newly added cards pop.
    let animate = true, popFrom = 0, cardNo = 0;
    function popCard(s, query) {
        const card = buildCard(s, query), n = cardNo++;
        if (animate && n >= popFrom) {
            card.classList.add('pop');
            card.style.setProperty('--pop-i', Math.min(n - popFrom, 16));
        }
        return card;
    }
    function grid(list, query) {
        const g = document.createElement('div');
        g.className = 'sub-grid';
        list.forEach(s => g.appendChild(popCard(s, query)));
        return g;
    }

    // ── Storefront: the opening (Highlights) view ─────────
    // A featured banner that rotates, a tile per category, then a shelf per
    // subcategory that scrolls sideways — an app store's front page.
    const FEATURED = 6;
    let heroTimer = null;
    function featuredList() {
        // the fleet's own tools lead, then curated picks that install somewhere;
        // drawn from every category, since the banner sits on Highlights only
        const inCat = c => allServices.filter(s => (s.categories || []).includes(c) &&
            passPlatform(s) && passOpen(s) && passFind(s, F.find));
        const fleet = inCat('Carino Systems').slice(0, 2);
        const picks = inCat('Curated Highlights').filter(s => osDefs.some(d => s[d.key]));
        return dedupe(fleet.concat(picks)).slice(0, FEATURED);
    }

    function heroSlide(s, i) {
        const el = document.createElement('article');
        el.className = 'sf-slide hue-' + hueOf(s.name) + (i === 0 ? ' on' : '');
        el.setAttribute('role', 'group');
        el.setAttribute('aria-roledescription', tr('slide'));
        el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
        const kicker = badgeOf(s) || 'Featured';
        el.innerHTML = '<div class="sf-copy"><span class="sf-kicker">' + escapeHtml(tr(kicker)) + '</span>' +
            '<h2 class="sf-name">' + escapeHtml(s.name) + '</h2><p class="sf-desc">' + escapeHtml(s.description) + '</p>' +
            '<div class="sf-actions"><a class="sf-cta" href="' + escapeHtml(s.link) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(tr('Visit site')) + ' <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></div></div>' +
            '<div class="sf-art" aria-hidden="true"><i class="' + escapeHtml(s.icon) + '"></i></div>';
        // the banner has its own "Visit site", so it takes install chips only
        const row = buildOsRow(s);
        if (!row.classList.contains('web') && row.childNodes.length > 1) el.querySelector('.sf-actions').appendChild(row);
        el.addEventListener('click', e => {
            if (e.target.closest('a, button')) return;
            window.open(s.link, '_blank', 'noopener,noreferrer');
        });
        return el;
    }

    function hero(list) {
        const sec = document.createElement('section');
        sec.className = 'sf-hero';
        sec.setAttribute('aria-roledescription', tr('carousel'));
        sec.setAttribute('aria-label', tr('Featured'));
        const slides = document.createElement('div');
        slides.className = 'sf-slides';
        list.forEach((s, i) => slides.appendChild(heroSlide(s, i)));
        sec.appendChild(slides);
        if (list.length < 2) return sec;
        const dots = document.createElement('div');
        dots.className = 'sf-dots';
        list.forEach((s, i) => {
            dots.insertAdjacentHTML('beforeend', '<button type="button" class="sf-dot' + (i === 0 ? ' on' : '') +
                '" aria-label="' + escapeHtml(s.name) + '" aria-current="' + (i === 0) + '"></button>');
        });
        sec.insertAdjacentHTML('beforeend',
            '<button type="button" class="sf-nav prev" aria-label="' + escapeHtml(tr('Previous')) + '"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
            '<button type="button" class="sf-nav next" aria-label="' + escapeHtml(tr('Next')) + '"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>');
        sec.appendChild(dots);
        let at = 0;
        const go = n => {
            at = (n + list.length) % list.length;
            slides.querySelectorAll('.sf-slide').forEach((el, i) => {
                el.classList.toggle('on', i === at);
                el.setAttribute('aria-hidden', i === at ? 'false' : 'true');
            });
            dots.querySelectorAll('.sf-dot').forEach((d, i) => {
                d.classList.toggle('on', i === at);
                d.setAttribute('aria-current', i === at ? 'true' : 'false');
            });
        };
        sec.querySelector('.prev').addEventListener('click', () => go(at - 1));
        sec.querySelector('.next').addEventListener('click', () => go(at + 1));
        dots.addEventListener('click', e => {
            const d = e.target.closest('.sf-dot');
            if (d) go([...dots.children].indexOf(d));
        });
        // turns on its own, but holds still under a pointer or keyboard focus,
        // and never under reduced motion
        const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        let held = false;
        sec.addEventListener('mouseenter', () => { held = true; });
        sec.addEventListener('mouseleave', () => { held = false; });
        sec.addEventListener('focusin', () => { held = true; });
        sec.addEventListener('focusout', () => { held = false; });
        if (!still) heroTimer = setInterval(() => { if (!held && !document.hidden) go(at + 1); }, 7000);
        return sec;
    }

    function shelf(slice, catName, list) {
        const sec = document.createElement('section');
        sec.className = 'sf-shelf c-' + slice.id;
        sec.id = 'cat-' + slugify(catName);
        sec.innerHTML = '<div class="sf-shelf-head"><h2 class="sf-h">' + escapeHtml(tr(catName)) +
            ' <span class="subcat-count">' + list.length + '</span></h2>' +
            '<button type="button" class="sf-all">' + escapeHtml(tr('See all')) + '</button>' +
            '<button type="button" class="sf-nav sm prev" aria-label="' + escapeHtml(tr('Previous')) + '"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
            '<button type="button" class="sf-nav sm next" aria-label="' + escapeHtml(tr('Next')) + '"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div>';
        const track = document.createElement('div');
        track.className = 'sf-track';
        list.forEach(s => track.appendChild(popCard(s)));
        sec.appendChild(track);
        const page = dir => track.scrollBy({ left: dir * track.clientWidth * .9, behavior: 'smooth' });
        sec.querySelector('.prev').addEventListener('click', () => page(-1));
        sec.querySelector('.next').addEventListener('click', () => page(1));
        // "See all" lays the shelf out as a grid in place
        const all = sec.querySelector('.sf-all');
        all.addEventListener('click', () => {
            const open = sec.classList.toggle('open');
            all.textContent = tr(open ? 'Show less' : 'See all');
            if (!open) sec.scrollIntoView({ block: 'nearest' });
        });
        return sec;
    }

    // Big category tiles, as a store's genre row; a tile picks its tab.
    function categoryTiles() {
        const sec = document.createElement('section');
        sec.className = 'sf-cats';
        let h = '<h2 class="sf-h">' + escapeHtml(tr('Browse by category')) + '</h2><div class="sf-cat-grid">';
        SLICES.filter(s => s.id !== DEFAULT_CAT).forEach(s => {
            h += '<button type="button" class="sf-cat c-' + s.id + '" data-go="' + s.id + '"><span class="sf-cat-name">' +
                escapeHtml(tr(s.label)) + '</span><span class="sf-cat-n">' + sliceCount(s).toLocaleString() + '</span>' +
                '<i class="' + s.icon + '" aria-hidden="true"></i></button>';
        });
        sec.innerHTML = h + '</div>';
        return sec;
    }

    function storefront(slice) {
        const seen = new Set();
        const feat = featuredList();
        if (feat.length) results.appendChild(hero(feat));
        results.appendChild(categoryTiles());
        sliceCategories(slice).forEach(catName => {
            const list = dedupe(allServices.filter(s => (s.categories || []).includes(catName) && passAll(s)));
            if (!list.length) return;
            list.forEach(s => seen.add(s.link));
            results.appendChild(shelf(slice, catName, list));
        });
        return seen.size;
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

    // ── Tabs and facets ───────────────────────────────────
    function chip(facet, val, on, label, icon) {
        return '<button type="button" class="fchip' + (on ? ' active' : '') + '" aria-pressed="' + on +
            '" data-facet="' + facet + '" data-val="' + escapeHtml(val) + '">' +
            '<i class="fa-solid fa-check sc-check" aria-hidden="true"></i>' +
            (icon ? '<i class="' + icon + ' sc-ficon" aria-hidden="true"></i>' : '') + label + '</button>';
    }
    // Clear only appears once you have moved off the opening view.
    function anyOn() { return !!(F.cat !== DEFAULT_CAT || F.plat || F.open || F.find); }

    // How many entries each category tab would show under the other facets.
    function sliceCount(slice) {
        return dedupe(allServices.filter(s => (!slice || inSlice(slice, s)) &&
            passPlatform(s) && passOpen(s) && passFind(s, F.find))).length;
    }
    // Each category owns a colour (c-<id> in main.css): tonal when idle,
    // filled when picked.
    function catTab(id, icon, label, n) {
        const on = F.cat === id && !F.mylist;
        return '<button type="button" class="fchip cat-chip c-' + (id || 'all') + (on ? ' active' : '') + (n ? '' : ' empty') +
            '" aria-pressed="' + on + '" data-facet="cat" data-val="' + (id || '') + '"><i class="' + icon +
            '" aria-hidden="true"></i><span>' + label + '</span><span class="cat-n">' + n + '</span></button>';
    }

    function renderTabs() {
        let h = catTab(null, 'fa-solid fa-border-all', escapeHtml(tr('All')), sliceCount(null));
        SLICES.forEach(s => { h += catTab(s.id, s.icon, escapeHtml(tr(s.label)), sliceCount(s)); });
        tabsEl.innerHTML = h;
        // the storefront's category tiles stand in for the tabs; they appear
        // once a category, a search or My List is on screen
        tabsEl.hidden = F.cat === DEFAULT_CAT && !F.find && !F.mylist;
        // the search ring follows the picked tab's colour
        searchEl.className = 'sc-search c-' + (F.mylist || !F.cat ? 'all' : F.cat);
        markEdge(tabsEl);
        const act = tabsEl.querySelector('.active');
        // keep the picked tab in view where the row scrolls (phones)
        if (act) {
            const l = act.offsetLeft - tabsEl.offsetLeft, r = l + act.offsetWidth;
            if (l < tabsEl.scrollLeft || r > tabsEl.scrollLeft + tabsEl.clientWidth) {
                tabsEl.scrollLeft = l - (tabsEl.clientWidth - act.offsetWidth) / 2;
            }
        }
    }

    // A row that scrolls sideways (tabs, phone facets) fades its far edge.
    function markEdge(el) {
        el.classList.toggle('ovf', el.scrollWidth > el.clientWidth + 1);
        el.classList.toggle('at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    }
    [tabsEl, chipsEl].forEach(el => el.addEventListener('scroll', () => markEdge(el), { passive: true }));
    window.addEventListener('resize', () => { markEdge(tabsEl); markEdge(chipsEl); });

    // Under the sticky head: the narrowing facets, the count and a how-to line.
    function renderChips(shown) {
        renderTabs();
        let h = '<span class="fchip-lbl">' + escapeHtml(tr('Platform')) + '</span>';
        PLATFORMS.forEach(p => {
            let c = chip('plat', p.id, F.plat === p.id, p.label, p.icon);
            // the detected OS carries a dot: its install buttons lead every card
            if (p.id === MY_OS) c = c.replace('class="fchip', 'title="' + escapeHtml(tr('Your system')) + '" class="fchip mine')
                .replace('</button>', '<span class="mine-dot" aria-label="' + escapeHtml(tr('Your system')) + '"></span></button>');
            h += c;
        });
        h += '<span class="fchip-sep"></span>' + chip('open', '1', F.open, escapeHtml(tr('Open source only')), 'fa-brands fa-osi');
        if (anyOn()) h += '<button type="button" class="fchip clear" data-clear="1"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i>' + escapeHtml(tr('Clear')) + '</button>';
        h += '<span class="fchips-count"><b>' + shown.toLocaleString() + '</b> ' + escapeHtml(tr('shown')) + '</span>';
        h += '<span class="sc-how"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i>' + escapeHtml(tr('Click a card to open its site, or an install button to copy the command.')) + '</span>';
        chipsEl.innerHTML = h;
        markEdge(chipsEl);
        // the search field is static; keep it in step with the state
        if (findEl.value.trim().toLowerCase() !== F.find) findEl.value = F.find;
        findClear.hidden = !findEl.value;
    }

    let findTimer = null;
    function onFind() {
        const v = findEl.value.trim().toLowerCase();
        findClear.hidden = !findEl.value;
        clearTimeout(findTimer);
        findTimer = setTimeout(() => {
            // a typed query searches the whole catalogue; a category chip can narrow it again
            if (v && !F.find) F.cat = null;
            F.find = v;
            F.mylist = false;
            limit = PAGE;
            updateURL();
            animate = false;
            render();
        }, 140);
    }
    findEl.addEventListener('input', onFind);
    findEl.addEventListener('keydown', e => {
        if (e.key === 'Escape') { clearTimeout(findTimer); findEl.value = ''; F.find = ''; findEl.blur(); updateURL(); render(); }
        // Enter hands over to the results (and drops the phone keyboard)
        else if (e.key === 'Enter') findEl.blur();
    });
    findClear.addEventListener('click', () => {
        clearTimeout(findTimer); findEl.value = ''; F.find = ''; limit = PAGE; updateURL(); render(); findEl.focus();
    });

    // ── Render ────────────────────────────────────────────
    function render() {
        clearInterval(heroTimer);
        results.innerHTML = '';
        cardNo = 0;
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
        } else if (F.cat === DEFAULT_CAT && !F.find) {
            shown = storefront(SLICES.find(x => x.id === F.cat));
            if (!shown) results.appendChild(emptyMsg('Nothing matches these filters.', true));
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
                    div.className = 'subcat-divider c-' + slice.id;
                    div.id = 'cat-' + slugify(catName);
                    div.innerHTML = '<span class="subcat-ic"><i class="' + categoryIcon(catName) + '" aria-hidden="true"></i></span><span>' +
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
        animate = true; popFrom = 0;
    }

    // ── Hero counts and the footer line ───────────────────
    function renderMeta() {
        const n = dedupe(allServices).length;
        document.getElementById('heroStats').innerHTML = '<b>' + n.toLocaleString() + '</b> ' + escapeHtml(tr('programs')) +
            '<br>' + SLICES.length + ' ' + escapeHtml(tr('categories')) + (UPDATED ? ' · ' + escapeHtml(tr('reviewed')) + ' ' + escapeHtml(UPDATED) : '');
        const ph = tr('Search {n} programs').replace('{n}', n.toLocaleString());
        findEl.placeholder = ph;
        findEl.setAttribute('aria-label', ph);
        findClear.setAttribute('aria-label', tr('Clear search'));
        tabsEl.setAttribute('aria-label', tr('Categories'));
        chipsEl.setAttribute('aria-label', tr('Filters'));
    }

    // ── Events ────────────────────────────────────────────
    const onChipClick = e => {
        const b = e.target.closest('.fchip');
        if (!b) return;
        F.mylist = false;
        if (b.dataset.clear) return;   // handled below, with the empty-state button
        const k = b.dataset.facet, v = b.dataset.val;
        if (k === 'open') {
            F.open = !F.open;
            openOnlyMode = F.open;
            try { localStorage.setItem(OPEN_KEY, F.open ? '1' : '0'); } catch (err) {}
        } else if (k === 'cat') {
            F.cat = v || null;   // a tab stays picked; "All" is its own tab
        } else {
            F[k] = F[k] === v ? null : v;
        }
        limit = PAGE;
        render();
        if (k === 'cat') {
            history.replaceState({}, '', location.pathname + location.search + (F.cat ? '#' + F.cat : ''));
            // a picked tab starts its list at the top, under the sticky head
            const top = chipsEl.getBoundingClientRect().top + window.scrollY - headEl.offsetHeight;
            if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
        }
    };
    chipsEl.addEventListener('click', onChipClick);
    tabsEl.addEventListener('click', onChipClick);
    document.addEventListener('click', e => {
        if (e.target.closest('[data-clear]')) {
            F.cat = DEFAULT_CAT; F.plat = null; F.open = false; F.find = ''; F.mylist = false;
            openOnlyMode = false;
            try { localStorage.setItem(OPEN_KEY, '0'); } catch (err) {}
            clearTimeout(findTimer);
            // back to the opening view, so drop a stale #<category> too
            history.replaceState({}, '', location.pathname + location.search);
            limit = PAGE; updateURL(); render();
        } else if (e.target.closest('[data-more]')) {
            popFrom = limit; limit += PAGE * 2; render();
        } else if (e.target.closest('[data-go]')) {
            // a storefront category tile: pick its tab and start at the top
            F.cat = e.target.closest('[data-go]').dataset.go; F.mylist = false;
            limit = PAGE; render();
            history.replaceState({}, '', location.pathname + location.search + '#' + F.cat);
            window.scrollTo(0, 0);
        }
    });
    myListBtn.addEventListener('click', () => { F.mylist = !F.mylist; render(); window.scrollTo(0, 0); });
    // "/" opens Find from anywhere that is not already a text field.
    document.addEventListener('keydown', e => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        e.preventDefault();
        if (F.mylist) { F.mylist = false; render(); }
        findEl.focus();
        findEl.select();
    });
    window.addEventListener('carino:langchange', () => { render(); renderMeta(); });
    // The head lifts (shadow) once it is stuck over the cards.
    const onScroll = () => headEl.classList.toggle('stuck', headEl.getBoundingClientRect().top <= 0 && window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

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
