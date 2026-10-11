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
    'SignalBridge', 'After-hours chat for young people. Nothing reaches a youth worker until they say yes.',
    'Champion · Dell InnovateDash 2026',
    'Boss Breaker', 'Wellness challenges, played as a boss fight.', 'Solo build · code on GitHub',
    'Better Call Bhai', 'Online booking for a barbershop in Singapore.', 'Solo build · in a pilot with the shop',
    'MEANT', 'Helps people who can’t rely on their speech reply in time. They choose every word.',
    '2nd runner-up · Dell InnovateFest 2026',
    'KnowCad', 'An AI assistant for customer service that finds answers in long documents.',
    'Champion · Autodesk Singapore Hackathon 2026',
    'More info',
    'Attack', 'Stress Dragon', '1,840 / 5,000 HP', 'Stress Dragon defeated',
    'Next photo', 'Licence “in use on another device” after moving to new laptops', 'Featured in Tamil Murasu', 'Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice',
    'Study', 'Diploma in Information Technology · Singapore Polytechnic · 2025–2028',
    'Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman · SP ACER',
    'I study IT at Singapore Polytechnic. I build for one real person first: a youth worker at midnight, '
    'someone who can’t rely on their speech, a barber with a full day of bookings.',
    'Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL',
    'Open to internships, 2027/28', 'Gmail', 'LinkedIn', 'GitHub', 'Résumé', 'mruthulansenthilnathan@gmail.com', 'Copy',
]
GONE = ['Spin a project', 'Let’s talk', 'I build full-stack', 'Selected work', 'retrieval-based', 'AAC users',
        'Year 2 IT', 'See all projects', 'last mile', 'Now showing', 'Five projects.', 'Previous award', 'Next award', 'Previous photo',
        'Who won the Autodesk Singapore Hackathon 2026?', '(expected)', 'Reach out', 'SWE internship']
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
        for piece in (c['num'], p['name'], p['line'], c['result'], 'More info'):
            assert piece in t, (p['id'], piece)
        assert f'href="{p["slug"]}.html"' in sec
        assert f'data-event="case_open" data-project="{p["id"]}"' in sec
        assert f'id="work-{p["id"]}"' in sec
        assert f'data-scene="{p["slug"]}"' in sec
        assert 'class="ch-stage"' in sec and 'data-anchor' not in sec   # the scene fills the screen
        assert re.search(rf'<h3 class="ch-name"[^>]*><a href="{p["slug"]}\.html"', sec), 'the name links to the case study'
    assert 'id="work"' in sections[0]


def test_hero_and_ending_carry_the_links_with_their_events():
    markup = bs.build_home()
    hero = markup[markup.index('<section class="hero'):markup.index('<div class="chapters')]
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
        html = f.read_text(encoding='utf-8')
        for cls in re.findall(r'class="([^"]+)"', html):
            tokens.update(cls.split())
        # class names an inline script adds (the page's first line of script swaps no-js for js-on)
        for script in re.findall(r'<script>(.*?)</script>', html, re.S):
            for parts in re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"", script):
                tokens.update(re.findall(r'[A-Za-z][\w-]*', ' '.join(parts)))
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


import json  # noqa: E402


def test_import_map_points_every_module_at_a_stamped_file_that_exists():
    markup = bs.build_home()
    m = re.search(r'<script type="importmap">(.*?)</script>', markup, re.S)
    assert m, 'no import map'
    imports = json.loads(m.group(1))['imports']
    for spec, url in imports.items():
        path, _, stamp = url.partition('?v=')
        assert (ROOT / path.removeprefix('./')).exists(), (spec, url)
        assert re.fullmatch(r'[0-9a-f]{8}', stamp), (spec, url)
    assert imports['three'].startswith('./js/vendor/three/three.module.min.js?v=')
    assert imports['lenis'].startswith('./js/vendor/lenis/lenis.min.js?v=')
    assert re.search(r'<script type="module" src="\./js/home\.js\?v=[0-9a-f]{8}"></script>', markup)


def test_every_module_import_resolves():
    imports = json.loads(re.search(r'<script type="importmap">(.*?)</script>', bs.build_home(), re.S).group(1))['imports']
    own = [f for f in (ROOT / 'js').rglob('*.js') if 'vendor' not in f.parts and f.name not in ('script.js', 'analytics.js')]
    for f in own:
        for spec in re.findall(r'(?:\bfrom|\bimport)\s*\(?\s*[\'"]([^\'"]+)[\'"]', f.read_text(encoding='utf-8')):
            if spec.startswith('.'):
                assert (f.parent / spec).resolve().exists(), (f.name, spec)
            else:
                assert spec in imports, (f.name, spec)


def test_3d_code_fits_the_budget():
    import gzip
    files = [f for f in (ROOT / 'js').rglob('*.js') if f.name not in ('script.js', 'analytics.js')]
    total = sum(len(gzip.compress(f.read_bytes(), 9)) for f in files)
    assert total <= 320_000, total


def test_boss_breaker_has_its_attack_button_and_hp_readout():
    markup = bs.build_home()
    sec = re.search(r'<section class="chapter" data-scene="boss-breaker".*?</section>', markup, re.S).group(0)
    assert re.search(r'<button class="btn bx-attack" type="button" data-attack>Attack</button>', sec)
    for hook in ('data-hp', 'data-hit', 'data-hp-live', 'data-defeated'):
        assert hook in sec, hook


def test_meant_has_its_four_replies_as_buttons_and_the_press_link():
    markup = bs.build_home()
    sec = re.search(r'<section class="chapter" data-scene="meant".*?</section>', markup, re.S).group(0)
    for i, reply in enumerate(['Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice']):
        assert f'<button class="mt-pick" type="button" data-reply="{i}">{reply}</button>' in sec, reply
    assert '<a class="link mt-press" href="meant.html#press">Featured in Tamil Murasu</a>' in sec
    assert 'data-partner-live' in sec


def test_knowcad_asks_its_question_in_full_without_the_3d():
    markup = bs.build_home()
    sec = re.search(r'<section class="chapter" data-scene="knowcad".*?</section>', markup, re.S).group(0)
    q = 'Licence “in use on another device” after moving to new laptops'
    assert f'<span data-typed>{q}</span>' in sec
    assert f'<p class="sr-only">{q}</p>' in sec
    assert 'The question, manuals and answer are an example.' in sec and 'private' not in sec.lower()


def test_awards_are_three_stacks_with_their_placing_boxes_and_no_carousel():
    markup = bs.build_home()
    sec = markup[markup.index('id="awards"'):markup.index('id="about"')]
    assert 'data-track' not in sec and 'data-slide' not in sec and 'track-dots' not in sec
    assert sec.count('class="aw-stack gal" data-anchor data-gal') == 3
    assert sec.count('class="aw-place" data-anchor') == 3
    assert sec.count('<button class="btn aw-next" type="button" data-gal-step="1">Next photo</button>') == 3


def test_the_placing_box_has_the_widest_board_s_shape():
    """The flip-boards are fitted into .aw-place: its shape is the widest placing's board (2ND RUNNER-UP,
    js/3d/flap.js layoutRows gives 13.85 x 1.77)."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert '.aw-place{' in css and 'aspect-ratio:13.85/1.77' in css


def test_the_ending_board_has_a_box_shaped_like_its_layout():
    """The 3D internship board is fitted into .end-board: two rows on a laptop (19.76 x 3.42), three on a
    phone (12.3 x 5.07), from js/3d/flap.js layoutRows."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert 'aspect-ratio:19.76/3.42' in css and 'aspect-ratio:12.3/5.07' in css
    end = bs.build_home()
    end = end[end.index('id="contact"'):end.index('</main>')]
    assert 'class="end-board" data-anchor' in end
    assert '<h2 class="sr-only" id="contact-title">Open to internships, 2027/28</h2>' in end


def test_every_page_header_links_to_linkedin_and_github():
    for name, markup in pages().items():
        head = markup[markup.index('<header'):markup.index('</header>')]
        assert f'href="{bs.LINKEDIN}"' in head and 'aria-label="LinkedIn"' in head, name
        assert f'href="{bs.GITHUB}"' in head and 'aria-label="GitHub"' in head, name


def test_every_chapter_still_has_its_own_description():
    for c in bs.CHAPTERS:
        assert c.get('alt'), c['pid']
        assert bs.BY_ID[c['pid']]['name'].split()[0] in c['alt'] or c['pid'] == 'kc', c['pid']
