import {useRef,useState,type Dispatch,type SetStateAction} from 'react';
import type {State} from './store.ts';
import {applyProposal,inputReady,resourcesFor,sourceBasis,storedPlan,validatePlanResponse,type Plan,type Activity} from './planning.ts';

export function chatContextOf(s:State){return {step:s.step,interest:s.interest,selected:s.selected,reasons:s.reasons,courseIds:s.courseIds,reflection:s.reflection,prep:s.prep,experienceSelection:s.experienceSelection,rag:s.rag,week:s.week};}
export function adjustmentRequest(text:string){return /(?:계획|활동).*(?:줄여|줄이|바꿔|바꾸|조정)|시간이?\s*(?:부족|줄)|더\s*쉽게|(?:개념|구현).*중심.*(?:바꿔|바꾸)/.test(text);}
function requestKey(s:State){return JSON.stringify([sourceBasis(s).signature,s.week.input,s.week.plan?.id,s.week.plan?.revision]);}
export function usePlanner(state:State,setState:Dispatch<SetStateAction<State>>){
 const ref=useRef(state);ref.current=state;
 const lock=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function generate(adjustment=''){
  if(lock.current)return false;
  const base=ref.current;
  if(!inputReady(base.week.input)){setError('탐색 방향과 공부 가능한 날짜를 먼저 선택해 주세요.');return false;}
  if(adjustment&&!base.week.plan){setError('먼저 추천 계획을 만들어 주세요.');return false;}
  if(base.week.plan?.activities.every(a=>a.done)){setError('모든 활동을 완료했습니다. 조정할 미완료 활동이 없습니다.');return false;}
  lock.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(55000),body:JSON.stringify({mode:'plan',context:chatContextOf(base),input:base.week.input,previous:base.week.plan,adjustment})});
   const payload=await response.json().catch(()=>({})) as {plan?:unknown;error?:string};
   if(!response.ok)throw new Error(payload.error||'계획 생성에 실패했습니다. 다시 시도해 주세요.');
   const candidate=storedPlan(payload.plan);if(!candidate)throw new Error('계획 형식을 확인하지 못했습니다. 기존 기록은 그대로 유지됩니다.');
   if(requestKey(ref.current)!==requestKey(base))throw new Error('생성 중 탐색 기록이나 입력이 바뀌었습니다. 현재 조건으로 다시 만들어 주세요.');
   const plain=(a:Activity)=>({id:a.id,date:a.date,title:a.title,minutes:a.minutes,reason:a.reason,task:a.task,completion:a.completion,resourceIds:a.resourceIds,question:a.question});
   const activities=validatePlanResponse({activities:candidate.activities.filter(a=>!a.done).map(plain)},base.week.input,resourcesFor(base.selected,base.experienceSelection?.topicId),base.week.plan);
   const plan:Plan={...candidate,id:base.week.plan?.id||candidate.id,revision:(base.week.plan?.revision??-1)+1,input:base.week.input,basis:sourceBasis(base),activities};
   setState(current=>{
    if(requestKey(current)!==requestKey(base))return current;
    if(current.week.plan)return {...current,week:{...current.week,proposal:{plan,baseId:base.week.plan!.id,baseRevision:base.week.plan!.revision,adjustment:adjustment||'입력 조건에 맞춰 다시 생성'}}};
    return {...current,week:{...current.week,plan,proposal:null,activeId:activities[0]?.id||null}};
   });return true;
  }catch(e){setError(e instanceof Error?e.message:'계획을 만들지 못했습니다. 다시 시도해 주세요.');return false;}
  finally{lock.current=false;setBusy(false);}
 }
 function apply(){
  try{
   const current=ref.current;
   if(!current.week.proposal)return;
   if(current.week.proposal.plan.basis.signature!==sourceBasis(current).signature||JSON.stringify(current.week.proposal.plan.input)!==JSON.stringify(current.week.input))throw new Error('수정안 생성 후 선택이나 입력이 바뀌었습니다. 현재 조건으로 수정안을 다시 만들어 주세요.');
   const week=applyProposal(current.week);setState(s=>({...s,week}));setError('');
  }catch(e){setError(e instanceof Error?e.message:'수정안을 적용하지 못했습니다.');}
 }
 return {busy,error,generate,apply};
}
