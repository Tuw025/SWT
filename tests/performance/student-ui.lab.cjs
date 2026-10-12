const {test,expect}=require('@playwright/test');
const {selectCases,expectedFor}=require('../shared/lab-catalog.cjs');
const {fill}=require('../shared/lab-web.cjs');
for(const c of selectCases('performance').filter(c=>c.kind==='check')){
  test(`[${c.id}] R14: click Check → dialog trong 1000ms`,async({page},info)=>{
    await page.goto('/');await fill(page,c);
    await page.evaluate(()=>{
      window.labTiming={start:null,elapsedMs:null};
      document.getElementById('check-button').addEventListener('click',()=>window.labTiming.start=performance.now(),{capture:true,once:true});
      const dialog=document.getElementById('message-dialog');
      const observer=new MutationObserver(()=>{if(dialog.open&&window.labTiming.start!==null){window.labTiming.elapsedMs=performance.now()-window.labTiming.start;observer.disconnect();}});
      observer.observe(dialog,{attributes:true,attributeFilter:['open']});
    });
    // Không pause/slowMo giữa click và lần dialog mở khi đo thời gian.
    await page.getByTestId('check-button').click();
    await expect(page.getByTestId('dialog-message')).toHaveText(expectedFor(c).message);
    await expect.poll(()=>page.evaluate(()=>window.labTiming.elapsedMs)).not.toBeNull();
    const elapsedMs=await page.evaluate(()=>window.labTiming.elapsedMs);
    console.log(`[${c.id}] R14 elapsedMs=${elapsedMs.toFixed(2)} / limit=1000ms`);
    await info.attach('R14 timing',{body:JSON.stringify({caseId:c.id,elapsedMs,limitMs:1000}),contentType:'application/json'});
    expect(elapsedMs).toBeLessThanOrEqual(1000);
  });
}
