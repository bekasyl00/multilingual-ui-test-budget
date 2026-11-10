# Run the multi-application pilot

The corpus uses three independent upstream projects and runs on loopback. Use Node 25.4.0, Python 3 and Chrome for the closest match to the archived run. The runtime versions and protocol digest are in the run metadata. The fixture scripts from the earlier release still work separately.

Run `bash pilot/prepare.sh /path/to/new-study-workdir` to download and verify the pinned inputs and install dependencies. Alternatively, prepare this directory tree outside the study repository.

| Directory under `apps` | Source and preparation |
|---|---|
| `it-tools` | [IT-Tools at d505845f918e946ec300af7b36efc107e2f66e9e](https://github.com/CorentinTh/it-tools/tree/d505845f918e946ec300af7b36efc107e2f66e9e). In the checkout, run `npx --yes pnpm@9.11.0 install --frozen-lockfile` with pnpm 9.11.0. |
| `pdfjs` | Unpack the [PDF.js 6.5.438 generic distribution](https://github.com/mozilla/pdf.js/releases/download/v6.5.438/pdfjs-6.5.438-dist.zip). Keep its bundled sample PDF in `web/`. ZIP SHA-256 `fcbe9ba21d9911843e3502adc178a7f549a524a4055f887bedc942e5490c6ba1`. |
| `kiwix-js-4.4.0` | Unpack the [Kiwix JS 4.4.0 source archive](https://codeload.github.com/kiwix/kiwix-js/zip/refs/tags/4.4.0). Tag commit `e2c89eb692cf9c58b36986b6f42eecf7a59c7357`. Run `npm ci --ignore-scripts` in the checkout. ZIP SHA-256 `1f3cd30a73d4091c206c678e332bb80aeab2f387547ba463038daecb3e6fe43a`. |

Create a separate local npm environment with the Playwright version listed in `data/run.json`. Set `PLAYWRIGHT_MODULE` to the absolute path of its `node_modules/playwright` directory. Set `CHROME_PATH` to a local Chrome executable, or install Chromium for that Playwright version and omit the variable. No browser profile or hard-coded home directory is needed. For diagnostic element details, add `PILOT_AUDIT=1` to the smoke command. Ports 5184, 5185 and 5186 must be available.

```sh
PILOT_SMOKE=1 node pilot/run.cjs /path/to/apps /path/to/new-smoke-directory
node pilot/run.cjs /path/to/apps /path/to/new-results-directory
python3 pilot/analyze.py /path/to/new-results-directory /path/to/new-analysis-directory
```

The smoke run executes all six tasks at FR/320 with increased spacing. Each task runs in a fresh context. The matrix records step, action result, locale marker, geometry, duration, intervention checks, screenshots and browser errors. Endpoints are deliberately narrow. For example, PDF navigation checks the viewer page number, while Kiwix theme selection checks the control value. The evaluation of real user impact requires independent review. The sample sheet leaves reviewer fields blank.

The November 10 search retry timed out before the target could be filled. This runner opens the palette, fills the query immediately and selects the matching result by role. It tests a search-to-navigation task without the previous Home/End probe. The initial smoke failed because of an incorrect result selector, missing Kiwix dependencies and a service worker dialog in the restricted browser context. The runner uses the existing Kiwix Restricted mode and retains service worker blocking across the corpus.

[Results and limitations](results.md) | [One-page proposal](proposal.md) | [Five-minute demo script](demo.md)
