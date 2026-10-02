import type {Result} from './algorithms.ts';
export type Status='시작 전'|'진행 중'|'완료'|'재검토 필요';
export type Experiment={id:string;date:string;labIds:string[];walls:number[];prediction:string;observation:string;bfs:Result;astar:Result};
export type Prep={focus:string;gap:string;topic:string;ask:string};
export type State={version:2;step:number;interest:string;experienceInput:string;curiosity:string;recommended:boolean;selected:string[];reasons:Record<string,string>;courseIds:string[];experiments:Experiment[];reflection:Record<string,string>;prep:Prep;messages:{role:'user'|'assistant';text:string}[];statuses:Status[]};
export const key='lab-map-v1';
export const emptyPrep=():Prep=>({focus:'',gap:'',topic:'',ask:''});
export function fresh():State{return {version:2,step:0,interest:'',experienceInput:'',curiosity:'',recommended:false,selected:[],reasons:{},courseIds:[],experiments:[],reflection:{},prep:emptyPrep(),messages:[],statuses:['시작 전','시작 전','시작 전','시작 전']};}
const statuses=['시작 전','진행 중','완료','재검토 필요'];
function strings(v:unknown):v is string[]{return Array.isArray(v)&&v.every(x=>typeof x==='string');}
function stringRecord(v:unknown):v is Record<string,string>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(x=>typeof x==='string');}
function experimentOk(e:any){return e&&typeof e.id==='string'&&typeof e.date==='string'&&Array.isArray(e.labIds)&&Array.isArray(e.walls)&&e.walls.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<100)&&typeof e.prediction==='string'&&typeof e.observation==='string'&&[e.bfs,e.astar].every((r:any)=>r&&Array.isArray(r.visited)&&Array.isArray(r.path)&&(r.length===null||Number.isInteger(r.length)));}
function prepOf(v:unknown):Prep{return stringRecord(v)&&['focus','gap','topic','ask'].every(k=>typeof v[k]==='string')?{focus:v.focus,gap:v.gap,topic:v.topic,ask:v.ask}:emptyPrep();}
export function decode(raw:string|null):State{
 try{
  const s=JSON.parse(raw||'null');
  const base=s&&(s.version===1||s.version===2)&&Number.isInteger(s.step)&&s.step>=0&&s.step<=3&&['interest','experienceInput','curiosity'].every(k=>typeof s[k]==='string')&&typeof s.recommended==='boolean'&&['selected','courseIds'].every(k=>strings(s[k]))&&stringRecord(s.reasons)&&stringRecord(s.reflection)&&Array.isArray(s.statuses)&&s.statuses.length===4&&s.statuses.every((v:string)=>statuses.includes(v))&&Array.isArray(s.messages)&&s.messages.every((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string')&&Array.isArray(s.experiments)&&s.experiments.every(experimentOk);
  if(!base)return fresh();
  return {...s,version:2,prep:prepOf(s.prep)};
 }catch{return fresh();}
}
export function invalidate(s:State,from:number):State{return {...s,statuses:s.statuses.map((v,i)=>i>from&&v!=='시작 전'?'재검토 필요':v)};}
