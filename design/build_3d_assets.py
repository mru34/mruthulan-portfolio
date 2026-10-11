"""Textures for the 3D homepage, made from the real captures.

    python design/build_3d_assets.py

Reads the raw captures in ../portfolio-tools/card-shots/raw (outside this repository; raw files are never
published) and the site's own media, and writes WebP files to assets/3d/. Crops are cut from the real screens
with rounded corners, so each piece is exactly what the app showed. Nothing is drawn or invented here (except the crisp parts drawn from the apps' real words: Better Call
Bhai's times, MEANT's reply cards, Boss Breaker's challenge cards, and KnowCad's example console and pages): the
one composite (sb-consent-given) is the app's own "Worker notified" pill, centred on a plate of the consent
card's own background colour, the same size as the card.

SignalBridge's control room (checked 11 Oct 2026): the extra screens show only the app's fictional people (Mira
Tan, Jay Lim, Dan Ng, Afiq Rahman, Marcus Lee), the worker "Mru" and @signalbridge.test addresses. Left out:
d-worker-cockpit and d-cockpit (a Telegram chat ID and a Discord webhook field), d-worker-youths (a 404 page),
and d-youth-preview on the wall (the youth app's white cards glare in a dark room; the handoffs list stands there
instead).
The supervisor view is cropped above its "Signed in as" corner, which names a teammate; every screen is cropped
above the Next.js dev badge in its bottom-left corner.
"""
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT.parent / 'portfolio-tools' / 'card-shots' / 'raw'
OUT = ROOT / 'assets' / '3d'

# boxes in pixels of the 1170 x 2532 phone captures (left, top, right, bottom)
MESSAGE_BOX = (285, 240, 1122, 510)   # the youth's first message, m-consent.png
ASK_BOX = (48, 2013, 1122, 2226)      # "Let your worker see a brief note from tonight?", m-consent.png
PILL_BOX = (672, 48, 1017, 126)       # "Worker notified", m-youth-chat.png
# the control room's screens, in pixels of the 2880 x 1800 desktop and 1170 x 2532 phone captures
DESK_CROP = (0, 0, 2880, 1650)        # above the dev badge
CHAT_CROP = (0, 0, 2880, 1600)        # d-youth-chat: above the message box, which the badge overlaps
SUPERVISOR_CROP = (0, 0, 2880, 1500)  # d-supervisor: above "Signed in as", which names a teammate
PHONE_CROP = (0, 0, 1170, 2380)       # m-youth-preview: above the dev badge
# Boss Breaker, in pixels of the 2880 x 1800 captures d-boss.png and d-challenges.png (HP 1,840 / 5,000, the
# same as the phone captures). The leaderboard names and the challenges' creators are the app's seeded players.
DRAGON_BOX = (176, 406, 360, 650)     # the Stress Dragon's portrait card
LEADER_BOX = (1460, 350, 2731, 868)   # the leaderboard: mruthulan 1,240 · priya.r 760 · aisha.k 560 · jun_wei 360 · ethan.t 240
DISPLAY_CROP = (100, 0, 2780, 1120)   # the Boss Raid page's content (header, raid card, leaderboard), without the empty lower half
# Better Call Bhai, in pixels of the 1170 x 2532 phone capture m3-slots.png: the day's time slots, 3 across and
# 7 down (20 in all, 10:30 12:00 12:30 14:30 17:00 taken, 15:00 chosen). The phone field in these captures is
# the "+65 XXXX XXXX" placeholder; no number is published.
SLOT_GRID = (116, 784, 1054, 1850)
# MEANT, in pixels of the 1600 x 1000 captures assets/media/meant-shot-1 (the tablet with the four replies) and
# meant-shot-3 (the word board, coloured by word type): the four reply tiles, and the board's top three rows
REPLY_BOXES = [(56, 332, 522, 548), (534, 332, 1000, 548), (56, 558, 522, 774), (534, 558, 1000, 774)]
REPLIES = ['Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice']
WORD_GRID = (76, 230, 1524, 676)      # 8 x 3 tiles: each 172 x 144, 182.1 x 150.5 apart, starting 2 px in
# The partner display could not be captured showing each reply: the receiver needs the whole MEANT core
# running. So each reply is written onto the real "Give me a moment" capture (meant-shot-2), in the display's
# own typeface (Inter 800, from the MEANT repository), colour and size, centred where that sentence is.
MEANT_FONT = ROOT.parent / 'meant-DellInnovateFest' / 'meant' / 'web' / 'src' / 'assets' / 'fonts' / 'inter-latin-800-normal.woff2'
FONT_CACHE = ROOT.parent / 'portfolio-tools' / 'fonts-src' / 'inter-800.ttf'
# Better Call Bhai's day, as in m3-slots.png: 20 slots, 3 across; taken ones struck through, 15:00 chosen
SLOT_TIMES = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
              '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
SLOT_TAKEN = (1, 4, 5, 9, 14)         # 10:30 12:00 12:30 14:30 17:00
SLOT_CHOSEN = 10                      # 15:00
SLOT_CELL = (320, 128)                # one pill's face in the atlas: twice its size on screen at the payoff
# fonts for drawn text: the site's own (variable) faces, and MEANT's Inter
FONT_FILES = {
    'geist': ROOT / 'assets' / 'fonts' / 'geist-latin.woff2',
    'mono': ROOT / 'assets' / 'fonts' / 'jetbrains-mono-400-500-latin.woff2',
    'knowcad': ROOT / 'assets' / 'fonts' / 'name-knowcad.woff2',
    'inter-600': MEANT_FONT.with_name('inter-latin-600-normal.woff2'),
}
# Awards: each event's real photos, printed on the table (the keys of data/media.json)
AWARD_PHOTOS = ['win-signalbridge-team', 'win-signalbridge-award', 'win-meant-handover', 'win-meant-stage',
                'win-meant-team', 'win-knowcad-champion', 'win-knowcad-team']
AWARD_WIDTH = 900                     # the photos at most this wide (1.5x their largest size on screen at 1920 px,
                                      # and a GPU upload short enough not to stall a frame), lightly sharpened
# Boss Breaker's six challenges, #1 to #6, as d-challenges.png shows them: the words, points, creator; each card
# gets its own icon and an accent from the game's orange family
CHALLENGES = [
    ('Drink 2L of water before 6pm', 15, 'mruthulan', 'drop', (240, 106, 67)),
    ('Walk 8,000 steps', 25, 'aisha.k', 'steps', (245, 158, 11)),
    ('Screen off 30 minutes before bed', 20, 'mruthulan', 'moon', (251, 113, 133)),
    ('Ten minutes of stretching after class', 10, 'jun_wei', 'stretch', (249, 115, 22)),
    ('Cook one meal instead of ordering in', 30, 'priya.r', 'pan', (234, 179, 8)),
    ('Eight hours of sleep, two nights running', 35, 'mruthulan', 'bed', (226, 93, 78)),
]
# KnowCad, drawn (the product is private): a support rep's console and three manual pages, an example in KnowCad's
# colours. No product is named and no real manual is quoted.
KC_TICKET = 'We moved to new laptops and the app says our licence is in use on another device. How do we fix it?'
KC_QUERY = 'Licence “in use on another device” after moving to new laptops'
KC_ANSWER = ('Sign out on the old laptop to free the licence. If that laptop is gone, an admin can release it '
             'from the account portal. Then sign in on the new one.')
KC_SOURCES = ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7']
KC_PASSAGES = ['Signing out of the app on a device frees its licence for use on another device.',
               'An admin can release a licence from a device in the account portal when that device is no longer available.',
               '“In use on another device”: sign out on the old device, then sign in on the new one.']
KC_TITLES = ['Installation Guide', 'Licensing', 'Admin Handbook', 'Release Notes', 'Troubleshooting']
KC_COVERS = [(42, 35, 70), (51, 42, 87), (61, 50, 102), (40, 32, 64), (70, 58, 117)]
KC_INK = {'bg': (18, 17, 26), 'side': (23, 21, 33), 'panel': (28, 26, 40), 'line': (52, 48, 72),
          'ink': (236, 233, 248), 'soft': (154, 148, 180), 'violet': (155, 135, 255), 'deep': (61, 50, 102)}


def fit(src, size):
    with Image.open(src) as im:
        im = im.convert('RGB')
        im.thumbnail(size, Image.LANCZOS)
        return im.copy()


def fit_crop(src, box, size):
    with Image.open(src) as im:
        im = im.convert('RGB').crop(box)
        im.thumbnail(size, Image.LANCZOS)
        return im.copy()


def sized(im, width):
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def crop(src, box, radius):
    with Image.open(src) as im:
        piece = im.convert('RGBA').crop(box)
    mask = Image.new('L', piece.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, piece.width - 1, piece.height - 1), radius=radius, fill=255)
    piece.putalpha(mask)
    return piece


def plate(piece, like, scale=1.6):
    """`piece`, scaled, centred on a plate the size of `like`, in `like`'s own background colour."""
    colour = like.getpixel((20, like.height // 2))
    out = Image.new('RGBA', like.size, colour)
    p = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.LANCZOS)
    out.alpha_composite(p, ((like.width - p.width) // 2, (like.height - p.height) // 2))
    out.putalpha(like.getchannel('A'))
    return out


def inter():
    """Inter 800 as a TrueType file Pillow can draw with (converted once from MEANT's own woff2)."""
    if not FONT_CACHE.exists():
        from fontTools.ttLib import TTFont
        FONT_CACHE.parent.mkdir(parents=True, exist_ok=True)
        f = TTFont(MEANT_FONT)
        f.flavor = None
        f.save(FONT_CACHE)
    return FONT_CACHE


def font(name, size, weight=None):
    """One of FONT_FILES at `size` px (and `weight`, for the variable ones), converted once to TrueType."""
    from PIL import ImageFont
    src = FONT_FILES[name]
    ttf = FONT_CACHE.parent / f'{src.stem}.ttf'
    if not ttf.exists():
        from fontTools.ttLib import TTFont
        ttf.parent.mkdir(parents=True, exist_ok=True)
        f = TTFont(src)
        f.flavor = None
        f.save(ttf)
    ft = ImageFont.truetype(str(ttf), size)
    if weight is not None:
        ft.set_variation_by_axes([weight])
    return ft


def wrap(text, ft, width):
    """`text` broken into lines no wider than `width` px in `ft`."""
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if ft.getlength(trial) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def slot_atlas():
    """The day's times, crisp, in a 4 x 5 atlas for the 3D pills: white on the free ones, dimmed and struck
    through on the taken ones, dark on the chosen yellow 15:00."""
    W, H = SLOT_CELL
    im = Image.new('RGBA', (4 * W, 5 * H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ft = font('geist', 64, 600)
    for i, t in enumerate(SLOT_TIMES):
        cx, cy = (i % 4) * W + W / 2, (i // 4) * H + H / 2
        ink = (21, 21, 21, 255) if i == SLOT_CHOSEN else (255, 255, 255, 110) if i in SLOT_TAKEN else (255, 255, 255, 255)
        d.text((cx, cy), t, font=ft, fill=ink, anchor='mm')
        if i in SLOT_TAKEN:
            half = ft.getlength(t) / 2 + 8
            d.line((cx - half, cy + 2, cx + half, cy + 2), fill=(255, 255, 255, 140), width=5)
    return im


def partner_reply(text):
    """The "Give me a moment" capture with its sentence replaced by `text`, in the same font, colour and size."""
    from PIL import ImageFont
    im = Image.open(ROOT / 'assets' / 'media' / 'meant-shot-2.webp').convert('RGB')
    W, H = im.size
    px = im.load()
    bright = [(x, y) for y in range(int(H * 0.15), int(H * 0.85)) for x in range(0, W, 2)
              if px[x, y][1] > 170 and px[x, y][0] < 160]
    xs, ys = [p[0] for p in bright], [p[1] for p in bright]
    box = (min(xs), min(ys), max(xs), max(ys))          # the sentence as drawn
    bg = px[box[0] - 30, (box[1] + box[3]) // 2]
    ink = max((px[x, y] for x, y in bright), key=lambda c: c[1])
    draw = ImageDraw.Draw(im)
    draw.rectangle((box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12), fill=bg)
    def size_for(sample, height):
        lo, hi = 10, 400
        while lo < hi:
            mid = (lo + hi + 1) // 2
            b = ImageFont.truetype(str(inter()), mid).getbbox(sample)
            lo, hi = (mid, hi) if b[3] - b[1] <= height else (lo, mid - 1)
        return lo
    size = size_for('Give me a moment', box[3] - box[1])
    font = ImageFont.truetype(str(inter()), size)
    while font.getlength(text) > W * 0.86:                 # the display fits a long sentence to its width
        size -= 2
        font = ImageFont.truetype(str(inter()), size)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    draw.text((cx, cy), text, font=font, fill=ink, anchor='mm')
    return im


def sharpen(im):
    """A light unsharp mask: textures are drawn smaller than they are, and minifying softens edges."""
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


def reply_card(text):
    """One of the tablet's four replies as a clean card: white (the 3D card rounds its corners), a small dish icon,
    the reply in MEANT's own Inter 600."""
    W, H = 640, 296
    im = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(im)
    ink = (74, 79, 87)
    d.chord((284, 52, 356, 108), 0, 180, outline=ink, width=6)          # the bowl
    d.line((276, 80, 364, 80), fill=ink, width=6)                        # its rim
    for x in (306, 320, 334):                                            # steam
        d.line((x, 68, x - 5, 58, x, 48, x - 5, 38), fill=ink, width=4, joint='curve')
    size = 72                                                            # one size for all four: the longest fits
    while font('inter-600', size).getlength(max(REPLIES, key=len)) > W - 56:
        size -= 2
    d.text((W / 2, 190), text, font=font('inter-600', size), fill=(31, 35, 40), anchor='mm')
    return im


def challenge_icon(d, kind, cx, cy, s, ink, bg):
    """A plain line icon, s px across, centred on (cx, cy)."""
    w = max(6, s // 14)
    if kind == 'drop':
        import math
        pts = [(cx, cy - s * 0.5)] + [(cx + s * 0.3 * math.cos(a), cy + s * 0.15 + s * 0.3 * math.sin(a))
                                      for a in [math.radians(-30 + k * 8) for k in range(31)]]
        d.line(pts + [pts[0]], fill=ink, width=w, joint='curve')
    elif kind == 'steps':
        d.ellipse((cx - s * 0.42, cy - s * 0.05, cx - s * 0.1, cy + s * 0.5), outline=ink, width=w)
        d.ellipse((cx + s * 0.1, cy - s * 0.5, cx + s * 0.42, cy + s * 0.05), outline=ink, width=w)
    elif kind == 'moon':
        r = s * 0.4
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ink)
        d.ellipse((cx - r * 0.45, cy - r * 1.25, cx + r * 1.25, cy + r * 0.45), fill=bg)
    elif kind == 'stretch':
        d.ellipse((cx - s * 0.09, cy - s * 0.48, cx + s * 0.09, cy - s * 0.3), outline=ink, width=w)
        d.line((cx, cy - s * 0.28, cx, cy + s * 0.12), fill=ink, width=w)
        d.line((cx - s * 0.3, cy - s * 0.5, cx, cy - s * 0.2, cx + s * 0.3, cy - s * 0.5), fill=ink, width=w, joint='curve')
        d.line((cx - s * 0.22, cy + s * 0.5, cx, cy + s * 0.12, cx + s * 0.22, cy + s * 0.5), fill=ink, width=w, joint='curve')
    elif kind == 'pan':
        d.ellipse((cx - s * 0.45, cy - s * 0.28, cx + s * 0.11, cy + s * 0.28), outline=ink, width=w)
        d.line((cx + s * 0.11, cy, cx + s * 0.5, cy), fill=ink, width=w + 2)
    elif kind == 'bed':
        d.line((cx - s * 0.45, cy - s * 0.35, cx - s * 0.45, cy + s * 0.35), fill=ink, width=w)
        d.rectangle((cx - s * 0.45, cy, cx + s * 0.45, cy + s * 0.18), outline=ink, width=w)
        d.rounded_rectangle((cx - s * 0.36, cy - s * 0.16, cx - s * 0.12, cy), radius=s * 0.05, outline=ink, width=w)
        d.line((cx + s * 0.45, cy + s * 0.18, cx + s * 0.45, cy + s * 0.35), fill=ink, width=w)


def challenge_card(n, text, pts, by, kind, accent):
    """Challenge #n as a game card: an accent band with its icon, the challenge, its points and who set it."""
    W, H = 512, 720
    im = Image.new('RGB', (W, H), (18, 22, 34))
    d = ImageDraw.Draw(im)
    for y in range(H):                                                   # a dark navy gradient, like the app
        k = y / H
        d.line((0, y, W, y), fill=(round(26 - 8 * k), round(31 - 9 * k), round(46 - 12 * k)))
    band = tuple(round(c * 0.82) for c in accent)
    d.rectangle((0, 0, W, 250), fill=band)
    challenge_icon(d, kind, W / 2, 125, 150, (255, 255, 255), band)
    d.text((40, 290), f'Challenge #{n}', font=font('geist', 30, 600), fill=(143, 152, 171))
    ft = font('geist', 44, 700)
    for k, line in enumerate(wrap(text, ft, W - 80)[:4]):
        d.text((40, 336 + k * 54), line, font=ft, fill=(255, 255, 255))
    chip = f'+{pts} pts'
    cw = font('geist', 30, 700).getlength(chip) + 36
    d.rounded_rectangle((40, 624, 40 + cw, 674), radius=25, fill=tuple(round(c * 0.25 + 20) for c in accent))
    d.text((40 + cw / 2, 649), chip, font=font('geist', 30, 700), fill=accent, anchor='mm')
    d.text((W - 40, 649), f'by {by}', font=font('geist', 26, 500), fill=(143, 152, 171), anchor='rm')
    return im


def kc_console(state):
    """The rep's console: 0 no ticket, 1 the customer's ticket, 2 the rep's question and the search, 3 KnowCad's
    suggested answer with its three sources."""
    C = KC_INK
    W, H = 1600, 1000
    im = Image.new('RGB', (W, H), C['bg'])
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 300, H), fill=C['side'])
    d.text((40, 52), 'KnowCad', font=font('knowcad', 34), fill=C['violet'])
    for k, item in enumerate(['Tickets', 'Knowledge', 'Settings']):
        y = 150 + k * 64
        if k == 0:
            d.rounded_rectangle((24, y - 10, 276, y + 42), radius=12, fill=C['deep'])
        d.text((48, y), item, font=font('geist', 26, 500), fill=C['ink'] if k == 0 else C['soft'])
    d.text((340, 52), 'Ticket #4821 · Licence', font=font('geist', 30, 600), fill=C['ink'])
    d.rounded_rectangle((340, 120, 900, 940), radius=22, fill=C['panel'])
    if state >= 1:
        d.text((372, 150), 'Customer', font=font('geist', 22, 600), fill=C['soft'])
        ft = font('geist', 30, 500)
        for k, line in enumerate(wrap(KC_TICKET, ft, 490)):
            d.text((372, 192 + k * 42), line, font=ft, fill=C['ink'])
    else:
        d.text((620, 520), 'No new tickets', font=font('geist', 26, 500), fill=C['soft'], anchor='mm')
    d.rounded_rectangle((930, 120, 1560, 940), radius=22, fill=C['panel'])
    d.text((962, 150), 'Ask KnowCad', font=font('geist', 22, 600), fill=C['violet'])
    if state >= 2:
        ft = font('geist', 26, 500)
        lines = wrap(KC_QUERY, ft, 500)
        h = 28 + 36 * len(lines)
        d.rounded_rectangle((990, 196, 1528, 196 + h), radius=18, fill=C['deep'])
        for k, line in enumerate(lines):
            d.text((1010, 210 + k * 36), line, font=ft, fill=C['ink'])
        top = 196 + h + 30
        if state == 2:
            d.text((962, top), 'Searching 5 manuals…', font=font('geist', 24, 500), fill=C['soft'])
            for k in range(3):
                d.rounded_rectangle((962, top + 50 + k * 40, 1400 - k * 90, top + 70 + k * 40), radius=10, fill=C['line'])
        else:
            d.text((962, top), 'Suggested answer', font=font('geist', 22, 600), fill=C['violet'])
            ft = font('geist', 27, 500)
            y = top + 40
            for line in wrap(KC_ANSWER, ft, 560):
                d.text((962, y), line, font=ft, fill=C['ink'])
                y += 38
            y += 18
            x, mono = 962, font('mono', 19, 500)
            for s in KC_SOURCES:
                w = mono.getlength(s) + 28
                if x + w > 1530:
                    x, y = 962, y + 48
                d.rounded_rectangle((x, y, x + w, y + 38), radius=19, outline=C['violet'], width=2)
                d.text((x + 14, y + 19), s, font=mono, fill=C['violet'], anchor='lm')
                x += w + 12
            d.rounded_rectangle((962, 860, 1200, 912), radius=14, fill=C['violet'])
            d.text((1081, 886), 'Send to customer', font=font('geist', 22, 600), fill=(20, 16, 34), anchor='mm')
    return im


def kc_spines():
    """The five manuals' spines, side by side (160 x 800 each), titled top to bottom."""
    W, H = 160, 800
    im = Image.new('RGB', (W * 5, H), (0, 0, 0))
    for i, (title, cover) in enumerate(zip(KC_TITLES, KC_COVERS)):
        sp = Image.new('RGB', (H, W), cover)
        d = ImageDraw.Draw(sp)
        light = tuple(min(255, c + 30) for c in cover)
        d.rectangle((0, 0, 44, W), fill=light)
        d.rectangle((H - 60, 0, H, W), fill=light)
        d.text((H / 2 - 8, W / 2), title, font=font('geist', 46, 700), fill=(217, 210, 255), anchor='mm')
        im.paste(sp.rotate(-90, expand=True), (i * W, 0))
    return im


def kc_source(i):
    """Source page i: the manual's name and page, lines of text as grey bars, and the passage that answers the
    ticket, highlighted in violet."""
    W, H = 600, 780
    im = Image.new('RGB', (W, H), (238, 236, 244))
    d = ImageDraw.Draw(im)
    title, page = KC_SOURCES[i].split(' · ')
    d.text((44, 40), title.upper(), font=font('geist', 22, 700), fill=(98, 84, 170))
    d.text((W - 44, 40), page, font=font('mono', 20, 500), fill=(120, 114, 140), anchor='ra')
    d.line((44, 84, W - 44, 84), fill=(200, 196, 214), width=2)
    rng = random.Random(i + 7)
    ft = font('geist', 26, 500)
    lines = wrap(KC_PASSAGES[i], ft, W - 110)
    y = 116
    for k in range(16):
        if k == 3 + i:
            h = 18 + 36 * len(lines)
            d.rounded_rectangle((34, y - 10, W - 34, y - 10 + h), radius=10, fill=(214, 205, 255))
            for line in lines:
                d.text((50, y), line, font=ft, fill=(30, 24, 52))
                y += 36
            y += 24
        else:
            d.rounded_rectangle((44, y + 6, 44 + rng.randint(300, W - 100), y + 18), radius=6, fill=(205, 202, 216))
            y += 34
    return im


def plaster():
    """A dark, warm plaster tile for the Awards wall: soft noise that repeats without a seam."""
    rng = random.Random(5)
    base = Image.new('L', (512, 512))
    base.putdata([max(0, min(255, round(128 + rng.gauss(0, 18)))) for _ in range(512 * 512)])
    big = Image.new('L', (1536, 1536))
    for x in range(3):
        for y in range(3):
            big.paste(base, (x * 512, y * 512))
    tile = big.filter(ImageFilter.GaussianBlur(2.2)).crop((512, 512, 1024, 1024))
    return Image.merge('RGB', [tile.point(lambda v, f=f: round(v * f)) for f in (0.27, 0.24, 0.2)])


def save(im, name, quality=84):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.webp'
    im.save(path, 'WEBP', quality=quality, method=6)
    print(f'wrote {path.name:26} {im.size[0]:5} x {im.size[1]:<5} {path.stat().st_size:7} bytes')


def main():
    sb = RAW / 'sb'
    save(fit(sb / 'm-consent.png', (768, 1662)), 'sb-phone-consent')
    save(fit(sb / 'm-youth-chat.png', (768, 1662)), 'sb-phone-notified')
    save(fit(sb / 'd-worker-handoffs.png', (1600, 1000)), 'sb-laptop-handoffs')
    save(fit(ROOT / 'assets' / 'media' / 'signalbridge-shot-2.webp', (1600, 1000)), 'sb-laptop-brief')
    save(crop(sb / 'm-consent.png', MESSAGE_BOX, 54), 'sb-message')
    ask = crop(sb / 'm-consent.png', ASK_BOX, 36)
    save(ask, 'sb-consent-ask')
    save(plate(crop(sb / 'm-youth-chat.png', PILL_BOX, 39), ask), 'sb-consent-given')
    for raw, name, box in (('d-worker-signal-radar', 'sb-wall-radar', DESK_CROP), ('d-worker-cases', 'sb-wall-cases', DESK_CROP),
                           ('d-youth-chat', 'sb-wall-chat', CHAT_CROP), ('d-worker-handoffs', 'sb-wall-handoffs', DESK_CROP),
                           ('d-supervisor', 'sb-wall-supervisor', SUPERVISOR_CROP)):
        save(fit_crop(sb / f'{raw}.png', box, (1280, 800)), name)

    bx = RAW / 'bx'
    # sized to 1.5x their largest size on screen, so each goes to the GPU without stalling a frame
    save(sharpen(fit_crop(bx / 'd-boss.png', DISPLAY_CROP, (1600, 1600))), 'bx-display')
    save(fit(bx / 'm-boss.png', (768, 1662)), 'bx-phone')
    save(sized(crop(bx / 'd-boss.png', DRAGON_BOX, 22), 320), 'bx-dragon')   # already its source size (184 x 244)
    save(crop(bx / 'd-boss.png', LEADER_BOX, 26), 'bx-leaderboard')          # its source size, 1271 x 518
    for i, (text, pts, by, kind, accent) in enumerate(CHALLENGES, 1):
        save(challenge_card(i, text, pts, by, kind, accent).resize((384, 540), Image.LANCZOS), f'bx-card-{i}')   # drawn at 512

    media = ROOT / 'assets' / 'media'
    # the tablet and the partner's display are about 400 px wide on screen at most: 1024 px is plenty, and
    # smaller textures go to the GPU without stalling a frame
    save(fit(media / 'meant-shot-1.webp', (1280, 800)), 'mt-tablet')
    save(fit(media / 'meant-shot-2.webp', (1024, 640)), 'mt-partner-wait')
    for i, text in enumerate(REPLIES, 1):
        save(sized(partner_reply(text), 1024), f'mt-partner-{i}')
    for i, text in enumerate(REPLIES, 1):
        save(reply_card(text), f'mt-reply-{i}')
    save(fit_crop(media / 'meant-shot-3.webp', WORD_GRID, (1448, 446)), 'mt-words')
    save(sharpen(fit(media / 'press' / 'tamil-murasu-2026-09-28-p8.webp', (1024, 817))), 'mt-paper', quality=82)   # from the full scan

    for state in range(4):
        save(kc_console(state).resize((1024, 640), Image.LANCZOS), f'kc-console-{state}')   # drawn at 1600, kept at 1024
    save(kc_spines(), 'kc-spines')
    for i in range(3):
        save(kc_source(i), f'kc-source-{i + 1}')
    for key in AWARD_PHOTOS:
        with Image.open(media / f'{key}.webp') as src:
            width = min(src.width, AWARD_WIDTH)
        save(sharpen(fit(media / f'{key}.webp', (width, width * 2))), f'aw-{key}', quality=80)
    save(plaster(), 'aw-wall', quality=80)

    bb = RAW / 'bcb'
    for i, name in enumerate(['m1-hero', 'm2-form', 'm3-slots', 'm4-confirmed'], 1):
        save(fit(bb / 'bcb-shots' / f'{name}.png', (768, 1662)), f'bb-phone-{i}')
    save(fit(bb / 'desk-booking.png', (1600, 1000)), 'bb-laptop')
    save(slot_atlas(), 'bb-times', quality=90)


if __name__ == '__main__':
    main()
