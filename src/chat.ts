import type {State} from './store.ts';
import {labs} from './data.ts';
import {recommend} from './recommend.ts';
export type ChatContext=Pick<State,'step'|'interest'|'selected'|'experiments'|'reflection'>;
export async function generateReply(question:string,context:ChatContext):Promise<string>{
 const selected=labs.filter(l=>context.selected.includes(l.id));
 if(/추천|이유/.test(question))return recommend(context.interest).map(x=>`${x.lab.name}: 입력에서 “${x.matches.join(', ')}” 태그가 일치합니다.`).join('\n')||'관심 키워드를 입력하면 일치하는 연구실 태그를 안내할 수 있어요.';
 if(/차이|비교/.test(question)&&!/실험/.test(question))return selected.map(l=>`${l.name}: ${l.problem} 방법: ${l.methods}`).join('\n')||'먼저 후보 연구실을 선택해 주세요.';
 if(/수업|과목/.test(question))return '교수님 담당 수업은 누가 가르치는지에 대한 정보이고, 관련 과목은 연구 이해에 도움이 되는 기초입니다. 담당 수업이 연구와 직접 연결된다고 단정할 수 없으며 현재·과거·미확인 표시를 확인해 주세요.';
 if(/실험|분야|과제|체험|둘러/.test(question)&&!/정리/.test(question))return '학부연구생 첫 주 체험입니다. AI 보안, 프로그램 분석, 이상 탐지, 시스템 보안, 소프트웨어 테스팅, 사용자 인증, 네트워크 보안을 하나씩 엽니다. 각 화면에서 그 분야가 무엇을 보는지, 어떤 예시를 보는지, 어떤 질문을 던지는지 읽고 다음으로 넘어가세요. 마지막에 더 알고 싶은 분야와 랩미팅 질문을 적습니다. 공격 절차는 안내하지 않아요.';
 if(/정리|요약/.test(question))return `현재 과정: ${context.step+1}\n관심: ${context.interest||'미입력'}\n후보: ${selected.map(l=>l.name).join(', ')||'미선택'}\n저장한 체험: ${context.experiments.length}개\n다음 행동: ${context.reflection.next||'아직 작성하지 않음'}`;
 return '데모 응답 모드에서는 추천 태그 근거, 선택 후보의 차이, 과목 구분, 연구실 분야 둘러보기, 탐색 요약을 안내할 수 있어요. 외부 자료 검색이나 실제 모집 정보 확인은 지원하지 않습니다.';
}
