import type {Result} from './algorithms.ts';
import type {RagStage} from './rag-demo.ts';
import {labs} from './data.ts';
import {ragTopic,topicForLab,type ExperienceSelection} from './experience-data.ts';
import {emptyWeek,restoreWeek,type WeekState} from './planning.ts';
export type Status='시작 전'|'진행 중'|'완료'|'재검토 필요';
export type Experiment={id:string;date:string;labIds:string[];walls:number[];prediction:string;observation:string;bfs:Result;astar:Result};
export type Prep={focus:string;gap:string;topic:string;ask:string};
export type Rag={stage:RagStage;executed:RagStage[];displayedStage:RagStage|null;savedAt:string|null;observation:string;planSaved:boolean;studyIds:string[]};
export type State={version:4;step:number;interest:string;experienceInput:string;curiosity:string;recommended:boolean;selected:string[];reasons:Record<string,string>;courseIds:string[];experiments:Experiment[];reflection:Record<string,string>;prep:Prep;experienceSelection:ExperienceSelection|null;rag:Rag;week:WeekState;messages:{role:'user'|'assistant';text:string}[];statuses:Status[]};
export const key='lab-map-v1';
export const emptyPrep=():Prep=>({focus:'',gap:'',topic:'',ask:''});
export const emptyDemoRag=():Rag=>({stage:'normal',executed:[],displayedStage:null,savedAt:null,observation:'',planSaved:false,studyIds:[]});
export function fresh():State{return {version:4,step:0,interest:'',experienceInput:'',curiosity:'',recommended:false,selected:[],reasons:{},courseIds:[],experiments:[],reflection:{},prep:emptyPrep(),experienceSelection:null,rag:emptyDemoRag(),week:emptyWeek(),messages:[],statuses:['시작 전','시작 전','시작 전','시작 전']};}
const statuses=['시작 전','진행 중','완료','재검토 필요'];
function strings(v:unknown):v is string[]{return Array.isArray(v)&&v.every(x=>typeof x==='string');}
function stringRecord(v:unknown):v is Record<string,string>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(x=>typeof x==='string');}
function experimentOk(e:any){return e&&typeof e.id==='string'&&typeof e.date==='string'&&Array.isArray(e.labIds)&&Array.isArray(e.walls)&&e.walls.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<100)&&typeof e.prediction==='string'&&typeof e.observation==='string'&&[e.bfs,e.astar].every((r:any)=>r&&Array.isArray(r.visited)&&Array.isArray(r.path)&&(r.length===null||Number.isInteger(r.length)));}
function prepOf(v:unknown):Prep{return stringRecord(v)&&['focus','gap','topic','ask'].every(k=>typeof v[k]==='string')?{focus:v.focus,gap:v.gap,topic:v.topic,ask:v.ask}:emptyPrep();}
const stageOrder:RagStage[]=['normal','attack','defense'];
function ragOf(v:unknown):Rag{
 if(!v||typeof v!=='object'||Array.isArray(v))return emptyDemoRag();
 const o=v as Record<string,unknown>;
 const stage:RagStage=o.stage==='attack'||o.stage==='defense'?o.stage:'normal';
 // A selected old stage is not evidence that any stage was run.
 const recorded=strings(o.executed)?o.executed:[];
 const executed:RagStage[]=[];
 for(const id of stageOrder){if(!recorded.includes(id))break;executed.push(id);}
 const displayedStage=executed.includes(o.displayedStage as RagStage)?o.displayedStage as RagStage:null;
 return {stage,executed,displayedStage,savedAt:executed.length===3&&typeof o.savedAt==='string'?o.savedAt:null,observation:typeof o.observation==='string'?o.observation:'',planSaved:o.planSaved===true,studyIds:strings(o.studyIds)?o.studyIds:[]};
}
export function decode(raw:string|null):State{
 try{
  const s=JSON.parse(raw||'null');
  const base=s&&[1,2,3,4].includes(s.version)&&Number.isInteger(s.step)&&s.step>=0&&s.step<=(s.version===4?4:3)&&['interest','experienceInput','curiosity'].every(k=>typeof s[k]==='string')&&typeof s.recommended==='boolean'&&['selected','courseIds'].every(k=>strings(s[k]))&&stringRecord(s.reasons)&&stringRecord(s.reflection)&&Array.isArray(s.statuses)&&s.statuses.length===4&&s.statuses.every((v:string)=>statuses.includes(v))&&Array.isArray(s.messages)&&s.messages.every((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string')&&Array.isArray(s.experiments)&&s.experiments.every(experimentOk);
  if(!base)return fresh();
  const prep=prepOf(s.prep),rag=ragOf(s.rag);
  const legacyLab=labs.find(l=>l.id===prep.focus);
  const stored=s.experienceSelection;
  const experienceSelection:ExperienceSelection|null=stored&&typeof stored.labId==='string'&&stored.topicId===ragTopic.id&&topicForLab(labs.find(l=>l.id===stored.labId))?{labId:stored.labId,topicId:stored.topicId}:s.version<3&&topicForLab(legacyLab)?{labId:legacyLab!.id,topicId:ragTopic.id}:null;
  return {...s,version:4,selected:[...new Set(s.selected)] as string[],prep,experienceSelection,rag,week:restoreWeek(s.week),statuses:s.statuses.map((v:Status,i:number)=>i===2&&v==='완료'&&!ragComplete(rag)?'재검토 필요':v)};
 }catch{return fresh();}
}
export function invalidate(s:State,from:number):State{return {...s,statuses:s.statuses.map((v,i)=>i>from&&v!=='시작 전'?'재검토 필요':v)};}

export function toggleCandidate(s:State,id:string):State{
 const chosen=s.selected.includes(id);
 if(!chosen&&(s.selected.length>=2||!labs.some(l=>l.id===id)))return s;
 const next=invalidate(s,0);
 return {...next,selected:chosen?s.selected.filter(x=>x!==id):[...s.selected,id],statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
}
export function selectExperience(s:State,labId:string):State{
 const topic=topicForLab(labs.find(l=>l.id===labId));
 if(s.selected.length!==2||!s.selected.includes(labId)||!topic)return s;
 const next=s.experienceSelection?.labId===labId&&s.experienceSelection.topicId===topic.id?s:invalidate(s,1);
 return {...next,step:2,prep:{...s.prep,focus:labId},experienceSelection:{labId,topicId:topic.id},statuses:next.statuses.map((v,i)=>i===1?'완료':v)};
}
export function canRunStage(rag:Rag,stage:RagStage){
 return stage==='normal'||stage==='attack'&&rag.executed.includes('normal')||stage==='defense'&&rag.executed.includes('attack');
}
export function runRagStage(rag:Rag,stage:RagStage):Rag{
 if(!canRunStage(rag,stage))return rag;
 return {...rag,stage,displayedStage:stage,executed:stageOrder.filter(s=>s===stage||rag.executed.includes(s))};
}
export function ragComplete(rag:Rag){return stageOrder.every(s=>rag.executed.includes(s));}
