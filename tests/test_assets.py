"""Checks on generated assets: python -m pytest tests -q"""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'design'))

NAMES = {'signalbridge': 'SignalBridge', 'boss-breaker': 'Boss Breaker', 'better-call-bhai': 'Better Call Bhai',
         'meant': 'MEANT', 'knowcad': 'KnowCad'}


@pytest.mark.parametrize('slug,name', NAMES.items())
def test_each_name_font_is_small_and_has_every_letter_of_the_name(slug, name):
    from fontTools.ttLib import TTFont
    path = ROOT / 'assets' / 'fonts' / f'name-{slug}.woff2'
    assert path.exists()
    assert path.stat().st_size < 12_000, path.stat().st_size
    cmap = TTFont(path).getBestCmap()
    assert all(ord(ch) in cmap for ch in set(name)), name
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert f'font-family:"Name {name}";src:url(../assets/fonts/name-{slug}.woff2)' in css
