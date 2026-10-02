import {useState} from 'react';
import {choices, codeUrl, countChoice, docs, loadRag, moreOptions, paperNote, paperTitle, paperUrl, reasonChips, saveRag, type Choice, type RagState} from './rag.ts';

export function RagReview({onBack, onNotice}:{onBack:()=>void; onNotice:(text:string)=>void}) {
 const [data, setData] = useState<RagState>(loadRag);
 const [screen, setScreen] = useState(1);
 function persist(next:RagState) {
  setData(next);
  if (!saveRag(next)) onNotice('브라우저 저장 공간을 사용할 수 없습니다. 표시는 이 화면에만 남아 있습니다.');
 }
 function setChoice(id:string, choice:Choice) {
  const current = data.marks[id];
  const keep = data.keep===id && choice!=='hold' ? '' : data.keep;
  persist({...data, keep, marks:{...data.marks, [id]:{...current, choice}}});
 }
 function toggleReason(id:string, chip:string) {
  const current = data.marks[id];
  const reasons = current.reasons.includes(chip)?current.reasons.filter(item=>item!==chip):[...current.reasons, chip];
  persist({...data, marks:{...data.marks, [id]:{...current, reasons}}});
 }
 const marked = docs.some(doc=>data.marks[doc.id].choice);
 const held = docs.filter(doc=>data.marks[doc.id].choice==='hold');
 const keepReady = held.length===0 || held.some(doc=>doc.id===data.keep);
 const ruleReady = data.rule.trim().length>0 && keepReady;
 if (screen===1) return <article className="label-card"><span className="eyebrow">AI 보안 · 직접 해 보기</span><h3>검색 결과 묶음 점검하기</h3><p>선배가 말합니다. “RAG 시스템이 질문에 답하려고 가져온 문서 묶음이야. 어떤 문서를 근거로 쓸지 점검하고, 네 기준을 적어 와.”</p><p>RAG는 AI가 답하기 전에 외부 문서를 검색해 근거로 삼는 방식입니다. 이때 검색된 문서 중 일부가 오염되어 있으면 답이 흔들릴 수 있습니다. SecAI Lab은 이런 문서를 검색 후 단계에서 가볍게 걸러내는 방어를 연구했습니다(ACSAC 2025). 논문은 이 거르기를 가벼운 기계학습으로 하며, 추가 모델 학습이나 추론은 쓰지 않는다고 적습니다.</p><p>{paperTitle}</p><p><a href={paperUrl} target="_blank" rel="noreferrer">논문 페이지 열기</a></p><p className="muted">{paperNote}</p><div className="footer-actions"><button onClick={onBack}>분야 선택으로 돌아가기</button><button className="primary" onClick={()=>setScreen(2)}>시작하기</button></div></article>;
 if (screen===2) return <div><p><strong>질문.</strong> 우리 학교 도서관 3층 열람실은 몇 시까지 여나요?</p><div className="site-grid evidence-grid">{docs.map(doc=>{const mark=data.marks[doc.id];return <article className="rag-doc" key={doc.id}><span className="eyebrow">문서 {doc.id}</span><p>{doc.source}</p><p>{doc.text}</p><div className="signal-row">{choices.map(choice=><button key={choice.id} aria-pressed={mark.choice===choice.id} className={mark.choice===choice.id?'on':''} onClick={()=>setChoice(doc.id, choice.id)}>{choice.label}</button>)}</div><div className="chips">{reasonChips.map(chip=><button key={chip} aria-pressed={mark.reasons.includes(chip)} className={mark.reasons.includes(chip)?'primary':''} onClick={()=>toggleReason(doc.id, chip)}>{chip}</button>)}</div></article>;})}</div><div className="footer-actions"><button onClick={()=>setScreen(1)}>이전</button><button className="primary" disabled={!marked} onClick={()=>setScreen(3)}>다음</button></div></div>;
 if (screen===3) return <article className="label-card"><h3>내 기준 점검</h3><p>근거로 쓴 문서 {countChoice(data,'use')}장 / 보류 {countChoice(data,'hold')}장{data.keep?` / 정상일 수도 있다고 고른 문서 ${data.keep}는 ${data.marks[data.keep].choice==='hold'?'보류됐습니다':'보류가 아닙니다'}`:''}</p><p>걸러내는 기준이 엄격할수록 정상 문서도 함께 놓칠 수 있습니다. 이 랩의 논문 제목(Rescuing the Unpoisoned)에서도 보이듯, 정상 문서를 살리는 일은 방어 연구의 한 과제입니다.</p>{held.length===0?<p className="muted">보류한 문서가 없습니다. 기준만 적어도 다음으로 갈 수 있습니다.</p>:<><p>보류한 문서 중에서, 버리면 곤란한 정상 문서일 수도 있는 것을 하나 고르세요.</p><div className="chips">{held.map(doc=><button key={doc.id} aria-pressed={data.keep===doc.id} className={data.keep===doc.id?'primary':''} onClick={()=>persist({...data, keep:doc.id})}>문서 {doc.id}</button>)}</div></>}<label className="field">내 걸러내기 기준<input maxLength={100} value={data.rule} onChange={event=>persist({...data, rule:event.target.value.slice(0,100)})} placeholder="예: 날짜가 있는 도서관 안내와 어긋나면 바로 버리지 않고 보류한다."/></label><div className="result-cards"><div className="result"><strong>가져온 글을 모두 둔 예시</strong><span>가져온 글에는 평일 밤 10시까지라는 안내와 새벽 2시까지라는 글이 함께 있습니다.</span></div><div className="result"><strong>날짜 있는 공지를 남긴 예시</strong><span>도서관 공지를 근거로 두면, 3층 열람실은 평일 밤 10시까지로 적힙니다.</span></div></div><p className="muted">위 두 문장은 체험용으로 미리 적은 글입니다. 내 선택 결과나 모델의 답이 아닙니다.</p><div className="footer-actions"><button onClick={()=>setScreen(2)}>이전</button><button className="primary" disabled={!ruleReady} onClick={()=>setScreen(4)}>다음</button></div></article>;
 return <article className="label-card"><h3>연구 노트</h3><p>근거로 쓴 문서 {countChoice(data,'use')}장 / 보류 {countChoice(data,'hold')}장</p><p>정상일 수도 있다고 표시한 문서: {data.keep?`문서 ${data.keep}`:'없음'}</p><p>내 걸러내기 기준: {data.rule}</p><p>더 알고 싶은 것</p><div className="chips">{moreOptions.map(option=><button key={option} aria-pressed={data.more.includes(option)} className={data.more.includes(option)?'primary':''} onClick={()=>persist({...data, more:data.more.includes(option)?data.more.filter(item=>item!==option):[...data.more, option]})}>{option}</button>)}</div><label className="field">연구실에 물어볼 것<textarea maxLength={200} value={data.ask} onChange={event=>persist({...data, ask:event.target.value.slice(0,200)})} placeholder="예: 정상 문서를 살리는 기준은 누가 정하나요?"/></label><p><a href={codeUrl} target="_blank" rel="noreferrer">랩이 공개한 코드 저장소</a></p><div className="footer-actions"><button onClick={()=>setScreen(3)}>이전</button><button className="primary" onClick={()=>{const next={...data, committed:true}; if(!saveRag(next)){onNotice('브라우저 저장 공간을 사용할 수 없습니다. 요약을 다운로드해 기록을 보관하세요.'); return;} setData(next); onNotice('검색 결과 점검을 저장했습니다.'); onBack();}}>저장하고 돌아가기</button></div></article>;
}
