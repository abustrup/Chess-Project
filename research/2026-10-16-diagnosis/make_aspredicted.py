# Rebuilds the paste-ready answer blocks of aspredicted.md from preregistration.md section 2, word for word, and
# prints the SHA-256 of section 2 (from its "## 2." line up to the line before the next "---").
# Written 2026-10-16 by the fixer after the final critique (D1's own generator was not in the repo; this one
# reproduces D1's file exactly for every answer that did not change). Only the answer blocks and their character
# counts are rewritten; the text around them (steps, footer) is edited by hand.
# Usage, from the repo root:
#   python3 research/2026-10-16-diagnosis/make_aspredicted.py [--check] [--commit <full hash>]
#   --check: compare only, write nothing (exit 1 when an answer differs)
#   --commit: put the commit hash in place of <COMMIT> (answer 8) while copying
import hashlib, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
prereg_path, asp_path = os.path.join(HERE, 'preregistration.md'), os.path.join(HERE, 'aspredicted.md')
check_only = '--check' in sys.argv
commit = sys.argv[sys.argv.index('--commit') + 1] if '--commit' in sys.argv else None
if commit is not None and not re.fullmatch(r'[0-9a-f]{40}', commit):
    raise SystemExit('--commit needs the full 40-character commit hash')
doc = open(prereg_path, encoding='utf-8').read().split('\n')

start = next(i for i, l in enumerate(doc) if l.startswith('## 2. AsPredicted answers'))
end = next(i for i in range(start + 1, len(doc)) if doc[i].strip() == '---')
section = '\n'.join(doc[start:end]).rstrip('\n') + '\n'
section_sha = hashlib.sha256(section.encode('utf-8')).hexdigest()

# split into answers: a block starts at a line beginning with **...**
blocks, cur = [], None
for line in doc[start + 1:end]:
    m = re.match(r'^\*\*(.+?)\*\*\s*(.*)$', line)
    if m:
        cur = {'head': m.group(1).strip(), 'lines': [m.group(2)] if m.group(2) else []}
        blocks.append(cur)
    elif cur is not None:
        cur['lines'].append(line)


asp0 = open(asp_path, encoding='utf-8').read()


def existing_starts(heading):
    # paragraph starts of the answer as the file has it now: a source line beginning like one of them opens a new
    # paragraph (the source wraps paragraphs of one answer without blank lines between them)
    m = re.search(r'## ' + re.escape(heading) + r'\n\n\([\d,]+ characters\)\n\n```text\n(.*?)\n```', asp0, re.S)
    return [p[:15] for p in m.group(1).split('\n\n')[1:]] if m else []


def paragraphs(lines, starts=()):
    out, para = [], []
    for l in lines:
        if l.strip() == '' or (para and any(l.startswith(x) for x in starts)):
            if para:
                out.append(' '.join(x.strip() for x in para)); para = []
            if l.strip() == '':
                continue
        para.append(l)
    if para:
        out.append(' '.join(x.strip() for x in para))
    return out


answers = {}
for b in blocks:
    answers[b['head']] = paragraphs(b['lines'], existing_starts(b['head']))

# answer 1: the italic paragraph is the note for version B
a1_key = next(k for k in answers if k.startswith('1)'))
a1 = ' '.join(answers[a1_key])
body, note = a1.split(' *(', 1)            # the italic note follows the answer on the next line
body = re.sub(r'^No\. ', '', body)          # "No" is the ticked box, not part of the text
quoted = re.search(r'add: "(.+?)"', note).group(1)
version_a = [body]
version_b = [body, quoted]


def count(text):
    return f'{len(text):,} characters'


asp = open(asp_path, encoding='utf-8').read()


def replace_block(asp, heading, text, label_regex=None):
    """The block after `## heading`: '(N characters)' line, blank, ```text ... ```."""
    pat = re.compile(r'(## ' + re.escape(heading) + r'\n\n)\((?:[\d,]+) characters\)\n\n```text\n(.*?)\n```', re.S)
    m = pat.search(asp)
    if not m:
        raise SystemExit(f'block not found: {heading}')
    old = m.group(2)
    new_block = f'{m.group(1)}({count(text)})\n\n```text\n{text}\n```'
    return asp[:m.start()] + new_block + asp[m.end():], old != text


changed = []
for key, paras in answers.items():
    if key.startswith('1)'):
        continue
    text = '\n\n'.join(paras)
    if commit:
        text = text.replace('<COMMIT>', commit)
    heading = key
    asp, diff = replace_block(asp, heading, text)
    if diff:
        changed.append(heading)

# answer 1, version A and B
va = '\n\n'.join(version_a); vb = '\n\n'.join(version_b)
pa = re.compile(r'(Version A, no rated 10\+0 game played yet: tick \*\*No\*\*, then paste \()[\d,]+ characters(\):\n\n```text\n)(.*?)(\n```)', re.S)
m = pa.search(asp)
if m.group(3) != va:
    changed.append('1) version A')
asp = asp[:m.start()] + m.group(1) + count(va) + m.group(2) + va + m.group(4) + asp[m.end():]
pb = re.compile(r'(place of N, then paste \()[\d,]+ characters(\)\. .*?\n\n```text\n)(.*?)(\n```)', re.S)
m = pb.search(asp)
if m.group(3) != vb:
    changed.append('1) version B')
asp = asp[:m.start()] + m.group(1) + count(vb) + m.group(2) + vb + m.group(4) + asp[m.end():]

print('section 2 SHA-256:', section_sha)
print('answers that differ from the file:', changed or 'none')
if check_only:
    sys.exit(1 if changed else 0)
open(asp_path, 'w', encoding='utf-8').write(asp)
print('written', asp_path)
