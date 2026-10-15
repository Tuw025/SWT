const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>value?new Date(value).toLocaleString('vi-VN'):'—';
const duration=value=>Number.isFinite(value)?`${(value/1000).toFixed(1)} giây`:'—';
const names={api:'API',web:'Web E2E',mobile:'Mobile E2E',visual:'Visual regression','ui-performance':'UI performance',performance:'k6 performance',ai:'AI-assisted',pipeline:'Pipeline tổng hợp'};
let model={runs:[]},selected;
function badge(status){return `<span class="badge ${esc(status)}">${esc(status||'—')}</span>`;}
function pathFor(run,file){return `/runs/${encodeURIComponent(run.storageSource)}/${encodeURIComponent(run.storageId)}/${file}`;}
function render(){
  const source=$('source').value,runs=model.runs.filter(r=>source==='all'||r.source===source);
  if(!runs.some(r=>r.id===selected))selected=runs[0]?.id;
  $('runs').innerHTML=runs.length?runs.map(r=>`<button class="run ${r.id===selected?'selected':''}" data-id="${esc(r.id)}"><span class="muted">${r.source==='github'?'GITHUB ACTIONS':'LOCAL'}${r.number?` · #${esc(r.number)}`:''}</span><strong>${esc(names[r.topic]||r.title||r.topic||'Pipeline')}</strong>${badge(r.status)}<div class="muted">${esc(date(r.startedAt))}</div></button>`).join(''):'<p class="empty">Chưa có lượt kiểm thử trong nhóm này.</p>';
  for(const button of $('runs').querySelectorAll('button'))button.onclick=()=>{selected=button.dataset.id;render();};
  const run=runs.find(r=>r.id===selected),detail=$('detail');
  if(!run){detail.innerHTML='<h2>Chưa có báo cáo</h2><p class="empty">Giữ dashboard mở. Chạy test bằng menu hoặc GitHub Actions, sau đó tải lại trang. Không cần mở backend chỉ để xem báo cáo.</p>';return;}
  const c=run.counts||{},groups=run.groups||[{topic:run.topic,status:run.status,counts:c,reason:run.reason}],m=run.metrics||[];
  const stats=[['Đã ghi nhận',c.total],['Pass',c.passed],['Fail',c.failed],['Lỗi thực thi',c.broken],['Skip',c.skipped]];
  const scope=(run.missing||[]).length;
  const safeGithub=run.url&&/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(run.url)?run.url:null;
  detail.innerHTML=`<div class="muted">${run.source==='github'?'GITHUB ACTIONS':'LOCAL'} · ${esc(run.id)}</div><h2>${esc(names[run.topic]||run.title||'Pipeline tổng hợp')} ${badge(run.status)}</h2>
    <div class="meta">Bắt đầu: <b>${esc(date(run.startedAt))}</b> · Kết thúc: <b>${esc(date(run.finishedAt))}</b><br>Thời gian thực thi: <b>${duration(run.durationMs)}</b> · Môi trường: ${esc(run.platform||'GitHub runner')}<br>Commit: <code>${esc(run.commit?.slice(0,12)||'—')}</code>${run.dirty?' · Có thay đổi chưa commit':''}${run.filter?`<br>Case đã chọn: ${esc(run.filter)}`:''}${run.mode?` · Mode: ${esc(run.mode)}`:''}</div>
    ${run.cloudOnly?`<div class="warning">${esc(run.status==='RUNNING'?'Workflow đang chạy. Báo cáo được tạo sau khi các nhóm test kết thúc.':run.syncNote||'Đang chờ gói báo cáo hoặc đồng bộ từ GitHub.')}</div>`:''}
    ${run.reason?`<div class="warning">${esc(run.reason)}</div>`:''}${run.reportError?`<div class="warning">${esc(run.reportError)}</div>`:''}
    ${run.cloudOnly?'':`<div class="stats">${stats.map(([label,value])=>`<div class="stat"><b>${esc(value??0)}</b><span>${esc(label)}</span></div>`).join('')}</div><p class="muted">Đếm các lần thực thi case theo từng nhóm. Request và threshold k6 được báo cáo riêng. ${scope?`${scope} case dự kiến chưa có kết quả.`:''} ${run.flaky?`${esc(run.flaky)} case có kết quả không ổn định.`:''}</p>`}
    <div class="actions">${run.reportReady?`<a href="${pathFor(run,'report/')}" target="_blank" rel="noopener">Mở Allure Report</a>`:''}${safeGithub?`<a class="secondary" href="${esc(safeGithub)}" target="_blank" rel="noopener">Xem lượt GitHub Actions</a>`:''}${run.storageSource?`<a class="secondary" href="${pathFor(run,'summary.json')}" target="_blank" rel="noopener">Dữ liệu tổng kết</a>`:''}</div>
    ${run.cloudOnly?'':`<h3>Kết quả theo nhóm</h3><div class="tablewrap"><table><thead><tr><th>Nhóm</th><th>Trạng thái</th><th>Pass / Fail / Lỗi / Skip</th><th>Ghi chú</th></tr></thead><tbody>${groups.map(g=>`<tr><td>${esc(names[g.topic]||g.topic)}</td><td>${badge(g.status)}</td><td>${g.counts?`${esc(g.counts.passed)} / ${esc(g.counts.failed)} / ${esc(g.counts.broken)} / ${esc(g.counts.skipped)}`:'—'}</td><td>${esc(g.reason||g.error||(g.missing?.length?`${g.missing.length} case chưa có kết quả`:''))}</td></tr>`).join('')}</tbody></table></div>`}
    ${m.length?`<h3>Hiệu năng API</h3>${m.map(v=>`<div class="tablewrap"><table><tbody><tr><th>Profile</th><td>${esc(v.profile)}</td><th>Requests</th><td>${v.requests}</td></tr><tr><th>p95</th><td>${v.p95Ms?.toFixed(2)??'—'} ms</td><th>Tỷ lệ request lỗi</th><td>${((v.errorRate||0)*100).toFixed(2)}%</td></tr></tbody></table><p>${Object.entries(v.thresholds).map(([rule,ok])=>`${badge(ok?'PASS':'FAIL')} ${esc(rule)}`).join('<br>')}</p></div>`).join('')}`:''}
    ${(run.diagnostics||[]).length?`<h3>Vấn đề cần xem</h3><div class="warning">${run.diagnostics.map(esc).join('<br>')}</div>`:''}
    ${(run.notes||[]).length?`<h3>Phạm vi và giới hạn</h3><ul class="notes">${run.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}`;
}
let polling;
async function load(){
  $('refresh').disabled=true;
  try{
    const response=await fetch('/api/dashboard',{cache:'no-store'});if(!response.ok)throw new Error('Không đọc được dashboard.');model=await response.json();
    const sync=model.sync;
    $('sync').textContent=`GitHub ${model.repository}: ${sync.syncing?'đang đồng bộ…':sync.error||`lần kiểm tra thành công gần nhất ${date(sync.lastSuccess)}`}. Kết quả Local vẫn xem được khi GitHub mất kết nối.`;
    render();clearTimeout(polling);if(sync.syncing)polling=setTimeout(load,2500);
  }catch(error){$('sync').textContent=error.message+' Kiểm tra terminal chạy npm.cmd run dashboard.';}
  finally{$('refresh').disabled=false;}
}
$('refresh').onclick=load;$('source').onchange=render;load();
