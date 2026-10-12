const {test, expect} = require('@playwright/test');
const {expectedFor, assertResponse} = require('./lab-catalog.cjs');

async function step(page, name, action) {
  await test.step(name, async () => {
    if (process.env.LAB_MODE === 'step') await page.pause();
    await action();
    if (process.env.LAB_MODE === 'watch') await page.waitForTimeout(Number(process.env.LAB_DELAY_MS || 700));
  });
}
async function fill(page,c) {
  for (const label of ['Day','Month','Year']) {
    await step(page, `Nhập ${label} = ${JSON.stringify(c.input[label.toLowerCase()])}`, async () => {
      await page.getByLabel(label,{exact:true}).fill(c.input[label.toLowerCase()]);
    });
  }
}
async function checkDate(page,c,info) {
  await fill(page,c);
  await step(page,'Bấm Check → gọi backend thật',async()=>{
    const pending = page.waitForResponse(r => new URL(r.url()).pathname==='/api/date/check' && r.request().method()==='POST');
    await page.getByTestId('check-button').click();
    const response=await pending;
    const body=await response.json();
    await info.attach('Request và response', {body:JSON.stringify({caseId:c.id,request:response.request().postDataJSON(),status:response.status(),actual:body,expected:expectedFor(c)},null,2),contentType:'application/json'});
    assertResponse(c,response.status(),body);
    await expect(page.getByTestId('message-dialog')).toBeVisible();
  });
  await step(page,'Đối chiếu thông báo hiển thị với expected',async()=>{
    await expect(page.getByTestId('dialog-message')).toHaveText(expectedFor(c).message);
    await info.attach('Màn hình kết quả',{body:await page.screenshot(),contentType:'image/png'});
  });
}
async function layout(page) {
  await expect(page.getByRole('img')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Date Time Checker',exact:true})).toBeVisible();
  const style=await page.locator('#app-title').evaluate(el=>({font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,color:getComputedStyle(el).color}));
  expect(style.font).toContain('Arial');expect(parseFloat(style.size)).toBeCloseTo(26*96/72,1);expect(style.color).toBe('rgb(38, 132, 255)');
  for (const label of ['Day','Month','Year']) {
    await expect(page.getByLabel(label,{exact:true})).toBeVisible();
    expect(await page.locator(`label[for="${label.toLowerCase()}"]`).evaluate(el=>getComputedStyle(el).textAlign)).toBe('left');
  }
  await expect(page.getByTestId('clear-button')).toBeVisible();await expect(page.getByTestId('check-button')).toBeVisible();
  const logo=await page.getByRole('img').boundingBox(), title=await page.locator('#app-title').boundingBox();
  expect(logo.y).toBeLessThan(title.y);expect(Math.abs(logo.x-title.x)).toBeLessThan(2);
  await expect(page.locator('.titlebar button')).toHaveCount(1);
}
async function scenario(page,c,info) {
  await step(page,'Mở form Date Time Checker',()=>page.goto('/'));
  if (c.kind==='check') return checkDate(page,c,info);
  if (c.kind==='layout') return step(page,'Kiểm tra logo, tiêu đề, nhãn, ô nhập và nút',()=>layout(page));
  if (c.kind==='clear-layout') return step(page,'Kiểm tra vị trí và nhãn Clear cạnh Check',async()=>{
    await expect(page.getByTestId('clear-button')).toHaveText('Clear');
    const a=await page.getByTestId('clear-button').boundingBox(), b=await page.getByTestId('check-button').boundingBox();
    expect(a.x).toBeLessThan(b.x);expect(Math.abs(a.y-b.y)).toBeLessThan(2);
  });
  if (['error-layout','message-layout'].includes(c.kind)) {
    await checkDate(page,c,info);
    return step(page,'Kiểm tra title, icon, message, OK và X',async()=>{
      await expect(page.locator('#dialog-title')).toHaveText(c.kind==='error-layout'?'Error':'Message');
      await expect(page.locator('#dialog-icon')).toBeVisible();
      await expect(page.getByRole('button',{name:'OK',exact:true})).toBeVisible();
      await expect(page.getByRole('button',{name:'Close message'})).toBeVisible();
      await expect(page.locator('#dialog-icon')).toHaveClass(c.kind==='error-layout'?/error/:/^message-icon$/);
    });
  }
  if (c.kind==='clear') {
    await fill(page,c);
    return step(page,'Bấm Clear và kiểm tra ba ô trống',async()=>{
      await page.getByTestId('clear-button').click();
      for(const label of ['Day','Month','Year']) await expect(page.getByLabel(label,{exact:true})).toHaveValue('');
    });
  }
  if (['close-no','close-yes'].includes(c.kind)) await fill(page,c);
  await step(page,'Bấm X trên form và xem xác nhận Close',async()=>{
    await page.getByTestId('close-button').click();
    await expect(page.getByTestId('dialog-message')).toHaveText('Are you sure to exit?');
  });
  if (c.kind==='confirm-layout') return step(page,'Kiểm tra title, icon, message, Yes/No và X',async()=>{
    await expect(page.locator('#dialog-title')).toHaveText('Confirm');
    await expect(page.locator('#dialog-icon')).toBeVisible();
    for (const name of ['Yes','No']) await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Close message'})).toBeVisible();
  });
  if (c.kind==='close-no') return step(page,'Chọn No; form và dữ liệu được giữ lại',async()=>{
    await page.getByRole('button',{name:'No',exact:true}).click();
    await expect(page.getByTestId('message-dialog')).not.toBeVisible();
    await expect(page.getByTestId('application')).toBeVisible();
    for(const label of ['Day','Month','Year']) await expect(page.getByLabel(label,{exact:true})).toHaveValue(c.input[label.toLowerCase()]);
  });
  if (c.kind==='close-yes') return step(page,'Chọn Yes; app chuyển sang trạng thái đóng',async()=>{
    await page.getByRole('button',{name:'Yes',exact:true}).click();
    await expect(page.getByTestId('closed-screen')).toBeVisible();
    await expect(page.getByTestId('application')).not.toBeVisible();
  });
  throw new Error(`Chưa có handler ${c.kind}`);
}
module.exports={step,fill,scenario};
