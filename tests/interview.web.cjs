// Fixture-only web checks. Run against Expo export configured for http://127.0.0.1:19099/api.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.INTERVIEW_TEST_URL || 'http://127.0.0.1:19098';
const artifacts = process.env.INTERVIEW_ARTIFACT_DIR;
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    for (const [label, width, height, theme] of [['desktop-light',1280,900,'light'], ['desktop-dark',1280,900,'dark'], ['mobile-light',390,844,'light'], ['mobile-dark',390,844,'dark']]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      let alerts = 0; page.on('dialog', async d => { alerts++; await d.dismiss(); });
      await page.addInitScript(theme => {
        localStorage.setItem('vault-auth-token', 'local-test');
        localStorage.setItem('vault-auth-user', JSON.stringify({ name: 'Test User', email: 'test@example.invalid' }));
        localStorage.setItem('vault-theme-preference', theme);
      }, theme);
      let populated = false, failSave = false, failLoad = false, last = null, writes = 0;
      const blank = () => ({ revised: false, important: false, revisionCount: 0, lastRevisedAt: null, lastOpenedAt: null });
      const progress = { q1: blank(), q2: blank() };
      const stats = (questions = []) => { const revisedCount = questions.filter(q => q.progress.revised).length; return { questionCount: questions.length, revisedCount, importantCount: questions.filter(q => q.progress.important).length, percentage: questions.length ? Math.round(100 * revisedCount / questions.length) : 0 }; };
      const subject = { _id: 'java', slug: 'java', name: 'Java', description: 'Build confidence with Java interview revision.', order: 1, plannedQuestionCount: 140 };
      const topics = [['Fundamentals & OOP','fundamentals-oop',1,43],['Collections','collections',44,78],['Multithreading','multithreading',79,103],['Java 8+','java-8-plus',104,129],['Modern Java','modern-java',130,140]].map(([name,slug,start,end],i) => ({ _id: slug, subjectId: 'java', name, slug, order: i, plannedQuestionCount: end-start+1, questionNumberStart: start, questionNumberEnd: end }));
      const questions = () => populated ? [1,2].map(n => ({ _id: `q${n}`, subjectId: 'java', topicId: 'fundamentals-oop', subject, topic: topics[0], questionNumber: n, order: n, question: `Fixture question ${n}?`, answer: `Fixture answer ${n}.`, ...(n === 2 ? { example: '```java\nfixture();\n```', interviewTip: 'Fixture interview tip.' } : {}), tags: ['fixture'], progress: { ...progress[`q${n}`] } })) : [];
      const withStats = topic => ({ ...topic, ...stats(questions().filter(q => q.topicId === topic._id)) });
      await page.route('http://127.0.0.1:19099/**', async route => {
        const req = route.request(), url = new URL(req.url()), method = req.method();
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' };
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
        let data, extra = {}, status = 200;
        const path = url.pathname.replace('/api/interview', '');
        if (url.pathname === '/api/vault') { status = 404; }
        else if (failLoad && path === '/subjects') { status = 500; }
        else if (path === '/subjects') { data = [{ ...subject, ...stats(questions()) }]; extra.overall = stats(questions()); }
        else if (path === '/subjects/java') data = { ...subject, ...stats(questions()), topics: topics.map(withStats) };
        else if (path.startsWith('/subjects/java/topics/')) data = { ...withStats(topics.find(t => path.endsWith(t.slug))), subject };
        else if (path === '/continue') data = questions().find(q => q._id === last) || questions().find(q => !q.progress.revised) || questions()[0] || null;
        else if (path === '/questions') {
          let list = questions(); const search = (url.searchParams.get('search') || '').toLowerCase(), filter = url.searchParams.get('status'), topic = url.searchParams.get('topic');
          if (topic) list = list.filter(q => q.topic.slug === topic);
          if (search) list = list.filter(q => q.question.toLowerCase().includes(search));
          if (filter === 'revised') list = list.filter(q => q.progress.revised);
          if (filter === 'unrevised') list = list.filter(q => !q.progress.revised);
          if (filter === 'important') list = list.filter(q => q.progress.important);
          data = list; extra.pagination = { page: 1, limit: 20, total: list.length, totalPages: list.length ? 1 : 0, hasNextPage: false, hasPreviousPage: false };
        } else if (path.startsWith('/questions/')) {
          const id = path.split('/')[2];
          if (path.endsWith('/open')) { last = id; progress[id].lastOpenedAt = new Date().toISOString(); data = progress[id]; }
          else if (method === 'PATCH') {
            writes++;
            if (failSave) status = 500;
            else { const patch = req.postDataJSON(); if (patch.revised && !progress[id].revised) { progress[id].revisionCount++; progress[id].lastRevisedAt = new Date().toISOString(); } Object.assign(progress[id], patch); data = progress[id]; }
          } else { data = { ...questions().find(q => q._id === id), previous: id === 'q2' ? { _id: 'q1' } : null, next: id === 'q1' ? { _id: 'q2' } : null }; }
        } else data = [];
        await route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: status === 200, data, ...extra }) });
      });
      const screenshot = async suffix => { if (artifacts) await page.screenshot({ path: `${artifacts}/${label}-${suffix}.png`, fullPage: true }); };
      const close = async title => { const dialog = page.getByRole('dialog', { name: title, exact: true }); await dialog.waitFor(); await dialog.getByRole('button', { name: 'Done', exact: true }).click(); await dialog.waitFor({ state: 'hidden' }); };
      await page.goto(`${base}/interview/`);
      await page.getByText('140 Questions planned', { exact: true }).waitFor();
      assert.equal(writes, 0); await screenshot('home');
      await page.getByRole('button', { name: 'Open Java', exact: true }).click();
      await page.getByRole('button', { name: 'Open Modern Java', exact: true }).waitFor();
      await screenshot('topics');
      await page.getByRole('button', { name: 'Open Fundamentals & OOP', exact: true }).click();
      await page.getByText('This topic is ready. Questions will appear here once the content is added.', { exact: true }).waitFor();
      await screenshot('empty');
      populated = true;
      await page.reload();
      await page.getByRole('button', { name: 'Open Q1: Fixture question 1?', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Important', exact: true }).click();
      await page.getByText('No matching questions', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'All', exact: true }).click();
      await page.getByPlaceholder('Search interview questions…').fill('question 2');
      await page.getByRole('button', { name: 'Open Q2: Fixture question 2?', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Open Q1: Fixture question 1?', exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.getByPlaceholder('Search interview questions…').fill('');
      await page.getByRole('button', { name: 'Open Q1: Fixture question 1?', exact: true }).click();
      await page.getByText('Fixture answer 1.', { exact: true }).waitFor();
      assert.equal(await page.getByText('EXAMPLE', { exact: true }).count(), 0);
      assert.equal(await page.getByText('INTERVIEW TIP', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Previous', exact: true }).getAttribute('aria-disabled'), 'true');
      await page.getByRole('button', { name: 'Mark Revised', exact: true }).click(); await close('Question Revised');
      assert.equal(progress.q1.revisionCount, 1);
      await page.getByRole('button', { name: '☆ Mark Important', exact: true }).click(); await close('Marked Important');
      failSave = true;
      await page.getByRole('button', { name: '★ Important', exact: true }).click(); await close('Unable to Save Progress');
      assert.equal(progress.q1.important, true);
      failSave = false;
      await page.getByRole('button', { name: '★ Important', exact: true }).click(); await close('Removed from Important');
      assert.equal(progress.q1.important, false);
      await page.getByRole('button', { name: '✓ Revised · Mark Unrevised', exact: true }).click(); await close('Marked Unrevised');
      assert.equal(progress.q1.revised, false); assert.equal(progress.q1.revisionCount, 1);
      await page.getByRole('button', { name: 'Mark Revised', exact: true }).click(); await close('Question Revised');
      assert.equal(progress.q1.revisionCount, 2);
      await screenshot('question');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('fixture();', { exact: true }).waitFor(); await page.getByText('Fixture interview tip.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).getAttribute('aria-disabled'), 'true');
      assert.equal(await page.getByText('```', { exact: false }).count(), 0);
      await screenshot('example');
      await page.goto(`${base}/interview/`);
      await page.getByRole('button', { name: 'Continue revision', exact: true }).click();
      await page.getByText('Fixture answer 2.', { exact: true }).waitFor();
      assert.equal(last, 'q2');
      failLoad = true; await page.goto(`${base}/interview/`);
      await page.getByText('Unable to load interview prep', { exact: true }).waitFor();
      failLoad = false; await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await page.getByRole('button', { name: 'Open Java', exact: true }).waitFor();
      assert.equal(alerts, 0); assert.deepEqual(errors, []);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      console.info(`${label}: empty catalog, routes, search/filters, progress success/failure, optional content, continue, retry passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
