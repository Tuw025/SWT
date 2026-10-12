import http from 'k6/http';
import { check, sleep } from 'k6';

const samples = JSON.parse(open('../shared/samples.json'));
const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:5080').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'smoke';
const profiles = {
  smoke: { vus: 1, iterations: samples.length },
  load: { vus: 10, duration: '20s' },
};
if (!profiles[profile]) throw new Error('PROFILE must be smoke or load.');

export const options = {
  ...profiles[profile],
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

// HTTP 422 is an expected business validation response for some examples.
http.setResponseCallback(http.expectedStatuses(200, 422));

export default function () {
  const sample = samples[__ITER % samples.length];
  const response = http.post(`${baseUrl}/api/date/check`, JSON.stringify({
    day: sample.day, month: sample.month, year: sample.year,
  }), { headers: { 'Content-Type': 'application/json' }, tags: { caseId: sample.id } });
  let body = {};
  try { body = response.json(); } catch (_) { /* Checks below must fail for malformed JSON. */ }
  check(response, {
    'expected HTTP status': r => r.status === sample.status,
    'expected outcome': () => body.outcome === sample.outcome,
    'expected message': () => body.message === sample.message,
    'expected business result': () => sample.outcome === 'validation_error'
      ? body.field === sample.field && body.isValid === null : body.isValid === sample.isValid,
  });
  sleep(0.2);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const thresholdsPassed = Object.values(metrics)
    .flatMap(metric => Object.values(metric.thresholds || {})).every(threshold => threshold.ok);
  const checksPercent = (metrics.checks.values.rate * 100).toFixed(1);
  const httpErrorPercent = (metrics.http_req_failed.values.rate * 100).toFixed(1);
  const p95 = metrics.http_req_duration.values['p(95)'].toFixed(3);
  return {
    [`reports/performance/k6-${profile}.json`]: JSON.stringify(data, null, 2),
    stdout: `\nProfile: ${profile}; requests: ${metrics.http_reqs.values.count}\n` +
      `Checks passed: ${checksPercent}%; HTTP failures: ${httpErrorPercent}%; p95: ${p95} ms\n` +
      `Thresholds: ${thresholdsPassed ? 'PASS' : 'FAIL'}. See reports/performance/k6-${profile}.json.\n`,
  };
}
