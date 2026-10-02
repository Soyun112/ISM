export const ragKey = 'lab-explorer:secai-rag-review:v1';
export const paperUrl = 'https://arxiv.org/abs/2511.01268';
export const paperTitle = 'Rescuing the Unpoisoned: Efficient Defense against Knowledge Corruption Attacks on RAG Systems';
export const codeUrl = 'https://github.com/SecAI-Lab/RAGDefender';
export const paperNote = '이 체험은 논문을 요약한 것이 아니라 문제의식을 체험용으로 재구성한 가상 예시입니다.';

export const choices = [
 {id:'use' as const, label:'근거로 쓴다'},
 {id:'hold' as const, label:'보류'},
 {id:'unsure' as const, label:'모르겠음'}
];
export const reasonChips = ['같은 말을 거의 그대로 반복함', '출처가 한 곳에 몰림', '다른 문서와 내용이 어긋남', '날짜·출처가 구체적임', '확인이 더 필요함'];
export const moreOptions = ['방어 방식', '공격 쪽 연구', '평가 방법', '공개 코드 읽는 법'];

export type Choice = '' | 'use' | 'hold' | 'unsure';
export type DocMark = {choice:Choice; reasons:string[]};
export type RagState = {
 committed:boolean;
 marks:Record<string, DocMark>;
 keep:string;
 rule:string;
 more:string[];
 ask:string;
};

export const docs: {id:string; source:string; text:string}[] = [
 {id:'1', source:'도서관 공지 (날짜 있음)', text:'3층 열람실은 평일 오전 9시부터 밤 10시까지 운영합니다.'},
 {id:'2', source:'학생 커뮤니티 글', text:'시험 기간엔 3층 열람실이 밤 10시까지 열려 있어서 자주 가요.'},
 {id:'3', source:'도서관 안내 요약', text:'열람실 운영시간은 층별로 다르며, 3층은 평일 22시 종료입니다.'},
 {id:'4', source:'블로그 A', text:'3층 열람실은 새벽 2시까지 운영하는 것으로 알려져 있습니다.'},
 {id:'5', source:'블로그 B', text:'3층 열람실은 새벽 2시까지 운영하는 것으로 알려져 있습니다. 많은 학생이 이용합니다.'},
 {id:'6', source:'학생 후기', text:'작년 시험 기간에는 새벽 2시까지 연장 운영했어요. 올해는 공지를 확인해 보세요.'}
];

export function emptyRag(): RagState {
 return {
  committed:false,
  marks:Object.fromEntries(docs.map(doc=>[doc.id, {choice:'' as Choice, reasons:[]}])),
  keep:'', rule:'', more:[], ask:''
 };
}

function choiceOf(value:unknown): Choice {
 return value==='use'||value==='hold'||value==='unsure'?value:'';
}

export function normalizeRag(raw:string|null): RagState {
 const base = emptyRag();
 try {
  const parsed = JSON.parse(raw||'null');
  if (!parsed || typeof parsed!=='object') return base;
  const marks = {...base.marks};
  for (const doc of docs) {
   const item = parsed.marks?.[doc.id];
   marks[doc.id] = {
    choice:choiceOf(item?.choice),
    reasons:reasonChips.filter(chip=>Array.isArray(item?.reasons)&&item.reasons.includes(chip))
   };
  }
  const keep = docs.some(doc=>doc.id===parsed.keep)?parsed.keep:'';
  return {
   committed:parsed.committed===true,
   marks,
   keep,
   rule:typeof parsed.rule==='string'?parsed.rule.slice(0,100):'',
   more:moreOptions.filter(option=>Array.isArray(parsed.more)&&parsed.more.includes(option)),
   ask:typeof parsed.ask==='string'?parsed.ask.slice(0,200):''
  };
 } catch { return base; }
}

export function loadRag(): RagState {
 try { return normalizeRag(typeof localStorage==='undefined'?null:localStorage.getItem(ragKey)); }
 catch { return emptyRag(); }
}

export function saveRag(state:RagState): boolean {
 try { localStorage.setItem(ragKey, JSON.stringify(state)); return true; }
 catch { return false; }
}

export function clearRag() {
 try { localStorage.removeItem(ragKey); } catch { /* 저장소를 비우지 못해도 화면은 빈 기록으로 계속한다. */ }
}

export function countChoice(state:RagState, choice:Choice) {
 return docs.filter(doc=>state.marks[doc.id].choice===choice).length;
}

export function ragMarkdown(state:RagState): string {
 if (!state.committed) return '';
 const kept = docs.find(doc=>doc.id===state.keep);
 const status = !kept?'없음':state.marks[kept.id].choice==='hold'?'보류됨':state.marks[kept.id].choice==='use'?'근거로 씀':'표시만 됨';
 const keptLine = kept?`문서 ${kept.id} (${status})`:'없음';
 return `\n\n## SecAI Lab · AI 보안 — 검색 결과 묶음 점검\n- 근거로 쓴 문서: ${countChoice(state,'use')}장 / 보류: ${countChoice(state,'hold')}장\n- 정상일 수도 있다고 표시한 문서: ${keptLine}\n- 내 걸러내기 기준: ${state.rule||'없음'}\n- 더 알고 싶은 것: ${state.more.join(', ')||'없음'}\n- 연구실에 물어볼 것: ${state.ask||'없음'}\n- 참고 논문: Rescuing the Unpoisoned (ACSAC 2025) — ${paperUrl}\n\n> ${paperNote}`;
}
