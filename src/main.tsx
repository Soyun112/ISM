import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {brand,copy,experience,keywords,mapNodes,nextActions,opinionFields,prepFields,questions,steps} from './content.ts';
import {courses,labs,source} from './data.ts';
import {recommend} from './recommend.ts';
import {exampleWalls,goal,search,start,type Result} from './algorithms.ts';
import {decode,fresh,invalidate,key,type Prep,type State} from './store.ts';
import {generateReply} from './chat.ts';
import './style.css';

function App(){
 const [state,setState]=useState<State>(()=>{try{return decode(localStorage.getItem(key));}catch{return fresh();}});
 const [chatInput,setChatInput]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [walls,setWalls]=useState<number[]>(exampleWalls),[results,setResults]=useState<{bfs:Result;astar:Result}|null>(null),[display,setDisplay]=useState<'bfs'|'astar'>('bfs'),[prediction,setPrediction]=useState(''),[observation,setObservation]=useState('');
 const stateRef=useRef(state);
 stateRef.current=state;
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{setNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.');}},[state]);
 useEffect(()=>{window.scrollTo(0,0);},[state.step]);
 const selected=labs.filter(l=>state.selected.includes(l.id));
 const mazeReady=selected.some(l=>l.experience===experience.id);
 const savedCourses=courses.filter(c=>state.courseIds.includes(c.id));
 function go(step:number){setState(s=>({...s,step}));}
 function interest(value:string){setState(s=>({...invalidate(s,0),interest:value,recommended:false,statuses:invalidate(s,0).statuses.map((v,i)=>i===0?'진행 중':v)}));}
 function toggleLab(id:string){setState(s=>{const chosen=s.selected.includes(id);const next=invalidate(s,0);return {...next,selected:chosen?s.selected.filter(x=>x!==id):[...s.selected,id],reasons:{...s.reasons,[id]:s.reasons[id]||recommend(s.interest).find(x=>x.lab.id===id)?.matches.join(', ')||'상세 내용을 보고 관심 후보로 선택'},statuses:next.statuses.map((v,i)=>i===0?'진행 중':v)};});}
 function setPrep(id:keyof Prep,value:string){setState(s=>{const next=invalidate({...s,prep:{...s.prep,[id]:value}},1);return {...next,statuses:next.statuses.map((v,i)=>i===1?'진행 중':v)};});}
 function savePrep(){
  setState(s=>{
   const chosen=labs.filter(l=>s.selected.includes(l.id));
   const linked=chosen.some(l=>l.experience===experience.id);
   const prep:Prep={
    focus:s.prep.focus.trim()||chosen.map(l=>l.name).join(', ')||s.interest,
    gap:s.prep.gap,
    topic:s.prep.topic.trim()||(linked?experience.title:''),
    ask:s.prep.ask.trim()||(linked?experience.question:'')
   };
   const same=prep.focus===s.prep.focus&&prep.gap===s.prep.gap&&prep.topic===s.prep.topic&&prep.ask===s.prep.ask;
   const next=same?s:invalidate(s,1);
   return {...next,prep,step:2,statuses:next.statuses.map((v,i)=>i===1?'완료':v)};
  });
  setNotice('체험 전 정리를 저장했습니다.');
 }
 function saveExperiment(){if(!results)return;setState(s=>({...s,experiments:[...s.experiments,{id:crypto.randomUUID(),date:new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}),labIds:[...s.selected],walls:[...walls],prediction,observation,...results}],statuses:s.statuses.map((v,i)=>i===2?'완료':i===3&&v!=='시작 전'?'재검토 필요':v)}));setNotice('현재 지도와 예상·관찰, 두 알고리즘 결과를 저장했습니다.');}
 function saveOpinion(){setState(s=>({...s,statuses:s.statuses.map((v,i)=>i===3?'완료':v)}));setNotice('의견을 저장했습니다. 탐색 결과 지도에 반영했어요.');}
 function chooseNext(action:string){setState(s=>({...s,reflection:{...s.reflection,next:action},statuses:s.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}));setNotice('다음 행동을 저장했습니다. 탐색 결과와 요약에 반영돼요.');}
 function edit(step:number,anchor?:string){if(step!==state.step){go(step);return;}document.getElementById(anchor||'')?.scrollIntoView({block:'start'});}
 function openMap(){if(state.step!==3)go(3);setTimeout(()=>document.getElementById('result-map')?.scrollIntoView({block:'start'}),50);}
 async function send(text:string){const trimmed=text.trim();if(!trimmed||busy)return;const base=stateRef.current;const next={...base,messages:[...base.messages,{role:'user' as const,text:trimmed}]};setBusy(true);setChatInput('');setState(next);try{const reply=await generateReply(trimmed,next);setState(s=>({...s,messages:[...s.messages,{role:'assistant',text:reply}]}));}catch{setState(s=>({...s,messages:[...s.messages,{role:'assistant',text:'응답을 만들지 못했습니다. 다시 시도해 주세요.'}]}));}finally{setBusy(false);}}
 function changeWalls(value:number[]){setWalls(value);setResults(null);}
 function summary(){
  const opinion=opinionFields.map(([id,label])=>`- ${label}: ${state.reflection[id]||copy.blank}`).join('\n');
  const legacy=[['difficult','어려웠던 부분'],['question','더 알아보고 싶은 질문'],['reason','이전 기록 · 관심 이유'],['uncertain','이전 기록 · 아직 판단하지 못한 부분']].filter(([id])=>state.reflection[id]).map(([id,label])=>`- ${label}: ${state.reflection[id]}`).join('\n');
  return `# ${brand}\n\n관심: ${state.interest||'미입력'}\n수강 경험: ${state.experienceInput||'미입력'}\n더 알고 싶은 내용: ${state.curiosity||'미입력'}\n\n## 과정 상태\n${steps.map((x,i)=>`- ${x.title}: ${state.statuses[i]}`).join('\n')}\n\n## 관심 후보\n${selected.map(l=>`- ${l.name}: ${state.reasons[l.id]||'이유 미입력'}`).join('\n')||'더 탐색하기'}\n\n## 체험 전 정리\n- 관심: ${state.prep.focus||copy.blank}\n- 예상과 설명의 차이: ${state.prep.gap||copy.blank}\n- 체험 주제: ${state.prep.topic||copy.blank}\n- 확인하고 싶은 질문: ${state.prep.ask||copy.blank}\n\n## 관심 과목\n${savedCourses.map(c=>'- '+c.name).join('\n')||'없음'}\n\n## 저장한 실험\n${state.experiments.map(e=>`- ${e.date} / 당시 후보: ${e.labIds.join(', ')}\n  예상: ${e.prediction||copy.blank}\n  관찰: ${e.observation||copy.blank}\n  BFS: 경로 ${e.bfs.length??'없음'}, 탐색 ${e.bfs.visited.length}칸 / A*: 경로 ${e.astar.length??'없음'}, 탐색 ${e.astar.visited.length}칸\n  장애물 좌표(0~99): ${e.walls.join(', ')}`).join('\n')||'없음'}\n\n## 내 의견\n${opinion}\n- 다음 행동: ${state.reflection.next||copy.blank}${legacy?`\n${legacy}`:''}\n\n모든 연구실·과목·프로젝트는 시연용 가상 데이터입니다. 짧은 체험은 적성이나 연구 능력 판정이 아닙니다.`;
 }
 const nodes=mapNodes.map(node=>{
  if(node.id==='interest')return {...node,summary:state.interest.trim()||copy.blank,detail:state.interest.trim()||copy.blank};
  if(node.id==='labs')return {...node,summary:selected.length?selected.map(l=>l.name).join(', '):copy.blank,detail:selected.length?selected.map(l=>`${l.name} — ${state.reasons[l.id]||'이유 미작성'}`).join('\n'):copy.blank};
  if(node.id==='study'){
   const looked=state.statuses[1]!=='시작 전'||!!state.prep.gap.trim()||savedCourses.length>0;
   const summary=state.prep.gap.trim()||(savedCourses.length?`관심 과목 ${savedCourses.length}개`:(looked&&selected.length?`후보 ${selected.length}곳의 문제와 방법을 살펴봄`:copy.blank));
   const detail=[state.prep.focus&&`관심: ${state.prep.focus}`,state.prep.gap&&`예상과 설명의 차이: ${state.prep.gap}`,selected.map(l=>`${l.name}: ${l.problem}`).join('\n'),savedCourses.map(c=>c.name).join(', ')].filter(Boolean).join('\n')||copy.blank;
   return {...node,summary,detail};
  }
  if(node.id==='experiment'){
   const latest=state.experiments.at(-1);
   const summary=latest?(latest.observation.trim()||`${latest.date} 실험`):mazeReady?copy.blank:'준비 중';
   const detail=state.experiments.length?state.experiments.map(e=>`${e.date}\n예상: ${e.prediction||copy.blank}\n관찰: ${e.observation||copy.blank}\nBFS ${e.bfs.length??'경로 없음'} / A* ${e.astar.length??'경로 없음'}`).join('\n\n'):summary;
   return {...node,summary,detail};
  }
  if(node.id==='opinion'){
   const written=opinionFields.map(([id,label])=>state.reflection[id]?.trim()?`${label}: ${state.reflection[id].trim()}`:'').filter(Boolean);
   return {...node,summary:written[0]?.split(': ').slice(1).join(': ')||copy.blank,detail:written.join('\n')||copy.blank};
  }
  return {...node,summary:state.reflection.next?.trim()||copy.blank,detail:state.reflection.next?.trim()||copy.blank};
 });
 return <>
  <header><div className="brand"><span className="brand-icon">⌘</span><div>{brand}<small>관심에서 시작하는 연구의 첫걸음</small></div><span className="badge">DEMO</span></div><div className="header-actions"><button onClick={openMap} className={state.step===3?'primary':''}>나의 탐색 지도</button></div></header>
  <div className={'layout'+(state.step===3?' wide':'')}><main>
   <div className="notice" role="status">{notice||'시연용 가상 데이터로 탐색합니다. 입력과 기록은 이 브라우저에 자동 저장됩니다.'}</div>
   <div className="page-heading">{state.step>0&&<button className="back" aria-label="이전 화면" onClick={()=>go(state.step-1)}>←</button>}<div><span className="eyebrow">STEP 0{state.step+1} / 04</span><h1>{steps[state.step].title}</h1><p>{steps[state.step].description}</p></div></div>
   {state.statuses[state.step]==='재검토 필요'&&<div className="review">{copy.review}</div>}
   {state.step===0&&<>
    <section><label className="field">어떤 분야가 궁금한가요?<textarea placeholder="예: 로봇이 장애물을 피해 길을 찾는 방법이 궁금해요." value={state.interest} onChange={e=>interest(e.target.value)}/></label><div className="chips">{keywords.map(k=><button key={k} onClick={()=>interest(state.interest?state.interest+', '+k:k)}>+ {k}</button>)}</div><button className="primary" disabled={!state.interest.trim()} onClick={()=>setState(s=>({...s,recommended:true}))}>{steps[0].button} →</button></section>
    {state.recommended&&<><div className="section-title"><h2>관심과 연결되는 연구실</h2><span>태그 일치 기준 · 가상 후보</span></div>{recommend(state.interest).length===0?<section className="empty">{copy.noLabs}</section>:<div className="lab-grid">{recommend(state.interest).map(({lab,matches})=><article className={state.selected.includes(lab.id)?'lab selected':'lab'} key={lab.id}><span className="eyebrow">시연용 가상 데이터</span><h2>{lab.name}</h2><p className="muted">{lab.professor}</p><div className="tags">{lab.tags.slice(0,3).map(t=><span key={t}>{t}</span>)}</div><p>{lab.summary}</p><div className="reason">추천 이유: 입력한 관심에서 <strong>{matches.join(', ')}</strong> 태그가 일치해요.</div><small>{source}</small><button className={state.selected.includes(lab.id)?'primary':''} onClick={()=>toggleLab(lab.id)}>{state.selected.includes(lab.id)?'✓ 관심 후보 선택됨':'관심 후보 선택'}</button></article>)}</div>}</>}
    {(state.recommended||selected.length>0)&&<section><h2>선택한 연구실</h2><p className="hint">{copy.selectionNote}</p>{selected.length===0?<p role="status">{copy.selectionEmpty}</p>:selected.map(l=><div className="picked" key={l.id}><div><strong>{l.name}</strong><small>{l.professor}</small></div><button onClick={()=>toggleLab(l.id)}>제거</button></div>)}<div className="footer-actions"><button className="primary" disabled={!selected.length} onClick={()=>setState(s=>({...s,step:1,statuses:s.statuses.map((v,i)=>i===0?'완료':v)}))}>{steps[0].next} →</button></div></section>}
   </>}
   {state.step===1&&<>{selected.length===0?<section className="empty"><p>{copy.needSelection}</p><button onClick={()=>go(0)}>관심 연구실 찾기</button></section>:<>
    {selected.length>1&&<section><h2>선택한 후보 사이의 차이</h2>{selected.map(l=><p key={l.id}><strong>{l.name}</strong>은(는) {l.problem} 이를 위해 {l.methods}을(를) 살펴봐요.</p>)}</section>}
    <div className={selected.length>1?'comparison':'comparison single'}>{selected.map(l=><article key={l.id}><span className="eyebrow">시연용 가상 데이터</span><h2>{l.name}</h2><p>{l.summary}</p><h3>해결하려는 문제</h3><p>{l.problem}</p><h3>주요 연구 방법</h3><p>{l.methods}</p><p className="reason"><strong>쉬운 설명.</strong> {l.summary}</p><h3>논문·프로젝트</h3><p>{l.project}</p><small>논문·모집·출처 링크 없음 · {source}</small><h3>① 교수님 담당 수업</h3>{courses.filter(c=>c.labId===l.id&&c.kind==='taught').map(courseCard)}<h3>② 연구 이해에 도움 되는 관련 과목</h3>{courses.filter(c=>c.labId===l.id&&c.kind==='related').map(courseCard)}</article>)}</div>
    <section><h2>체험 전 정리</h2><p className="hint">{copy.prepGuide}</p>{prepFields.map(([id,label,hint])=><label className="field" key={id}>{label}<textarea value={state.prep[id]} onChange={e=>setPrep(id,e.target.value)} placeholder={hint}/></label>)}<button className="primary" onClick={savePrep}>{steps[1].button} →</button></section>
   </>}</>}
   {state.step===2&&<>
    <section><h2>이번 체험</h2><p>체험 주제: {state.prep.topic.trim()||copy.blank}</p><p>확인하고 싶은 질문: {state.prep.ask.trim()||copy.blank}</p></section>
    {!mazeReady?<section className="empty"><h2>{copy.preparing}</h2><p className="hint">관련 없는 체험으로 대신 연결하지 않아요.</p><button className="primary" onClick={()=>go(3)}>{steps[2].next} →</button></section>:<section><span className="eyebrow">EXPERIMENT 01</span><h2>{experience.title}</h2><p>{experience.question}</p><label className="field">실험 전 예상<textarea value={prediction} onChange={e=>setPrediction(e.target.value)} placeholder="어떤 방법이 더 적은 칸을 살펴볼까요?"/></label><div className="experiment"><div><div className="grid" aria-label="미로 지도">{Array.from({length:100},(_,n)=>{const r=results?.[display];return <button key={n} disabled={n===start||n===goal} aria-label={`${Math.floor(n/10)+1}행 ${n%10+1}열 ${n===start?'시작':n===goal?'목적지':walls.includes(n)?'장애물':'빈 칸'}`} className={'cell '+(n===start?'start':n===goal?'goal':walls.includes(n)?'wall':r?.path.includes(n)?'path':r?.visited.includes(n)?'visited':'')} onClick={()=>changeWalls(walls.includes(n)?walls.filter(x=>x!==n):[...walls,n])}>{n===start?'S':n===goal?'G':''}</button>;})}</div><div className="legend"><span>🟢 시작</span><span>🟣 목적지</span><span>■ 장애물</span><span className="blue">■ 탐색</span><span className="green">■ 경로</span></div></div><div className="experiment-tools"><p>칸을 클릭하면 장애물을 추가·제거합니다.</p><button onClick={()=>changeWalls([])}>빈 지도 초기화</button><button onClick={()=>changeWalls([...exampleWalls])}>예제 지도 불러오기</button><button onClick={()=>changeWalls([1,10])}>경로 없는 지도</button><button className="primary" onClick={()=>setResults({bfs:search(walls,'BFS'),astar:search(walls,'A*')})}>BFS와 A* 비교 실행</button><p className="muted">상하좌우 이동 · 비용 1<br/>A*: 맨해튼 거리<br/>탐색 칸: 꺼내 처리한 칸 수<br/>시작·목적지 포함</p></div></div>{results&&<><div className="result-cards">{(['bfs','astar'] as const).map(a=><button key={a} onClick={()=>setDisplay(a)} className={display===a?'result active':'result'}><strong>{a==='bfs'?'BFS':'A*'}</strong><span>{results[a].length===null?'경로 없음':`경로 ${results[a].length}회 이동`}</span><span>탐색 {results[a].visited.length}칸</span></button>)}</div><p role="status">{results.bfs.length===null?'목적지로 가는 경로가 없습니다. 장애물을 바꿔 다시 비교해 보세요.':'두 알고리즘의 경로 길이와 탐색 칸 수를 비교해 보세요. 지도에 따라 탐색량은 같을 수도 있습니다.'}</p></>}<label className="field">실험 후 관찰<textarea value={observation} onChange={e=>setObservation(e.target.value)} placeholder="경로 길이, 탐색한 칸 수, 확인해 보고 싶었던 점을 짧게 적어 보세요."/></label><button className="primary" disabled={!results} onClick={saveExperiment}>{steps[2].button}</button><div className="footer-actions"><button className="primary" onClick={()=>go(3)}>{steps[2].next} →</button></div></section>}
    <section><h2>저장한 실험 {state.experiments.length}개</h2>{state.experiments.length===0?<p className="muted">아직 저장한 실험이 없습니다.</p>:state.experiments.map(e=><details key={e.id}><summary>{e.date} · BFS {e.bfs.length??'경로 없음'} / A* {e.astar.length??'경로 없음'}</summary><p>당시 후보: {labs.filter(l=>e.labIds.includes(l.id)).map(l=>l.name).join(', ')||'없음'}</p><p>예상: {e.prediction||copy.blank}</p><p>관찰: {e.observation||copy.blank}</p><p>탐색 칸: BFS {e.bfs.visited.length} / A* {e.astar.visited.length}</p><button onClick={()=>{setWalls([...e.walls]);setPrediction(e.prediction);setObservation(e.observation);setResults({bfs:e.bfs,astar:e.astar});}}>당시 지도와 결과 불러오기</button></details>)}</section>
   </>}
   {state.step===3&&<>
    <section id="opinion"><h2>내 의견 작성</h2><p className="hint">{copy.opinionGuide}</p><p className="hint">체험 전 질문: {state.prep.ask.trim()||copy.blank} · 최근 관찰: {state.experiments.at(-1)?.observation.trim()||copy.blank}</p>{opinionFields.map(([id,label])=><label className="field" key={id}>{label}<textarea value={state.reflection[id]||''} onChange={e=>setState(s=>({...s,reflection:{...s.reflection,[id]:e.target.value},statuses:s.statuses.map((v,i)=>i===3&&v!=='완료'?'진행 중':v)}))}/></label>)}<button className="primary" onClick={saveOpinion}>{steps[3].button}</button></section>
    <section id="result-map"><h2>탐색 결과</h2><p className="hint">{copy.notFinal}</p><div className="flow">{nodes.map((node,i)=><div key={node.id}>{i>0&&<div className="flow-arrow" aria-hidden="true">↓</div>}<details><summary><strong>{node.title}</strong><span>{node.summary}</span></summary><p className="flow-detail">{node.detail}</p><button onClick={()=>edit(node.step,'anchor' in node?node.anchor:undefined)}>{node.edit}</button></details></div>)}</div></section>
    <section id="next-action"><h2>다음 행동</h2><p className="hint">도우미가 대신 정하지 않아요. 확인할 행동을 직접 골라 주세요.</p><div className="chips">{nextActions.map(t=><button key={t} className={state.reflection.next===t?'primary':''} onClick={()=>chooseNext(t)}>{t}</button>)}</div><p>저장한 다음 행동: {state.reflection.next?.trim()||copy.blank}</p><div className="footer-actions"><button onClick={async()=>{try{await navigator.clipboard.writeText(summary());setNotice('요약을 복사했습니다.');}catch{setNotice('복사할 수 없습니다. Markdown 다운로드를 이용하세요.');}}}>요약 복사</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([summary()],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='나의-연구실-탐색.md';a.click();URL.revokeObjectURL(url);}}>Markdown 다운로드 ↓</button></div></section>
   </>}
   <footer><span>연구를 고르는 첫걸음, 나의 속도로.</span><button className="text-button" onClick={()=>{if(window.confirm('관심, 후보, 실험과 채팅을 포함한 모든 기록을 초기화할까요?')){setState(fresh());changeWalls([...exampleWalls]);setPrediction('');setObservation('');setNotice('모든 탐색 기록을 초기화했습니다.');}}}>전체 기록 초기화</button></footer>
  </main><aside><div className="chat-heading"><span className="assistant-icon">✦</span><div><h2>탐색 도우미</h2><small>{copy.chatDemo}</small></div></div><div className="chat-messages" aria-live="polite"><div className="bubble assistant">{copy.chatHello}</div>{state.messages.map((m,i)=><div className={'bubble '+m.role} key={i}>{m.text}</div>)}{busy&&<p>데모 응답을 준비하고 있어요…</p>}</div><div className="chat-suggestions">{questions[state.step].map(q=><button key={q} disabled={busy} onClick={()=>send(q)}>{q} ↗</button>)}</div><form onSubmit={e=>{e.preventDefault();send(chatInput);}}><label className="sr-only" htmlFor="chat-input">도우미에게 질문</label><input id="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="궁금한 점을 물어보세요"/><button disabled={busy||!chatInput.trim()} type="submit">보내기</button></form><small className="chat-footnote">{copy.chatFoot}</small></aside></div>
 </>;
 function courseCard(c:typeof courses[number]){return <div className="course" key={c.id}><strong>{c.name}</strong><small>{c.term} · 시연용 가상 데이터</small><p>학습: {c.learning}</p><p>{c.connection}</p><button onClick={()=>setState(s=>({...s,courseIds:s.courseIds.includes(c.id)?s.courseIds.filter(id=>id!==c.id):[...s.courseIds,c.id],statuses:s.statuses.map((v,i)=>i===1?'진행 중':i===3&&v!=='시작 전'?'재검토 필요':v)}))}>{state.courseIds.includes(c.id)?'✓ 관심 과목 저장됨':'관심 과목 저장'}</button></div>;}
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);