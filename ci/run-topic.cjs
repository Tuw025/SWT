// CI owns a backend process: start -> health check -> tests -> stop -> summary.
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const argv=process.argv.slice(2), topic=argv.shift(), opts={};
while(argv.length){const flag=argv.shift();if(!['--profile','--device','--port'].includes(flag)||!argv.length)throw new Error(`Tham số CI không hợp lệ: ${flag}`);opts[flag.slice(2)]=argv.shift();}
if(!['api','web','visual','ui-performance','ai','performance','mobile'].includes(topic))throw new Error('CI topic: api/web/visual/ui-performance/ai/performance/mobile.');
const port=opts.port||process.env.CI_BACKEND_PORT||'5097';
if(!/^\d+$/.test(port)||Number(port)<1024||Number(port)>65535)throw new Error('Port phải nằm trong 1024–65535.');
const baseURL=`http://127.0.0.1:${port}`;
const dir=path.join(root,'reports','ci',topic);fs.mkdirSync(dir,{recursive:true});
let server, serverClosed, stopping=false;
function command(binary,args,cwd=root,env={}){
  return new Promise((resolve,reject)=>{
    const log=fs.createWriteStream(path.join(dir,'commands.log'),{flags:'a'});
    console.log(`\n[CI ${topic}] ${binary} ${args.join(' ')}`);
    const child=spawn(binary,args,{cwd,env:{...process.env,...env},stdio:['ignore','pipe','pipe'],windowsHide:true});
    for(const [source,out]of[[child.stdout,process.stdout],[child.stderr,process.stderr]])source.on('data',d=>{out.write(d);log.write(d);});
    child.on('error',e=>{log.end();reject(e);});child.on('close',code=>{log.end();resolve(code??1);});
  });
}
async function startBackend(){
  // Never attach to or kill an existing student's backend on this port.
  try{await fetch(new URL('/api/health',baseURL),{signal:AbortSignal.timeout(500)});throw new Error(`Port ${port} đang có server. Dùng --port khác.`);}catch(e){if(e.message.startsWith('Port '))throw e;}
  const code=await command('dotnet',['build','apps/backend/DateTimeChecker.Api.csproj','--configuration','Release']);
  if(code!==0)throw new Error(`Build backend thất bại (${code}).`);
  const log=fs.createWriteStream(path.join(dir,'backend.log'));
  server=spawn('dotnet',[path.join(root,'apps/backend/bin/Release/net10.0/DateTimeChecker.Api.dll'),'--urls',baseURL,'--contentRoot',path.join(root,'apps/backend')],{cwd:path.join(root,'apps/backend'),env:{...process.env,Logging__LogLevel__Default:'Warning'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  server.stdout.on('data',d=>log.write(d));server.stderr.on('data',d=>log.write(d));
  server.on('error',e=>{serverClosed=e.message;});server.on('close',code=>{serverClosed=`exit ${code}`;log.end();});
  for(let i=0;i<120;i++){
    if(serverClosed)throw new Error(`Backend dừng trước khi sẵn sàng: ${serverClosed}`);
    try{const r=await fetch(new URL('/api/health',baseURL),{signal:AbortSignal.timeout(1000)});if(r.ok&&(await r.json()).application==='Date Time Checker'){console.log(`[CI ${topic}] Backend sẵn sàng: ${baseURL}`);return;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Backend không sẵn sàng sau 60 giây. Xem backend.log.');
}
async function stopBackend(){
  if(stopping||!server||server.exitCode!==null||serverClosed)return;stopping=true;
  await new Promise(resolve=>{server.once('close',resolve);server.kill('SIGTERM');const timer=setTimeout(()=>{server.kill('SIGKILL');resolve();},5000);timer.unref();});
}
process.on('SIGINT',()=>{stopBackend().finally(()=>process.exit(130));});
process.on('SIGTERM',()=>{stopBackend().finally(()=>process.exit(143));});
function evidence(startedAt){
  const labels=topic==='ai'?['ai-api','ai-web']:['ui-performance','api','web','visual'].includes(topic)?[topic]:[];
  return labels.map(label=>{const p=path.join(root,'reports/labs',label,'playwright-results.json');if(!fs.existsSync(p))return null;const stats=JSON.parse(fs.readFileSync(p,'utf8')).stats;return Date.parse(stats.startTime)>=Date.parse(startedAt)?{label,stats}:null;}).filter(Boolean);
}
(async()=>{
  const result={topic,startedAt:new Date().toISOString(),baseURL,result:'FAIL',exitCode:1};
  try{
    if(topic==='ai'){
      const {proposals,decisionFor}=require('../tests/ai-assisted/catalog.cjs');
      result.approvedIds=proposals().filter(c=>decisionFor(c)?.decision==='approved').map(c=>c.id);
      if(!result.approvedIds.length){result.result='SKIP';result.exitCode=0;result.reason='Chưa có case AI được người học duyệt; không chạy và không ghi PASS.';console.log(result.reason);return;}
    }
    await startBackend();
    const env={TEST_BASE_URL:baseURL,LAB_CASE:'',AI_CASE:'',LAB_STRICT_SOURCE:'0',LAB_MODE:'run',USE_EXTERNAL_SERVER:'1',LAB_DELAY_MS:'0'};
    let code;
    if(topic==='ai'){
      code=await command(process.execPath,['tools/ai-runner.cjs','run','--target','api','--mode','run','--base-url',baseURL],root,env);
      const webCode=await command(process.execPath,['tools/ai-runner.cjs','run','--target','web','--mode','run','--base-url',baseURL],root,env);code=code||webCode;
    }else{
      const args=['tools/lab-runner.cjs',topic==='ui-performance'?'performance':topic,'--mode','run','--base-url',baseURL];
      if(topic==='ui-performance')args.push('--profile','ui');
      if(topic==='performance')args.push('--profile',opts.profile||'observe');
      if(topic==='mobile')args.push('--device',opts.device||'emulator-5554','--mobile-url',`http://10.0.2.2:${port}`);
      code=await command(process.execPath,args,root,env);
    }
    result.exitCode=code;result.result=code===0?'PASS':'FAIL';result.evidence=evidence(result.startedAt);
  }catch(e){result.error=e.message;console.error(e.message);}
  finally{
    await stopBackend();result.finishedAt=new Date().toISOString();
    fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');
    const summary=`### ${topic}: ${result.result}\n\n${result.reason||result.error||`Exit code: ${result.exitCode}`}\n\n${JSON.stringify(result.evidence||result.approvedIds||[])}\n\n`;
    if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
    console.log(`[CI ${topic}] ${result.result}. Bằng chứng: reports/ci/${topic}/`);process.exitCode=result.exitCode;
  }
})();
