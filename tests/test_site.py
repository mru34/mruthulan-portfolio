"""Checks on what design/build_site.py writes. Run: python -m pytest tests -q
Tests that read the built pages need a fresh build first: python design/build_site.py"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'design'))
import build_site as bs  # noqa: E402


def pages():
    out = {'index.html': bs.build_home(), 'privacy.html': bs.build_privacy(), '404.html': bs.build_404()}
    for p in bs.PROJECTS:
        out[f"{p['slug']}.html"] = bs.build_case(p)
    return out


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self._skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def text_of(markup):
    p = _Text()
    p.feed(markup)
    return re.sub(r'\s+', ' ', ' '.join(p.parts))


def test_loomy_is_off_the_site():
    assert 'lm' not in bs.BY_ID
    for name, markup in pages().items():
        assert 'loomy' not in markup.lower(), name
    assert 'loomy' not in (ROOT / 'sitemap.xml').read_text(encoding='utf-8').lower()
    assert not (ROOT / 'loomy.html').exists()
    assert not (ROOT / 'assets' / 'deck').exists()
    assert not (ROOT / 'assets' / 'Loomy-Pitch-Deck.pdf').exists()


def test_case_pages_cycle_through_five_in_homepage_order():
    assert [p['id'] for p in bs.PROJECTS] == ['sb', 'bx', 'bb', 'mt', 'kc']
    kc = bs.build_case(bs.BY_ID['kc'])
    assert 'href="meant.html" rel="prev"' in kc
    assert 'href="signalbridge.html" rel="next"' in kc
