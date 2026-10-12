const {test} = require('@playwright/test');
const {selectApproved, decisionFor} = require('./catalog.cjs');
const {scenario} = require('../shared/lab-web.cjs');
for (const c of selectApproved()) {
  test(`[${c.id}] AI-assisted Web: ${c.title}`, async ({page}, info) => {
    await info.attach('Nguồn và duyệt', {body:JSON.stringify({proposal:c,review:decisionFor(c)},null,2),contentType:'application/json'});
    await scenario(page,c,info);
  });
}
