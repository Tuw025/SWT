const fs=require('node:fs');
const path=require('node:path');
const {root,read,write,walk,counts,generate}=require('../tools/reporting/launch.cjs');
async function main(){
  const input=path.resolve(process.argv[2]||'reports/dashboard-input');
  const output=path.resolve(process.argv[3]||'reports/dashboard-bundle');
  fs.mkdirSync(path.join(output,'allure-results'),{recursive:true});
  const manifests=walk(input).filter(f=>path.basename(f)==='summary.json').map(file=>({file,data:read(file)})).filter(x=>x.data?.source==='github'&&x.data.topic);
  const selected=new Map();
  for(const item of manifests.sort((a,b)=>Date.parse(a.data.startedAt)-Date.parse(b.data.startedAt)))selected.set(item.data.topic,item);
  const groups=[],allRows=[];
  const needs=JSON.parse(process.env.DASHBOARD_NEEDS||'{}');
  for(const topic of ['api','web','visual','ui-performance','ai','performance','mobile']){
    const item=selected.get(topic);
    if(!item){
      const skipped=topic==='mobile'&&needs.mobile?.result==='skipped';
      groups.push({topic,status:skipped?'SKIP':'ERROR',counts:counts([]),reason:skipped?'Mobile không được chọn trong lượt workflow này.':'Không có kết quả của nhóm; có thể lỗi cài công cụ hoặc job bị hủy trước khi chạy test.'});continue;
    }
    const {data,file}=item,dir=path.dirname(file);
    groups.push({...data,planned:undefined,pid:undefined});
    allRows.push(...read(path.join(dir,'records.json'),[]));
    for(const f of walk(path.join(dir,'allure-results')))fs.copyFileSync(f,path.join(output,'allure-results',path.basename(f)));
    // Keep raw evidence including per-case screenshots/traces and build logs.
    if(fs.existsSync(path.join(dir,'evidence')))fs.cpSync(path.join(dir,'evidence'),path.join(output,'evidence',topic),{recursive:true});
  }
  const startedAt=groups.map(g=>g.startedAt).filter(Boolean).sort()[0]||new Date().toISOString();
  const finishedAt=new Date().toISOString();
  const status=groups.some(g=>g.status==='FAIL')?'FAIL':groups.some(g=>['ERROR','INCOMPLETE','INTERRUPTED','RUNNING'].includes(g.status))?'ERROR':'PASS';
  const summary={id:`github-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT||1}`,source:'github',topic:'pipeline',number:Number(process.env.GITHUB_RUN_NUMBER),commit:process.env.GITHUB_SHA,startedAt,finishedAt,durationMs:Date.parse(finishedAt)-Date.parse(startedAt),status,groups,counts:counts(allRows),metrics:groups.flatMap(g=>g.metrics||[]),diagnostics:groups.flatMap(g=>(g.diagnostics||[]).map(s=>`${g.topic}: ${s}`)),missing:groups.flatMap(g=>g.missing||[]),flaky:groups.reduce((n,g)=>n+(g.flaky||0),0),platform:'Windows + Linux / GitHub-hosted runners',url:`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,delivery:needs.delivery?.result,reportReady:false,notes:['Các nhóm chạy song song; tổng thời gian không phải tổng thời gian từng nhóm.','Mobile SKIP và AI SKIP không được tính là đã kiểm thử thành công.','k6 request/threshold được đếm riêng với test case; xem profile thực tế.',...new Set(groups.flatMap(g=>g.notes||[]))]};
  write(path.join(output,'records.json'),allRows);write(path.join(output,'summary.json'),summary);
  fs.writeFileSync(path.join(output,'allure-results/environment.properties'),`Source=GitHub Actions\nLaunch=${summary.id}\nCommit=${summary.commit}\nScope=${groups.map(g=>g.topic+':'+g.status).join(', ')}\n`);
  write(path.join(output,'allure-results/executor.json'),{name:'GitHub Actions',type:'github',buildName:summary.id,buildUrl:summary.url});
  await generate(output,summary);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n## Dashboard / Allure: ${summary.status}\n\n${summary.counts.passed} Pass · ${summary.counts.failed} Fail · ${summary.counts.broken} lỗi thực thi · ${summary.counts.skipped} Skip.\n\nTải artifact swt-dashboard-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT||1} hoặc mở dashboard local để tự đồng bộ.\n`);
  if(!summary.reportReady)throw new Error(summary.reportError);
  console.log(`Dashboard bundle: ${output}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
