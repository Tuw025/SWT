const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'lab-cases.json'), 'utf8'));

function selectCases(topic, ids = process.env.LAB_CASE || '') {
  const requested = ids.split(',').map(s => s.trim()).filter(Boolean);
  for (const id of requested) {
    const item = catalog.cases.find(c => c.id === id);
    if (!item) throw new Error(`Không có case ${id}. Chạy npm run lab:list.`);
    if (!item.topics.includes(topic)) throw new Error(`${id} không thuộc ${topic}: xem mapping trong docs/test-plan/lab-design.md.`);
  }
  return catalog.cases.filter(c => c.topics.includes(topic) && (!requested.length || requested.includes(c.id)));
}
function expectedFor(c) {
  return { ...c.expected, ...(process.env.LAB_STRICT_SOURCE === '1' && c.sourceMessage ? {message:c.sourceMessage} : {}) };
}
function assertResponse(c, status, body) {
  const expected = expectedFor(c);
  assert.equal(status, expected.status, `${c.id}: HTTP status`);
  for (const [key,value] of Object.entries(expected)) {
    if (key !== 'status') assert.deepEqual(body[key], value, `${c.id}: ${key}`);
  }
}
module.exports = { catalog, selectCases, expectedFor, assertResponse };
