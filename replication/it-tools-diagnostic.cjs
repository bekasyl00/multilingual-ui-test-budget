"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const work=path.resolve(__dirname,'..'),repo=path.join(work,'real-app-pilot/it-tools');
const pw=path.join(process.env.HOME,'.npm/_npx/31e32ef8478fbf80/node_modules/playwright');
const {chromium}=require(pw),base='http://127.0.0.1:5185';
const spacingFile=path.join(work,'package-original/corpus/apply_spacing.js');
const applySpacing=new Function('return ('+fs.readFileSync(spacingFile,'utf8')+');')();
const out=path.resolve(__dirname,process.argv[2]||'output/nov10');
if(fs.existsSync(out))throw Error('New output directory required');
fs.mkdirSync(out,{recursive:true});
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function metrics(el){
 const s=getComputedStyle(el),p=getComputedStyle(el,'::placeholder'),r=el.getBoundingClientRect();
 const fields=['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','lineHeight','letterSpacing','wordSpacing','color','opacity','backgroundColor','paddingTop','paddingBottom','paddingLeft','paddingRight','whiteSpace','overflowX','overflowY'];
 const styles=Object.fromEntries(fields.map(k=>[k,s[k]]));
 const placeholder=Object.fromEntries(fields.map(k=>[k,p[k]]));
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d');
 c.font=s.font||`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
 c.letterSpacing=s.letterSpacing;c.wordSpacing=s.wordSpacing;
 const sample=c.measureText(el.value||el.placeholder);
 return {tag:el.tagName,value:el.value,placeholderText:el.placeholder,styles,placeholder,
 rect:{x:r.x,y:r.y,width:r.width,height:r.height},clientWidth:el.clientWidth,clientHeight:el.clientHeight,
 scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight,scrollLeft:el.scrollLeft,scrollTop:el.scrollTop,
 contentHeight:el.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),
 contentWidth:el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),
 canvasEstimate:{width:sample.width,ascent:sample.actualBoundingBoxAscent,descent:sample.actualBoundingBoxDescent},
 fontStatus:document.fonts.status};
}
function probe(el){
 const original={style:el.getAttribute('style'),value:el.value,wrap:el.getAttribute('wrap'),scrollTop:el.scrollTop,scrollLeft:el.scrollLeft};
 const before=getComputedStyle(el),copy={};for(const k of before)copy[k]=before.getPropertyValue(k);
 const clone=el.cloneNode(false);clone.removeAttribute('id');for(const [k,v]of Object.entries(copy))clone.style.setProperty(k,v,'important');
 el.parentElement.appendChild(clone);
 function run(e,lineHeight){
   for(const[k,v]of Object.entries({height:'1px','min-height':'0','max-height':'none',width:'1000px','min-width':'1000px','max-width':'none',padding:'0',border:'0','box-sizing':'content-box','white-space':'pre','overflow-wrap':'normal','word-break':'normal',overflow:'hidden',position:'fixed',left:'-12000px',top:'0',visibility:'hidden',flex:'none'}))e.style.setProperty(k,v,'important');
   e.setAttribute('wrap','off');if(lineHeight)e.style.setProperty('line-height',lineHeight,'important');
   const rows=[];
   for(const text of ['Agjpqy0123456789','ÄÖÜßéÅgj']){
    const heights=[1,5,9].map(n=>{e.value=Array(n).fill(text).join('\n');return {lines:n,height:e.scrollHeight};});
    rows.push({text,heights,advanceA:(heights[1].height-heights[0].height)/4,advanceB:(heights[2].height-heights[1].height)/4});
   }
   return {lineHeight:getComputedStyle(e).lineHeight,rows};
 }
 try{
   const originalProbe=run(el),cloneProbe=run(clone);
   const controls=[14,21,28].map(px=>({expected:px,...run(clone,px+'px')}));
   const numeric=originalProbe.rows.flatMap(x=>[x.advanceA,x.advanceB]);
   const cloneValues=cloneProbe.rows.flatMap(x=>[x.advanceA,x.advanceB]);
   const controlsPass=controls.every(c=>c.rows.every(r=>Math.abs(r.advanceA-c.expected)<=0.25&&Math.abs(r.advanceB-c.expected)<=0.25));
   return {originalProbe,cloneProbe,controls,controlsPass,agreement:numeric.every((v,i)=>Math.abs(v-cloneValues[i])<=0.25),linear:Math.max(...numeric)-Math.min(...numeric)<=0.25,estimatedAdvancePx:numeric.reduce((a,b)=>a+b,0)/numeric.length,typography:Object.fromEntries(['font-family','font-size','font-weight','font-style','font-stretch','font-feature-settings','font-variation-settings','line-height','letter-spacing','word-spacing'].map(k=>[k,copy[k]]))};
 }finally{
  clone.remove();el.value=original.value;
  if(original.style===null)el.removeAttribute('style');else el.setAttribute('style',original.style);
  if(original.wrap===null)el.removeAttribute('wrap');else el.setAttribute('wrap',original.wrap);
  el.scrollTop=original.scrollTop;el.scrollLeft=original.scrollLeft;
 }
}
async function settle(page){
 await page.evaluate(()=>document.fonts.ready);
 let last='',same=0;
 for(let i=0;i<30;i++){
  const now=await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('input,textarea,.palette-modal')].map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,getComputedStyle(e).opacity];})));
  same=now===last?same+1:0;if(same>=3)return true;last=now;await delay(100);
 }return false;
}
(async()=>{
 const summary={startedAt:new Date().toISOString(),planHash:hash(path.join(__dirname,'diagnostic-plan.md')),collectorHash:hash(__filename),spacingHash:hash(spacingFile),observations:[],status:'RUNNING'};
 let server,browser;
 const log=fs.openSync(path.join(out,'vite.log'),'w');
 try{
  summary.commit='d505845f918e946ec300af7b36efc107e2f66e9e';
  if(summary.commit!=='d505845f918e946ec300af7b36efc107e2f66e9e')throw Error('Commit changed');
  summary.gitBefore='archive of pinned commit; dependencies reused from lockfile-installed pilot';
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5185','--strictPort'],{cwd:repo,stdio:['ignore',log,log],env:{...process.env,VITE_TRACKER_ENABLED:'false',VITE_VERCEL_ENV:'production'}});
  const start=Date.now();while(true){if(server.exitCode!==null)throw Error('Vite exited');try{if((await fetch(base)).ok)break;}catch{}if(Date.now()-start>90000)throw Error('Vite timeout');await delay(250);}
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  summary.runtime={node:process.version,playwright:require(path.join(pw,'package.json')).version,chrome:browser.version(),platform:process.platform,arch:process.arch};
  for(const state of ['token'])for(const locale of ['en','de','fr'])for(const width of [1280,768,375,320]){
   const id=`${state}_${locale}_${width}`,dir=path.join(out,id);fs.mkdirSync(dir);
   const context=await browser.newContext({viewport:{width,height:900},locale,deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce',timezoneId:'UTC',serviceWorkers:'block'});
   try{
    await context.addInitScript(({locale,width})=>{localStorage.setItem('locale',locale);localStorage.setItem('isMenuCollapsed',width>700?'false':'true');localStorage.setItem('vueuse-color-scheme','light');},{locale,width});
    const page=await context.newPage(),errors=[],blocked=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{const u=route.request().url();if(u.startsWith(base+'/')||u.startsWith('data:')||u.startsWith('blob:'))return route.continue();blocked.push(u);return route.abort();});
    await page.goto(base+(state==='token'?'/token-generator':'/'),{waitUntil:'networkidle',timeout:90000});
    await page.locator('.menu-layout').waitFor();
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
    if(state==='search'){await page.keyboard.press('Control+k');await page.locator('.palette-modal input').waitFor({state:'visible'});}
    const target=page.locator(state==='search'?'.palette-modal input':'.token-display textarea');await target.waitFor({state:'visible'});
    const localeMarkers=await page.evaluate(()=>({stored:localStorage.getItem('locale'),title:document.title,
      tokenLabels:[...document.querySelectorAll('.n-form-item-label')].map(e=>e.innerText.trim()).slice(0,4)}));
    const record={id,state,locale,width,errors,blocked,localeMarkers,phases:{}};
    for(const phase of ['native','spacing']){
     if(state==='search')await target.fill('');
     if(phase==='spacing')record.intervention=await page.evaluate(applySpacing);
     const stable=await settle(page);
     const values=await target.evaluate(metrics);
     await page.screenshot({path:path.join(dir,phase+'.png')});
     await target.screenshot({path:path.join(dir,phase+'-field.png')});
     fs.writeFileSync(path.join(dir,phase+'.html'),await page.content());
     record.phases[phase]={stable,values};
     if(state==='token'){
      record.phases[phase].probe=await target.evaluate(probe);
      record.phases[phase].restoredValue=(await target.inputValue())===values.value;
      const toggles=page.getByRole('switch'), count=await toggles.count();
      const geometry=await toggles.evaluateAll(elements=>elements.map(el=>{
        const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=document.elementFromPoint(x,y);
        return {label:el.closest('.n-form-item')?.querySelector('.n-form-item-label')?.innerText.trim(),
          checked:el.getAttribute('aria-checked'),x:r.x,y:r.y,width:r.width,height:r.height,
          visibleArea:Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0)),
          centerHit:!!hit && (hit===el||el.contains(hit)),viewportWidth:innerWidth,viewportHeight:innerHeight,
          pageScrollWidth:document.documentElement.scrollWidth};
      }));
      if(count!==4)throw Error('Expected four token switches, found '+count);
      record.phases[phase].switches=geometry;
     }else{
      await target.fill('AgjpqyÄÖÜß0123456789');await settle(page);
      record.phases[phase].glyphs=await target.evaluate(metrics);
      await target.screenshot({path:path.join(dir,phase+'-glyphs.png')});
      await target.press('End');await target.press('Shift+ArrowLeft');
      record.phases[phase].endAccess=await target.evaluate(e=>({selected:e.value.slice(e.selectionStart,e.selectionEnd),scrollLeft:e.scrollLeft,value:e.value}));
      await target.screenshot({path:path.join(dir,phase+'-end.png')});
      await target.press('Home');await target.press('Shift+ArrowRight');
      record.phases[phase].startAccess=await target.evaluate(e=>({selected:e.value.slice(e.selectionStart,e.selectionEnd),scrollLeft:e.scrollLeft,value:e.value}));
      await target.screenshot({path:path.join(dir,phase+'-start.png')});
      await target.fill('token');await settle(page);
      record.phases[phase].query=await target.evaluate(metrics);
      await page.screenshot({path:path.join(dir,phase+'-query.png')});
      await page.keyboard.press('Enter');await page.waitForURL('**/token-generator',{timeout:10000});
      record.phases[phase].navigatedToToken=page.url().endsWith('/token-generator');
      if(phase==='native'){
       // Reload resets styles/state so the spacing phase has the same start page.
       await page.goto(base+'/',{waitUntil:'networkidle'});await page.locator('.menu-layout').waitFor();
       await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
       await page.keyboard.press('Control+k');await target.waitFor({state:'visible'});
      }
     }
    }
    record.files=Object.fromEntries(fs.readdirSync(dir).map(f=>[f,hash(path.join(dir,f))]));
    write(path.join(dir,'observation.json'),record);
    summary.observations.push({id,status:'CAPTURED',errors:errors.length});
    console.log(id,'CAPTURED');
   }catch(e){summary.observations.push({id,status:'FAILED',error:String(e)});write(path.join(dir,'failure.json'),{error:String(e)});console.log(id,'FAILED',String(e));}
   finally{await context.close();write(path.join(out,'summary.json'),summary);}
  }
  summary.status=summary.observations.some(x=>x.status==='FAILED')?'PARTIAL':'COMPLETE_DIAGNOSTIC';
 }catch(e){summary.status='FAILED';summary.error=String(e);process.exitCode=1;}
 finally{if(browser)await browser.close();if(server){server.kill('SIGTERM');await delay(500);}fs.closeSync(log);summary.endedAt=new Date().toISOString();write(path.join(out,'summary.json'),summary);console.log(summary.status);}
})();
