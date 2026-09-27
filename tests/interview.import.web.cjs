// Read-only browser fixtures built from the actual import, not a second content source.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source = require('../../Backend/data/interview/1_170.json');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    for (const [width, theme] of [[1280, 'light'], [1280, 'dark'], [390, 'light'], [390, 'dark']]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.addInitScript(theme => {
        localStorage.setItem('vault-auth-token', 'fixture');
        localStorage.setItem('vault-auth-user', JSON.stringify({ name: 'Test', email: 'test@example.invalid' }));
        localStorage.setItem('vault-theme-preference', theme);
      }, theme);
      const stats = count => ({ questionCount: count, revisedCount: 0, importantCount: 0, percentage: 0 });
      const subject = { _id: 'java', name: 'Java', slug: 'java', ...stats(source.length) };
      const topics = [...new Set(source.map(q => q.topic))].map((name, i) => ({ _id: String(i), name, slug: 'topic-'+i, ...stats(source.filter(q => q.topic === name).length) }));
      const progress = { revised: false, important: false, revisionCount: 0, lastRevisedAt: null, lastOpenedAt: null };
      const questions = source.map(q => ({ ...q, _id: String(q.questionNumber), subject, topic: topics.find(t => t.name === q.topic), progress }));
      await page.route('http://127.0.0.1:19099/**', async route => {
        const url = new URL(route.request().url()), pathname = url.pathname.replace('/api/interview', '');
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization,Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        let data = [], extra = {};
        if (pathname === '/subjects') { data = [subject]; extra.overall = stats(170); }
        else if (pathname === '/subjects/java') data = { ...subject, topics };
        else if (pathname === '/continue') data = questions[0];
        else if (/^\/questions\/\d+\/open$/.test(pathname)) data = progress;
        else if (/^\/questions\/\d+$/.test(pathname)) { const i = Number(pathname.split('/')[2])-1; data = { ...questions[i], previous: questions[i-1] || null, next: questions[i+1] || null }; }
        await route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify({ success: true, data, ...extra }) });
      });
      const base = process.env.INTERVIEW_TEST_URL || 'http://127.0.0.1:19098';
      await page.goto(base+'/interview/');
      await page.getByText('170 Questions', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Open Java', exact: true }).click();
      for (const topic of topics) await page.getByRole('button', { name: 'Open '+topic.name, exact: true }).waitFor();
      await page.getByRole('button', { name: 'Continue revision', exact: true }).click();
      await page.getByText(source[0].question, { exact: true }).waitFor();
      await page.getByText('JDK = Development tools + Runtime', { exact: false }).first().waitFor();
      assert.equal(await page.getByText('```', { exact: false }).count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (process.env.INTERVIEW_ARTIFACT_DIR) await page.screenshot({ path: `${process.env.INTERVIEW_ARTIFACT_DIR}/import-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText(source[1].question, { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Previous', exact: true }).click();
      await page.getByText(source[0].question, { exact: true }).waitFor();
      console.info(`${width} ${theme}: 170-question home, nine topics, actual Markdown/code, navigation, no overflow passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
