#!/usr/bin/env bash
# Create a fresh checkout and browser tooling in a new directory.
set -euo pipefail
root="${1:?usage: bash pilot/prepare.sh NEW_DIRECTORY}"
mkdir "$root"
root="$(cd "$root" && pwd)"
mkdir "$root/apps" "$root/downloads" "$root/tooling"
git clone https://github.com/CorentinTh/it-tools.git "$root/apps/it-tools"
git -C "$root/apps/it-tools" checkout --detach d505845f918e946ec300af7b36efc107e2f66e9e
(cd "$root/apps/it-tools" && npx --yes pnpm@9.11.0 install --frozen-lockfile)
curl -fL --retry 2 -o "$root/downloads/pdfjs.zip" https://github.com/mozilla/pdf.js/releases/download/v6.5.438/pdfjs-6.5.438-dist.zip
curl -fL --retry 2 -o "$root/downloads/kiwix.zip" https://codeload.github.com/kiwix/kiwix-js/zip/refs/tags/4.4.0
python3 - "$root" <<'PY'
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile
import sys

root = Path(sys.argv[1])
for name, expected, destination in [
    ('pdfjs.zip', 'fcbe9ba21d9911843e3502adc178a7f549a524a4055f887bedc942e5490c6ba1', root / 'apps/pdfjs'),
    ('kiwix.zip', '1f3cd30a73d4091c206c678e332bb80aeab2f387547ba463038daecb3e6fe43a', root / 'apps'),
]:
    archive = root / 'downloads' / name
    if sha256(archive.read_bytes()).hexdigest() != expected:
        raise SystemExit(f'Archive digest mismatch: {name}')
    with ZipFile(archive) as package:
        package.extractall(destination)
PY
(cd "$root/apps/kiwix-js-4.4.0" && npm ci --ignore-scripts --no-audit --no-fund)
npm install --prefix "$root/tooling" --no-audit --no-fund --save-exact playwright@1.64.0-alpha-1790635538000
printf '\nPlaywright module: %s\n' "$root/tooling/node_modules/playwright"
