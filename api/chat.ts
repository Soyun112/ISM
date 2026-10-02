import {askGemini} from '../server/gemini.ts';

type ResponseLike={status:(code:number)=>ResponseLike;json:(body:unknown)=>void};

export default async function handler(req:{method?:string;body?:unknown},res:ResponseLike){
 if(req.method!=='POST'){
  res.status(405).json({error:'POST only'});
  return;
 }
 try{
  const text=await askGemini(req.body);
  res.status(200).json({text});
 }catch(error){
  const message=error instanceof Error?error.message:'응답을 만들지 못했습니다.';
  res.status(500).json({error:message});
 }
}
