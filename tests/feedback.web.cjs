// Run against an exported web build configured with EXPO_PUBLIC_API_URL=http://127.0.0.1:19099/api.
// All API calls use local fixtures. No real account or backend is contacted.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.FEEDBACK_TEST_URL || 'http://127.0.0.1:19098';
const artifactDir = process.env.FEEDBACK_ARTIFACT_DIR;
const fixture = () => ({ _id: 'task-1', title: 'Test task', description: 'Test description', category: 'Work', priority: 'medium', isCompleted: false, createdAt: new Date().toISOString() });
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    for (const [label, width, height, theme] of [['desktop-light', 1280, 900, 'light'], ['desktop-dark', 1280, 900, 'dark'], ['mobile-light', 390, 844, 'light'], ['mobile-dark', 390, 844, 'dark']].filter(([label]) => !process.env.FEEDBACK_TEST_CASES || label.includes(process.env.FEEDBACK_TEST_CASES))) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let browserAlerts = 0;
      page.on('dialog', async dialog => { browserAlerts++; await dialog.dismiss(); });
      let tasks = [fixture()], deletes = 0, failDelete = false, failSave = false, creates = 0;
      await page.addInitScript(value => {
        localStorage.setItem('vault-auth-token', 'local-ui-test');
        localStorage.setItem('vault-auth-user', JSON.stringify({ name: 'Test User', email: 'test@example.invalid' }));
        localStorage.setItem('vault-theme-preference', value);
      }, theme);
      await page.route('http://127.0.0.1:19099/**', async route => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' };
        let status = 200, body;
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (url.pathname === '/api/vault') { status = 404; body = { success: false }; }
        else if (method === 'DELETE') { deletes++; status = failDelete ? 500 : 200; if (!failDelete) tasks = []; body = { success: !failDelete, message: failDelete ? 'Delete failed' : 'Deleted' }; }
        else if (method === 'POST') { creates++; status = failSave ? 500 : 201; if (!failSave) tasks.push({ ...fixture(), ...request.postDataJSON(), _id: 'task-2' }); body = { success: !failSave, message: failSave ? 'Save failed' : 'Saved', data: tasks.at(-1) }; }
        else if (method === 'PUT') { tasks[0] = { ...tasks[0], ...request.postDataJSON() }; body = { success: true, data: tasks[0] }; }
        else if (url.pathname.endsWith('/stats')) body = { success: true, data: { total: tasks.length, completed: tasks.filter(t => t.isCompleted).length, pending: tasks.filter(t => !t.isCompleted).length, dueToday: 0 } };
        else body = { success: true, data: tasks, categories: ['Work'], pagination: { page: 1, total: tasks.length, totalPages: 1 } };
        await route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
      });
      await page.goto(`${base}/todos/`);
      await page.getByText('Test task', { exact: true }).waitFor();
      const remove = () => width >= 700 ? page.getByLabel('Delete task', { exact: true }).click() : page.getByText('⌫ Delete', { exact: true }).click();
      const dialog = title => page.getByRole('dialog', { name: title, exact: true });
      const done = async title => { await dialog(title).getByRole('button', { name: 'Done', exact: true }).click(); await dialog(title).waitFor({ state: 'hidden' }); };
      await remove();
      const confirmation = dialog('Delete Task?');
      await confirmation.waitFor();
      assert.equal(deletes, 0, 'opening confirmation must not delete');
      assert.ok((await confirmation.innerText()).includes('Are you sure you want to delete this task? This action cannot be undone.'));
      const box = await confirmation.boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
      await confirmation.getByRole('button', { name: 'Cancel' }).click();
      await confirmation.waitFor({ state: 'hidden' });
      assert.equal(deletes, 0, 'Cancel must not delete');
      await remove(); await confirmation.waitFor();
      await page.keyboard.press('Escape'); await confirmation.waitFor({ state: 'hidden' });
      assert.equal(deletes, 0, 'Escape must cancel');
      await remove(); await confirmation.waitFor();
      if (artifactDir) { await page.waitForTimeout(220); await page.screenshot({ path: `${artifactDir}/${label}-confirm.png` }); }
      failDelete = true;
      await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
      await dialog('Unable to delete task').waitFor();
      assert.equal(deletes, 1); assert.equal(await dialog('Task Deleted').count(), 0);
      await done('Unable to delete task');
      failDelete = false;
      await remove(); await confirmation.waitFor();
      await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
      await dialog('Task Deleted').waitFor(); assert.equal(deletes, 2);
      if (artifactDir) { await page.waitForTimeout(220); await page.screenshot({ path: `${artifactDir}/${label}-success.png` }); }
      await done('Task Deleted');
      // A failed save keeps the draft and renders an error above the existing form.
      if (width < 700) await page.getByLabel('Add task', { exact: true }).click();
      else await page.getByText('＋ Add Task', { exact: true }).click();
      await page.getByPlaceholder('What needs to be done?').fill('New task');
      failSave = true;
      await page.getByText('Add Task', { exact: true }).click();
      await dialog('Unable to add task').waitFor();
      assert.equal(await dialog('Task Created').count(), 0);
      if (artifactDir) { await page.waitForTimeout(220); await page.screenshot({ path: `${artifactDir}/${label}-error.png` }); }
      await done('Unable to add task');
      assert.equal(await page.getByPlaceholder('What needs to be done?').inputValue(), 'New task');
      failSave = false;
      await page.getByText('Add Task', { exact: true }).click();
      await dialog('Task Created').waitFor(); assert.equal(creates, 2);
      await done('Task Created');
      await page.getByRole('checkbox', { name: 'Mark task completed' }).click();
      await dialog('Task Completed').waitFor(); await done('Task Completed');
      await page.getByRole('checkbox', { name: 'Mark task pending' }).click();
      await dialog('Task Reopened').waitFor(); await done('Task Reopened');
      // Searching never produces success feedback.
      await page.getByPlaceholder('Search tasks...').fill('New');
      await page.waitForTimeout(700);
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert.equal(browserAlerts, 0); assert.deepEqual(errors, []);
      console.info(`${label}: confirmation/cancel/failure/success/draft preservation/completion/search passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
