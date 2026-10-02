import type {State} from './store.ts';
import {labs} from './data.ts';
import {recommend} from './recommend.ts';

export type ChatContext=Pick<State,'step'|'interest'|'selected'|'reflection'|'prep'|'rag'>;

export async function generateReply(question:string,context:ChatContext):Promise<string>{
 const selected=labs.filter(l=>context.selected.includes(l.id));
 if(/가짜 문서|30일|공격 성공/.test(question))return '이 화면은 미리 구성한 예시입니다. 가짜 문서가 들어가면 예시 답변은 30일이 됩니다. 공격 성공률은 계산하지 않았습니다.';
 if(/탐지|걸러|방어 필터|제외된 문서/.test(question))return '회색 문서는 이 시나리오에 미리 지정한 의심 문서입니다. 탐지 결과가 아닙니다. 정상 문서까지 빠지면 답변에 필요한 근거가 줄어들 수 있습니다.';
 if(/정상 자료|논문 알고리즘|14일/.test(question))return '정상 자료만 볼 때 예시 답변은 14일입니다. 논문 알고리즘을 실행하지 않았고, 문서와 답변은 미리 구성한 예시입니다.';
 if(/추천|이유|좁혀/.test(question)){
  return recommend(context.interest).slice(0,8).map(({lab,matches})=>`${lab.name} (${lab.professor}): ${matches.join(', ')} 관련 항목이 일치합니다.`).join('\n')||'관심 분야를 입력하면 CSV의 연구 분야와 분류를 기준으로 후보를 찾을 수 있어요. 선택은 직접 해 주세요.';
 }
 if(/차이|비교|분야/.test(question)){
  return selected.map(l=>`${l.name}: ${l.researchFields.join(', ')}. ${l.detail?.overview||'상세 연구 설명은 아직 준비 중입니다.'}`).join('\n')||'먼저 후보를 선택해 주세요.';
 }
 if(/논문|학습|수업|과목|자료/.test(question)){
  return selected.map(l=>`${l.name}: ${l.detail?[`학습 주제: ${l.detail.learningTopics.join(', ')}`,`공개 논문: ${l.detail.papers.map(p=>`${p.title} (${p.year})`).join('; ')}`,`논문 목록: ${l.detail.publicationUrl}`].join('\n'):'논문과 담당 수업 정보는 아직 확인되지 않았습니다.'}`).join('\n\n')||'먼저 후보를 선택해 주세요. 담당 수업은 공식 자료가 확인되기 전까지 안내하지 않습니다.';
 }
 if(/체험|실험|질문/.test(question))return `작은 연구 체험에서는 보안 연구의 일곱 분야를 한 화면씩 엽니다. 분야와 이유를 적으면 검색된 문서 묶음을 근거로 쓸지 보류할지 직접 표시할 수 있습니다. 선택이나 점수는 대신 정하지 않아요.${context.prep.ask?`\n현재 기록한 질문: ${context.prep.ask}`:''}`;
 if(/정리|요약|계획|다음/.test(question))return `저장된 탐색 기록을 정리합니다. 선택이나 다음 행동을 대신 결정하지 않아요.\n현재 과정: ${context.step+1}\n관심: ${context.interest||'미입력'}\n후보: ${selected.map(l=>l.name).join(', ')||'미선택'}\n확인할 질문: ${context.prep.ask||'미작성'}\n의견: ${context.reflection.interesting||'미작성'}\n다음 행동: ${context.reflection.next||'아직 작성하지 않음'}`;
 return '이 도우미는 저장된 연구실 정보와 선택 기록만 안내합니다. 공식 홈페이지와 논문 링크에서 최신 내용을 직접 확인해 주세요.';
}
