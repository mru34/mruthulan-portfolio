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


COPY = [
    'Five projects.',
    'SignalBridge', 'After-hours chat for young people. Nothing reaches a youth worker until they say yes.',
    'Champion · Dell InnovateDash 2026',
    'Boss Breaker', 'Wellness challenges, played as a boss fight.', 'Solo build · code on GitHub',
    'Better Call Bhai', 'Online booking for a barbershop in Singapore.', 'Solo build · in a pilot with the shop',
    'MEANT', 'Helps people who can’t rely on their speech reply in time. They choose every word.',
    '2nd runner-up · Dell InnovateFest 2026',
    'KnowCad', 'An AI assistant for customer service that finds answers in long documents.',
    'Champion · Autodesk Singapore Hackathon 2026',
    'Case study',
    'Study', 'Diploma in Information Technology, Singapore Polytechnic, 2025 – 2028 (expected)',
    'Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman and SP ACER',
    'Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL',
    'Reach out', 'Gmail', 'LinkedIn', 'GitHub', 'Résumé', 'mruthulansenthilnathan@gmail.com', 'Copy',
]
GONE = ['Spin a project', 'Let’s talk', 'I build full-stack', 'Selected work', 'retrieval-based', 'AAC users',
        'Year 2 IT', 'See all projects', 'last mile', 'Now showing']
BANNED = ['innovative', 'seamless', 'cutting-edge', 'passionate', 'empower', 'leverage', 'elevate', 'journey',
          'crafted', 'unlock', 'robust', 'delve']


def test_home_says_every_word_in_the_copy_deck():
    t = text_of(bs.build_home())
    assert [s for s in COPY if s not in t] == []


def test_home_drops_what_the_redesign_removed():
    markup = bs.build_home()
    t = text_of(markup)
    assert [s for s in GONE if s in t] == []
    assert [w for w in BANNED if w in t.lower()] == []
    for marker in ('data-board', 'results-list', 'pcard', 'data-spin', 'projects-data', 'data-name'):
        assert marker not in markup, marker


def test_chapters_in_order_each_with_its_four_pieces_and_anchors():
    markup = bs.build_home()
    sections = re.findall(r'<section class="chapter".*?</section>', markup, re.S)
    assert [c['pid'] for c in bs.CHAPTERS] == ['sb', 'bx', 'bb', 'mt', 'kc']
    assert len(sections) == 5
    for c, sec in zip(bs.CHAPTERS, sections):
        p = bs.BY_ID[c['pid']]
        t = text_of(sec)
        for piece in (c['num'], p['name'], p['line'], c['result'], 'Case study'):
            assert piece in t, (p['id'], piece)
        assert f'href="{p["slug"]}.html"' in sec
        assert f'data-event="case_open" data-project="{p["id"]}"' in sec
        assert f'id="work-{p["id"]}"' in sec
        assert f'data-scene="{p["slug"]}"' in sec
        assert 'data-anchor' in sec
    assert 'id="work"' in sections[0]


def test_hero_and_ending_carry_the_links_with_their_events():
    markup = bs.build_home()
    hero = markup[markup.index('<section class="hero'):markup.index('<section class="fly')]
    end = markup[markup.index('id="contact"'):markup.index('</main>')]
    for href, event in ((bs.LINKEDIN, 'contact_open_linkedin'), (bs.GITHUB, 'contact_open_github'),
                        (bs.RESUME, 'resume_click')):
        assert f'href="{href}"' in hero and f'data-event="{event}"' in hero
    for href, event in ((bs.MAILTO, 'contact_open_mail_app'), (bs.LINKEDIN, 'contact_open_linkedin'),
                        (bs.GITHUB, 'contact_open_github')):
        assert f'href="{bs.e(href)}"' in end and f'data-event="{event}"' in end
    assert f'data-copy="{bs.EMAIL}"' in end
    assert '<h1 class="sr-only" id="name">Mruthulan Senthil Nathan</h1>' in hero


def _used_class_tokens():
    tokens = set()
    for f in ROOT.glob('*.html'):
        for cls in re.findall(r'class="([^"]+)"', f.read_text(encoding='utf-8')):
            tokens.update(cls.split())
    for f in (ROOT / 'js').rglob('*.js'):
        if 'vendor' in f.parts:
            continue
        # only words inside the scripts' strings (class names they add or query), not their comments
        strings = re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"|`([^`]*)`", f.read_text(encoding='utf-8'))
        for parts in strings:
            tokens.update(re.findall(r'[A-Za-z][\w-]*', ' '.join(parts)))
    return tokens


def _css_classes(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'url\([^)]*\)', '', css)
    css = re.sub(r'"[^"]*"|\'[^\']*\'', '', css)
    return set(re.findall(r'\.([A-Za-z][\w-]*)', css))


def test_every_css_class_is_used_somewhere():
    """Needs a fresh build. A class only some script adds counts as used if it appears in a string in js/."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert sorted(_css_classes(css) - _used_class_tokens()) == []


def test_hero_board_box_matches_the_board_layout():
    """The 3D board is fitted into this box, and its still is drawn in it: the shapes must agree
    (js/3d/flap.js layoutRows gives 14.94 x 3.42 for two rows and 10.12 x 5.07 for three)."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert 'aspect-ratio:14.94/3.42' in css
    assert 'aspect-ratio:10.12/5.07' in css
