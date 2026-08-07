# Third-party assets bundled here

Vendored so the catalogue loads no script, style or font from a CDN — no network,
no account, no third-party request from a visitor's browser.

| Path | Package | Version | Licence | Licence text |
| --- | --- | --- | --- | --- |
| `fontawesome/` | [Font Awesome Free](https://fontawesome.com) | 6.7.2 | Multi-licensed by component — icons **CC BY 4.0**, fonts **SIL OFL 1.1**, code **MIT** | [`fontawesome/LICENSE-fontawesome.txt`](fontawesome/LICENSE-fontawesome.txt) (icons + code) and [`fontawesome/OFL.txt`](fontawesome/OFL.txt) (fonts) |

**Font Awesome Free requires attribution** for its CC BY 4.0 component: the
project must credit Font Awesome. Three things together satisfy that — the
`LICENSE-fontawesome.txt` notice, the `OFL.txt` beside the webfonts, and the
upstream banner at the top of `fontawesome/css/all.min.css` (© 2024 Fonticons,
Inc.). Do not strip any of them when updating the bundle.

The CC BY 4.0 text itself is linked rather than copied, as Creative Commons
asks. The MIT text covering the code portion is reproduced in full.

The Carino brand fonts are separate and live in [`../../fonts/`](../../fonts/),
under SIL OFL 1.1 with their notices in `fonts/OFL.txt`.

## The rule

Adding anything to this directory means adding a row here, with its licence text
beside it, in the same commit.
