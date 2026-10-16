const readline=require('node:readline/promises');const {spawn}=require('node:child_process');const path=require('node:path');
const {selectCases}=require('../tests/shared/lab-catalog.cjs');
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
async function choose(prompt,choices){
  console.log('\n'+prompt);choices.forEach((c,i)=>console.log(`${i+1}. ${c.label}`));
  for(;;){const index=Number(await rl.question('Nhập số rồi Enter: '))-1;if(Number.isInteger(index)&&choices[index])return choices[index].value;console.log('Chọn một số trong danh sách.');}
}
(async()=>{
  const topic=await choose('Chọn chủ đề kiểm thử',[{label:'API',value:'api'},{label:'Web E2E',value:'web'},{label:'Mobile E2E (giả lập)',value:'mobile'},{label:'Visual regression',value:'visual'},{label:'Performance',value:'performance'},{label:'AI-assisted: xem, duyệt và chạy case AI',value:'ai'}]);
  if(topic==='ai'){
    rl.close();
    const file='ai-runner.cjs';
    const child=spawn(process.execPath,[path.join(__dirname,file)],{cwd:path.resolve(__dirname,'..'),stdio:'inherit',windowsHide:true});
    child.on('exit',code=>{process.exitCode=code??1;});child.on('error',e=>{console.error(e.message);process.exitCode=1;});return;
  }
  const cases=selectCases(topic);
  const id=await choose('Chọn case của bạn',[...cases.map(c=>({label:`${c.id}: ${c.title}`,value:c.id})),{label:'Toàn bộ case của chủ đề',value:''}]);
  const args=[path.join(__dirname,'lab-runner.cjs'),topic];if(id)args.push('--case',id);
  if(topic==='performance'){
    const profile=await choose('Cách quan sát performance',[{label:'observe: 1 người dùng, xem từng request/response',value:'observe'},{label:'ui: đo click Check đến dialog (R14)',value:'ui'},{label:'load: 10 người dùng trong 20 giây',value:'load'},{label:'stress: tăng 1 → 10 → 25 người dùng',value:'stress'}]);
    args.push('--profile',profile,'--mode','run');
  }else{
    const mode=await choose('Cách chạy',[{label:topic==='api'?'step: nhấn Enter trước request và trước assertion':topic==='mobile'?'step: bấm Tiếp tục trên điện thoại':'step: dừng từng bước bằng Inspector',value:'step'},{label:'watch: chạy tự động để quan sát',value:'watch'},{label:'run: chạy tự động nhanh',value:'run'}]);
    args.push('--mode',mode);
  }
  if(id){const c=cases.find(c=>c.id===id);console.log(`\nNguồn: ${c.source.file} / ${c.source.sheet} / ${c.source.id||c.source.range}`);console.log('Input:',c.input||'case giao diện');console.log('Expected:',c.expected||'xem layout được mô tả trong Lab');if(c.notes.length)console.log('Ghi chú:',c.notes.join('\n'));}
  console.log('\nBackend phải đang chạy; điện thoại giả lập phải mở nếu test mobile.');
  await rl.question('Nhấn Enter để chạy case đã chọn (Ctrl+C để hủy): ');rl.close();
  const child=spawn(process.execPath,args,{cwd:path.resolve(__dirname,'..'),stdio:'inherit',windowsHide:true});child.on('exit',code=>{process.exitCode=code??1;});child.on('error',e=>{console.error(e.message);process.exitCode=1;});
})().catch(e=>{console.error(e.message);rl.close();process.exitCode=1;});
