'use strict';
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const [output, playwrightPath = 'playwright', executablePath] = process.argv.slice(2);
if (!output) throw new Error('Usage: node browser_controls.cjs OUTPUT_DIR [PLAYWRIGHT_PATH] [CHROME_PATH]');
const { chromium } = require(playwrightPath);
const fixture = path.join(__dirname, 'interaction_fixture.html');
const fixtureHash = createHash('sha256').update(fs.readFileSync(fixture)).digest('hex');
const locales = ['en', 'de', 'fr'];
const widths = [1280, 768, 375, 320];
const regimes = ['native', 'spacing'];
const rows = [];

function spacingOverride() {
  // The fixture starts with explicit numeric line heights, so all minima can be verified.
  for (const label of document.querySelectorAll('.label')) {
    const style = getComputedStyle(label);
    const size = parseFloat(style.fontSize);
    label.style.lineHeight = `${Math.max(parseFloat(style.lineHeight), 1.5 * size)}px`;
    label.style.letterSpacing = `${Math.max(parseFloat(style.letterSpacing) || 0, 0.12 * size)}px`;
    label.style.wordSpacing = `${Math.max(parseFloat(style.wordSpacing) || 0, 0.16 * size)}px`;
  }
}

function measure() {
  const result = {};
  for (const label of document.querySelectorAll('.label')) {
    const range = new Range();
    range.selectNodeContents(label);
    const host = label.getBoundingClientRect();
    const glyphRects = [...range.getClientRects()];
    const style = getComputedStyle(label);
    const section = label.closest('section').className;
    const rightOverflow = Math.max(0, ...glyphRects.map(rect => rect.right - host.right));
    result[section] = {
      rightOverflowPx: rightOverflow,
      scrollWidth: label.scrollWidth,
      clientWidth: label.clientWidth,
      lines: glyphRects.length,
      content: label.textContent,
      lineHeight: parseFloat(style.lineHeight),
      letterSpacing: parseFloat(style.letterSpacing) || 0,
      wordSpacing: parseFloat(style.wordSpacing) || 0,
      overflowX: style.overflowX,
      clipped: rightOverflow > 0.5 && style.overflowX === 'hidden',
    };
  }
  return result;
}

async function main() {
  fs.mkdirSync(output, { recursive: false });
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const browserVersion = browser.version();
    for (const [li, locale] of locales.entries()) {
      for (const [wi, width] of widths.entries()) {
        for (const [si, regime] of regimes.entries()) {
          const page = await browser.newPage({ viewport: { width, height: 440 }, deviceScaleFactor: 1 });
          try {
            await page.route('**/*', route => route.request().url().startsWith('file:') ? route.continue() : route.abort());
            await page.goto(pathToFileURL(fixture).href);
            await page.evaluate(localeName => window.configureFixture(localeName), locale);
            await page.evaluate(() => document.fonts.ready);
            if (regime === 'spacing') await page.evaluate(spacingOverride);
            const observed = await page.evaluate(measure);
            const expected = {
              unary: locale === 'de',
              binary: locale === 'de' && width === 320,
              ternary: locale === 'de' && width === 320 && regime === 'spacing',
              negative: false,
            };
            for (const [name, value] of Object.entries(observed)) {
              assert.equal(value.clipped, expected[name], `${name} ${locale}/${width}/${regime} ${JSON.stringify(value)}`);
              if (regime === 'spacing') {
                assert(value.lineHeight >= 24 && value.letterSpacing >= 1.92 && value.wordSpacing >= 2.56);
              }
              await page.locator(`.${name} button`).click();
              assert.equal(await page.locator('output').textContent(), name);
            }
            const screenshot = `${locale}-${width}-${regime}.png`;
            const bytes = await page.screenshot({ path: path.join(output, screenshot) });
            rows.push({ locale, width, regime, expected, observed, checkerboardSelected: si === ((li + wi) % 2), screenshot,
              screenshotSha256: createHash('sha256').update(bytes).digest('hex') });
          } finally {
            await page.close();
          }
        }
      }
    }
    const summary = {};
    for (const name of Object.keys(rows[0].observed)) {
      summary[name] = { fullGridHits: rows.filter(row => row.observed[name].clipped).length,
        checkerboardHits: rows.filter(row => row.checkerboardSelected && row.observed[name].clipped).length };
    }
    const outputData = { fixtureHash, browserVersion, nodeVersion: process.version, configurations: rows.length, checks: rows.length * 4,
      assertionAgreement: rows.length * 4, clickChecksPassed: rows.length * 4, summary, rows };
    fs.writeFileSync(path.join(output, 'observations.json'), JSON.stringify(outputData, null, 2) + '\n');
    console.log(JSON.stringify({ browserVersion, configurations: rows.length, checks: rows.length * 4, summary }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
