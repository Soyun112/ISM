import {defineConfig,loadEnv,type Plugin} from 'vite';
import {askGemini} from './server/gemini.ts';
import {askPlan} from './server/plan.ts';

function geminiDev(apiKey:string,model:string):Plugin{
 return {name:'gemini-dev-api',configureServer(server){
  server.middlewares.use('/api/chat',(req,res)=>{
   if(req.method!=='POST'){res.statusCode=405;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'POST only'}));return;}
   const chunks:Buffer[]=[];
   req.on('data',chunk=>chunks.push(Buffer.from(chunk)));
   req.on('end',async()=>{
    try{
     const body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
     const result=body.mode==='plan'?{plan:await askPlan(body,apiKey,model)}:{text:await askGemini(body,apiKey,model)};
     res.setHeader('Content-Type','application/json');
     res.end(JSON.stringify(result));
    }catch(error){
     res.statusCode=500;
     res.setHeader('Content-Type','application/json');
     res.end(JSON.stringify({error:error instanceof Error?error.message:'응답을 만들지 못했습니다.'}));
    }
   });
  });
 }};
}

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 return {plugins:[geminiDev(env.GEMINI_API_KEY||'',env.GEMINI_MODEL||'')]};
});
