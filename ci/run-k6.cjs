const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5080';

(async () => {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/health`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Backend health check failed.');
  fs.mkdirSync(path.join(root, 'reports', 'performance'), { recursive: true });
  const binary = process.env.K6_BINARY || 'k6';
  const child = spawn(binary, ['run', 'tests/performance/date-check.k6.js'], { cwd: root, stdio: 'inherit', env: process.env });
  child.on('error', error => {
    console.error(`Cannot start k6: ${error.message}. Install k6 and reopen your terminal.`);
    process.exitCode = 1;
  });
  child.on('exit', code => { process.exitCode = code ?? 1; });
})().catch(error => {
  console.error(`Start the backend before performance testing. ${error.message}`);
  process.exitCode = 1;
});
