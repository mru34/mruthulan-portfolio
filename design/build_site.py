#!/usr/bin/env python3
"""Build every page of the site from one set of project facts.

    python design/build_site.py

Writes index.html, the six case pages, privacy.html and 404.html, makes
800px-wide copies of large images for phones (originals are never touched),
then stamps the CSS and JS links (stamp_assets.py).

Edit words here, never in the generated HTML. Nothing in this file invents a
claim: project facts come from the previous case pages, data/content.json and
Mruthulan's own answers. Where wording is still unconfirmed it is left out
rather than guessed.
"""
import html
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
GMAIL = f'https://mail.google.com/mail/?view=cm&fs=1&to={EMAIL}&su=Portfolio%20enquiry'
MAILTO = f'mailto:{EMAIL}?subject=Portfolio%20enquiry'
POST_SP = 'https://lnkd.in/p/dCBs22kx'        # Dell InnovateDash at SP / SignalBridge
POST_DELL = 'https://lnkd.in/p/dZQiUX3z'      # Dell InnovateFest / MEANT
POST_AUTODESK = 'https://lnkd.in/p/dQW9Pg_v'  # Autodesk hackathon / KnowCad
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
FONTS = ('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..75,700..800'
         '&family=Geist:wght@400..600&display=swap')


def e(s):
    return html.escape(str(s), quote=True)


def ext(href):
    return ' target="_blank" rel="noopener noreferrer"' if href.startswith('http') else ''


def peek(href):
    """A small preview of a LinkedIn post, shown when the link is hovered or focused."""
    if href not in PEEKS:
        return ''
    who, line = PEEKS[href]
    return (f'<span class="peek" aria-hidden="true"><span class="peek-who">{e(who)} · LinkedIn</span>'
            f'<span class="peek-line">“{e(line)}”</span><span class="peek-go">Open the post ↗</span></span>')


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


def cover(p, sizes='(max-width: 860px) 100vw, 50vw'):
    """A project cover: the whole picture, never cropped, in a clean frame on a soft
    surface with a faint glow in the project's colour. Screenshots sit in a slim
    browser window; the mockup, the photo and the deck slide get the frame alone."""
    kind, what = p['cover']
    if kind == 'slide':
        img = f'<img src="assets/deck/{what}" width="1655" height="931" alt="" loading="lazy" decoding="async">'
    else:
        m = MEDIA[what]
        src = f"assets/media/{m['src']}"
        small = ROOT / 'assets' / 'media' / (Path(m['src']).stem + '-800.webp')
        srcset = f' srcset="assets/media/{small.name} 800w, {src} {m["width"]}w" sizes="{sizes}"' if small.exists() else ''
        img = f'<img src="{src}"{srcset} width="{m["width"]}" height="{m["height"]}" alt="" loading="lazy" decoding="async">'
    bar = (f'<span class="frame-bar"><i></i><i></i><i></i><span>{e(p["name"])}</span></span>'
           if kind == 'browser' else '')
    return (f'<div class="cover cover-{kind}" data-id="{p["id"]}" style="--c:{p["c"]}">'
            f'<span class="frame">{bar}{img}</span></div>')


def zoom(key, sizes, caption=None, eager=False, cls='ph', project=None):
    """A picture that opens full size in the viewer (or as the file, without script)."""
    m = MEDIA[key]
    cap = caption if caption is not None else (m.get('caption') or '')
    proj = f' data-project="{project}"' if project else ''
    return (f'<a class="zoom" href="assets/media/{m["src"]}" data-zoom="{e(cap or "Full size")}" '
            f'data-alt="{e(m["alt"])}"{proj} aria-label="View full size: {e(cap or m["alt"])}">'
            f'{pic(key, sizes, eager, cls=cls)}</a>')


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

LOOMY_SLIDES = [
    ('loomy-01.jpg', 'Title slide: Loomy, a social thrifting app that helps reduce waste and make fashion more sustainable.'),
    ('loomy-02.jpg', 'Problem: unwearable clothes sitting in closets, rising clothing prices, and accessibility and sizing problems when thrifting.'),
    ('loomy-03.jpg', 'Market validation, after interviewing 30+ people aged 15 to 25: what potential users said about convenience, incentives and slow platforms.'),
    ('loomy-04.jpg', 'Solution: a trading platform built around an AI-powered online closet for finding your style and trading unworn clothes.'),
    ('loomy-05.jpg', 'The product, in three parts: a community aspect, profiling, and a smart digital wardrobe.'),
    ('loomy-06.jpg', 'Revenue model: a freemium tier, paid convenience services, and commissions on in-app purchases.'),
    ('loomy-07.jpg', 'Competition: where Loomy sits against existing resale platforms on price.'),
    ('loomy-08.jpg', 'Timeline: four quarters of planned milestones, with target user numbers and a projected first-year revenue figure.'),
    ('loomy-09.jpg', 'Team slide: six members with their roles, listing Mru as prototype designer.'),
    ('loomy-10.jpg', 'Closing slide: thank you, with the Loomy contact details.'),
]


def sec(eyebrow, heading, body, sid=None):
    i = f' id="{sid}"' if sid else ''
    return (f'<section class="cs"{i}><div class="cs-head"><p class="eyebrow">{e(eyebrow)}</p>'
            f'<h2 class="cn">{e(heading)}</h2></div><div class="cs-body">{body}</div></section>')


def steps(items):
    return '<ol class="steps">' + ''.join(
        f'<li><b>{e(k)}</b><span>{e(t)}</span></li>' for k, t in items) + '</ol>'


def decisions(items):
    return '<div class="duo">' + ''.join(
        f'<div class="card"><p class="k">Could have</p><p>{e(alt)}</p>'
        f'<p class="k on">I did</p><p>{e(did)}</p></div>' for alt, did in items) + '</div>'


def compare(before, after):
    def card(title, items):
        return (f'<div class="card"><h3>{e(title)}</h3><ul>'
                + ''.join(f'<li>{e(x)}</li>' for x in items) + '</ul></div>')
    return '<div class="duo">' + card(*before) + card(*after) + '</div>'


def shots(keys, sizes='(max-width: 860px) 100vw, 44vw'):
    return '<div class="shots">' + ''.join(figure(k, sizes) for k in keys) + '</div>'


def para(t):
    return f'<p>{e(t)}</p>'


def note(t):
    return f'<p class="note">{e(t)}</p>'


def quote(q, who):
    return (f'<blockquote class="quote"><p>“{e(q)}”</p><footer>{e(who)} · WhatsApp message, '
            'emoji removed and one sentence left out, marked with an ellipsis</footer></blockquote>')


def tally(count, label):
    marks = '<i></i>' * count
    return (f'<div class="tally"><span class="num" aria-hidden="true">{count}+</span>'
            f'<div><p>{e(label)}</p><div class="marks" aria-hidden="true">{marks}</div></div></div>')


def deck():
    slides = ''.join(
        f'<a class="deck-slide" href="assets/deck/{src}" data-zoom="Loomy pitch deck · slide {i + 1} of {len(LOOMY_SLIDES)}" '
        f'data-alt="{e(alt)}"{" data-on" if i == 0 else ""}>'
        f'<img src="assets/deck/{src}" width="1655" height="931" alt="{e(alt)}" decoding="async"'
        f'{"" if i == 0 else " loading=" + chr(34) + "lazy" + chr(34)}></a>'
        for i, (src, alt) in enumerate(LOOMY_SLIDES))
    return ('<div class="deck" id="deck" data-deck tabindex="0" role="group" aria-roledescription="carousel" '
            'aria-label="Loomy pitch deck, use the arrow keys to move between slides">'
            f'<div class="deck-stage">{slides}</div>'
            '<div class="deck-bar">'
            '<button class="btn" type="button" data-deck-prev aria-label="Previous slide">←</button>'
            '<button class="btn" type="button" data-deck-next aria-label="Next slide">→</button>'
            f'<span class="count">Slide <b data-deck-now>1</b> of {len(LOOMY_SLIDES)}</span>'
            '<a class="link" href="assets/Loomy-Pitch-Deck.pdf" target="_blank" rel="noopener" '
            'data-event="deck_open" data-project="lm">Open the full deck (PDF) ↗</a>'
            '</div><p class="sr-only" data-deck-live aria-live="polite"></p></div>')


PROJECTS = [
    dict(
        id='sb', slug='signalbridge', name='SignalBridge', type='Hackathon', c='#2BC4BC',
        board=('HACKATHON', 'CHAMPION'),
        line='Youth support that keeps the context and asks before anything is shared.',
        role='Youth-facing UI, API and Discord integrations, automated tests',
        result='Dell InnovateDash 2026 — Champion',
        event='Dell InnovateDash 2026 · Champion',
        proof=('View my Dell InnovateDash post ↗', POST_SP, 'proof_post_click'),
        preview='signalbridge-shot-1', cover=('browser', 'signalbridge-shot-1'),
        desc=('SignalBridge case study: a consent-led youth support platform that won Dell InnovateDash '
              '2026. The handoff, the decisions and my role on the build.'),
        og='A consent-led youth support platform. Dell InnovateDash 2026 Champion.',
        hl='Youth support that keeps the context, and asks before anything is shared.',
        st=('A youth worker picks up a conversation that started somewhere else, and the context does '
            'not come with it. SignalBridge is a cloud-native, AI-assisted youth-support command centre '
            'built around support conversations, human handoff and consent.'),
        actions=[('Open the app ↗', 'https://signalbridge-web.onrender.com/', None),
                 ('View my Dell InnovateDash post ↗', POST_SP, 'proof_post_click'),
                 ('SP’s feature ↗', SP_FEATURE, None)],
        facts=[('My role', 'Youth-facing experience, API and Discord integrations, automated tests'),
               ('Result', 'Dell InnovateDash 2026 — Champion'),
               ('Stack', 'Next.js · FastAPI · PostgreSQL'),
               ('Partner', 'Brief from Singapore Children’s Society')],
        lead=('signalbridge-shot-1', None),
        sections=lambda: [
            sec('The handoff', 'Five moments, and the judgement stays with the worker at every one.', steps([
                ('Message', 'A young person writes in, out of hours, to whoever is on shift.'),
                ('Signal', 'The system flags risk signals in the thread. It does not act on them.'),
                ('Consent', 'Nothing is passed on until consent is explicit.'),
                ('Brief', 'AI drafts the handoff summary. The worker edits, approves or discards it.'),
                ('Worker', 'The next shift opens with context instead of a cold thread.')])),
            sec('Decisions I made', 'Two calls that were mine to make.', decisions([
                ('Ship the demo path only, because it was a competition.',
                 'Wrote the automated tests around the handoff logic.'),
                ('Ask the young person to install one more app.',
                 'Built the Discord integration, so the conversation stayed where it already was.')])),
            sec('Evidence', 'What it actually looks like.',
                shots(['signalbridge-shot-2', 'signalbridge-shot-3'])
                + note('Captured from the running app with its fictional demo data. No real young person appears anywhere.')),
        ],
        my_role=('I built the youth-facing interfaces, the consent and handoff workflows, the API and '
                 'Discord integrations, and the automated tests that kept the handoff logic honest while '
                 'the team moved fast.'),
        outcome=('Champion at Dell InnovateDash 2026, and the result that took our team to Dell '
                 'InnovateFest, where we built MEANT.'),
    ),
    dict(
        id='mt', slug='meant', name='MEANT', type='Hackathon', c='#4DA3FF',
        board=('HACKATHON', '2ND RUNNER-UP'),
        line='Real-time reply suggestions for AAC users. The user picks every word.',
        role='UI and UX, the Singaporean TTS voice, presenting the build',
        result='Dell InnovateFest 2026 — Second runner-up · S$3,000',
        event='Dell InnovateFest 2026 · Second runner-up',
        proof=('View my Dell InnovateFest post ↗', POST_DELL, 'proof_post_click'),
        preview='meant-shot-1', cover=('browser', 'meant-shot-1'),
        desc=('MEANT case study: an on-device communication assistant for AAC users. Dell InnovateFest '
              '2026 second runner-up, S$3,000.'),
        og='An on-device communication assistant that keeps AAC users in control of what they say.',
        hl='Helping AAC users reply before the conversation moves on.',
        st=('AAC (augmentative and alternative communication) users often lose their turn while they '
            'compose a reply. MEANT listens to the conversation and prepares a few likely replies. The user '
            'still chooses every word, and can drop back to their usual board or typing at any time.'),
        actions=[('View my Dell InnovateFest post ↗', POST_DELL, 'proof_post_click'),
                 ('Featured in Tamil Murasu →', 'index.html#press', None)],
        facts=[('My role', 'UI and UX, the Singaporean TTS voice, and presenting the build'),
               ('Result', 'Second runner-up, polytechnic category · S$3,000'),
               ('Stack', 'On-device AI on a Dell GB10 · Singaporean TTS'),
               ('Partner', 'SPD Ltd, Singapore'),
               ('Status', 'Competition build · repository private')],
        lead=('meant-shot-1', None),
        sections=lambda: [
            sec('One turn', 'The whole product is three seconds of a conversation.', steps([
                ('The room moves on', 'Turn Claim tells the other person an answer is coming, so the conversation holds instead of rolling past.'),
                ('A reply is offered', 'Local context on a Dell GB10 produces timely suggestions. Nothing leaves the device.'),
                ('The user authors it', 'They choose a suggestion, type, or use their AAC board. Nothing is spoken without a tap.')])),
            sec('The voice', 'It had to sound like it came from here.',
                para('A generic text-to-speech voice makes a Singaporean user sound like someone else. '
                     'Building the Singaporean TTS voice was my part of the build, alongside the interface '
                     'and the demo we presented.')
                + shots(['meant-shot-2', 'meant-shot-3'])
                + note('Captured from the running tablet client with the hawker demo pack. The repository itself stays private.')),
            sec('If the AI stops', 'It degrades into something that still works.',
                para('If the AI layer goes down, the AAC board and typing still work. A communication aid '
                     'that fails closed is not a communication aid.')),
        ],
        my_role=('I worked on the UI and UX, built the Singaporean TTS voice, and presented the build on '
                 'stage. MEANT is a separate project from SignalBridge, with a different team goal.'),
        outcome=('Second runner-up in the polytechnic category at Dell InnovateFest 2026, with a S$3,000 '
                 'prize, built with SPD Ltd. Tamil Murasu later featured the project.'),
    ),
    dict(
        id='bb', slug='better-call-bhai', name='Better Call Bhai', type='Client build', c='#E3B53A',
        board=('CLIENT', 'PILOT'),
        line='Appointment booking for a local barbershop. Deployed, and in a pilot with the shop.',
        role='Web design, frontend build and deployment',
        result='Deployed pilot',
        event='Client build · Deployed pilot',
        proof=('Visit the site ↗', 'https://bettercalbhai.onrender.com/', None),
        preview='better-call-bhai-shot-1', cover=('device', 'better-call-bhai-shot-1'),
        desc=('Better Call Bhai case study: an appointment booking site for a local barbershop, deployed '
              'on Render and in a pilot with the shop.'),
        og='An appointment booking site for a local barbershop, in a pilot with the shop.',
        hl='Barber bookings, minus the back-and-forth.',
        st=('Booking a haircut should not take three messages and a phone call. This site lets a customer '
            'pick a service, a day and an open slot, then confirm on WhatsApp. It is deployed on Render and '
            'the shop is piloting it; most bookings still come in through WhatsApp for now.'),
        actions=[('Visit the site ↗', 'https://bettercalbhai.onrender.com/', None)],
        facts=[('My role', 'Web design, frontend build and deployment'),
               ('Status', 'Deployed pilot'),
               ('Stack', 'HTML · CSS · JavaScript · hosted on Render'),
               ('Client', 'A local barbershop in Singapore')],
        lead=('better-call-bhai-shot-1', 'The deployed site, on a laptop and a phone'),
        sections=lambda: [
            sec('Before and after', 'The whole job was removing a conversation.', compare(
                ('Before: WhatsApp', ['Message the shop to ask what is free.', 'Wait for a reply.',
                                      'Agree a time.', 'Confirm again closer to the day.']),
                ('After: the site', ['Open the site.', 'Pick an open slot.', 'Confirm.']))),
            sec('Evidence', 'The booking flow, end to end.',
                shots(['better-call-bhai-shot-2', 'better-call-bhai-shot-3'])
                + note('Captured from the site’s own code running locally with an empty database, so no '
                       'customer appears. The struck-through times are test bookings.')
                + (quote(*TESTIMONIAL) if TESTIMONIAL else '')),
        ],
        my_role=('I owned the customer journey, the appointment form, the mobile interface and the Render '
                 'deployment, built to replace manual WhatsApp appointment coordination.'),
        outcome=('Deployed on Render and in a pilot with the shop. The owner’s own reaction is quoted '
                 'above.'),
    ),
    dict(
        id='kc', slug='knowcad', name='KnowCad', type='Hackathon', c='#9B87FF',
        board=('HACKATHON', 'CHAMPION'),
        line='A retrieval-based AI assistant for customer service. Code and Autodesk materials are private.',
        role='Built and delivered the presentation',
        result='Autodesk Singapore Hackathon 2026 — Champion',
        event='Autodesk Singapore Hackathon 2026 · Champion',
        proof=('View my Autodesk hackathon post ↗', POST_AUTODESK, 'proof_post_click'),
        preview='win-knowcad-champion', cover=('photo', 'win-knowcad-champion'),
        desc=('KnowCad case study: a retrieval-based AI assistant for customer service that won the '
              'Autodesk Singapore Hackathon 2026.'),
        og='A retrieval-based AI assistant for customer service. Autodesk Singapore Hackathon 2026 Champion.',
        hl='A retrieval-based AI assistant for customer service.',
        st=('Finding the answer took longer than answering the question. KnowCad was built by a mixed team '
            'at the Autodesk Singapore Hackathon 2026: the Autodesk engineers led the code, and I built and '
            'delivered the presentation. It uses retrieval-augmented generation (RAG), which looks up the '
            'relevant documents before it answers.'),
        actions=[('View my Autodesk hackathon post ↗', POST_AUTODESK, 'proof_post_click')],
        facts=[('My role', 'Built and delivered the presentation'),
               ('Result', 'Autodesk Singapore Hackathon 2026 — Champion'),
               ('Approach', 'Retrieval-augmented generation (RAG)'),
               ('Status', 'Private: the proof is the award and my post')],
        lead=('win-knowcad-champion', 'Champion, announced on the night'),
        sections=lambda: [
            sec('From a pile to an answer', 'Every step throws work away.', steps([
                ('Everything', 'Technical knowledge spread across long documents, none of it indexed by the question you actually have.'),
                ('What is relevant', 'Retrieval narrows the set to the passages that bear on the question.'),
                ('The answer', 'One answer, with the source behind it and a human still reviewing the decision, not a list of places the answer might be.')])),
            sec('Proof', 'What I can show, and why that is all.',
                para('The repository and the Autodesk materials are private, so there are no product '
                     'screenshots on this page and no link to the code. What is public is the result, the '
                     'post I wrote at the time, and the description above.')
                + shots(['win-knowcad-team'])),
        ],
        my_role=('I built and delivered the presentation. The Autodesk engineers on the team led the code.'),
        outcome='First place at the Autodesk Singapore Hackathon 2026.',
    ),
    dict(
        id='bx', slug='boss-breaker', name='Boss Breaker', type='Coursework', c='#F06A43',
        board=('COURSEWORK', 'COMPLETED'),
        line='Wellness challenges, played as a boss fight.',
        role='API, database and game logic',
        result='Full-stack coursework build',
        event='BED CA2 coursework',
        proof=('View the code ↗', 'https://github.com/mru34/bedca2', None),
        preview='boss-breaker-shot-2', cover=('browser', 'boss-breaker-shot-2'),
        desc=('Boss Breaker case study: a full-stack wellness game with challenges, points and boss raids. '
              'Built with JavaScript, Node.js and MySQL.'),
        og='A full-stack wellness game with challenges, points and boss raids.',
        hl='Wellness challenges, played as a boss fight.',
        st=('Wellness habits are easier to keep when they are a game you are winning. Boss Breaker is a '
            'full-stack coursework build for the BED CA2 brief: users complete wellness challenges to earn '
            'points, then spend them against a shared boss.'),
        actions=[('View the code ↗', 'https://github.com/mru34/bedca2', None)],
        facts=[('My role', 'API, database and game logic'),
               ('Result', 'Complete full-stack build for the BED CA2 brief'),
               ('Stack', 'JavaScript · Node.js · MySQL'),
               ('Status', 'Coursework · source on GitHub')],
        lead=('boss-breaker-shot-2', None),
        sections=lambda: [
            sec('The loop', 'Four mechanics, one habit.', steps([
                ('Daily challenges', 'A wellness action is the unit of play. Doing it is how you earn anything.'),
                ('Points', 'Challenges pay out points. The ledger is server-side, so the game cannot be won in the browser.'),
                ('Boss raids', 'Points are spent against a shared target, which is what makes the habit worth keeping up.'),
                ('Progression', 'State persists in a relational schema, so a streak survives a refresh.')])),
            sec('Evidence', 'The build.', shots(['boss-breaker-shot-1'])),
        ],
        my_role='I built the API, the database schema and the game logic that ties challenges, points and raids together.',
        outcome='A complete full-stack build for the BED CA2 brief, with the source on GitHub.',
    ),
    dict(
        id='lm', slug='loomy', name='Loomy', type='Concept', c='#3DBB7A',
        board=('CONCEPT', 'PITCH DECK'),
        line='A social thrifting app concept to cut clothing waste.',
        role='Prototype designer',
        result='Research and a pitch deck',
        event='Product concept',
        proof=('Read the pitch deck →', 'loomy.html#deck', None),
        preview=None, cover=('slide', 'loomy-01.jpg'),
        desc='Loomy case study: a social thrifting product concept, researched by a team of six and pitched with a deck.',
        og='A social thrifting concept, researched by a team of six and pitched with a deck.',
        hl='Thrifting, with a community attached.',
        st=('Second-hand fashion is social, but most thrifting apps treat it as a transaction. Loomy is a '
            'social thrifting app concept to reduce clothing waste. Our team of six researched it, then '
            'turned the findings into a pitch deck.'),
        actions=[('Read the pitch deck ↓', '#deck', None)],
        facts=[('My role', 'Prototype designer'),
               ('Result', 'Research and a pitch deck'),
               ('Team', 'Six members'),
               ('Status', 'Product concept, not shipped')],
        lead=None,
        sections=lambda: [
            sec('Research first', 'Thirty conversations before a single screen.',
                tally(30, 'people aged 15 to 25 interviewed by the team before any product was designed.')
                + para('The research decided what the product should be. The interviews were the team’s '
                       'work; the findings shaped the three parts of the product in the deck.')),
            sec('The pitch', 'Ten slides, as we pitched them.',
                deck()
                + '<p class="projection">The timeline slide carries <strong>targets and a projected '
                  'first-year revenue figure</strong>. They are projections we pitched, not results: Loomy '
                  'is a concept, and none of those numbers have happened.</p>',
                sid=None),
        ],
        my_role=('The deck credits me as the team’s prototype designer. The 30+ interviews behind the '
                 'concept were the team’s research.'),
        outcome='A pitch deck grounded in more than 30 interviews.',
    ),
]
BY_ID = {p['id']: p for p in PROJECTS}


# ------------------------------------------------------------------ shared parts

def head(title, desc, path, og_title=None, og_desc=None, ld=None, noindex=False, prefix=''):
    canonical = f'{SITE}/{path}'
    meta_robots = '\n  <meta name="robots" content="noindex">' if noindex else ''
    ld_html = (f'\n  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
               if ld else '')
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
  <meta property="og:image" content="{SITE}/assets/og-card.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{SITE}/assets/og-card.jpg">
  <title>{e(title)}</title>
  <link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{FONTS}">
  <link rel="stylesheet" href="{prefix}css/styles.css">
  <script>document.documentElement.classList.replace('no-js','js-on')</script>
  <script src="{prefix}js/script.js" defer></script>
  <script src="{prefix}js/analytics.js" defer></script>{ld_html}
</head>"""


def header(home, current=None, prefix=''):
    """home: '' on the home page, 'index.html' elsewhere."""
    h = home

    def nav(sid, label):
        cur = ' aria-current="true"' if current == sid else ''
        return f'<a href="{h}#{sid}" data-nav="{sid}"{cur}>{label}</a>'
    links = [('results', 'Results'), ('work', 'Work'), ('press', 'Press'), ('about', 'About')]
    solid = '' if not home else ' solid'
    menu = ''.join(f'<a href="{h}#{sid}">{label}</a>' for sid, label in links + [('contact', 'Contact')])
    return f"""<header class="top{solid}" data-top>
    <div class="wrap top-in">
      <a class="logo cn" href="{h or ''}#top">Mruthulan</a>
      <nav class="nav" aria-label="Main">{''.join(nav(s, l) for s, l in links)}<span class="nav-ink" aria-hidden="true"></span></nav>
      <div class="top-acts">
        <a class="btn resume" href="{prefix}{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↓</a>
        <a class="btn solid contact-btn" href="{h}#contact">Contact</a>
        <button class="btn menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>Menu</button>
      </div>
    </div>
    <nav class="menu" id="menu" aria-label="Menu" hidden>{menu}<a href="{prefix}{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↗</a></nav>
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
  </footer>
  <nav class="tabbar" aria-label="Quick links"><a href="{home}#work">Work</a><a href="{prefix}{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé</a><a href="{home}#contact">Contact</a></nav>"""


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

def tiles(text):
    i = 0
    words = []
    for w in text.split():
        cells = ''
        for ch in w:
            cells += f'<span class="t" style="--i:{i}" data-ch="{ch}">{ch}</span>'
            i += 1
        words.append(f'<span class="w" aria-hidden="true">{cells}</span>')
    return ''.join(words)


# The organisers' logos sit on each result (Dell InnovateDash was held at SP, so it shows both). Official files, shown in white; they
# name where the event was held and link nowhere. (file, alt, width, height)
LOGOS = {
    'sp': ('sp.png', 'Singapore Polytechnic', 136, 30),
    'dell': ('dell.svg', 'Dell Technologies', 169, 22),
    'autodesk': ('autodesk.svg', 'Autodesk', 166, 17),
}


def gallery(group, photos, sizes):
    """Every photo of one result: one shown, arrows (or a swipe) to move, tap to enlarge."""
    n = len(photos)
    shots = ''.join(
        f'<a class="shot" href="assets/media/{MEDIA[k]["src"]}" data-zoom="{e(MEDIA[k]["caption"])}" '
        f'data-alt="{e(MEDIA[k]["alt"])}" data-group="{group}"{" data-on" if i == 0 else ""} '
        f'aria-label="View full size: {e(MEDIA[k]["caption"])}">{pic(k, sizes, cls="ph")}</a>'
        for i, k in enumerate(photos))
    nav = dots = ''
    if n > 1:
        nav = (f'<button class="gal-arrow prev" type="button" data-gal-step="-1" aria-label="Previous photo">←</button>'
               f'<button class="gal-arrow next" type="button" data-gal-step="1" aria-label="Next photo">→</button>'
               f'<span class="gal-count" aria-hidden="true"><span data-gal-now>1</span> / {n}</span>')
        dots = '<span class="dots" aria-hidden="true">' + ''.join(
            f'<i{" data-on" if i == 0 else ""}></i>' for i in range(n)) + '</span>'
    cap = e(MEDIA[photos[0]]['caption'])
    auto = ''
    if n > 1:
        auto = ('<button class="gal-pause" type="button" data-gal-pause aria-pressed="false" '
                'aria-label="Pause the photos"><span aria-hidden="true"></span></button>'
                '<span class="gal-timer" data-gal-timer aria-hidden="true"></span>')
    return (f'<div class="gal" data-gal><div class="gal-main" data-tilt>{shots}{nav}{auto}</div>'
            f'<div class="gal-foot"><p class="gal-cap" data-gal-cap>{cap}</p>{dots}</div>'
            f'<span class="sr-only" aria-live="polite" data-gal-live></span></div>')


def win(pid, anchor, place, event, project, photos, links, logos):
    p = BY_ID[pid]
    org = '<i class="org-sep" aria-hidden="true"></i>'.join(
        f'<img src="assets/logos/{src}" alt="{e(alt)}" width="{w}" height="{h}" loading="lazy" decoding="async">'
        for src, alt, w, h in (LOGOS[k] for k in logos))
    ls = ''.join(f'<a class="link{" muted" if i else ""}{" has-peek" if href in PEEKS else ""}" href="{href}"{ext(href)}{ev}>{e(label)}{peek(href)}</a>'
                 for i, (label, href, ev) in enumerate(links))
    return f"""<article class="win arrive" id="{anchor}">
            <div class="org">{org}</div>
            {gallery(anchor, photos, '(max-width: 860px) 100vw, 30vw')}
            <h3 class="cn"><span class="sr-only">{e(place)}</span><span aria-hidden="true" data-scramble>{e(place)}</span></h3>
            <p class="ev">{e(event)}</p>
            <p class="pr"><a class="link" href="{p['slug']}.html" data-event="case_open" data-project="{pid}">{e(project)}</a></p>
            <div class="links">{ls}</div>
          </article>"""


def work_row(p):
    img = f'<div class="row-img" aria-hidden="true">{cover(p, "(max-width: 860px) 100vw, 1px")}</div>'
    label, href, ev = p['proof']
    evattr = f' data-event="{ev}" data-project="{p["id"]}"' if ev else ''
    n = f"{PROJECTS.index(p) + 1:02d} / {len(PROJECTS):02d}"
    return f"""<li class="row arrive" id="work-{p['id']}" data-id="{p['id']}" data-n="{n}" data-caption="{e(p['name'])} · {e(p['type'])}" style="--c:{p['c']}">
            {img}
            <span class="ty"><i class="sw"></i>{e(p['type'])}</span>
            <h3 class="cn" style="view-transition-name:t-{p['id']}">{e(p['name'])}</h3>
            <p class="ln">{e(p['line'])}</p>
            <dl><dt>My role</dt><dd>{e(p['role'])}</dd><dt>Result</dt><dd>{e(p['result'])}</dd></dl>
            <div class="links"><a class="link row-link" href="{p['slug']}.html" data-event="case_open" data-project="{p['id']}">Read the case study <span class="ar">→</span></a><a class="link muted{' has-peek' if href in PEEKS else ''}" href="{href}"{ext(href)}{evattr}>{e(label)}{peek(href)}</a></div>
          </li>"""


def preview_imgs():
    return ''.join(cover(p, '(max-width: 860px) 1px, 50vw') for p in PROJECTS)


def board_data():
    d = {}
    for p in PROJECTS:
        label, href, ev = p['proof']
        d[p['id']] = dict(name=p['name'], type=p['type'], line=p['line'], role=p['role'],
                          result=p['result'], c=p['c'], board=list(p['board']),
                          href=f"{p['slug']}.html", proof=label, proofHref=href, proofEvent=ev or 'outbound_click')
    return json.dumps(d, ensure_ascii=False).replace('</', '<\\/')


def build_home():
    ld = {'@context': 'https://schema.org', '@type': 'Person', 'name': 'Mruthulan Senthil Nathan',
          'alternateName': ['Mruthulan', 'Senthil Nathan Mruthulan'], 'url': f'{SITE}/',
          'jobTitle': 'Software developer and IT student',
          'affiliation': {'@type': 'CollegeOrUniversity', 'name': 'Singapore Polytechnic'},
          'address': {'@type': 'PostalAddress', 'addressCountry': 'SG'},
          'sameAs': [LINKEDIN, GITHUB]}
    about_personal = f'<p>{e(ABOUT_PERSONAL)}</p>' if ABOUT_PERSONAL else ''
    return f"""{head('Mruthulan Senthil Nathan — Developer & Builder',
                 'Mruthulan Senthil Nathan, a Year 2 IT student at Singapore Polytechnic who builds full-stack products. Three hackathon results, six projects, and my role on each stated plainly.',
                 '', og_title='Mruthulan Senthil Nathan — Developer & Builder',
                 og_desc='Three hackathon results, six projects, and my role on each stated plainly.', ld=ld)}
{body_open('home')}
  {header('')}

  <main id="main">
    <div class="wrap">
      <section class="hero" aria-labelledby="name">
        <p class="eyebrow"><span class="long">Singapore · Year 2 Information Technology, Singapore Polytechnic</span><span class="short">Singapore · Year 2 IT, Singapore Polytechnic</span></p>
        <h1 class="tiles" id="name" data-name><span class="sr-only">Mruthulan Senthil Nathan</span>{tiles('MRUTHULAN SENTHIL NATHAN')}</h1>
        <div class="hero-row">
          <div>
            <p class="lede">I build full-stack products and prototypes, and I can show you exactly which parts were mine.</p>
            <p class="seeking"><i aria-hidden="true"></i>Looking for a software engineering internship</p>
          </div>
          <div class="acts"><a class="btn solid" href="#work">See the work</a><a class="btn" href="{LINKEDIN}" target="_blank" rel="noopener noreferrer" data-event="contact_open_linkedin">LinkedIn ↗</a></div>
        </div>
        <div data-hero-end aria-hidden="true"></div>
      </section>

      <section id="results" data-sec="results" aria-labelledby="results-title">
        <span id="wins"></span><span id="recognition"></span>
        <h2 class="eyebrow" id="results-title">Results · three hackathons, three projects</h2>
        <div class="score">
          {win('sb', 'win-sp', 'Champion', 'Dell InnovateDash 2026', 'SignalBridge', ['win-signalbridge-team', 'win-signalbridge-award'],
               [('View my Dell InnovateDash post ↗', POST_SP, ' data-event="proof_post_click" data-project="sb"'),
                ('Singapore Polytechnic’s feature ↗', SP_FEATURE, '')], ['dell', 'sp'])}
          {win('mt', 'win-dell', 'Second runner-up', 'Dell InnovateFest 2026 · S$3,000', 'MEANT · polytechnic category', ['win-meant-handover', 'win-meant-stage', 'win-meant-team'],
               [('View my Dell InnovateFest post ↗', POST_DELL, ' data-event="proof_post_click" data-project="mt"'),
                ('SP School of Computing’s post ↗', POST_SPSOC_DELL, ' data-event="proof_post_click" data-project="mt"'),
                ('Featured in Tamil Murasu ↓', '#press', '')], ['dell'])}
          {win('kc', 'win-autodesk', 'Champion', 'Autodesk Singapore Hackathon 2026', 'KnowCad', ['win-knowcad-champion', 'win-knowcad-team'],
               [('View my Autodesk hackathon post ↗', POST_AUTODESK, ' data-event="proof_post_click" data-project="kc"')], ['autodesk'])}
        </div>
      </section>

      <section class="board" data-board data-sec="results" aria-labelledby="board-title" hidden>
        <div class="board-head"><h2 class="eyebrow" id="board-title">Now showing</h2><button class="btn solid" type="button" data-spin>Spin a project</button></div>
        <div class="fids" aria-hidden="true">
          <div><span class="lab">Project</span><div class="flaps" data-col="name" data-n="16"></div></div>
          <div><span class="lab">Type</span><div class="flaps" data-col="type" data-n="10"></div></div>
          <div><span class="lab">Status</span><div class="flaps status" data-col="status" data-n="13"></div></div>
        </div>
        <div class="result" data-result><span class="sw" style="--c:#444"></span><div><span class="k">Can’t choose?</span><p>Press Spin. The board lands on one of six projects, and its details appear here. All six are also listed under Work.</p></div></div>
        <p class="sr-only" role="status" aria-live="polite" data-spin-live></p>
      </section>
    </div>

    <section class="sec wrap" id="work" data-sec="work" aria-labelledby="work-title">
      <header class="sechead"><h2 class="cn" id="work-title">Work</h2><p>Six projects, with my part in each</p></header>
      <div class="work-grid">
        <figure class="preview" aria-hidden="true"><div class="pv-frame" data-pv>{preview_imgs()}</div><figcaption><i class="sw" data-pv-sw></i><span data-pv-cap></span><span class="pv-n" data-pv-n></span></figcaption></figure>
        <ol class="rows" data-rows>
          {''.join(work_row(p) for p in PROJECTS)}
        </ol>
      </div>
    </section>

    <section class="sec wrap" id="press" data-sec="press" aria-labelledby="press-title">
      <div class="press">
        <div class="text arrive">
          <p class="eyebrow">Press · Tamil Murasu</p>
          <h2 class="cn" id="press-title">Our work made the news.</h2>
          <p>Tamil Murasu featured MEANT alongside student projects using artificial intelligence for social impact.</p>
          <p class="meta">28 September 2026 · Page 8 · By Christo Leon</p>
          <div class="acts"><a class="btn solid" href="{PRESS_FULL}" data-zoom="{PRESS_TITLE}" data-alt="{e(PRESS_ALT)}" data-view-event="press_viewer_open" data-project="mt">Open the full page</a><a class="btn" href="{PRESS_ARTICLE}" hreflang="ta" target="_blank" rel="noopener noreferrer" data-event="press_article_click" data-project="mt">Read in Tamil ↗</a></div>
        </div>
        <figure class="arrive">
          <a class="paper-link" href="{PRESS_FULL}" data-zoom="{PRESS_TITLE}" data-alt="{e(PRESS_ALT)}" data-view-event="press_viewer_open" data-project="mt" data-loupe aria-label="View the Tamil Murasu page full size">
            <span class="loupe" aria-hidden="true"></span>
            <div class="ph"><img src="assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp" srcset="assets/media/press/tamil-murasu-2026-09-28-p8-720.webp 720w, assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp 1200w" sizes="(max-width: 860px) 100vw, 56vw" width="1776" height="1416" loading="lazy" decoding="async" alt="{e(PRESS_ALT)}"></div>
          </a>
          <figcaption>Tamil Murasu, 28 September 2026, page 8. Page and photographs © SPH Media. <span class="hint-fine">Move over the page to magnify it; click to open it full size.</span><span class="hint-touch">Tap the page to open it full size, then pinch to zoom.</span></figcaption>
        </figure>
      </div>
    </section>

    <section class="sec wrap" id="about" data-sec="about" aria-labelledby="about-title">
      <header class="sechead"><h2 class="cn" id="about-title">About</h2><p>Who I am, where I study, what I use</p></header>
      <div class="about">
        {pic('about-portrait', '(max-width: 860px) 100vw, 380px', cls='ph portrait arrive')}
        <div class="text arrive">
          <p class="lead">I care about the last mile: whether someone can actually use the result, whether it survives failure, and whether I can explain the decisions clearly.</p>
          {about_personal}
          <p class="where"><i aria-hidden="true"></i>Singapore · Year 2 Information Technology, Singapore Polytechnic</p>
        </div>
      </div>
      <div class="about-cards" id="credentials">
        <article class="acard arrive">
          <h3 class="eyebrow">Study</h3>
          <b>Diploma in Information Technology</b>
          <span class="sub">Singapore Polytechnic · Apr 2025 – May 2028 (expected)</span>
          <p>Represented SP at the Dell InnovateFest national final in 2026.</p>
        </article>
        <article class="acard arrive">
          <h3 class="eyebrow">Leadership</h3>
          <ul>
            <li><b>Secretary, subcommittee</b><span class="sub">Youth Harmony Chapter, Singapore Polytechnic</span><p>Coordination, communication and follow-through for student-led activities and community engagement.</p></li>
            <li><b>Class Chairman and SP ACER</b><span class="sub">Singapore Polytechnic</span><p>Class communication and student outreach, including Open House 2026 and First Steps with SP.</p></li>
          </ul>
        </article>
        <article class="acard acard-wide arrive">
          <h3 class="eyebrow">Tools, and where I used them</h3>
          <dl class="tools">
            <div><dt>Web</dt><dd><span class="chips"><span>JavaScript</span><span>HTML</span><span>CSS</span><span>Node.js</span></span><span class="sub">Better Call Bhai, Boss Breaker</span></dd></div>
            <div><dt>Backend and data</dt><dd><span class="chips"><span>Python</span><span>FastAPI</span><span>SQL</span><span>PostgreSQL</span><span>Java</span></span><span class="sub">SignalBridge (FastAPI, PostgreSQL), Boss Breaker (MySQL)</span></dd></div>
            <div><dt>Practice</dt><dd><span class="chips"><span>Git</span><span>Automated testing</span><span>Deployment</span></span><span class="sub">SignalBridge’s tests, Better Call Bhai on Render</span></dd></div>
          </dl>
        </article>
      </div>
    </section>

    <section class="talk" id="contact" data-sec="contact" aria-labelledby="contact-title">
      <div class="wrap talk-in">
        <p class="seeking"><i aria-hidden="true"></i>Looking for a software engineering internship</p>
        <h2 class="cn arrive" id="contact-title">Let’s talk.</h2>
        <div class="mail-row">
          <a class="mail-big" href="{e(MAILTO)}" data-mail data-event="contact_open_mail_app">{EMAIL}</a>
          <button class="btn solid" type="button" data-copy="{EMAIL}">Copy email address</button>
        </div>
        <div class="acts">
          <a class="btn" href="{e(GMAIL)}" target="_blank" rel="noopener noreferrer" data-event="contact_open_gmail">Write in Gmail ↗</a>
          <a class="btn" href="{e(MAILTO)}" data-event="contact_open_mail_app">Open my mail app</a>
          <a class="btn" href="{LINKEDIN}" target="_blank" rel="noopener noreferrer" data-event="contact_open_linkedin">Message me on LinkedIn ↗</a>
          <a class="btn" href="{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↓</a>
        </div>
        <p class="status" role="status" aria-live="polite" data-copy-status></p>
      </div>
    </section>
  </main>

  {footer()}
  {VIEWER}
  <script type="application/json" id="projects-data">{board_data()}</script>
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
    facts = ''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in p['facts'])
    if p['lead']:
        key, cap = p['lead']
        lead = (f'<figure class="lead-fig">{zoom(key, "(max-width: 860px) 100vw, 1300px", cap, eager=True)}'
                f'<figcaption class="cap">{e(cap or MEDIA[key].get("caption") or "")}</figcaption></figure>')
    else:
        lead = ''
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
        <p class="crumb"><a class="link" href="index.html#work-{p['id']}">← All work</a><span>{i + 1:02d} of {len(PROJECTS):02d}</span><span>{e(p['event'])}</span></p>
        <h1 class="case-title cn" style="view-transition-name:t-{p['id']};--len:{max(len(w) for w in p['name'].split())}">{e(p['name'])}</h1>
        <p class="case-hl">{e(p['hl'])}</p>
        <p class="case-st">{e(p['st'])}</p>
        <div class="acts">{actions}</div>
        <dl class="facts">{facts}</dl>
        {lead}
      </header>

      {''.join(p['sections']())}
      {sec('My role', 'What I did on it.', para(p['my_role']))}
      {sec('Result', 'What happened.', para(p['outcome']))}

      <nav class="case-nav" aria-label="More projects">
        <a href="{prev['slug']}.html" rel="prev" data-event="case_open" data-project="{prev['id']}"><small>← Previous</small><span class="cn">{e(prev['name'])}</span></a>
        <a class="all link" href="index.html#work-{p['id']}">All work</a>
        <a class="next" href="{nxt['slug']}.html" rel="next" data-event="case_open" data-project="{nxt['id']}"><small>Next →</small><span class="cn">{e(nxt['name'])}</span></a>
      </nav>
    </div>
  </main>

  {footer('index.html')}
  {VIEWER}
</body>
</html>
"""


# ------------------------------------------------------------------ small pages

def build_privacy():
    return f"""{head('Privacy & analytics — Mruthulan', 'How analytics works on Mruthulan’s portfolio and how to change your choice.', 'privacy.html')}
{body_open('privacy')}
  {header('index.html')}
  <main id="main" class="wrap">
    <div class="text-page">
      <p class="crumb"><a class="link" href="index.html">← Back to the portfolio</a></p>
      <h1 class="cn">A simple choice about analytics.</h1>
      <p class="lead">This portfolio loads Google Analytics 4 only when you choose “Allow analytics”. It helps me understand which work people read and how they find the site.</p>
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
        <p>The typefaces are served by Google Fonts, so your browser requests them from Google when a page loads. Google’s font service does not set cookies.</p>
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
