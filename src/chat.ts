import type {State} from './store.ts';
import {labs} from './data.ts';
import {recommend} from './recommend.ts';

export type ChatContext=Pick<State,'step'|'interest'|'selected'|'reflection'|'prep'>;

export async function generateReply(question:string,context:ChatContext):Promise<string>{
 const selected=labs.filter(l=>context.selected.includes(l.id));
 if(/추천|이유|좁혀/.test(question)){
  return recommend(context.interest).slice(0,8).map(({lab,matches})=>`${lab.name} (${lab.professor}): ${matches.join(', ')} 관련 항목이 일치합니다.`).join('\n')||'관심 분야를 입력하면 CSV의 연구 분야와 분류를 기준으로 후보를 찾을 수 있어요. 선택은 직접 해 주세요.';
 }
 if(/차이|비교|분야/.test(question)){
  return selected.map(l=>`${l.name}: ${l.researchFields.join(', ')}. ${l.detail?.overview||'상세 연구 설명은 아직 준비 중입니다.'}`).join('\n')||'먼저 후보를 선택해 주세요.';
 }
 if(/논문|학습|수업|과목|자료/.test(question)){
  return selected.map(l=>`${l.name}: ${l.detail?[`학습 주제: ${l.detail.learningTopics.join(', ')}`,`공개 논문: ${l.detail.papers.map(p=>`${p.title} (${p.year})`).join('; ')}`,`논문 목록: ${l.detail.publicationUrl}`].join('\n'):'논문과 담당 수업 정보는 아직 확인되지 않았습니다.'}`).join('\n\n')||'먼저 후보를 선택해 주세요. 담당 수업은 공식 자료가 확인되기 전까지 안내하지 않습니다.';
 }
 if(/체험|실험|질문/.test(question))return `연구실별 체험은 준비 중입니다. 공식 소개와 논문을 읽으며 확인할 질문을 기록해 보세요.${context.prep.ask?`\n현재 기록한 질문: ${context.prep.ask}`:''}`;
 if(/정리|요약|계획|다음/.test(question))return `저장된 탐색 기록을 정리합니다. 선택이나 다음 행동을 대신 결정하지 않아요.\n현재 과정: ${context.step+1}\n관심: ${context.interest||'미입력'}\n후보: ${selected.map(l=>l.name).join(', ')||'미선택'}\n확인할 질문: ${context.prep.ask||'미작성'}\n의견: ${context.reflection.interesting||'미작성'}\n다음 행동: ${context.reflection.next||'아직 작성하지 않음'}`;
 return '이 도우미는 저장된 연구실 정보와 선택 기록만 안내합니다. 공식 홈페이지와 논문 링크에서 최신 내용을 직접 확인해 주세요.';
}
