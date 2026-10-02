import {useState} from 'react';
import {areas} from './areas.ts';
import {clearRag, loadRag} from './rag.ts';
import {RagReview} from './rag.tsx';

const tourKey = 'lab-explorer:field-tour:v1';
export type TourSave = {focus:string; note:string; ask:string; curious:string[]};

export function loadTour(): TourSave | null {
 try {
  const raw = localStorage.getItem(tourKey);
  if (!raw) return null;
  const data = JSON.parse(raw) as Partial<TourSave>;
  if (!data || typeof data.focus !== 'string' || !areas.some(area=>area.id===data.focus)) return null;
  const curious = Array.isArray(data.curious) ? data.curious.filter((id): id is string => areas.some(area=>area.id===id)) : [];
  return {focus:data.focus, note:String(data.note||'').slice(0,400), ask:String(data.ask||'').slice(0,400), curious};
 } catch { return null; }
}

export function saveTour(data:TourSave): boolean {
 try { localStorage.setItem(tourKey, JSON.stringify(data)); return true; } catch { return false; }
}

export function clearTour() {
 try { localStorage.removeItem(tourKey); } catch { /* 저장소를 비우지 못해도 화면은 빈 기록으로 계속한다. */ }
 clearRag();
}

export function tourLabel() {
 return areas.find(area=>area.id===loadTour()?.focus)?.name || '';
}

export function tourMarkdown() {
 const tour = loadTour();
 if (!tour) return '';
 const name = areas.find(area=>area.id===tour.focus)?.name || tour.focus;
 const marked = tour.curious.map(id=>areas.find(area=>area.id===id)?.name).filter(Boolean);
 return `\n\n## 분야 둘러보기\n- 더 알고 싶은 분야: ${name}\n- 궁금한 이유: ${tour.note||'없음'}\n- 랩미팅에서 물어볼 질문: ${tour.ask||'없음'}\n- 둘러보며 표시한 분야: ${marked.join(', ')||'없음'}`;
}

export function FieldTour({onNotice, onSaved}:{onNotice:(text:string)=>void; onSaved:()=>void}) {
 const saved = loadTour();
 const [task, setTask] = useState(saved ? 2 : 0);
 const [areaIndex, setAreaIndex] = useState(0);
 const [curious, setCurious] = useState<string[]>(saved?.curious || []);
 const [focus, setFocus] = useState(saved?.focus || '');
 const [note, setNote] = useState(saved?.note || '');
 const [ask, setAsk] = useState(saved?.ask || '');
 const [ragOpen, setRagOpen] = useState(false);
 const ready = Boolean(focus && note.trim() && ask.trim());
 const area = areas[areaIndex];

 function save() {
  if (!ready) return;
  if (!saveTour({focus, note:note.trim(), ask:ask.trim(), curious})) {
   onNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.');
   return;
  }
  onSaved();
  onNotice('둘러보기를 저장했습니다.');
 }

 if (ragOpen) return <RagReview onBack={()=>setRagOpen(false)} onNotice={onNotice}/>;
 if (task===0) return <section><h2>학부연구생의 첫 주</h2><p>보안 연구실이 보는 일곱 분야를 한 화면씩 엽니다. 각 화면은 연구실이 보는 것, 처음 해 보는 일, 그 분야의 질문입니다.</p><ul className="task-list">{areas.map(item=><li key={item.id}>{item.name}</li>)}</ul><p className="muted">이 둘러보기는 연구 질문을 이해하기 위한 단순화입니다. 논문 재현이 아니며, 실제 불법 사이트나 공격 절차는 다루지 않습니다.</p><div className="footer-actions"><button className="primary" onClick={()=>setTask(1)}>분야 열기</button></div></section>;
 if (task===1) return <section><p className="eyebrow">{areaIndex+1} / {areas.length}</p><h2>{area.name}</h2><h3>연구실이 보는 것</h3><p>{area.about}</p><h3>처음 해 보는 일</h3><p>{area.scene}</p><h3>이 분야의 질문</h3><p>{area.question}</p><button className={curious.includes(area.id)?'primary':''} onClick={()=>setCurious(current=>current.includes(area.id)?current.filter(id=>id!==area.id):[...current, area.id])}>{curious.includes(area.id)?'이 분야가 더 궁금해요 ✓':'이 분야가 더 궁금해요'}</button><div className="footer-actions"><button disabled={areaIndex===0} onClick={()=>setAreaIndex(index=>index-1)}>이전 분야</button>{areaIndex<areas.length-1?<button className="primary" onClick={()=>setAreaIndex(index=>index+1)}>다음 분야</button>:<button className="primary" onClick={()=>setTask(2)}>관심 분야 정하기</button>}</div></section>;
 return <section><h2>더 알고 싶은 분야를 하나 고르세요</h2><div className="chips">{areas.map(item=><button key={item.id} className={focus===item.id?'primary':''} onClick={()=>setFocus(item.id)}>{item.name}{curious.includes(item.id)?' · 궁금':''}</button>)}</div><label className="field" htmlFor="tour-note">이 분야가 더 궁금한 이유<textarea id="tour-note" value={note} onChange={event=>setNote(event.target.value)}/></label><label className="field" htmlFor="tour-ask">랩미팅에서 물어볼 질문<textarea id="tour-ask" value={ask} onChange={event=>setAsk(event.target.value)}/></label>{loadRag().committed&&<p className="notice">검색 결과 점검을 저장해 두었습니다. 체험해보기에서 다시 열 수 있습니다.</p>}<div className="footer-actions"><button onClick={()=>{setAreaIndex(0);setTask(1);}}>분야 다시 보기</button><button className="primary" disabled={!ready} onClick={save}>둘러보기 저장</button><button disabled={!ready} onClick={()=>setRagOpen(true)}>체험해보기</button></div></section>;
}
