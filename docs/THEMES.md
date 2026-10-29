# Themes — Gold & Black and Colourful

software.carino.systems is the pilot. One layout, one markup, one behaviour;
two skins chosen by a root attribute:

```html
<html data-carino-theme="gold">   <!-- Gold & Black — the default -->
<html data-carino-theme="color">  <!-- Colourful -->
```

All styling lives in `assets/css/main.css` under `--sc-*` tokens. The gold
rules are scoped `:root:not([data-carino-theme="color"])`, so a missing
attribute (JS off, head script failed) still lands on gold. The colourful
rules are the unscoped base plus `:root[data-carino-theme="color"]` for its
dark variant.

## 1. Gold & Black (default)

The Carino identity: near-black surfaces, warm hairlines, gold spent where it
means something (mark, picked tab, focus, glyphs, counts). Dark only
(`color-scheme: dark`).

| Token | Value | Use |
|---|---|---|
| `--sc-bg` | `#050505` | page, head (when stuck: `rgba(5,5,5,.82)` + 14px blur) |
| page glow | `radial-gradient(ellipse 1100px 420px at 50% -140px, rgba(234,179,8,.11), transparent 70%)` | top of the page, carino-ui.css treatment |
| `--sc-surface` / `-2` | `#0b0b0b` / `#0d0d0d` | search well at rest / focused (cards use their own `#0d0d0d → #090909` gradient) |
| `--sc-pill` / `-hv` | `#121212` / `#191713` | pills, hover |
| `--sc-line` / `-2` | `#1f1d19` / `#36322a` | warm hairlines |
| `--sc-text` | `#f4f1ea` | primary text (16.9:1) |
| `--sc-text-2` | `#bdb7aa` | secondary (9.6:1) |
| `--sc-text-3` | `#8f897d` | muted (5.6:1) |
| `--sc-primary` | `#eab308` | the one accent (fleet Sharp Gold) |
| `--sc-gold-text` | `linear-gradient(130deg, #fef08a, #eab308, #c2700a)` | "All" icon, card and banner icons |
| `--sc-on-primary` | `#050505` | text on gold (selected tab, My List open) |
| `--sc-primary-tonal` / `--sc-on-tonal` | `rgba(234,179,8,.11)` / `#f6d56e` | tonal pills, section count pill, command tooltip text |
| `--sc-domain` | `#c9a85a` | card source line |
| `--sc-badge` | `#eab308` | My List count (black text; flips to gold on black while open) |
| `--sc-hover` / `--sc-focus` | `rgba(234,179,8,.06)` / `rgba(234,179,8,.45)` | hover wash, search focus halo; focus outlines are solid `#eab308` |
| `--sc-tip-bg` / `-fg` | `#15130f` / `#f4f1ea` | tooltips (gold 30% border); install-command tooltip is `#f6d56e` mono on `#050505` |
| toast | carino-ui.css `.toast.ok` / `.err`, top-right under the navbar | copy confirmation |
| section scrubber | `#15130f` track, segments `rgba(234,179,8,.34)` / `.16` alternating, `#eab308` thumb; bubble `#0d0d0d`, gold 35% border | minimap bar down the right edge (Colourful: segments in the category's `--c`) |
| install chips | `#14130f` / `#e2dbcb`, OS glyph in gold | all platforms |
| `mark` (search hit) | `rgba(234,179,8,.9)` on `#050505` | highlights |

Components:

- **Category tabs** — `#0e0e0e` pills on a `#221f1a` inset hairline; the picked
  tab is solid gold (`#f5c62e → #eab308`) with black text and a gold glow.
  Category colours survive only as icon tints: each `--c` is
  `color-mix(in oklab, <colourful dark hue> 42%, #d9b45a)`.
  A tab with no hits (both themes) drops to `--sc-text-3` with its icon at 55%,
  never a whole-tab opacity, so the label keeps 4.5:1.
- **Card covers** — a black well (`#0f0e0c`, a faint warm glow at the top)
  holding the programme's icon, no tile behind it. The icon is metal, picked by
  the name hash (`.hue-0..6`): gold on hue 0/2/4, amber 1, champagne 3,
  bronze 5, honey 6. Badges ("Carino", "Open source") are gold-outlined.
- **Storefront** — the featured banner is black, lit gold from the art side,
  with a gold "Visit site" button; category tiles are black with the icon in
  its muted category tint.
- **Cards** — warm hairline `#1d1b17`; hover = gold rim `rgba(234,179,8,.42)`
  plus a gold glow (glow only under `(hover: hover) and (pointer: fine)`).
- **Section heads** — display caps, gold-rimmed icon, gold count pill, a gold
  rule fading to the right. Result count ("40 shown") in gold mono.
- **Facets** — hairline chips; active gets a gold 45% border; Clear is
  gold-outlined.

## 2. Colourful

The light app-store skin. Every category owns a colour; card icons are drawn
in the seven category hues on a neutral cover (`--sc-cover`, `#e8eef9` /
dark `#131b28`), never on a filled tile; category tiles on the storefront
are filled in their category colour. Follows `prefers-color-scheme`;
`<html data-theme="light">` forces light.

| Token | Light | Dark |
|---|---|---|
| `--sc-bg` | `#eef3fc` | `#0e1420` |
| `--sc-surface` | `#ffffff` | `#172031` |
| `--sc-pill` / `-hv` | `#dfe7f4` / `#d3ddee` | `#222c3d` / `#2c3850` |
| `--sc-line` / `-2` | `#e1e5ea` / `#c4c7c5` | `#2f3133` / `#5f6368` |
| `--sc-text` / `-2` / `-3` | `#1f1f1f` / `#444746` / `#5f6368` | `#e3e3e3` / `#c4c7c5` / `#9aa0a6` |
| `--sc-primary` / `--sc-on-primary` | `#0b57d0` / `#ffffff` | `#a8c7fa` / `#062e6f` |
| `--sc-primary-tonal` / `--sc-on-tonal` | `#d3e3fd` / `#041e49` | `#004a77` / `#c2e7ff` |
| `--sc-domain` | `#188038` | `#81c995` |
| `--sc-badge` | `#d93025` | `#d93025` |
| `--sc-hover` | `rgba(68,71,70,.08)` | `rgba(227,227,227,.08)` |
| navbar "Carino" | deepened sweep `#c26a06 → #b45309 → #92400e` (≥ 3.4:1 on white) | fleet sweep `#fef08a → #eab308 → #b45309` |
| `--sc-tip-bg` / `-fg` | `#303134` / `#f1f3f4` | `#e3e3e3` / `#1f1f1f` |
| chips Windows / macOS / Linux | `#e8f0fe`/`#174ea6`, `#eef0f2`/`#3c4043`, `#e6f4ea`/`#0d652d` | blue / grey / green at 9–14% with `#a8c7fa` / `#d5d7d9` / `#9fdcaf` |

Category set (`--c` fill / `--on` / `--t` tonal / `--tt` tonal text) and tile
hues `--h0a..--h6b` are in `main.css` (`.c-*` and `:root`), each with a dark
counterpart.

## 3. Marks

| Theme | Mark | Source |
|---|---|---|
| Gold & Black | `assets/images/logo.svg` (gold C + gold four-tile pictogram) | Branding/marks/marks.py |
| Colourful | `assets/images/logo-color.svg` (gold C + blue/red/green/yellow tiles) | Branding/marks/marks.py |

The mark appears once, as the theme switch in the navbar (section 4); the page
head carries only the search and, off the storefront, the category tabs.
Never hand-edit the SVGs; regenerate them. The navbar's "Carino" brand is the
fleet gold sweep in Gold & Black and Colourful dark; on Colourful light,
main.css deepens the sweep so it stays legible on white.

## 4. The theme switch

A real `<button>` that main.js inserts **immediately left of the navbar brand**
(`#carinoNav .cn-brand`, before `.brand-name`), without editing
carino-navbar.js. It holds the Software mark in both colourings.

| | Gold & Black | Colourful |
|---|---|---|
| Shows | `logo.svg`, 28 px | `logo-color.svg`, 28 px |
| Hover (fine pointers only) | `logo-color.svg`, the theme a click switches to | `logo.svg` |
| Hit area | 32 × 32 px, 8px radius | same |
| Focus | 2px solid `--sc-primary`, offset 1px | same |
| Tooltip / name | "Toggle theme" | same |

Spacing: margin `0 8px 0 -4px`. The hover swap is limited to
`(hover: hover) and (pointer: fine)`: after a tap a sticky hover would show
the theme just left.

## 5. The switch transition

Where `document.startViewTransition` exists, the new theme grows as a circle
from the switch's centre: `::view-transition-new(root)` animates
`clip-path: circle(0 → r at x y)` over .62s `cubic-bezier(.65,0,.35,1)`;
main.js sets `--vt-x`, `--vt-y` and `--vt-r` (distance to the farthest corner).
Instant with no API, with a hidden tab, or under
`prefers-reduced-motion: reduce`.
Rapid clicks are never lost: toggle() keeps the theme the last click asked
for until its transition paints it, so each click flips from there; a skipped
transition's rejected promises are swallowed.

## 6. Persistence contract

Precedence: `?theme=` > cookie > localStorage > `gold`.

- **Cookie** `carino-theme=gold|color`; `Path=/; Max-Age=31536000; SameSite=Lax`;
  `Domain=.carino.systems` only when the host is (a subdomain of)
  carino.systems; `Secure` on https. The cookie wins over localStorage so a
  choice made on one subdomain carries to the others.
- **localStorage** key `carino-theme`, same values. Its `storage` event keeps
  other open tabs in step (no transition).
- **`?theme=gold|color`** (also `colour`) applies for that visit only and is not
  stored; clicking the switch drops it from the URL so a reload keeps the click.
- **Event**: `window` gets `carino:themechange` with `detail.theme` on every
  switch.
- **theme-color meta** (`#carinoThemeColor`): `#050505` gold, `#eef3fc` colourful
  light, `#0e1420` colourful dark; repainted on scheme change.

No-flash head snippet, verbatim (after `<!-- /carino:head -->`, before any
stylesheet; never inside the generated block):

```html
<meta name="theme-color" content="#050505" id="carinoThemeColor">
<script>
(function () {
    var d = document.documentElement, t = null;
    function pick(v) { return v === 'gold' ? 'gold' : (v === 'color' || v === 'colour') ? 'color' : null; }
    try { t = pick(new URLSearchParams(location.search).get('theme')); } catch (e) {}
    if (!t) { try { var m = document.cookie.match(/(?:^|;\s*)carino-theme=([^;]*)/); if (m) t = pick(decodeURIComponent(m[1])); } catch (e) {} }
    if (!t) { try { t = pick(localStorage.getItem('carino-theme')); } catch (e) {} }
    t = t || 'gold';
    d.setAttribute('data-carino-theme', t);
    var dark = d.getAttribute('data-theme') !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    var meta = document.getElementById('carinoThemeColor');
    if (meta) meta.content = t === 'gold' ? '#050505' : (dark ? '#0e1420' : '#eef3fc');
})();
</script>
```

Every read is wrapped in `try`, so sandboxed or opaque-origin frames (MultiWeb
tiles) still get a theme.

## 7. Accessibility

- The switch is `role="switch"` (on = Colourful). Its name and tooltip are both
  "Toggle theme", in i18n.js (es, pt-BR, ja, ru), redone on
  `carino:langchange`; `aria-checked` reports the state.
- Enter and Space toggle it (native button). A visible focus ring is drawn in
  the theme's accent.
- Body and secondary text meet WCAG AA in gold, Colourful light and Colourful
  dark (lowest measured is 5.1:1). Metal glyphs are decorative.
- Hover effects apply only under `(hover: hover) and (pointer: fine)`, so they
  do not stick after a tap.

## 8. Adopting it fleet-wide later

Nothing below has been done yet. Software is the only site.

- **carino-ui.css**: move the gold token set (it is the fleet look already)
  and a `[data-carino-theme="color"]` token set under shared `--cu-*` names.
  Add the switch styles, the `::view-transition` reveal, and the
  `.cn-left` glow allowance.
- **carino-navbar.js**: render the switch natively inside `.cn-brand`, and own
  the toggle, the cookie, the `storage` sync and `carino:themechange`. The
  head snippet becomes part of the generated `<!-- carino:head -->` block
  (baseline `apply.py`), so every site paints the theme before first paint.
  It should also take over the deeper "Carino" sweep for light navbars,
  which main.css applies locally today.
- **Branding** (branding.carino.systems): add a Themes section with both token
  tables, the switch in both states, and the transition demo. `marks.py` already
  emits the gold and colour marks; it may need a colour variant for each
  site's pictogram.
- **Per site**: each site maps its own skin onto the shared tokens and decides
  whether Colourful has meaning there (category colours here). Sites without
  one can show the switch and let Colourful fall back to a blue accent.
