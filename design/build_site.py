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
        role='Youth-facing chat and consent flow, its API routes, the Discord integration',
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
                 ('Code on GitHub ↗', SIGNALBRIDGE_REPO, None),
                 ('View my Dell InnovateDash post ↗', POST_SP, 'proof_post_click'),
                 ('SP’s feature ↗', SP_FEATURE, None)],
        facts=[('My role', 'The youth-facing chat and consent flow, their API routes, and the Discord integration with its tests'),
               ('Result', 'Dell InnovateDash 2026 — Champion'),
               ('Team', 'Four Year 2 IT students'),
               ('Stack', 'Next.js · FastAPI · PostgreSQL'),
               ('Partner', 'Brief from Singapore Children’s Society')],
        lead=('signalbridge-shot-1', None),
        sections=lambda: [
            sec('The handoff', 'Five moments, and the judgement stays with the worker at every one.', steps([
                ('Message', 'A young person writes to SafeNight after hours, on the web, Telegram or Discord.'),
                ('Signal', 'Fixed rules flag the risk before any AI is involved. A model can improve the wording, never lower the risk.'),
                ('Consent', 'Nothing is passed on until the young person agrees to the note.'),
                ('Brief', 'SignalBridge drafts a structured handoff brief: context, risk, a key quote and a suggested first response.'),
                ('Worker', 'The next morning the worker opens the brief instead of a cold thread, and decides what happens next.')])),
            sec('My part', 'The side a young person sees, and one more way in.', built([
                ('SafeNight chat', 'The youth-facing Next.js screens: sign-in, the chat, the dashboard and past notes, '
                                   'connected to the FastAPI backend through conversation routes I added.'),
                ('Consent before anything moves', 'The handoff preview, where the young person reads the note their '
                                                  'worker will receive and agrees before it is shared.'),
                ('SafeNight on Discord', 'A Discord bot, so SafeNight can be reached from an app young people already '
                                         'use: direct messages, or a thread of their own kept as one conversation.'),
                ('Tests for the Discord intake', 'Automated tests that a thread message reaches SafeNight, and that a '
                                                 'public message without a youth ID still opens a case a worker can see.')],
                'From my commits to the public SignalBridge repository. The backend, AI and deployment were '
                'teammates’ work.')),
            sec('Evidence', 'What it actually looks like.',
                shots(['signalbridge-shot-2', 'signalbridge-shot-3'])
                + note('Captured from the running app with its fictional demo data. No real young person appears anywhere.')
                + note('Singapore Polytechnic’s feature calls the same event SP InnovateDash 2026.')),
        ],
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
                 ('SP School of Computing’s post ↗', POST_SPSOC_DELL, 'proof_post_click'),
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
            sec('My part', 'The screens a person actually uses, and a demo that could not stall.', built([
                ('Boards you can read at a glance', 'Coloured the AAC boards and gave each word a picture by what '
                                                    'kind of word it is, using an openly licensed symbol set.'),
                ('No dead ends', 'Search across the whole AAC vocabulary, so a wrong prediction never leaves '
                                 'the user stuck.'),
                ('Setup that fits the person', 'Setup-wizard steps, including the screen ruler and the microphone '
                                               'permission, so the prompt comes during setup, not mid-conversation.'),
                ('A demo that could not stall', 'Scripted the turn we played on stage, and fixed the gaps that '
                                                'could stop it: a stuck mic button, a silent send, a camera that '
                                                'showed only a black box.')],
                'From my commits to the MEANT repository, which is private, so this is described without code.')),
        ],
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
    ),
    dict(
        id='kc', slug='knowcad', name='KnowCad', type='Hackathon', c='#9B87FF',
        board=('HACKATHON', 'CHAMPION'),
        line='A retrieval-based AI assistant for customer service.',
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
            sec('Proof', 'The result, and the team behind it.', shots(['win-knowcad-team'])),
        ],
    ),
    dict(
        id='bx', slug='boss-breaker', name='Boss Breaker', type='Coursework', c='#F06A43',
        board=('COURSEWORK', 'COMPLETED'),
        line='Wellness challenges, played as a boss fight.',
        role='Solo build: frontend, API, database and game logic',
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
        facts=[('My role', 'Built it alone: frontend, API, database and game logic'),
               ('Result', 'Complete full-stack build for the BED CA2 brief'),
               ('Stack', 'JavaScript · Node.js · MySQL'),
               ('Status', 'Coursework · source on GitHub')],
        lead=('boss-breaker-shot-2', None),
        sections=lambda: [
            sec('The loop', 'Four mechanics, one habit.', steps([
                ('Challenges', 'A wellness action is the unit of play. Doing it is how you earn anything.'),
                ('Points', 'Challenges pay out points. They are added on the server, so the game cannot be won in the browser.'),
                ('Boss raids', 'Points are spent against a shared boss, with a leaderboard of damage dealt.'),
                ('Progression', 'Points, items and the boss’s HP live in MySQL, so progress survives a refresh.')])),
            sec('In the code', 'Rules the browser cannot bend.', built([
                ('Points are earned on the server', 'Completing a challenge adds its points in the API, never in '
                                                    'the page.'),
                ('Damage has rules', 'A hit is the challenge’s points times any active item multiplier, plus a '
                                     'flat bonus. Items bought in the shop apply to the next completion.'),
                ('Accounts done properly', 'Passwords are hashed with bcrypt, and every protected request '
                                           'carries a JWT.'),
                ('Runs on an empty database', 'Its nine tables are created at start-up if they are missing, so '
                                              'the app runs against a fresh MySQL database.')],
                'From the public repository, where every commit is mine.')
                + shots(['boss-breaker-shot-1'])),
        ],
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
  <meta property="og:image" content="{SITE}/assets/og-card.jpg?v=night2">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{SITE}/assets/og-card.jpg?v=night2">
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
    links = [('featured', 'Work'), ('awards', 'Awards'), ('press', 'Press'), ('about', 'About')]
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


def sechead(sid, title):
    """A section title that spells itself out like the board when it arrives."""
    return (f'<header class="sechead"><h2 class="cn" id="{sid}"><span class="sr-only">{e(title)}</span>'
            f'<span aria-hidden="true" data-scramble>{e(title)}</span></h2></header>')


# ------------------------------------------------------------------ featured builds
# Each "What I built" line is backed by the project's repository. Pointing at a line
# (or tapping it) zooms the real screenshot to that part (r = x, y, w, h as fractions of
# the image), or, where there is nothing to show on screen, opens a card with the real
# route, test or table names.
FEATURED = [
    dict(pid='sb', kicker='Team build · Dell InnovateDash 2026 champion',
         does='A youth-support command centre: after-hours messages reach a youth worker with context, and only with the young person’s consent.',
         stack='Next.js · FastAPI · PostgreSQL', frame='browser',
         layers={'chat': 'signalbridge-shot-1', 'consent': 'signalbridge-shot-3'}, first='chat',
         items=[
             ('The youth-facing chat, sign-in and dashboard', dict(t='img', l='chat', r=[0.0, 0.08, 1.0, 0.32])),
             ('The consent step: the young person previews the note before it is shared', dict(t='img', l='consent', r=[0.24, 0.1, 0.52, 0.56])),
             ('FastAPI routes that connect the chat to the backend', dict(t='card', f='services/api/app/routes/conversations.py',
                 lines=['GET   /youth/conversation', 'POST  /conversations/{conversation_id}/messages', 'POST  /handoffs/consent'],
                 note='From my commit d1d654e. The team later reorganised the backend.')),
             ('The Discord integration, with tests for its intake', dict(t='card', f='services/api/tests/test_production_alpha.py',
                 lines=['def test_discord_thread_conversation_routes_to_safenight()', 'def test_discord_public_intake_falls_back_when_youth_id_missing()'],
                 note='Plus the migrations for Discord user and thread IDs.')),
         ],
         links=[('Read the case study →', 'signalbridge.html'), ('Code ↗', SIGNALBRIDGE_REPO), ('Open the app ↗', 'https://signalbridge-web.onrender.com/')]),
    dict(pid='bb', kicker='Solo build · Deployed pilot with a local barbershop',
         does='Appointment booking for a barbershop: pick a service, a day and an open slot, then confirm on WhatsApp.',
         stack='Node.js · Express · SQLite · Render', frame='device',
         layers={'flow': 'better-call-bhai-shot-2', 'live': 'better-call-bhai-shot-1'}, first='flow',
         items=[
             ('The booking site customers use', dict(t='img', l='flow', r=[0.17, 0.08, 0.31, 0.92])),
             ('Server-side rules: no past dates, and each slot can only be booked once', dict(t='img', l='flow', r=[0.55, 0.36, 0.26, 0.5],
                 tag='Taken slots are struck through; a second booking gets “That time slot is already booked.”')),
             ('A Node/Express API on SQLite, with the shop’s admin page', dict(t='card', f='server.js',
                 lines=['GET/POST/PATCH/DELETE  /api/services', 'POST  /api/bookings        GET  /api/bookings', 'PATCH /api/bookings/:id/status', 'GET   /api/slots',
                        'CREATE UNIQUE INDEX idx_bookings_date_time ON bookings(date, time)'],
                 note='From the private repository; every commit is mine.')),
             ('Deployed on Render', dict(t='img', l='live', r=[0.0, 0.0, 1.0, 1.0])),
         ],
         links=[('Read the case study →', 'better-call-bhai.html'), ('Visit the site ↗', 'https://bettercalbhai.onrender.com/')]),
    dict(pid='bx', kicker='Solo build · Full-stack coursework',
         does='A wellness game: complete challenges to earn points, then spend them against a shared boss.',
         stack='Node.js · Express · MySQL', frame='browser',
         layers={'dash': 'boss-breaker-shot-2'}, first='dash',
         items=[
             ('A nine-page frontend: dashboard, challenges, boss raid, shop, inventory', dict(t='img', l='dash', r=[0.08, 0.0, 0.84, 0.07])),
             ('Points and boss damage worked out on the server', dict(t='img', l='dash', r=[0.1, 0.12, 0.8, 0.24],
                 tag='damage = challenge.points × item multiplier + bonus_damage')),
             ('An Express API and a nine-table MySQL schema created at start-up', dict(t='card', f='src/configure/initTables.js',
                 lines=['User · WellnessChallenge · UserCompletion', 'Item · Inventory · UserEffect', 'Boss · BossDamageLog · Review',
                        'CREATE TABLE IF NOT EXISTS …  (runs on an empty database)'],
                 note='From the public repository; every commit is mine.')),
             ('bcrypt-hashed passwords and JWT-protected routes', dict(t='card', f='src/middleware',
                 lines=['bcrypt.hash(req.body.password, saltRounds, callback)', 'Authorization: Bearer <token>'],
                 note='bcryptMiddleware.js and jwtMiddleware.js.')),
         ],
         links=[('Read the case study →', 'boss-breaker.html'), ('Code ↗', 'https://github.com/mru34/bedca2')]),
]


def feature(i, f):
    p = BY_ID[f['pid']]
    layers = ''.join(
        f'<img class="hs-layer" data-layer="{k}" src="assets/media/{MEDIA[v]["src"]}" width="{MEDIA[v]["width"]}" height="{MEDIA[v]["height"]}" '
        f'alt="{e(MEDIA[v]["alt"])}"{" data-on" if k == f["first"] else ""} loading="lazy" decoding="async">' for k, v in f['layers'].items())
    cards = items = ''
    for k, (label, d) in enumerate(f['items']):
        if d['t'] == 'card':
            lines = ''.join(f'<code>{e(x)}</code>' for x in d['lines'])
            cards += (f'<div class="hs-card" data-card="{k}"><p class="hs-file">{e(d["f"])}</p>{lines}'
                      f'<p class="hs-note">{e(d["note"])}</p></div>')
        data = {k2: v for k2, v in d.items() if k2 in ('t', 'l', 'r', 'tag')}
        data['i'] = k
        items += (f'<li><button class="hs-item" type="button" aria-pressed="false" data-hs="{e(json.dumps(data, ensure_ascii=False))}">'
                  f'<span class="hs-dot" aria-hidden="true"></span>{e(label)}</button></li>')
    bar = f'<span class="frame-bar" aria-hidden="true"><i></i><i></i><i></i><span>{e(p["name"])}</span></span>' if f['frame'] == 'browser' else ''
    ls = ''.join(f'<a class="{"btn solid" if k == 0 else "link"}" href="{h}"{ext(h)}'
                 f'{" data-event=" + chr(34) + "case_open" + chr(34) + " data-project=" + chr(34) + p["id"] + chr(34) if k == 0 else ""}>{e(t)}</a>'
                 for k, (t, h) in enumerate(f['links']))
    return f'''<article class="feat" id="feat-{p['id']}" data-feat style="--c:{p['c']}" aria-roledescription="slide" aria-label="{i} of {len(FEATURED)}: {e(p['name'])}">
          <div class="hs-wrap">
            <div class="hs-frame{' is-device' if f['frame'] == 'device' else ''}">{bar}
              <div class="hs-view" aria-hidden="true"><div class="hs-stage">{layers}<span class="hs-spot"></span></div><p class="hs-tag"></p></div>
            </div>
            <p class="hs-hint" aria-hidden="true"><span class="fine">Point at a line to see it in the product</span><span class="touch">Tap a line below to see it in the product</span></p>{cards}
          </div>
          <div class="feat-text">
            <p class="eyebrow">{i:02d} · {e(f['kicker'])}</p>
            <h3 class="cn" style="view-transition-name:t-{p['id']}">{e(p['name'])}</h3>
            <p class="does">{e(f['does'])}</p>
            <p class="k">What I built</p><ul class="built">{items}</ul>
            <p class="stack">{e(f['stack'])}</p>
            <div class="acts">{ls}</div>
          </div>
        </article>'''


# ------------------------------------------------------------------ awards, as a departures board
AWARDS = [
    ('sb', 'win-sp', 'CHAMPION', 'Champion', 'Dell InnovateDash 2026', ['dell', 'sp'], ['win-signalbridge-team', 'win-signalbridge-award'],
     ('My post ↗', POST_SP)),
    ('mt', 'win-dell', '2ND RUNNER-UP', 'Second runner-up', 'Dell InnovateFest 2026 · polytechnic category · S$3,000', ['dell'],
     ['win-meant-handover', 'win-meant-stage', 'win-meant-team'], ('My post ↗', POST_DELL)),
    ('kc', 'win-autodesk', 'CHAMPION', 'Champion', 'Autodesk Singapore Hackathon 2026', ['autodesk'], ['win-knowcad-champion', 'win-knowcad-team'],
     ('My post ↗', POST_AUTODESK)),
]


def dep_row(pid, anchor, board_word, place, event, logos, photos, proof):
    p = BY_ID[pid]
    flaps = ''.join(f'<span class="fl" data-ch="{e(ch)}">{e(ch.strip())}</span>' for ch in board_word)
    org = '<i class="org-sep" aria-hidden="true"></i>'.join(
        f'<img src="assets/logos/{s}" alt="{e(a)}" width="{w}" height="{h}" loading="lazy" decoding="async">' for s, a, w, h in (LOGOS[k] for k in logos))
    m = MEDIA[photos[0]]
    thumb = (f'<a class="dep-thumb zoom" href="assets/media/{m["src"]}" data-zoom="{e(m["caption"])}" data-alt="{e(m["alt"])}" data-group="{anchor}" '
             f'aria-label="View the {len(photos)} photos: {e(event)}">{pic(photos[0], "(max-width: 860px) 104px, 150px", cls="ph")}</a>'
             f'<span class="dep-count">{len(photos)} photos</span>')
    extra = ''.join(f'<a hidden href="assets/media/{MEDIA[k]["src"]}" data-zoom="{e(MEDIA[k]["caption"])}" data-alt="{e(MEDIA[k]["alt"])}" data-group="{anchor}"></a>'
                    for k in photos[1:])
    label, href = proof
    return f'''<article class="dep-row" id="{anchor}">
          <div class="dep-place"><span class="sr-only">{e(place)}</span><span class="flaps-row" aria-hidden="true">{flaps}</span></div>
          <div class="dep-ev"><div class="org">{org}</div><p>{e(event)}</p></div>
          <p class="dep-proj"><a class="link" href="{p['slug']}.html" style="--c:{p['c']}" data-event="case_open" data-project="{pid}"><i class="sw"></i>{e(p['name'])}</a></p>
          <div class="dep-photo">{thumb}{extra}</div>
          <p class="dep-proof"><a class="link has-peek" href="{href}"{ext(href)} data-event="proof_post_click" data-project="{pid}">{e(label)}{peek(href)}</a></p>
        </article>'''


# ------------------------------------------------------------------ the project list and the board
# Loomy is a concept with a pitch deck and no build, so it stays off the homepage; its case
# page is still reachable from the other case pages.
HOME_PROJECTS = [p for p in PROJECTS if p['id'] != 'lm']


def index_row(k, p):
    return (f'<li><a class="idx" id="work-{p["id"]}" href="{p["slug"]}.html" style="--c:{p["c"]}" data-event="case_open" data-project="{p["id"]}">'
            f'<span class="n">{k + 1:02d}</span><span class="nm cn">{e(p["name"])}</span><span class="ty">{e(p["type"])}</span>'
            f'<span class="ln">{e(p["line"])}</span><span class="ar" aria-hidden="true">→</span></a></li>')


def board_data():
    d = {p['id']: dict(name=p['name'], type=p['type'], line=p['line'], c=p['c'], board=list(p['board']),
                       href=f"{p['slug']}.html") for p in HOME_PROJECTS}
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
                 'Mruthulan Senthil Nathan, a Year 2 IT student at Singapore Polytechnic who builds full-stack products. Three featured builds with what I built on each, and three hackathon results.',
                 '', og_title='Mruthulan Senthil Nathan — Developer & Builder',
                 og_desc='Three featured builds with what I built on each, and three hackathon results.', ld=ld)}
{body_open('home')}
  {header('')}

  <main id="main">
    <div class="wrap">
      <section class="hero" aria-labelledby="name">
        <p class="eyebrow"><span class="long">Singapore · Year 2 Information Technology, Singapore Polytechnic</span><span class="short">Singapore · Year 2 IT, Singapore Polytechnic</span></p>
        <h1 class="tiles" id="name" data-name><span class="sr-only">Mruthulan Senthil Nathan</span>{tiles('MRUTHULAN SENTHIL NATHAN')}</h1>
        <div class="hero-row">
          <div>
            <p class="lede">I build full-stack products, from the interface people use to the API and database behind it. Every project below names my part.</p>
            <p class="seeking"><i aria-hidden="true"></i>Looking for a software engineering internship</p>
          </div>
          <div class="acts"><a class="btn solid" href="#featured">See featured work</a><a class="btn" href="{RESUME}" target="_blank" rel="noopener" data-event="resume_click">Résumé ↓</a></div>
        </div>
        <div data-hero-end aria-hidden="true"></div>
      </section>
    </div>

    <section class="sec wrap feat-sec" id="featured" data-sec="featured" aria-labelledby="featured-title">
      {sechead('featured-title', 'Featured builds')}
      <div class="feat-track" data-track aria-roledescription="carousel" aria-label="Featured builds">
        {''.join(feature(i + 1, f) for i, f in enumerate(FEATURED))}
      </div>
      <div class="feat-nav"><button class="gal-arrow" type="button" data-slide="-1" aria-label="Previous build">←</button>
        <span class="feat-dots" aria-hidden="true">{'<i></i>' * len(FEATURED)}</span><span class="gal-count" data-slide-now aria-live="polite">1 / {len(FEATURED)}</span>
        <button class="gal-arrow" type="button" data-slide="1" aria-label="Next build">→</button></div>
    </section>

    <section class="sec wrap" id="awards" data-sec="awards" aria-labelledby="awards-title">
      <span id="results"></span><span id="wins"></span><span id="recognition"></span>
      {sechead('awards-title', 'Awards')}
      <div class="dep">
        <div class="dep-head" aria-hidden="true"><span>Result</span><span>Event</span><span>Project</span><span>Photos</span><span>Proof</span></div>
        {''.join(dep_row(*a) for a in AWARDS)}
      </div>
    </section>

    <section class="sec wrap" id="work" data-sec="featured" aria-labelledby="work-title">
      {sechead('work-title', 'All projects')}
      <div class="idx-grid">
        <ol class="idx-list">{''.join(index_row(k, p) for k, p in enumerate(HOME_PROJECTS))}</ol>
        <section class="board" data-board aria-labelledby="board-title" hidden>
          <div class="board-head"><h3 class="eyebrow" id="board-title">Or let the board choose</h3><button class="btn solid" type="button" data-spin>Spin a project</button></div>
          <div class="fids" aria-hidden="true">
            <div><span class="lab">Project</span><div class="flaps" data-col="name" data-n="16"></div></div>
            <div><span class="lab">Type</span><div class="flaps" data-col="type" data-n="16"></div></div>
            <div><span class="lab">Status</span><div class="flaps status" data-col="status" data-n="16"></div></div>
          </div>
          <div class="result" data-result></div>
          <p class="sr-only" role="status" aria-live="polite" data-spin-live></p>
        </section>
      </div>
    </section>

    <section class="sec wrap" id="press" data-sec="press" aria-labelledby="press-title">
      <div class="press">
        <div class="text arrive">
          <p class="eyebrow">Press · Tamil Murasu</p>
          <h2 class="cn" id="press-title">Our work made the news.</h2>
          <p>Tamil Murasu featured MEANT alongside student projects using artificial intelligence for social impact.</p>
          <div class="acts"><a class="btn" href="{PRESS_ARTICLE}" hreflang="ta" target="_blank" rel="noopener noreferrer" data-event="press_article_click" data-project="mt">Read in Tamil ↗</a></div>
        </div>
        <figure class="arrive">
          <a class="paper-link" href="{PRESS_FULL}" data-zoom="{PRESS_TITLE}" data-alt="{e(PRESS_ALT)}" data-view-event="press_viewer_open" data-project="mt" aria-label="View the Tamil Murasu page full size">
            <div class="ph"><img src="assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp" srcset="assets/media/press/tamil-murasu-2026-09-28-p8-720.webp 720w, assets/media/press/tamil-murasu-2026-09-28-p8-1200.webp 1200w" sizes="(max-width: 860px) 100vw, 56vw" width="1776" height="1416" loading="lazy" decoding="async" alt="{e(PRESS_ALT)}"></div>
          </a>
          <figcaption>Tamil Murasu, 28 September 2026, page 8. © SPH Media. <span class="hint-fine">Click</span><span class="hint-touch">Tap</span> the page to open it full size.</figcaption>
        </figure>
      </div>
    </section>

    <section class="sec wrap" id="about" data-sec="about" aria-labelledby="about-title">
      {sechead('about-title', 'About')}
      <div class="about">
        {pic('about-portrait', '(max-width: 860px) 100vw, 380px', cls='ph portrait arrive')}
        <div class="text arrive">
          <p class="lead">I care about the last mile: whether someone can actually use the result, whether it survives failure, and whether I can explain the decisions clearly.</p>
          {about_personal}
        </div>
      </div>
      <div class="about-cards" id="credentials">
        <article class="acard arrive">
          <h3 class="eyebrow">Study</h3>
          <b>Diploma in Information Technology</b>
          <span class="sub">Singapore Polytechnic · Apr 2025 – May 2028 (expected)</span>
        </article>
        <article class="acard arrive">
          <h3 class="eyebrow">Leadership</h3>
          <ul>
            <li><b>Secretary, subcommittee</b><span class="sub">Youth Harmony Chapter, Singapore Polytechnic</span><p>Coordination, communication and follow-through for student-led activities and community engagement.</p></li>
            <li><b>Class Chairman and SP ACER</b><span class="sub">Singapore Polytechnic</span><p>Class communication and student outreach, including Open House 2026 and First Steps with SP.</p></li>
          </ul>
        </article>
      </div>
    </section>

    <section class="talk" id="contact" data-sec="contact" aria-labelledby="contact-title">
      <div class="wrap talk-in">
        <h2 class="cn" id="contact-title"><span class="sr-only">Let’s talk.</span><span aria-hidden="true" data-scramble>Let’s talk.</span></h2>
        <div class="mail-row">
          <a class="mail-big" href="{e(MAILTO)}" data-mail data-event="contact_open_mail_app">{EMAIL}</a>
          <button class="btn solid" type="button" data-copy="{EMAIL}">Copy email address</button>
        </div>
        <div class="acts">
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
    # back to the project's row in the list (Loomy is not on the homepage, so back to the list)
    back = f"index.html#work-{p['id']}" if p in HOME_PROJECTS else 'index.html#work'
    ld = {'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': p['name'],
          'description': p['og'], 'url': f"{SITE}/{p['slug']}.html",
          'author': {'@type': 'Person', 'name': 'Mruthulan Senthil Nathan', 'url': f'{SITE}/'}}
    return f"""{head(f"{p['name']} — Mruthulan", p['desc'], f"{p['slug']}.html",
                 og_title=f"{p['name']} — Mruthulan", og_desc=p['og'], ld=ld)}
{body_open('case', f"--c:{p['c']}")}
  <div class="progress" data-progress aria-hidden="true"></div>
  {header('index.html', current='featured')}

  <main id="main">
    <div class="wrap">
      <header class="case-top">
        <p class="crumb"><a class="link" href="{back}">← All work</a><span>{i + 1:02d} of {len(PROJECTS):02d}</span><span>{e(p['event'])}</span></p>
        <h1 class="case-title cn" style="view-transition-name:t-{p['id']};--len:{max(len(w) for w in p['name'].split())}">{e(p['name'])}</h1>
        <p class="case-hl">{e(p['hl'])}</p>
        <p class="case-st">{e(p['st'])}</p>
        <div class="acts">{actions}</div>
        <dl class="facts">{facts}</dl>
        {lead}
      </header>

      {''.join(p['sections']())}

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
