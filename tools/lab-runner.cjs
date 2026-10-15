const {launch,metaFor,child}=require('./reporting/launch.cjs');
const args=process.argv.slice(2),topic=args[0]||'list',opts={};
for(let i=1;i<args.length;i++)if(args[i].startsWith('--'))opts[args[i].slice(2)]=['update','strict-source'].includes(args[i].slice(2))?true:args[++i];
const execute=()=>child(require.resolve('./lab-execute.cjs'),args);
(['list','report'].includes(topic)?execute():launch(metaFor(topic,opts),execute)).then(code=>{process.exitCode=code??0;}).catch(e=>{console.error(e.message);process.exitCode=1;});
