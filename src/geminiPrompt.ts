import type {ChatContext} from './chat.ts';
import {labs,taughtCourses} from './data.ts';

export type GeminiTurn={role:'user'|'assistant';text:string};

export function buildGeminiRequest(question:string,context:ChatContext,history:GeminiTurn[]){
 const selected=labs.filter(lab=>context.selected.includes(lab.id)).slice(0,12);
 const records=selected.map(lab=>{
  const courses=(taughtCourses[lab.professor]||[]).map(course=>`${course.name} / 학수번호 ${course.code} / ${course.time}`).join(' ; ')||'확인된 담당 수업 없음';
  const detail=lab.detail?[
   `이해: ${lab.detail.overview}`,
   `연구 방법: ${lab.detail.methods.join(', ')}`,
   `논문: ${lab.detail.papers.map(paper=>`${paper.title} (${paper.year})`).join('; ')}`,
   `홈페이지: ${lab.website||'미확인'}`
  ].join('\n'):`연구 분야: ${lab.researchFields.join(', ')}`;
  return `${lab.name} (${lab.professor}, ${lab.department})\n${detail}\n담당 수업: ${courses}`;
 }).join('\n\n')||'선택한 연구실 없음';
 const system=[
  '너는 연구실 탐색 지도의 탐색 도우미다. 한국어로 답하고, 학생의 기록에 없는 사실은 확인되지 않았다고 말한다.',
  '연구실 선택과 다음 행동은 대신 정하지 않는다. 후보를 비교하고 기록된 사실만 안내한다.',
  'RAG 체험은 미리 구성한 예시이다. 논문 알고리즘을 실행한 결과, 탐지 결과, 유사도 점수, 공격 성공률이라고 말하지 않는다.',
  '정상 자료만 있는 예시 답변은 14일이고, 가짜 문서가 들어간 예시 답변은 30일이다. 회색 문서는 미리 지정한 의심 문서다.',
  `현재 단계: ${context.step+1}`,
  `관심: ${context.interest||'미입력'}`,
  `체험할 연구실 id: ${context.prep.focus||'미선택'}`,
  `RAG 상태: ${context.rag.stage}, 관찰: ${context.rag.observation||'미작성'}`,
  `의견: ${context.reflection.interesting||'미작성'}`,
  `다음 행동: ${context.reflection.next||'미작성'}`,
  `저장된 연구실 정보:\n${records}`
 ].join('\n');
 const contents=[...history.slice(-6).map(turn=>({role:turn.role==='assistant'?'model':'user',parts:[{text:turn.text.slice(0,2000)}]})),{role:'user',parts:[{text:question.slice(0,2000)}]}];
 return {system,contents};
}
