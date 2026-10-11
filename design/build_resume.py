"""The résumé PDF on the site, from the text below (one A4 page).

    python design/build_resume.py

Writes assets/Mruthulan-Senthil-Nathan-Resume.pdf and the same file at the old address,
assets/Senthil-Nathan-Mruthulan-Resume.pdf, so links shared before still open it. The phone
number is never published, so it is not in here.

    python design/build_resume.py --private

writes the copy for applications instead: private/Mruthulan-Senthil-Nathan-Resume.pdf, with
the phone number read from private/phone.txt (one line, e.g. +65 9123 4567). private/ is
ignored by Git, so neither file is committed or deployed.

Every line matches what the site says; change both together. Needs reportlab.
"""
from pathlib import Path
import shutil
import sys

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer
import reportlab

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'Mruthulan-Senthil-Nathan-Resume.pdf'
OLD = ROOT / 'assets' / 'Senthil-Nathan-Mruthulan-Resume.pdf'
PRIVATE = ROOT / 'private'

# Embedded TrueType fonts keep bullets and punctuation extractable by application portals.
# Use Segoe UI on this Windows machine; Vera remains a portable fallback for rebuilding.
WIN_FONTS, RL_FONTS = Path('C:/Windows/Fonts'), Path(reportlab.__file__).parent / 'fonts'
if (WIN_FONTS / 'seguisb.ttf').exists():
    REGULAR, SEMIBOLD, BOLD = (WIN_FONTS / name for name in
                               ('segoeui.ttf', 'seguisb.ttf', 'segoeuib.ttf'))
else:
    REGULAR, SEMIBOLD, BOLD = (RL_FONTS / 'Vera.ttf', RL_FONTS / 'VeraBd.ttf', RL_FONTS / 'VeraBd.ttf')
pdfmetrics.registerFont(TTFont('Sans', str(REGULAR)))
pdfmetrics.registerFont(TTFont('Sans-Semibold', str(SEMIBOLD)))
pdfmetrics.registerFont(TTFont('Sans-Bold', str(BOLD)))
pdfmetrics.registerFontFamily('Sans', normal='Sans', bold='Sans-Bold', italic='Sans', boldItalic='Sans-Bold')

NAVY, SLATE, TEAL, RULE = (HexColor('#14243C'), HexColor('#45566D'),
                           HexColor('#006F6B'), HexColor('#D9E2E8'))

S = dict(
    name=ParagraphStyle('name', fontName='Sans-Bold', fontSize=25.5, leading=29.5, textColor=NAVY, alignment=TA_LEFT),
    title=ParagraphStyle('title', fontName='Sans-Semibold', fontSize=9.8, leading=12.8, textColor=TEAL, alignment=TA_LEFT),
    contact=ParagraphStyle('contact', fontName='Sans', fontSize=9.15, leading=12.2, textColor=SLATE, alignment=TA_LEFT),
    avail=ParagraphStyle('avail', fontName='Sans-Semibold', fontSize=9.1, leading=12.2, textColor=NAVY, alignment=TA_LEFT),
    head=ParagraphStyle('head', fontName='Sans-Bold', fontSize=9.3, leading=12, textColor=TEAL, alignment=TA_LEFT),
    body=ParagraphStyle('body', fontName='Sans', fontSize=9.45, leading=12.6, textColor=NAVY, alignment=TA_LEFT),
    project=ParagraphStyle('project', fontName='Sans-Bold', fontSize=10.9, leading=13.4, textColor=NAVY, alignment=TA_LEFT),
    what=ParagraphStyle('what', fontName='Sans-Semibold', fontSize=9.15, leading=12, textColor=SLATE, alignment=TA_LEFT),
    result=ParagraphStyle('result', fontName='Sans-Semibold', fontSize=9.0, leading=11.9, textColor=TEAL, alignment=TA_LEFT),
    bullet=ParagraphStyle('bullet', fontName='Sans', fontSize=9.4, leading=12.25, textColor=NAVY,
                          leftIndent=10, firstLineIndent=-8, spaceBefore=0.8),
)


def link(url, text):
    return f'<a href="{url}" color="#006F6B">{text}</a>'


SKILLS = [
    ('Languages', 'TypeScript, JavaScript, Python, Java, SQL'),
    ('Web', 'React, Next.js, Node.js, Express, FastAPI, REST APIs, HTML/CSS'),
    ('Databases', 'PostgreSQL, MySQL, SQLite'),
    ('Tools', 'Git, GitHub, pytest, Render'),
]

# name, what it is, result (or None), bullets
PROJECTS = [
    ('SignalBridge', 'Youth support platform with consent and human handoff | Team of four, '
                     'Singapore Children’s Society brief',
     'Champion, Dell InnovateDash 2026 | Featured by Singapore Polytechnic',
     ['Built the youth chat, sign-in, dashboard and the consent screen where the young person reviews the note '
      'before it is shared.',
      'Built FastAPI chat routes and the Discord intake integration, with pytest tests for the intake '
      '(Next.js, FastAPI, PostgreSQL).']),
    ('Boss Breaker', 'Solo full-stack wellness game | Backend module coursework | '
                     + link('https://github.com/mru34/bedca2', 'github.com/mru34/bedca2'),
     None,
     ['Built a nine-page frontend, an Express API and a nine-table MySQL schema for challenges, boss raids, '
      'the shop and inventory.',
      'Calculated points and boss damage on the server so the browser cannot cheat; secured accounts with '
      'bcrypt password hashing and JWT-protected routes.']),
    ('Better Call Bhai', 'Booking site for a Singapore barbershop',
     'Deployed pilot with the shop',
     ['Built the booking flow: customers pick a service, a day and an open slot and confirm on the site, with '
      'their booking details one tap away on WhatsApp.',
      'Built a Node.js/Express API on SQLite with server-side rules (no past dates; each slot booked once) and an '
      'admin page for the shop; deployed on Render.']),
    ('MEANT', 'Assistive communication (AAC) app that suggests replies on-device; the user picks every word',
     '2nd Runner-Up, polytechnic category (S$3,000), Dell InnovateFest 2026 | Featured in Tamil Murasu',
     ['Designed the UI and interaction flows: colour-coded symbol boards, search across the whole vocabulary '
      'when a prediction is wrong, and setup that stays out of the conversation.',
      'Fixed a stuck mic, a silent send and a black camera before the live demo; worked on the '
      'Singaporean text-to-speech voice with a teammate and presented the build.']),
]

AWARDS = [
    ('Champion, Autodesk Singapore Hackathon 2026', ' – KnowCad, a retrieval-based AI assistant for customer '
     'service. Built and delivered the winning presentation; Autodesk engineers led the code.'),
]

EXPERIENCE = [
    ('Retail Associate, Watsons Singapore', ' | Mar – Apr 2025 – Served customers, handled payments and '
     'self-checkout, and replenished stock.'),
    ('Secretary, Subcommittee, Youth Harmony Chapter', ' | Jun 2026 – Present – Coordinated the subcommittee’s '
     'communication and followed up on actions for student activities.'),
    ('Class Chairman, Singapore Polytechnic', ' | 2025 – Led class communication.'),
    ('SP ACER, Singapore Polytechnic', ' | May 2025 – Present – Supported outreach, including Open House 2026 '
     'and First Steps with SP.'),
]

HIGHLIGHTS = [
    [('consent screen',), ('FastAPI chat routes', 'pytest tests')],
    [('nine-page frontend', 'nine-table MySQL schema'), ('server', 'bcrypt password hashing', 'JWT-protected routes')],
    [('booking flow',), ('Node.js/Express API', 'server-side rules')],
    [('colour-coded symbol boards',), ('Fixed a stuck mic, a silent send and a black camera',)],
]


def highlight(text, terms):
    for term in terms:
        if term not in text:
            raise ValueError(f'Highlight is missing from source text: {term}')
        text = text.replace(term, f'<b>{term}</b>', 1)
    return text


def section(title, first=False):
    return [Spacer(1, 8 if first else 9), Paragraph(title.upper(), S['head']),
            HRFlowable(width='100%', thickness=0.55, color=RULE, spaceBefore=2, spaceAfter=5)]


def build(phone=None, out=OUT):
    sep = '&nbsp;&nbsp;|&nbsp;&nbsp;'
    contact = ['Singapore'] + ([phone] if phone else []) + [
        '<a href="mailto:mruthulansenthilnathan@gmail.com">mruthulansenthilnathan@gmail.com</a>']
    story = [
        Paragraph('Mruthulan Senthil Nathan', S['name']), Spacer(1, 1),
        Paragraph('SOFTWARE ENGINEERING INTERN | FULL-STACK DEVELOPMENT', S['title']), Spacer(1, 7),
        Paragraph(sep.join(contact), S['contact']),
        Paragraph(sep.join([link('https://mruthulan.com', 'mruthulan.com'),
                            link('https://linkedin.com/in/mruthulan', 'linkedin.com/in/mruthulan'),
                            link('https://github.com/mru34', 'github.com/mru34')]), S['contact']),
        Spacer(1, 3), Paragraph('Available for a year-long internship in 2027/2028', S['avail']),
        Spacer(1, 6), HRFlowable(width='100%', thickness=1.15, color=TEAL),
    ]
    story += section('Education', first=True)
    story.append(Paragraph('<b>Diploma in Information Technology</b>, Singapore Polytechnic | '
                           'Apr 2025 – May 2028 (Expected)', S['body']))
    story += section('Technical Skills')
    story += [Paragraph(f'<b>{k}:</b> {v}', S['body']) for k, v in SKILLS]
    story += section('Selected Projects')
    for k, (name, what, result, bullets) in enumerate(PROJECTS):
        block = [Paragraph(name, S['project']), Paragraph(what, S['what'])]
        block += [Paragraph(result, S['result'])] if result else []
        block += [Paragraph(f'• {highlight(b, HIGHLIGHTS[k][j])}', S['bullet'])
                  for j, b in enumerate(bullets)]
        story += ([Spacer(1, 7)] if k else []) + [KeepTogether(block)]
    story += section('Awards, Experience and Leadership')
    story += [Paragraph(f'• <b>{t}</b>{d}', S['bullet']) for t, d in AWARDS]
    story.append(Spacer(1, 5))
    story += [Paragraph(f'• <b>{t}</b>{d}', S['bullet']) for t, d in EXPERIENCE]

    doc = SimpleDocTemplate(
        str(out), pagesize=A4, leftMargin=49, rightMargin=49, topMargin=35, bottomMargin=30,
        title='Mruthulan Senthil Nathan - Internship Resume 2027 2028', author='Mruthulan Senthil Nathan',
        subject='One-page resume for software engineering and full-stack internships',
        keywords='software engineering, full-stack, internship, Singapore Polytechnic',
        creator='design/build_resume.py')
    doc.build(story)


if __name__ == '__main__':
    if '--private' in sys.argv:
        phone_file = PRIVATE / 'phone.txt'
        if not phone_file.exists():
            sys.exit(f'put your phone number in {phone_file.relative_to(ROOT)} first')
        out = PRIVATE / OUT.name
        build(phone_file.read_text(encoding='utf-8').strip(), out)
        print(f'wrote {out.relative_to(ROOT)} (with your phone number; not committed)')
    else:
        build()
        shutil.copyfile(OUT, OLD)
        print(f'wrote {OUT.relative_to(ROOT)} and {OLD.relative_to(ROOT)}')
