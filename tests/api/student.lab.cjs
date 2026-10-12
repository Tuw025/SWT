const {test}=require('@playwright/test');
const {selectCases,expectedFor,assertResponse}=require('../shared/lab-catalog.cjs');
for(const c of selectCases('api')){
  test(`[${c.id}] ${c.title}`,async({request},info)=>{
    await test.step(`Nguồn: ${c.source.file} / ${c.source.sheet} / ${c.source.id}`,async()=>{
      await info.attach('Case gốc và ánh xạ',{body:JSON.stringify(c,null,2),contentType:'application/json'});
    });
    let response,body;
    await test.step(`POST /api/date/check ${JSON.stringify(c.input)}`,async()=>{
      response=await request.post('/api/date/check',{data:c.input});body=await response.json();
      console.log(`[${c.id}] request=${JSON.stringify(c.input)} HTTP=${response.status()} response=${JSON.stringify(body)}`);
      await info.attach('Expected và actual',{body:JSON.stringify({expected:expectedFor(c),actual:{status:response.status(),...body}},null,2),contentType:'application/json'});
    });
    await test.step('Đối chiếu từng trường HTTP / JSON',async()=>assertResponse(c,response.status(),body));
  });
}
