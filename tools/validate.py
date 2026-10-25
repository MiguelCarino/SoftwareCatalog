#!/usr/bin/env python3
"""Schema + vocabulary check over assets/json/software.json and meta.json.

Modelled on Law/tools/validate.py. The catalogue stays ONE file, a bare JSON
array: Offline/tools/sync-software.py reads it in that shape, so this checks
the file as it is rather than splitting it. The page renders every entry as a
card ending in its source line, so an entry without an https link is an entry
without its source — which a Reference page never shows.

    python3 tools/validate.py

Exit 0 clean, 1 if anything failed. Warnings do not fail the run.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'assets', 'json')

REQUIRED = ['name', 'description', 'link', 'icon', 'value', 'categories']
INSTALL = ['windows', 'macos', 'fedora', 'debian', 'rhel', 'suse', 'flatpak']
OPTIONAL = ['status', 'licence', 'tags', 'offline', 'updated'] + INSTALL
STATUS = {'reviewing'}
# main.js reads these four as caveats; anything else must look like an SPDX id
# (or start with "proprietary") so the open-source chip can tell it apart.
CAVEATS = {'open-core', 'source', 'closed', 'reference'}
SPDX = re.compile(r'^[A-Za-z0-9.+-]+( (OR|AND|WITH) [A-Za-z0-9.+-]+)*$')
RATINGS = {'full', 'sync', 'tethered'}          # Offline/tools/sync-software.py
MONTH = re.compile(r'^20\d\d-(0[1-9]|1[0-2])$')
ICON = re.compile(r'^(fa[srbl]?|fa-(solid|regular|brands|light)) fa-[a-z0-9-]+$')

# The categories the page's Category chips cover (SLICES in assets/js/main.js).
# Entries with status "reviewing" may use any category: that chip derives its
# list from the data.
SLICE_CATS = {'Carino Systems', 'Curated Highlights', 'Essentials', 'Web Browsers',
              'Language and Culture', 'Gaming and Entertainment', 'Multimedia and Design',
              'AI / Machine learning', 'Development', 'Open Source related', 'STEM and Research',
              'IT and DevOps', 'Operating Systems', 'Hardware', 'Monitoring and Status',
              '(Cyber)Security'}


def main():
    errs, warns = [], []
    try:
        with open(os.path.join(DATA, 'software.json'), encoding='utf-8') as fh:
            data = json.load(fh)
    except (OSError, ValueError) as e:
        print('FAIL  software.json: %s' % e)
        return 1
    if not isinstance(data, list):
        print('FAIL  software.json must stay a bare array (sync-software.py reads it so)')
        return 1

    try:
        with open(os.path.join(DATA, 'meta.json'), encoding='utf-8') as fh:
            meta = json.load(fh)
        if not MONTH.match(str(meta.get('updated') or '')):
            errs.append('meta.json: updated must be YYYY-MM')
    except (OSError, ValueError) as e:
        errs.append('meta.json: %s' % e)

    names, offline_ids = {}, {}
    for i, e in enumerate(data):
        where = '[%d] %s' % (i, e.get('name', '?'))
        for k in REQUIRED:
            if not e.get(k):
                errs.append('%s: missing or empty "%s"' % (where, k))
        for k in e:
            if k not in REQUIRED and k not in OPTIONAL:
                warns.append('%s: unknown key "%s" (main.js ignores it)' % (where, k))
        link = str(e.get('link') or '')
        if link and not link.startswith('https://'):
            (warns if link.startswith('http://') else errs).append('%s: link is not https: %r' % (where, link))
        if re.search(r'[\s\'"<>]', link):
            errs.append('%s: link has a stray quote or space: %r' % (where, link))
        if e.get('icon') and not ICON.match(e['icon']):
            warns.append('%s: icon %r is not a Font Awesome class pair' % (where, e['icon']))
        st = e.get('status')
        if st is not None and st not in STATUS:
            errs.append('%s: status %r not in %s' % (where, st, sorted(STATUS)))
        cats = e.get('categories') or []
        if not isinstance(cats, list):
            errs.append('%s: categories must be a list' % where)
        elif st != 'reviewing':
            if cats and not any(c in SLICE_CATS for c in cats):
                errs.append('%s: none of %r is under a Category chip, so the page never shows it' % (where, cats))
            for c in cats:
                if c not in SLICE_CATS:
                    warns.append('%s: category %r is under no Category chip (searchable only)' % (where, c))
        lic = e.get('licence')
        if lic and lic not in CAVEATS and not lic.lower().startswith('proprietary') and not SPDX.match(lic):
            warns.append('%s: licence %r is free text; the open-source chip reads it as open' % (where, lic))
        if e.get('updated') and not MONTH.match(str(e['updated'])):
            errs.append('%s: updated must be YYYY-MM' % where)
        for k in INSTALL:
            v = e.get(k)
            if v and not isinstance(v, str):
                errs.append('%s: %s must be a string' % (where, k))
            elif v and v.strip() in ('#', '-', '?'):
                errs.append('%s: %s is a placeholder %r; the copy button would paste it' % (where, k, v))
            elif v and k == 'flatpak' and not re.match(r'^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+){2,}$', v):
                warns.append('%s: flatpak id %r does not look like an app id' % (where, v))
        off = e.get('offline')
        if off is not None:
            if not isinstance(off, dict) or not off.get('id'):
                errs.append('%s: offline block needs an id' % where)
            else:
                if off['id'] in offline_ids:
                    errs.append('%s: offline id %r already used by %s' % (where, off['id'], offline_ids[off['id']]))
                offline_ids[off['id']] = e.get('name')
                if off.get('rating') not in RATINGS:
                    errs.append('%s: offline rating %r not in %s' % (where, off.get('rating'), sorted(RATINGS)))
        key = (e.get('name') or '').strip().lower()
        if key in names and names[key] != link:
            warns.append('%s: same name as entry %s with a different link' % (where, key))
        names.setdefault(key, link)

    for w in warns:
        print('warn  ' + w)
    for e in errs:
        print('FAIL  ' + e)
    print('%d entries, %d with an offline block\n' % (len(data), len(offline_ids)))
    if errs:
        print('%d error(s).' % len(errs))
        return 1
    print('schema OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
