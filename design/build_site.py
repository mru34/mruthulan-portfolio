#!/usr/bin/env python3
"""Build every page of the site from one set of project facts.

    python design/build_site.py

Writes index.html, the five case pages, privacy.html and 404.html, makes
800px-wide copies of large images for phones (originals are never touched),
then stamps the CSS and JS links (stamp_assets.py).

Edit words here, never in the generated HTML. Nothing in this file invents a
claim: project facts come from the previous case pages, data/content.json and
Mruthulan's own answers. Where wording is still unconfirmed it is left out
rather than guessed.
"""
import html
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = json.loads((ROOT / 'data' / 'media.json').read_text(encoding='utf-8'))
CONTENT = json.loads((ROOT / 'data' / 'content.json').read_text(encoding='utf-8'))

SITE = 'https://mruthulan.com'
RESUME = 'assets/Mruthulan-Senthil-Nathan-Resume.pdf'
EMAIL = 'mruthulansenthilnathan@gmail.com'
LINKEDIN = 'https://www.linkedin.com/in/mruthulan/'
GITHUB = 'https://github.com/mru34'
MAILTO = f'mailto:{EMAIL}?subject=Portfolio%20enquiry'
POST_SP = 'https://lnkd.in/p/dCBs22kx'        # Dell InnovateDash at SP / SignalBridge
POST_DELL = 'https://lnkd.in/p/dZQiUX3z'      # Dell InnovateFest / MEANT
POST_AUTODESK = 'https://lnkd.in/p/dQW9Pg_v'  # Autodesk hackathon / KnowCad
SIGNALBRIDGE_REPO = 'https://github.com/mru34/signalbridge'
POST_SPSOC_DELL = 'https://lnkd.in/p/daCVQd3v'  # SP School of Computing on MEANT at Dell InnovateFest
# The opening line of each post, word for word (emoji left out), shown on hover.
PEEKS = {
    POST_SP: ('Mruthulan Senthil Nathan', 'Back-to-back hackathon wins.'),
    POST_DELL: ('Mruthulan Senthil Nathan', 'We won $3,000 in 10 minutes. At least, that’s what it looked like.'),
    POST_AUTODESK: ('Mruthulan Senthil Nathan', 'I’m really excited to share that my team and I were named '
                    'Champions of the Autodesk Singapore Hackathon 2026!'),
    POST_SPSOC_DELL: ('SP School of Computing', 'On 18 September, Team MEANT from Singapore Polytechnic’s SP School '
                      'of Computing stood on stage at the National Gallery Singapore to present their work…'),
}
SP_FEATURE = ('https://www.sp.edu.sg/courses/schools/soc/happenings/detail/soc-happenings/'
              'information-technology-students-clinch-top-prize-at-sp-innovatedash-2026')
PRESS_ARTICLE = ('https://www.tamilmurasu.com.sg/community/'
                 'applications-students-using-artificial-intelligence-social-welfare')
PRESS_FULL = 'assets/media/press/tamil-murasu-2026-09-28-p8.webp'
PRESS_TITLE = 'Tamil Murasu · 28 September 2026 · Page 8'
PRESS_ALT = ('Tamil Murasu, page 8, 28 September 2026: a feature headlined in Tamil ‘Helping the '
             'community with AI’. Left photo: the Singapore Polytechnic MEANT team in blazers and red '
             'ties with two others, one seated in a wheelchair. Right photo: a university team beside '
             'their Bloom Up project screen. Below, five columns of Tamil text.')


def e(s):
    return html.escape(str(s), quote=True)


def code_line(x):
    """Code in a card: long paths and names may break after / and _, not mid-word."""
    return e(x).replace('/', '/<wbr>').replace('_', '_<wbr>')


def ext(href):
    return ' target="_blank" rel="noopener noreferrer"' if href.startswith('http') else ''


def emph(s):
    """Escape, then turn *this* into the gold emphasis (weight and colour, never italics)."""
    return re.sub(r'\*(.+?)\*', r'<strong>\1</strong>', e(s))


# ------------------------------------------------------------------ images

def make_derivatives():
    """800px-wide WebP copies of large photos and screenshots, for phones."""
    from PIL import Image
    made = []
    for key, m in MEDIA.items():
        src = m.get('src')
        if not src or (m.get('width') or 0) <= 900:
            continue
        path = ROOT / 'assets' / 'media' / src
        small = path.with_name(path.stem + '-800.webp')
        if small.exists() or not path.exists():
            continue
        with Image.open(path) as im:
            h = round(im.height * 800 / im.width)
            im.resize((800, h), Image.LANCZOS).save(small, 'WEBP', quality=80, method=6)
        made.append(small.name)
    return made


def poster(key, width=400):
    """A small copy of a screenshot, inlined in the page, painted behind the real image so the
    frame shows the product from the first paint instead of an empty box while the file loads."""
    import base64, io
    from PIL import Image
    buf = io.BytesIO()
    with Image.open(ROOT / 'assets' / 'media' / MEDIA[key]['src']) as im:
        im.convert('RGB').resize((width, round(im.height * width / im.width)), Image.LANCZOS).save(buf, 'WEBP', quality=45, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def pic(key, sizes, eager=False, alt=None, cls='ph', fit_style=''):
    """A picture from data/media.json with its real size, so nothing shifts."""
    m = MEDIA[key]
    src = f"assets/media/{m['src']}"
    small = ROOT / 'assets' / 'media' / (Path(m['src']).stem + '-800.webp')
    srcset = ''
    if small.exists():
        srcset = f' srcset="assets/media/{small.name} 800w, {src} {m["width"]}w" sizes="{sizes}"'
    load = ' fetchpriority="high"' if eager else ' loading="lazy"'
    a = e(m['alt'] if alt is None else alt)
    style = f' style="{fit_style}"' if fit_style else ''
    return (f'<div class="{cls}"><img src="{src}"{srcset} width="{m["width"]}" height="{m["height"]}" '
            f'alt="{a}" decoding="async"{load}{style}></div>')


# On phones a laptop-and-phone scene shrinks until neither screen can be read, so the case pages show
# just the phone there: the same region of each scene (the phone sits in the same place in all three).
PHONE_SCENES = {'signalbridge-case': 'The youth’s side: SafeNight asks before anything is shared',
                'better-call-bhai-case': 'A booking confirmed on a phone',
                'boss-breaker-case': 'Boss Raid on a phone'}   # with the caption for the phone alone
PHONE_CROP = (0.685, 0.10, 0.985, 0.90)   # left, top, right, bottom, as fractions of the scene


def phone_crop(key, width=640):
    """The phone from a scene, as its own file (made once, like the 800px copies)."""
    from PIL import Image
    m = MEDIA[key]
    out = ROOT / 'assets' / 'media' / (Path(m['src']).stem + '-phone.webp')
    l, t, r, b = PHONE_CROP
    w, h = m['width'] * (r - l), m['height'] * (b - t)
    size = (width, round(width * h / w))
    if not out.exists():
        with Image.open(ROOT / 'assets' / 'media' / m['src']) as im:
            box = tuple(round(v) for v in (l * im.width, t * im.height, r * im.width, b * im.height))
            im.convert('RGB').crop(box).resize(size, Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
    return f'assets/media/{out.name}', size


def zoom(key, sizes, caption=None, eager=False, cls='ph', project=None):
    """A picture that opens full size in the viewer (or as the file, without script)."""
    m = MEDIA[key]
    cap = caption if caption is not None else (m.get('caption') or '')
    proj = f' data-project="{project}"' if project else ''
    return (f'<a class="zoom" href="assets/media/{m["src"]}" data-zoom="{e(cap or "Full size")}" '
            f'data-alt="{e(m["alt"])}"{proj} aria-label="View full size: {e(cap or m["alt"])}">'
            f'{pic(key, sizes, eager, cls=cls)}</a>')


def phone_first(html, key):
    """Wrap a scene's <img> in a <picture> whose phone source is the cropped phone."""
    src, (w, h) = phone_crop(key)
    return html.replace('<img ', f'<picture><source media="(max-width: 860px)" srcset="{src}" width="{w}" height="{h}"><img ', 1
                        ).replace('decoding="async" fetchpriority="high">', 'decoding="async" fetchpriority="high"></picture>', 1)


def figure(key, sizes, caption=None, eager=False):
    m = MEDIA[key]
    cap = caption if caption is not None else (m.get('caption') or '')
    return f'<figure>{zoom(key, sizes, cap, eager)}<figcaption class="cap">{e(cap)}</figcaption></figure>'


# ------------------------------------------------------------------ projects

_T = CONTENT.get('betterCallBhaiTestimonial', {})
TESTIMONIAL = ((_T['quote'], f"{_T['attribution']}, {_T.get('role', '')}".strip(', '))
               if _T.get('status') == 'ready' and _T.get('quote') else None)
ABOUT_PERSONAL = (CONTENT.get('aboutPersonal', {}).get('text')
                  if CONTENT.get('aboutPersonal', {}).get('status') == 'ready' else None)


def sec(eyebrow, heading, body, sid=None):
    i = f' id="{sid}"' if sid else ''
    return (f'<section class="cs"{i}><div class="cs-head"><p class="eyebrow">{e(eyebrow)}</p>'
            f'<h2 class="cn">{e(heading)}</h2></div><div class="cs-body">{body}</div></section>')


def steps(items):
    return '<ol class="steps">' + ''.join(
        f'<li><b>{e(k)}</b><span>{e(t)}</span></li>' for k, t in items) + '</ol>'


def compare(before, after):
    def card(title, items):
        return (f'<div class="card"><h3>{e(title)}</h3><ul>'
                + ''.join(f'<li>{e(x)}</li>' for x in items) + '</ul></div>')
    return '<div class="duo">' + card(*before) + card(*after) + '</div>'


def built(items, source):
    """What I built, as short cards, each backed by the project's repository; the
    source line says where the evidence lives."""
    cards = ''.join(f'<div class="card"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in items)
    return f'<div class="duo">{cards}</div><p class="note">{e(source)}</p>'


def shots(keys, sizes='(max-width: 860px) 100vw, 44vw', one=False):
    """Pictures side by side, or one to a row (one=True) where each is a screen worth reading."""
    if one:
        sizes = '(max-width: 860px) 100vw, 900px'
    return f'<div class="shots{" one" if one else ""}">' + ''.join(figure(k, sizes) for k in keys) + '</div>'


def para(t):
    return f'<p>{e(t)}</p>'


def note(t):
    return f'<p class="note">{e(t)}</p>'


def quote(q, who):
    return (f'<blockquote class="quote"><p>“{e(q)}”</p><footer>{e(who)} · WhatsApp message, '
            'emoji removed and one sentence left out, marked with an ellipsis</footer></blockquote>')


PROJECTS = [
    dict(
        id='sb', slug='signalbridge', name='SignalBridge', type='Hackathon', c='#2BC4BC',
        board=('HACKATHON', 'CHAMPION'),
        line='After-hours chat for young people. Nothing reaches a youth worker until they say yes.',
        role='Youth-facing chat and consent flow, its API routes, the Discord integration',
        result='Dell InnovateDash 2026 — Champion',
        event='Dell InnovateDash 2026 · Champion',
        proof=('View my Dell InnovateDash post ↗', POST_SP, 'proof_post_click'),
        preview='signalbridge-shot-1', cover=('browser', 'signalbridge-shot-1'),
        desc=('SignalBridge case study: a consent-led youth support platform that won Dell InnovateDash '
              '2026. The handoff, the decisions and my role on the build.'),
        og='A consent-led youth support platform. Dell InnovateDash 2026 Champion.',
        hl='Youth support that keeps the context, and asks before anything is shared.',
        st=('A youth-support command centre for a brief from Singapore Children’s Society, built by four '
            'Year 2 IT students around after-hours conversations, human handoff and consent.'),
        actions=[('Open the app ↗', 'https://signalbridge-web.onrender.com/', None),
                 ('Code on GitHub ↗', SIGNALBRIDGE_REPO, None)],
        more=[('My Dell InnovateDash post ↗', POST_SP, 'proof_post_click'),
              ('SP’s feature, which calls it SP InnovateDash 2026 ↗', SP_FEATURE, None)],
        facts=[('My role', 'The youth chat and consent flow, their API routes, and the Discord integration with its tests'),
               ('Result', 'Dell InnovateDash 2026 — Champion'),
               ('Stack', 'Next.js · FastAPI · PostgreSQL')],
        lead=('signalbridge-shot-1', None),
        scene='signalbridge-case',
        sections=lambda: [
            sec('The handoff', 'Five moments. The worker decides at every one.', steps([
                ('Message', 'A young person writes to SafeNight after hours.'),
                ('Signal', 'Fixed rules flag the risk before any AI is involved.'),
                ('Consent', 'Nothing is shared until they agree to the note.'),
                ('Brief', 'A handoff brief: context, risk, a key quote, a first response.'),
                ('Worker', 'The worker opens the brief instead of a cold thread.')])),
            sec('Evidence', 'What it actually looks like.',
                shots(['signalbridge-shot-2', 'signalbridge-shot-3'], one=True)
                + note('Fictional demo data from the running app. The backend, AI and deployment were teammates’ work.')),
        ],
    ),
    dict(
        id='bx', slug='boss-breaker', name='Boss Breaker', type='Solo build', c='#F06A43',
        board=('SOLO BUILD', 'COMPLETED'),
        line='Wellness challenges, played as a boss fight.',
        role='Solo build: frontend, API, database and game logic',
        result='Full-stack coursework build',
        event='Back-end development module · coursework',
        proof=('View the code ↗', 'https://github.com/mru34/bedca2', None),
        preview='boss-breaker-dashboard', cover=('browser', 'boss-breaker-dashboard'),
        desc=('Boss Breaker case study: a full-stack wellness game with challenges, points and boss raids. '
              'Built with JavaScript, Node.js and MySQL.'),
        og='A full-stack wellness game with challenges, points and boss raids.',
        hl='Wellness challenges, played as a boss fight.',
        st=('A full-stack build for a back-end development module assignment: complete wellness challenges to earn points, then '
            'spend them against a shared boss.'),
        actions=[('View the code ↗', 'https://github.com/mru34/bedca2', None)],
        facts=[('My role', 'Built it alone: frontend, API, database and game logic'),
               ('Stack', 'JavaScript · Node.js · MySQL'),
               ('Status', 'Coursework · source on GitHub')],
        lead=('boss-breaker-dashboard', None),
        scene='boss-breaker-case',
        sections=lambda: [
            sec('The loop', 'Four mechanics, one habit.', steps([
                ('Challenges', 'A wellness action is how you earn anything.'),
                ('Points', 'Added on the server, so the browser cannot cheat.'),
                ('Boss raids', 'Spend points against a shared boss, with a damage leaderboard.'),
                ('Progression', 'Everything lives in MySQL, so it survives a refresh.')])),
            sec('In play', 'What a session looks like.', shots(['boss-breaker-raid', 'boss-breaker-shot-1'], one=True)
                + note('Run locally on a fresh database with demo data. Every commit in the public repository is mine.')),
        ],
    ),
    dict(
        id='bb', slug='better-call-bhai', name='Better Call Bhai', type='Client build', c='#E3B53A',
        board=('CLIENT', 'PILOT'),
        line='Online booking for a barbershop in Singapore.',
        role='Solo build: design, frontend, API, database and deployment',
        result='Deployed pilot',
        event='Client build · Deployed pilot',
        proof=('Visit the site ↗', 'https://bettercalbhai.onrender.com/', None),
        preview='better-call-bhai-shot-1', cover=('device', 'better-call-bhai-shot-1'),
        desc=('Better Call Bhai case study: an appointment booking site for a local barbershop, deployed '
              'on Render and in a pilot with the shop.'),
        og='An appointment booking site for a local barbershop, in a pilot with the shop.',
        hl='Barber bookings, minus the back-and-forth.',
        st=('Customers pick a service, a day and an open slot and confirm on the site, with their booking '
            'details one tap away on WhatsApp. The shop is piloting it; most bookings still come in through '
            'WhatsApp for now.'),
        actions=[('Visit the site ↗', 'https://bettercalbhai.onrender.com/', None)],
        facts=[('My role', 'Built it alone: design, frontend, Express API, SQLite database, admin page and deployment'),
               ('Status', 'Deployed pilot, for a barbershop in Singapore'),
               ('Stack', 'JavaScript · Node.js / Express · SQLite · hosted on Render')],
        lead=('better-call-bhai-shot-1', 'The deployed site, on a laptop and a phone'),
        scene='better-call-bhai-case',
        sections=lambda: [
            sec('Before and after', 'The whole job was removing a conversation.', compare(
                ('Before: WhatsApp', ['Message the shop to ask what is free.', 'Wait for a reply.',
                                      'Agree a time.', 'Confirm again closer to the day.']),
                ('After: the site', ['Open the site.', 'Pick an open slot.', 'Confirm.']))),
            sec('Evidence', 'The booking flow, end to end.',
                shots(['better-call-bhai-flow', 'better-call-bhai-shot-3'], one=True)
                + note('Run locally with test bookings, so no customer appears.')
                + (quote(*TESTIMONIAL) if TESTIMONIAL else '')),
        ],
    ),
    dict(
        id='mt', slug='meant', name='MEANT', type='Hackathon', c='#4DA3FF',
        board=('HACKATHON', '2ND RUNNER-UP'),
        line='Helps people who can’t rely on their speech reply in time. They choose every word.',
        role='UI and UX, the Singaporean TTS voice with a teammate, presenting the build',
        result='Dell InnovateFest 2026 — Second runner-up · S$3,000',
        event='Dell InnovateFest 2026 · Second runner-up',
        proof=('View my Dell InnovateFest post ↗', POST_DELL, 'proof_post_click'),
        preview='meant-shot-1', cover=('browser', 'meant-shot-1'),
        desc=('MEANT case study: an on-device communication assistant for AAC users. Dell InnovateFest '
              '2026 second runner-up, S$3,000.'),
        og='An on-device communication assistant that keeps AAC users in control of what they say.',
        hl='Helping AAC users reply before the conversation moves on.',
        st=('AAC users often lose their turn while they compose a reply. MEANT prepares a few likely '
            'replies, and the user still chooses every word. Partner: SPD Ltd, Singapore.'),
        actions=[('My Dell InnovateFest post ↗', POST_DELL, 'proof_post_click'),
                 ('Featured in Tamil Murasu ↓', '#press', None)],
        more=[('SP School of Computing’s post ↗', POST_SPSOC_DELL, 'proof_post_click')],
        facts=[('My role', 'UI and UX, the Singaporean TTS voice with a teammate, and presenting the build'),
               ('Result', 'Second runner-up, polytechnic category · S$3,000'),
               ('Stack', 'On-device AI on a Dell GB10 · Singaporean TTS')],
        lead=None,
        scene='meant-case',
        sections=lambda: [
            sec('One turn', 'Three seconds of a conversation.', steps([
                ('The room moves on', 'Turn Claim tells the other person an answer is coming.'),
                ('A reply is offered', 'Suggestions come from a Dell GB10. Nothing leaves the device.'),
                ('The user authors it', 'They pick, type or use their board. Nothing is spoken without a tap.')])),
            sec('The voice', 'It had to sound like it came from here.',
                para('A generic text-to-speech voice makes a Singaporean user sound like someone else. '
                     'I worked on the Singaporean TTS voice with a teammate.')
                + shots(['meant-shot-2', 'meant-shot-3'])
                + note('The running tablet client with the hawker demo pack. The repository is private.')),
            sec('If the AI stops', 'It still works.',
                para('If the AI layer goes down, the AAC board and typing still work.')),
            sec('My part', 'The screens a person uses, and a demo that could not stall.', built([
                ('Boards you can read at a glance', 'Each kind of word gets a colour and an openly licensed symbol.'),
                ('No dead ends', 'Search the whole vocabulary when a prediction is wrong.'),
                ('Setup that fits the person', 'The screen ruler and mic permission come during setup, not mid-conversation.'),
                ('A demo that could not stall', 'Scripted the stage turn and fixed a stuck mic, a silent send and a black camera.')],
                'From my commits to the private MEANT repository.')),
        ],
    ),
    dict(
        id='kc', slug='knowcad', name='KnowCad', type='Hackathon', c='#9B87FF',
        board=('HACKATHON', 'CHAMPION'),
        line='An AI assistant for customer service that finds answers in long documents.',
        role='Built and delivered the presentation',
        result='Autodesk Singapore Hackathon 2026 — Champion',
        event='Autodesk Singapore Hackathon 2026 · Champion',
        proof=('View my Autodesk hackathon post ↗', POST_AUTODESK, 'proof_post_click'),
        preview='win-knowcad-champion', cover=('photo', 'win-knowcad-champion'),
        desc=('KnowCad case study: a retrieval-based AI assistant for customer service that won the '
              'Autodesk Singapore Hackathon 2026.'),
        og='A retrieval-based AI assistant for customer service. Autodesk Singapore Hackathon 2026 Champion.',
        hl='A retrieval-based AI assistant for customer service.',
        st=('Built by a mixed team at the Autodesk Singapore Hackathon 2026. The Autodesk engineers led the '
            'code; I built and delivered the presentation.'),
        actions=[('My Autodesk hackathon post ↗', POST_AUTODESK, 'proof_post_click')],
        facts=[('My role', 'Built and delivered the presentation'),
               ('Result', 'Autodesk Singapore Hackathon 2026 — Champion'),
               ('Approach', 'Retrieval-augmented generation (RAG)')],
        lead=('win-knowcad-champion', 'Champion, announced on the night'),
        sections=lambda: [
            sec('From a pile to an answer', 'Every step throws work away.', steps([
                ('Everything', 'Knowledge spread across long documents, none of it indexed.'),
                ('What is relevant', 'Retrieval narrows it to the passages that matter.'),
                ('The answer', 'One answer with its source, and a human still reviewing.')])),
            sec('Proof', 'The result, and the team behind it.', shots(['win-knowcad-team'], one=True)
                + note('The product is private, so the proof is the award and my post.')),
        ],
    ),
]
BY_ID = {p['id']: p for p in PROJECTS}


# ------------------------------------------------------------------ shared parts

def og_image(path):
    """The link-preview card for a page: its own card if it has one (made by portfolio-tools/card-shots/og.mjs),
    else the home card. The query string changes with the picture, so LinkedIn and others fetch it again."""
    import hashlib
    card = ROOT / 'assets' / 'og' / f"{(path[:-5] if path.endswith('.html') else '') or 'home'}.jpg"
    if not card.exists():
        card = ROOT / 'assets' / 'og' / 'home.jpg'
    return f"{SITE}/assets/og/{card.name}?v={hashlib.sha1(card.read_bytes()).hexdigest()[:8]}"


def module_map():
    """The homepage's ES modules. Every module URL carries a hash of the file's contents (?v=…), so a browser
    never mixes modules from two releases (GitHub Pages lets them be cached for ten minutes)."""
    import hashlib
    imports = {}
    for f in sorted((ROOT / 'js').rglob('*.js')):
        rel = f.relative_to(ROOT).as_posix()
        if rel in ('js/script.js', 'js/analytics.js'):
            continue
        h = hashlib.sha1(f.read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:8]
        imports[f'./{rel}'] = f'./{rel}?v={h}'
        if rel.startswith('js/vendor/three/addons/'):
            imports['three/addons/' + rel.removeprefix('js/vendor/three/addons/')] = f'./{rel}?v={h}'
    imports['three'] = imports['./js/vendor/three/three.module.min.js']
    imports['lenis'] = imports['./js/vendor/lenis/lenis.min.js']
    return imports


def head(title, desc, path, og_title=None, og_desc=None, ld=None, noindex=False, prefix='', modules=False):
    canonical = f'{SITE}/{path}'
    image = og_image(path)
    meta_robots = '\n  <meta name="robots" content="noindex">' if noindex else ''
    ld_html = (f'\n  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
               if ld else '')
    mods = ''
    if modules:
        imap = module_map()
        mods = (f'\n  <script type="importmap">{json.dumps({"imports": imap}, separators=(",", ":"))}</script>'
                f'\n  <script type="module" src="{imap["./js/home.js"]}"></script>')
    return f"""<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0C0C0D">{meta_robots}
  <meta name="description" content="{e(desc)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{e(og_title or title)}">
  <meta property="og:description" content="{e(og_desc or desc)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{image}">
  <title>{e(title)}</title>
  <link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{prefix}css/styles.css">
  <script>document.documentElement.classList.replace('no-js','js-on')</script>
  <script src="{prefix}js/script.js" defer></script>
  <script src="{prefix}js/analytics.js" defer></script>{mods}{ld_html}
</head>"""


def header(home, current=None, prefix=''):
    """home: '' on the home page, 'index.html' elsewhere."""
    h = home

    def nav(sid, label):
        cur = ' aria-current="true"' if current == sid else ''
        return f'<a href="{h}#{sid}" data-nav="{sid}"{cur}>{label}</a>'
    links = [('work', 'Work'), ('awards', 'Awards'), ('about', 'About')]
    solid = '' if not home else ' solid'
    menu = ''.join(f'<a href="{h}#{sid}">{label}</a>' for sid, label in links + [('contact', 'Contact')])
    return f"""<header class="top{solid}" data-top>
    <div class="wrap top-in">
      <a class="logo cn" href="{h or ''}#top">Mruthulan</a>
      <nav class="nav" aria-label="Main">{''.join(nav(s, l) for s, l in links)}<span class="nav-ink" aria-hidden="true"></span></nav>
      <div class="top-acts">
        <a class="icon-only" href="{LINKEDIN}"{ext(LINKEDIN)} data-event="contact_open_linkedin" aria-label="LinkedIn">{icon('linkedin')}</a>
        <a class="icon-only" href="{GITHUB}"{ext(GITHUB)} data-event="contact_open_github" aria-label="GitHub">{icon('github')}</a>
        <a class="btn resume" href="{prefix}{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↓</a>
        <a class="btn solid contact-btn" href="{h}#contact">Contact</a>
        <button class="btn menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>Menu</button>
      </div>
    </div>
    <nav class="menu" id="menu" aria-label="Menu" hidden>{menu}<a href="{prefix}{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↓</a><a href="{LINKEDIN}"{ext(LINKEDIN)} data-event="contact_open_linkedin">LinkedIn ↗</a><a href="{GITHUB}"{ext(GITHUB)} data-event="contact_open_github">GitHub ↗</a></nav>
  </header>"""


def footer(home='', prefix=''):
    return f"""<footer class="wrap">
    <div class="foot">
      <span><b>Mruthulan Senthil Nathan</b> · Singapore</span>
      <nav aria-label="Footer">
        <a href="{GITHUB}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="{LINKEDIN}" target="_blank" rel="noopener noreferrer" data-event="contact_open_linkedin">LinkedIn ↗</a>
        <a href="{prefix}privacy.html">Privacy</a>
        <a href="#top">Back to top ↑</a>
      </nav>
    </div>
  </footer>"""


VIEWER = """<dialog class="viewer" data-viewer aria-labelledby="vw-title">
    <div class="vw-bar">
      <div class="vw-title"><span id="vw-title" data-vw-title>Full size</span><small class="vw-hint">Scroll or pinch to zoom · drag to move · double-click to zoom in</small></div>
      <div class="vw-ctl"><button type="button" data-vw-prev aria-label="Previous photo" hidden>←</button><output data-vw-count hidden></output><button type="button" data-vw-next aria-label="Next photo" hidden>→</button><button type="button" data-z="out" aria-label="Zoom out">−</button><output data-zl>100%</output><button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="reset">Reset</button><a href="#" data-vw-original target="_blank" rel="noopener noreferrer">Original ↗</a><button type="button" class="close" data-close>Close</button></div>
    </div>
    <div class="vw-stage" data-stage><img alt="" draggable="false"></div>
  </dialog>"""


def body_open(page, style=''):
    st = f' style="{style}"' if style else ''
    return f"""<body data-page="{page}"{st}>
  <a class="skip-link" href="#main">Skip to content</a>
  <div id="top"></div>"""


# ------------------------------------------------------------------ home

# The organisers' logos sit on each result (Dell InnovateDash was held at SP, so it shows both). Official files, shown in white; they
# name where the event was held and link nowhere. (file, alt, width, height)
LOGOS = {
    'sp': ('sp.png', 'Singapore Polytechnic', 136, 30),
    'dell': ('dell.svg', 'Dell Technologies', 169, 22),
    'autodesk': ('autodesk.svg', 'Autodesk', 166, 17),
}



def sechead(sid, title):
    """A section title in the board lettering."""
    return (f'<header class="sechead"><h2 class="cn" id="{sid}"><span class="sr-only">{e(title)}</span>'
            f'<span aria-hidden="true">{e(title)}</span></h2></header>')


# ------------------------------------------------------------------ what I built, on the case pages
# Each "What I built" line is backed by the project's repository. Pointing at a line
# (or tapping it) zooms the real screenshot to that part (r = x, y, w, h as fractions of
# the image), or, where there is nothing to show on screen, opens a card with the real
# route, test or table names.
FEATURED = [
    dict(pid='sb',
         frame='browser',
         layers={'chat': 'signalbridge-shot-1', 'consent': 'signalbridge-shot-3'}, first='chat',
         items=[
             ('The youth-facing chat, sign-in and dashboard', dict(t='img', l='chat', r=[0.0, 0.08, 1.0, 0.32],
                 phone='signalbridge-phone-chat')),
             ('The consent step: the young person previews the note before it is shared', dict(t='img', l='consent', r=[0.24, 0.1, 0.52, 0.56])),
             ('FastAPI routes that connect the chat to the backend', dict(t='card', f='services/api/app/routes/conversations.py',
                 lines=['GET   /youth/conversation', 'POST  /conversations/{conversation_id}/messages', 'POST  /handoffs/consent'],
                 note='From my commit d1d654e. The team later reorganised the backend.')),
             ('The Discord integration, with tests for its intake', dict(t='card', f='services/api/tests/test_production_alpha.py',
                 lines=['def test_discord_thread_conversation_routes_to_safenight()', 'def test_discord_public_intake_falls_back_when_youth_id_missing()'],
                 note='Plus the migrations for Discord user and thread IDs.')),
         ],
    ),
    dict(pid='bb',
         frame='device',
         layers={'flow': 'better-call-bhai-flow', 'live': 'better-call-bhai-shot-1'}, first='flow',
         items=[
             ('The booking site customers use', dict(t='img', l='flow', r=[0.206, 0.042, 0.263, 0.928])),
             ('Server-side rules: no past dates, and each slot can only be booked once', dict(t='img', l='flow', r=[0.552, 0.33, 0.222, 0.41],
                 tag='Taken slots are struck through; a second booking gets “That time slot is already booked.”')),
             ('A Node/Express API on SQLite, with the shop’s admin page', dict(t='card', f='server.js',
                 lines=['GET/POST/PATCH/DELETE  /api/services', 'POST  /api/bookings        GET  /api/bookings', 'PATCH /api/bookings/:id/status', 'GET   /api/slots',
                        'CREATE UNIQUE INDEX idx_bookings_date_time ON bookings(date, time)'],
                 note='From the private repository; every commit is mine.')),
             ('Deployed on Render', dict(t='img', l='live', r=[0.0, 0.0, 1.0, 1.0])),
         ],
    ),
    dict(pid='bx',
         frame='browser',
         layers={'dash': 'boss-breaker-dashboard'}, first='dash',
         items=[
             ('A nine-page frontend: dashboard, challenges, boss raid, shop, inventory', dict(t='img', l='dash', r=[0.08, 0.0, 0.84, 0.07])),
             ('Points and boss damage worked out on the server', dict(t='img', l='dash', r=[0.06, 0.13, 0.89, 0.27],
                 tag='damage = challenge.points × item multiplier + bonus_damage')),
             ('An Express API and a nine-table MySQL schema created at start-up', dict(t='card', f='src/configure/initTables.js',
                 lines=['User · WellnessChallenge · UserCompletion', 'Item · Inventory · UserEffect', 'Boss · BossDamageLog · Review',
                        'CREATE TABLE IF NOT EXISTS …  (runs on an empty database)'],
                 note='From the public repository; every commit is mine.')),
             ('bcrypt-hashed passwords and JWT-protected routes', dict(t='card', f='src/middleware',
                 lines=['bcrypt.hash(req.body.password, saltRounds, callback)', 'Authorization: Bearer <token>'],
                 note='bcryptMiddleware.js and jwtMiddleware.js.')),
         ],
    ),
]


FEAT_BY_ID = {f['pid']: f for f in FEATURED}


def phone_view(f, d):
    """On phones each "What I built" line shows its part of the product right under it: the zoomed-in
    crop of the screenshot (r = x, y, w, h as fractions), or the code card. Hidden on larger screens,
    where pointing at the line zooms the picture instead."""
    if d['t'] == 'card':
        lines = ''.join(f'<code>{code_line(x)}</code>' for x in d['lines'])
        return f'<div class="hs-m hs-m-card"><p class="hs-file">{code_line(d["f"])}</p>{lines}<p class="hs-note">{e(d["note"])}</p></div>'
    tag = f'<p class="hs-m-tag">{e(d["tag"])}</p>' if d.get('tag') else ''
    if d.get('phone'):  # a phone screenshot of the same thing reads better than a crop of a laptop screen
        m, (x, y, w, h) = MEDIA[d['phone']], (0, 0, 1, 1)
    else:
        m, (x, y, w, h) = MEDIA[f['layers'][d['l']]], d['r']
    ratio = (w * m['width']) / (h * m['height'])
    if ratio > 2.4 and not d.get('phone'):  # a thin strip of a laptop screen is unreadable on a phone
        return f'<div class="hs-m">{tag}</div>' if tag else ''
    px = 0 if w >= 1 else x / (1 - w) * 100
    py = 0 if h >= 1 else y / (1 - h) * 100
    crop = (f'<div class="hs-crop" style="--ratio:{ratio:.4f};background-image:url(assets/media/{m["src"]});'
            f'background-size:{100 / w:.2f}% auto;background-position:{px:.2f}% {py:.2f}%"></div>')
    return f'<div class="hs-m">{crop}{tag}</div>'


def hotspots(f):
    """The case page's opening picture, with the "What I built" lines beside it."""
    p = BY_ID[f['pid']]
    layers = ''
    for k, v in f['layers'].items():
        m = MEDIA[v]
        on = ' data-on fetchpriority="high"' if k == f['first'] else ' loading="lazy"'
        layers += (f'<img class="hs-layer" data-layer="{k}" src="assets/media/{m["src"]}" width="{m["width"]}" height="{m["height"]}" '
                   f'alt="{e(m["alt"])}"{on} decoding="async">')
    cards = items = ''
    for k, (label, d) in enumerate(f['items']):
        if d['t'] == 'card':
            lines = ''.join(f'<code>{code_line(x)}</code>' for x in d['lines'])
            cards += (f'<div class="hs-card" data-card="{k}"><p class="hs-file">{code_line(d["f"])}</p>{lines}'
                      f'<p class="hs-note">{e(d["note"])}</p></div>')
        data = {k2: v for k2, v in d.items() if k2 in ('t', 'l', 'r', 'tag')}
        data['i'] = k
        items += (f'<li><button class="hs-item" type="button" aria-pressed="false" data-hs="{e(json.dumps(data, ensure_ascii=False))}">'
                  f'<span class="hs-dot" aria-hidden="true"></span>{e(label)}</button>{phone_view(f, d)}</li>')
    bar = f'<span class="frame-bar" aria-hidden="true"><i></i><i></i><i></i><span>{e(p["name"])}</span></span>' if f['frame'] == 'browser' else ''
    return f'''<section class="feat feat-case" id="built" data-feat aria-labelledby="built-title">
          <div class="hs-wrap">
            <div class="hs-frame{' is-device' if f['frame'] == 'device' else ''}">{bar}
              <div class="hs-view" aria-hidden="true"><div class="hs-stage">{layers}<span class="hs-spot"></span></div><p class="hs-tag"></p></div>
            </div>
            <p class="hs-hint" aria-hidden="true"><span class="fine">Point at a line to see it in the product</span><span class="touch">Tap a line below to see it in the product</span></p>{cards}
          </div>
          <div class="feat-text">
            <h2 class="k" id="built-title">What I built</h2><ul class="built">{items}</ul>
          </div>
        </section>'''


# ------------------------------------------------------------------ awards: three stacks of photos
# Each award: a stack of the event's photos (Next photo moves the top one to the back; with the live 3D the
# stack is real prints on a table, flicked by hand), its placing (a flip-board with the live 3D), the event,
# the project, my post about it, and the organisers' logos.
AWARDS = [
    ('sb', 'win-sp', 'Champion', 'Dell InnovateDash 2026', [], ['dell', 'sp'],
     ['win-signalbridge-team', 'win-signalbridge-award'], POST_SP),
    ('mt', 'win-dell', '2nd runner-up', 'Dell InnovateFest 2026 · polytechnic category', ['S$3,000'], ['dell'],
     ['win-meant-handover', 'win-meant-stage', 'win-meant-team'], POST_DELL),
    ('kc', 'win-autodesk', 'Champion', 'Autodesk Singapore Hackathon 2026', [], ['autodesk'],
     ['win-knowcad-champion', 'win-knowcad-team'], POST_AUTODESK),
]


def award(pid, anchor, place, event, facts, logos, photos, post):
    p = BY_ID[pid]
    org = '<i class="org-sep" aria-hidden="true"></i>'.join(
        f'<img src="assets/logos/{s}" alt="{e(a)}" width="{w}" height="{h}" loading="lazy" decoding="async">' for s, a, w, h in (LOGOS[k] for k in logos))
    shots = ''.join(
        f'<a class="shot" href="assets/media/{MEDIA[k]["src"]}" data-zoom="{e(MEDIA[k]["caption"])}" data-alt="{e(MEDIA[k]["alt"])}" '
        f'data-group="{anchor}" data-photo="{k}"{" data-on" if n == 0 else ""} aria-label="View full size: {e(MEDIA[k]["caption"])}">'
        f'{pic(k, "(max-width: 860px) 86vw, 30vw", cls="ph")}</a>' for n, k in enumerate(photos))
    fact = ''.join(f' <span class="fact">{e(x)}</span>' for x in facts)
    return f'''<article class="win aw" id="{anchor}" style="--c:{p['c']}">
          <div class="aw-stack gal" data-anchor data-gal><div class="gal-main">{shots}</div><button class="btn aw-next" type="button" data-gal-step="1">Next photo</button><span class="sr-only" aria-live="polite" data-gal-live></span></div>
          <div class="aw-place" data-anchor><h3 class="cn">{e(place)}</h3></div>
          <p class="ev">{e(event)}{fact}</p>
          <p class="pr"><a class="link" href="{p['slug']}.html" data-event="case_open" data-project="{pid}"><i class="sw"></i>{e(p['name'])}</a><a class="link" href="{post}"{ext(post)} data-event="proof_post_click" data-project="{pid}">LinkedIn post ↗</a></p>
          <div class="org">{org}</div>
        </article>'''


# ------------------------------------------------------------------ the project list and the board
# ------------------------------------------------------------------ home

# Icons, inlined and drawn in the text colour (never in brand colours). GitHub and Gmail: Simple Icons
# 16.34.0 (CC0). LinkedIn and the résumé page: Bootstrap Icons 1.11.3 (MIT, assets/ICONS-LICENSE.txt).
ICONS = {
    'github': ('0 0 24 24', 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'),
    'gmail': ('0 0 24 24', 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z'),
    'linkedin': ('0 0 16 16', 'M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z'),
    'resume': ('0 0 16 16', 'M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z'),
}


def icon(name):
    box, d = ICONS[name]
    return f'<svg viewBox="{box}" aria-hidden="true" focusable="false"><path d="{d}"/></svg>'


def icon_link(name, label, href, event):
    target = ' target="_blank" rel="noopener"' if href == RESUME else ext(href)
    return f'<a class="icon-btn" href="{e(href)}"{target} data-event="{event}">{icon(name)}<span>{e(label)}</span></a>'


HERO_LINKS = [('linkedin', 'LinkedIn', LINKEDIN, 'contact_open_linkedin'),
              ('github', 'GitHub', GITHUB, 'contact_open_github'),
              ('resume', 'Résumé', RESUME, 'resume_click')]
END_LINKS = [('gmail', 'Gmail', MAILTO, 'contact_open_mail_app'),
             ('linkedin', 'LinkedIn', LINKEDIN, 'contact_open_linkedin'),
             ('github', 'GitHub', GITHUB, 'contact_open_github')]

# The homepage chapters, in order. Every word here is in the spec's "Every word on the homepage".
# side: which corner of the full-screen scene the information sits in (left, right, bottom-left).
# extra: markup after Case study (a chapter's own button or line); hud: markup over the scene. font: the project name's own
# typeface (assets/fonts/name-*.woff2). still: the picture shown until a chapter has its own rendered still.
# KnowCad's example (the chapter's 3D draws the same words; tests/test_assets.py checks they agree)
KC_QUERY = 'Licence “in use on another device” after moving to new laptops'

CHAPTERS = [
    dict(pid='sb', num='01', side='left', result='Champion · Dell InnovateDash 2026',
         font='Name SignalBridge', still='signalbridge-card',
         alt='SignalBridge on a phone and a laptop: the youth’s SafeNight chat showing Worker notified, '
             'and the worker’s handoff brief for Mira Tan, a fictional youth.'),
    dict(pid='bx', num='02', side='right', result='Solo build · code on GitHub',
         font='Name Boss Breaker', still='boss-breaker-card',
         alt='Boss Breaker’s Boss Raid screen on a large display and on a phone, the Stress Dragon’s health bar '
             'at 1,840 of 5,000 HP, a hand of challenge cards and the leaderboard.',
         extra='<button class="btn bx-attack" type="button" data-attack>Attack</button>',
         hud='<div class="bx-hud" aria-hidden="true"><p class="bx-hit" data-hit></p><p class="bx-boss">Stress Dragon</p>'
             '<p class="bx-hp"><span data-hp>1,840</span> / 5,000 HP</p>'
             '<p class="bx-down" data-defeated hidden>Stress Dragon defeated</p></div>'
             '<p class="sr-only" aria-live="polite" data-hp-live></p>'),
    dict(pid='bb', num='03', side='bottom-left', result='Solo build · in a pilot with the shop',
         font='Name Better Call Bhai', still='better-call-bhai-card',
         alt='Better Call Bhai on a phone showing Booking Confirmed, between two yellow, black and white barber poles, '
             'with the day’s time slots behind it and 15:00 chosen.'),
    dict(pid='mt', num='04', side='right', result='2nd runner-up · Dell InnovateFest 2026',
         font='Name MEANT', still='meant-card',
         alt='MEANT on a café table: the tablet showing four suggested replies, the partner’s display showing '
             'Give me a moment, and the Tamil Murasu page, with word tiles from the board around them.',
         extra='<a class="link mt-press" href="meant.html#press">Featured in Tamil Murasu</a>'
               '<div class="mt-picks" role="group" aria-label="Pick a reply">'
               + ''.join(f'<button class="mt-pick" type="button" data-reply="{i}">{r}</button>'
                         for i, r in enumerate(['Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice']))
               + '</div><p class="sr-only" aria-live="polite" data-partner-live></p>'),
    dict(pid='kc', num='05', side='left', result='Champion · Autodesk Singapore Hackathon 2026',
         font='Name KnowCad', still='win-knowcad-champion',
         alt='KnowCad at a support rep’s desk: a customer asks why their licence shows as in use on another '
             'device, and KnowCad’s suggested answer cites three manuals pulled from the shelves around the desk, '
             'Licensing p. 42, Admin Handbook p. 118 and Troubleshooting p. 7. An example question.',
         extra=f'<p class="kc-q" aria-hidden="true"><span data-typed>{e(KC_QUERY)}</span>'
               f'<i class="kc-caret"></i></p><p class="sr-only">{e(KC_QUERY)}</p>'),
]

ABOUT_INTRO = ('I study IT at Singapore Polytechnic. I build for one real person first: a youth worker at midnight, '
               'someone who can’t rely on their speech, a barber with a full day of bookings.')
ABOUT_FACTS = [
    ('Study', 'Diploma in Information Technology · Singapore Polytechnic · 2025–2028', ''),
    ('Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman · SP ACER', ''),
    ('Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL', 'mono'),
]


def still_picture(scene, alt='', eager=False):
    """The rendered still of a 3D scene (design/stills.mjs), desk and phone versions, or None until it is made."""
    from PIL import Image
    folder = ROOT / 'assets' / '3d' / 'stills'
    desk, phone = folder / f'{scene}-desk.webp', folder / f'{scene}-phone.webp'
    if not (desk.exists() and phone.exists()):
        return None
    with Image.open(desk) as a, Image.open(phone) as b:
        (dw, dh), (pw, ph) = a.size, b.size
    load = ' fetchpriority="high"' if eager else ' loading="lazy"'
    return (f'<picture class="still"><source media="(max-width: 860px)" srcset="assets/3d/stills/{phone.name}" '
            f'width="{pw}" height="{ph}"><img src="assets/3d/stills/{desk.name}" width="{dw}" height="{dh}" '
            f'alt="{e(alt)}" decoding="async"{load}></picture>')


def hero_board():
    """The name, as the board's rendered still (design/stills.mjs; tests/test_assets.py requires it)."""
    return still_picture('hero', eager=True) or ''


def end_board():
    """The internship board, as its rendered still (design/stills.mjs; tests/test_assets.py requires it)."""
    return still_picture('ending') or ''


def chapter(c, first=False):
    p = BY_ID[c['pid']]
    href = f"{p['slug']}.html"
    ev = f'data-event="case_open" data-project="{p["id"]}"'
    still = still_picture(p['slug'], c.get('alt') or MEDIA[c['still']]['alt']) or pic(
        c['still'], '(max-width: 860px) 100vw, 58vw', cls='still')
    work = '<span class="ch-key" id="work"></span>' if first else ''
    return f'''<section class="chapter" data-scene="{p['slug']}" data-side="{c['side']}" style="--c:{p['c']};--name-font:'{c['font']}'" aria-labelledby="ch-{p['id']}">
        {work}<span class="ch-key" id="work-{p['id']}"></span>
        <div class="pin">
          <div class="ch-stage">{still}<a class="ch-hit" href="{href}" tabindex="-1" aria-hidden="true" {ev}></a></div>
          <div class="info">
            <p class="ch-num">{c['num']}</p>
            <h3 class="ch-name" id="ch-{p['id']}" style="view-transition-name:t-{p['id']}"><a href="{href}" {ev}>{e(p['name'])}</a></h3>
            <p class="ch-line beat-line">{e(p['line'])}</p>
            <p class="ch-res beat-pay">{e(c['result'])}</p>
            <a class="btn beat-pay" href="{href}" {ev}>Case study <span aria-hidden="true">→</span></a>{c.get('extra', '')}
          </div>{c.get('hud', '')}
        </div>
      </section>'''


def build_home():
    ld = {'@context': 'https://schema.org', '@type': 'Person', 'name': 'Mruthulan Senthil Nathan',
          'alternateName': ['Mruthulan', 'Senthil Nathan Mruthulan'], 'url': f'{SITE}/',
          'jobTitle': 'Software developer and IT student',
          'affiliation': {'@type': 'CollegeOrUniversity', 'name': 'Singapore Polytechnic'},
          'address': {'@type': 'PostalAddress', 'addressCountry': 'SG'},
          'sameAs': [LINKEDIN, GITHUB]}
    chapters = '\n      '.join(chapter(c, first=(i == 0)) for i, c in enumerate(CHAPTERS))
    rail = '<ol class="rail" aria-hidden="true">' + ''.join(
        f'<li style="--c:{BY_ID[c["pid"]]["c"]}"></li>' for c in CHAPTERS) + '</ol>'
    hero_links = ''.join(f'<li>{icon_link(*link)}</li>' for link in HERO_LINKS)
    end_links = ''.join(f'<li>{icon_link(*link)}</li>' for link in END_LINKS)

    def fact(term, text, cls):
        cls = f' class="{cls}"' if cls else ''
        return f'<div><dt>{e(term)}</dt><dd{cls}>{e(text)}</dd></div>'
    facts = ''.join(fact(*f) for f in ABOUT_FACTS)
    return f"""{head('Mruthulan Senthil Nathan — Developer & Builder',
                 'Mruthulan Senthil Nathan, Year 2 IT at Singapore Polytechnic, builds full-stack products. Five projects, what I built on each, and three hackathon results.',
                 '', og_title='Mruthulan Senthil Nathan — Developer & Builder',
                 og_desc='Five projects, what I built on each, and three hackathon results.', ld=ld, modules=True)}
{body_open('home')}
  <canvas class="stage" aria-hidden="true"></canvas>
  {header('')}

  <main id="main">
    <section class="hero wrap" data-scene="hero" aria-labelledby="name">
      <h1 class="sr-only" id="name">Mruthulan Senthil Nathan</h1>
      <div class="hero-board" data-anchor>{hero_board()}</div>
      <ul class="hero-links" aria-label="Links">{hero_links}</ul>
      <div data-hero-end aria-hidden="true"></div>
    </section>

    <div class="chapters" data-sec="work">
      {chapters}
    </div>
    {rail}

    <section class="sec wrap" id="awards" data-sec="awards" aria-labelledby="awards-title">
      <span id="results"></span><span id="wins"></span><span id="recognition"></span>
      {sechead('awards-title', 'Awards')}
      <div class="aw-row" aria-label="Awards">
        {''.join(award(*a) for a in AWARDS)}
      </div>
    </section>

    <section class="sec wrap" id="about" data-sec="about" aria-labelledby="about-title">
      <h2 class="big" id="about-title">About</h2>
      <div class="me">
        {pic('about-portrait', '(max-width: 860px) 100vw, 380px', cls='ph portrait')}
        <div class="me-text"><p class="me-intro">{e(ABOUT_INTRO)}</p><dl class="facts3" id="credentials">{facts}</dl></div>
      </div>
    </section>

    <section class="end wrap" id="contact" data-sec="contact" aria-labelledby="contact-title">
      <div class="end-board" data-anchor>{end_board()}</div>
      <p class="sr-only">Open to a SWE internship, 2027/28</p>
      <h2 class="big" id="contact-title">Reach out</h2>
      <ul class="end-links">{end_links}</ul>
      <p class="end-mail"><span data-mail>{EMAIL}</span><button class="btn" type="button" data-copy="{EMAIL}">Copy</button></p>
      <p class="sr-only" role="status" aria-live="polite" data-copy-status></p>
    </section>
  </main>

  {footer()}
  {VIEWER}
</body>
</html>
"""


# ------------------------------------------------------------------ case pages

def build_case(p):
    i = PROJECTS.index(p)
    prev, nxt = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]

    def action(k, a):
        label, href, ev = a
        evattr = f' data-event="{ev}" data-project="{p["id"]}"' if ev else ''
        return f'<a class="btn{" solid" if k == 0 else ""}" href="{e(href)}"{ext(href)}{evattr}>{e(label)}</a>'
    actions = ''.join(action(k, a) for k, a in enumerate(p['actions']))
    # Render's free plan puts an app to sleep when nobody uses it, and the first visit wakes it slowly
    live = next((a[0] for a in p['actions'] if 'onrender.com' in a[1]), None)
    wake = (note(f"Free hosting: the {'site' if 'site' in live else 'app'} sleeps when nobody is using it, "
                 'so the first visit can take up to a minute to load.').replace('class="note"', 'class="note wake"')
            if live else '')
    # links beyond the two buttons sit quietly at the end of the page
    def more_link(label, href, ev):
        evattr = f' data-event="{ev}" data-project="{p["id"]}"' if ev else ''
        return f'<a class="link" href="{e(href)}"{ext(href)}{evattr}>{e(label)}</a>'
    more = ''.join(more_link(*a) for a in p.get('more', []))
    more = f'<p class="more-links"><span>More</span>{more}</p>' if more else ''
    facts =''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in p['facts'])
    # the page opens on a picture: the whole product framed in devices (made by portfolio-tools/card-shots),
    # or the project's lead photo; the facts follow it, then the interactive What I built
    built = hotspots(FEAT_BY_ID[p['id']]) if p['id'] in FEAT_BY_ID else ''
    key, cap = (p['scene'], None) if p.get('scene') else (p['lead'] or (None, None))
    cap = cap or (MEDIA[key].get('caption') or '' if key else '')
    lead = zoom(key, "(max-width: 860px) 100vw, 1300px", cap, eager=True) if key else ''
    kind = ' scene-fig' if p.get('scene') else ' is-photo' if p['cover'][0] == 'photo' else ''
    capt = e(cap)
    if key in PHONE_SCENES:
        lead, kind = phone_first(lead, key), kind + ' has-phone'
        capt = f'<span class="cap-wide">{capt}</span><span class="cap-phone">{e(PHONE_SCENES[key])}</span>'
    picture =(f'<figure class="lead-fig{kind}">{lead}'
               f'<figcaption class="cap">{capt}</figcaption></figure>') if key else ''
    # back to the project's place on the homepage
    back = f"index.html#work-{p['id']}"
    ld = {'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': p['name'],
          'description': p['og'], 'url': f"{SITE}/{p['slug']}.html",
          'author': {'@type': 'Person', 'name': 'Mruthulan Senthil Nathan', 'url': f'{SITE}/'}}
    return f"""{head(f"{p['name']} — Mruthulan", p['desc'], f"{p['slug']}.html",
                 og_title=f"{p['name']} — Mruthulan", og_desc=p['og'], ld=ld)}
{body_open('case', f"--c:{p['c']}")}
  <div class="progress" data-progress aria-hidden="true"></div>
  {header('index.html', current='work')}

  <main id="main">
    <div class="wrap">
      <header class="case-top">
        <p class="crumb"><a class="link" href="{back}">← All work</a><span class="crumb-ev">{e(p['event'])}</span></p>
        <h1 class="case-title cn" style="view-transition-name:t-{p['id']};--len:{max(len(w) for w in p['name'].split())}">{e(p['name'])}</h1>
        <p class="case-hl">{e(p['hl'])}</p>
        <p class="case-st">{e(p['st'])}</p>
        <div class="acts">{actions}</div>{wake}
        {picture}
        <dl class="facts">{facts}</dl>
        {built}
      </header>

      {''.join(p['sections']())}{press_section() if p['id'] == 'mt' else ''}
      {more}

      <nav class="case-nav" aria-label="More projects">
        <a href="{prev['slug']}.html" rel="prev" data-event="case_open" data-project="{prev['id']}"><small>← Previous</small><span class="cn">{e(prev['name'])}</span></a>
        <a class="all link" href="{back}">All work</a>
        <a class="next" href="{nxt['slug']}.html" rel="next" data-event="case_open" data-project="{nxt['id']}"><small>Next →</small><span class="cn">{e(nxt['name'])}</span></a>
      </nav>
    </div>
  </main>

  {footer('index.html')}
  {VIEWER}
</body>
</html>
"""


def press_section():
    """Tamil Murasu's page about MEANT, on a newsprint panel."""
    return sec('In the press', 'Tamil Murasu featured MEANT.', f'''<div class="press press-case">
          <div class="text">
            <p>Tamil Murasu featured MEANT alongside student projects using artificial intelligence for social impact.</p>
            <div class="acts"><a class="btn" href="{PRESS_ARTICLE}" hreflang="ta" target="_blank" rel="noopener noreferrer" data-event="press_article_click" data-project="mt">Read in Tamil ↗</a></div>
          </div>
          <figure>
            <a class="paper-link" href="{PRESS_FULL}" data-zoom="{PRESS_TITLE}" data-alt="{e(PRESS_ALT)}" data-view-event="press_viewer_open" data-project="mt" aria-label="View the Tamil Murasu page full size">
              <div class="ph"><img src="assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp" srcset="assets/media/press/tamil-murasu-2026-09-28-p8-720.webp 720w, assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp 1200w" sizes="(max-width: 860px) 100vw, 60vw" width="1776" height="1416" loading="lazy" decoding="async" alt="{e(PRESS_ALT)}"></div>
            </a>
            <figcaption>Tamil Murasu, 28 September 2026, page 8. © SPH Media. <span class="hint-fine">Click</span><span class="hint-touch">Tap</span> the page to open it full size.</figcaption>
          </figure>
        </div>''', sid='press')


# ------------------------------------------------------------------ small pages

def build_privacy():
    return f"""{head('Privacy & analytics — Mruthulan', 'How analytics works on Mruthulan’s portfolio and how to change your choice.', 'privacy.html')}
{body_open('privacy')}
  {header('index.html')}
  <main id="main" class="wrap">
    <div class="text-page">
      <p class="crumb"><a class="link" href="index.html">← Back to the portfolio</a></p>
      <h1 class="cn">A simple choice about analytics.</h1>
      <p class="lead">This portfolio loads Google Analytics 4 only when you answer “Yes” to the analytics question. It helps me understand which work people read and how they find the site.</p>
      <section>
        <h2 class="cn">What is measured</h2>
        <p>Google Analytics may collect page views, approximate location, referral source, browser and device information, and interactions such as outbound clicks, which project you open, which project the board lands on, and whether you used the contact options. Nothing you type is sent. It uses cookies or similar browser identifiers. I use aggregate reports to improve the site, and I do not ask you to create an account here.</p>
      </section>
      <section>
        <h2 class="cn">Your choice</h2>
        <p>The analytics script does not load until you opt in. Your choice is saved in this browser so you are not asked on every page. If you decline, the site still works normally. You can change your choice at any time.</p>
        <p id="analytics-status" aria-live="polite">Checking your choice…</p>
        <div class="acts"><button class="btn solid" id="analytics-change" type="button">Change analytics choice</button></div>
      </section>
      <section>
        <h2 class="cn">Fonts</h2>
        <p>The typefaces are served from this site, so loading a page makes no request to a font service.</p>
      </section>
      <section>
        <h2 class="cn">More information</h2>
        <p>Analytics data is processed by Google. Read <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy policy ↗</a> for details. For questions about this site, email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
      </section>
    </div>
  </main>
  {footer('index.html')}
</body>
</html>
"""


def build_404():
    links = ''.join(f'<a class="btn" href="/{p["slug"]}.html">{e(p["name"])} →</a>' for p in PROJECTS[:3])
    return f"""{head('Page not found — Mruthulan', 'This page does not exist.', '404.html', noindex=True, prefix='/')}
{body_open('notfound')}
  {header('/index.html', prefix='/')}
  <main id="main" class="wrap">
    <div class="text-page">
      <p class="eyebrow">404 · Wrong turn</p>
      <h1 class="cn">This page went missing.</h1>
      <p class="lead">The work is still here. Head back to the portfolio, or jump straight into a project.</p>
      <div class="acts"><a class="btn solid" href="/">Back to the portfolio</a>{links}</div>
    </div>
  </main>
  {footer('/index.html', prefix='/')}
</body>
</html>
"""


def write(name, text):
    (ROOT / name).write_text(text, encoding='utf-8', newline='\n')
    print(f'wrote {name:24} {len(text):7} bytes')


if __name__ == '__main__':
    made = make_derivatives()
    if made:
        print('made phone-sized images:', ', '.join(made))
    write('index.html', build_home())
    for proj in PROJECTS:
        write(f"{proj['slug']}.html", build_case(proj))
    write('privacy.html', build_privacy())
    write('404.html', build_404())
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import stamp_assets
    stamp_assets.main()
