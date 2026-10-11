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
           'sb-wall-supervisor': (1280, 800), 'sb-wall-handoffs': (1280, 800)}


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


def test_no_signalbridge_wall_screen_is_light():
    """The youth app's preview is white cards; in a dark control room it glares. Every wall screen is dark."""
    from PIL import Image, ImageStat
    walls = sorted((ROOT / 'assets' / '3d').glob('sb-wall-*.webp'))
    assert [p.name for p in walls] == ['sb-wall-cases.webp', 'sb-wall-chat.webp', 'sb-wall-handoffs.webp',
                                       'sb-wall-radar.webp', 'sb-wall-supervisor.webp']
    for p in walls:
        with Image.open(p) as im:
            assert ImageStat.Stat(im.convert('L')).mean[0] < 70, p.name


def test_every_screen_in_the_signalbridge_room_is_dark():
    """Read the room's screens from the scene itself, so a light one hung there under any name is caught."""
    from PIL import Image, ImageStat
    js = (ROOT / 'js' / '3d' / 'chapters' / 'signalbridge.js').read_text(encoding='utf-8')
    block = js.split('const WALL = [')[1].split('];')[0]
    names = re.findall(r"\['([a-z0-9-]+)',", block)
    assert len(names) >= 5, names
    for n in names:
        with Image.open(ROOT / 'assets' / '3d' / f'{n}.webp') as im:
            assert ImageStat.Stat(im.convert('L')).mean[0] < 70, n


MIN_WIDTH = {'bx-display': 1600, 'bx-leaderboard': 1271, 'bx-phone': 768}


@pytest.mark.parametrize('name,width', MIN_WIDTH.items())
def test_sharp_textures_are_wide_enough(name, width):
    from PIL import Image
    with Image.open(ROOT / 'assets' / '3d' / f'{name}.webp') as im:
        assert im.width >= width, im.size


def test_award_photos_are_at_their_full_resolution():
    from PIL import Image
    import build_3d_assets as b
    for key in b.AWARD_PHOTOS:
        with (Image.open(ROOT / 'assets' / 'media' / f'{key}.webp') as src,
              Image.open(ROOT / 'assets' / '3d' / f'aw-{key}.webp') as out):
            assert out.width == min(src.width, b.AWARD_WIDTH), (key, out.size, src.size)


def test_the_boss_breaker_scene_and_the_builder_agree_on_the_display_crop():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'boss-breaker.js').read_text(encoding='utf-8')
    m = re.search(r'DISPLAY_CROP = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.DISPLAY_CROP
    left, top, right, bottom = b.DISPLAY_CROP
    assert 0 <= left < right <= 2880 and 0 <= top < bottom <= 1800


def chapter_bytes(prefix):
    return sum(p.stat().st_size for p in (ROOT / 'assets' / '3d').glob(f'{prefix}-*.webp'))


BUDGET = {'sb': 600_000, 'bx': 600_000, 'bb': 600_000, 'mt': 600_000, 'kc': 600_000, 'aw': 1_000_000}


@pytest.mark.parametrize('prefix,limit', BUDGET.items())
def test_each_chapter_fits_its_texture_budget(prefix, limit):
    assert chapter_bytes(prefix) <= limit, chapter_bytes(prefix)


def test_the_scene_and_the_builder_agree_on_the_message_crop():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'signalbridge.js').read_text(encoding='utf-8')
    m = re.search(r'MESSAGE_BOX = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.MESSAGE_BOX


STILL_SCENES = ['hero', 'ending', 'signalbridge', 'boss-breaker', 'better-call-bhai', 'meant', 'knowcad']


@pytest.mark.parametrize('name', [f'{s}-{f}' for s in STILL_SCENES for f in ('desk', 'phone')])
def test_each_rendered_still_shows_its_scene(name):
    """A still taken from the wrong place is empty: a board's still (transparent around the board) must be at
    least a tenth drawn, and a chapter's (the whole screen) must not be one flat colour."""
    from PIL import Image, ImageStat
    with Image.open(ROOT / 'assets' / '3d' / 'stills' / f'{name}.webp') as im:
        if name.startswith(('hero', 'ending')):
            alpha = im.convert('RGBA').getchannel('A')
            drawn = sum(1 for a in alpha.get_flattened_data() if a > 200)
            assert drawn / (im.width * im.height) > 0.1, drawn
        else:
            assert ImageStat.Stat(im.convert('L')).stddev[0] > 12, ImageStat.Stat(im.convert('L')).stddev


def test_boss_breaker_crop_boxes_sit_inside_their_captures():
    import build_3d_assets as b
    for box in [b.DRAGON_BOX, b.LEADER_BOX, b.DISPLAY_CROP]:
        left, top, right, bottom = box
        assert 0 <= left < right <= 2880 and 0 <= top < bottom <= 1800, box


def test_boss_breaker_textures_exist():
    names = ['bx-display', 'bx-phone', 'bx-dragon', 'bx-leaderboard'] + [f'bx-card-{i}' for i in range(1, 7)]
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []


def test_the_six_challenge_cards_are_drawn_and_each_is_different():
    from PIL import Image, ImageChops, ImageStat
    import build_3d_assets as b
    assert [c[0] for c in b.CHALLENGES] == [
        'Drink 2L of water before 6pm', 'Walk 8,000 steps', 'Screen off 30 minutes before bed',
        'Ten minutes of stretching after class', 'Cook one meal instead of ordering in',
        'Eight hours of sleep, two nights running']
    ims = [Image.open(ROOT / 'assets' / '3d' / f'bx-card-{i}.webp').convert('RGB') for i in range(1, 7)]
    assert all(im.size == (384, 540) for im in ims)
    for i in range(6):
        for j in range(i + 1, 6):
            diff = ImageStat.Stat(ImageChops.difference(ims[i], ims[j])).mean
            assert sum(diff) / 3 > 6, (i + 1, j + 1, diff)


def test_better_call_bhai_textures_exist_and_the_scene_agrees_on_the_slots():
    import build_3d_assets as b
    names = [f'bb-phone-{i}' for i in range(1, 5)] + ['bb-laptop', 'bb-times']
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []
    assert not (ROOT / 'assets' / '3d' / 'bb-slots.webp').exists(), 'the screenshot crop is gone'
    left, top, right, bottom = b.SLOT_GRID
    assert 0 <= left < right <= 1170 and 0 <= top < bottom <= 2532
    js = (ROOT / 'js' / '3d' / 'chapters' / 'better-call-bhai.js').read_text(encoding='utf-8')
    m = re.search(r'SLOT_GRID = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.SLOT_GRID
    m = re.search(r'TAKEN = \[([\d, ]+)\]', js)
    assert m and tuple(int(x) for x in m.group(1).split(',')) == b.SLOT_TAKEN


def test_the_time_atlas_is_crisp_text_on_clear_ground():
    from PIL import Image
    import build_3d_assets as b
    with Image.open(ROOT / 'assets' / '3d' / 'bb-times.webp') as im:
        assert im.size == (1280, 640) and im.mode == 'RGBA'
        assert im.getpixel((2, 2))[3] == 0, 'the ground is clear'
        cell = im.crop((0, 0, 320, 128))          # 10:00, free: white text
        assert cell.getchannel('A').getextrema()[1] == 255
    assert len(b.SLOT_TIMES) == 20 and b.SLOT_TIMES[b.SLOT_CHOSEN] == '15:00'
    assert [b.SLOT_TIMES[i] for i in b.SLOT_TAKEN] == ['10:30', '12:00', '12:30', '14:30', '17:00']


def test_meant_textures_exist_and_their_boxes_sit_inside_the_captures():
    import build_3d_assets as b
    names = ['mt-tablet', 'mt-partner-wait', 'mt-words', 'mt-paper'] + [f'mt-partner-{i}' for i in range(1, 5)] + [f'mt-reply-{i}' for i in range(1, 5)]
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []
    for box in [*b.REPLY_BOXES, b.WORD_GRID]:
        left, top, right, bottom = box
        assert 0 <= left < right <= 1600 and 0 <= top < bottom <= 1000, box


def test_meant_reply_cards_are_drawn_white_cards_and_the_paper_is_sharper():
    from PIL import Image, ImageStat
    for i in range(1, 5):
        with Image.open(ROOT / 'assets' / '3d' / f'mt-reply-{i}.webp') as im:
            assert im.size == (640, 296), im.size
            assert min(im.getpixel((8, 8))[:3]) >= 250, 'the card is white to its edge (the 3D card rounds it)'
            assert ImageStat.Stat(im.convert('L')).mean[0] > 200
    with Image.open(ROOT / 'assets' / '3d' / 'mt-paper.webp') as im:
        assert im.width >= 1024, im.size


def test_the_meant_scene_and_the_builder_agree_on_the_reply_tiles():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'meant.js').read_text(encoding='utf-8')
    found = [tuple(map(int, m)) for m in re.findall(r'\[(\d+), (\d+), (\d+), (\d+)\]', js.split('REPLY_BOXES = ')[1].split(';')[0])]
    assert found == b.REPLY_BOXES


KC = ['kc-console-0', 'kc-console-1', 'kc-console-2', 'kc-console-3', 'kc-spines', 'kc-source-1', 'kc-source-2', 'kc-source-3']


def test_knowcad_textures_are_drawn_and_the_champion_photo_is_gone():
    from PIL import Image, ImageChops, ImageStat
    sizes = {n: Image.open(ROOT / 'assets' / '3d' / f'{n}.webp').size for n in KC}
    assert all(sizes[f'kc-console-{i}'] == (1024, 640) for i in range(4))
    assert sizes['kc-spines'] == (800, 800)
    assert all(sizes[f'kc-source-{i}'] == (600, 780) for i in range(1, 4))
    assert not (ROOT / 'assets' / '3d' / 'kc-champion.webp').exists()
    states = [Image.open(ROOT / 'assets' / '3d' / f'kc-console-{i}.webp').convert('RGB') for i in range(4)]
    for a, b in zip(states, states[1:]):
        assert sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3 > 1, 'each state adds something'


def test_the_knowcad_example_agrees_everywhere():
    import build_3d_assets as b
    import build_site as bs
    js = (ROOT / 'js' / '3d' / 'chapters' / 'knowcad-timeline.js').read_text(encoding='utf-8')
    q = re.search(r"QUESTION = '([^']+)'", js).group(1)
    assert q == b.KC_QUERY == bs.KC_QUERY
    assert re.search(r'SOURCES = \[([^\]]+)\]', js).group(1) == ', '.join(f"'{s}'" for s in b.KC_SOURCES)


def test_the_awards_wall_is_a_dark_warm_tile():
    from PIL import Image, ImageStat
    with Image.open(ROOT / 'assets' / '3d' / 'aw-wall.webp') as im:
        assert im.size == (512, 512)
        r, g, b = ImageStat.Stat(im.convert('RGB')).mean
        assert r < 60 and r > b, (r, g, b)


def test_every_award_photo_has_its_print_and_the_awards_list_agrees():
    import build_3d_assets as b
    import build_site as bs
    assert sorted(b.AWARD_PHOTOS) == sorted(k for a in bs.AWARDS for k in a[6])
    assert [k for k in b.AWARD_PHOTOS if not (ROOT / 'assets' / '3d' / f'aw-{k}.webp').exists()] == []
