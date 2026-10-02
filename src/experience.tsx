import type {Lab} from './data.ts';
import {ragTopic} from './experience-data.ts';
import {canRunStage,ragComplete,runRagStage,type Rag,type Experiment} from './store.ts';
import {docById,ragIntro,ragOutput,ragPlanNote,ragQuestion,ragScenes,ragStageOrder,ragWeeks,studyGroups,type RagStage} from './rag-demo.ts';

export function ExperienceView({lab,rag,experiments,onRag,onSave}:{lab:Lab;rag:Rag;experiments:Experiment[];onRag:(patch:Partial<Rag>)=>void;onSave:()=>void}){
 const activeStage=canRunStage(rag,rag.stage)?rag.stage:'normal';
 const shownStage=rag.displayedStage;
 const scene=ragScenes[shownStage||'normal'];
 const docs=scene.visible.map(docById).filter((doc):doc is NonNullable<typeof doc>=>!!doc);
 const complete=ragComplete(rag);
 function chooseStage(stage:RagStage){if(canRunStage(rag,stage))onRag({stage});}
 function execute(){onRag(runRagStage(rag,activeStage));}
 function toggleStudy(id:string){onRag({studyIds:rag.studyIds.includes(id)?rag.studyIds.filter(item=>item!==id):[...rag.studyIds,id]});}
 return <>
  <div className="experience-link"><span className="badge">{ragTopic.format}</span><span>{lab.name} · {ragTopic.title}</span></div>
  <section className="rag-sim" aria-label="정상, 공격, 방어 체험">
   <div className="rag-top"><p className="fixed-question"><strong>고정 질문</strong><br/>{ragQuestion}</p></div>
   <div className="rag-controls">
    <div className="stage-switch" role="group" aria-label="체험 단계">{ragStageOrder.map((id,i)=><button key={id} disabled={!canRunStage(rag,id)} className={activeStage===id?'primary':''} onClick={()=>chooseStage(id)}>{i+1}. {ragScenes[id].label}{rag.executed.includes(id)?' · 실행함':''}</button>)}</div>
    <button className="primary" onClick={execute}>{ragScenes[activeStage].label} 단계 실행</button>
   </div>
   <p className="hint">{activeStage==='normal'?'정상 문서로 먼저 답변을 확인하세요.':activeStage==='attack'?'가짜 문서를 넣은 조건입니다. 실행하면 문서와 답변이 함께 바뀝니다.':'필터를 켠 조건입니다. 실행하면 제외된 문서와 답변을 확인할 수 있습니다.'}{shownStage&&shownStage!==activeStage&&' 현재 화면은 '+ragScenes[shownStage].label+' 단계의 실행 결과입니다.'}</p>
   <div className="rag-board">
    <div className="rag-documents"><h3>검색된 문서 <span className="hint">{docs.length}개 · {scene.label} 조건</span></h3><div className="documents-scroll">{docs.map(doc=>{
     const excluded=scene.excluded.includes(doc.id);
     return <div className={'doc'+(doc.fake?' fake':'')+(excluded?' excluded':'')} key={doc.id}><div className="doc-heading"><strong>{doc.title}</strong>{doc.fake&&<span className="doc-label">추가된 문서</span>}{excluded&&<span className="doc-label excluded-label">필터로 제외됨</span>}</div><p>{doc.body.split('. ')[0].replace(/\.$/,'')}.</p><details><summary>문서 전문 보기</summary><p>{doc.body}</p></details></div>;
    })}</div></div>
    <div className="rag-answer-panel"><h3>현재 AI 답변</h3><p className="eyebrow">사전 구성된 교육용 예시</p>
     <p className="rag-answer" role="status">{shownStage?scene.answer:'정상 단계를 실행해 답변을 확인해 보세요.'}</p>
     {shownStage&&<><small>실행한 조건: {scene.label}</small><h3>답변이 참고한 문서</h3><ul>{scene.cited.map(id=><li key={id}>{docById(id)?.title}</li>)}</ul><p className="hint">{scene.note}</p>{scene.excluded.length>0&&<p className="hint">제외 문서는 예시에 미리 지정되어 있습니다. 실제 탐지 결과나 실측 성능이 아닙니다.</p>}</>}
     <div className="rag-next">{shownStage&&scene.next&&<button onClick={()=>chooseStage(scene.next!)}>{scene.nextLabel} →</button>}</div>
    </div>
   </div>
   <p className="hint">진행: {rag.executed.length}/3 단계 실행{!complete?' · 정상 → 공격 → 방어 순서로 실행해 주세요.':''}</p>
   {complete&&<div className="rag-change-summary" role="status"><strong>확인한 변화</strong><p>정상 14일 → 공격 30일 → 방어 14일</p><small>잘못된 자료가 답변을 바꾸고, 지정된 문서를 제외하면 원래 답변으로 돌아오는 교육용 예시입니다.</small></div>}
  </section>
  <details className="research-connection"><summary>이 체험과 실제 연구의 연결</summary><p><strong>RAG.</strong> {ragIntro.rag}</p><p>{ragIntro.lead}</p><p>{ragIntro.link}</p><p className="hint">{ragIntro.limit}</p><ul className="link-list">{ragIntro.papers.map(p=><li key={p.href}><a href={p.href} target="_blank" rel="noreferrer">{p.label}</a></li>)}</ul>{scene.extra&&<p>{scene.extra}</p>}</details>
  <section id="observation"><label className="field">관찰한 점 한 줄 남기기 <span className="hint">선택 입력</span><textarea value={rag.observation} onChange={e=>onRag({observation:e.target.value})} placeholder="문서와 답변의 변화에서 눈에 띈 점이 있나요?"/></label><button className="primary" disabled={!complete} onClick={onSave}>체험 저장하고 내 탐색 정리하기 →</button>{!complete&&<p className="hint">세 단계를 실행한 뒤 저장할 수 있습니다. 관찰 메모, 심화 계획과 공부 선택은 필수가 아닙니다.</p>}</section>
  <section className="optional-learning"><details><summary>더 해보고 싶다면: 4주 심화 프로젝트</summary><div className="week-grid">{ragWeeks.map(week=><details key={week.title}><summary><strong>{week.title}</strong><span>{week.summary}</span></summary><ul>{week.details.map(line=><li key={line}>{line}</li>)}</ul></details>)}</div><p>{ragOutput}</p><p className="hint">{ragPlanNote}</p><button className={rag.planSaved?'primary':''} onClick={()=>onRag({planSaved:!rag.planSaved})}>{rag.planSaved?'✓ 내 준비 계획에 담김':'내 준비 계획에 담기'}</button></details></section>
  <section className="optional-learning"><details><summary>직접 구현하기 전에 공부할 것</summary><p className="hint">필요한 항목만 골라 보세요. 연구실 지원 자격이나 필수 요건을 뜻하지 않습니다.</p>{studyGroups.filter(group=>group.title!=='지금 체험하기').map(group=><details key={group.title}><summary>{group.title}</summary><p className="hint">{group.note}</p><div className="chips">{group.items.map(item=><button key={item.id} className={rag.studyIds.includes(item.id)?'primary':''} onClick={()=>toggleStudy(item.id)}>{rag.studyIds.includes(item.id)?'✓ ':''}{item.label}</button>)}</div></details>)}</details></section>
  {experiments.length>0&&<section><h2>이전에 저장한 길찾기 기록 {experiments.length}개</h2><p className="hint">이전 기록은 그대로 보존했습니다.</p>{experiments.map(item=><details key={item.id}><summary>{item.date} · BFS {item.bfs.length??'경로 없음'} / A* {item.astar.length??'경로 없음'}</summary><p>예상: {item.prediction||'미작성'}</p><p>관찰: {item.observation||'미작성'}</p></details>)}</section>}
 </>;
}
