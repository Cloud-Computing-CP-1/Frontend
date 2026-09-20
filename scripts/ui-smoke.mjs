// Browser smoke checks with synthetic API responses; never contacts the backend.
// Start Vite, then run: node scripts/ui-smoke.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.UI_TEST_URL || 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const directory = await mkdtemp(join(tmpdir(), 'deployforge-ui-'));
const port = 9437;
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-background-networking', `--remote-debugging-port=${port}`, `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let requestId = 0;
const waiting = new Map();
const exceptions = [];
let mode = 'normal';
let authenticated = true;
let envRequests = 0;
let unexpectedRequests = 0;
const projects = [
  { id: '1', projects_name: 'api-service', statuss: 'RUNNING', current_image_id: '11' },
  { id: '2', projects_name: 'web-app', statuss: 'STOPPED', current_image_id: null },
  { id: '3', projects_name: 'worker', statuss: 'FAILED', current_image_id: null },
].map(project => ({ ...project, user_id: '17', repo_id: project.id, repo_name: `https://github.com/example/${project.projects_name}.git`, repo_owner: 'example', branch: 'main', cloud_provider: 'AWS', created_at: '2026-09-19T12:00:00Z', updated_at: '2026-09-20T12:00:00Z' }));
const image = { id: '11', project_id: '1', repo_id: '1', branch: 'main', image_uri: 'registry.example.com/api-service:main-123', image_tags: 'api-service-main-123', image_digest: 'build-example', status_: 'READY', build_start_at: '2026-09-20T12:00:00Z', build_completed_at: '2026-09-20T12:02:00Z', created_at: '2026-09-20T12:02:00Z' };

function send(method, params = {}) {
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    waiting.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function intercept({ requestId: id, request }) {
  const path = new URL(request.url).pathname;
  let data;
  let status = 200;
  if (path.endsWith('/auth/getMyprofile')) {
    data = { id: '17', username: 'Alex Morgan', email: 'alex@example.test' };
    if (!authenticated) status = 401;
  } else if (path.endsWith('/project/get-projects')) {
    data = mode === 'empty' ? [] : projects;
    if (mode === 'error') status = 503;
  } else if (path.includes('/get-current-ruining-image/')) data = path.endsWith('/1') ? image : null;
  else if (path.includes('/build/image/project/')) data = path.endsWith('/1') ? [image] : [];
  else if (path.includes('/project/getenv/')) { envRequests++; data = path.endsWith('/1') ? [{ key: 'NODE_ENV', value: 'production' }, { key: 'TEST_TOKEN', value: 'test-only-hidden-value' }] : []; }
  else if (path.endsWith('/auth/getmyrepo')) data = [];
  else if (path.includes('/build/image/')) data = { status: 'succeeded', logsUrl: 'https://example.test/build-logs' };
  else { unexpectedRequests++; status = 404; }
  await send('Fetch.fulfillRequest', { requestId: id, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' }], body: Buffer.from(JSON.stringify({ Status: status === 200, responseData: data, Sendmessage: status === 200 ? 'OK' : 'Request failed' })).toString('base64') });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let count = 0; count < 100; count++) {
    try { if (await evaluate(expression)) return; } catch { /* navigation replaced the document */ }
    await pause(100);
  }
  throw new Error(`Not found: ${label}`);
}
async function navigate(path, text) {
  await send('Page.navigate', { url: `${origin}${path}` });
  await waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`, text);
}
async function screenshot(name) {
  await pause(300);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(join(directory, name), Buffer.from(data, 'base64'));
}
async function noOverflow() {
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'page has horizontal overflow');
}

try {
  let pages;
  for (let attempt = 0; attempt < 70; attempt++) {
    try { pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await pause(100); }
  }
  const page = pages?.find(item => item.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl, 'Chrome did not start');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) {
      const pending = waiting.get(event.id);
      if (pending) { waiting.delete(event.id); if (event.error) pending.reject(new Error(event.error.message)); else pending.resolve(event.result); }
    } else if (event.method === 'Fetch.requestPaused') void intercept(event.params).catch(error => exceptions.push(error.message));
    else if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.text);
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', resourceType: 'XHR' }, { urlPattern: '*', resourceType: 'Fetch' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  authenticated = false;
  await navigate('/', 'Login');
  assert.equal(await evaluate('document.querySelector(".df-public-actions a")?.textContent'), 'Login');
  authenticated = true;
  await navigate('/', 'Dashboard');
  assert.equal(await evaluate('document.querySelector(".df-public-actions a")?.getAttribute("href")'), '/dashboard');
  await screenshot('navbar-desktop.png');
  await navigate('/dashboard', 'api-service-main-123');
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".dfw-stat strong")].map(item => item.textContent)'), ['3', '1', '1', '1']);
  assert.equal(envRequests, 0, 'overview fetched secret values unnecessarily');
  await noOverflow();
  await screenshot('dashboard-desktop.png');
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Logs").click()');
  await waitFor('document.body.innerText.includes("Open provider logs")', 'provider logs');
  await evaluate('[...document.querySelectorAll(".dfw-project-select")].find(item => item.textContent.includes("web-app")).click()');
  await waitFor('document.querySelector(".dfw-activity h2")?.textContent === "web-app"', 'project selection');
  await waitFor('document.body.innerText.includes("No current image selected")', 'no current image');
  await navigate('/projects/1?tab=environment', 'TEST_TOKEN');
  assert.equal(await evaluate('document.body.innerText.includes("test-only-hidden-value")'), false, 'secret visible by default');
  await evaluate(`document.querySelector('[aria-label="Reveal TEST_TOKEN value"]').click()`);
  assert.ok(await evaluate('document.body.innerText.includes("test-only-hidden-value")'));
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.includes("Hide all values")).click()');
  assert.equal(await evaluate('document.body.innerText.includes("test-only-hidden-value")'), false);
  await noOverflow();
  await screenshot('environment-desktop.png');
  await navigate('/projects/1?tab=settings', 'Project settings');
  await navigate('/projects/1/images/11', 'api-service-main-123');
  await waitFor('document.body.innerText.includes("TEST_TOKEN")', 'image environment');
  await navigate('/dashboard?view=deployments&project=1', 'Build history');
  await noOverflow();

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/dashboard', 'api-service-main-123');
  await noOverflow();
  await screenshot('dashboard-mobile.png');
  await evaluate(`document.querySelector('[aria-label="Open workspace navigation"]').click()`);
  assert.ok(await evaluate('document.querySelector(".dfw-drawer").open'));
  await screenshot('drawer-mobile.png');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector(".dfw-drawer").open', 'drawer escape');
  await navigate('/projects/1?tab=environment', 'TEST_TOKEN');
  await noOverflow();
  await screenshot('environment-mobile.png');
  await navigate('/', 'Dashboard');
  await evaluate('document.querySelector("#public-menu-toggle").click()');
  await noOverflow();
  await screenshot('navbar-mobile.png');
  mode = 'empty';
  await navigate('/dashboard', 'Your next project starts here');
  mode = 'error';
  await navigate('/dashboard', 'Could not load projects');
  assert.equal(unexpectedRequests, 0, 'unexpected API requests were intercepted');
  assert.deepEqual(exceptions, [], 'browser runtime errors');
  console.log('PASS: auth states, project counts, selection, logs, environment masking, routes, desktop/mobile overflow, drawer, empty/error states.');
  console.log(`Screenshots: ${directory}`);
} finally {
  socket?.close();
  chrome.kill();
}
