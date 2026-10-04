import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';

// Reserve a free loopback port; run only the local production build.
const reservation = createServer();
reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const env = { ...process.env };
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'GEMINI_API_KEY']) delete env[key];
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { env, windowsHide: true, stdio: 'ignore' });
try {
  const base = `http://127.0.0.1:${port}`;
  let response;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { response = await fetch(base); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.equal(response?.status, 200);
  const html = await response.text();
  assert.match(html.replace(/<[^>]*>/g, ''), /ZANKAI ORBIT/);
  assert.match(html, /montserrat_[^\s"]+.*?font-sans/);
  assert.doesNotMatch(html, /GEMINI_API_KEY|Missing NEXT_PUBLIC_SUPABASE/);
  console.log('PASS GET /: HTTP 200; brand and Montserrat reference; no credential configuration error');
  for (const route of ['generate-board', 'breakdown-task']) {
    const result = await fetch(`${base}/api/ai/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    const body = await result.json();
    assert.deepEqual(Object.keys(body), ['message']);
    assert.doesNotMatch(body.message, /GEMINI_API_KEY|NEXT_PUBLIC|stack|database|schema/i);
    console.log(`PASS POST /api/ai/${route}: configuration failure masked as friendly HTTP 503`);
  }
} finally {
  child.kill();
  if (child.exitCode === null) await once(child, 'exit');
}
