"""Textures for the 3D homepage, made from the real captures.

    python design/build_3d_assets.py

Reads the raw captures in ../portfolio-tools/card-shots/raw (outside this repository; raw files are never
published) and the site's own media, and writes WebP files to assets/3d/. Crops are cut from the real screens
with rounded corners, so each piece is exactly what the app showed. Nothing is drawn or invented here: the
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
AWARD_WIDTH = 1400                    # the photos at their source's full width (at most this), lightly sharpened
CARD_BOXES = [(145, 549, 1423, 936), (1457, 549, 2735, 936), (145, 971, 1423, 1358),
              (1457, 971, 2735, 1358), (145, 1392, 1423, 1780), (1457, 1392, 2735, 1780)]   # challenges #6 to #1


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
    save(fit_crop(sb / 'm-youth-preview.png', PHONE_CROP, (768, 1662)), 'sb-phone-preview')

    bx = RAW / 'bx'
    save(sharpen(fit_crop(bx / 'd-boss.png', DISPLAY_CROP, (2048, 2048))), 'bx-display')
    save(fit(bx / 'm-boss.png', (1024, 2216)), 'bx-phone')
    save(sized(crop(bx / 'd-boss.png', DRAGON_BOX, 22), 320), 'bx-dragon')   # already its source size (184 x 244)
    save(crop(bx / 'd-boss.png', LEADER_BOX, 26), 'bx-leaderboard')          # its source size, 1271 x 518
    for i, box in enumerate(CARD_BOXES, 1):
        save(sized(crop(bx / 'd-challenges.png', box, 26), 640), f'bx-card-{i}')

    media = ROOT / 'assets' / 'media'
    # the tablet and the partner's display are about 400 px wide on screen at most: 1024 px is plenty, and
    # smaller textures go to the GPU without stalling a frame
    save(fit(media / 'meant-shot-1.webp', (1280, 800)), 'mt-tablet')
    save(fit(media / 'meant-shot-2.webp', (1024, 640)), 'mt-partner-wait')
    for i, text in enumerate(REPLIES, 1):
        save(sized(partner_reply(text), 1024), f'mt-partner-{i}')
    for i, box in enumerate(REPLY_BOXES, 1):
        save(crop(media / 'meant-shot-1.webp', box, 26), f'mt-reply-{i}')
    save(fit_crop(media / 'meant-shot-3.webp', WORD_GRID, (1448, 446)), 'mt-words')
    save(fit(media / 'press' / 'tamil-murasu-2026-09-28-p8-1200.webp', (1024, 820)), 'mt-paper')

    save(fit(media / 'win-knowcad-champion.webp', (1179, 705)), 'kc-champion')
    for key in AWARD_PHOTOS:
        with Image.open(media / f'{key}.webp') as src:
            width = min(src.width, AWARD_WIDTH)
        save(sharpen(fit(media / f'{key}.webp', (width, width * 2))), f'aw-{key}', quality=80)

    bb = RAW / 'bcb'
    for i, name in enumerate(['m1-hero', 'm2-form', 'm3-slots', 'm4-confirmed'], 1):
        save(fit(bb / 'bcb-shots' / f'{name}.png', (768, 1662)), f'bb-phone-{i}')
    save(fit(bb / 'desk-booking.png', (1600, 1000)), 'bb-laptop')
    save(slot_atlas(), 'bb-times', quality=90)


if __name__ == '__main__':
    main()
