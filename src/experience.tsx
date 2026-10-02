import type {Rag} from './store.ts';
import type {Experiment} from './store.ts';
import {docById,observationPrompts,ragIntro,ragOutput,ragPlanNote,ragQuestion,ragScenes,ragStageOrder,ragWeeks,studyGroups,type RagStage} from './rag-demo.ts';

export function ExperienceView({rag,experiments,onRag,onSave}:{rag:Rag;experiments:Experiment[];onRag:(patch:Partial<Rag>)=>void;onSave:()=>void}){
 const scene=ragScenes[rag.stage];
 const docs=scene.visible.map(docById).filter((doc):doc is NonNullable<typeof doc>=>!!doc);
 const cited=scene.cited.map(docById).filter((doc):doc is NonNullable<typeof doc>=>!!doc);
 function stage(next:RagStage){onRag({stage:next});}
 function toggleStudy(id:string){onRag({studyIds:rag.studyIds.includes(id)?rag.studyIds.filter(item=>item!==id):[...rag.studyIds,id]});}
 return <>
  <section>
   <span className="eyebrow">{ragIntro.badge}</span>
   <h2>{ragIntro.title}</h2>
   <p className="muted">{ragIntro.subtitle}</p>
   <p>{ragIntro.lead}</p>
   <p><strong>RAG.</strong> {ragIntro.rag}</p>
   <p>{ragIntro.link}</p>
   <p className="hint">{ragIntro.limit}</p>
   <p>논문과 공식 코드</p>
   <ul className="link-list">{ragIntro.papers.map(paper=><li key={paper.href}><a href={paper.href} target="_blank" rel="noreferrer">{paper.label}</a></li>)}</ul>
  </section>
  <section className="rag-sim" aria-label="정상, 공격, 방어 체험">
   <div className="rag-top">
    <p><strong>질문</strong><br/>{ragQuestion}</p>
    <p>현재 상태: {scene.label}</p>
    <div className="chips" role="group" aria-label="체험 상태">{ragStageOrder.map(id=><button key={id} className={rag.stage===id?'primary':''} onClick={()=>stage(id)}>{ragScenes[id].label}</button>)}</div>
   </div>
   <div className="rag-board">
    <div>
     <h3>참고 문서</h3>
     {docs.map(doc=>{const excluded=scene.excluded.includes(doc.id);return <div className={'doc'+(doc.fake?' fake':'')+(excluded?' excluded':'')} key={doc.id}><strong>{doc.title}</strong>{doc.fake&&<small>{excluded?'이 시나리오에서 참고 대상에서 제외':'추가된 가짜 문서'}</small>}<p>{doc.body}</p></div>;})}
    </div>
    <div>
     <h3>예시 답변</h3>
     <p className="eyebrow">미리 구성한 예시</p>
     <p className="rag-answer">{scene.answer}</p>
     <h3>참고한 문서</h3>
     <ul>{cited.map(doc=><li key={doc.id}>{doc.title}</li>)}</ul>
     {scene.excluded.length>0&&<p className="hint">회색 문서는 이 시나리오에 미리 지정한 의심 문서입니다. 탐지 결과가 아니며, 참고 대상에서 뺀 모습을 보여 주는 예시입니다.</p>}
    </div>
   </div>
   <p>{scene.note}</p>
   {scene.extra&&<p>{scene.extra}</p>}
   <div className="footer-actions">
    {scene.next&&scene.nextLabel&&<button className="primary" onClick={()=>stage(scene.next!)}>{scene.nextLabel}</button>}
    {rag.stage==='defense'&&<><button onClick={()=>stage('normal')}>처음부터 다시 보기</button><button onClick={()=>document.getElementById('observation')?.scrollIntoView({block:'start'})}>관찰 기록하기</button></>}
   </div>
  </section>
  <section id="observation">
   <h2>짧은 관찰 기록</h2>
   <ul>{observationPrompts.map(prompt=><li key={prompt}>{prompt}</li>)}</ul>
   <p className="hint">한 곳에 자유롭게 적어도 됩니다. 모든 질문에 답하지 않아도 다음으로 갈 수 있어요.</p>
   <label className="field">관찰 기록<textarea value={rag.observation} onChange={e=>onRag({observation:e.target.value})} placeholder="답변이 어떻게 달라졌는지, 더 해보고 싶은 점을 짧게 적어 보세요."/></label>
  </section>
  <section>
   <h2>더 해보고 싶다면: 4주 심화 프로젝트</h2>
   <p>이제 직접 만들어보고 싶다면</p>
   <div className="week-grid">{ragWeeks.map(week=><details key={week.title}><summary><strong>{week.title}</strong><span>{week.summary}</span></summary><ul>{week.details.map(line=><li key={line}>{line}</li>)}</ul></details>)}</div>
   <p>{ragOutput}</p>
   <p className="hint">{ragPlanNote}</p>
   <button className={rag.planSaved?'primary':''} onClick={()=>onRag({planSaved:!rag.planSaved})}>{rag.planSaved?'✓ 내 준비 계획에 담김':'내 준비 계획에 담기'}</button>
  </section>
  <section>
   <h2>시작 전 공부할 것</h2>
   <p className="hint">관심 있는 항목만 고르면 됩니다. 모두 필수거나 연구실 지원 자격은 아닙니다.</p>
   {studyGroups.map(group=><details key={group.title}><summary>{group.title}</summary><p className="hint">{group.note}</p><div className="chips">{group.items.map(item=><button key={item.id} className={rag.studyIds.includes(item.id)?'primary':''} onClick={()=>toggleStudy(item.id)}>{rag.studyIds.includes(item.id)?'✓ ':''}{item.label}</button>)}</div></details>)}
  </section>
  {experiments.length>0&&<section><h2>이전에 저장한 길찾기 기록 {experiments.length}개</h2><p className="hint">이번 페이지로 바꾸기 전에 저장한 기록입니다. 지우지 않고 따로 두었습니다.</p>{experiments.map(item=><details key={item.id}><summary>{item.date} · BFS {item.bfs.length??'경로 없음'} / A* {item.astar.length??'경로 없음'}</summary><p>예상: {item.prediction||'미작성'}</p><p>관찰: {item.observation||'미작성'}</p></details>)}</section>}
  <div className="footer-actions"><button className="primary" onClick={onSave}>저장하고 내 탐색 정리하기</button></div>
 </>;
}
