"""Textures for the 3D homepage, made from the real captures.

    python design/build_3d_assets.py

Reads the raw captures in ../portfolio-tools/card-shots/raw (outside this repository; raw files are never
published) and the site's own media, and writes WebP files to assets/3d/. Crops are cut from the real screens
with rounded corners, so each piece is exactly what the app showed. Nothing is drawn or invented here: the
one composite (sb-consent-given) is the app's own "Worker notified" pill, centred on a plate of the consent
card's own background colour, the same size as the card.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT.parent / 'portfolio-tools' / 'card-shots' / 'raw'
OUT = ROOT / 'assets' / '3d'

# boxes in pixels of the 1170 x 2532 phone captures (left, top, right, bottom)
MESSAGE_BOX = (285, 240, 1122, 510)   # the youth's first message, m-consent.png
ASK_BOX = (48, 2013, 1122, 2226)      # "Let your worker see a brief note from tonight?", m-consent.png
PILL_BOX = (672, 48, 1017, 126)       # "Worker notified", m-youth-chat.png


def fit(src, size):
    with Image.open(src) as im:
        im = im.convert('RGB')
        im.thumbnail(size, Image.LANCZOS)
        return im.copy()


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


def save(im, name):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.webp'
    im.save(path, 'WEBP', quality=84, method=6)
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


if __name__ == '__main__':
    main()
