// One launch owns its evidence. The dashboard never reads another launch's output.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const storage = path.join(root, 'reports/dashboard');
const read = (file, fallback = null) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2)); fs.renameSync(tmp, file);
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isSymbolicLink() ? [] : e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
function git(args) { const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:5000}); return r.status===0?r.stdout.trim():null; }
function selection(topic, opts={}) {
  opts={...opts,case:opts.case||opts.filter};
  if (topic==='ai') {
    const {proposals,decisionFor}=require('../../tests/ai-assisted/catalog.cjs');
    return proposals().filter(c=>decisionFor(c)?.decision==='approved'&&(!opts.case||opts.case.split(',').includes(c.id)));
  }
  const key=topic==='ui-performance'?'performance':topic;
  let cases=require('../../tests/shared/lab-catalog.cjs').selectCases(key, opts.case||'');
  if(topic==='ui-performance'||opts.profile==='ui')cases=cases.filter(c=>c.kind==='check');
  return cases;
}
function metaFor(topic, opts={}) {
  return {topic:topic==='performance'&&opts.profile==='ui'?'ui-performance':topic, mode:opts.mode||(topic==='ai'?'step':['api','performance','ui-performance'].includes(topic)?'run':'watch'), profile:opts.profile||(topic==='performance'?'observe':undefined), filter:opts.case||'', target:opts.target||(topic==='ai'?'web':undefined), baselineUpdate:!!opts.update, strictSource:!!opts['strict-source'], baseURL:opts['base-url']||'http://127.0.0.1:5080'};
}
function child(file,args=[],env={}) {
  return new Promise((resolve,reject)=>{
    const proc=spawn(process.execPath,[file,...args],{cwd:root,env:{...process.env,...env},stdio:['inherit','pipe','pipe'],windowsHide:true});
    const log=process.env.LAB_OUTPUT_DIR?fs.createWriteStream(path.join(process.env.LAB_OUTPUT_DIR,'execution.log'),{flags:'a'}):null;
    for(const [src,dest]of[[proc.stdout,process.stdout],[proc.stderr,process.stderr]])src.on('data',data=>{dest.write(data);log?.write(data);});
    proc.on('error',e=>{log?.end();reject(e);});
    proc.on('close',(code,signal)=>{log?.end();resolve(signal?130:(code??1));});
  });
}
function caseRecord(c) { return c?{id:c.id,title:c.title,input:c.input,expected:c.expected,source:c.source,requirements:c.requirementIds}:null; }
function collect(dir, meta) {
  const evidence=path.join(dir,'evidence'), rows=[], diagnostics=[], metrics=[];
  const files=walk(evidence);
  for(const file of files.filter(f=>path.basename(f)==='playwright-results.json')) {
    const data=read(file); if(!data){diagnostics.push('Không đọc được Playwright JSON.');continue;}
    for(const e of data.errors||[])diagnostics.push(e.message||String(e));
    const visit=suite=>{
      for(const spec of suite.specs||[])for(const test of spec.tests||[]) {
        const result=test.results?.at(-1);
        // An enumerated but unstarted case is not an executed test.
        if(!result)continue;
        const status=result.status==='passed'?'passed':result.status==='skipped'?'skipped':result.status==='interrupted'?'broken':'failed';
        rows.push({id:spec.title.match(/\[([^\]]+)\]/)?.[1]||spec.id,name:spec.title,group:test.projectName||meta.topic,status,durationMs:result.duration||0,start:Date.parse(result.startTime)||Date.parse(meta.startedAt),error:(result.errors||[]).map(e=>e.message||e.value).join('\n'),attachments:result.attachments||[],steps:result.steps||[],attempts:test.results.length,flaky:test.status==='flaky'});
      }
      for(const s of suite.suites||[])visit(s);
    }; for(const suite of data.suites||[])visit(suite);
  }
  for(const file of files.filter(f=>['api-step.json','mobile-results.json'].includes(path.basename(f)))) {
    const data=read(file); const records=Array.isArray(data)?data:data?.results;
    if(!Array.isArray(records))continue;
    for(const record of records)rows.push({id:record.caseId,name:record.caseId,group:meta.topic,status:record.result==='PASS'?'passed':record.result==='FAIL'?'failed':'broken',durationMs:record.elapsedMs||0,start:Date.parse(meta.startedAt),error:record.error||'',detail:record,steps:record.steps||[]});
  }
  for(const file of files.filter(f=>/^performance-(observe|load|stress)\.json$/.test(path.basename(f)))) {
    const data=read(file);if(!data)continue;
    const m=data.metrics||{};
    metrics.push({profile:data.profile,caseIds:data.caseIds,requests:m.http_reqs?.values?.count||0,p95Ms:m.http_req_duration?.values?.['p(95)'],averageMs:m.http_req_duration?.values?.avg,errorRate:m.http_req_failed?.values?.rate,checksRate:m.checks?.values?.rate,thresholds:data.thresholdResults||{}});
    for(const [rule,ok]of Object.entries(data.thresholdResults||{}))rows.push({id:rule,name:rule,group:`performance/${data.profile}`,kind:'threshold',status:ok?'passed':'failed',start:Date.parse(meta.startedAt),durationMs:0,detail:{rule,ok,metrics:m}});
  }
  const ciResult=files.map(f=>path.basename(f)==='result.json'?read(f):null).find(d=>d?.topic);
  if(ciResult?.error)diagnostics.push(ciResult.error);
  return {rows,diagnostics,metrics,ciResult};
}
function counts(rows) {
  const result={passed:0,failed:0,broken:0,skipped:0,total:0};
  for(const row of rows.filter(r=>r.kind!=='threshold')){result[row.status]++;result.total++;} return result;
}
function buildSummary(meta, collected, code) {
  const {rows,diagnostics,metrics,ciResult}=collected, c=counts(rows);
  const observed=new Set(rows.filter(r=>r.kind!=='threshold').map(r=>r.id));
  const missing=(meta.planned||[]).filter(c=>!observed.has(c.id)).map(c=>c.id);
  const performance=meta.topic==='performance';
  let status=ciResult?.result==='SKIP'?'SKIP':code===130?'INTERRUPTED':c.failed||metrics.some(m=>Object.values(m.thresholds).includes(false))?'FAIL':code!==0||c.broken||diagnostics.length?'ERROR':!rows.length?'ERROR':missing.length&&!performance?'INCOMPLETE':'PASS';
  const reason=ciResult?.reason||((!rows.length&&status!=='SKIP')?'Không có kết quả test; xem execution.log và lỗi chuẩn bị môi trường.':undefined);
  return {...meta,finishedAt:new Date().toISOString(),durationMs:Date.now()-Date.parse(meta.startedAt),status,exitCode:code,counts:c,missing:performance?[]:missing,metrics,diagnostics,reason,flaky:rows.filter(r=>r.flaky).length,reportReady:false,
    notes:[...(performance?['Request và threshold k6 được đếm riêng, không tính thành số test case.','observe không chứng minh khả năng chịu tải; ngưỡng API không thay cho R14 UI.']:[]),...(meta.topic==='mobile'?['Close Yes xác minh platform channel; chưa chứng minh Android Activity đã đóng.']:[]),...(meta.baselineUpdate?['Lượt này cập nhật baseline Visual, không phải bằng chứng hồi quy độc lập.']:[]),...(meta.strictSource?['Strict-source: đối chiếu nguyên văn Lab; khác định dạng dd/mm/yyyy có thể tạo FAIL có chủ đích.']:[])]};
}
function allureResults(dir,summary,rows) {
  const dest=path.join(dir,'allure-results');fs.mkdirSync(dest,{recursive:true});
  const allowedRoot=path.resolve(dir,'evidence');
  for(const row of rows) {
    const uuid=crypto.randomUUID(), attachments=[];
    const attach=(name,body,type)=>{
      const source=`${crypto.randomUUID()}-attachment`;
      fs.writeFileSync(path.join(dest,source),body);attachments.push({name,source,type});
    };
    const c=summary.planned?.find(c=>c.id===row.id);
    attach('Dữ liệu và bằng chứng',JSON.stringify(row.detail||{case:c,attempts:row.attempts,error:row.error},null,2),'application/json');
    for(const a of row.attachments||[]) {
      if(a.body)attach(a.name,Buffer.from(a.body,'base64'),a.contentType||'application/octet-stream');
      else if(a.path) {
        const file=path.resolve(a.path);
        if(file.startsWith(allowedRoot+path.sep)&&fs.existsSync(file)&&fs.statSync(file).size<25*1024*1024)attach(a.name,fs.readFileSync(file),a.contentType||'application/octet-stream');
      }
    }
    const convert=step=>({name:step.title||step.label||'Step',status:step.error||step.result==='FAIL'?'failed':'passed',stage:'finished',steps:(step.steps||[]).map(convert)});
    write(path.join(dest,`${uuid}-result.json`),{uuid,historyId:crypto.createHash('sha256').update(`${row.group}/${row.id}`).digest('hex'),name:row.name,fullName:`${row.group}/${row.id}`,status:row.status,stage:'finished',start:row.start,stop:row.start+(row.durationMs||0),statusDetails:row.error?{message:row.error}:undefined,labels:[{name:'parentSuite',value:summary.source},{name:'suite',value:row.group},{name:'subSuite',value:row.kind==='threshold'?'Ngưỡng hiệu năng':'Test cases'}],steps:(row.steps||[]).map(convert),attachments,parameters:c?.input?Object.entries(c.input).map(([name,value])=>({name,value:String(value)})):[]});
  }
  fs.writeFileSync(path.join(dest,'environment.properties'),Object.entries({Source:summary.source,Launch:summary.id,Commit:summary.commit||'unknown',Dirty:String(summary.dirty),Scope:summary.topic,Status:summary.status}).map(([k,v])=>`${k}=${String(v).replace(/[\r\n]/g,' ')}`).join('\n'));
  write(path.join(dest,'executor.json'),{name:summary.source==='github'?'GitHub Actions':'Local',type:summary.source==='github'?'github':'local',buildName:summary.id,buildUrl:summary.url});
}
async function generate(dir,summary) {
  const config=path.join(root,'allure.config.mjs');
  const proc=spawn(process.execPath,[path.join(root,'node_modules/allure/cli.js'),'generate',path.join(dir,'allure-results'),'--config',config,'--output',path.join(dir,'report'),'--report-name',`Date Time Checker · ${summary.id}`],{cwd:root,windowsHide:true,env:{...process.env,ALLURE_ANALYTICS_ENABLED:'false'},stdio:['ignore','pipe','pipe']});
  const log=fs.createWriteStream(path.join(dir,'report-generation.log'));proc.stdout.pipe(log,{end:false});proc.stderr.pipe(log,{end:false});
  const code=await new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',resolve);});log.end();
  // The awesome plugin is configured to write directly into report/.
  summary.reportReady=code===0&&fs.existsSync(path.join(dir,'report','index.html'));
  if(!summary.reportReady)summary.reportError='Không tạo được Allure. Kết quả gốc vẫn được giữ; xem report-generation.log.';
  write(path.join(dir,'summary.json'),summary);
}
async function launch(meta, execute) {
  if(process.env.SWT_ACTIVE_LAUNCH)return execute();
  const source=process.env.GITHUB_ACTIONS==='true'?'github':'local';
  const id=`${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomBytes(3).toString('hex')}`;
  const dir=path.join(storage,source==='github'?'jobs':'local',id);
  fs.mkdirSync(path.join(dir,'evidence/labs'),{recursive:true});
  const keys=['SWT_ACTIVE_LAUNCH','LAB_OUTPUT_DIR','LAB_CI_DIR'];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  Object.assign(process.env,{SWT_ACTIVE_LAUNCH:id,LAB_OUTPUT_DIR:path.join(dir,'evidence/labs'),LAB_CI_DIR:path.join(dir,'evidence/ci')});
  const startedAt=new Date().toISOString();let planned=[],planningError;
  try{planned=selection(meta.topic,meta).map(caseRecord);}catch(e){planningError=e.message;}
  meta={...meta,id,source,startedAt,commit:process.env.GITHUB_SHA||git(['rev-parse','HEAD']),dirty:source==='local'?!!git(['diff','--name-only','HEAD']):false,platform:process.platform,planned,url:process.env.GITHUB_RUN_ID?`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:undefined};
  write(path.join(dir,'summary.json'),{...meta,status:'RUNNING',counts:counts([]),reportReady:false,pid:process.pid});
  let code=1,error;
  try{code=(await execute())??0;}catch(e){error=e.message;console.error(error);}
  try{
    const collected=collect(dir,meta);if(error)collected.diagnostics.push(error);if(planningError)collected.diagnostics.push(planningError);
    const summary=buildSummary(meta,collected,code);write(path.join(dir,'records.json'),collected.rows);allureResults(dir,summary,collected.rows);write(path.join(dir,'summary.json'),summary);
    if(source==='local'){
      await generate(dir,summary);
      // Existing lab:report / AI report commands remain compatible.
      fs.cpSync(path.join(dir,'evidence/labs'),path.join(root,'reports/labs'),{recursive:true});
    }
    console.log(`\n[Dashboard] ${summary.status} · ${meta.topic} · http://127.0.0.1:5099 (F5 để xem)`);
  }catch(e){write(path.join(dir,'summary.json'),{...meta,status:'ERROR',finishedAt:new Date().toISOString(),counts:counts([]),reportReady:false,reportError:e.message});console.error(`[Dashboard] Không tạo được báo cáo: ${e.message}`);}
  finally{for(const key of keys)previous[key]===undefined?delete process.env[key]:process.env[key]=previous[key];}
  return code;
}
module.exports={root,storage,read,write,walk,counts,selection,metaFor,child,collect,buildSummary,allureResults,generate,launch};
