import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {brand,copy,keywords,mapNodes,nextActions,opinionFields,prepFields,questions,steps} from './content.ts';
import {dataCheckedAt,labs,type Lab} from './data.ts';
import {recommend} from './recommend.ts';
import {decode,fresh,invalidate,key,type Prep,type State} from './store.ts';
import {generateReply} from './chat.ts';
import './style.css';
import './research.css';

const validIds=new Set(labs.map(l=>l.id));
function initialState():State{
 try{
  const restored=decode(localStorage.getItem(key));
  return {...restored,selected:restored.selected.filter(id=>validIds.has(id))};
 }catch{return fresh();}
}
function links(lab:Lab){
 return <div className="source-links">
  {lab.website&&<a href={lab.website} target="_blank" rel="noreferrer">연구실 홈페이지</a>}
  {lab.officialSources.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">대학 공식 자료</a>)}
 </div>;
}
function detail(lab:Lab){
 const info=lab.detail;
 if(!info)return <div className="notice">이 항목은 CSV의 기본 연구 분야만 제공합니다. 상세 연구·논문 정보는 준비 중입니다.</div>;
 return <>
  <h3>연구실 이해하기</h3><p>{info.overview}</p>
  <h3>살펴볼 연구 질문</h3><ul>{info.questions.map(q=><li key={q}>{q}</li>)}</ul>
  <h3>연구 방법</h3><p>{info.methods.join(' · ')}</p>
  <h3>최근 공개 논문{info.papers.some(p=>p.year<2023)?' 및 기존 연구 사례':''}</h3>
  {info.note&&<p className="notice">{info.note}</p>}
  <div className="paper-list">{info.papers.map(p=><div className="paper" key={p.title}>
   <strong>{p.title}</strong><small>{p.venue} · {p.year}</small><p>{p.description}</p>
   <a href={p.url} target="_blank" rel="noreferrer">공식 논문 목록에서 확인 ↗</a>
  </div>)}</div>
  <a href={info.publicationUrl} target="_blank" rel="noreferrer">전체 논문 목록 ↗</a>
  <h3>연구 이해에 도움 되는 학습 주제</h3><p>{info.learningTopics.join(' · ')}</p>
  <small>학습 주제는 교수님 담당 수업이나 수강 요건을 뜻하지 않습니다.</small>
  <div className="source-links"><a href={info.researchUrl} target="_blank" rel="noreferrer">상세 연구 출처</a></div>
 </>;
}

function App(){
 const [state,setState]=useState<State>(initialState);
 const [chatInput,setChatInput]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const stateRef=useRef(state);
 stateRef.current=state;
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{setNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.');}},[state]);
 useEffect(()=>{window.scrollTo(0,0);},[state.step]);
 const selected=labs.filter(l=>state.selected.includes(l.id));
 const matches=state.recommended?recommend(state.interest):[];

 function go(step:number){setState(current=>({...current,step}));}
 function interest(value:string){setState(current=>{
  const next=invalidate(current,0);
  return {...next,interest:value,recommended:false,statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
 });}
 function toggleLab(id:string){setState(current=>{
  const next=invalidate(current,0);
  const chosen=current.selected.includes(id);
  const selected=chosen?current.selected.filter(value=>value!==id):[...current.selected,id];
  const matched=recommend(current.interest).find(item=>item.lab.id===id);
  return {...next,selected,reasons:{...current.reasons,[id]:current.reasons[id]||matched?.matches.join(', ')||'연구 분야가 궁금해서'},statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
 });}
 function setPrep(field:keyof Prep,value:string){setState(current=>{
  const next=invalidate(current,1);
  return {...next,prep:{...current.prep,[field]:value},statuses:next.statuses.map((v,i)=>i===1?'진행 중':v)};
 });}
 function savePrep(){setState(current=>({
  ...current,step:2,
  prep:{...current.prep,focus:current.prep.focus.trim()||labs.filter(l=>current.selected.includes(l.id)).map(l=>l.name).join(', ')},
  statuses:current.statuses.map((v,i)=>i===1?'완료':v)
 }));setNotice('비교 내용과 다음에 확인할 질문을 저장했습니다.');}
 function saveOpinion(){setState(current=>({...current,statuses:current.statuses.map((v,i)=>i===3?'완료':v)}));setNotice('의견을 저장했습니다. 탐색 결과 지도에 반영했어요.');}
 function chooseNext(action:string){setState(current=>({...current,reflection:{...current.reflection,next:action},statuses:current.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}));setNotice('다음 행동을 저장했습니다.');}
 function resetAll(){if(!window.confirm('관심, 후보, 기록과 채팅을 포함한 모든 기록을 초기화할까요?'))return;setState(fresh());setNotice('모든 탐색 기록을 초기화했습니다.');}
 function edit(step:number,anchor?:string){if(step!==state.step){go(step);return;}document.getElementById(anchor||'')?.scrollIntoView({block:'start'});}
 function openMap(){if(state.step!==3)go(3);setTimeout(()=>document.getElementById('result-map')?.scrollIntoView({block:'start'}),50);}
 async function send(text:string){
  const trimmed=text.trim();if(!trimmed||busy)return;
  const base=stateRef.current;
  const next={...base,messages:[...base.messages,{role:'user' as const,text:trimmed}]};
  setBusy(true);setChatInput('');setState(next);
  try{const reply=await generateReply(trimmed,next);setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:reply}]}));}
  catch{setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:'응답을 만들지 못했습니다. 다시 시도해 주세요.'}]}));}
  finally{setBusy(false);}
 }
 function snapshot(i:number){
  if(i===0)return state.interest?`${state.interest} · 후보 ${selected.length}개`:'관심 분야부터 시작해요';
  if(i===1)return `상세 정보 ${selected.filter(l=>l.detail).length}곳`;
  if(i===2)return '연구실별 체험 준비 중';
  return state.reflection.next||'다음 행동을 정해 보세요';
 }
 function summary(){
  const opinion=opinionFields.map(([id,label])=>`- ${label}: ${state.reflection[id]||copy.blank}`).join('\n');
  return `# ${brand}\n\n관심: ${state.interest||'미입력'}\n수강 경험: ${state.experienceInput||'미입력'}\n더 알고 싶은 내용: ${state.curiosity||'미입력'}\n\n## 과정 상태\n${steps.map((item,i)=>`- ${item.title}: ${state.statuses[i]}`).join('\n')}\n\n## 관심 후보\n${selected.map(l=>`- ${l.name} (${l.professor}): ${state.reasons[l.id]||'이유 미입력'}\n  연구 분야: ${l.researchFields.join(', ')}\n  홈페이지: ${l.website||'미확인'}`).join('\n')||'더 탐색하기'}\n\n## 체험 전 정리\n${prepFields.map(([id,label])=>`- ${label}: ${state.prep[id]||copy.blank}`).join('\n')}\n\n## 내 의견\n${opinion}\n- 다음 행동: ${state.reflection.next||copy.blank}\n\n자료 확인일: ${dataCheckedAt}. 기본 정보는 연구실 CSV, 상세 설명은 연결된 공식 페이지를 참고했습니다. 담당 수업·모집은 별도 확인이 필요합니다.`;
 }
 const nodes=mapNodes.map(node=>{
  if(node.id==='interest')return {...node,summary:state.interest.trim()||copy.blank,detail:state.interest.trim()||copy.blank};
  if(node.id==='labs')return {...node,summary:selected.map(l=>l.name).join(', ')||copy.blank,detail:selected.map(l=>`${l.name} — ${state.reasons[l.id]||'이유 미작성'}`).join('\n')||copy.blank};
  if(node.id==='study')return {...node,summary:selected.map(l=>l.name).join(', ')||copy.blank,detail:selected.map(l=>`${l.name}: ${l.researchFields.join(', ')}${l.detail?`\n${l.detail.overview}`:''}`).join('\n\n')||copy.blank};
  if(node.id==='experiment')return {...node,summary:'준비 중',detail:copy.preparing};
  if(node.id==='opinion'){
   const written=opinionFields.map(([id,label])=>state.reflection[id]?.trim()?`${label}: ${state.reflection[id].trim()}`:'').filter(Boolean);
   return {...node,summary:written[0]?.split(': ').slice(1).join(': ')||copy.blank,detail:written.join('\n')||copy.blank};
  }
  return {...node,summary:state.reflection.next?.trim()||copy.blank,detail:state.reflection.next?.trim()||copy.blank};
 });
 return <>
  <header><div className="brand"><span className="brand-icon">⌘</span><div>{brand}<small>관심에서 시작하는 연구의 첫걸음</small></div><span className="badge">MVP</span></div><div className="header-actions"><button onClick={openMap} className={state.step===3?'primary':''}>나의 탐색 지도</button><button onClick={resetAll}>전체 기록 초기화</button></div></header>
  <nav aria-label="탐색 과정">{steps.map((item,i)=><button key={item.title} className={state.step===i?'step active':'step'} onClick={()=>go(i)}><span className="step-number">0{i+1}</span><span><strong>{item.title}</strong><small>{state.statuses[i]} · {snapshot(i)}</small></span></button>)}</nav>
  <div className={'layout'+(state.step===3?' wide':'')}><main>
   <div className="notice" role="status">{notice||`CSV의 실제 연구 항목 ${labs.length}개를 탐색합니다. 자료 확인일: ${dataCheckedAt}. 기록은 이 브라우저에 저장됩니다.`}</div>
   <div className="page-heading">{state.step>0&&<button className="back" aria-label="이전 화면" onClick={()=>go(state.step-1)}>←</button>}<div><span className="eyebrow">STEP 0{state.step+1} / 04</span><h1>{steps[state.step].title}</h1><p>{steps[state.step].description}</p></div></div>
   {state.statuses[state.step]==='재검토 필요'&&<div className="review">{copy.review}</div>}
   {state.step===0&&<>
    <section><label className="field">어떤 분야가 궁금한가요?<textarea placeholder="예: 프로그램 취약점을 자동으로 찾는 연구가 궁금해요." value={state.interest} onChange={e=>interest(e.target.value)}/></label><div className="chips">{keywords.map(k=><button key={k} onClick={()=>interest(state.interest?state.interest+', '+k:k)}>+ {k}</button>)}</div><details><summary>수강 경험과 궁금한 점도 알려주기 <span>선택</span></summary><label className="field">수강·과제 경험<input value={state.experienceInput} onChange={e=>setState(current=>({...current,experienceInput:e.target.value}))}/></label><label className="field">더 알고 싶은 내용<input value={state.curiosity} onChange={e=>setState(current=>({...current,curiosity:e.target.value}))}/></label></details><button className="primary" disabled={!state.interest.trim()} onClick={()=>setState(current=>({...current,recommended:true}))}>{steps[0].button} →</button></section>
    {state.recommended&&<><div className="section-title"><h2>관심과 연결되는 항목 {matches.length}개</h2><span>CSV 분야·연구 키워드 일치 기준</span></div>{matches.length===0?<section className="empty">{copy.noLabs}</section>:<div className="lab-grid">{matches.map(({lab,matches:terms})=><article className={state.selected.includes(lab.id)?'lab selected':'lab'} key={lab.id}><span className="eyebrow">{lab.type} · {lab.detail?'상세 정보 제공':'기본 정보'}</span><h2>{lab.name}</h2><p className="muted">{lab.professor} · {lab.department}</p><div className="tags">{[lab.category,...lab.researchFields].slice(0,4).map(t=><span key={t}>{t}</span>)}</div><p>{lab.researchFields.join(' · ')}</p><div className="reason">일치한 관심 표현: <strong>{terms.join(', ')}</strong></div>{links(lab)}<details><summary>정보 더 보기</summary><p>학부연구생 모집 여부: {lab.undergraduateRecruitment}</p>{lab.note&&<p>CSV 비고: {lab.note}</p>}{detail(lab)}</details><button className={state.selected.includes(lab.id)?'primary':''} onClick={()=>toggleLab(lab.id)}>{state.selected.includes(lab.id)?'✓ 관심 후보 선택됨':'관심 후보 선택'}</button></article>)}</div>}</>}
    {(state.recommended||selected.length>0)&&<section><h2>선택한 연구실</h2><p className="hint">{copy.selectionNote}</p>{selected.length===0?<p role="status">{copy.selectionEmpty}</p>:selected.map(l=><div className="picked" key={l.id}><div><strong>{l.name}</strong><small>{l.professor}</small><label className="field">선택한 이유<input value={state.reasons[l.id]||''} onChange={e=>setState(current=>({...invalidate(current,0),reasons:{...current.reasons,[l.id]:e.target.value}}))}/></label></div><button onClick={()=>toggleLab(l.id)}>제거</button></div>)}<div className="footer-actions"><button className="primary" disabled={!selected.length} onClick={()=>setState(current=>({...current,step:1,statuses:current.statuses.map((v,i)=>i===0?'완료':v)}))}>{steps[0].next} →</button></div></section>}
   </>}
   {state.step===1&&<>{selected.length===0?<section className="empty"><p>{copy.needSelection}</p><button onClick={()=>go(0)}>관심 연구실 찾기</button></section>:<>
    {selected.length>1&&<section><h2>선택한 후보 사이의 차이</h2>{selected.map(l=><p key={l.id}><strong>{l.name}</strong>: {l.researchFields.join(' · ')}{l.detail?` — ${l.detail.overview}`:''}</p>)}</section>}
    <div className={selected.length>1?'comparison':'comparison single'}>{selected.map(l=><article key={l.id}><span className="eyebrow">{l.type} · {l.category}</span><h2>{l.name}</h2><p className="muted">{l.professor} · {l.department}</p><h3>CSV의 주요 연구 분야</h3><p>{l.researchFields.join(' · ')}</p>{links(l)}{detail(l)}{l.note&&<p className="notice">CSV 비고: {l.note}</p>}<h3>교수님 담당 수업</h3><p className="notice">공식 담당 수업 자료를 아직 확인하지 못했습니다.</p><p>학부연구생 모집 여부: {l.undergraduateRecruitment}</p><small>모집 여부는 CSV 작성 당시의 값입니다. 최신 공지는 연구실에 확인해 주세요.</small></article>)}</div>
    <section><h2>체험 전 정리</h2><p className="hint">{copy.prepGuide}</p><p><strong>관심 분야</strong><br/>{state.interest.trim()||copy.blank}</p><p><strong>선택한 연구실</strong><br/>{selected.map(l=>l.name).join(', ')}</p>{prepFields.map(([id,label,hint])=><label className="field" key={id}>{label}<textarea value={state.prep[id]} onChange={e=>setPrep(id,e.target.value)} placeholder={hint}/></label>)}<button className="primary" onClick={savePrep}>{steps[1].button} →</button></section>
   </>}</>}
   {state.step===2&&<><section><h2>현재 정리한 연구 질문</h2><p>관심 연구 주제: {state.prep.topic.trim()||copy.blank}</p><p>추가 자료로 확인할 질문: {state.prep.ask.trim()||copy.blank}</p></section><section className="empty"><h2>{copy.preparing}</h2><p className="hint">실제 연구와 연결되지 않는 길찾기 데모를 대신 보여주지 않습니다. 공식 논문과 연구실 소개를 먼저 살펴보세요.</p><button onClick={()=>go(1)}>연구와 수업 다시 보기</button><button className="primary" onClick={()=>go(3)}>{steps[2].next} →</button></section></>}
   {state.step===3&&<>
    <section id="opinion"><h2>내 의견 작성</h2><p className="hint">{copy.opinionGuide}</p><p className="hint">앞에서 적은 질문: {state.prep.ask.trim()||copy.blank}</p>{opinionFields.map(([id,label])=><label className="field" key={id}>{label}<textarea value={state.reflection[id]||''} onChange={e=>setState(current=>({...current,reflection:{...current.reflection,[id]:e.target.value},statuses:current.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}))}/></label>)}<button className="primary" onClick={saveOpinion}>{steps[3].button}</button></section>
    <section id="result-map"><h2>탐색 결과</h2><p className="hint">{copy.notFinal}</p><div className="flow">{nodes.map((node,i)=><div key={node.id}>{i>0&&<div className="flow-arrow" aria-hidden="true">↓</div>}<details><summary><strong>{node.title}</strong><span>{node.summary}</span></summary><p className="flow-detail">{node.detail}</p><button onClick={()=>edit(node.step,'anchor' in node?node.anchor:undefined)}>{node.edit}</button></details></div>)}</div></section>
    <section id="next-action"><h2>다음 행동</h2><p className="hint">도우미가 대신 정하지 않아요. 확인할 행동을 직접 골라 주세요.</p><div className="chips">{nextActions.map(action=><button key={action} className={state.reflection.next===action?'primary':''} onClick={()=>chooseNext(action)}>{action}</button>)}</div><p>저장한 다음 행동: {state.reflection.next?.trim()||copy.blank}</p><div className="footer-actions"><button onClick={async()=>{try{await navigator.clipboard.writeText(summary());setNotice('요약을 복사했습니다.');}catch{setNotice('복사할 수 없습니다. Markdown 다운로드를 이용하세요.');}}}>요약 복사</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([summary()],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='나의-연구실-탐색.md';a.click();URL.revokeObjectURL(url);}}>Markdown 다운로드 ↓</button></div></section>
   </>}
   <footer><span>연구를 고르는 첫걸음, 나의 속도로.</span><button className="text-button" onClick={resetAll}>전체 기록 초기화</button></footer>
  </main><aside><div className="chat-heading"><span className="assistant-icon">✦</span><div><h2>탐색 도우미</h2><small>{copy.chatDemo}</small></div></div><div className="chat-messages" aria-live="polite"><div className="bubble assistant">{copy.chatHello}</div>{state.messages.map((message,i)=><div className={'bubble '+message.role} key={i}>{message.text}</div>)}{busy&&<p>응답을 준비하고 있어요…</p>}</div><div className="chat-suggestions">{questions[state.step].map(q=><button key={q} disabled={busy} onClick={()=>send(q)}>{q} ↗</button>)}</div><form onSubmit={e=>{e.preventDefault();send(chatInput);}}><label className="sr-only" htmlFor="chat-input">도우미에게 질문</label><input id="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="궁금한 점을 물어보세요"/><button disabled={busy||!chatInput.trim()} type="submit">보내기</button></form><small className="chat-footnote">{copy.chatFoot}</small></aside></div>
 </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
