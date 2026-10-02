import {useEffect,useRef,useState} from 'react';
import {copy,keywords,steps} from './content.ts';
import {labs,type Lab} from './data.ts';
import {recommend} from './recommend.ts';
import {LabDetails} from './lab-details.tsx';
import type {State} from './store.ts';
import {shortLabName} from './experience-data.ts';

export function CandidatesView({state,onInterest,onRecommend,onToggle,onReason,onCompare}:{state:State;onInterest:(v:string)=>void;onRecommend:()=>void;onToggle:(id:string)=>void;onReason:(id:string,v:string)=>void;onCompare:()=>void}){
 const [limit,setLimit]=useState(4);
 const dockRef=useRef<HTMLElement>(null),pageRef=useRef<HTMLDivElement>(null);
 const selected=state.selected.map(id=>labs.find(l=>l.id===id)).filter((l):l is Lab=>!!l);
 const matches=state.recommended?recommend(state.interest):[];
 useEffect(()=>setLimit(4),[state.interest]);
 useEffect(()=>{
  const dock=dockRef.current,main=dock?.closest('main');
  if(!dock||!main)return;
  const measure=()=>{const r=main.getBoundingClientRect();dock.style.setProperty('--dock-left',r.left+'px');dock.style.setProperty('--dock-width',r.width+'px');pageRef.current?.style.setProperty('--dock-space',dock.offsetHeight+28+'px');};
  const observer=new ResizeObserver(measure);observer.observe(main);observer.observe(dock);window.addEventListener('resize',measure);measure();
  return ()=>{observer.disconnect();window.removeEventListener('resize',measure);};
 },[]);
 return <div className="candidate-page" ref={pageRef}>
  <section><label className="field">어떤 분야가 궁금한가요?<textarea placeholder="예: 프로그램 취약점을 자동으로 찾는 연구가 궁금해요." value={state.interest} onChange={e=>onInterest(e.target.value)}/></label><div className="chips">{keywords.map(k=><button key={k} onClick={()=>onInterest(state.interest?state.interest+', '+k:k)}>+ {k}</button>)}</div><button className="primary" disabled={!state.interest.trim()} onClick={onRecommend}>{steps[0].button} →</button></section>
  {state.recommended&&<><div className="section-title"><h2>관심과 연결되는 후보 {matches.length}개</h2><span>연구 분야·키워드 일치 기준 · 먼저 상위 4개</span></div>
   {matches.length<2&&<div className="review">비교할 후보가 2개 미만입니다. 두 연구실을 찾을 수 있도록 관심 분야를 수정해 주세요.</div>}
   {matches.length===0?<section className="empty">{copy.noLabs}</section>:<div className="lab-grid compact-candidates">{matches.slice(0,limit).map(({lab,matches:terms})=>{
    const chosen=state.selected.includes(lab.id);
    return <article className={'lab'+(chosen?' selected':'')} key={lab.id}><h2>{lab.name}</h2><p className="muted">{lab.professor}</p>
     <div className="reason">입력한 관심의 <strong>{terms.slice(0,3).join(', ')}</strong> 표현이 이 연구실의 연구 분야와 연결됩니다.</div>
     <small className="matched-keywords">관심과 연결된 키워드: {terms.join(', ')}</small>
     <div className="tags">{[...new Set(lab.researchFields)].slice(0,3).map(t=><span key={t}>{t}</span>)}</div>
     <button className={chosen?'primary':''} disabled={!chosen&&state.selected.length>=2} onClick={()=>onToggle(lab.id)} aria-label={`${lab.name} ${chosen?'선택 해제':'후보에 담기'}`}>{chosen?'선택 해제':'후보에 담기'}</button>
     <details><summary>상세 보기</summary><LabDetails lab={lab}/></details>
    </article>;
   })}</div>}
   {matches.length>limit&&<button className="more-candidates" onClick={()=>setLimit(n=>n+4)}>관련 후보 더 보기 · {matches.length-limit}개 남음</button>}
  </>}
  {selected.length>0&&<section><h2>개인적인 선택 이유 <span className="hint">선택 입력</span></h2><p className="hint">키워드 일치와 별개로, 이 연구실이 궁금한 이유가 있다면 남겨 보세요.</p>{selected.map(l=><label className="field" key={l.id}>{l.name} · 개인적인 선택 이유<input value={state.reasons[l.id]||''} placeholder="입력하지 않아도 비교할 수 있어요." onChange={e=>onReason(l.id,e.target.value)}/></label>)}</section>}
  <section className="selection-dock" aria-label="연구실 선택 상태" ref={dockRef}>
   <div className="dock-selection"><strong aria-live="polite">선택한 연구실 {state.selected.length}/2</strong><div className="picked-chips">{selected.map(l=><span key={l.id}><span className="picked-name" title={l.name}>{shortLabName(l)}</span><button aria-label={`${l.name} 후보에서 해제`} onClick={()=>onToggle(l.id)}>×</button></span>)}</div></div>
   <p className="hint" role="status">{state.selected.length>=2?'다른 연구실을 선택하려면 기존 선택을 해제해 주세요':`서로 다른 연구실 ${2-state.selected.length}개를 더 선택해 주세요.`}{state.selected.length>2&&' 이전 선택을 보존했습니다. 두 곳만 남겨 주세요.'}</p>
   <button className="primary" disabled={state.selected.length!==2} onClick={onCompare}>선택한 연구실 비교하기 →</button>
  </section>
 </div>;
}
