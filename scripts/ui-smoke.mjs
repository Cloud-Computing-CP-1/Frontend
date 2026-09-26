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
let deploymentMode = 'normal';
let deploymentRequests = 0;
const deployRequests = [];
let deployResult = 'success';
let currentImageMode = 'ready';
let deployDelay = 1000;
let buildMode = 'queued';
let buildRequests = 0;
let savedPipelineEnv = null;
let useEmptyPipelineEnv = false;
let providerMode = 'outage';
let providerRequests = 0;
const cloudProviders = ['AWS', 'GCP', 'AZURE'].map((provider_name, index) => ({ id: String(index + 1), provider_name, is_enabled: true, created_at: '2026-09-23T12:02:12.072Z', updated_at: '2026-09-23T12:02:12.072Z' }));
const buildResult = {
  id: 'build-example', providerBuildId: 'provider-build-example', status: 'succeeded',
  repository: { url: 'https://github.com/example/api-service.git', owner: 'example', name: 'api-service' },
  project: { language: 'TypeScript', framework: 'Express', port: 3000, dockerfileGenerated: true },
  image: { registry: 'registry.example.com', repository: 'api-service', tag: 'main-123', reference: 'registry.example.com/api-service:main-123', pullCommand: 'docker pull registry.example.com/api-service:main-123' },
  logsUrl: 'https://example.test/build-logs',
};
const deployments = [
  { id: '41', project_id: '1', cloud_provider: 'GCP', status: 'FAILED', deployment_url: null, created_at: '2026-09-24T10:00:00Z' },
  { id: '43', project_id: '1', cloud_provider: 'AWS', status: 'RUNNING', deployment_url: 'https://api-service.deployforge.site', created_at: '2026-09-26T10:00:00Z' },
  { id: '42', project_id: '1', cloud_provider: 'AZURE', status: 'STOPPED', deployment_url: 'javascript:alert(1)', created_at: '2026-09-25T10:00:00Z' },
  { id: '99', project_id: '2', cloud_provider: 'AWS', status: 'RUNNING', deployment_url: 'https://another-project.example.test', created_at: '2026-09-27T10:00:00Z' },
].map(item => ({ ...item, image_id: '11', region: 'ap-south-1', provider_service: 'ECS_FARGATE', hostname: 'api-service.deployforge.site', provider_resource_id: `arn:aws:ecs:ap-south-1:123456789:service/${'long-resource-'.repeat(12)}`, updated_at: item.created_at }));
const projects = [
  { id: '1', projects_name: 'api-service', statuss: 'RUNNING', current_image_id: '11', deployment_url: 'https://api-service.deployforge.site' },
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
  if (request.method === 'OPTIONS') {
    await send('Fetch.fulfillRequest', { requestId: id, responseCode: 204, responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: 'content-type' }] });
    return;
  }
  let data;
  let status = 200;
  if (path.endsWith('/auth/getMyprofile')) {
    data = { id: '17', username: 'Alex Morgan', email: 'alex@example.test' };
    if (!authenticated) status = 401;
  } else if (path.endsWith('/project/get-projects')) {
    data = mode === 'empty' ? [] : projects;
    if (mode === 'error') status = 503;
  } else if (path.endsWith('/admin/get_all_provider')) {
    providerRequests++;
    assert.equal(request.method, 'GET');
    if (providerMode === 'slow') await pause(1200);
    data = providerMode === 'empty' ? [] : cloudProviders.map(provider => ({ ...provider, is_enabled: providerMode === 'invalid' ? 'false' : !(providerMode === 'outage' && provider.provider_name === 'AWS') }));
    if (providerMode === 'error') status = 503;
  } else if (path.includes('/deploy/depoyed-web-server/')) {
    deployRequests.push({ path, method: request.method, body: request.postData });
    await pause(deployDelay);
    if (deployResult === 'http-error') status = 503;
    else if (deployResult === 'success') {
      data = { status: 'RUNNING', deploymentUrl: 'https://new-deployment.example.test' };
      projects[0].deployment_url = data.deploymentUrl;
      deployments.push({ ...deployments[1], id: String(43 + deployRequests.length), deployment_url: data.deploymentUrl, created_at: '2026-09-28T10:00:00Z' });
    }
    else if (deployResult === 'no-url') data = { status: 'RUNNING' };
    else if (deployResult === 'provider-failed') data = { status: 'FAILED' };
  } else if (path.includes('/deploy/get-all-deploy-instance/')) {
    deploymentRequests++;
    if (deploymentMode === 'slow') await pause(1200);
    data = deploymentMode === 'empty' || !path.endsWith('/1') ? [] : deployments;
    if (deploymentMode === 'error') status = 503;
  } else if (path.includes('/get-current-ruining-image/')) data = path.endsWith('/1') ? { ...image, status_: currentImageMode === 'building' ? 'BUILDING' : 'READY', image_digest: currentImageMode === 'mismatch' ? 'different-build' : image.image_digest } : null;
  else if (path.includes('/build/image/project/')) data = path.endsWith('/1') ? [image, { ...image, id: '12', image_tags: 'previous-image' }] : [];
  else if (path.includes('/project/getenv/')) { envRequests++; data = useEmptyPipelineEnv ? savedPipelineEnv || [] : path.endsWith('/1') ? [{ key: 'NODE_ENV', value: 'production' }, { key: 'TEST_TOKEN', value: 'test-only-hidden-value' }] : []; }
  else if (path.endsWith('/project/Addenv')) { const payload = JSON.parse(request.postData); assert.equal(payload.project_id, '1'); savedPipelineEnv = Object.entries(payload.env).map(([key, value]) => ({ key, value })); data = {}; }
  else if (path.endsWith('/auth/getmyrepo')) data = [];
  else if (path.endsWith('/build/image') && request.method === 'POST') { buildRequests++; data = { ...buildResult, status: buildMode }; }
  else if (path.endsWith('/build/image/build-example')) data = buildResult;
  else if (path.includes('/build/image/')) data = { status: 'succeeded', logsUrl: 'https://example.test/build-logs' };
  else { unexpectedRequests++; status = 404; }
  const successful = status === 200 && !(path.includes('/deploy/depoyed-web-server/') && deployResult === 'api-error');
  await send('Fetch.fulfillRequest', { requestId: id, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' }], body: Buffer.from(JSON.stringify({ Status: successful, responseData: data, Sendmessage: successful ? 'OK' : 'Request failed' })).toString('base64') });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let count = 0; count < 100; count++) {
    try { if (await evaluate(expression)) return; } catch { /* navigation replaced the document */ }
    await pause(100);
  }
  throw new Error(`Not found: ${label}. Page: ${await evaluate('document.body.innerText.slice(0, 1800)')}`);
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
    } else if (event.method === 'Fetch.requestPaused') void intercept(event.params).catch(error => {
      // Navigating cancels in-flight queries; Chrome drops their interception IDs.
      if (error.message !== 'Invalid InterceptionId.') exceptions.push(error.message);
    });
    else if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.text);
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', resourceType: 'XHR' }, { urlPattern: '*', resourceType: 'Fetch' }, { urlPattern: '*/api/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  if (process.argv.includes('--providers-only')) {
    providerMode = 'slow';
    await navigate('/dashboard', 'Loading cloud provider status');
    await waitFor('document.querySelectorAll(".cloud-heartbeat-card.is-live").length === 3', 'provider logos and live status');
    assert.equal(await evaluate('document.querySelectorAll(".cloud-heartbeat-logo svg").length'), 3);
    assert.equal(await evaluate('document.querySelectorAll(".cloud-heartbeat button").length'), 0, 'provider controls must not be present');
    const beforePoll = providerRequests;
    providerMode = 'outage';
    await pause(15500);
    await waitFor(`document.querySelector('.cloud-heartbeat-card[data-provider="AWS"]')?.classList.contains('is-outage')`, 'AWS outage after polling');
    assert.ok(providerRequests > beforePoll, 'provider polling did not run');
    assert.equal(await evaluate('document.querySelectorAll(".cloud-heartbeat-card.is-live").length'), 2);
    assert.ok(await evaluate('document.querySelector(".cloud-heartbeat-summary").textContent.includes("2 of 3")'));
    await noOverflow();
    await screenshot('cloud-providers-desktop.png');
    providerMode = 'error';
    await pause(15500);
    await waitFor('document.querySelectorAll(".cloud-heartbeat-card.is-unknown").length === 3', 'stale provider states become unknown');
    assert.equal(await evaluate('document.querySelectorAll(".cloud-heartbeat-card.is-live, .cloud-heartbeat-card.is-outage").length'), 0);
    providerMode = 'invalid';
    await navigate('/dashboard', 'Could not refresh provider status');
    assert.equal(await evaluate('document.querySelectorAll(".cloud-heartbeat-card.is-live").length'), 0);
    providerMode = 'empty';
    await navigate('/dashboard', 'No cloud providers configured yet');
    providerMode = 'outage';
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate('/dashboard', 'Cloud heartbeat');
    await waitFor('document.querySelectorAll(".cloud-heartbeat-card").length === 3', 'mobile providers');
    await noOverflow();
    await screenshot('cloud-providers-mobile.png');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".is-live .cloud-heartbeat-badge i")).animationName'), 'none');
    assert.equal(unexpectedRequests, 0);
    assert.deepEqual(exceptions, []);
    console.log('PASS: provider GET API, live/outage logos, polling, stale/error/invalid/empty/loading states, no controls, reduced motion, desktop/mobile layout.');
    console.log(`Screenshots: ${directory}`);
  } else {

  if (!process.argv.includes("--pipeline-only")) {
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
  await waitFor('document.querySelectorAll(".deployment-record").length === 3', 'dashboard deployment history');
  await navigate('/projects/1?tab=deployments', 'Deployment history');
  await waitFor('document.querySelectorAll(".deployment-record").length === 3', 'project deployment records');
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".deployment-record")].map(item => item.dataset.deploymentId)'), ['43', '42', '41']);
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".deployment-stats strong")].map(item => item.textContent)'), ['3', '1', '1']);
  assert.equal(await evaluate(`document.querySelectorAll('.deployment-record a[href^="javascript:"]').length`), 0);
  assert.equal(await evaluate('document.querySelectorAll(".deployment-brand-aws, .deployment-brand-gcp, .deployment-brand-azure").length'), 4);
  await evaluate('document.querySelector(".deployment-details summary").click()');
  assert.ok(await evaluate('document.querySelector(".deployment-details").open'));
  await send('Browser.grantPermissions', { origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  await send('Page.bringToFront');
  await evaluate(`document.querySelector('.deployment-record [aria-label="Copy deployment URL"]').click()`);
  await waitFor('document.body.innerText.includes("Copied!")', 'URL copied');
  assert.equal(await evaluate('navigator.clipboard.readText()'), 'https://api-service.deployforge.site/');
  await evaluate('document.querySelector(".deployment-toolbar select").value = "FAILED"; document.querySelector(".deployment-toolbar select").dispatchEvent(new Event("change", { bubbles:true }))');
  await waitFor('document.querySelectorAll(".deployment-record").length === 1', 'deployment status filter');
  assert.equal(await evaluate('document.querySelector(".deployment-record").dataset.deploymentId'), '41');
  await evaluate('document.querySelector(".deployment-toolbar select").value = "all"; document.querySelector(".deployment-toolbar select").dispatchEvent(new Event("change", { bubbles:true }))');
  const beforeRefresh = deploymentRequests;
  await evaluate(`document.querySelector('[aria-label="Refresh deployments"]').click()`);
  await waitFor(`!document.querySelector('[aria-label="Refresh deployments"]').disabled`, 'deployment refresh');
  assert.ok(deploymentRequests > beforeRefresh);
  await screenshot('deployments-desktop.png');
  await noOverflow();

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/projects/1?tab=deployments', 'Deployment history');
  await waitFor('document.querySelectorAll(".deployment-record").length === 3', 'mobile deployment history');
  await evaluate('document.querySelector(".deployment-details summary").click()');
  await noOverflow();
  await screenshot('deployments-mobile.png');
  await navigate('/projects/2?tab=deployments', 'Your first deployment starts here');
  assert.equal(await evaluate('document.querySelectorAll(".deployment-record").length'), 0);
  deploymentMode = 'slow';
  await navigate('/projects/1?tab=deployments', 'Loading your deployments...');
  await waitFor('document.querySelectorAll(".deployment-record").length === 3', 'deployment load completion');
  deploymentMode = 'error';
  await navigate('/projects/1?tab=deployments', 'Could not load deployments');
  deploymentMode = 'normal';
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent === "Try again").click()');
  await waitFor('document.querySelectorAll(".deployment-record").length === 3', 'deployment retry');
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
  await navigate('/', 'Deploy Once.');
  await evaluate('document.querySelector("#public-menu-toggle").click()');
  await waitFor('document.body.innerText.includes("Dashboard")', 'mobile dashboard link');
  await noOverflow();
  await screenshot('navbar-mobile.png');
  mode = 'empty';
  await navigate('/dashboard', 'Your next project starts here');
  mode = 'error';
  await navigate('/dashboard', 'Could not load projects');
  mode = 'normal';
  await navigate('/projects/1?tab=deployments', 'Deployment history');
  await waitFor('!document.querySelector(".deployment-launch button.dfw-primary").disabled', 'deploy action ready');
  assert.equal(deployRequests.length, 0, 'deploy must never run automatically');
  const historyRequestsBeforeDeploy = deploymentRequests;
  await evaluate('document.querySelector(".deployment-launch button.dfw-primary").click(); document.querySelector(".deployment-launch button.dfw-primary").click()');
  await waitFor('document.querySelector(".deployment-launch button.dfw-primary").disabled && document.body.innerText.includes("Deploying...")', 'deployment progress');
  await waitFor('document.body.innerText.includes("Deployment request completed")', 'deployment success');
  assert.equal(deployRequests.length, 1, 'duplicate deploy request');
  assert.ok(deployRequests[0].path.endsWith('/deploy/depoyed-web-server/1'));
  assert.equal(deployRequests[0].method, 'GET');
  assert.equal(deployRequests[0].body, undefined);
  assert.ok(deploymentRequests > historyRequestsBeforeDeploy, 'history was not refreshed');
  await waitFor('document.querySelectorAll(".deployment-record").length === 4', 'new deployment in history');
  assert.equal(await evaluate('document.querySelector(".deployment-domain").href'), 'https://new-deployment.example.test/');
  await noOverflow();
  await screenshot('deploy-success-mobile.png');
  await navigate('/projects/1/images/12', 'previous-image');
  await waitFor('document.body.innerText.includes("This is a previous build")', 'archived image guard');
  assert.ok(await evaluate('document.querySelector(".deployment-launch button.dfw-primary").disabled'));
  await navigate('/projects/2?tab=deployments', 'Build an image before deploying this project');
  assert.ok(await evaluate('document.querySelector(".deployment-launch button.dfw-primary").disabled'));
  currentImageMode = 'building';
  await navigate('/projects/1?tab=deployments', 'The current image must finish building');
  assert.ok(await evaluate('document.querySelector(".deployment-launch button.dfw-primary").disabled'));
  currentImageMode = 'ready';
  deployResult = 'http-error';
  await navigate('/projects/1/images/11', 'Deploy current image');
  await waitFor('!document.querySelector(".deployment-launch button.dfw-primary").disabled', 'image deploy action ready');
  await evaluate('document.querySelector(".deployment-launch button.dfw-primary").click()');
  await waitFor('document.body.innerText.includes("Deployment request failed")', 'deployment HTTP error');
  await pause(1500);
  assert.equal(deployRequests.length, 2, 'failed deployment was retried automatically');
  assert.equal(await evaluate('document.body.innerText.includes("Deployment request completed")'), false);
  deployResult = 'api-error';
  await evaluate('document.querySelector(".deployment-launch button.dfw-primary").click()');
  await waitFor('document.querySelector(".deployment-launch [role=alert]")?.textContent.includes("Request failed")', 'deployment API error');
  assert.equal(deployRequests.length, 3);
  }
  // Exercise the build page itself: it must deploy only after a successful build.
  const deployCountBeforePipeline = deployRequests.length;
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  deployResult = 'success';
  useEmptyPipelineEnv = true;
  await navigate('/projects/1', 'Current project image');
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Build Image").click()');
  await waitFor('location.pathname === "/build"', 'build page');
  await waitFor('document.querySelector(".build-pipeline") !== null', 'build page rendered');
  buildMode = 'failed';
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Build Image").click()');
  await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Build failed")', 'failed build feedback');
  assert.equal(await evaluate('document.body.textContent.includes("Image Built Successfully")'), false);
  assert.equal(deployRequests.length, deployCountBeforePipeline);
  buildMode = 'queued';
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Build Image").click()');
  await waitFor('document.body.innerText.includes("Building Docker Image")', 'queued build progress');
  assert.equal(await evaluate('document.body.textContent.includes("Image Built Successfully")'), false);
  await waitFor('document.body.textContent.includes("Image Built Successfully")', 'successful build polling');
  currentImageMode = 'mismatch';
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Deploy Application").click()');
  await waitFor('document.body.innerText.includes("no longer the project")', 'build identity guard');
  assert.equal(deployRequests.length, deployCountBeforePipeline);
  assert.deepEqual(savedPipelineEnv, [{ key: 'NODE_ENV', value: 'production' }, { key: 'PORT', value: '3000' }]);
  currentImageMode = 'ready';
  deployResult = 'provider-failed';
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Deploy Application").click()');
  await waitFor('document.body.innerText.includes("cloud provider reported a failed deployment")', 'provider failed result');
  assert.equal(await evaluate(`document.querySelector('[aria-label="Deployment result"]') !== null`), false);
  deployResult = 'success';
  deployDelay = 4500;
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Deploy Application").click()');
  await waitFor('document.body.innerText.includes("Waiting for the cloud provider")', 'real deployment pending');
  await pause(3600);
  assert.equal(await evaluate('document.body.innerText.includes("Deployment response received")'), false, 'deployment completed using a fake timer');
  await waitFor('document.body.innerText.includes("Deployment response received")', 'real deployment result');
  assert.ok(await evaluate('document.querySelector(".build-result.is-successful h2")?.textContent.includes("successfully!")'));
  assert.ok(await evaluate('document.querySelector(".build-result-confetti")?.getAttribute("aria-hidden") === "true"'));
  assert.equal(deployRequests.length, deployCountBeforePipeline + 2);
  assert.equal(await evaluate(`document.querySelector('[aria-label="Deployment result"] a').href`), 'https://new-deployment.example.test/');
  assert.equal(await evaluate('document.body.innerText.includes("deployforge.app") || document.body.innerText.includes("240+ PoPs") || document.body.innerText.includes("14ms")'), false);
  await noOverflow();
  await screenshot('build-deployed-mobile.png');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await noOverflow();
  await screenshot('build-deployed-desktop.png');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".build-result-confetti")).display'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".build-result-emblem")).animationName'), 'none');
  await send('Emulation.setEmulatedMedia', { features: [] });
  assert.equal(buildRequests, 2, 'deployment unexpectedly started another build');
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Build a new image").click()');
  await waitFor('document.body.textContent.includes("Image Built Successfully")', 'rebuild completed');
  deployResult = 'no-url';
  deployDelay = 1000;
  await evaluate('[...document.querySelectorAll("button")].find(item => item.textContent.trim() === "Deploy Application").click()');
  await waitFor('document.body.innerText.includes("Deployment URL not available yet")', 'missing URL fallback');
  assert.equal(await evaluate('document.querySelector(".build-result-confetti") !== null'), false);
  assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Deployment result"] a[target="_blank"]').length`), 0);
  assert.equal(unexpectedRequests, 0, 'unexpected API requests were intercepted');
  assert.deepEqual(exceptions, [], 'browser runtime errors');
  console.log('PASS: build failure/queued/success, saved environment, current-build guard, delayed deployment response, provider failure, backend URL and missing-URL fallback.');
  if (!process.argv.includes('--pipeline-only')) console.log('PASS: deploy action/history and existing desktop/mobile workspace checks.');
  console.log(`Screenshots: ${directory}`);
  }
} finally {
  socket?.close();
  chrome.kill();
}
