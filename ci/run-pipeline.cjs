const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
console.log('Mô phỏng CI tại máy: tự build/start/stop backend ở port 5097; chạy không tương tác. Mobile chạy riêng trên giả lập.');
let failed=false;
for(const topic of ['api','web','visual','ui-performance','ai','performance']){
  const child=spawnSync(process.execPath,[path.join(__dirname,'run-topic.cjs'),topic],{cwd:root,stdio:'inherit',windowsHide:true});
  if(child.error||child.status!==0)failed=true;
}
process.exitCode=failed?1:0;
