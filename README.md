# Software Catalog
 Straight links and commands\
Website: https://software.carino.systems
<img width="1364" height="853" alt="image" src="https://github.com/user-attachments/assets/dd7a3370-1639-4cce-b35c-4bce70a750d3" />\

Searching updates page url, which can be shared and show the results of its query.\
<img width="1364" height="853" alt="image" src="https://github.com/user-attachments/assets/d6d92ed3-31a8-4113-826e-baf3e9be1339" />

## Data checks

`assets/json/software.json` stays one array (Offline/tools/sync-software.py reads it in that
shape); `assets/json/meta.json` holds the month the links were last checked, which every card
prints in its source line.

```
python3 tools/validate.py      # schema, vocabulary, placeholder install ids
python3 tools/linkcheck.py     # fetch every link; BLOCKED (bot walls) is not a failure
```

## Licensing

**Mine — GNU Affero General Public License v3.0 or later.** Everything in this
repository *except* the paths listed below. Copyright © 2026 Miguel Carino.
Full terms in [LICENSE](LICENSE).

**Not mine.** The files below are third-party works redistributed here. This
project's licence does not cover them and could not: they are not mine to
relicense. Each keeps its own terms, and each carries its own notice.

| Path | What it is | Licence | Notice |
| --- | --- | --- | --- |
| [`fonts/`](fonts/) | IBM Plex Mono, IBM Plex Sans, Red Hat Display | SIL OFL 1.1 | [`fonts/OFL.txt`](fonts/OFL.txt) |
| [`assets/vendor/`](assets/vendor/) | third-party JavaScript and icon fonts | per package — see the notice | [`assets/vendor/README.md`](assets/vendor/README.md) |

Those files travel with any fork, mirror or repackaging of this repository, and
their notices must travel with them.
