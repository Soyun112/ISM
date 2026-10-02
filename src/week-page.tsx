import {useEffect,useState,type ReactNode} from 'react';
import type {State} from './store.ts';
import {key} from './store.ts';
import {labs} from './data.ts';
import {recommend} from './recommend.ts';
import {opinionFields} from './content.ts';
import {ragScenes} from './rag-demo.ts';
import {ragTopic,shortLabName} from './experience-data.ts';
import {allResources,dateLabel,directions,editActivity,inputReady,sourceBasis,weekDates,type Activity,type PlanInput,type WeekState} from './planning.ts';
import {weekMarkdown} from './week-export.ts';
import './week.css';

export const weekQuestions=['두 연구실 중 무엇을 더 비교하면 좋을까?','이 활동을 어떻게 시작하면 돼?','시간이 부족해. 계획을 줄여줘.','구현보다 개념 이해 위주로 바꿔줘.'];
export function weekGreeting(s:State){
 const count=s.selected.filter(id=>labs.some(l=>l.id===id)).length;
 return s.week.plan?`현재 계획은 ${s.week.plan.activities.length}개 활동이고, ${s.week.plan.activities.filter(a=>a.done).length}개를 완료했어요. 활동을 시작하는 방법이나 계획 조정을 함께 살펴볼 수 있어요.`:`지금까지 연구실 ${count}곳을 후보로 담았어요. 아직 일주일 계획은 없어요. 더 알아보기, 두 연구실 비교, 기초 이해 중 무엇이 필요한지 함께 정리해요.`;
}
function JourneyMap({state,onGo}:{state:State;onGo:(step:number)=>void}){
 const selected=state.selected.map(id=>labs.find(l=>l.id===id)).filter(l=>!!l);
 const matches=recommend(state.interest);
 const topic=state.experienceSelection?.topicId===ragTopic.id?ragTopic:null;
 const connected=labs.find(l=>l.id===state.experienceSelection?.labId);
 return <section className="journey-map" aria-label="내 탐색 흐름 지도"><div className="section-title"><h2>내 탐색 흐름 지도</h2><button disabled={state.selected.length!==2} onClick={()=>onGo(1)}>연구실 다시 비교하기 →</button></div>
  <div className="journey-interest"><span className="eyebrow">입력한 관심</span><p>{state.interest||'아직 관심을 입력하지 않았어요.'}</p></div>
  <div className="journey-branches">{selected.length?selected.map(l=>{
   const isTopic=l.id===state.experienceSelection?.labId;
   return <article key={l.id} className={'journey-lab'+(isTopic?' is-experienced':'')}><div className="journey-lab-heading"><h3>{l.name}</h3>{isTopic&&<span className="badge">체험 주제 연결</span>}</div><small>{l.professor}</small><p><strong>관심 연결 근거</strong><br/>{matches.find(x=>x.lab.id===l.id)?.matches.join(', ')||'현재 관심과 일치하는 키워드가 없어요.'}</p><p><strong>내가 적은 선택 이유</strong><br/>{state.reasons[l.id]||'아직 남긴 이유가 없어요.'}</p><p className="journey-problem">{l.detail?.questions[0]||l.researchFields.slice(0,2).join(' · ')}</p><details><summary>연구 문제와 자료 더 보기</summary><p>{l.detail?.overview||'상세 연구 설명 미확인'}</p><p>연구 방법: {l.detail?.methods.join(' · ')||'미확인'}</p>{l.website&&<a href={l.website} target="_blank" rel="noreferrer">공식 연구실 소개 ↗</a>}</details></article>;
  }):<div className="notice">아직 후보를 선택하지 않았어요. 이전 페이지에서 탐색을 이어갈 수 있어요.</div>}</div>
  <div className="journey-difference"><h3>두 연구실의 핵심 차이</h3>{selected.length===2?selected.map(l=><p key={l.id}><strong>{shortLabName(l)}</strong> · {l.detail?.methods.join(' · ')||l.researchFields.slice(0,3).join(' · ')}</p>):<p>두 연구실을 담으면 연구 문제와 방법을 나란히 볼 수 있어요.</p>}<details><summary>저장한 관련 수업·학습 주제 {state.courseIds.length}개</summary>{state.courseIds.length?state.courseIds.map(id=>{const r=allResources.find(r=>r.id===id||r.code===id);return <p key={id}>{r?.title||id} · 강의코드 {r?.code||'미확인'}</p>;}):<p>아직 저장한 항목이 없어요.</p>}</details></div>
  <div className="journey-next-arrow" aria-hidden="true">↓</div>
  <div className="journey-experience"><span className="eyebrow">선택한 연구 체험</span><h3>{topic?.title||'아직 체험 주제를 고르지 않았어요.'}</h3>{connected&&<p>{connected.name}에 연결된 체험 · 최종 연구실 확정은 아니에요.</p>}<p>실제로 실행한 단계: {state.rag.executed.length?state.rag.executed.map(id=>ragScenes[id].label).join(' → '):'아직 실행하지 않았어요.'} {state.rag.executed.length>0&&`(${state.rag.executed.length}/3)`}</p><p><strong>내 관찰 메모</strong><br/>{state.rag.observation||'아직 남긴 의견이 없어요.'}</p><details><summary>4페이지에서 정리한 내 의견</summary>{opinionFields.map(([id,label])=><p key={id}><strong>{label}</strong> · {state.reflection[id]||'아직 남긴 의견이 없어요.'}</p>)}</details></div>
  <div className="journey-direction"><span>앞으로 탐색할 방향</span><strong>{directions.find(d=>d.id===state.week.input.direction)?.title||'아래에서 직접 골라 보세요.'}</strong></div>
 </section>;
}
function ActivityDetail({activity,week,onWeek,onError}:{activity:Activity;week:WeekState;onWeek:(w:WeekState)=>void;onError:(s:string)=>void}){
 const [title,setTitle]=useState(activity.title),[date,setDate]=useState(activity.date),[minutes,setMinutes]=useState(String(activity.minutes));
 useEffect(()=>{setTitle(activity.title);setDate(activity.date);setMinutes(String(activity.minutes));},[activity.id,activity.title,activity.date,activity.minutes]);
 function patch(value:Parameters<typeof editActivity>[2]){try{onWeek(editActivity(week,activity.id,value));onError('');}catch(e){onError(e instanceof Error?e.message:'활동을 저장하지 못했습니다.');}}
 return <article className="week-activity" aria-label="선택한 활동 상세"><span className="eyebrow">{activity.done?'완료한 활동':'활동 상세'} · {activity.minutes}분</span><h3>{activity.title}</h3>
  <dl><dt>무엇을 할지</dt><dd>{activity.task}</dd><dt>왜 추천했는지</dt><dd>{activity.reason}</dd><dt>완료 기준</dt><dd>{activity.completion}</dd><dt>활동 후 생각할 질문</dt><dd>{activity.question}</dd></dl>
  <div className="activity-resources">{activity.resourceIds.map(id=>{const r=allResources.find(r=>r.id===id);return r?<div key={id}><small>{r.title}{r.code?` · ${r.code}`:''}</small>{r.url&&<a href={r.url} target="_blank" rel="noreferrer">자료 열기 ↗</a>}</div>:null;})}</div>
  <label className="week-check"><input type="checkbox" checked={activity.done} onChange={e=>patch({done:e.target.checked})}/>이 활동 완료</label>
  <label className="field">활동 한 줄 메모 <span className="hint">선택 입력</span><input maxLength={2000} value={activity.note} onChange={e=>patch({note:e.target.value})}/></label>
  <details><summary>활동 제목·날짜·시간 수정하기</summary><div className="activity-edit"><label className="field">활동 제목<input value={title} maxLength={200} onChange={e=>setTitle(e.target.value)}/></label><label className="field">활동 날짜<select aria-label="활동 날짜" value={date} onChange={e=>setDate(e.target.value)}>{[...new Set([activity.date,...(week.plan?.input.availableDates||[])])].sort().map(d=><option key={d} value={d}>{dateLabel(d)}</option>)}</select></label><label className="field">소요 시간(분)<input type="number" min="5" max="60" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div><button onClick={()=>patch({title,date,minutes:Number(minutes)})}>활동 수정 저장</button></details>
 </article>;
}
export function WeekPage({state,chat,onGo,onWeek,onGenerate,onApply,busy,error}:{state:State;chat:ReactNode;onGo:(step:number)=>void;onWeek:(w:WeekState)=>void;onGenerate:(adjustment?:string)=>Promise<boolean>;onApply:()=>void;busy:boolean;error:string}){
 const [message,setMessage]=useState(''),[localError,setLocalError]=useState('');
 const week=state.week,plan=week.plan,proposal=week.proposal;
 const dates=weekDates(week.input.startDate),planDates=weekDates(plan?.input.startDate||week.input.startDate);
 const active=plan?.activities.find(a=>a.id===week.activeId)||plan?.activities[0];
 const stale=!!plan&&plan.basis.signature!==sourceBasis(state).signature;
 function input(patch:Partial<PlanInput>){onWeek({...week,input:{...week.input,...patch}});setMessage('');}
 function save(){const next={...week,savedAt:new Date().toISOString()};try{localStorage.setItem(key,JSON.stringify({...state,week:next}));onWeek(next);setMessage(plan?'탐색 결과와 계획을 이 브라우저에 저장했습니다.':'계획 없이 탐색 결과를 이 브라우저에 저장했습니다.');setLocalError('');}catch{setLocalError('브라우저에 저장할 수 없습니다. Markdown으로 내려받아 주세요.');}}
 return <main className="week-page">
  <div className="week-heading"><button onClick={()=>onGo(3)}>← 이전 페이지로 돌아가기</button><h1>내 탐색과 다음 일주일</h1><p>관심에서 출발해 무엇을 알아봤는지 돌아보고, 다음 탐색을 정해보세요.</p></div>
  <JourneyMap state={state} onGo={onGo}/>
  <div className="week-columns"><div className="week-planning">
   <section><h2>지금 어떤 점을 더 확인하고 싶나요?</h2><fieldset disabled={busy} className="week-inputs"><legend className="sr-only">다음 탐색 방향과 가능한 시간</legend><div className="direction-cards">{directions.map(d=><button type="button" key={d.id} aria-pressed={week.input.direction===d.id} className={week.input.direction===d.id?'chosen':''} onClick={()=>input({direction:d.id})}><strong>{d.title}</strong><span>{d.description}</span></button>)}</div>
    <label className="field">이번 탐색에서 확인하고 싶은 질문 <span className="hint">선택 입력</span><input maxLength={2000} placeholder="예: 이 연구에서는 코딩과 논문 읽기를 각각 어떻게 활용할까?" value={week.input.question} onChange={e=>input({question:e.target.value})}/></label>
    <div className="week-input-grid"><label className="field">시작 날짜<input type="date" min="2000-01-01" max="2200-12-25" value={week.input.startDate} onChange={e=>{if(e.target.value)input({startDate:e.target.value,availableDates:week.input.availableDates.filter(d=>weekDates(e.target.value).includes(d))});}}/></label><label className="field">선택한 날짜에 투자할 시간<select aria-label="선택한 날짜에 투자할 시간" value={week.input.minutes} onChange={e=>input({minutes:Number(e.target.value) as 15|30|60})}>{[15,30,60].map(m=><option value={m} key={m}>하루 {m}분</option>)}</select></label></div>
    <p className="field-label">앞으로 7일 중 공부 가능한 날짜 <span className="hint">복수 선택</span></p><div className="available-days">{dates.map(d=><button type="button" key={d} aria-pressed={week.input.availableDates.includes(d)} onClick={()=>input({availableDates:week.input.availableDates.includes(d)?week.input.availableDates.filter(x=>x!==d):[...week.input.availableDates,d].sort()})}>{dateLabel(d)}</button>)}</div>
    <label className="field">현재 익숙한 정도<select aria-label="현재 익숙한 정도" value={week.input.familiarity} onChange={e=>input({familiarity:e.target.value as PlanInput['familiarity']})}><option value="new">처음 접함</option><option value="concepts">개념은 알고 있음</option><option value="code">코드로 해본 적 있음</option></select></label>
   </fieldset>
   <p className="hint">가능한 시간 안에서 작은 활동을 최대 3개 제안해요. 방향과 입력을 바꿔도 기존 계획은 유지됩니다.</p>
   <button className="primary" disabled={busy||!inputReady(week.input)||(week.input.direction==='compare'&&state.selected.length!==2)} onClick={()=>onGenerate()}>{busy?'계획을 만들고 있어요…':'나의 일주일 탐색 계획 만들기'}</button>
   {week.input.direction==='compare'&&state.selected.length!==2&&<p className="hint">비교 방향의 계획을 만들려면 후보 두 곳이 필요해요.</p>}
   {busy&&<p role="status">기록과 가능한 시간을 확인하고 있습니다. 잠시 기다려 주세요.</p>}
   {(error||localError)&&<p className="week-error" role="alert">{localError||error}</p>}
   {error&&!busy&&<button onClick={()=>onGenerate()}>계획 생성 다시 시도</button>}
   </section>
   {stale&&<div className="review" role="status">이 계획은 이전 관심·연구실·체험 기록을 기준으로 만들었어요. 기존 활동과 메모는 유지됩니다. 현재 조건으로 다시 생성해 갱신할 수 있어요.</div>}
   {plan&&JSON.stringify(plan.input)!==JSON.stringify(week.input)&&<p className="notice">입력 조건이 바뀌었습니다. 아래는 아직 이전 조건의 계획입니다.</p>}
   {proposal&&<section className="plan-proposal" aria-label="계획 수정안"><h2>계획 수정안</h2><p>{proposal.adjustment}</p><p className="hint">아직 현재 계획에 적용하지 않았어요. 완료한 활동과 작성한 메모는 유지합니다.</p>{proposal.plan.activities.map(a=><div className="proposal-item" key={a.id}><strong>{a.done?'✓ 완료 유지 · ':''}{a.title}</strong><small>{dateLabel(a.date)} · {a.minutes}분</small><p>{a.task}</p><details><summary>추천 이유·완료 기준·자료 확인</summary><p>{a.reason}</p><p>완료 기준: {a.completion}</p><p>생각할 질문: {a.question}</p>{a.resourceIds.map(id=>{const r=allResources.find(r=>r.id===id);return r?<p key={id}>{r.title} {r.url&&<a href={r.url} target="_blank" rel="noreferrer">자료 열기 ↗</a>}</p>:null;})}</details></div>)}<div className="footer-actions"><button className="primary" disabled={busy} onClick={onApply}>계획에 반영하기</button><button disabled={busy} onClick={()=>onWeek({...week,proposal:null})}>수정안 닫기</button></div></section>}
   <section className="weekly-plan"><h2>일주일 활동 계획</h2><p className="hint">추천 계획이에요. 제목·날짜·시간을 직접 수정할 수 있습니다.</p>{!plan?<p className="notice">아직 계획을 만들지 않았어요. 탐색 결과만 저장해도 괜찮아요.</p>:<><div className="week-schedule">{planDates.map(d=>{const activities=plan.activities.filter(a=>a.date===d);return <div className="week-day" key={d}><strong>{dateLabel(d)}</strong>{activities.length?activities.map(a=><button key={a.id} className={active?.id===a.id?'selected':''} onClick={()=>onWeek({...week,activeId:a.id})}><span>{a.done?'✓ ':''}{a.title}</span><small>{a.minutes}분</small></button>):<small>활동 없음</small>}</div>;})}</div>{plan.activities.filter(a=>!planDates.includes(a.date)).map(a=><button className="previous-completed" key={a.id} onClick={()=>onWeek({...week,activeId:a.id})}>이전 날짜의 완료 기록 · {dateLabel(a.date)} · {a.title}</button>)}{active&&<ActivityDetail activity={active} week={week} onWeek={onWeek} onError={setLocalError}/>}</>}</section>
  </div>{chat}</div>
  <section className="week-export"><div><h2>탐색 결과와 계획 보관하기</h2><p className="hint">입력과 활동 기록은 이 브라우저에 유지됩니다. 계획이 없어도 탐색 결과를 보관할 수 있어요.</p>{week.savedAt&&<small>마지막 저장: {new Date(week.savedAt).toLocaleString('ko-KR')}</small>}</div><div className="footer-actions"><button className="primary" onClick={save}>탐색 결과와 계획 저장하기</button><button onClick={async()=>{try{await navigator.clipboard.writeText(weekMarkdown(state));setMessage('전체 내용을 복사했습니다.');}catch{setLocalError('복사할 수 없습니다. Markdown 다운로드를 이용해 주세요.');}}}>전체 내용 복사</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([weekMarkdown(state)],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='내-탐색과-다음-일주일.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Markdown 다운로드</button></div>{message&&<p role="status">{message}</p>}{localError&&<p className="week-error" role="alert">{localError}</p>}</section>
 </main>;
}
