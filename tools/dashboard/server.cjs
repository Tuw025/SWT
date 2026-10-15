const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {storage,read}=require('../reporting/launch.cjs');
const github=require('./github.cjs');
const port=Number(process.env.DASHBOARD_PORT||5099);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('DASHBOARD_PORT phải trong 1024–65535.');
function list(source){
  const folder=path.join(storage,source);if(!fs.existsSync(folder))return [];
  return fs.readdirSync(folder,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.isSymbolicLink()&&!e.name.startsWith('.')).flatMap(e=>{
    const summary=read(path.join(folder,e.name,'summary.json'));if(!summary)return [];
    if(summary.status==='RUNNING'&&summary.pid){try{process.kill(summary.pid,0);}catch{summary.status='INTERRUPTED';summary.reason='Tiến trình chạy test đã dừng trước khi hoàn tất báo cáo.';}}
    return [{...summary,storageSource:source,storageId:e.name,planned:undefined}];
  });
}
function data(){
  const local=list('local'),cloud=list('github'),known=new Set(cloud.map(r=>r.id));
  return {repository:github.repo,sync:{syncing:github.state.syncing,error:github.state.error,lastSuccess:github.state.lastSuccess},runs:[...local,...cloud,...github.state.runs.filter(r=>!known.has(r.id))].sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt))};
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.zip':'application/zip','.txt':'text/plain; charset=utf-8','.log':'text/plain; charset=utf-8'};
function serve(res,file,base){
  try{
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    const real=fs.realpathSync(file),boundary=fs.realpathSync(base);
    if(real!==boundary&&!real.startsWith(boundary+path.sep)){res.writeHead(403);return res.end();}
    if(!fs.statSync(real).isFile())throw new Error();
    res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(real).pipe(res);
  }catch{res.writeHead(404);res.end('Không tìm thấy tệp báo cáo.');}
}
const server=http.createServer((req,res)=>{
  // Loopback only, reject unexpected Host and cross-origin browser requests.
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)||req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)){res.writeHead(403);return res.end();}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let pathname,url;try{url=new URL(req.url,'http://localhost');pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname==='/api/dashboard'){
    if(url.searchParams.get('refresh')==='1')github.synchronize(true).catch(()=>{});
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(data()));
  }
  if(pathname==='/')return serve(res,path.join(__dirname,'index.html'),__dirname);
  if(pathname==='/app.js'||pathname==='/style.css')return serve(res,path.join(__dirname,pathname.slice(1)),__dirname);
  const match=pathname.match(/^\/runs\/(local|github)\/([\w.-]+)\/(.*)$/);
  if(match){
    const [,source,id,tail]=match;
    if(id.startsWith('.')||tail.split(/[\\/]/).some(p=>p==='..')||tail.includes('\\')){res.writeHead(403);return res.end();}
    const base=path.join(storage,source,id);return serve(res,path.join(base,tail),base);
  }
  res.writeHead(404);res.end();
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} đang được dùng. Nếu dashboard đã mở, dùng trang hiện tại.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
  console.log(`\nDashboard: http://127.0.0.1:${port}\nGiữ terminal này mở. Backend chạy riêng bằng start.ps1.\nChạy test xong, tải lại trang để xem kết quả. Ctrl+C để đóng dashboard.\n`);
  github.synchronize().catch(()=>{});
});
const timer=setInterval(()=>github.synchronize().catch(()=>{}),60000);timer.unref();
process.on('SIGINT',()=>{server.close();process.exit(0);});
module.exports={data};
