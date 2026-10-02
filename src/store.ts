import {areas} from './areas.ts';
export type Status='시작 전'|'진행 중'|'완료'|'재검토 필요';
export type Visit={areaId:string; curious:boolean};
export type Experiment={id:string; date:string; labIds:string[]; note:string; ask:string; focus:string; visits:Visit[]};
export type State={version:6; step:number; interest:string; experienceInput:string; curiosity:string; recommended:boolean; selected:string[]; reasons:Record<string,string>; courseIds:string[]; experiments:Experiment[]; reflection:Record<string,string>; messages:{role:'user'|'assistant'; text:string}[]; statuses:Status[]};
export const key='lab-map-v6';
export function fresh():State{return {version:6, step:0, interest:'', experienceInput:'', curiosity:'', recommended:false, selected:[], reasons:{}, courseIds:[], experiments:[], reflection:{}, messages:[], statuses:['시작 전','시작 전','시작 전','시작 전']};}
const statuses=['시작 전','진행 중','완료','재검토 필요'];
const areaIds=areas.map(area=>area.id);
function validVisit(v:any){return v&&areaIds.includes(v.areaId)&&typeof v.curious==='boolean';}
export function decode(raw:string|null):State{
 try{const s=JSON.parse(raw||'null');if(!s||s.version!==6||!Number.isInteger(s.step)||s.step<0||s.step>3||!['interest','experienceInput','curiosity'].every(k=>typeof s[k]==='string')||typeof s.recommended!=='boolean'||!['selected','courseIds'].every(k=>Array.isArray(s[k])&&s[k].every((v:unknown)=>typeof v==='string'))||!s.reasons||Object.values(s.reasons).some(v=>typeof v!=='string')||!s.reflection||Object.values(s.reflection).some(v=>typeof v!=='string')||!Array.isArray(s.statuses)||s.statuses.length!==4||!s.statuses.every((v:string)=>statuses.includes(v))||!Array.isArray(s.messages)||!s.messages.every((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string')||!Array.isArray(s.experiments)||!s.experiments.every((e:any)=>e&&typeof e.id==='string'&&typeof e.date==='string'&&Array.isArray(e.labIds)&&typeof e.note==='string'&&typeof e.ask==='string'&&areaIds.includes(e.focus)&&Array.isArray(e.visits)&&e.visits.every(validVisit)))return fresh();return s;}catch{return fresh();}
}
export function invalidate(s:State,from:number):State{return {...s, statuses:s.statuses.map((v,i)=>i>from&&v!=='시작 전'?'재검토 필요':v)};}
