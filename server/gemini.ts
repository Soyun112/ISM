import {buildGeminiRequest,type GeminiTurn} from '../src/geminiPrompt.ts';
import type {ChatContext} from '../src/chat.ts';
import {restoreWeek} from '../src/planning.ts';

const defaultModel='gemini-3.8-flash';

export function asContext(value:unknown):ChatContext{
 const source=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const strings=(item:unknown)=>Array.isArray(item)?item.filter((entry):entry is string=>typeof entry==='string').slice(0,12):[];
 const record=(item:unknown)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).filter((entry):entry is [string,string]=>typeof entry[1]==='string')):{};
 const prep=record(source.prep);
 const rag=source.rag&&typeof source.rag==='object'?source.rag as Record<string,unknown>:{};
 const stage=rag.stage==='attack'||rag.stage==='defense'?rag.stage:'normal';
 const stages=['normal','attack','defense'] as const;
 const executed=stages.filter(id=>strings(rag.executed).includes(id));
 const displayedStage=executed.find(id=>id===rag.displayedStage)||null;
 const selection=source.experienceSelection&&typeof source.experienceSelection==='object'?source.experienceSelection as Record<string,unknown>:{};
 return {
  step:typeof source.step==='number'&&source.step>=0&&source.step<=4?source.step:0,
  interest:typeof source.interest==='string'?source.interest.slice(0,1000):'',
  selected:strings(source.selected),
  reasons:record(source.reasons),courseIds:strings(source.courseIds),week:restoreWeek(source.week),
  reflection:record(source.reflection),
  prep:{focus:prep.focus||'',gap:prep.gap||'',topic:prep.topic||'',ask:prep.ask||''},
  experienceSelection:typeof selection.labId==='string'&&typeof selection.topicId==='string'?{labId:selection.labId,topicId:selection.topicId}:null,
  rag:{stage,executed,displayedStage,savedAt:typeof rag.savedAt==='string'?rag.savedAt:null,observation:typeof rag.observation==='string'?rag.observation.slice(0,2000):'',planSaved:rag.planSaved===true,studyIds:strings(rag.studyIds)}
 };
}

function historyOf(value:unknown):GeminiTurn[]{
 if(!Array.isArray(value))return [];
 const turns:GeminiTurn[]=[];
 for(const item of value){
  if(!item||typeof item!=='object')continue;
  const turn=item as Record<string,unknown>;
  if((turn.role!=='user'&&turn.role!=='assistant')||typeof turn.text!=='string')continue;
  turns.push({role:turn.role,text:turn.text});
 }
 return turns.slice(-6);
}

export async function askGemini(body:unknown,apiKey=process.env.GEMINI_API_KEY||'',model=process.env.GEMINI_MODEL||defaultModel){
 if(!apiKey)throw new Error('Gemini API 키가 서버에 없습니다. Vercel 환경 변수 GEMINI_API_KEY를 넣어 주세요.');
 const source=body&&typeof body==='object'?body as Record<string,unknown>:{};
 const question=typeof source.question==='string'?source.question.trim():'';
 if(!question)throw new Error('질문을 입력해 주세요.');
 const request=buildGeminiRequest(question,asContext(source.context),historyOf(source.history));
 return requestGemini(request,apiKey,model);
}

export async function requestGemini(request:ReturnType<typeof buildGeminiRequest>,apiKey=process.env.GEMINI_API_KEY||'',model=process.env.GEMINI_MODEL||defaultModel){
 if(!apiKey)throw new Error('Gemini API 키가 서버에 없습니다. 기존 GEMINI_API_KEY 설정을 확인해 주세요.');
 const chosen=model.trim()||defaultModel;
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosen)}:generateContent`,{
  signal:AbortSignal.timeout(45000),
  method:'POST',
  headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
  body:JSON.stringify({systemInstruction:{parts:[{text:request.system}]},contents:request.contents})
 });
 const payload=await response.json().catch(()=>({})) as {error?:{message?:string};candidates?:{content?:{parts?:{text?:string;thought?:boolean}[]}}[]};
 if(!response.ok){
  const message=(payload.error?.message||'Gemini 응답을 받지 못했습니다.').replaceAll(apiKey,'').slice(0,300);
  throw new Error(message);
 }
 const text=(payload.candidates?.[0]?.content?.parts||[]).filter(part=>part.text&&!part.thought).map(part=>part.text).join('').trim();
 if(!text)throw new Error('Gemini가 표시할 답변을 만들지 않았습니다.');
 return text;
}
