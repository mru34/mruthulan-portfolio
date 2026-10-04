"""The résumé PDF on the site, from the text below (one A4 page).

    python design/build_resume.py

Writes assets/Mruthulan-Senthil-Nathan-Resume.pdf and the same file at the old address,
assets/Senthil-Nathan-Mruthulan-Resume.pdf, so links shared before still open it. The phone
number is never published, so it is not in here; add it to your own copy for applications.
Every line matches what the site says; change both together. Needs reportlab.
"""
from pathlib import Path
import shutil

from reportlab.lib.colors import Color
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'Mruthulan-Senthil-Nathan-Resume.pdf'
OLD = ROOT / 'assets' / 'Senthil-Nathan-Mruthulan-Resume.pdf'

NAVY, SLATE, TEAL, RULE = (Color(.082, .133, .208), Color(.282, .345, .420),
                           Color(0, .486, .475), Color(.847, .878, .906))

S = dict(
    name=ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=26, leading=30, textColor=NAVY, alignment=TA_CENTER),
    title=ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=SLATE, alignment=TA_CENTER),
    contact=ParagraphStyle('contact', fontName='Helvetica', fontSize=9, leading=12, textColor=SLATE, alignment=TA_CENTER),
    avail=ParagraphStyle('avail', fontName='Helvetica-Bold', fontSize=9.2, leading=13, textColor=SLATE, alignment=TA_CENTER),
    head=ParagraphStyle('head', fontName='Helvetica-Bold', fontSize=9.4, leading=12, textColor=TEAL),
    body=ParagraphStyle('body', fontName='Helvetica', fontSize=9.3, leading=12.7, textColor=NAVY),
    project=ParagraphStyle('project', fontName='Helvetica-Bold', fontSize=10.6, leading=13, textColor=NAVY),
    what=ParagraphStyle('what', fontName='Helvetica-Bold', fontSize=9.2, leading=11.8, textColor=SLATE),
    result=ParagraphStyle('result', fontName='Helvetica-Bold', fontSize=9.1, leading=12, textColor=TEAL),
    bullet=ParagraphStyle('bullet', fontName='Helvetica', fontSize=9.3, leading=11.9, textColor=NAVY,
                          leftIndent=9, firstLineIndent=-7, spaceBefore=0.5),
)


def link(url, text):
    return f'<a href="{url}" color="#007C79">{text}</a>'


SKILLS = [
    ('Languages', 'TypeScript, JavaScript, Python, SQL, HTML/CSS'),
    ('Frameworks', 'React, Next.js, Node.js / Express, FastAPI'),
    ('Data and Engineering', 'PostgreSQL, MySQL, SQLite, REST APIs, JWT and bcrypt authentication, Git/GitHub, '
                             'automated testing, Render'),
    ('AI Products', 'interfaces and consent flows for AI-assisted products; a Singaporean text-to-speech voice '
                    '(with a teammate)'),
]

# name, what it is, result, bullets
PROJECTS = [
    ('SignalBridge', 'Youth support platform with consent and human handoff',
     'Champion, Dell InnovateDash 2026 | Featured by Singapore Polytechnic',
     ['Built the youth-facing chat, sign-in and dashboard, and the consent step where the young person previews '
      'the note before it is shared.',
      'Wrote the FastAPI routes that connect the chat to the backend, and the Discord integration with tests for '
      'its intake (Next.js, FastAPI, PostgreSQL).',
      'Team of four Year 2 IT students, for a brief from Singapore Children’s Society.']),
    ('Boss Breaker', 'Full-stack wellness game, solo build | ' + link('https://github.com/mru34/bedca2', 'github.com/mru34/bedca2'),
     'Back-end development module coursework',
     ['Built it alone: a nine-page frontend (dashboard, challenges, boss raid, shop, inventory), an Express API '
      'and a nine-table MySQL schema created at start-up.',
      'Points and boss damage are worked out on the server so the browser cannot cheat; bcrypt-hashed passwords '
      'and JWT-protected routes.']),
    ('MEANT', 'On-device AAC assistant that suggests replies; the user picks every word',
     '2nd Runner-Up, polytechnic category (S$3,000), Dell InnovateFest 2026 | Featured in Tamil Murasu',
     ['Designed the UI and interaction flows: boards readable at a glance (a colour and an openly licensed symbol '
      'per kind of word), search across the whole vocabulary when a prediction is wrong, and setup that stays out '
      'of the conversation.',
      'Worked on the Singaporean text-to-speech voice with a teammate, and presented the build.']),
    ('Better Call Bhai', 'Booking site for a Singapore barbershop',
     'Deployed pilot with the shop',
     ['Built the booking flow: customers pick a service, a day and an open slot, then confirm on WhatsApp.',
      'Node/Express API on SQLite with server-side rules (no past dates; each slot booked once) and an admin page '
      'for the shop; deployed on Render.']),
    ('KnowCad', 'Retrieval-based AI assistant for customer service',
     'Champion, Autodesk Singapore Hackathon 2026',
     ['Built and delivered the winning presentation for a mixed team; Autodesk engineers led the code.']),
]

EXPERIENCE = [
    ('Retail Associate, Watsons Singapore', ' | Mar - Apr 2025 - Served customers, processed payments, supported '
     'self-checkout and replenished stock in a fast-paced retail environment.'),
    ('Secretary, Subcommittee, Youth Harmony Chapter', ' - Coordinated communication and follow-through for student '
     'activities and community engagement.'),
    ('Class Chairman and SP ACER, Singapore Polytechnic', ' - Led class communication and supported outreach, '
     'including Open House 2026 and First Steps with SP.'),
]


def section(title):
    return [Spacer(1, 5), Paragraph(title.upper(), S['head']),
            HRFlowable(width='100%', thickness=0.6, color=RULE, spaceBefore=2, spaceAfter=5)]


def build():
    sep = '&nbsp;&nbsp;|&nbsp;&nbsp;'
    story = [
        Paragraph('Mruthulan Senthil Nathan', S['name']), Spacer(1, 2),
        Paragraph('SOFTWARE ENGINEERING | FULL-STACK | AI ENGINEERING INTERN', S['title']), Spacer(1, 3),
        Paragraph(f'Singapore{sep}<a href="mailto:mruthulansenthilnathan@gmail.com">mruthulansenthilnathan@gmail.com</a>',
                  S['contact']),
        Paragraph(sep.join([link('https://mruthulan.com', 'mruthulan.com'),
                            link('https://linkedin.com/in/mruthulan', 'linkedin.com/in/mruthulan'),
                            link('https://github.com/mru34', 'github.com/mru34')]), S['contact']),
        Spacer(1, 5), Paragraph('Available for a year-long internship in 2027/2028', S['avail']),
    ]
    story += section('Education')
    story.append(Paragraph('<b>Diploma in Information Technology</b>, Singapore Polytechnic | '
                           'Apr 2025 - May 2028 (Expected)', S['body']))
    story += section('Technical Skills')
    story += [Paragraph(f'<b>{k}:</b> {v}', S['body']) for k, v in SKILLS]
    story += section('Selected Projects')
    for k, (name, what, result, bullets) in enumerate(PROJECTS):
        block = [Paragraph(name, S['project']), Paragraph(what, S['what']), Paragraph(result, S['result'])]
        block += [Paragraph(f'- {b}', S['bullet']) for b in bullets]
        story += ([Spacer(1, 4)] if k else []) + [KeepTogether(block)]
    story += section('Experience and Leadership')
    story += [Paragraph(f'- <b>{t}</b>{d}', S['bullet']) for t, d in EXPERIENCE]

    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4, leftMargin=57, rightMargin=57, topMargin=30, bottomMargin=30,
        title='Mruthulan Senthil Nathan - Internship Resume 2027 2028', author='Mruthulan Senthil Nathan',
        subject='One-page resume for software engineering, full-stack, and AI engineering internships',
        keywords='software engineering, full-stack, AI engineering, internship, Singapore Polytechnic',
        creator='design/build_resume.py')
    doc.build(story)
    shutil.copyfile(OUT, OLD)
    print(f'wrote {OUT.relative_to(ROOT)} and {OLD.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
