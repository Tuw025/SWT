const {test,expect}=require('@playwright/test');
const {selectCases}=require('../shared/lab-catalog.cjs');
const {scenario,step}=require('../shared/lab-web.cjs');
for(const c of selectCases('visual')){
  test(`[${c.id}] Visual: ${c.title}`,async({page},info)=>{
    await scenario(page,c,info);
    await page.getByRole('img').evaluate(img=>img.decode());
    await step(page,'Chụp ảnh và so với baseline của chính case này',async()=>{
      await expect(page).toHaveScreenshot(`${c.id}.png`,{animations:'disabled'});
    });
  });
}
