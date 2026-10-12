const {test}=require('@playwright/test');
const {selectCases}=require('../shared/lab-catalog.cjs');
const {scenario}=require('../shared/lab-web.cjs');
for(const c of selectCases('web')){
  test(`[${c.id}] ${c.title}`,async({page},info)=>{
    await info.attach('Nguồn case',{body:JSON.stringify(c,null,2),contentType:'application/json'});
    await scenario(page,c,info);
  });
}
