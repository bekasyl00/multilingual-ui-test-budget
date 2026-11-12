"""Audit overflow thresholds and task dependence in the archived pilot."""
import argparse
import json
from collections import defaultdict
from math import comb
from pathlib import Path


def analyze(rows):
    assert len(rows) == len({row['id'] for row in rows}) == 144
    results = []
    for tolerance in (0, 1, 4, 8, 16):
        applications = defaultdict(list)
        for row in rows:
            applications[row['app']].append(row)
        for app, cases in sorted(applications.items()):
            positive = []
            for row in cases:
                geometry = row['geometry']
                overflow = geometry['documentWidth'] - geometry['viewportWidth']
                target_overflow = max(-geometry['targetLeft'],
                                      geometry['targetRight'] - geometry['viewportWidth'])
                if overflow > tolerance or (geometry['targetWidth'] > 0
                                            and target_overflow > tolerance):
                    positive.append(row)
            settings = {(row['locale'], row['width'], row['spacing'])
                        for row in positive}
            suites = defaultdict(list)
            for row in cases:
                suites[row['task']].append(row)
            expected = 0.0
            miss_probabilities = {}
            for task, task_cases in sorted(suites.items()):
                assert len(task_cases) == 24
                count = sum(row['task'] == task for row in positive)
                expected += 12 * count / 24
                miss_probabilities[task] = (
                    comb(24 - count, 12) / comb(24, 12)
                    if 24 - count >= 12 else 0.0)
            results.append({
                'tolerance_css_px': tolerance,
                'app': app,
                'positive_task_runs': len(positive),
                'distinct_flagged_settings': len(settings),
                'uniform_random_expected_positive_runs_at_12_per_task': expected,
                'uniform_random_probability_of_no_signal_per_task': miss_probabilities,
            })
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('runs', type=Path)
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.runs.read_text().splitlines()]
    print(json.dumps(analyze(rows), indent=2))
