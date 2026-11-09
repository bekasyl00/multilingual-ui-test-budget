/* User-style intervention only. Capture baseline values before any style write.
 * Numeric values above WCAG thresholds are preserved. Non-numeric normal line-height
 * is explicitly unresolved: no strict no-reduction claim for those elements.
 */
() => {
  const properties = [
    ['line-height', 'lineHeight', 1.5],
    ['letter-spacing', 'letterSpacing', 0.12],
    ['word-spacing', 'wordSpacing', 0.16],
  ];
  const elements = [...document.querySelectorAll('body, body *')].filter(e => e instanceof HTMLElement);
  const snapshots = elements.map((e,index) => {
    const s=getComputedStyle(e), font=parseFloat(s.fontSize);
    return {e,index,font,textBearing:[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()),before:{lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,wordSpacing:s.wordSpacing,marginBottom:s.marginBottom},targets:{}};
  });
  for (const row of snapshots) {
    for (const [property,field,factor] of properties) {
      const baseline=parseFloat(row.before[field]);
      const target=Math.max(Number.isFinite(baseline)?baseline:0,row.font*factor);
      row.targets[field]=target;row.e.style.setProperty(property,`${target}px`,'important');
    }
    if(row.e.tagName==='P') {
      const target=Math.max(parseFloat(row.before.marginBottom)||0,row.font*2);
      row.targets.marginBottom=target;row.e.style.setProperty('margin-bottom',`${target}px`,'important');
    }
  }
  const result=snapshots.map(row=>{
    const s=getComputedStyle(row.e), failures=[];
    const unknownBaseline=row.before.lineHeight==='normal';
    for(const [field,target] of Object.entries(row.targets)) {
      const after=parseFloat(s[field]);
      if(!Number.isFinite(after)||after+0.05<target) failures.push(field);
    }
    return {index:row.index,tag:row.e.tagName,id:row.e.id,textBearing:row.textBearing,before:row.before,targets:row.targets,after:{lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,wordSpacing:s.wordSpacing,marginBottom:s.marginBottom},numericBaselineNondecreaseVerified:failures.length===0&&!unknownBaseline,unknownNormalLineHeightBaseline:unknownBaseline,thresholdFailures:failures};
  });
  return {method:'max(numeric authored computed value, required threshold), all baseline values read before writes',elements:result,thresholdFailures:result.filter(x=>x.thresholdFailures.length).length,textElementsWithUnresolvedNormalLineHeight:result.filter(x=>x.textBearing&&x.unknownNormalLineHeightBaseline).length,strictNoReductionVerified:result.filter(x=>x.textBearing).every(x=>x.numericBaselineNondecreaseVerified)};
}
