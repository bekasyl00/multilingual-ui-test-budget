"""Recompute design and check the archived observed fixture evidence."""
import csv
import hashlib
import json
from pathlib import Path
from budget_analysis import analyze_design, summarize_capture

r=Path(__file__).resolve().parent.parent
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
theory=analyze_design()
evidence=json.loads((r/'data/budget-analysis-with-screening.json').read_text())
assert json.loads(json.dumps(theory))==evidence['synthetic_condition_analysis']
assert summarize_capture(r/'data/october-screening.csv')==evidence['historical_screening_descriptives']
assert theory['minimum_pairwise_suite_count']==906 and theory['reference_anchored_pairwise_suite_count']==453
raw=json.loads((r/'data/synthetic-browser.json').read_text())
assert raw['fixtureHash']==sha(r/'replication/interaction_fixture.html')
assert len(raw['rows'])==24
assert raw['checks']==raw['assertionAgreement']==raw['clickChecksPassed']==96
locales=['en','de','fr']; widths=[1280,768,375,320]
counts={name:[0,0] for name in ['unary','binary','ternary','negative']}
for row in raw['rows']:
    i=locales.index(row['locale']);j=widths.index(row['width']); s=int(row['regime']=='spacing')
    name=f"{row['locale']}-{row['width']}-{row['regime']}.png"
    assert sha(r/'figures'/name)==row['screenshotSha256']
    for key in counts:
        v=row['observed'][key]['clipped']
        assert v==row['expected'][key]
        counts[key][0]+=v
        counts[key][1]+=v and s==(i+j)%2
assert counts=={'unary':[8,4],'binary':[2,1],'ternary':[1,0],'negative':[0,0]}
with (r/'data/nov09-line-advance.csv').open() as f:
    assert len(list(csv.DictReader(f)))==8
replay=json.loads((r/'data/it-tools-probe-evidence.json').read_text())
assert len(replay['rows'])==12 and replay['run']['status']=='COMPLETE_DIAGNOSTIC'
assert sha(r/'replication/it-tools-diagnostic.cjs')==replay['run']['collectorHash']
assert sha(r/'replication/diagnostic-plan.md')==replay['run']['planHash']
assert sha(r/'replication/apply_spacing.js')==replay['run']['spacingHash']
for rrow in replay['rows']:
    for phase,expected in [('native',17),('spacing',21)]:
        v=rrow['phases'][phase]['probe']
        assert v['estimatedAdvancePx']==expected
        assert v['controlsPass'] and v['agreement'] and v['linear']
print('Verified exact design, historical tables, 24 fixture screenshot hashes, 96 expected outcomes, and 24 IT-Tools phase probes.')
