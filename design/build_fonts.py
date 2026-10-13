"""Writes the site's trimmed fonts from the originals in design/fonts/:  python design/build_fonts.py

Archivo is only ever drawn at weight 800, between 62% and 75% wide (.cn, the steps' numbers, and the hero's
split-flap board, whose canvas asks for the normal width and gets the face's widest, 75%). The variable font
covers every weight from 100 to 900 and widths to 125%: 87 KB, preloaded on every page, competing with the
stylesheet on a phone's connection. Limited to what is drawn it is 24 KB, the same glyphs and outlines.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'design/fonts/archivo-latin-variable.woff2', ROOT / 'assets/fonts/archivo-latin.woff2'

if __name__ == '__main__':
    font = instancer.instantiateVariableFont(TTFont(SRC), {'wght': 800, 'wdth': (62, 75)})
    font.flavor = 'woff2'
    font.save(OUT)
    print(f'wrote {OUT.relative_to(ROOT)}  {OUT.stat().st_size // 1024} KB (from {SRC.stat().st_size // 1024} KB)')
