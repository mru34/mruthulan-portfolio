"""Checks run before every deploy (and locally whenever you like).

    python design/check_site.py _site      every page in the folder: each local link, image,
                                           srcset entry and #anchor points at something that
                                           exists; every <img> has alt text
    python design/check_site.py --unchanged
                                           after `python design/build_site.py`: the pages the
                                           generator wrote are the pages in Git, so nobody
                                           edited the generated HTML by hand

The inline poster images (data: URIs) are re-encoded on every build and can differ by a few bytes
between machines, so --unchanged compares the pages with those masked out.
"""
import re
import subprocess
import sys
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_HOSTS = ('mruthulan.com', 'www.mruthulan.com')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.imgs = set(), [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        for k in ('href', 'src', 'poster'):
            if a.get(k):
                self.refs.append(a[k])
        for k in ('srcset', 'imagesrcset'):
            for part in (a.get(k) or '').split(','):
                if part.strip():
                    self.refs.append(part.strip().split(' ')[0])
        if tag == 'meta' and (a.get('property') or a.get('name') or '').endswith(':image') and a.get('content'):
            self.refs.append(a['content'])
        if tag == 'img':
            self.imgs.append(a)


def check_links(site):
    problems, pages = [], sorted(site.glob('*.html'))
    parsed = {}
    for f in pages:
        p = Page()
        p.feed(f.read_text(encoding='utf-8'))
        parsed[f.name] = p
    for name, p in parsed.items():
        for img in p.imgs:
            if 'alt' not in img:
                problems.append(f'{name}: <img src="{img.get("src")}"> has no alt')
        for ref in p.refs:
            if ref.startswith(('mailto:', 'tel:', 'data:', 'javascript:')):
                continue
            u = urllib.parse.urlparse(ref)
            if u.scheme in ('http', 'https') and u.netloc not in SITE_HOSTS:
                continue
            path = urllib.parse.unquote(u.path).lstrip('/')
            if not path:                                   # "#anchor" or "/" on this page
                if u.fragment and ref.startswith('#') and u.fragment not in p.ids:
                    problems.append(f'{name}: {ref} has no matching id')
                continue
            target = site / path
            if target.is_dir():
                target = target / 'index.html'
            if not target.exists() and not target.with_name(target.name + '.html').exists():
                problems.append(f'{name}: {ref} does not exist')
            elif u.fragment and target.suffix == '.html' and target.name in parsed and u.fragment not in parsed[target.name].ids:
                problems.append(f'{name}: {ref} has no matching id in {target.name}')
    return problems, len(pages)


def check_unchanged():
    mask = lambda s: re.sub(r'data:image/[a-z]+;base64,[A-Za-z0-9+/=]+', 'data:…', s)
    problems = []
    for f in sorted(ROOT.glob('*.html')):
        try:
            committed = subprocess.run(['git', 'show', f'HEAD:{f.name}'], cwd=ROOT, capture_output=True,
                                       check=True).stdout.decode('utf-8')
        except subprocess.CalledProcessError:
            problems.append(f'{f.name}: written by the generator but not in Git')
            continue
        built = f.read_text(encoding='utf-8')
        if mask(built.replace('\r\n', '\n')) != mask(committed.replace('\r\n', '\n')):
            problems.append(f'{f.name}: differs from what design/build_site.py writes '
                            '(edit the generator, rebuild and commit the pages)')
    return problems


def main():
    if sys.argv[1:] == ['--unchanged']:
        problems = check_unchanged()
        ok = 'the committed pages match the generator'
    elif len(sys.argv) == 2:
        problems, n = check_links(Path(sys.argv[1]))
        ok = f'{n} pages, every local link and image resolves'
    else:
        print(__doc__)
        return 2
    for p in problems:
        print('✗', p)
    print(f'{len(problems)} problem(s)' if problems else f'✓ {ok}')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
