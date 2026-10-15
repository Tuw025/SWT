// Checks for reporting infrastructure, not unit tests of Date Time Checker.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {zipSync,strToU8}=require('fflate');
const {selection,collect,buildSummary,write,counts}=require('./launch.cjs');
const {extract}=require('../dashboard/github.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'swt-report-check-'));
let checks=0;
function check(name,action){action();checks++;console.log(`OK ${name}`);}
try{
  const planned=selection('api',{filter:'LAB1-DATE-01'});
  check('Single-case scope is isolated',()=>assert.equal(planned.length,1));
  const meta={topic:'api',startedAt:new Date().toISOString(),planned:planned.map(c=>({id:c.id}))};
  check('An empty result is ERROR, never PASS',()=>assert.equal(buildSummary(meta,{rows:[],diagnostics:[],metrics:[]},1).status,'ERROR'));
  const dir=path.join(temp,'launch');
  write(path.join(dir,'evidence/labs/api-step.json'),[{caseId:'LAB1-DATE-01',result:'FAIL',error:'controlled reporting fixture',input:{day:'31'},expected:{},actual:{}}]);
  const data=collect(dir,meta);
  check('Step failures remain FAIL',()=>assert.equal(buildSummary(meta,data,1).status,'FAIL'));
  check('Missing cases are not counted as executed',()=>assert.deepEqual(buildSummary({...meta,planned:[...meta.planned,{id:'not-run'}]},data,1).missing,['not-run']));
  check('k6 threshold entries do not inflate case counts',()=>assert.equal(counts([{status:'passed'},{kind:'threshold',status:'passed'}]).total,1));
  const mobile=path.join(temp,'mobile');
  write(path.join(mobile,'evidence/labs/mobile-results.json'),{results:[{caseId:'MOBILE-FIXTURE',result:'PASS',steps:[{label:'fixture',result:'PASS'}]}]});
  check('Flutter driver report is read as actual records',()=>assert.equal(collect(mobile,{...meta,topic:'mobile'}).rows[0].status,'passed'));
  const skipped=buildSummary({...meta,topic:'ai',planned:[]},{rows:[],diagnostics:[],metrics:[],ciResult:{result:'SKIP',reason:'No reviewed cases'}},0);
  check('Unreviewed AI is SKIP, not PASS',()=>assert.equal(skipped.status,'SKIP'));
  const expected='github-123-1',valid=zipSync({'summary.json':strToU8(JSON.stringify({id:expected,source:'github',groups:[]})),'report/index.html':strToU8('<html>fixture</html>')});
  check('A valid GitHub bundle extracts within its directory',()=>{extract(valid,path.join(temp,'valid'),expected);assert.ok(fs.existsSync(path.join(temp,'valid/report/index.html')));});
  check('ZIP traversal is rejected',()=>assert.throws(()=>extract(zipSync({'../escape.txt':strToU8('bad')}),path.join(temp,'bad'),expected)));
  check('A bundle from another workflow cannot be substituted',()=>assert.throws(()=>extract(valid,path.join(temp,'wrong'),'github-999-1')));
  console.log(`${checks} reporting checks passed.`);
}finally{
  // Only remove the exact temporary directory created above.
  fs.rmSync(temp,{recursive:true,force:true});
}
