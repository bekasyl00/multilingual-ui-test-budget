"""Exact design stress test and historical screening summary (Python 3 stdlib)."""
import argparse
import csv
from fractions import Fraction
from itertools import combinations, product
import json
from math import comb
from pathlib import Path
from statistics import mean


def hit_probability(size, budget, support, anchor):
    if anchor and 0 in support:
        return Fraction(1)
    if anchor:
        size -= 1
        budget -= 1
    return 1 - Fraction(comb(size - len(support), budget), comb(size, budget))


def pairwise_requirements(universe):
    return {(i, j, cell[i], cell[j]) for cell in universe for i, j in combinations(range(3), 2)}


def analyze_design():
    universe = tuple(product(range(3), range(4), range(2)))
    budget = 12
    suites = []
    for bits in product(range(2), repeat=budget):
        if any(len(set(bits[4 * row:4 * row + 4])) < 2 for row in range(3)):
            continue
        if any(len(set(bits[column::4])) < 2 for column in range(4)):
            continue
        suites.append(frozenset(2 * index + bit for index, bit in enumerate(bits)))
    anchored = tuple(suite for suite in suites if 0 in suite)
    checkerboard = frozenset(2 * (4 * i + j) + (i + j) % 2 for i, j in product(range(3), range(4)))
    assert checkerboard in anchored
    assert pairwise_requirements(tuple(universe[i] for i in checkerboard)) == pairwise_requirements(universe)
    assert len(suites) == 2 * len(anchored)

    patterns = []
    for order in range(1, 4):
        for axes in combinations(range(3), order):
            assignments = sorted({tuple(row[axis] for axis in axes) for row in universe})
            for values in assignments:
                support = {i for i, row in enumerate(universe) if tuple(row[axis] for axis in axes) == values}
                row = dict(axes=axes, values=values, support_size=len(support),
                           checkerboard_hit=bool(checkerboard & support),
                           anchored_random=str(hit_probability(len(universe), budget, support, True)),
                           unanchored_random=str(hit_probability(len(universe), budget, support, False)),
                           uniform_anchored_pairwise=str(Fraction(sum(bool(suite & support) for suite in anchored), len(anchored))))
                patterns.append(row)
    assert all(row['checkerboard_hit'] for row in patterns if len(row['axes']) <= 2)
    assert sum(row['checkerboard_hit'] for row in patterns if len(row['axes']) == 3) == budget

    def summarize(rows):
        keys = ('anchored_random', 'unanchored_random', 'uniform_anchored_pairwise')
        return dict(pattern_count=len(rows), checkerboard_detected=sum(row['checkerboard_hit'] for row in rows),
                    **{key: float(mean(Fraction(row[key]) for row in rows)) for key in keys})

    singleton_pairwise = [Fraction(row['uniform_anchored_pairwise']) for row in patterns
                          if len(row['axes']) == 3 and row['values'] != (0, 0, 0)]
    return dict(universe_size=len(universe), matched_budget=budget, anchored_random_suite_count=comb(23, 11),
                minimum_pairwise_suite_count=len(suites), reference_anchored_pairwise_suite_count=len(anchored),
                checkerboard_indices=sorted(checkerboard), axis_key=['locale', 'viewport', 'spacing'],
                by_order={order: summarize([r for r in patterns if len(r['axes']) == order]) for order in range(1, 4)},
                by_two_factor_axes={'+'.join(['locale', 'viewport', 'spacing'][a] for a in axes):
                    summarize([r for r in patterns if r['axes'] == axes]) for axes in combinations(range(3), 2)},
                nonreference_singleton_pairwise_probability_range=list(map(str, [min(singleton_pairwise), max(singleton_pairwise)])),
                patterns=patterns)


def summarize_capture(path):
    with path.open(encoding='utf-8', newline='') as stream:
        rows = list(csv.DictReader(stream))
    assert len(rows) == 48
    assert len({r['id'] for r in rows}) == 48
    groups = []
    for state, width, spacing in product(sorted({r['state'] for r in rows}),
                                         sorted({int(r['width']) for r in rows}), sorted({r['spacing'] for r in rows})):
        selected = [r for r in rows if (r['state'], int(r['width']), r['spacing']) == (state, width, spacing)]
        assert len(selected) == 2 and {r['locale'] for r in selected} == {'en', 'de'}
        counts = [int(r['candidate_text_elements']) for r in selected]
        groups.append(dict(state=state, width=width, spacing=spacing, configurations=2,
                           signal_elements=sum(counts), signal_positive_configurations=sum(n > 0 for n in counts),
                           spacing_unresolved_configurations=sum(r['status'] == 'CAPTURED_SPACING_UNRESOLVED' for r in selected)))
    return groups


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--historical-csv', type=Path, help='Optional historical run-02 observations.csv')
    args = parser.parse_args()
    result = {'synthetic_condition_analysis': analyze_design()}
    if args.historical_csv:
        result['historical_screening_descriptives'] = summarize_capture(args.historical_csv)
    print(json.dumps(result, indent=2))
