const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const proposalsFile = path.join(__dirname, 'proposals.json');
const decisionsFile = path.join(__dirname, 'review-decisions.json');
const fingerprint = c => crypto.createHash('sha256').update(JSON.stringify(c)).digest('hex');
function proposals() {
  const data = JSON.parse(fs.readFileSync(proposalsFile, 'utf8'));
  if (!Array.isArray(data.cases) || !data.cases.length) throw new Error('proposals.json phải có cases.');
  const ids = new Set();
  const keys = ['status','outcome','field','isValid','daysInMonth','isLeapYear','normalizedDate','message'];
  for (const c of data.cases) {
    if (!/^AI-\d{3}$/.test(c.id) || ids.has(c.id)) throw new Error(`ID AI không hợp lệ hoặc trùng: ${c.id}`);
    ids.add(c.id);
    if (c.kind !== 'check' || !c.title || !c.rationale || !c.requirementIds?.length) throw new Error(`${c.id}: thiếu lý do / requirement.`);
    if (['day','month','year'].some(k => typeof c.input?.[k] !== 'string')) throw new Error(`${c.id}: input phải gồm ba chuỗi.`);
    if (keys.some(k => !Object.hasOwn(c.expected || {}, k)) || Object.keys(c.expected).some(k => !keys.includes(k))) throw new Error(`${c.id}: expected phải có đúng 8 trường HTTP/JSON.`);
    const e = c.expected;
    if (![200,422].includes(e.status) || typeof e.message !== 'string' || !['valid_date','invalid_date','validation_error'].includes(e.outcome)) throw new Error(`${c.id}: expected không đúng hợp đồng.`);
    if (e.outcome === 'validation_error') {
      if (e.status !== 422 || !['Day','Month','Year'].includes(e.field) || ['isValid','daysInMonth','isLeapYear','normalizedDate'].some(k => e[k] !== null)) throw new Error(`${c.id}: schema validation_error sai.`);
    } else if (e.status !== 200 || e.field !== null || typeof e.isValid !== 'boolean' || e.isValid !== (e.outcome === 'valid_date') || typeof e.isLeapYear !== 'boolean' || ![28,29,30,31].includes(e.daysInMonth) || !/^\d{2}\/\d{2}\/\d{4}$/.test(e.normalizedDate)) throw new Error(`${c.id}: schema kết quả ngày sai.`);
  }
  return data.cases;
}
function decisions() { return fs.existsSync(decisionsFile) ? JSON.parse(fs.readFileSync(decisionsFile, 'utf8')) : {decisions: []}; }
function decisionFor(c) { return decisions().decisions.find(d => d.id === c.id && d.fingerprint === fingerprint(c)); }
function selectApproved(ids = process.env.AI_CASE || '') {
  const cases = proposals();
  const requested = ids.split(',').map(s => s.trim()).filter(Boolean);
  for (const id of requested) {
    const c = cases.find(c => c.id === id);
    if (!c) throw new Error(`Không có ${id}.`);
    if (decisionFor(c)?.decision !== 'approved') throw new Error(`${id} chưa được bạn duyệt hoặc nội dung đã đổi. Chạy npm run lab:ai -- review.`);
  }
  const selected = cases.filter(c => (!requested.length || requested.includes(c.id)) && decisionFor(c)?.decision === 'approved');
  if (!selected.length) throw new Error('Chưa có case AI được duyệt. Chạy npm run lab:ai -- review.');
  return selected;
}
module.exports = {root, proposalsFile, decisionsFile, fingerprint, proposals, decisions, decisionFor, selectApproved};
