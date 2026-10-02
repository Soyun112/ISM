import {askGemini} from '../server/gemini.ts';
import {askPlan} from '../server/plan.ts';

type ResponseLike={status:(code:number)=>ResponseLike;json:(body:unknown)=>void};

export default async function handler(req:{method?:string;body?:unknown},res:ResponseLike){
 if(req.method!=='POST'){
  res.status(405).json({error:'POST only'});
  return;
 }
 try{
  const isPlan=!!req.body&&typeof req.body==='object'&&'mode' in req.body&&req.body.mode==='plan';
  res.status(200).json(isPlan?{plan:await askPlan(req.body)}:{text:await askGemini(req.body)});
 }catch(error){
  const message=error instanceof Error?error.message:'응답을 만들지 못했습니다.';
  res.status(500).json({error:message});
 }
}
