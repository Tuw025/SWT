const {launch,metaFor,child}=require('../tools/reporting/launch.cjs');
const args=process.argv.slice(2),topic=args[0],opts={};
for(let i=1;i<args.length;i++)if(args[i].startsWith('--'))opts[args[i].slice(2)]=args[++i];
opts['base-url']=`http://127.0.0.1:${opts.port||process.env.CI_BACKEND_PORT||5097}`;
opts.mode='run';
launch(metaFor(topic,opts),()=>child(require.resolve('./topic-execute.cjs'),args)).then(code=>{process.exitCode=code??0;}).catch(e=>{console.error(e.message);process.exitCode=1;});
