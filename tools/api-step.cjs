const fs=require('node:fs');const path=require('node:path');
const readline=require('node:readline/promises');
const {selectCases,expectedFor,assertResponse}=require('../tests/shared/lab-catalog.cjs');
const baseURL=process.env.TEST_BASE_URL||'http://127.0.0.1:5080';
const input=readline.createInterface({input:process.stdin,output:process.stdout});
const records=[];
(async()=>{
  for(const c of selectCases('api')){
    console.log(`\n[${c.id}] ${c.title}\nNguồn: ${c.source.file} / ${c.source.sheet} / ${c.source.id}\nInput: ${JSON.stringify(c.input)}\nExpected: ${JSON.stringify(expectedFor(c),null,2)}`);
    await input.question('Nhấn Enter để gửi request (Ctrl+C để dừng): ');
    const started=Date.now();let record={caseId:c.id,input:c.input,expected:expectedFor(c)};
    try{
      const response=await fetch(new URL('/api/date/check',baseURL),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c.input),signal:AbortSignal.timeout(10000)});
      const actual=await response.json();record={...record,status:response.status,actual,elapsedMs:Date.now()-started};
      console.log(`HTTP ${response.status}\nActual: ${JSON.stringify(actual,null,2)}`);
      await input.question('Nhấn Enter để đối chiếu expected với actual: ');
      assertResponse(c,response.status,actual);record.result='PASS';console.log('PASS: HTTP và tất cả trường JSON khớp expected.');
    }catch(error){record.result='FAIL';record.error=error.message;process.exitCode=1;console.error(error.message);}
    records.push(record);
    fs.writeFileSync(path.join(__dirname,'..','reports','labs','api-step.json'),JSON.stringify(records,null,2));
    await input.question('Nhấn Enter để kết thúc case / sang case tiếp theo: ');
  }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>input.close());
