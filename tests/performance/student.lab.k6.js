import http from 'k6/http';
import exec from 'k6/execution';
import {check,sleep} from 'k6';
const catalog=JSON.parse(open('../shared/lab-cases.json'));
const ids=(__ENV.LAB_CASE||'').split(',').filter(Boolean);
const cases=catalog.cases.filter(c=>c.topics.includes('performance')&&(!ids.length||ids.includes(c.id)));
if(!cases.length)throw new Error('Không có case performance được chọn.');
const profile=__ENV.PROFILE||'observe';
const profiles={
  observe:{executor:'shared-iterations',vus:1,iterations:cases.length,maxDuration:'5m'},
  load:{executor:'constant-vus',vus:10,duration:'20s'},
  stress:{executor:'ramping-vus',startVUs:1,stages:[{duration:'10s',target:10},{duration:'10s',target:25},{duration:'10s',target:0}],gracefulRampDown:'5s'},
};
export const options={scenarios:{dates:profiles[profile]},thresholds:{checks:['rate==1'],http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1000']}};
const baseURL=(__ENV.BASE_URL||'http://127.0.0.1:5080').replace(/\/$/,'');
http.setResponseCallback(http.expectedStatuses(200,422));
export default function(){
  const c=cases[exec.scenario.iterationInTest%cases.length];
  const e={...c.expected,...(__ENV.LAB_STRICT_SOURCE==='1'&&c.sourceMessage?{message:c.sourceMessage}:{})};
  const response=http.post(`${baseURL}/api/date/check`,JSON.stringify(c.input),{headers:{'Content-Type':'application/json'},tags:{caseId:c.id},timeout:'10s'});
  let actual={};try{actual=response.json();}catch(_){}
  const checks={'HTTP status':()=>response.status===e.status};
  for(const [key,value] of Object.entries(e))if(key!=='status')checks[key]=()=>actual[key]===value;
  const passed=check(response,checks,{caseId:c.id});
  if(profile==='observe')console.log(JSON.stringify({caseId:c.id,input:c.input,expected:e,actual:{status:response.status,...actual},durationMs:response.timings.duration,result:passed?'PASS':'FAIL'}));
  sleep(profile==='observe'?Number(__ENV.LAB_DELAY_MS||700)/1000:0.2);
}
export function handleSummary(data){
  const m=data.metrics;
  const thresholdResults=Object.fromEntries(Object.entries(m).flatMap(([name,v])=>Object.entries(v.thresholds||{}).map(([rule,r])=>[`${name}: ${rule}`,r.ok])));
  return {[`reports/labs/performance-${profile}.json`]:JSON.stringify({profile,caseIds:cases.map(c=>c.id),thresholdResults,...data},null,2),stdout:`\n${profile}: ${m.http_reqs.values.count} requests; checks=${(m.checks.values.rate*100).toFixed(1)}%; p95=${m.http_req_duration.values['p(95)'].toFixed(2)}ms\n${JSON.stringify(thresholdResults)}\nNgưỡng tải là mục tiêu thực hành; requirement R14 phải đo từ UI riêng.\n`};
}
