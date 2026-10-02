import {dataCheckedAt,relatedCourses,taughtCourses,type Lab} from './data.ts';

export function LabLinks({lab}:{lab:Lab}){
 return <div className="source-links">
  {lab.website&&<a href={lab.website} target="_blank" rel="noreferrer">연구실 홈페이지 ↗</a>}
  {lab.officialSources.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">대학 공식 자료 ↗</a>)}
 </div>;
}
export function LabDetails({lab,courseIds=[],onCourse}:{lab:Lab;courseIds?:string[];onCourse?:(id:string)=>void}){
 const info=lab.detail;
 return <div className="lab-detail-content">
  <p className="hint">{lab.professor} · {lab.department} · 자료 확인일 {dataCheckedAt}</p>
  <LabLinks lab={lab}/>
  <h3>전체 연구 설명</h3><p>{info?.overview||`CSV의 연구 분야: ${lab.researchFields.join(' · ')}. 상세 설명은 아직 준비 중입니다.`}</p>
  {info&&<><h3>구체적인 연구 질문</h3><ul>{info.questions.map(q=><li key={q}>{q}</li>)}</ul>
   <h3>주요 연구 방법</h3><p>{info.methods.join(' · ')}</p>
   <h3>대표 논문·연구 사례</h3>{info.note&&<p className="notice">{info.note}</p>}
   <div className="paper-list">{info.papers.map(p=><div className="paper" key={p.title}><strong>{p.title}</strong><small>{p.venue} · {p.year}{p.year<2023?' · 기존 연구 사례':''}</small><p>{p.description}</p><a href={p.url} target="_blank" rel="noreferrer">공식 논문 목록에서 확인 ↗</a></div>)}</div>
   <div className="source-links"><a href={info.publicationUrl} target="_blank" rel="noreferrer">전체 논문 목록 ↗</a><a href={info.researchUrl} target="_blank" rel="noreferrer">상세 연구 출처 ↗</a></div>
  </>}
  <h3>교수님이 담당한 수업</h3>
  {(taughtCourses[lab.professor]||[]).length===0?<p className="notice">확인된 담당 수업 자료가 없습니다.</p>:taughtCourses[lab.professor].map(c=><div className="course" key={c.code}><strong>{c.name}</strong><small>강의코드 {c.code}</small><small>담당 학기: {c.term||'미확인'} · 학부/대학원: {c.level||'미확인'}</small><p>강의 시간: {c.time}</p>{c.learning&&<p>{c.learning}</p>}<p className="hint">제공된 강의정보 자료입니다. 현재 담당 여부와 연구의 직접적인 연결은 별도 확인이 필요합니다.</p></div>)}
  <h3>연구 이해에 도움이 되는 관련 과목·학습 주제</h3>
  {relatedCourses(lab).length===0?<p className="notice">확인된 관련 과목·학습 주제가 없습니다.</p>:relatedCourses(lab).map(c=><div className="course" key={c.id}><strong>{c.name}</strong><small>강의코드 {c.code||'미확인'}</small><p>{c.note}</p>{onCourse&&<button onClick={()=>onCourse(c.id)}>{courseIds.includes(c.id)?'✓ 관심 학습 주제 저장됨':'관심 학습 주제 저장'}</button>}</div>)}
  <p>학부연구생 모집 여부: {lab.undergraduateRecruitment}</p><small>CSV 작성 당시 값입니다. 최신 모집 공지는 연구실에서 확인해 주세요.</small>
  {lab.note&&<p>CSV 비고: {lab.note}</p>}
 </div>;
}
