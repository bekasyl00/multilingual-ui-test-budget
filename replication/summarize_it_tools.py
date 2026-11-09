"""Derive public measurements from an instrument run, excluding input values and DOM."""
from pathlib import Path
import argparse
import csv
import json
import collections

p=argparse.ArgumentParser()
p.add_argument('raw',type=Path)
p.add_argument('out',type=Path)
a=p.parse_args()
root=a.raw
run=json.loads((root/'summary.json').read_text())
assert run['status']=='COMPLETE_DIAGNOSTIC' and len(run['observations'])==12
rows=[]; sw=[]; detailed=[]
for f in sorted(root.glob('*/observation.json')):
 d=json.loads(f.read_text())
 rec={k:d[k] for k in ('id','state','locale','width','localeMarkers')}
 assert d['localeMarkers']['stored']==d['locale'] and not d['errors']
 rec['phases']={}
 for phase, obs in d['phases'].items():
  v=obs['probe']
  rows.append(dict(locale=d['locale'],viewport_width=d['width'],phase=phase,advance_px=v['estimatedAdvancePx'],calibrated=v['controlsPass'],original_clone_agree=v['agreement'],linear=v['linear'],restored=obs['restoredValue'],stable=obs['stable'],font_family=v['typography']['font-family']))
  assert all([v['controlsPass'],v['agreement'],v['linear'],obs['restoredValue']])
  rec['phases'][phase]={'probe':v,'switches':obs['switches'],'restoredValue':obs['restoredValue'],'stable':obs['stable']}
  for i,switch in enumerate(obs['switches']):
   sw.append(dict(locale=d['locale'],viewport_width=d['width'],phase=phase,switch_index=i,**switch))
 detailed.append(rec)
assert len(rows)==24 and len(sw)==96
print('line advance and checks:',collections.Counter((r['phase'],r['advance_px'],r['stable']) for r in rows))
print('switch centre hit misses by width/phase:',collections.Counter((r['viewport_width'],r['phase']) for r in sw if not r['centerHit']))
print('offscreen, partial by width/phase:',collections.Counter((r['viewport_width'],r['phase'],'zero' if r['visibleArea']==0 else 'partial') for r in sw if r['visibleArea'] < r['width']*r['height']-.01))
print('locales:',[r['localeMarkers'] for r in detailed if r['width']==320])
a.out.mkdir(parents=True,exist_ok=True)
for filename,data in [('it-tools-line-advance.csv',rows),('it-tools-switches.csv',sw)]:
 with (a.out/filename).open('w') as f:
  writer=csv.DictWriter(f,fieldnames=data[0]);writer.writeheader();writer.writerows(data)
(a.out/'it-tools-probe-evidence.json').write_text(json.dumps({'run':run,'rows':detailed},indent=2)+'\n')
