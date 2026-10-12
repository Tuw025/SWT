const {test} = require('@playwright/test');
const {selectApproved, decisionFor} = require('./catalog.cjs');
const {assertResponse} = require('../shared/lab-catalog.cjs');
for (const c of selectApproved()) {
  test(`[${c.id}] AI-assisted API: ${c.title}`, async ({request}, info) => {
    await test.step('Xem đề xuất AI và quyết định duyệt của người học', async () => {
      await info.attach('Nguồn và duyệt', {body:JSON.stringify({proposal:c, review:decisionFor(c)},null,2),contentType:'application/json'});
    });
    const response = await test.step('Gửi input đến backend thật', () => request.post('/api/date/check', {data:c.input}));
    const body = await response.json();
    await info.attach('Expected và actual', {body:JSON.stringify({input:c.input,expected:c.expected,actual:{status:response.status(),...body}},null,2),contentType:'application/json'});
    console.log(`[${c.id}] input=${JSON.stringify(c.input)} expected=${JSON.stringify(c.expected)} actual=${JSON.stringify({status:response.status(),...body})}`);
    await test.step('Đối chiếu HTTP và 7 trường JSON đã duyệt', () => assertResponse(c,response.status(),body));
  });
}
