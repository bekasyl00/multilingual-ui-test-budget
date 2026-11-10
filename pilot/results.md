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

## Spacing audit

The intervention attempted all four inherited spacing rules. All 24 IT-Tools intervention runs reported zero threshold failures. All 24 PDF.js intervention runs reported one failing element and 106 text elements whose native line height remained unresolved. All 24 Kiwix intervention runs reported four failing elements and 15 unresolved text elements. A separate FR/320 repeat traced PDF.js's letter-spacing mismatch to the viewer alert and Kiwix's line-height mismatches to four native select controls. The Kiwix theme select reported normal line height. The four other audited action targets and the Kiwix usage target reported numeric line height with the requested letter and word spacing. These are instrument diagnostics. The results cannot establish spacing conformance for either application.

See [the protocol](protocol.md), [machine-readable results](data/summary.json) and [independent review worksheet](data/independent-review.csv). Review the signal and sampled negative rows with the matching screenshots from a replay or the original evidence archive. Have reviewers record recoverability, reproducible task impact and suspected defect family separately. Record disagreements before calculating any defect-level metric.
