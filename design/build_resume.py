"""Publish the approved resume without regenerating its content or design.

Edit design/resume/latest.docx and export an approved latest.pdf first.
Run this script, then build_site.py to update all versioned resume links.
--private copies the approved PDF to the ignored private/ directory instead.
"""
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'design' / 'resume' / 'latest.pdf'
OUT = ROOT / 'assets' / 'Mruthulan-Senthil-Nathan-Resume.pdf'
OLD = ROOT / 'assets' / 'Senthil-Nathan-Mruthulan-Resume.pdf'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--private', action='store_true', help='Copy to private/ for application edits.')
    args = parser.parse_args()
    if not SOURCE.is_file() or not SOURCE.read_bytes().startswith(b'%PDF-'):
        parser.error('design/resume/latest.pdf must contain the approved PDF')
    targets = [ROOT / 'private' / OUT.name] if args.private else [OUT, OLD]
    for target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SOURCE, target)
        print(f'wrote {target.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
