"""Checks on generated assets: python -m pytest tests -q"""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'design'))

NAMES = {'signalbridge': 'SignalBridge', 'boss-breaker': 'Boss Breaker', 'better-call-bhai': 'Better Call Bhai',
         'meant': 'MEANT', 'knowcad': 'KnowCad'}


@pytest.mark.parametrize('slug,name', NAMES.items())
def test_each_name_font_is_small_and_has_every_letter_of_the_name(slug, name):
    from fontTools.ttLib import TTFont
    path = ROOT / 'assets' / 'fonts' / f'name-{slug}.woff2'
    assert path.exists()
    assert path.stat().st_size < 12_000, path.stat().st_size
    cmap = TTFont(path).getBestCmap()
    assert all(ord(ch) in cmap for ch in set(name)), name
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert f'font-family:"Name {name}";src:url(../assets/fonts/name-{slug}.woff2)' in css


import re  # noqa: E402

RAW = ROOT.parent / 'portfolio-tools' / 'card-shots' / 'raw'
SB = {'sb-phone-consent': (768, 1662), 'sb-phone-notified': (768, 1662), 'sb-laptop-handoffs': (1600, 1000),
      'sb-laptop-brief': (1600, 1000), 'sb-message': (837, 270), 'sb-consent-ask': (1074, 213),
      'sb-consent-given': (1074, 213)}


@pytest.mark.parametrize('name,limit', SB.items())
def test_signalbridge_textures_exist_within_their_sizes(name, limit):
    from PIL import Image
    path = ROOT / 'assets' / '3d' / f'{name}.webp'
    assert path.exists(), path
    with Image.open(path) as im:
        assert im.width <= limit[0] and im.height <= limit[1], im.size
        if name in ('sb-message', 'sb-consent-ask', 'sb-consent-given'):
            assert im.mode == 'RGBA'
            assert im.getpixel((0, 0))[3] == 0, 'rounded corner is transparent'
            assert im.getpixel((im.width // 2, im.height // 2))[3] == 255


SB_WALL = {'sb-wall-radar': (1280, 800), 'sb-wall-cases': (1280, 800), 'sb-wall-chat': (1280, 800),
           'sb-wall-supervisor': (1280, 800), 'sb-wall-preview': (1280, 800), 'sb-phone-preview': (768, 1662)}


@pytest.mark.parametrize('name,limit', SB_WALL.items())
def test_signalbridge_wall_textures_exist_within_their_sizes(name, limit):
    from PIL import Image
    path = ROOT / 'assets' / '3d' / f'{name}.webp'
    assert path.exists(), path
    with Image.open(path) as im:
        assert im.width <= limit[0] and im.height <= limit[1], im.size


def test_signalbridge_crops_leave_out_the_teammates_name_and_the_dev_badge():
    import build_3d_assets as b
    assert b.SUPERVISOR_CROP[3] <= 1500          # "Signed in as" sits below this in d-supervisor.png
    assert b.DESK_CROP[3] <= 1650 and b.CHAT_CROP[3] <= 1650 and b.PHONE_CROP[3] <= 2400   # the dev badge sits below


def chapter_bytes(prefix):
    return sum(p.stat().st_size for p in (ROOT / 'assets' / '3d').glob(f'{prefix}-*.webp'))


@pytest.mark.parametrize('prefix', ['sb', 'bx', 'bb', 'mt', 'kc', 'aw'])
def test_each_chapter_fits_its_texture_budget(prefix):
    assert chapter_bytes(prefix) <= 600_000, chapter_bytes(prefix)


def test_the_scene_and_the_builder_agree_on_the_message_crop():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'signalbridge.js').read_text(encoding='utf-8')
    m = re.search(r'MESSAGE_BOX = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.MESSAGE_BOX


@pytest.mark.parametrize('name', ['hero-desk', 'hero-phone', 'signalbridge-desk', 'signalbridge-phone'])
def test_each_rendered_still_shows_its_scene(name):
    """A still taken from the wrong place is a transparent (or empty) image: at least a tenth must be drawn."""
    from PIL import Image
    with Image.open(ROOT / 'assets' / '3d' / 'stills' / f'{name}.webp') as im:
        alpha = im.convert('RGBA').getchannel('A')
        drawn = sum(1 for a in alpha.get_flattened_data() if a > 200)
        assert drawn / (im.width * im.height) > 0.1, drawn


def test_boss_breaker_crop_boxes_sit_inside_their_captures():
    import build_3d_assets as b
    for box in [b.DRAGON_BOX, b.LEADER_BOX, *b.CARD_BOXES]:
        left, top, right, bottom = box
        assert 0 <= left < right <= 2880 and 0 <= top < bottom <= 1800, box


def test_boss_breaker_textures_exist():
    names = ['bx-display', 'bx-phone', 'bx-dragon', 'bx-leaderboard'] + [f'bx-card-{i}' for i in range(1, 7)]
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []


def test_better_call_bhai_textures_exist_and_the_scene_agrees_on_the_slot_grid():
    import build_3d_assets as b
    names = [f'bb-phone-{i}' for i in range(1, 5)] + ['bb-laptop', 'bb-slots']
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []
    left, top, right, bottom = b.SLOT_GRID
    assert 0 <= left < right <= 1170 and 0 <= top < bottom <= 2532
    js = (ROOT / 'js' / '3d' / 'chapters' / 'better-call-bhai.js').read_text(encoding='utf-8')
    m = re.search(r'SLOT_GRID = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.SLOT_GRID
