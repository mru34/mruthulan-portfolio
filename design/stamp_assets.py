"""Stamp the stylesheet and script links in every page with a short hash of
their contents: css/styles.css?v=1a2b3c4d.

GitHub Pages lets browsers keep CSS and JS for ten minutes. Without a stamp,
a visitor who had the site open before a release gets the new page with the
old stylesheet (or the reverse) and sees it half-styled. With a stamp, a page
always asks for the exact files it was published with.

Run it after changing css/ or js/ (build_cases_v4.py runs it too):
    python design/stamp_assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ['css/styles.css', 'js/script.js', 'js/analytics.js']


def stamps():
    # line endings normalised: Git on Windows may check files out with CRLF,
    # while the site serves the committed LF bytes -- the stamp must not care
    return {a: hashlib.sha1((ROOT / a).read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:8] for a in ASSETS}


def main():
    hashes = stamps()
    changed = []
    for page in sorted(ROOT.glob('*.html')):
        text = page.read_text(encoding='utf-8')
        new = text
        for asset, h in hashes.items():
            # matches css/styles.css and /css/styles.css, with or without an old stamp
            new = re.sub(r'(["\'/])' + re.escape(asset) + r'(\?v=[0-9a-f]+)?(["\'])',
                         lambda m: m.group(1) + asset + '?v=' + h + m.group(3), new)
        if new != text:
            page.write_text(new, encoding='utf-8', newline='\n')
            changed.append(page.name)
    print('stamped', ', '.join(f'{a}?v={h}' for a, h in hashes.items()))
    print('pages updated:', ', '.join(changed) or 'none')


if __name__ == '__main__':
    main()
