import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {brand,copy,mapNodes,nextActions,opinionFields,questions,steps} from './content.ts';
import {dataCheckedAt,labs} from './data.ts';
import {ragTopic,topicForLab} from './experience-data.ts';
import {CandidatesView} from './candidates.tsx';
import {ComparisonView} from './compare.tsx';
import {decode,fresh,invalidate,key,ragComplete,selectExperience,toggleCandidate,type Rag,type State} from './store.ts';
import {loadRag, ragMarkdown} from './rag.ts';
import {clearTour, tourMarkdown} from './tour.tsx';
import {ExperienceView} from './experience.tsx';
import {WeekPage,weekGreeting,weekQuestions} from './week-page.tsx';
import {usePlanner,chatContextOf,adjustmentRequest} from './use-planner.ts';
import {ragScenes,studyGroups} from './rag-demo.ts';
import './style.css';
import './research.css';
import './exploration.css';

const validIds=new Set(labs.map(l=>l.id));
function initialState():State{
 try{
  const restored=decode(localStorage.getItem(key));
  return {...restored,selected:restored.selected.filter(id=>validIds.has(id))};
 }catch{return fresh();}
}
function App(){
 const [state,setState]=useState<State>(initialState);
 const [chatInput,setChatInput]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const planner=usePlanner(state,setState);
 const stateRef=useRef(state);
 stateRef.current=state;
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{setNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.');}},[state]);
 useEffect(()=>{window.scrollTo(0,0);},[state.step]);
 const selected=state.selected.map(id=>labs.find(l=>l.id===id)).filter((l):l is NonNullable<typeof l>=>!!l);

 function go(step:number){
  if((step===1||step===2)&&state.selected.length!==2){setNotice('비교하려면 서로 다른 연구실을 정확히 2개 선택해 주세요.');return;}
  setNotice('');setState(current=>({...current,step}));
 }
 function interest(value:string){setState(current=>{
  const next=invalidate(current,0);
  return {...next,interest:value,recommended:false,statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};
 });}
 function toggleLab(id:string){setState(current=>toggleCandidate(current,id));}
 function personalReason(id:string,value:string){setState(current=>({...current,reasons:{...current.reasons,[id]:value},statuses:current.statuses.map((v,i)=>i===3&&v!=='시작 전'?'재검토 필요':v)}));}
 function compareLabs(){setState(current=>current.selected.length===2?{...current,step:1,statuses:current.statuses.map((v,i)=>i===0?'완료':v)}:current);}
 function confirmLab(id:string){setState(current=>selectExperience(current,id));}
 function toggleCourse(id:string){setState(current=>({...invalidate(current,1),courseIds:current.courseIds.includes(id)?current.courseIds.filter(x=>x!==id):[...current.courseIds,id]}));}
 function patchRag(patch:Partial<Rag>){setState(current=>{
  const rag={...current.rag,...patch};
  const changed=JSON.stringify(rag)!==JSON.stringify(current.rag);
  const next=changed?invalidate(current,2):current;
  return {...next,rag,statuses:next.statuses.map((v,i)=>i===2&&v==='시작 전'?'진행 중':v)};
 });}
 function saveRag(){setState(current=>{
  if(!ragComplete(current.rag)||current.selected.length!==2||!current.experienceSelection||!current.selected.includes(current.experienceSelection.labId))return current;
  return {...current,step:3,rag:{...current.rag,savedAt:new Date().toISOString()},statuses:current.statuses.map((v,i)=>i===2?'완료':v)};
 });}
 function saveOpinion(){setState(current=>({...current,statuses:current.statuses.map((v,i)=>i===3?'완료':v)}));setNotice('의견을 저장했습니다. 탐색 결과 지도에 반영했어요.');}
 function chooseNext(action:string){setState(current=>({...current,reflection:{...current.reflection,next:action},statuses:current.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}));setNotice('다음 행동을 저장했습니다.');}
 function resetAll(){if(!window.confirm('관심, 후보, 기록과 채팅을 포함한 모든 기록을 초기화할까요?'))return;clearTour();setState(fresh());setNotice('모든 탐색 기록을 초기화했습니다.');}
 function edit(step:number,anchor?:string){if(step!==state.step){go(step);return;}document.getElementById(anchor||'')?.scrollIntoView({block:'start'});}
 function openMap(){if(state.step!==3)go(3);setTimeout(()=>document.getElementById('result-map')?.scrollIntoView({block:'start'}),50);}
 async function send(text:string){
  const trimmed=text.trim();if(!trimmed||busy||planner.busy)return;
  const base=stateRef.current;
  const next={...base,messages:[...base.messages,{role:'user' as const,text:trimmed}]};
  setBusy(true);setChatInput('');setState(next);
  try{
   if(base.step===4&&adjustmentRequest(trimmed)){
    const ok=await planner.generate(trimmed);
    setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:ok?'계획 수정안을 준비했어요. 왼쪽에서 확인한 뒤 ‘계획에 반영하기’를 눌러 주세요.': '수정안을 만들지 못했어요. 계획 영역의 안내를 확인해 주세요. 기존 계획과 메모는 유지되어 있어요.'}]}));
    return;
   }
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:trimmed,history:base.messages.slice(-6),context:chatContextOf(base)})});
   const payload=await response.json().catch(()=>({})) as {text?:string;error?:string};
   const reply=payload.text||'';
   if(!response.ok||!reply)throw new Error(payload.error||'응답을 만들지 못했습니다.');
   setState(current=>({...current,messages:[...current.messages,{role:'assistant',text:reply}]}));
  }
  catch(error){const text=error instanceof Error&&error.message?error.message:'응답을 만들지 못했습니다. 다시 시도해 주세요.';setState(current=>({...current,messages:[...current.messages,{role:'assistant',text}]}));}
  finally{setBusy(false);}
 }
 const focusLab=labs.find(l=>l.id===state.experienceSelection?.labId&&state.experienceSelection.topicId===ragTopic.id&&state.selected.includes(l.id)&&topicForLab(l));
 const studyLabels=studyGroups.flatMap(group=>group.items).filter(item=>state.rag.studyIds.includes(item.id)).map(item=>item.label);
 const ragTouched=state.statuses[2]!=='시작 전'||!!state.rag.observation||state.rag.planSaved||state.rag.studyIds.length>0||state.rag.stage!=='normal';
 function snapshot(i:number){
  if(i===0)return state.interest?`${state.interest} · 후보 ${selected.length}개`:'관심 분야부터 시작해요';
  if(i===1)return focusLab?`${focusLab.name} 체험 예정`:`상세 정보 ${selected.filter(l=>l.detail).length}곳`;
  if(i===2)return state.rag.executed.length?`RAG 예시 · ${state.rag.executed.length}/3 실행`:'시작 전';
  return state.reflection.next||'다음 행동을 정해 보세요';
 }
 function summary(){
  const opinion=opinionFields.map(([id,label])=>`- ${label}: ${state.reflection[id]||copy.blank}`).join('\n');
  const previous=state.experiments.length?`\n\n## 이전 길찾기 기록\n${state.experiments.map(item=>`- ${item.date}: BFS ${item.bfs.length??'경로 없음'} / A* ${item.astar.length??'경로 없음'}`).join('\n')}`:'';
  return `# ${brand}\n\n관심: ${state.interest||'미입력'}\n수강 경험: ${state.experienceInput||'미입력'}\n더 알고 싶은 내용: ${state.curiosity||'미입력'}\n\n## 과정 상태\n${steps.map((item,i)=>`- ${item.title}: ${state.statuses[i]}`).join('\n')}\n\n## 관심 후보\n${selected.map(l=>`- ${l.name} (${l.professor}): ${state.reasons[l.id]||'이유 미입력'}\n  연구 분야: ${l.researchFields.join(', ')}\n  홈페이지: ${l.website||'미확인'}`).join('\n')||'더 탐색하기'}\n\n## 체험할 연구실\n${focusLab?`${focusLab.name} (${focusLab.professor})`:copy.blank}\n\n## RAG 오염·방어 예시 체험\n- 주제: ${state.experienceSelection?.topicId===ragTopic.id?ragTopic.title:'미선택'}\n- 실행한 단계: ${state.rag.executed.map(id=>ragScenes[id].label).join(', ')||'없음'}\n- 마지막 실행 결과: ${state.rag.displayedStage?ragScenes[state.rag.displayedStage].label:'미실행'}\n- 관찰: ${state.rag.observation||copy.blank}\n- 4주 계획: ${state.rag.planSaved?'담음':'담지 않음'}\n- 공부 항목: ${studyLabels.join(', ')||copy.blank}${previous}${tourMarkdown()}${ragMarkdown(loadRag())}\n\n## 내 의견\n${opinion}\n- 다음 행동: ${state.reflection.next||copy.blank}\n\n자료 확인일: ${dataCheckedAt}. 기본 정보는 연구실 CSV, 상세 설명은 연결된 공식 페이지를 참고했습니다. 구형준·최형기 교수님 수업 시간은 제공된 강의정보 자료입니다.`;
 }
 const nodes=mapNodes.map(node=>{
  if(node.id==='interest')return {...node,summary:state.interest.trim()||copy.blank,detail:state.interest.trim()||copy.blank};
  if(node.id==='labs')return {...node,summary:selected.map(l=>l.name).join(', ')||copy.blank,detail:selected.map(l=>`${l.name} — ${state.reasons[l.id]||'이유 미작성'}`).join('\n')||copy.blank};
  if(node.id==='study')return {...node,summary:selected.map(l=>l.name).join(', ')||copy.blank,detail:selected.map(l=>`${l.name}: ${l.researchFields.join(', ')}${l.detail?`\n${l.detail.overview}`:''}`).join('\n\n')||copy.blank};
  if(node.id==='experiment')return {...node,summary:ragTouched?'RAG 오염·방어 예시 체험':copy.blank,detail:[`체험 주제: ${state.experienceSelection?.topicId===ragTopic.id?ragTopic.title:'미선택'}`,`실행한 단계: ${state.rag.executed.map(id=>ragScenes[id].label).join(', ')||'없음'}`,`마지막 실행 결과: ${state.rag.displayedStage?ragScenes[state.rag.displayedStage].label:'미실행'}`,`관찰: ${state.rag.observation||copy.blank}`,`4주 계획: ${state.rag.planSaved?'담음':'담지 않음'}`,`공부 항목: ${studyLabels.join(', ')||copy.blank}`,state.experiments.length?`이전 길찾기 기록 ${state.experiments.length}개`:''].filter(Boolean).join('\n')};
  if(node.id==='opinion'){
   const written=opinionFields.map(([id,label])=>state.reflection[id]?.trim()?`${label}: ${state.reflection[id].trim()}`:'').filter(Boolean);
   return {...node,summary:written[0]?.split(': ').slice(1).join(': ')||copy.blank,detail:written.join('\n')||copy.blank};
  }
  return {...node,summary:state.reflection.next?.trim()||copy.blank,detail:state.reflection.next?.trim()||copy.blank};
 });
 const chatPanel=<aside className={state.step===4?'week-chat':undefined}><div className="chat-heading"><span className="assistant-icon">✦</span><div><h2>탐색 도우미</h2><small>{copy.chatDemo}</small></div></div><div className="chat-messages" aria-live="polite"><div className="bubble assistant">{state.step===4?weekGreeting(state):copy.chatHello}</div>{state.messages.map((message,i)=><div className={'bubble '+message.role} key={i}>{message.text}</div>)}{busy&&<p>응답을 준비하고 있어요…</p>}</div><div className="chat-suggestions">{(state.step===4?weekQuestions:questions[state.step]).map(q=><button key={q} disabled={busy||planner.busy} onClick={()=>send(q)}>{q} ↗</button>)}</div>{state.step===4&&state.week.plan&&<div className="quick-adjust" aria-label="계획 빠른 조정">{[['더 쉽게','현재 계획을 더 쉽게 바꿔줘.'],['시간 줄이기','시간이 부족해. 계획을 줄여줘.'],['구현 중심으로','현재 계획을 구현 중심으로 바꿔줘.']].map(([label,prompt])=><button key={label} disabled={busy||planner.busy||state.week.plan!.activities.every(a=>a.done)} onClick={()=>send(prompt)}>{label}</button>)}</div>}<form onSubmit={e=>{e.preventDefault();send(chatInput);}}><label className="sr-only" htmlFor="chat-input">도우미에게 질문</label><input id="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="궁금한 점을 물어보세요"/><button disabled={busy||planner.busy||!chatInput.trim()} type="submit">보내기</button></form><small className="chat-footnote">{copy.chatFoot}</small></aside>;
 return <>
  <header><div className="brand"><span className="brand-icon">⌘</span><div>{brand}<small>관심에서 시작하는 연구의 첫걸음</small></div><span className="badge">MVP</span></div><div className="header-actions"><button onClick={openMap} className={state.step===3?'primary':''}>나의 탐색 지도</button><button onClick={resetAll}>전체 기록 초기화</button></div></header>
  {state.step===4?<WeekPage state={state} chat={chatPanel} onGo={go} onWeek={week=>setState(current=>({...current,week}))} onGenerate={planner.generate} onApply={planner.apply} busy={planner.busy} error={planner.error}/>:<>
  <nav aria-label="탐색 과정">{steps.map((item,i)=><button key={item.title} className={state.step===i?'step active':'step'} onClick={()=>go(i)}><span className="step-number">0{i+1}</span><span><strong>{item.title}</strong><small>{state.statuses[i]} · {snapshot(i)}</small></span></button>)}</nav>
  <div className={'layout'+(state.step===3?' wide':'')}><main>
   <div className="notice" role="status">{notice||`CSV의 실제 연구 항목 ${labs.length}개를 탐색합니다. 자료 확인일: ${dataCheckedAt}. 기록은 이 브라우저에 저장됩니다.`}</div>
   <div className={'page-heading'+(state.step===2?' experience-heading':'')}>{state.step>0&&<button className="back" aria-label="이전 화면" onClick={()=>go(state.step-1)}>←</button>}<div><span className="eyebrow">STEP 0{state.step+1} / 04</span><h1>{state.step===2?'AI가 잘못된 자료를 읽으면 어떻게 될까?':steps[state.step].title}</h1><p>{state.step===2?'가짜 문서를 넣고 필터를 켜면서 답변의 변화를 확인해 보세요.':steps[state.step].description}</p></div></div>
   {state.statuses[state.step]==='재검토 필요'&&<div className="review">{copy.review}</div>}
   {state.step===0&&<CandidatesView state={state} onInterest={interest} onRecommend={()=>setState(current=>({...current,recommended:true}))} onToggle={toggleLab} onReason={personalReason} onCompare={compareLabs}/>}
   {state.step===1&&<ComparisonView state={state} selected={selected} onTopic={confirmLab} onCourse={toggleCourse} onBack={()=>go(0)} onSkip={()=>go(3)}/>}
   {state.step===2&&(focusLab&&selected.length===2?<ExperienceView lab={focusLab} rag={state.rag} experiments={state.experiments} onRag={patchRag} onSave={saveRag}/>:<section><p>선택한 두 연구실 중 제공되는 체험 주제를 먼저 골라 주세요. 이전 체험 기록은 보존되어 있습니다.</p><button onClick={()=>go(selected.length===2?1:0)}>체험 주제 고르러 가기</button></section>)}
   {state.step===3&&<>
    <section id="opinion"><h2>내 의견 작성</h2><p className="hint">{copy.opinionGuide}</p><p className="hint">앞에서 적은 질문: {state.prep.ask.trim()||copy.blank}</p>{opinionFields.map(([id,label])=><label className="field" key={id}>{label}<textarea value={state.reflection[id]||''} onChange={e=>setState(current=>({...current,reflection:{...current.reflection,[id]:e.target.value},statuses:current.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}))}/></label>)}<button className="primary" onClick={saveOpinion}>{steps[3].button}</button></section>
    <section id="result-map"><h2>탐색 결과</h2><p className="hint">{copy.notFinal}</p><div className="flow">{nodes.map((node,i)=><div key={node.id}>{i>0&&<div className="flow-arrow" aria-hidden="true">↓</div>}<details><summary><strong>{node.title}</strong><span>{node.summary}</span></summary><p className="flow-detail">{node.detail}</p><button onClick={()=>edit(node.step,'anchor' in node?node.anchor:undefined)}>{node.edit}</button></details></div>)}</div></section>
    <section id="next-action"><h2>다음 행동</h2><p className="hint">도우미가 대신 정하지 않아요. 확인할 행동을 직접 골라 주세요.</p><div className="chips">{nextActions.map(action=><button key={action} className={state.reflection.next===action?'primary':''} onClick={()=>chooseNext(action)}>{action}</button>)}</div><p>저장한 다음 행동: {state.reflection.next?.trim()||copy.blank}</p><div className="footer-actions"><button onClick={async()=>{try{await navigator.clipboard.writeText(summary());setNotice('요약을 복사했습니다.');}catch{setNotice('복사할 수 없습니다. Markdown 다운로드를 이용하세요.');}}}>요약 복사</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([summary()],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='나의-연구실-탐색.md';a.click();URL.revokeObjectURL(url);}}>Markdown 다운로드 ↓</button></div></section>
   </>}
   {state.step===3&&<div className="footer-actions"><button className="primary" onClick={()=>go(4)}>내 탐색과 다음 일주일 →</button></div>}
   <footer><span>연구를 고르는 첫걸음, 나의 속도로.</span><button className="text-button" onClick={resetAll}>전체 기록 초기화</button></footer>
  </main>{chatPanel}</div>
  </>}
 </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
