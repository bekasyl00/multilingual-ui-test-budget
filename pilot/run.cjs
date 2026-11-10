'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(process.argv[2] || 'apps');
const output = path.resolve(process.argv[3] || 'pilot-output');
const ports = { it: 5184, pdf: 5185, kiwix: 5186 };
const apps = { it: 'it-tools', pdf: 'pdfjs', kiwix: 'kiwix-js-4.4.0' };
const localeTags = { en: 'en-US', de: 'de-DE', es: 'es-ES', fr: 'fr-FR' };
const applySpacing = eval(fs.readFileSync(path.join(__dirname, '../replication/apply_spacing.js'), 'utf8'));
const children = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const origin = app => 'http://127.0.0.1:' + ports[app];

function startServers() {
  const itRoot = path.join(root, apps.it);
  children.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(ports.it), '--strictPort'], { cwd: itRoot, stdio: 'inherit', env: { ...process.env, VITE_TRACKER_ENABLED: 'false' } }));
  children.push(spawn('python3', ['-m', 'http.server', String(ports.pdf), '--bind', '127.0.0.1', '--directory', path.join(root, apps.pdf)], { stdio: 'ignore' }));
  children.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(ports.kiwix), '--strictPort'], { cwd: path.join(root, apps.kiwix), stdio: 'inherit' }));
}

async function ready(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await delay(500);
  }
  throw new Error('Server not ready: ' + url);
}

async function menu(page, selector) {
  const target = page.locator(selector);
  if (!(await target.isVisible())) await page.locator('.navbar-toggler').click();
  await target.click();
}

async function prepare(page, cfg) {
  if (cfg.app === 'it') {
    await page.addInitScript(({ locale, width }) => {
      localStorage.setItem('locale', locale);
      localStorage.setItem('isMenuCollapsed', width > 700 ? 'false' : 'true');
    }, cfg);
    await page.goto(origin('it') + (cfg.task === 'refresh' ? '/token-generator' : '/'));
    await page.locator('.menu-layout').waitFor();
    if (cfg.task === 'search') {
      await page.keyboard.press('Control+k');
      await page.locator('.palette-modal input').fill('token');
      const result = page.locator('.palette-modal [role="option"]').filter({hasText: /Token.generator|Generator.*token|Générateur.*token|Generador.*token/i}).first();
      await result.waitFor();
      return { marker: await result.innerText(), target: result, action: async () => {
        await result.click();
        await page.waitForURL('**/token-generator');
      }};
    }
    const field = page.locator('.token-display textarea').first();
    await field.waitFor();
    const initial = await field.inputValue();
    const target = page.locator('button').filter({ hasText: /^(Refresh|Rafraîchir|Actualizar|Renovar|Regenerar)$/i }).first();
    const refresh = (await target.count()) ? target : page.locator('.token-display').locator('..').locator('button').last();
    return { marker: await page.locator('.n-form-item-label').first().innerText(), target: refresh, action: async () => {
      await refresh.click();
      await field.evaluate((el, prior) => {
        if (!el.value || el.value === prior) throw Error('Token did not change');
      }, initial);
    }};
  }
  if (cfg.app === 'pdf') {
    await page.goto(origin('pdf') + '/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf');
    await page.waitForFunction(() => window.PDFViewerApplication?.pdfDocument?.numPages > 1);
    const marker = await page.locator('#viewFindButton').getAttribute('title');
    if (cfg.task === 'find') {
      await page.locator('#viewFindButton').click();
      const target = page.locator('#findInput');
      return { marker, target, action: async () => {
        await target.fill('TraceMonkey');
        await page.waitForFunction(() => document.querySelector('#findResultsCount')?.textContent.trim() && document.querySelector('#findInput').getAttribute('aria-invalid') !== 'true');
      }};
    }
    const target = page.locator('#pageNumber');
    return { marker, target, action: async () => {
      await target.fill('2');
      await target.press('Enter');
      await page.waitForFunction(() => window.PDFViewerApplication.page === 2);
    }};
  }
  await page.context().addCookies([
    {name: 'contentInjectionMode', value: 'jquery', url: origin('kiwix')},
    {name: 'defaultModeChangeAlertDisplayed', value: 'true', url: origin('kiwix')},
  ]);
  await page.addLocatorHandler(page.locator('#alertModal').filter({hasText: /Failed to register Service Worker/i}), async () => {
    await page.locator('#closeMessage').click();
  });
  await page.goto(origin('kiwix') + '/www/index.html?appCache=false&allowInternetAccess=false&contentInjectionMode=jquery&defaultModeChangeAlertDisplayed=true');
  if (cfg.locale !== 'en') {
    await page.waitForFunction(() => document.querySelector('#btnConfigure')?.textContent.trim() !== 'Configure');
  }
  const button = cfg.task === 'theme' ? '#btnConfigure' : '#btnAbout';
  if (cfg.task !== 'theme' || !(await page.locator('#appThemeSelect').isVisible())) await menu(page, button);
  const marker = await page.locator(button).textContent();
  if (cfg.task === 'theme') {
    const target = page.locator('#appThemeSelect');
    return { marker, target, action: async () => {
      const options = await target.locator('option').evaluateAll(nodes => nodes.map(n => n.value));
      const dark = options.find(value => value === 'dark_wikimediaNative');
      if (!dark) throw Error('Dark theme unavailable');
      await target.selectOption(dark);
      if (await target.inputValue() !== dark) throw Error('Theme setting did not change');
    }};
  }
  const target = page.locator('a[href="#usage"]').first();
  return { marker, target, action: async () => {
    await target.click();
    await page.waitForFunction(() => {
      const box = document.querySelector('#usage').getBoundingClientRect();
      return box.top < innerHeight && box.bottom > 0;
    });
  }};
}

async function measure(target) {
  return target.evaluate(el => {
    const box = el.getBoundingClientRect();
    return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth,
      targetLeft: box.left, targetRight: box.right, targetWidth: box.width, targetTop: box.top,
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowX: getComputedStyle(el).overflowX };
  }, undefined, { timeout: 4000 });
}

async function runOne(browser, cfg) {
  const started = performance.now();
  const context = await browser.newContext({ viewport: { width: cfg.width, height: 900 }, locale: localeTags[cfg.locale], deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(5500);
  page.setDefaultNavigationTimeout(12000);
  const row = { ...cfg, status: 'error', step: 'prepare', pageErrors: [] };
  page.on('pageerror', error => row.pageErrors.push(error.message));
  row.localHttpErrors = [];
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(origin(cfg.app))) row.localHttpErrors.push(new URL(response.url()).pathname + ' ' + response.status());
  });
  await page.route('**/*', route => route.request().url().startsWith(origin(cfg.app) + '/') ? route.continue() : route.abort());
  try {
    const task = await prepare(page, cfg);
    row.marker = task.marker;
    await page.evaluate(() => document.fonts.ready);
    row.step = 'intervention';
    if (cfg.spacing) {
      const summary = await page.evaluate(applySpacing);
      row.intervention = { thresholdFailures: summary.thresholdFailures, unresolvedNormal: summary.textElementsWithUnresolvedNormalLineHeight };
      if (process.env.PILOT_AUDIT) {
        row.intervention.failingElements = summary.elements.filter(element => element.thresholdFailures.length);
        row.intervention.targetStyle = await task.target.evaluate(element => {
          const style = getComputedStyle(element);
          return {fontSize: style.fontSize, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, wordSpacing: style.wordSpacing};
        });
      }
    }
    row.step = 'pre-action capture';
    row.geometry = await measure(task.target);
    row.before = cfg.id + '-before.png';
    await page.screenshot({ path: path.join(output, row.before), timeout: 5500 });
    row.step = 'action';
    await task.action();
    row.status = 'passed';
    row.step = 'complete';
  } catch (error) {
    row.error = error.message.slice(0, 600);
  } finally {
    try {
      row.after = cfg.id + '-after.png';
      await page.screenshot({ path: path.join(output, row.after), timeout: 3500 });
    } catch { delete row.after; }
    row.ms = Math.round(performance.now() - started);
    await context.close();
  }
  return row;
}

async function main() {
  fs.mkdirSync(output, { recursive: false });
  startServers();
  let browser;
  try {
    await Promise.all(Object.keys(apps).map(app => ready(origin(app))));
    browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
    const suites = { it: ['search', 'refresh'], pdf: ['find', 'page'], kiwix: ['theme', 'usage'] };
    const cases = Object.entries(suites).flatMap(([app, tasks]) => tasks.flatMap(task =>
      (app === 'it' ? ['en','de','fr'] : ['en','es','fr']).flatMap(locale => [1280,768,375,320].flatMap(width => [false,true].map(spacing =>
        ({ app, task, locale, width, spacing, id: [app,task,locale,width,spacing ? 'spacing' : 'native'].join('-') }))))));
    const selected = process.env.PILOT_SMOKE ? cases.filter(c => c.width === 320 && c.locale === 'fr' && c.spacing) : cases;
    const started = performance.now();
    for (let offset = 0; offset < selected.length; offset += 4) {
      const results = await Promise.all(selected.slice(offset, offset + 4).map(cfg => runOne(browser, cfg)));
      for (const row of results) {
        fs.appendFileSync(path.join(output, 'runs.jsonl'), JSON.stringify(row) + '\n');
        console.log(row.id, row.status, row.step, row.error || '');
      }
    }
    const protocol = fs.readFileSync(path.join(__dirname, 'protocol.md'));
    fs.writeFileSync(path.join(output, 'run.json'), JSON.stringify({
      node: process.version, browser: browser.version(), playwright: require((process.env.PLAYWRIGHT_MODULE || 'playwright') + '/package.json').version,
      planned: selected.length, wallMs: Math.round(performance.now() - started), protocolSha256: createHash('sha256').update(protocol).digest('hex'),
    }, null, 2) + '\n');
  } finally {
    if (browser) await browser.close();
    for (const child of children) child.kill('SIGTERM');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
