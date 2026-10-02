import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {brand,steps,keywords,questions} from './content.ts';
import {labs,dataCheckedAt,type Lab} from './data.ts';
import {recommend} from './recommend.ts';
import {decode,fresh,invalidate,key,type State} from './store.ts';
import {generateReply} from './chat.ts';
import './style.css';
import './research.css';

const reflectionFields=[
 ['interesting','가장 관심 있는 연구 주제'],
 ['difficult','이해하기 어려웠던 개념'],
 ['question','연구실에 물어보고 싶은 질문'],
 ['reason','현재 관심 연구실과 그 이유'],
 ['uncertain','아직 판단하지 못한 부분'],
 ['next','다음에 할 행동']
] as const;
const validIds=new Set(labs.map(l=>l.id));
function initialState():State{
 try{
  const restored=decode(localStorage.getItem(key));
  return {...restored,selected:restored.selected.filter(id=>validIds.has(id))};
 }catch{return fresh();}
}
function App(){
 const [state,setState]=useState<State>(initialState);
 const [mapView,setMapView]=useState(false);
 const [chatOpen,setChatOpen]=useState(true);
 const [chatInput,setChatInput]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{setNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.');}},[state]);
 const selected=labs.filter(l=>state.selected.includes(l.id));
 const matches=state.recommended?recommend(state.interest):[];
 const patch=(value:Partial<State>)=>setState(current=>({...current,...value}));
 function go(step:number){patch({step});setMapView(false);}
 function updateInterest(value:string){
  setState(current=>{
   const next=invalidate(current,0);
   return {...next,interest:value,recommended:false,statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
  });
 }
 function toggleLab(id:string){
  setState(current=>{
   const next=invalidate(current,0);
   const chosen=current.selected.includes(id);
   const selected=chosen?current.selected.filter(value=>value!==id):[...current.selected,id];
   const matched=recommend(current.interest).find(item=>item.lab.id===id);
   return {...next,selected,reasons:{...current.reasons,[id]:current.reasons[id]||matched?.matches.join(', ')||'연구 분야가 궁금해서'},statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
  });
 }
 function complete(step:number){setState(current=>({...current,statuses:current.statuses.map((value,i)=>i===step?'완료':value)}));}
 function summary(){
  return `# ${brand}\n\n관심: ${state.interest||'미입력'}\n수강 경험: ${state.experienceInput||'미입력'}\n더 알고 싶은 내용: ${state.curiosity||'미입력'}\n\n## 과정 상태\n${steps.map((item,i)=>`- ${item.title}: ${state.statuses[i]}`).join('\n')}\n\n## 관심 후보\n${selected.map(l=>`- ${l.name} (${l.professor}): ${state.reasons[l.id]||'이유 미입력'}\n  연구 분야: ${l.researchFields.join(', ')}\n  홈페이지: ${l.website||'미확인'}`).join('\n')||'더 탐색하기'}\n\n## 생각과 준비\n${reflectionFields.map(([id,label])=>`- ${label}: ${state.reflection[id]||'미작성'}`).join('\n')}\n\n자료 확인일: ${dataCheckedAt}. 연구실·연구 분야 기본 정보는 성균관대학교 연구실 CSV를, 상세 내용은 각 공식 페이지를 참고했습니다. 모집·담당 수업은 별도 확인이 필요합니다.`;
 }
 async function send(text:string){
  if(!text.trim()||busy)return;
  setBusy(true);setChatOpen(true);setChatInput('');
  patch({messages:[...state.messages,{role:'user',text}]});
  try{
   const reply=await generateReply(text,state);
   setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:reply}]}));
  }catch{
   setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:'응답을 만들지 못했습니다. 다시 시도해 주세요.'}]}));
  }finally{setBusy(false);}
 }
 function snapshot(index:number){
  if(index===0)return state.interest?`${state.interest} · 후보 ${selected.length}개`:'관심 분야부터 시작해요';
  if(index===1)return `상세 정보 ${selected.filter(l=>l.detail).length}곳`;
  if(index===2)return '연구실별 체험 준비 중';
  return state.reflection.next||'다음 행동을 정해 보세요';
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
    <strong>{p.title}</strong><small>{p.venue} · {p.year}</small>
    <p>{p.description}</p><a href={p.url} target="_blank" rel="noreferrer">공식 논문 목록에서 확인 ↗</a>
   </div>)}</div>
   <a href={info.publicationUrl} target="_blank" rel="noreferrer">연구실의 전체 논문 목록 ↗</a>
   <h3>연구 이해에 도움 되는 학습 주제</h3>
   <p>{info.learningTopics.join(' · ')}</p>
   <small>학습 주제는 연구 내용을 이해하기 위한 안내입니다. 교수님 담당 수업이나 수강 요건을 뜻하지 않습니다.</small>
   <div className="source-links"><a href={info.researchUrl} target="_blank" rel="noreferrer">상세 연구 출처</a></div>
  </>;
 }
 return <>
  <header><div className="brand"><span className="brand-icon">⌘</span><div>{brand}<small>관심에서 시작하는 연구의 첫걸음</small></div><span className="badge">MVP</span></div><div className="header-actions"><button onClick={()=>setMapView(!mapView)} className={mapView?'primary':''}>나의 탐색 지도</button><button onClick={()=>setChatOpen(!chatOpen)}>탐색 도우미 {chatOpen?'닫기':'열기'}</button></div></header>
  <nav aria-label="탐색 과정">{steps.map((item,i)=><button key={item.title} className={state.step===i&&!mapView?'step active':'step'} onClick={()=>go(i)}><span className="step-number">0{i+1}</span><span><strong>{item.title}</strong><small>{state.statuses[i]} · {snapshot(i)}</small></span></button>)}</nav>
  <div className={'layout '+(!chatOpen?'chat-closed':'')}><main>
   <div className="notice" role="status">{notice||`CSV의 실제 연구 항목 ${labs.length}개를 탐색합니다. 자료 확인일: ${dataCheckedAt}. 입력과 기록은 이 브라우저에 저장됩니다.`}</div>
   {mapView?<><div className="page-heading"><span className="eyebrow">MY EXPLORATION</span><h1>나의 탐색 지도</h1><p>지금까지의 선택과 생각을 연결해 보세요.</p></div><div className="map-cards">{steps.map((item,i)=><article key={item.title}><span className="eyebrow">0{i+1} · {state.statuses[i]}</span><h2>{item.title}</h2><p>{snapshot(i)}</p>{i===0&&selected.map(l=><p key={l.id}>{l.name} — {state.reasons[l.id]||'이유 미작성'}</p>)}{i===3&&<p>{state.reflection.reason||'관심 연구실과 이유를 기록해 보세요.'}</p>}<button onClick={()=>go(i)}>기록 살펴보기 →</button></article>)}</div></>:<>
    <div className="page-heading"><span className="eyebrow">STEP 0{state.step+1} / 04</span><h1>{steps[state.step].title}</h1><p>{steps[state.step].description}</p></div>
    {state.statuses[state.step]==='재검토 필요'&&<div className="review">앞 과정의 관심 또는 후보가 바뀌었습니다. 이전 기록을 다시 확인해 주세요.</div>}
    {state.step===0&&<><section><label className="field">어떤 분야가 궁금한가요?<textarea placeholder="예: 프로그램 취약점을 자동으로 찾는 연구가 궁금해요." value={state.interest} onChange={e=>updateInterest(e.target.value)}/></label><div className="chips">{keywords.map(k=><button key={k} onClick={()=>updateInterest(state.interest?state.interest+', '+k:k)}>+ {k}</button>)}</div><details><summary>수강 경험과 궁금한 점도 알려주기 <span>선택</span></summary><label className="field">수강·과제 경험<input value={state.experienceInput} onChange={e=>patch({experienceInput:e.target.value})}/></label><label className="field">더 알고 싶은 내용<input value={state.curiosity} onChange={e=>patch({curiosity:e.target.value})}/></label></details><button className="primary" disabled={!state.interest.trim()} onClick={()=>patch({recommended:true})}>{steps[0].button} →</button></section>
     {state.recommended&&<><div className="section-title"><h2>관심과 연결되는 항목 {matches.length}개</h2><span>CSV 분야·연구 키워드 일치 기준</span></div>{matches.length===0?<section className="empty">일치하는 항목이 없습니다. ‘보안’, ‘프로그램 분석’, ‘자연어처리’처럼 다른 표현을 입력해 보세요.</section>:<div className="lab-grid">{matches.map(({lab,matches:terms})=><article className={state.selected.includes(lab.id)?'lab selected':'lab'} key={lab.id}><span className="eyebrow">{lab.type} · {lab.detail?'상세 정보 제공':'기본 정보'}</span><h2>{lab.name}</h2><p className="muted">{lab.professor} · {lab.department}</p><div className="tags">{[lab.category,...lab.researchFields].slice(0,4).map(t=><span key={t}>{t}</span>)}</div><p>{lab.researchFields.join(' · ')}</p><div className="reason">일치한 관심 표현: <strong>{terms.join(', ')}</strong></div>{links(lab)}<details><summary>정보 더 보기</summary><p>학부연구생 모집 여부: {lab.undergraduateRecruitment}</p>{lab.note&&<p>CSV 비고: {lab.note}</p>}{detail(lab)}</details><button className={state.selected.includes(lab.id)?'primary':''} onClick={()=>toggleLab(lab.id)}>{state.selected.includes(lab.id)?'✓ 관심 후보 선택됨':'관심 후보 선택'}</button></article>)}</div>}</>}
     {selected.length>0&&<section><h2>선택한 후보 {selected.length}개</h2>{selected.map(l=><label className="field" key={l.id}>{l.name}을 선택한 이유<input value={state.reasons[l.id]||''} onChange={e=>setState(current=>({...invalidate(current,0),reasons:{...current.reasons,[l.id]:e.target.value}}))}/></label>)}<button className="primary" onClick={()=>{complete(0);go(1);}}>선택한 항목 비교하기 →</button></section>}</>}
    {state.step===1&&<>{selected.length===0?<section className="empty"><p>먼저 비교할 후보를 선택해 주세요.</p><button onClick={()=>go(0)}>관심 연구실 찾기</button></section>:<><div className="comparison">{selected.map(l=><article key={l.id}><span className="eyebrow">{l.type} · {l.category}</span><h2>{l.name}</h2><p className="muted">{l.professor} · {l.department}</p><h3>CSV의 주요 연구 분야</h3><p>{l.researchFields.join(' · ')}</p>{links(l)}{detail(l)}{l.note&&<p className="notice">CSV 비고: {l.note}</p>}<h3>교수님 담당 수업</h3><p className="notice">공식 담당 수업 자료를 아직 확인하지 못했습니다.</p><p>학부연구생 모집 여부: {l.undergraduateRecruitment}</p><small>모집 여부는 CSV 작성 당시의 값입니다. 최신 공지는 연구실에 확인해 주세요.</small><button onClick={()=>send('선택한 연구실은 어떤 차이가 있어?')}>도우미에게 차이 물어보기 ↗</button></article>)}</div><div className="footer-actions"><button className="primary" onClick={()=>{complete(1);go(2);}}>{steps[1].button} →</button></div></>}</>}
    {state.step===2&&<section className="empty"><h2>연구실별 체험은 준비 중입니다</h2><p>선택한 연구실의 실제 연구와 연결되는 활동을 확인한 뒤 추가할 예정입니다.</p><button onClick={()=>go(1)}>연구와 수업 다시 보기</button><button className="primary" onClick={()=>go(3)}>체험 없이 준비 정리하기 →</button></section>}
    {state.step===3&&<><section><h2>지금까지의 탐색</h2><p>관심: {state.interest||'미입력'}</p><p>후보: {selected.map(l=>l.name).join(', ')||'더 탐색 중'}</p><small>지금은 후보를 확정하지 않아도 괜찮습니다. 논문과 공식 자료를 읽고 다시 비교할 수 있습니다.</small></section><section>{reflectionFields.map(([id,label])=><label className="field" key={id}>{label}<textarea value={state.reflection[id]||''} onChange={e=>setState(current=>({...current,reflection:{...current.reflection,[id]:e.target.value},statuses:current.statuses.map((v,i)=>i===3?'진행 중':v)}))}/></label>)}<div className="chips">{['공식 홈페이지 읽기','대표 논문 읽기','학습 주제 공부하기','연구실에 질문 정리하기','더 탐색하기'].map(t=><button key={t} onClick={()=>setState(current=>({...current,reflection:{...current.reflection,next:t},statuses:current.statuses.map((v,i)=>i===3?'진행 중':v)}))}>{t}</button>)}</div><button className="primary" disabled={!state.reflection.next?.trim()} onClick={()=>{complete(3);setNotice('준비 기록을 저장했습니다. 언제든 돌아와 수정할 수 있어요.');}}>{steps[3].button}</button></section><div className="footer-actions"><button onClick={async()=>{try{await navigator.clipboard.writeText(summary());setNotice('요약을 복사했습니다.');}catch{setNotice('복사할 수 없습니다. Markdown 다운로드를 이용하세요.');}}}>요약 복사</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([summary()],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='나의-연구실-탐색.md';a.click();URL.revokeObjectURL(url);}}>Markdown 다운로드 ↓</button><button onClick={()=>go(0)}>더 탐색하기 →</button></div></>}
   </>}
   <footer><span>연구를 고르는 첫걸음, 나의 속도로.</span><button className="text-button" onClick={()=>{if(window.confirm('관심, 후보, 기록과 채팅을 포함한 모든 기록을 초기화할까요?')){setState(fresh());setNotice('모든 탐색 기록을 초기화했습니다.');}}}>전체 기록 초기화</button></footer>
  </main>{chatOpen&&<aside><div className="chat-heading"><span className="assistant-icon">✦</span><div><h2>탐색 도우미</h2><small>저장된 자료 안내 · 외부 검색 없음</small></div><button aria-label="도우미 닫기" onClick={()=>setChatOpen(false)}>×</button></div><div className="chat-messages" aria-live="polite"><div className="bubble assistant">안녕하세요! 관심 분야부터 준비 계획까지 함께 정리해요. 아래 예시 질문을 눌러 보세요.</div>{state.messages.map((m,i)=><div className={'bubble '+m.role} key={i}>{m.text}</div>)}{busy&&<p>응답을 준비하고 있어요…</p>}</div><div className="chat-suggestions">{questions[state.step].map(q=><button key={q} disabled={busy} onClick={()=>send(q)}>{q} ↗</button>)}</div><form onSubmit={e=>{e.preventDefault();send(chatInput);}}><label className="sr-only" htmlFor="chat-input">도우미에게 질문</label><input id="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="궁금한 점을 물어보세요"/><button disabled={busy||!chatInput.trim()} type="submit">보내기</button></form><small className="chat-footnote">답변은 저장된 자료와 선택 기록을 사용합니다. 최신 정보는 원문을 확인해 주세요.</small></aside>}</div>
 </>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
