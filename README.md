# Testing multilingual layouts when pairwise coverage is not enough

[Read the technical report (PDF)](technical-report.pdf) · [Report source](report.md)

**Project lead:** Bekasyl Zhaksylyk. **Version:** 0.1, 10 November 2026. This repository publishes a technical report with code and evidence. It is not a journal or conference publication. Codex assisted with implementation, execution, analysis and drafting. Human validation and peer review remain open.

In a 24-configuration grid, a 12-test checkerboard covers every locale–width, locale–spacing and width–spacing pair. It misses a constructed German/320 px/spacing case where a label clips by 19.48 CSS px. A separate IT-Tools replay found a 17→21 px token line-advance change across 12 locale–width pairs. The constructed clipping result is not a real-app defect estimate.

## Recompute

From the repository root (Python 3, no third-party Python packages required):

```sh
python3 replication/verify.py
python3 replication/budget_analysis.py --historical-csv data/october-screening.csv
```

Run the browser controls after installing Playwright and its Chromium browser in a separate directory. Pass a clean output path and the absolute Playwright module path:

```sh
node replication/browser_controls.cjs /tmp/layout-controls /path/to/node_modules/playwright
```

An optional third argument selects a Chrome executable. The archived run used Chrome 156.0.8078.80 with Node 25.4.0. The driver blocks network routes and checks a measured Range edge against a fixture slot. Expect all 96 geometry assertions and 96 clicks to pass in the pinned setting; font/platform changes can change the result.

## Data map

| Path | Contents |
|---|---|
| `data/budget-analysis-with-screening.json` | Enumeration, exact probabilities, historical screening summaries |
| `data/october-screening.csv` | 48 historical rows, with local screenshot paths removed |
| `data/nov09-line-advance.csv` | Eight older EN/DE token probe pairs |
| `data/it-tools-probe-evidence.json` | New token-only rerun, detailed probe and switch readings |
| `data/it-tools-line-advance.csv` and `data/it-tools-switches.csv` | Flat derived tables |
| `data/synthetic-browser.json` and `figures/` | Browser fixture results and 24 verified screenshot hashes, plus six token field crops |
| `replication/` | Enumeration, fixture and collector code; renderer and verification scripts |

## Replay the IT-Tools diagnostic

1. Checkout [IT-Tools at d505845f918e946ec300af7b36efc107e2f66e9e](https://github.com/CorentinTh/it-tools/tree/d505845f918e946ec300af7b36efc107e2f66e9e) to `real-app-pilot/it-tools`. Install its dependencies using the upstream lockfile and instructions. Upstream software remains under its upstream license; the release does not redistribute the app or dependencies.
2. The archived collector is `replication/it-tools-diagnostic.cjs`. It was run from a `study/` folder next to `real-app-pilot/` and expects `diagnostic-plan.md` in that folder and `apply_spacing.js` at `package-original/corpus/apply_spacing.js` relative to the same root. Copy the two included supporting files to those locations. Adjust the environment-specific Playwright and Chrome paths before execution and record those changes. The exact archived collector is retained to match the runtime evidence hash.
3. Run `node study/it-tools-diagnostic.cjs output/replay-01`. The local port is 5185; output must not already exist. Summarize with `python3 replication/summarize_it_tools.py study/output/replay-01 /tmp/layout-derived`.
4. The expanded replay completed the token task only. A search retry encountered a timeout, documented in the report. The archived date reflects Asia/Almaty; raw timestamps use UTC. The output fields contain only isolated demo tokens; generated values and HTML were excluded from the released probe JSON.

Use the finite-grid results to reason about selection guarantees. A stronger real-app conclusion requires a multi-project corpus, independent labels, negative sampling and estimates that respect project-level dependence.
