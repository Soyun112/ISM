import type {State} from './store.ts';
import {labs,relatedCourses,taughtCourses} from './data.ts';
import {ragIntro,ragScenes} from './rag-demo.ts';
import {ragLabId,ragTopic} from './experience-data.ts';

export const directions=[
 {id:'deepen',title:'이 연구를 더 알아보고 싶어요',description:'기초 개념과 대표 연구를 살펴보고 작은 실험으로 이어갑니다.'},
 {id:'compare',title:'두 연구실 사이에서 고민돼요',description:'같은 질문을 기준으로 두 연구실의 연구 문제와 방법을 비교합니다.'},
 {id:'basics',title:'아직 어려워서 기초부터 알고 싶어요',description:'관련 수업과 쉬운 자료로 핵심 개념부터 확인합니다.'}
] as const;
export type Direction=typeof directions[number]['id'];
export type Familiarity='new'|'concepts'|'code';
export type PlanInput={direction:Direction|null;question:string;startDate:string;availableDates:string[];minutes:15|30|60;familiarity:Familiarity};
export type Activity={id:string;date:string;title:string;minutes:number;reason:string;task:string;completion:string;resourceIds:string[];question:string;done:boolean;note:string};
export type PlanBasis={signature:string;interest:string;labIds:string[];topicId:string|null;topicLabId:string|null};
export type Plan={id:string;revision:number;createdAt:string;input:PlanInput;basis:PlanBasis;activities:Activity[]};
export type Proposal={plan:Plan;baseId:string|null;baseRevision:number|null;adjustment:string};
export type WeekState={input:PlanInput;plan:Plan|null;proposal:Proposal|null;savedAt:string|null;activeId:string|null};
export type Resource={id:string;title:string;url?:string;labId:string;kind:string;code?:string;description?:string};
export type PlanningContext=Pick<State,'interest'|'selected'|'reasons'|'courseIds'|'experienceSelection'|'rag'|'reflection'>;
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validDate(s:unknown):s is string{
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [y,m,d]=s.split('-').map(Number);return y>=2000&&y<=2200&&localDate(new Date(y,m-1,d,12))===s;
}
export function weekDates(start:string){if(!validDate(start))return [];const [y,m,d]=start.split('-').map(Number);return Array.from({length:7},(_,i)=>localDate(new Date(y,m-1,d+i,12)));}
export function dateLabel(date:string){const [y,m,d]=date.split('-').map(Number);return new Date(y,m-1,d,12).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'});}
export function emptyWeek():WeekState{return {input:{direction:null,question:'',startDate:localDate(),availableDates:[],minutes:30,familiarity:'new'},plan:null,proposal:null,savedAt:null,activeId:null};}
export function resourcesFor(ids:string[],topicId?:string|null):Resource[]{
 const result:Resource[]=[];
 for(const lab of labs.filter(l=>ids.includes(l.id))){
  if(lab.website)result.push({id:`lab:${lab.id}:home`,title:`${lab.name} 공식 홈페이지`,url:lab.website,labId:lab.id,kind:'연구실 소개'});
  lab.officialSources.forEach((url,i)=>result.push({id:`lab:${lab.id}:official:${i}`,title:`${lab.name} 대학 공식 자료`,url,labId:lab.id,kind:'공식 자료'}));
  lab.detail?.papers.forEach((p,i)=>result.push({id:`paper:${lab.id}:${i}`,title:p.title,url:p.url,description:p.description,labId:lab.id,kind:'논문 목록·연구 사례'}));
  (taughtCourses[lab.professor]||[]).forEach(c=>result.push({id:`course:${lab.id}:${c.code}`,title:c.name,code:c.code,labId:lab.id,kind:'제공된 담당 수업'}));
  relatedCourses(lab).forEach(c=>result.push({id:c.id,title:c.name,description:c.note,labId:lab.id,kind:'관련 학습 주제'}));
 }
 if(ids.includes(ragLabId)&&topicId===ragTopic.id)ragIntro.papers.forEach((p,i)=>result.push({id:`rag-source:${i}`,title:p.label,url:p.href,labId:ragLabId,kind:'체험 연결 자료'}));
 return result;
}
export const allResources=resourcesFor(labs.map(l=>l.id),ragTopic.id);
export function sourceBasis(c:PlanningContext):PlanBasis{
 const fields={interest:c.interest,selected:[...c.selected].sort(),reasons:Object.fromEntries([...c.selected].sort().map(id=>[id,c.reasons[id]||''])),courses:[...c.courseIds].sort(),topic:c.experienceSelection,executed:c.rag.executed,observation:c.rag.observation,reflection:c.reflection};
 return {signature:JSON.stringify(fields),interest:c.interest,labIds:[...c.selected],topicId:c.experienceSelection?.topicId||null,topicLabId:c.experienceSelection?.labId||null};
}
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function strings(v:unknown):v is string[]{return Array.isArray(v)&&v.every(x=>typeof x==='string');}
export function inputOf(v:unknown):PlanInput{
 if(!object(v)||!(v.direction===null||directions.some(d=>d.id===v.direction))||typeof v.question!=='string'||v.question.length>2000||!validDate(v.startDate)||!strings(v.availableDates)||v.availableDates.some(d=>!weekDates(v.startDate as string).includes(d))||new Set(v.availableDates).size!==v.availableDates.length||typeof v.minutes!=='number'||![15,30,60].includes(v.minutes)||!['new','concepts','code'].includes(String(v.familiarity)))throw new Error('날짜·시간·익숙한 정도를 다시 확인해 주세요.');
 return {direction:v.direction as Direction|null,question:v.question,startDate:v.startDate,availableDates:[...v.availableDates],minutes:v.minutes as 15|30|60,familiarity:v.familiarity as Familiarity};
}
export function inputReady(input:PlanInput){return !!input.direction&&input.availableDates.length>0;}
function activityOf(v:unknown):Activity{
 if(!object(v)||typeof v.id!=='string'||!/^activity-[1-3]$/.test(v.id)||!validDate(v.date)||!['title','reason','task','completion','question','note'].every(k=>typeof v[k]==='string'&&(v[k] as string).length<=4000)||!Number.isInteger(v.minutes)||Number(v.minutes)<5||Number(v.minutes)>60||!strings(v.resourceIds)||v.resourceIds.some(id=>!allResources.some(r=>r.id===id))||typeof v.done!=='boolean')throw new Error('활동 형식이 올바르지 않습니다.');
 return v as unknown as Activity;
}
export function storedPlan(v:unknown):Plan|null{
 try{
  if(!object(v)||typeof v.id!=='string'||!Number.isInteger(v.revision)||Number(v.revision)<0||typeof v.createdAt!=='string'||!object(v.basis)||typeof v.basis.signature!=='string'||typeof v.basis.interest!=='string'||!strings(v.basis.labIds)||!(v.basis.topicId===null||typeof v.basis.topicId==='string')||!(v.basis.topicLabId===null||typeof v.basis.topicLabId==='string')||!Array.isArray(v.activities)||v.activities.length<1||v.activities.length>3)return null;
  const activities=v.activities.map(activityOf);if(new Set(activities.map(a=>a.id)).size!==activities.length)return null;
  const plan={id:v.id,revision:v.revision as number,createdAt:v.createdAt,input:inputOf(v.input),basis:v.basis as PlanBasis,activities};
  checkSchedule(activities,plan.input);return plan;
 }catch{return null;}
}
export function restoreWeek(v:unknown):WeekState{
 const base=emptyWeek();if(!object(v))return base;
 try{base.input=inputOf(v.input);}catch{/* Preserve usable plan independently of a damaged form. */}
 base.plan=storedPlan(v.plan);
 if(object(v.proposal)){const plan=storedPlan(v.proposal.plan);if(plan&&(v.proposal.baseId===null||typeof v.proposal.baseId==='string')&&(v.proposal.baseRevision===null||Number.isInteger(v.proposal.baseRevision))&&typeof v.proposal.adjustment==='string')base.proposal={plan,baseId:v.proposal.baseId as string|null,baseRevision:v.proposal.baseRevision as number|null,adjustment:v.proposal.adjustment};}
 base.savedAt=typeof v.savedAt==='string'?v.savedAt:null;base.activeId=typeof v.activeId==='string'?v.activeId:null;return base;
}
export function checkSchedule(activities:Activity[],input:PlanInput){
 const used=new Map<string,number>();
 for(const a of activities){
  // Completed work is retained even if a later proposal changes the week or availability.
  if(!a.done&&!input.availableDates.includes(a.date))throw new Error('선택하지 않은 날짜의 활동은 저장할 수 없습니다.');
  if(input.availableDates.includes(a.date))used.set(a.date,(used.get(a.date)||0)+a.minutes);
 }
 for(const [day,total] of used)if(total>input.minutes&&activities.some(a=>a.date===day&&!a.done))throw new Error('선택한 하루 시간보다 활동 시간이 깁니다. 시간을 줄이거나 날짜를 바꿔 주세요.');
}
const generatedKeys=['id','date','title','minutes','reason','task','completion','resourceIds','question'];
export function validatePlanResponse(raw:unknown,input:PlanInput,resources:Resource[],previous:Plan|null):Activity[]{
 if(!object(raw)||Object.keys(raw).some(k=>k!=='activities')||!Array.isArray(raw.activities))throw new Error('AI 계획 형식을 확인하지 못했습니다. 다시 시도해 주세요.');
 const completed=previous?.activities.filter(a=>a.done)||[];
 const expected=previous?.activities.filter(a=>!a.done).map(a=>a.id);
 if(raw.activities.length<1||raw.activities.length+completed.length>3)throw new Error('계획은 완료 활동을 포함해 최대 3개여야 합니다.');
 const allowed=new Set(resources.map(r=>r.id));
 const activities=raw.activities.map((v:unknown)=>{
  if(!object(v)||Object.keys(v).some(k=>!generatedKeys.includes(k))||generatedKeys.some(k=>!(k in v)))throw new Error('AI가 허용되지 않은 활동 정보를 반환했습니다.');
  for(const key of ['title','reason','task','completion','question'])if(typeof v[key]!=='string'||!(v[key] as string).trim()||/https?:|www\.|\b[A-Z]{2,6}\d{3,5}(?:-\d{2})?\b/.test(v[key] as string))throw new Error('AI가 직접 만든 URL·강의코드 또는 빈 내용을 반환했습니다. 다시 시도해 주세요.');
  if(!strings(v.resourceIds)||v.resourceIds.some(id=>!allowed.has(id)))throw new Error('확인되지 않은 자료 식별자를 포함한 계획입니다.');
  const old=previous?.activities.find(a=>a.id===v.id);
  return activityOf({...v,done:false,note:old?.note||''});
 });
 if(new Set([...activities,...completed].map(a=>a.id)).size!==activities.length+completed.length)throw new Error('활동 ID가 중복되었습니다.');
 if(expected&&(expected.length!==activities.length||activities.some(a=>!expected.includes(a.id))))throw new Error('수정안은 기존 미완료 활동과 메모를 유지해야 합니다.');
 const merged=[...completed,...activities];checkSchedule(merged,input);return merged.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function applyProposal(week:WeekState):WeekState{
 const p=week.proposal;if(!p)throw new Error('적용할 수정안이 없습니다.');
 if((week.plan?.id||null)!==p.baseId||(week.plan?.revision??null)!==p.baseRevision)throw new Error('원래 계획이 변경되었습니다. 수정안을 다시 만들어 주세요.');
 const activities=p.plan.activities.map(a=>{const current=week.plan?.activities.find(x=>x.id===a.id);return current?.done?current:{...a,note:current?.note??a.note};});
 checkSchedule(activities,p.plan.input);
 return {...week,plan:{...p.plan,activities},proposal:null,activeId:activities[0]?.id||null};
}
export function editActivity(week:WeekState,id:string,patch:Partial<Pick<Activity,'title'|'date'|'minutes'|'done'|'note'>>):WeekState{
 if(!week.plan)return week;
 const activities=week.plan.activities.map(a=>a.id===id?activityOf({...a,...patch}):a);
 if(activities.some(a=>!a.title.trim()))throw new Error('활동 제목을 입력해 주세요.');
 checkSchedule(activities,week.plan.input);
 const structural='title' in patch||'date' in patch||'minutes' in patch;
 return {...week,plan:{...week.plan,activities,revision:week.plan.revision+(structural?1:0)}};
}
export function contextDescription(c:PlanningContext){
 return {interest:c.interest,labs:labs.filter(l=>c.selected.includes(l.id)).map(l=>({id:l.id,name:l.name,fields:l.researchFields,problem:l.detail?.questions,methods:l.detail?.methods,personalReason:c.reasons[l.id]||'',learning:relatedCourses(l)})),savedCourses:c.courseIds,experience:c.experienceSelection,executed:c.rag.executed.map(id=>ragScenes[id].label),observation:c.rag.observation,opinion:c.reflection};
}
