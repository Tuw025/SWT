const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const readline = require('node:readline/promises');
const {root, proposalsFile, decisionsFile, proposals, decisions, decisionFor, fingerprint, selectApproved} = require('../tests/ai-assisted/catalog.cjs');
const {catalog} = require('../tests/shared/lab-catalog.cjs');
const args = process.argv.slice(2), action = args.shift() || 'menu', opts = {};
while (args.length) {
  const flag = args.shift();
  if (!['--case','--mode','--target','--base-url'].includes(flag) || !args.length) throw new Error(`Tham số không hợp lệ: ${flag}`);
  opts[flag.slice(2)] = args.shift();
}
function reportDirectory(){return path.join(process.env.LAB_OUTPUT_DIR||path.join(root,'reports','labs'),'ai-assisted');}
let reportRoot=reportDirectory();
function duplicates(c) { return catalog.cases.filter(x => x.input && ['day','month','year'].every(k=>x.input[k]===c.input[k])).map(x => x.id); }
function show(c) {
  console.log(`\n${c.id}: ${c.title}\nRequirement: ${c.requirementIds.join(', ')}\nAI giải thích: ${c.rationale}`);
  console.log('Input:',c.input); console.log('Expected:',c.expected);
  console.log('Trùng input Lab:',duplicates(c).join(', ') || 'Không');
  console.log('Duyệt:',decisionFor(c)?.decision || 'pending (hoặc nội dung đã đổi)');
}
function spawnTest(argv, env) {
  return new Promise((resolve,reject) => {
    const file = path.join(reportRoot,`run-${new Date().toISOString().replace(/[:.]/g,'-')}.log`);
    const log = fs.createWriteStream(file);
    console.log(`Log: ${file}`);
    const child = spawn(process.execPath,argv,{cwd:root,env,stdio:['inherit','pipe','pipe'],windowsHide:true});
    for (const [source,out] of [[child.stdout,process.stdout],[child.stderr,process.stderr]]) source.on('data',data => {out.write(data);log.write(data);});
    child.on('error',e => {log.end();reject(e);});
    child.on('close',code => {log.end();resolve(code ?? 1);});
  });
}
async function review(ids) {
  const selected = proposals().filter(c => !ids || ids.split(',').includes(c.id));
  if (!selected.length) throw new Error('Không tìm thấy case cần duyệt.');
  const rl = readline.createInterface({input:process.stdin,output:process.stdout});
  const name = (await rl.question('Tên người duyệt (ví dụ Phạm Tuấn Triển): ')).trim();
  if (!name) {rl.close();throw new Error('Cần tên người duyệt để lưu bằng chứng.');}
  try {
    for (const c of selected) {
      show(c);
      let answer;
      do {answer=(await rl.question('Đối chiếu requirement: y = chấp nhận, n = loại, s = giữ nguyên: ')).trim().toLowerCase();} while (!['y','n','s'].includes(answer));
      if (answer === 's') continue;
      const note = (await rl.question('Lý do quyết định: ')).trim();
      if (!note) {console.log('Chưa lưu: cần lý do. Bạn có thể duyệt lại case này.');continue;}
      const data = decisions(); data.decisions = data.decisions.filter(d => d.id !== c.id);
      data.decisions.push({id:c.id,fingerprint:fingerprint(c),decision:answer==='y'?'approved':'rejected',reviewer:name,note,reviewedAt:new Date().toISOString()});
      fs.writeFileSync(decisionsFile,JSON.stringify(data,null,2)+'\n');
      console.log('Đã lưu quyết định.');
    }
  } finally {rl.close();}
}
function context() {
  const prompt = fs.readFileSync(path.join(root,'tests/ai-assisted/prompts/generate-cases.md'),'utf8');
  const sections = ['docs/requirements/requirements.md','docs/requirements/api-contract.md','tests/shared/lab-cases.json','tests/ai-assisted/proposals.json'];
  const content = prompt + '\n\n' + sections.map(file => `## File: ${file}\n\n${fs.readFileSync(path.join(root,file),'utf8')}`).join('\n\n');
  const destination = path.join(reportRoot,'context.md'); fs.writeFileSync(destination,content);
  console.log(`Đã tạo ngữ cảnh và prompt: ${destination}\nDùng nội dung này trong cuộc trò chuyện Codex. Lệnh này không gọi dịch vụ AI.`);
}
async function runTests() {
  const cases = selectApproved(opts.case);
  const target = opts.target || 'web', mode = opts.mode || (target==='api'?'step':'step');
  if (!['api','web'].includes(target) || !['run','watch','step'].includes(mode)) throw new Error('target: api/web; mode: run/watch/step.');
  const baseURL = opts['base-url'] || process.env.TEST_BASE_URL || 'http://127.0.0.1:5080';
  const health = await fetch(new URL('/api/health',baseURL),{signal:AbortSignal.timeout(5000)});
  if (!health.ok || (await health.json()).application !== 'Date Time Checker') throw new Error('Cần chạy backend Date Time Checker.');
  if (target==='api' && mode==='step') {
    const rl = readline.createInterface({input:process.stdin,output:process.stdout}); const results=[];
    try {
      for (const c of cases) {
        show(c); await rl.question('Enter để gửi request: ');
        const response = await fetch(new URL('/api/date/check',baseURL),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c.input),signal:AbortSignal.timeout(10000)});
        const actual={status:response.status,...await response.json()};console.log('Actual:',actual);
        await rl.question('Enter để đối chiếu từng trường: ');
        const fields=Object.entries(c.expected).map(([key,expected])=>({key,expected,actual:actual[key],pass:actual[key]===expected}));
        console.table(fields);results.push({caseId:c.id,input:c.input,review:decisionFor(c),expected:c.expected,actual,fields,result:fields.every(f=>f.pass)?'PASS':'FAIL'});
      }
    } finally {rl.close();fs.writeFileSync(path.join(reportRoot,'api-step.json'),JSON.stringify({startedFrom:'AI proposals reviewed by student',results},null,2));}
    return results.every(r=>r.result==='PASS')?0:1;
  }
  const argv=[path.join(root,'node_modules/@playwright/test/cli.js'),'test','--config=playwright.lab.config.cjs',`--project=lab-ai-${target}`];
  if (mode==='watch') argv.push('--headed'); if (mode==='step') argv.push('--debug');
  return spawnTest(argv,{...process.env,AI_CASE:cases.map(c=>c.id).join(','),LAB_MODE:mode,LAB_STRICT_SOURCE:'0',LAB_REPORT_LABEL:`ai-${target}`,TEST_BASE_URL:baseURL,USE_EXTERNAL_SERVER:'1'});
}
async function run() {
  const {launch,metaFor}=require('./reporting/launch.cjs');
  return launch(metaFor('ai',opts),async()=>{
    reportRoot=reportDirectory();fs.mkdirSync(reportRoot,{recursive:true});
    return runTests();
  });
}
async function main() {
  fs.mkdirSync(reportRoot,{recursive:true});
  if (action==='menu') {
    const rl=readline.createInterface({input:process.stdin,output:process.stdout});
    console.log('\nAI-assisted: 1 xem đề xuất; 2 duyệt; 3 tạo prompt; 4 chạy test; 5 xem HTML report');
    const choice=(await rl.question('Chọn số: ')).trim();rl.close();
    if(choice==='1') proposals().forEach(show);
    else if(choice==='2') await review(opts.case);
    else if(choice==='3') context();
    else if(choice==='4') {
      const input=readline.createInterface({input:process.stdin,output:process.stdout});
      try {
        opts.case=(await input.question('Mã AI-xxx (Enter = tất cả case đã duyệt): ')).trim();
        opts.target=(await input.question('target api/web [web]: ')).trim()||'web';
        opts.mode=(await input.question('mode step/watch/run [step]: ')).trim()||'step';
      }finally{input.close();}
      return run();
    } else if(choice==='5') {opts.target='web'; return report();}
    else throw new Error('Chọn 1–5.');
  } else if(action==='list') proposals().forEach(show);
  else if(action==='review') await review(opts.case);
  else if(action==='context') context();
  else if(action==='run') return run();
  else if(action==='report') return report();
  else throw new Error('AI actions: menu, list, review, context, run, report.');
  return 0;
}
function report() {
  const target=opts.target||'web'; if(!['api','web'].includes(target))throw new Error('target: api/web.');
  return spawnTest([path.join(root,'node_modules/@playwright/test/cli.js'),'show-report',`reports/labs/ai-${target}/playwright`],process.env);
}
main().then(code=>{process.exitCode=code??0;}).catch(error=>{console.error(error.message);process.exitCode=1;});
