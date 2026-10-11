"""Each project's name in its own typeface, cut down to the letters of the name (a few KB each).

    python -m pip install -r design/requirements-dev.txt
    python design/build_name_fonts.py

Downloads the OFL source fonts from the Google Fonts repository into ../portfolio-tools/fonts-src (outside
this repository), pins a variable font to one style, keeps only the glyphs of the name, and writes
assets/fonts/name-<slug>.woff2. Their licences go to assets/fonts/LICENSES-names.txt.
"""
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / 'portfolio-tools' / 'fonts-src'
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'

# (slug, the name to keep, folder and file in google/fonts ofl/, variable axes to pin)
FACES = [
    ('signalbridge', 'SignalBridge', 'fraunces', 'Fraunces[SOFT,WONK,opsz,wght].ttf',
     {'wght': 600, 'opsz': 144, 'SOFT': 0, 'WONK': 0}),
    ('boss-breaker', 'Boss Breaker', 'bungee', 'Bungee-Regular.ttf', {}),
    ('better-call-bhai', 'Better Call Bhai', 'abrilfatface', 'AbrilFatface-Regular.ttf', {}),
    ('meant', 'MEANT', 'atkinsonhyperlegible', 'AtkinsonHyperlegible-Bold.ttf', {}),
    ('knowcad', 'KnowCad', 'michroma', 'Michroma-Regular.ttf', {}),
]


def fetch(folder, name):
    (SRC / folder).mkdir(parents=True, exist_ok=True)
    local = SRC / folder / name                 # per folder: every family has its own OFL.txt
    if not local.exists():
        url = BASE + folder + '/' + urllib.parse.quote(name)
        with urllib.request.urlopen(url) as r:
            local.write_bytes(r.read())
    return local


def main():
    licences = []
    for slug, text, folder, file, axes in FACES:
        font = TTFont(fetch(folder, file))
        if axes:
            font = instancer.instantiateVariableFont(font, axes)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        sub = subset.Subsetter(opts)
        sub.populate(text=text + ' ')
        sub.subset(font)
        out = ROOT / 'assets' / 'fonts' / f'name-{slug}.woff2'
        font.flavor = 'woff2'
        font.save(out)
        print(f'wrote {out.name:28} {out.stat().st_size:6} bytes')
        licences.append(f'== {file} (name-{slug}.woff2)\n' + fetch(folder, 'OFL.txt').read_text(encoding='utf-8'))
    (ROOT / 'assets' / 'fonts' / 'LICENSES-names.txt').write_text('\n\n'.join(licences), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
