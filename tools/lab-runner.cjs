const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const {catalog,selectCases}=require('../tests/shared/lab-catalog.cjs');
const argv=process.argv.slice(2), topic=argv.shift()||'list';
const allowed=new Set(['case','mode','profile','device','base-url','mobile-url','delay','binary','strict-source','update']);
const opts={};
while(argv.length){const flag=argv.shift();if(!flag.startsWith('--')||!allowed.has(flag.slice(2)))throw new Error(`Tham số không hợp lệ: ${flag}`);opts[flag.slice(2)]=['strict-source','update'].includes(flag.slice(2))?true:argv.shift();}
if(topic==='list'){
  for(const c of catalog.cases) console.log(`${c.id.padEnd(18)} ${c.topics.join(',').padEnd(31)} ${c.title}${c.duplicateOf?' (trùng dữ liệu '+c.duplicateOf+')':''}`);
  process.exit(0);
}
if(!['api','web','mobile','visual','performance','report'].includes(topic))throw new Error('Chủ đề: api, web, mobile, visual, performance, report.');
const mode=opts.mode||(topic==='api'?'run':topic==='performance'?'run':'watch');
if(!['run','watch','step','ui'].includes(mode))throw new Error('mode phải là run, watch, step hoặc ui.');
const baseURL=opts['base-url']||'http://127.0.0.1:5080';
let selected=topic==='report'?[]:selectCases(topic,opts.case||'');
if(opts.update&&topic!=='visual')throw new Error('--update chỉ dành cho visual.');
if(topic==='performance'&&opts.profile==='ui'){
  if(opts.case&&selected.some(c=>c.kind!=='check'))throw new Error('UI timing dùng các case DATE/INPUT; MONTH kiểm tra qua API.');
  selected=selected.filter(c=>c.kind==='check');
}
const env={...process.env,LAB_CASE:opts.case||'',LAB_MODE:mode,LAB_STRICT_SOURCE:opts['strict-source']?'1':'0',TEST_BASE_URL:baseURL,LAB_DELAY_MS:opts.delay||'700'};
env.LAB_TOPIC=topic==='performance'?'ui-performance':topic;
if(!/^\d+$/.test(env.LAB_DELAY_MS))throw new Error('--delay phải là số mili giây không âm.');
const logDir=path.join(root,'reports','labs');fs.mkdirSync(logDir,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const logFile=path.join(logDir,`${topic}-${stamp}.log`);
function run(binary,args,cwd=root,extra={}){
  return new Promise((resolve,reject)=>{
    const log=fs.createWriteStream(logFile,{flags:'a'});
    const child=spawn(binary,args,{cwd,env:{...env,...extra},stdio:['inherit','pipe','pipe'],windowsHide:true});
    for(const [source,dest] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])source.on('data',data=>{dest.write(data);log.write(data);});
    child.on('error',error=>{log.end();reject(error);});
    child.on('close',code=>{log.end();resolve(code??1);});
  });
}
function flutter(args,extra={}){
  const bin=process.env.FLUTTER_BINARY||(process.platform==='win32'?'D:\\flutter\\bin\\flutter.bat':'flutter');
  if(process.platform!=='win32')return run(bin,args,path.join(root,'apps','mobile'),extra);
  if(!fs.existsSync(bin))throw new Error('Không tìm thấy Flutter. Đặt FLUTTER_BINARY bằng đường dẫn flutter.bat.');
  const literal=s=>`'${s.replace(/'/g,"''")}'`;
  const command=`& ${literal(bin)} ${args.map(literal).join(' ')}; exit $LASTEXITCODE`;
  return run('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],path.join(root,'apps','mobile'),extra);
}
(async()=>{
  const cli=path.join(root,'node_modules','@playwright','test','cli.js');
  if(topic==='report'){
    const folder=opts.profile||'web';
    if(!['api','web','visual','ui-performance','all'].includes(folder))throw new Error('Report profile: api, web, visual, ui-performance hoặc all.');
    return run(process.execPath,[cli,'show-report',`reports/labs/${folder}/playwright`]);
  }
  const health=await fetch(new URL('/api/health',baseURL),{signal:AbortSignal.timeout(5000)});
  if(!health.ok)throw new Error('Backend chưa sẵn sàng.');
  const healthBody=await health.json();if(healthBody.application!=='Date Time Checker')throw new Error('Địa chỉ đang chạy không phải backend Date Time Checker.');
  env.USE_EXTERNAL_SERVER='1';
  console.log(`\nChủ đề: ${topic}; mode: ${mode}; ${selected.length} case; backend: ${baseURL}`);
  console.log(`Log: ${logFile}\n`);
  if(topic==='api'&&mode==='step')return run(process.execPath,[path.join(__dirname,'api-step.cjs')]);
  if(topic==='mobile'){
    if(mode==='ui')throw new Error('Mobile dùng mode watch hoặc step trên giả lập; UI mode thuộc Playwright.');
    const json=JSON.stringify({cases:catalog.cases.filter(c=>c.topics.includes('mobile'))});
    if(json.includes("'''"))throw new Error('Dữ liệu chứa dấu nháy không thể nhúng vào Dart.');
    fs.writeFileSync(path.join(root,'tests','mobile-e2e','lab_cases.g.dart'),`// Generated from tests/shared/lab-cases.json by lab-runner.cjs.\nconst labCatalogJson = r'''${json}''';\n`,'utf8');
    const dependencies=await flutter(['pub','get']);if(dependencies!==0)return dependencies;
    return flutter(['drive','--driver=test_driver/lab_driver.dart','--target=integration_test/lab_test.dart','-d',opts.device||'emulator-5554',
      `--dart-define=API_BASE_URL=${opts['mobile-url']||'http://10.0.2.2:5080'}`,`--dart-define=LAB_CASE=${opts.case||''}`,`--dart-define=LAB_MODE=${mode}`,`--dart-define=LAB_DELAY_MS=${env.LAB_DELAY_MS}`,`--dart-define=LAB_STRICT_SOURCE=${env.LAB_STRICT_SOURCE}`],{LAB_REPORT_DIR:logDir});
  }
  if(topic==='performance'&&opts.profile!=='ui'){
    const profile=opts.profile||'observe';if(!['observe','load','stress'].includes(profile))throw new Error('profile: observe, load, stress hoặc ui.');
    const portable=path.join(root,'.tooling','k6','k6-v2.3.0-windows-amd64','k6.exe');
    let binary=opts.binary||process.env.K6_BINARY;
    if(!binary){
      if(!fs.existsSync(portable)){
        const installed=await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'setup-k6.ps1')]);
        if(installed!==0)return installed;
      }
      binary=portable;
    }
    return run(binary,['run','tests/performance/student.lab.k6.js'],root,{BASE_URL:baseURL,PROFILE:profile});
  }
  const project={api:'lab-api',web:'lab-web',visual:'lab-visual',performance:'lab-ui-performance'}[topic];
  const args=[cli,'test','--config=playwright.lab.config.cjs',`--project=${project}`];
  if(mode==='watch')args.push('--headed');
  if(mode==='step')args.push('--debug');
  if(mode==='ui')args.push('--ui');
  if(opts.update)args.push('--update-snapshots');
  return run(process.execPath,args);
})().then(code=>{process.exitCode=code??0;}).catch(error=>{console.error(`\n${error.message}\nKiểm tra backend đang chạy, công cụ đã cài và mã case trong npm run lab:list.`);process.exitCode=1;});
