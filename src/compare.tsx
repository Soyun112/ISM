import type {ReactNode} from 'react';
import {relatedCourses,taughtCourses,type Lab} from './data.ts';
import {LabDetails} from './lab-details.tsx';
import {topicForLab} from './experience-data.ts';
import type {State} from './store.ts';

export function ComparisonView({selected,state,onTopic,onCourse,onBack,onSkip}:{selected:Lab[];state:State;onTopic:(id:string)=>void;onCourse:(id:string)=>void;onBack:()=>void;onSkip:()=>void}){
 if(selected.length!==2)return <section className="empty"><p>서로 다른 연구실을 정확히 2개 선택해야 비교할 수 있습니다.</p><button onClick={onBack}>후보 선택으로 돌아가기</button></section>;
 const rows:{label:string;cell:(lab:Lab)=>ReactNode}[]=[
  {label:'핵심 연구 분야',cell:l=>l.researchFields.slice(0,3).join(' · ')},
  {label:'어떤 문제를 연구하는지',cell:l=>l.detail?.questions[0]||'상세 연구 질문 미확인'},
  {label:'주요 연구 방법',cell:l=>l.detail?.methods.slice(0,3).join(' · ')||'연구 방법 미확인'},
  {label:'대표 연구 또는 논문',cell:l=>{const p=l.detail?.papers[0];return p?<><a className="table-paper" href={p.url} target="_blank" rel="noreferrer" title={p.title}>{p.title}</a><small>{p.venue} · {p.year}{p.year<2023?' · 기존 사례':''}</small></>:'확인된 논문 자료 없음';}},
  {label:'교수님이 담당한 수업',cell:l=>(taughtCourses[l.professor]||[]).length?taughtCourses[l.professor].map(c=><div className="table-course" key={c.code}><strong>{c.name}</strong><span>강의코드 {c.code}</span><small>학기 {c.term||'미확인'} · {c.level||'학부/대학원 미확인'}</small></div>):'담당 수업 미확인'},
  {label:'연구 이해에 도움이 되는 관련 과목',cell:l=>relatedCourses(l).length?<>{relatedCourses(l).map(c=><div className="table-course" key={c.id}><strong>{c.name}</strong><span>강의코드 {c.code||'미확인'}</span></div>)}<small>학습 주제 기준 추천 · 개설 과목과 담당 교수 미확인</small></>:'관련 과목·학습 주제 미확인'},
  {label:'제공되는 작은 연구 체험',cell:l=>topicForLab(l)?<>{topicForLab(l)!.title}<small>{topicForLab(l)!.duration} · 교육용 예시</small></>:'체험 준비 중'}
 ];
 return <>
  <section className="comparison-difference"><h2>두 연구실의 핵심 차이</h2>{selected.map(l=><p key={l.id}><strong>{l.name}</strong>: {l.detail?.methods.join(' · ')||l.researchFields.join(' · ')}</p>)}<small>보유한 연구 방법·분야를 비교했습니다. 사용자 적합도나 순위를 뜻하지 않습니다.</small></section>
  <section className="comparison-table-section"><div className="table-scroll"><table className="lab-comparison"><caption className="sr-only">선택한 두 연구실 비교</caption><thead><tr><th scope="col">비교 항목</th>{selected.map((l,i)=><th scope="col" key={l.id}><small>연구실 {i===0?'A':'B'}</small><strong>{l.name}</strong><span>{l.professor}</span></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.label}><th scope="row">{row.label}</th>{selected.map(l=><td key={l.id}>{row.cell(l)}</td>)}</tr>)}</tbody></table></div></section>
  <div className="comparison-details">{selected.map(l=><section key={l.id}><details><summary>{l.name} 상세 정보</summary><LabDetails lab={l} courseIds={state.courseIds} onCourse={onCourse}/></details></section>)}</div>
  <section><h2>체험할 연구 주제 선택</h2><p className="hint">실제로 준비된 체험만 표시합니다. 연구실과 주제를 함께 선택해 주세요.</p><div className="topic-grid">{selected.map(l=>{const topic=topicForLab(l);return <div className="topic-card" key={l.id}><strong>{l.name}</strong>{topic?<><h3>{topic.title}</h3><p>{topic.summary}</p><small>{topic.duration} / {topic.format}</small>{state.experienceSelection?.labId===l.id&&<p className="hint">✓ 저장된 체험 주제</p>}<button className="primary" onClick={()=>onTopic(l.id)}>이 연구 주제 체험하기 →</button></>:<><p>이 연구실의 체험은 준비 중입니다.</p><small>다른 연구실의 체험으로 연결하지 않습니다.</small></>}</div>;})}</div>{!selected.some(l=>topicForLab(l))&&<div className="footer-actions"><button onClick={onSkip}>체험 없이 내 탐색 정리하기 →</button><button onClick={onBack}>다른 연구실 후보 살펴보기</button></div>}</section>
 </>;
}
