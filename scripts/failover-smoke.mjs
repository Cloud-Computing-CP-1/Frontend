// Run against Vite with: node scripts/failover-smoke.mjs
// API requests are intercepted; this demo never depends on backend data.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.UI_TEST_URL || 'http://127.0.0.1:5173';
const directory = await mkdtemp(join(tmpdir(), 'deployforge-failover-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=9438', `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const waiting = new Map();
const exceptions = [];
let socket;
let sequence = 0;
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    waiting.set(id, { resolve: result => { clearTimeout(timeout); resolve(result); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let n = 0; n < 100; n++) {
    try { if (await evaluate(expression)) return; } catch { /* document navigating */ }
    await pause(100);
  }
  throw new Error(`Not found: ${label}`);
}
const phaseExpression = 'document.querySelector(".failover-demo")?.dataset.phase';
const click = label => evaluate(`document.querySelector('button[aria-label="${label}"]').click()`);
async function capture(name) {
  const clip = await evaluate('(() => { const r = document.querySelector(".failover-demo").getBoundingClientRect(); return { x:r.x+scrollX, y:r.y+scrollY, width:r.width, height:r.height, scale:1 }; })()');
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
  await writeFile(join(directory, `${name}.png`), Buffer.from(data, 'base64'));
}
try {
  let pages;
  for (let n = 0; n < 80; n++) {
    try { pages = await (await fetch('http://127.0.0.1:9438/json')).json(); break; } catch { await pause(100); }
  }
  assert.ok(pages?.some(page => page.type === 'page'), 'Chrome did not start');
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) {
      const pending = waiting.get(event.id);
      if (pending) { waiting.delete(event.id); if (event.error) pending.reject(new Error(event.error.message)); else pending.resolve(event.result); }
    } else if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.text);
    else if (event.method === 'Fetch.requestPaused') {
      void send('Fetch.fulfillRequest', { requestId: event.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' }], body: Buffer.from(JSON.stringify({ Status: true, responseData: null })).toString('base64') }).catch(error => exceptions.push(error.message));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', resourceType: 'XHR' }, { urlPattern: '*', resourceType: 'Fetch' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin });
  await waitFor('Boolean(document.querySelector(".failover-demo"))', 'demo');
  await click('Pause demo');
  await pause(150);
  for (const [width, height] of [[1440,900], [1280,720], [768,768], [390,844], [320,568]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 681 });
    await evaluate('scrollTo(0,0)');
    await pause(150);
    const layout = await evaluate('(() => { const e=document.querySelector(".failover-demo"),r=e.getBoundingClientRect(); return { top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,overflow:e.scrollWidth>e.clientWidth }; })()');
    assert.ok(layout.top >= 0 && layout.bottom <= height && layout.left >= 0 && layout.right <= width && !layout.overflow, `Diagram must fit without scrolling at ${width}x${height}: ${JSON.stringify(layout)}`);
    console.log(`Entire diagram visible at ${width}x${height} (${Math.round(layout.height)}px tall)`);
    if (width === 390) await capture('mobile');
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await evaluate('scrollTo(0,0)');
  await click('Replay demo');
  await pause(150);
  await capture('aws-healthy');
  const seen = [];
  const changes = new Map();
  const started = Date.now();
  let looped = false;
  while (Date.now() - started < 32000) {
    const state = await evaluate(`(() => { const e=document.querySelector('.failover-demo'); return {phase:e.dataset.phase, aws:document.querySelector('[data-cloud="aws"]').dataset.status,gcp:document.querySelector('[data-cloud="gcp"]').dataset.status,azure:document.querySelector('[data-cloud="azure"]').dataset.status,failedParticles:document.querySelectorAll('.failover-route.is-outage .failover-particle').length, app:document.querySelector('.failover-app').textContent, routed:[...document.querySelectorAll('.failover-wire')[1].children].flatMap((route,index)=>route.querySelector('.failover-particle')?[index]:[]) }; })()`);
    assert.equal(state.failedParticles, 0, 'Failed route must never animate traffic');
    const expectedRoute = state.phase === 'NORMAL_AWS' ? [0] : ['RUNNING_GCP','MONITORING_GCP'].includes(state.phase) ? [1] : ['RUNNING_AZURE','MONITORING_AZURE','RESET'].includes(state.phase) ? [2] : [];
    assert.deepEqual(state.routed, expectedRoute, `Traffic may only reach the application from its healthy primary: ${state.phase}`);
    assert.ok(state.app.includes('Running'), 'Application stays running throughout the demo');
    if (state.phase !== seen.at(-1)) {
      if (state.phase === 'NORMAL_AWS' && seen.length > 1) { looped = true; break; }
      seen.push(state.phase); changes.set(state.phase, Date.now() - started);
      if (state.phase === 'AWS_FAILURE') { assert.equal(state.aws, 'outage'); assert.equal(state.gcp, 'standby'); await capture('outage'); }
      if (state.phase === 'GCP_STARTING') { assert.equal(state.gcp, 'starting'); await capture('starting'); }
      if (state.phase === 'RUNNING_GCP') { assert.equal(state.aws, 'outage'); assert.equal(state.gcp, 'primary'); assert.ok(state.app.includes('Running on Google Cloud')); await capture('recovered'); }
      if (state.phase === 'GCP_FAILURE') { assert.equal(state.aws, 'outage'); assert.equal(state.gcp, 'outage'); assert.equal(state.azure, 'standby'); assert.ok(await evaluate('document.querySelector("[data-cloud=gcp]").classList.contains("outage-pulse")')); await capture('gcp-outage'); }
      if (state.phase === 'AZURE_STARTING') { assert.equal(state.azure, 'starting'); assert.equal(state.aws, 'outage'); assert.equal(state.gcp, 'outage'); await capture('azure-starting'); }
      if (state.phase === 'AZURE_HEALTHY') assert.equal(state.azure, 'healthy');
      if (state.phase === 'RUNNING_AZURE') { assert.equal(state.aws, 'outage'); assert.equal(state.gcp, 'outage'); assert.equal(state.azure, 'primary'); assert.ok(state.app.includes('Running on Microsoft Azure')); await capture('azure-recovered'); }
      if (state.phase === 'MONITORING_AZURE') assert.ok(await evaluate('document.querySelector(".failover-tagline").textContent.includes("Application remained available despite multiple cloud failures.")'));
    }
    await pause(80);
  }
  assert.ok(looped, 'Animation must return automatically to AWS');
  assert.deepEqual(seen, ['NORMAL_AWS','AWS_FAILURE','DETECTING_AWS_FAILURE','FAILOVER_TO_GCP','GCP_STARTING','GCP_HEALTHY','REDIRECTING_TO_GCP','RUNNING_GCP','MONITORING_GCP','GCP_FAILURE','DETECTING_GCP_FAILURE','FAILOVER_TO_AZURE','AZURE_SELECTED','AZURE_STARTING','AZURE_HEALTHY','REDIRECTING_TO_AZURE','RUNNING_AZURE','MONITORING_AZURE','RESET']);
  assert.ok(changes.get('FAILOVER_TO_GCP') - changes.get('AWS_FAILURE') >= 750, 'Keep outage visible before selecting a replacement');
  assert.ok(changes.get('FAILOVER_TO_AZURE') - changes.get('GCP_FAILURE') >= 1100, 'Second outage must be detected before failover');
  const gcpHold = changes.get('GCP_FAILURE') - changes.get('RUNNING_GCP');
  const azureHold = changes.get('RESET') - changes.get('RUNNING_AZURE');
  assert.ok(gcpHold >= 2800 && gcpHold <= 3400, `Google Cloud should serve for about 3 seconds: ${gcpHold}ms`);
  assert.ok(azureHold >= 3800 && azureHold <= 4400, `Azure should serve for about 4 seconds: ${azureHold}ms`);
  console.log('Full AWS → Google Cloud → Azure loop passed, including detection delays, healthy-only routing, 3s/4s holds, and reset.');
  await click('Pause demo');
  await pause(100);
  const frozen = await evaluate(phaseExpression);
  await pause(3200);
  assert.equal(await evaluate(phaseExpression), frozen, 'Pause must stop state changes');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".failover-particle")).animationPlayState'), 'paused');
  await click('Replay demo');
  await pause(100);
  assert.equal(await evaluate(phaseExpression), 'NORMAL_AWS');
  await waitFor(`${phaseExpression} === 'AWS_FAILURE'`, 'replay restarts timer');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await waitFor(`Boolean(document.querySelector('button[aria-label="Next demo step"]'))`, 'reduced-motion controls');
  await click('Replay demo');
  await pause(3200);
  assert.equal(await evaluate(phaseExpression), 'NORMAL_AWS', 'Reduced motion must disable autoplay');
  await click('Next demo step');
  await pause(100);
  assert.equal(await evaluate(phaseExpression), 'AWS_FAILURE');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, deviceScaleFactor: 1, mobile: true });
  await evaluate('scrollTo(0,0)');
  for (let step = 0; step < 18; step++) {
    await click('Next demo step');
    await pause(60);
    const fits = await evaluate('(() => { const e=document.querySelector(".failover-demo"),r=e.getBoundingClientRect(),tagline=e.querySelector(".failover-tagline"); return r.top>=0 && r.bottom<=innerHeight && r.right<=innerWidth && e.scrollWidth<=e.clientWidth && tagline.scrollHeight<=tagline.clientHeight+1 && [...e.querySelectorAll(".failover-provider,.failover-router")].every(node=>[...node.children].every(child=>{const bounds=node.getBoundingClientRect(),content=child.getBoundingClientRect();return content.top>=bounds.top-1 && content.bottom<=bounds.bottom+1 && content.left>=bounds.left-1 && content.right<=bounds.right+1;})); })()');
    assert.ok(fits, `Every phase must fit on a small phone: ${await evaluate(phaseExpression)} ${await evaluate('JSON.stringify([...document.querySelectorAll(".failover-demo,.failover-provider,.failover-router,.failover-tagline")].map(e=>({class:e.className,height:e.clientHeight,scroll:e.scrollHeight,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})))')}`);
    if (await evaluate(phaseExpression) === 'MONITORING_AZURE') await capture('azure-mobile');
  }
  assert.equal(exceptions.length, 0, exceptions.join(', '));
  console.log('Pause, replay, reduced-motion manual progression, and runtime checks passed.');
  console.log(`Screenshots: ${directory}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { socket?.close(); chrome.kill(); }
