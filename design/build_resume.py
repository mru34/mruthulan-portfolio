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

from reportlab.lib.colors import Color
from reportlab.lib.enums import TA_CENTER
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

# An embedded TrueType font, not the built-in Helvetica: with Helvetica, PDF readers and
# application portals extract the bullets, dashes and curly apostrophes as junk characters.
# Arial on Windows (Helvetica's metrics, so the page still fits); reportlab's own Vera elsewhere.
WIN_FONTS, RL_FONTS = Path('C:/Windows/Fonts'), Path(reportlab.__file__).parent / 'fonts'
REGULAR, BOLD = ((WIN_FONTS / 'arial.ttf', WIN_FONTS / 'arialbd.ttf') if (WIN_FONTS / 'arialbd.ttf').exists()
                 else (RL_FONTS / 'Vera.ttf', RL_FONTS / 'VeraBd.ttf'))
pdfmetrics.registerFont(TTFont('Sans', str(REGULAR)))
pdfmetrics.registerFont(TTFont('Sans-Bold', str(BOLD)))
pdfmetrics.registerFontFamily('Sans', normal='Sans', bold='Sans-Bold', italic='Sans', boldItalic='Sans-Bold')

NAVY, SLATE, TEAL, RULE = (Color(.082, .133, .208), Color(.282, .345, .420),
                           Color(0, .486, .475), Color(.847, .878, .906))

S = dict(
    name=ParagraphStyle('name', fontName='Sans-Bold', fontSize=26, leading=30, textColor=NAVY, alignment=TA_CENTER),
    title=ParagraphStyle('title', fontName='Sans-Bold', fontSize=10, leading=14, textColor=SLATE, alignment=TA_CENTER),
    contact=ParagraphStyle('contact', fontName='Sans', fontSize=9, leading=12, textColor=SLATE, alignment=TA_CENTER),
    avail=ParagraphStyle('avail', fontName='Sans-Bold', fontSize=9.2, leading=13, textColor=SLATE, alignment=TA_CENTER),
    head=ParagraphStyle('head', fontName='Sans-Bold', fontSize=9.4, leading=12, textColor=TEAL),
    body=ParagraphStyle('body', fontName='Sans', fontSize=9.3, leading=12.7, textColor=NAVY),
    project=ParagraphStyle('project', fontName='Sans-Bold', fontSize=10.6, leading=13, textColor=NAVY),
    what=ParagraphStyle('what', fontName='Sans-Bold', fontSize=9.2, leading=11.8, textColor=SLATE),
    result=ParagraphStyle('result', fontName='Sans-Bold', fontSize=9.1, leading=12, textColor=TEAL),
    bullet=ParagraphStyle('bullet', fontName='Sans', fontSize=9.3, leading=11.9, textColor=NAVY,
                          leftIndent=9, firstLineIndent=-7, spaceBefore=0.5),
)


def link(url, text):
    return f'<a href="{url}" color="#007C79">{text}</a>'


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
     ['Built the booking flow: customers pick a service, a day and an open slot and confirm on the site, then '
      'get a WhatsApp message with their booking time.',
      'Built a Node.js/Express API on SQLite with server-side rules (no past dates; each slot booked once) and an '
      'admin page for the shop; deployed on Render.']),
    ('MEANT', 'Assistive communication (AAC) app that suggests replies on-device; the user picks every word',
     '2nd Runner-Up, polytechnic category (S$3,000), Dell InnovateFest 2026 | Featured in Tamil Murasu',
     ['Designed the UI and interaction flows: colour-coded symbol boards, search across the whole vocabulary '
      'when a prediction is wrong, and setup that stays out of the conversation.',
      'Fixed a stuck mic, a silent send and a black camera so the live demo could not stall; worked on the '
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


def section(title):
    return [Spacer(1, 5), Paragraph(title.upper(), S['head']),
            HRFlowable(width='100%', thickness=0.6, color=RULE, spaceBefore=2, spaceAfter=5)]


def build(phone=None, out=OUT):
    sep = '&nbsp;&nbsp;|&nbsp;&nbsp;'
    contact = ['Singapore'] + ([phone] if phone else []) + [
        '<a href="mailto:mruthulansenthilnathan@gmail.com">mruthulansenthilnathan@gmail.com</a>']
    story = [
        Paragraph('Mruthulan Senthil Nathan', S['name']), Spacer(1, 2),
        Paragraph('SOFTWARE ENGINEERING INTERN | FULL-STACK DEVELOPMENT', S['title']), Spacer(1, 3),
        Paragraph(sep.join(contact), S['contact']),
        Paragraph(sep.join([link('https://mruthulan.com', 'mruthulan.com'),
                            link('https://linkedin.com/in/mruthulan', 'linkedin.com/in/mruthulan'),
                            link('https://github.com/mru34', 'github.com/mru34')]), S['contact']),
        Spacer(1, 5), Paragraph('Available for a year-long internship in 2027/2028', S['avail']),
    ]
    story += section('Education')
    story.append(Paragraph('<b>Diploma in Information Technology</b>, Singapore Polytechnic | '
                           'Apr 2025 – May 2028 (Expected)', S['body']))
    story += section('Technical Skills')
    story += [Paragraph(f'<b>{k}:</b> {v}', S['body']) for k, v in SKILLS]
    story += section('Selected Projects')
    for k, (name, what, result, bullets) in enumerate(PROJECTS):
        block = [Paragraph(name, S['project']), Paragraph(what, S['what'])]
        block += [Paragraph(result, S['result'])] if result else []
        block += [Paragraph(f'• {b}', S['bullet']) for b in bullets]
        story += ([Spacer(1, 4)] if k else []) + [KeepTogether(block)]
    story += section('Awards')
    story += [Paragraph(f'• <b>{t}</b>{d}', S['bullet']) for t, d in AWARDS]
    story += section('Experience and Leadership')
    story += [Paragraph(f'• <b>{t}</b>{d}', S['bullet']) for t, d in EXPERIENCE]

    doc = SimpleDocTemplate(
        str(out), pagesize=A4, leftMargin=57, rightMargin=57, topMargin=30, bottomMargin=30,
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
