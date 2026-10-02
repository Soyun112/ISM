import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,decode,toggleCandidate} from '../src/store.ts';
import {labs} from '../src/data.ts';
import {allResources,applyProposal,checkSchedule,editActivity,emptyWeek,inputOf,resourcesFor,restoreWeek,sourceBasis,storedPlan,validatePlanResponse,weekDates} from '../src/planning.ts';
import {buildPlanRequest,askPlan} from '../server/plan.ts';
import {weekMarkdown} from '../src/week-export.ts';
const sec=labs.find(l=>l.professor==='구형준'),hit=labs.find(l=>l.professor==='최형기');
function context(){const s=fresh();s.step=4;s.interest='보안';s.selected=[sec.id,hit.id];s.reasons[sec.id]='자료를 믿을 수 있는지 궁금해서';s.rag.observation='문서에 따라 답변이 달라졌다';s.week.input={direction:'compare',question:'방법은 어떻게 다를까?',startDate:'2026-10-03',availableDates:['2026-10-03','2026-10-06'],minutes:30,familiarity:'new'};return s;}
function raw(id='activity-1',date='2026-10-03',minutes=15){return {id,date,minutes,title:'연구 문제 한 문장 적기',reason:'보안에 대한 관심을 구체적인 질문으로 좁히기 위해',task:'연구실 소개에서 연구 질문 하나를 골라 자신의 말로 한 문장 적으세요.',completion:'문제 한 문장과 모르는 용어 하나를 적으면 완료',resourceIds:[resourcesFor([sec.id])[0].id],question:'두 연구실이 해결하려는 문제는 어떻게 다른가요?'};}
function plan(){const s=context();return {id:'p1',revision:0,createdAt:'2026-10-03T00:00:00Z',input:s.week.input,basis:sourceBasis(s),activities:validatePlanResponse({activities:[raw(),raw('activity-2','2026-10-06')]},s.week.input,resourcesFor(s.selected),null)};}
test('week dates use local calendar arithmetic across month and year boundaries',()=>{assert.deepEqual(weekDates('2026-12-29'),['2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03','2027-01-04']);assert.deepEqual(weekDates('2026-02-30'),[]);assert.throws(()=>inputOf({...context().week.input,minutes:'30'}));});
test('new page and plan state migrate independently without changing page 4 or old records',()=>{
 const old=context();old.version=3;old.step=3;delete old.week;const s=decode(JSON.stringify(old));assert.equal(s.version,4);assert.equal(s.step,3);assert.deepEqual(s.reasons,old.reasons);assert.equal(s.rag.observation,old.rag.observation);assert.equal(s.week.input.direction,null);assert.deepEqual(s.week.input.availableDates,[]);assert.equal(s.week.plan,null);
 s.step=4;s.week.plan=plan();s.week.plan.activities[0].done=true;s.week.plan.activities[0].note='내 메모';assert.deepEqual(decode(JSON.stringify(s)),s);
 const broken=decode(JSON.stringify({...s,week:{...s.week,plan:{wrong:true}}}));assert.equal(broken.interest,s.interest);assert.deepEqual(broken.reasons,s.reasons);assert.equal(broken.week.plan,null);
});
test('plan rejects unknown dates, resource IDs, URLs, codes, duplicate IDs and excessive time',()=>{
 const s=context(),allowed=resourcesFor(s.selected),validate=activities=>validatePlanResponse({activities},s.week.input,allowed,null);
 assert.equal(validate([raw()]).length,1);
 for(const patch of [{date:'2026-10-04'},{resourceIds:['made-up']},{title:'https://fake.example/'},{task:'FAKE1234 강의를 수강하세요.'},{done:true},{url:'https://fake.example/'}])assert.throws(()=>validate([{...raw(),...patch}]));
 assert.throws(()=>validate([raw(),raw()]));assert.throws(()=>validate([raw(),raw('activity-2','2026-10-03',30)]));assert.throws(()=>validate([raw('activity-1'),raw('activity-2'),raw('activity-3'),raw('activity-4')]));
 assert.throws(()=>validate([{...raw(),resourceIds:['rag-source:0']}]),'RAG resources are unavailable without connected topic');
});
test('adjustments preserve completed activities and latest notes until explicit apply',()=>{
 const current=plan();current.activities[0]={...current.activities[0],done:true,note:'완료 메모'};current.activities[1].note='미완료 메모';
 const s=context(),activities=validatePlanResponse({activities:[{...raw('activity-2','2026-10-06',10),title:'범위를 줄인 활동'}]},s.week.input,resourcesFor(s.selected),current);
 let week={...emptyWeek(),input:s.week.input,plan:current,proposal:{baseId:'p1',baseRevision:0,adjustment:'시간 줄이기',plan:{...current,revision:1,activities}}};
 assert.equal(week.plan.activities[1].title,'연구 문제 한 문장 적기');
 week=editActivity(week,'activity-2',{note:'수정안 생성 이후 메모'});const applied=applyProposal(week);
 assert.deepEqual(applied.plan.activities[0],current.activities[0]);assert.equal(applied.plan.activities[1].note,'수정안 생성 이후 메모');assert.equal(applied.plan.activities[1].minutes,10);assert.equal(applied.proposal,null);
 assert.throws(()=>applyProposal(editActivity(week,'activity-2',{title:'수동 수정한 제목'})));
 assert.throws(()=>validatePlanResponse({activities:[]},s.week.input,resourcesFor(s.selected),current));
});
test('source and direction changes keep prior plan and mark its basis as old',()=>{
 const s=context();s.week.plan=plan();const before=JSON.stringify(s.week.plan);s.week.input={...s.week.input,direction:'basics'};
 assert.equal(JSON.stringify(s.week.plan),before);const changed=toggleCandidate(s,sec.id);assert.equal(JSON.stringify(changed.week.plan),before);assert.notEqual(sourceBasis(changed).signature,changed.week.plan.basis.signature);
 assert.match(weekMarkdown(changed),/이전 선택을 기준/);
});
test('planning prompts distinguish directions, sources, familiarity, actual experience and personal opinion',()=>{
 const s=context(),requests=['deepen','compare','basics'].map(direction=>buildPlanRequest(s,{...s.week.input,direction},null,'').request.system);
 assert.match(requests[0],/기초 이해 → 대표 연구/);assert.match(requests[1],/공통 비교 질문/);assert.match(requests[2],/핵심 용어 이해/);assert.equal(new Set(requests).size,3);
 assert.match(requests[0],/자료를 믿을 수 있는지 궁금해서/);assert.match(requests[0],/문서에 따라 답변이 달라졌다/);assert.match(requests[0],/"executed":\[\]/);assert.match(requests[0],/resourceIds/);
 const unrelated=labs.find(l=>l.professor==='김형식');const other=buildPlanRequest({...s,selected:[unrelated.id,hit.id]},s.week.input,null,'');assert.equal(other.resources.some(r=>r.id.startsWith('rag-source')),false);
});
test('exports work without a plan and include approved links, complete status and notes with a plan',()=>{
 const s=context();assert.match(weekMarkdown(s),/아직 계획을 만들지 않았어요/);s.week.plan=plan();s.week.plan.activities[0].done=true;s.week.plan.activities[0].note='내 한 줄';const md=weekMarkdown(s);assert.match(md,/\[완료\]/);assert.match(md,/내 한 줄/);assert.ok(md.includes(allResources.find(r=>r.id===s.week.plan.activities[0].resourceIds[0]).url));
});
test('weekly plan keeps a usable activity when Gemini wraps JSON and adds a link',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'```json\n'+JSON.stringify({note:'무시',activities:[{...raw(),title:'문제 찾기 https://bad.example SWE3022',resourceIds:['만든-자료',resourcesFor([sec.id])[0].id],extra:true}]})+'\n```'}]}}]})});
 try{const s=context();const result=await askPlan({context:s,input:s.week.input,previous:null},'test-only','test-model');assert.equal(result.activities.length,1);assert.equal(result.activities[0].title.includes('http'),false);assert.deepEqual(result.activities[0].resourceIds,[resourcesFor([sec.id])[0].id]);}finally{globalThis.fetch=original;}
});
test('existing Gemini endpoint validates structured plan response without external call',async()=>{
 const original=globalThis.fetch;let sent;
 globalThis.fetch=async(_url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({activities:[raw()]})}]}}]})};};
 try{const s=context();const result=await askPlan({context:s,input:s.week.input,previous:null},'test-only','test-model');assert.equal(result.activities.length,1);assert.equal(result.input.direction,'compare');assert.match(sent.systemInstruction.parts[0].text,/보안/);assert.equal(JSON.stringify(result).includes('test-only'),false);checkSchedule(result.activities,result.input);assert.ok(storedPlan(result));}finally{globalThis.fetch=original;}
});
