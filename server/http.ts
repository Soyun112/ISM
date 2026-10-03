import {askGemini} from './gemini.ts';
import {askPlan} from './plan.ts';

type ResponseLike={status:(code:number)=>ResponseLike;json:(body:unknown)=>void};

export default async function handler(req:{method?:string;body?:unknown},res:ResponseLike){
 if(req.method!=='POST'){
  res.status(405).json({error:'POST only'});
  return;
 }
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body;
  const isPlan=!!body&&typeof body==='object'&&'mode' in body&&(body as {mode?:unknown}).mode==='plan';
  res.status(200).json(isPlan?{plan:await askPlan(body)}:{text:await askGemini(body)});
 }catch(error){
  const message=error instanceof Error?error.message:'응답을 만들지 못했습니다.';
  res.status(500).json({error:message});
 }
}
