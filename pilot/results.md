# Three-application pilot results | 11 November 2026

The matrix completed 144 of 144 defined task checks and recorded 288 screenshots. It covers two tasks in each of IT-Tools, PDF.js and Kiwix JS, with three observed interface languages, four viewport widths and two spacing regimes. Browser wall time for the matrix was 101.257 seconds with batches of four. The full grid is a development pilot on one Chromium build.

| Application | Task | Passed | Geometry signals |
|---|---|---:|---:|
| IT-Tools | Search and open the token generator | 24/24 | 0 |
| IT-Tools | Refresh the token | 24/24 | 0 |
| PDF.js | Find TraceMonkey in the sample | 24/24 | 11 |
| PDF.js | Navigate to page two | 24/24 | 11 |
| Kiwix JS | Select dark appearance | 24/24 | 0 |
| Kiwix JS | Open the usage section | 24/24 | 0 |

The geometry rule flags horizontal overflow of the document or target beyond a one-pixel tolerance. All 22 signals came from document width in PDF.js, where both tested actions still completed. Grouping the task runs by locale, width and spacing leaves 11 distinct PDF.js settings with a signal. Both tasks were flagged in exactly those same 11 settings. At 320 px, all three locales were flagged under both spacing regimes. At 375 px, two of three locales were flagged with native spacing and all three with increased spacing. Neither task was flagged at 768 or 1280 px. This overlap makes the two task counts dependent and does not establish how many mechanisms produced the signals. Review is required to determine if content was lost, recoverable or outside the task scope.

## Twelve configurations per task

| Method | Screen-positive configurations selected, across six tasks |
|---|---:|
| Fixed pairwise checkerboard | 10 |
| Fixed width-and-spacing priority | 22 |
| Uniform random, mean of 500 draws per task | 10.94 |

The risk rule prioritises the smallest widths and the signal is horizontal overflow. This result measures screening behaviour for this grid. Functional checks produced zero failures and there are no independent defect-family labels, so defect recall and false alarms are undefined. Per-method time fields are sums of measured case durations from the full-grid run. Direct runtime comparisons require executing and timing each subset separately.

## Retrospective threshold sensitivity

The screen uses document overflow or a positive-width target extending beyond the horizontal viewport. Recomputing from the archived geometry gives the following PDF.js counts. IT-Tools and Kiwix JS have zero signals at all five tolerances.

| Tolerance, CSS px | Positive task runs | Distinct flagged settings | Exact expected positive runs, uniform random |
|---|---:|---:|---:|
| 0 | 22 | 11 | 11 |
| 1 | 22 | 11 | 11 |
| 4 | 20 | 10 | 10 |
| 8 | 16 | 8 | 8 |
| 16 | 14 | 8 | 7 |

Uniform random selects 12 of 24 settings separately for each task. For a task with K screen-positive settings, the expected count is 12K/24. Summing expectations does not require task independence. At the original one-pixel tolerance the exact expectation is 11 positive task runs, compared with 10.94 in the archived Monte Carlo estimate. The probability of selecting no positive settings for a task is C(24-K,12)/C(24,12), with probability zero if fewer than 12 negative settings exist. These quantities describe selection of geometry signals. Independent task-impact labels have not been collected.

The persistence of signals at larger tolerances shows that they are not all one-pixel boundary effects. At 16 px the two task screens no longer agree in every flagged setting. The tolerance choices are retrospective and provide no estimate of generalisation to other applications. Reproduce with `python3 pilot/sensitivity.py pilot/data/runs.jsonl` and compare with [the archived sensitivity output](data/sensitivity.json). The [independent review protocol](review-protocol.md) specifies the next validation step.

## Spacing audit

The intervention attempted all four inherited spacing rules. All 24 IT-Tools intervention runs reported zero threshold failures. All 24 PDF.js intervention runs reported one failing element and 106 text elements whose native line height remained unresolved. All 24 Kiwix intervention runs reported four failing elements and 15 unresolved text elements. A separate FR/320 repeat traced PDF.js's letter-spacing mismatch to the viewer alert and Kiwix's line-height mismatches to four native select controls. The Kiwix theme select reported normal line height. The four other audited action targets and the Kiwix usage target reported numeric line height with the requested letter and word spacing. These are instrument diagnostics. The results cannot establish spacing conformance for either application.

See [the protocol](protocol.md), [machine-readable results](data/summary.json) and [independent review worksheet](data/independent-review.csv). Review the signal and sampled negative rows with the matching screenshots from a replay or the original evidence archive. Have reviewers record recoverability, reproducible task impact and suspected defect family separately. Record disagreements before calculating any defect-level metric.
