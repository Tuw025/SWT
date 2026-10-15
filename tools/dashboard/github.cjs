const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {unzipSync}=require('fflate');
const {storage,read,write}=require('../reporting/launch.cjs');
const repo=process.env.DASHBOARD_REPOSITORY||'Tuw025/SWT';
if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw new Error('DASHBOARD_REPOSITORY không hợp lệ.');
const cache=path.join(storage,'github'),stateFile=path.join(storage,'github-index.json');
const state={...read(stateFile,{runs:[]}),syncing:false,error:null};
let task,lastAttempt=0;
function gh(args,binary=false){
  return new Promise((resolve,reject)=>execFile('gh',args,{encoding:binary?'buffer':'utf8',maxBuffer:400*1024*1024,timeout:180000,windowsHide:true},(error,stdout)=>{
    if(error)return reject(new Error('Không truy cập được GitHub qua gh. Kiểm tra Internet và chạy gh auth status trong terminal mở dashboard. Nếu cần, đăng nhập bằng gh auth login.'));
    try{resolve(binary?stdout:JSON.parse(stdout));}catch{reject(new Error('GitHub trả dữ liệu không hợp lệ.'));}
  }));
}
async function api(endpoint){
  try{return await gh(['api',`repos/${repo}/${endpoint}`]);}
  catch(error){
    // Public metadata remains visible without credentials; artifacts still need gh.
    const response=await fetch(`https://api.github.com/repos/${repo}/${endpoint}`,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(12000)}).catch(()=>null);
    if(response?.ok)return response.json();throw error;
  }
}
function extract(buffer,destination,expectedId){
  let size=0,entries=0;
  const files=unzipSync(buffer,{filter:entry=>{
    entries++;
    const name=entry.name;
    if(name.includes('\\')||name.startsWith('/')||name.split('/').some(s=>s==='..'||s==='.')||name.includes(':'))throw new Error('Đường dẫn trong gói báo cáo không hợp lệ.');
    const wanted=/^(summary\.json|records\.json|report-generation\.log|report\/.*)$/.test(name)&&!name.endsWith('/');
    if(wanted)size+=entry.originalSize;
    if(entries>25000||size>300*1024*1024)throw new Error('Báo cáo vượt giới hạn giải nén.');
    return wanted;
  }});
  const summary=files['summary.json']&&JSON.parse(Buffer.from(files['summary.json']).toString('utf8'));
  if(summary?.id!==expectedId||summary.source!=='github'||!Array.isArray(summary.groups))throw new Error('Gói báo cáo không khớp lượt GitHub.');
  fs.mkdirSync(destination,{recursive:true});
  for(const [name,body]of Object.entries(files)) {
    if(!/^(summary\.json|records\.json|report-generation\.log|report\/.*|allure-results\/.*|evidence\/.*)$/.test(name))continue;
    const target=path.join(destination,...name.split('/'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);
  }
  return summary;
}
async function synchronize(force=false){
  if(task)return task;
  if(!force&&Date.now()-lastAttempt<20000)return;
  lastAttempt=Date.now();state.syncing=true;state.error=null;
  task=(async()=>{
    try{
      const data=await api('actions/workflows/tests.yml/runs?per_page=15');
      state.runs=(data.workflow_runs||[]).map(r=>({id:`github-${r.id}-${r.run_attempt}`,source:'github',runId:r.id,attempt:r.run_attempt,number:r.run_number,title:r.display_title,commit:r.head_sha,branch:r.head_branch,url:r.html_url,startedAt:r.run_started_at||r.created_at,finishedAt:r.status==='completed'?r.updated_at:null,status:r.status==='completed'?(r.conclusion==='success'?'PASS':r.conclusion==='cancelled'?'INTERRUPTED':'FAIL'):'RUNNING',conclusion:r.conclusion,reportReady:false,cloudOnly:true}));
      let downloaded=0;
      for(const run of state.runs){
        const destination=path.join(cache,run.id);
        if(fs.existsSync(path.join(destination,'summary.json')))continue;
        if(run.status==='RUNNING'||downloaded>=3)continue;
        const artifacts=await api(`actions/runs/${run.runId}/artifacts?per_page=100`);
        const artifact=artifacts.artifacts?.find(a=>a.name===`swt-dashboard-${run.runId}-${run.attempt}`);
        if(!artifact){run.syncNote='Lượt này chưa có gói dashboard (có thể chạy trước bản cập nhật hoặc bước tạo báo cáo chưa hoàn tất).';continue;}
        if(artifact.expired){run.syncNote='Artifact đã hết hạn; bản đã tải trước đó vẫn xem được.';continue;}
        if(artifact.size_in_bytes>400*1024*1024){run.syncNote='Gói báo cáo lớn hơn 400 MB; xem Artifacts trên GitHub.';continue;}
        try{
          const buffer=await gh(['api',`repos/${repo}/actions/artifacts/${artifact.id}/zip`],true);
          const stage=path.join(cache,`.download-${run.id}`);
          // A failed download is never published as a complete report.
          if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true});
          extract(buffer,stage,run.id);fs.renameSync(stage,destination);downloaded++;
        }catch(e){run.syncNote=e.message;state.error=e.message;}
      }
      state.lastSuccess=new Date().toISOString();write(stateFile,{runs:state.runs,lastSuccess:state.lastSuccess});
    }catch(e){state.error=e.message;}
    finally{state.syncing=false;task=null;}
  })();return task;
}
module.exports={repo,state,synchronize,extract};
