import type {State} from './store.ts';
import {courses,labs} from './data.ts';
import {recommend} from './recommend.ts';
export type ChatContext=Pick<State,'step'|'interest'|'selected'|'courseIds'|'experiments'|'reflection'|'prep'>;
export async function generateReply(question:string,context:ChatContext):Promise<string>{
 const selected=labs.filter(l=>context.selected.includes(l.id));
 const names=selected.map(l=>l.name).join(', ');
 const savedCourses=courses.filter(c=>context.courseIds.includes(c.id)).map(c=>c.name);
 if(/추천|이유|좁혀/.test(question))return recommend(context.interest).map(x=>`${x.lab.name}: 입력에서 “${x.matches.join(', ')}” 태그가 일치합니다.`).join('\n')||'관심 키워드를 입력하면 일치하는 가상 연구실 태그를 안내할 수 있어요. 어느 연구실을 고를지는 대신 정하지 않아요.';
 if(/차이|비교/.test(question)&&!/실험|체험/.test(question))return selected.map(l=>`${l.name}: ${l.problem} 방법: ${l.methods}`).join('\n')||'먼저 더 알아볼 후보 연구실을 선택해 주세요. 선택하지 않은 연구실은 비교에 넣지 않습니다.';
 if(/수업|과목|자료/.test(question))return `교수님 담당 수업은 누가 가르치는지에 대한 정보이고, 관련 과목은 연구 이해에 도움이 되는 기초입니다. 담당 수업이 연구와 직접 연결된다고 단정할 수 없으며 현재·과거·미확인 표시를 확인해 주세요.${savedCourses.length?`\n저장한 관심 과목: ${savedCourses.join(', ')}`:''}`;
 if(/실험|BFS|A\*|체험/.test(question)&&!/정리/.test(question))return `같은 지도에서 최단 경로의 이동 횟수와 탐색한 칸 수를 비교하세요. 탐색한 칸은 큐 또는 우선순위 목록에서 꺼내 처리한 칸(시작·목적지 포함)입니다. BFS는 너비 우선, A*는 맨해튼 거리로 목표에 가까운 후보를 우선합니다. 실행 시간만으로 우열이나 적성을 판단하지 않아요.${context.prep.ask?`\n체험 전에 적어 둔 질문: ${context.prep.ask}`:''}`;
 if(/정리|요약|계획|다음/.test(question))return `데모 응답입니다. 저장된 기록만 보여 드리며, 연구실이나 다음 행동을 대신 정하지 않아요.\n현재 과정: ${context.step+1}\n관심: ${context.interest||'미입력'}\n더 살펴보는 후보: ${names||'미선택'}\n체험 전 질문: ${context.prep.ask||'미작성'}\n저장한 실험: ${context.experiments.length}개\n의견: ${context.reflection.interesting||'미작성'}\n확인한 다음 행동: ${context.reflection.next||'아직 없음'}`;
 return '데모 응답 모드에서는 추천 태그 근거, 선택 후보의 차이, 과목 구분, 길찾기 실험, 탐색 요약을 안내할 수 있어요. 외부 자료 검색이나 실제 모집 정보 확인은 지원하지 않으며, 선택과 의견은 대신 확정하지 않습니다.';
}
