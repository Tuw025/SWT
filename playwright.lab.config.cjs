const base=require('./playwright.config.cjs');
const {defineConfig,devices}=require('@playwright/test');
const reportLabel=process.env.LAB_REPORT_LABEL||process.env.LAB_TOPIC||'all';
if(!/^[a-z-]+$/.test(reportLabel))throw new Error('Report label must contain lowercase letters and hyphens.');
const reportRoot=require('node:path').join(process.env.LAB_OUTPUT_DIR||'reports/labs',reportLabel);
module.exports=defineConfig({...base,
  testMatch:'**/*.lab.cjs',
  outputDir:`${reportRoot}/artifacts`,
  timeout:process.env.LAB_MODE==='step'?0:60_000,
  globalTimeout:process.env.LAB_MODE==='step'?0:20*60_000,
  reporter:[['list'],['html',{outputFolder:`${reportRoot}/playwright`,open:'never'}],['json',{outputFile:`${reportRoot}/playwright-results.json`}]],
  use:{...base.use,trace:'on',screenshot:'on',launchOptions:{slowMo:process.env.LAB_MODE==='watch'?150:0}},
  snapshotPathTemplate:'{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  projects:[
    {name:'lab-ai-api',testDir:'./tests/ai-assisted',testMatch:'api-ai.lab.cjs'},
    {name:'lab-ai-web',testDir:'./tests/ai-assisted',testMatch:'web-ai.lab.cjs',use:{...devices['Desktop Chrome']}},
    {name:'lab-api',testDir:'./tests/api'},
    {name:'lab-web',testDir:'./tests/web-e2e',use:{...devices['Desktop Chrome']}},
    {name:'lab-visual',testDir:'./tests/visual',use:{...devices['Desktop Chrome']}},
    {name:'lab-ui-performance',testDir:'./tests/performance',use:{...devices['Desktop Chrome']}},
  ]
});
