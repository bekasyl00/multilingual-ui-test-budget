"""Compare configuration-level screening at equal budgets; no defect labels inferred."""
import argparse
import csv
import json
import random
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

WIDTHS = (1280, 768, 375, 320)
LOCALES = {"it": ("en", "de", "fr"), "pdf": ("en", "es", "fr"), "kiwix": ("en", "es", "fr")}

def flags(row):
    geometry = row.get("geometry")
    if not geometry:
        return []
    width = geometry["viewportWidth"]
    return [name for name, present in {
        "document_overflow": geometry["documentWidth"] > width + 1,
        "target_outside_horizontal_viewport": geometry["targetWidth"] > 0 and (
            geometry["targetLeft"] < -1 or geometry["targetRight"] > width + 1),
    }.items() if present]

def metrics(subset):
    return {
        "screen_positive": sum(bool(flags(row)) for row in subset),
        "task_errors": sum(row["status"] != "passed" for row in subset),
        "configuration_ms_sum": sum(row["ms"] for row in subset),
    }

def evaluate(cases):
    suites = defaultdict(list)
    for row in cases:
        suites[row["app"], row["task"]].append(row)
    assert len(cases) == 144 and len({r["id"] for r in cases}) == 144 and len(suites) == 6
    rng = random.Random(20261111)
    result = {}
    review = []
    for (app, task), rows in sorted(suites.items()):
        locales = LOCALES[app]
        assert len(rows) == 24
        pairwise = [r for r in rows if r["spacing"] == bool((locales.index(r["locale"]) + WIDTHS.index(r["width"])) % 2)]
        assert len(pairwise) == len({(r["locale"],r["width"]) for r in pairwise}) == 12
        assert len({(r["locale"],r["spacing"]) for r in pairwise}) == 6
        assert len({(r["width"],r["spacing"]) for r in pairwise}) == 8
        risk_locale = [locales[1], locales[2], locales[0]]
        risk = sorted(rows, key=lambda r: (r["width"], not r["spacing"], risk_locale.index(r["locale"])))[:12]
        sampled = [metrics(rng.sample(rows, 12)) for _ in range(500)]
        key = app + "-" + task
        result[key] = {"cases": len(rows), "statuses": dict(Counter(r["status"] for r in rows)),
                       "locale_markers": {l: sorted({r.get("marker") or "" for r in rows if r["locale"] == l}) for l in locales},
                       "all": metrics(rows), "pairwise": metrics(pairwise), "risk": metrics(risk),
                       "random_mean": {field: round(mean(v[field] for v in sampled), 3) for field in sampled[0]}}
        for kind, candidates in [
            ("geometry signal", [r for r in rows if flags(r)]),
            ("sampled negative", [r for r in rows if not flags(r) and r["status"] == "passed"]),
            ("task error", [r for r in rows if r["status"] != "passed"]),
        ]:
            for r in rng.sample(candidates, min(len(candidates), 3 if kind != "task error" else 6)):
                review.append({"id": r["id"], "sample": kind, "task_status": r["status"], "before": r.get("before",""), "after": r.get("after",""),
                               "text_lost": "", "text_recoverable": "", "task_reproducibly_blocked": "", "family": "", "reviewer": "", "notes": ""})
    return result, review

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("run", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    cases = [json.loads(line) for line in (args.run / "runs.jsonl").read_text().splitlines()]
    summary, review = evaluate(cases)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    with (args.output / "independent-review.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=review[0])
        writer.writeheader()
        writer.writerows(review)
