#!/usr/bin/env python3
"""Generate the six case pages.

Shared: header, hero with an inline facts column, role block, next-project
footer. Different per project: the story module in the middle.

Nothing in here invents a claim. Where Mruthulan has not supplied wording
(the "Because" line on a decision, Loomy's interview quotes) the markup is
simply not emitted — the page must never show an unfilled slot as content.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
index = (ROOT / 'index.html').read_text(encoding='utf-8')

# reuse the ghost forms from the home page so the two never drift
ghosts = {m.group(1): m.group(0) for m in
          re.finditer(r'<svg data-ghost="(\w+)".*?</svg>', index, re.S)}
assert len(ghosts) == 6, sorted(ghosts)

ACC = {
    'sb': ('#5BE1D8', 'rgba(91,225,216,.30)', 'rgba(91,225,216,.07)'),
    'mt': ('#FFB661', 'rgba(255,182,97,.28)', 'rgba(255,182,97,.07)'),
    'bb': ('#FF8095', 'rgba(255,128,149,.28)', 'rgba(255,128,149,.07)'),
    'kc': ('#AC93FF', 'rgba(172,147,255,.28)', 'rgba(172,147,255,.07)'),
    'bx': ('#A4EC76', 'rgba(164,236,118,.26)', 'rgba(164,236,118,.07)'),
    'lm': ('#84B6FF', 'rgba(132,182,255,.28)', 'rgba(132,182,255,.07)'),
}

RESUME = 'assets/Senthil-Nathan-Mruthulan-Resume.pdf'
SP = ('https://www.sp.edu.sg/courses/schools/soc/happenings/detail/soc-happenings/'
      'information-technology-students-clinch-top-prize-at-sp-innovatedash-2026')
POST_SP = 'https://www.linkedin.com/feed/update/urn:li:activity:7476489524982857730/'
POST_AUTODESK = 'https://www.linkedin.com/feed/update/urn:li:activity:7445494743490453504/'


# ---------------------------------------------------------------- modules

def media(slot, ratio, caption=None, optional=False, fallback='shot'):
    """A media slot. The fallback is the default and is meant to look finished."""
    marks = {
        'shot': '<svg viewBox="0 0 150 100" fill="none" stroke="currentColor" stroke-width="1.2">'
                '<rect x="4" y="4" width="142" height="92" rx="8" stroke-opacity=".9"/>'
                '<path d="M4 24h142" stroke-opacity=".9"/><circle cx="15" cy="14" r="3"/>'
                '<rect x="18" y="40" width="60" height="9" rx="4.5" stroke-opacity=".5"/>'
                '<rect x="18" y="58" width="90" height="9" rx="4.5" stroke-opacity=".35"/></svg>',
        'award': '<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.1">'
                 '<path d="M46 14h28v13a14 14 0 0 1-28 0z"/><path d="M46 17h-9a9 9 0 0 0 9 9"/>'
                 '<path d="M74 17h9a9 9 0 0 1-9 9"/><path d="M60 41v10"/><path d="M50 58h20l3 9H47z"/>'
                 '<circle cx="60" cy="40" r="30" stroke-opacity=".28" stroke-dasharray="3 6"/></svg>',
        'play': '<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.4">'
                '<circle cx="45" cy="45" r="30" stroke-opacity=".9"/><path d="M39 33l20 12-20 12z" stroke-opacity=".9"/>'
                '<circle cx="45" cy="45" r="41" stroke-opacity=".25"/></svg>',
    }
    cls = 'media ' + ratio + (' media-optional' if optional else '')
    cap = (f'<figcaption class="mono media-caption">{caption}</figcaption>' if caption else '')
    return (f'<figure><div class="{cls}" data-media="{slot}" style="color:var(--acc)">'
            f'<div class="media-fallback" aria-hidden="true">{marks[fallback]}</div></div>{cap}</figure>')


def band(kicker, heading, body, note=None, deep=False):
    cls = 'band band-deep' if deep else 'band'
    n = f'<p class="band-note">{note}</p>' if note else ''
    return (f'<section class="{cls}"><div class="shell">'
            f'<p class="mono kicker">{kicker}</p><h2 class="dsp">{heading}</h2>{n}{body}'
            f'</div></section>')


def flow(steps):
    dots = ''.join(
        f'<div class="flow-step"><div class="flow-dot"></div><h3>{k}</h3><p>{t}</p></div>'
        for k, t in steps)
    return ('<div class="flow">'
            '<svg class="flow-line" viewBox="0 0 1280 6" preserveAspectRatio="none" aria-hidden="true">'
            '<path d="M6 3 H1274" stroke="#1E2531" stroke-width="2"/>'
            '<path class="p-flow" d="M6 3 H1274" stroke="currentColor" stroke-width="2" '
            'stroke-dasharray="120 900" stroke-linecap="round" style="color:var(--acc)"/></svg>'
            f'<div class="flow-steps">{dots}</div></div>')


def decisions(items):
    """items: (could_have, i_did, why_or_None). The Because block is emitted
    only when the reasoning actually exists."""
    out = []
    for alt, did, why in items:
        why_html = (f'<p class="decision-k on">Because</p><p class="did">{why}</p>' if why else '')
        out.append(f'<div class="decision"><p class="decision-k">Could have</p><p class="alt">{alt}</p>'
                   f'<p class="decision-k on">I did</p><p class="did">{did}</p>{why_html}</div>')
    return '<div class="decisions">' + ''.join(out) + '</div>'


def compare(before, after):
    b = ''.join(f'<li>{x}</li>' for x in before[1])
    a = ''.join(f'<li>{x}</li>' for x in after[1])
    return (f'<div class="compare"><div><h3>{before[0]}</h3><ul>{b}</ul></div>'
            f'<div><h3>{after[0]}</h3><ul>{a}</ul></div></div>')


def funnel(steps):
    return '<div class="funnel">' + ''.join(
        f'<div class="funnel-step"><h3>{k}</h3><p>{t}</p></div>' for k, t in steps) + '</div>'


def ladder(rungs):
    return '<div class="ladder">' + ''.join(
        f'<div class="ladder-rung"><span class="ladder-num">{n}</span>'
        f'<div><h3>{h}</h3><p>{t}</p></div></div>' for n, h, t in rungs) + '</div>'


def quotes(items):
    """Renders nothing at all when there are no quotes yet."""
    if not items:
        return ''
    body = ''.join(
        f'<figure class="quote"><span class="quote-node" aria-hidden="true"></span>'
        f'<blockquote>{q}</blockquote><figcaption>{who}</figcaption></figure>'
        for q, who in items)
    return (f'<div class="spine-wrap"><div class="spine" aria-hidden="true"></div>'
            f'<div class="quotes">{body}</div></div>')


def testimonial(quote, who):
    """The shop owner's words, in the owner's words. Until Mruthulan supplies
    an approved quote and an attribution this renders nothing at all -- an
    invented or half-filled testimonial is worse than no testimonial."""
    if not quote or not who:
        return ''
    return ('<figure class="quote" style="margin-top:40px">'
            f'<blockquote>{quote}</blockquote><figcaption>{who}</figcaption></figure>')


def deck(slides, pdf, label):
    """An inline slide viewer. Every slide is a render of the real deck."""
    figs = ''.join(
        f'<figure class="deck-slide"><img src="assets/deck/{src}" alt="{alt}"'
        + ('' if i == 0 else ' loading="lazy"')
        + ' width="1655" height="931"></figure>'
        for i, (src, alt) in enumerate(slides))
    arrow = ('<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>')
    return (
        '<div class="deck" id="deck" tabindex="0" role="group" aria-roledescription="carousel" '
        f'aria-label="{label}">'
        f'<div class="deck-stage">{figs}</div>'
        '<p class="deck-live" role="status" aria-live="polite"></p>'
        '<div class="deck-bar">'
        '<div class="deck-nav">'
        f'<button class="deck-btn deck-prev" type="button" aria-label="Previous slide">{arrow}</button>'
        '<button class="deck-btn deck-next" type="button" aria-label="Next slide">'
        f'<span style="transform:rotate(180deg);display:flex">{arrow}</span></button>'
        '</div>'
        f'<p class="deck-count">Slide <b class="deck-now">1</b> / {len(slides)}</p>'
        f'<a class="ghost deck-open" href="{pdf}" target="_blank" rel="noopener">'
        'Open the full deck (PDF) <span aria-hidden="true">↗</span></a>'
        '<p class="deck-hint">Tap a slide to read it full screen. '
        '<span class="deck-hint-pointer">Arrow keys or a swipe move through the deck once it has focus.</span></p>'
        '</div></div>')


def evidence(figures):
    return '<div class="evidence">' + ''.join(figures) + '</div>'


def evidence_feature(lead, rest, pending=None):
    """A lead frame at full width with a supporting row beneath it. Until the
    real files arrive each frame draws its fallback, so the block reads as
    finished either way -- it is simply bigger than a side-by-side pair, which
    is what an interface screenshot or a demo deserves.

    `pending` is the one honest line under a block whose frames are all still
    waiting on files. The media loader removes it as soon as they are filled."""
    note = f'<p class="evidence-pending">{pending}</p>' if pending else ''
    return ('<div class="evidence-feature">'
            + lead.replace('<figure>', '<figure class="evidence-lead">')
            + ('<div class="evidence">' + ''.join(rest) + '</div>' if rest else '')
            + note
            + '</div>')


def tally(count, label):
    """One mark per interview. The count is a verified fact, so the drawing is too."""
    marks = ''.join('<span></span>' for _ in range(count))
    return ('<div class="tally-wrap">'
            f'<div class="stat"><p class="dsp stat-num">{count}+</p>'
            f'<p class="mono stat-label">{label}</p></div>'
            f'<div class="tally" aria-hidden="true">{marks}<span class="tally-plus">+</span></div>'
            '</div>')


# --------------------------------------------------------------- content

LOOMY_QUOTES = []  # Mruthulan's interview notes — nothing here until he supplies them.

# The shop owner's testimonial for Better Call Bhai. Both must be his exact
# approved words and his chosen attribution; until then the block is not built.
OWNER_QUOTE = None
OWNER_ATTRIBUTION = None

# Renders of the real pitch deck, one per page. The alt text describes what is
# on the slide — nothing is claimed here that the slide does not say.
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

PROJECTS = [
    {
        'id': 'sb', 'slug': 'signalbridge', 'name': 'SignalBridge', 'n': 1,
        'kind': 'A systems story',
        'desc': ('SignalBridge case study: a consent-led youth support platform that won SP '
                 'InnovateDash 2026. The handoff, the decisions and my role on the build.'),
        'og': 'A consent-led youth support platform. SP InnovateDash 2026 Champion.',
        'chip': 'SP InnovateDash 2026 — Champion',
        'lead': ('A youth worker picks up a conversation that started somewhere else. '
                 'The context does not come with it.'),
        'actions': [('cta', 'https://signalbridge-web.onrender.com/', 'Live product', '↗', True),
                    ('ghost', POST_SP, 'My LinkedIn post', '↗', True),
                    ('ghost', SP, 'SP’s feature', '↗', True)],
        'facts': [('Recognition', 'SP InnovateDash 2026 Champion'),
                  ('My role', 'Youth-facing experience, API and Discord integrations, automated tests'),
                  ('Stack', 'Next.js · FastAPI · PostgreSQL'),
                  ('Brief', 'Singapore Children’s Society')],
        'bands': [
            band('The handoff', 'Five moments, and the judgement stays with the worker at every one.',
                 flow([
                     ('01 · Message', 'A young person writes in, out of hours, to whoever is on shift.'),
                     ('02 · Signal', 'The system flags risk signals in the thread. It does not act on them.'),
                     ('03 · Consent', 'Nothing is passed on until consent is explicit.'),
                     ('04 · Brief', 'AI drafts the handoff summary. The worker edits, approves or discards it.'),
                     ('05 · Worker', 'The next shift opens with context instead of a cold thread.'),
                 ]), deep=True),
            band('Decisions I made', 'Two calls that were mine to make.',
                 decisions([
                     ('Shipped the demo path only — it was a competition.',
                      'Wrote the automated tests around the handoff logic.', None),
                     ('Asked the young person to install one more app.',
                      'Built the Discord integration, so the conversation stayed where it already was.', None),
                 ])),
            band('Evidence', 'What it actually looks like.',
                 evidence_feature(
                     media('signalbridge-shot-1', 'ratio-1610', 'Youth-facing conversation — the part I built'),
                     [media('signalbridge-shot-2', 'ratio-1610', 'The handoff brief, before the worker edits it'),
                      media('signalbridge-demo', 'ratio-169', 'Message → consent → brief, in one take', fallback='play')],
                     pending='Frames reserved — interface captures and the demo clip are not published yet')),
        ],
        'role': ('I built the youth-facing interfaces, the consent and handoff workflows, the API '
                 'and Discord integrations, and the automated tests that kept the handoff logic '
                 'honest while the team moved fast.'),
        'result': ('Champion at SP InnovateDash 2026 — and the reason we were at Dell InnovateFest, '
                   'where we built MEANT.'),
        'next': 'mt',
    },
    {
        'id': 'mt', 'slug': 'meant', 'name': 'MEANT', 'n': 2,
        'kind': 'A conversation story',
        'desc': ('MEANT case study: an on-device communication assistant for AAC users. Dell '
                 'InnovateFest 2026 second runner-up, S$3,000.'),
        'og': 'An on-device communication assistant that keeps AAC users in control of what they say.',
        'chip': 'Dell InnovateFest 2026 — Second runner-up · S$3,000',
        'lead': 'Conversations do not wait, but AAC users need time to answer.',
        'actions': [('cta', 'index.html#wins', 'See the award', '→', False)],
        'facts': [('Recognition', 'Second runner-up · S$3,000'),
                  ('Social partner', 'SPD Ltd, Singapore'),
                  ('My role', 'UI and UX, the Singaporean TTS voice, and presenting the build'),
                  ('Principle', 'The user always authors')],
        'bands': [
            band('One turn', 'The whole product is three seconds of a conversation.',
                 decisions([
                     ('The room moves on', 'Turn Claim tells the other person an answer is coming, '
                      'so the conversation holds instead of rolling past.', None),
                     ('A reply is offered', 'Local context on a Dell GB10 produces timely suggestions. '
                      'Nothing leaves the device.', None),
                     ('The user authors it', 'They choose a suggestion, type, or use their AAC board. '
                      'Nothing is spoken without a tap.', None),
                 ]), deep=True),
            band('The voice', 'It had to sound like it came from here.',
                 '<p class="band-note" style="max-width:700px">A generic text-to-speech voice makes a '
                 'Singaporean user sound like someone else. Building the Singaporean TTS voice was my '
                 'part of the build, alongside the interface and the demo we presented.</p>'
                 + evidence_feature(
                     media('meant-shot-1', 'ratio-1610', 'The AAC board and suggestion strip'),
                     [media('meant-shot-2', 'ratio-1610', 'Turn Claim, holding the conversation open'),
                      media('meant-demo', 'ratio-169', 'A full turn, spoken', fallback='play')],
                     pending='Frames reserved — interface captures and the demo clip are not published yet')),
            band('If the AI stops', 'It degrades into something that still works.',
                 '<p class="band-note" style="max-width:700px">If the AI layer goes down, the AAC board '
                 'and typing still work. A communication aid that fails closed is not a communication aid.</p>'),
        ],
        'role': ('I worked on the UI and UX, built the Singaporean TTS voice, and presented the build. '
                 'MEANT is a separate project from SignalBridge, with a different team goal.'),
        'result': 'Dell InnovateFest 2026 second runner-up · S$3,000, built with SPD Ltd.',
        'next': 'bb',
    },
    {
        'id': 'bb', 'slug': 'better-call-bhai', 'name': 'Better Call Bhai', 'n': 3,
        'kind': 'A shipping story',
        'desc': ('Better Call Bhai case study: a live booking site for a local barber shop. '
                 'Web design, frontend build and deployment by Mruthulan.'),
        'og': 'A live booking site for a local barber shop.',
        'chip': 'Live client site',
        'lead': 'Booking a haircut should not take three messages and a phone call.',
        'actions': [('cta', 'https://bettercalbhai.onrender.com/', 'Visit the site', '↗', True)],
        'facts': [('Status', 'Live client site'),
                  ('My role', 'Web design, frontend build and deployment'),
                  ('Built with', 'HTML · CSS · JavaScript'),
                  ('Hosting', 'Render')],
        'bands': [
            band('Before and after', 'The whole job was removing a conversation.',
                 compare(('Before — WhatsApp', ['Message the shop to ask what is free.',
                                     'Wait for a reply.',
                                     'Agree a time.',
                                     'Confirm again closer to the day.']),
                         ('After', ['Open the site.',
                                    'Pick an open slot.',
                                    'Confirm.'])), deep=True),
            band('Evidence', 'The booking flow, end to end.',
                 evidence([
                     media('better-call-bhai-shot-1', 'ratio-1610', 'Choosing a service'),
                     media('better-call-bhai-shot-2', 'ratio-1610', 'Picking an open slot'),
                     media('better-call-bhai-shot-3', 'ratio-1610', 'Confirmed, with a WhatsApp receipt'),
                 ])
                 + testimonial(OWNER_QUOTE, OWNER_ATTRIBUTION)),
        ],
        'role': ('I owned the customer journey, the appointment form, the mobile interface and the '
                 'Render deployment, replacing manual WhatsApp appointment coordination.'),
        'result': 'Live, and in use by a real business.',
        'next': 'kc',
    },
    {
        'id': 'kc', 'slug': 'knowcad', 'name': 'KnowCad', 'n': 4,
        'kind': 'A retrieval story',
        'desc': ('KnowCad case study: AI knowledge retrieval that won the Autodesk Singapore '
                 'AI+ML Hackathon in 2026.'),
        'og': 'An AI customer-service co-pilot. Autodesk Singapore AI+ML Hackathon champion.',
        'chip': 'Autodesk Singapore AI+ML Hackathon — Champion',
        'lead': 'Finding the answer took longer than answering the question.',
        'actions': [('cta', POST_AUTODESK, 'My LinkedIn post', '↗', True),
                    ('ghost', 'index.html#wins', 'See the award', '→', False)],
        'facts': [('Recognition', 'Autodesk Singapore AI+ML Hackathon Champion'),
                  ('My role', 'Retrieval, AI workflow and team delivery'),
                  ('Approach', 'Retrieval-based answering'),
                  ('Materials', 'Private — proof is the award and the post')],
        'bands': [
            band('From a pile to an answer', 'Every step throws work away.',
                 funnel([
                     ('Everything', 'Technical knowledge spread across long documents, none of it indexed by the question you actually have.'),
                     ('What is relevant', 'Retrieval narrows the set to the passages that bear on the question.'),
                     ('The answer', 'One answer, with the source behind it and a human still reviewing the decision — not a list of places the answer might be.'),
                 ]), deep=True),
            band('Proof', 'What I can show, and why that is all.',
                 '<p class="band-note" style="max-width:700px">The repository and the Autodesk '
                 'materials are private, so there are no product screenshots on this page and no '
                 'link to the code. What is public is the result, the write-up I posted at the '
                 'time, and the description above.</p>'
                 + evidence([
                     media('win-knowcad-champion', 'ratio-32', fallback='award').replace('<figure>', '<figure class="proof-photo">'),
                 ])),
        ],
        'role': 'I worked on retrieval, the AI workflow, and getting the team’s work delivered in hackathon time.',
        'result': 'First place at the Autodesk Singapore AI+ML Hackathon, 2026.',
        'next': 'bx',
    },
    {
        'id': 'bx', 'slug': 'boss-breaker', 'name': 'Boss Breaker', 'n': 5,
        'kind': 'A mechanics story',
        'desc': ('Boss Breaker case study: a full-stack wellness game with challenges, points '
                 'and boss raids. Built with JavaScript, Node.js and MySQL.'),
        'og': 'A full-stack wellness game with challenges, points and boss raids.',
        'chip': 'Full-stack coursework build',
        'lead': 'Wellness habits are easier to keep when they are a game you are winning.',
        'actions': [('cta', 'https://github.com/mru34/bedca2', 'View the code', '↗', True)],
        'facts': [('Type', 'Full-stack build · BED CA2'),
                  ('My role', 'API, database and game logic'),
                  ('Built with', 'JavaScript · Node.js · MySQL'),
                  ('Source', 'github.com/mru34/bedca2')],
        'bands': [
            band('The loop', 'Four mechanics, one habit.',
                 ladder([
                     ('01', 'Daily challenges', 'A wellness action is the unit of play. Doing it is how you earn anything.'),
                     ('02', 'Points', 'Challenges pay out points. The ledger is server-side, so the game cannot be won in the browser.'),
                     ('03', 'Boss raids', 'Points are spent against a shared target, which is what makes the habit worth keeping up.'),
                     ('04', 'Progression', 'State persists in a relational schema, so a streak survives a refresh.'),
                 ]), deep=True),
            band('Evidence', 'The build.',
                 evidence([
                     media('boss-breaker-shot-1', 'ratio-1610', 'Challenges, each worth points'),
                     media('boss-breaker-shot-2', 'ratio-1610', 'Points, boss HP and inventory in one view'),
                 ])),
        ],
        'role': 'I built the API, the database schema and the game logic that ties challenges, points and raids together.',
        'result': 'A complete full-stack build for the BED CA2 brief, source on GitHub.',
        'next': 'lm',
    },
    {
        'id': 'lm', 'slug': 'loomy', 'name': 'Loomy', 'n': 6,
        'kind': 'A research story',
        'desc': 'Loomy case study: a social thrifting product concept shaped by more than 30 user interviews.',
        'og': 'A social thrifting concept shaped by more than 30 user interviews.',
        'chip': 'Product concept',
        'lead': 'Second-hand fashion is social. Most thrifting apps treat it as a transaction.',
        'actions': [('cta', 'https://loomy-copy-eb9f937f.base44.app/Community', 'Open the prototype', '↗', True),
                    ('ghost', '#deck', 'Read the pitch deck', '↓', False)],
        'facts': [('Type', 'Product concept'),
                  ('My role', 'User research and product design'),
                  ('Research', '30+ user interviews'),
                  ('Output', 'Prototype and pitch deck')],
        'bands': [
            band('Research first', 'Thirty conversations before a single screen.',
                 tally(30, 'people aged 15–25 interviewed, before any product was designed')
                 + quotes(LOOMY_QUOTES),
                 note=('Loomy started with more than 30 interviews with people aged 15 to 25. The '
                       'research decided what the product should be, which is why it is the part of '
                       'this project worth showing.'),
                 deep=True),
            band('The pitch', 'Ten slides, as we pitched them.',
                 deck(LOOMY_SLIDES, 'assets/Loomy-Pitch-Deck.pdf', 'Loomy pitch deck')
                 + '<p class="deck-note">The timeline slide carries <strong>targets and a '
                   'projected first-year revenue figure</strong>. They are projections we pitched, '
                   'not results Loomy achieved — Loomy is a concept, and none of those numbers '
                   'have happened.</p>',
                 note='The deck is the artefact the research produced. It is reproduced here in full, '
                      'and the original PDF is one click away.'),
            band('The prototype', 'A concept, shown as a concept.',
                 '<p class="band-note" style="max-width:700px">Loomy is a prototype and a pitch, not a '
                 'shipped product. The screen below is from the prototype.</p>'
                 + evidence([media('loomy-prototype-1', 'ratio-1610',
                                   'Prototype screen — concept, not a shipped product').replace('<figure>', '<figure class="wide">')])),
        ],
        'role': ('I worked on user research and product design, and built the prototype the team '
                 'pitched. The 30+ interviews behind the concept were the team\'s; the findings '
                 'are what decided the product structure.'),
        'result': 'A prototype and a pitch deck, grounded in more than 30 interviews.',
        'next': 'sb',
    },
]

BY_ID = {p['id']: p for p in PROJECTS}


def render(p):
    acc, glow, tint = ACC[p['id']]
    nxt = BY_ID[p['next']]
    nxt_acc = ACC[nxt['id']][0]

    actions = '\n            '.join(
        f'<a class="{kind}" href="{href}"'
        + (' target="_blank" rel="noopener noreferrer"' if ext else '')
        + f'>{label} <span aria-hidden="true">{arrow}</span></a>'
        for kind, href, label, arrow, ext in p['actions'])

    facts = ''.join(
        f'<div class="case-fact"><span class="case-fact-k">{k}</span><span class="case-fact-v">{v}</span></div>'
        for k, v in p['facts'])

    return f'''<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#07090E">
  <meta name="description" content="{html.escape(p['desc'], quote=True)}">
  <link rel="canonical" href="https://mruthulan.com/{p['slug']}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html.escape(p['name'], quote=True)} — Mruthulan">
  <meta property="og:description" content="{html.escape(p['og'], quote=True)}">
  <meta property="og:url" content="https://mruthulan.com/{p['slug']}.html">
  <meta property="og:image" content="https://mruthulan.com/assets/og-card.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <title>{html.escape(p['name'])} — Mruthulan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/spline-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/styles.css">
  <script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js-on');</script>
  <script src="js/script.js" defer></script>
  <script src="js/analytics.js" defer></script>
</head>
<body style="--acc:{acc};--acc-glow:{glow};--acc-tint:{tint}">
  <a class="skip-link" href="#main">Skip to content</a>

  <div class="field" aria-hidden="true">
    <div class="field-grid"></div>
    <div class="field-aura"></div>
  </div>

  <header class="site-header">
    <div class="shell nav-wrap">
      <a class="brand" href="index.html">Mruthulan</a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu"><span></span><span></span></button>
      <nav class="main-nav" id="main-nav" aria-label="Main">
        <a href="index.html#work">Work</a>
        <a href="index.html#wins">Wins</a>
        <a href="index.html#about">About</a>
        <a href="index.html#contact">Contact</a>
        <a class="nav-resume" href="{RESUME}" target="_blank" rel="noopener">Résumé ↗</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="case-hero" aria-labelledby="case-title">
      <div class="case-hero-glow" aria-hidden="true"></div>
      <div class="shell">
        <div class="case-head" style="padding-top:0">
          <a class="mono case-back" href="index.html#work" style="margin-bottom:0">← All work</a>
          <span class="mono">Case {p['n']:02d} of 06 · {p['kind']}</span>
        </div>
        <div class="case-hero-grid">
          <div class="case-hero-main">
            <span class="chip">{p['chip']}</span>
            <h1 class="dsp case-title" id="case-title">{p['name']}</h1>
            <p class="case-lead">{p['lead']}</p>
            <div class="case-actions">
            {actions}
            </div>
          </div>
          <div class="case-facts">{facts}</div>
        </div>
      </div>
    </section>

    {''.join(p['bands'])}

    <section class="band">
      <div class="shell">
        <div class="case-role">
          <div class="case-role-k"><p class="mono">My role</p></div>
          <div><p>{p['role']}</p></div>
        </div>
      </div>
    </section>

    <section class="band" style="padding-top:0">
      <div class="shell">
        <div class="case-role">
          <div class="case-role-k"><p class="mono">Result</p></div>
          <div><p>{p['result']}</p></div>
        </div>
      </div>
    </section>

    <section class="case-next" style="--next-acc:{nxt_acc}">
      <div class="case-next-glow" aria-hidden="true"></div>
      <div class="shell">
        <div>
          <p class="mono">Next project</p>
          <h2 class="dsp" style="margin-top:14px">{nxt['name']}</h2>
        </div>
        <div class="case-next-actions">
          <a class="cta" href="{nxt['slug']}.html">Open {nxt['name']} <span aria-hidden="true">→</span></a>
          <a class="ghost" href="index.html#work-{p['id']}"><span aria-hidden="true">←</span> Back to all work</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="shell footer-inner">
      <span class="mono">Mruthulan · Made in Singapore</span>
      <nav class="footer-nav" aria-label="Footer">
        <a class="mono" href="index.html">Home</a>
        <a class="mono" href="mailto:mruthulansenthilnathan@gmail.com">Email</a>
        <a class="mono" href="https://www.linkedin.com/in/senthil-nathan-mruthulan" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a class="mono" href="https://github.com/mru34" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a class="mono" href="privacy.html">Privacy</a>
      </nav>
    </div>
  </footer>
</body>
</html>
'''


for p in PROJECTS:
    out = ROOT / f"{p['slug']}.html"
    text = render(p)
    out.write_text(text, encoding='utf-8')
    print(f"wrote {out.name:26} {len(text):6} bytes  ({p['kind']})")
