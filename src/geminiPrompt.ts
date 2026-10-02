import type {ChatContext} from './chat.ts';
import {labs,relatedCourses,taughtCourses} from './data.ts';
import {recommend} from './recommend.ts';
import {ragTopic,topicForLab} from './experience-data.ts';
import {ragScenes,studyGroups} from './rag-demo.ts';
import {directions} from './planning.ts';

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
  return `${lab.name} (${lab.professor}, ${lab.department})\n${detail}\n담당 수업: ${courses}\n관련 학습 주제(공식 개설 과목명·강의코드 미확인): ${relatedCourses(lab).map(c=>c.name).join(', ')||'미확인'}\n제공 체험: ${topicForLab(lab)?.title||'준비 중'}`;
 }).join('\n\n')||'선택한 연구실 없음';
 const system=[
  '너는 연구실 탐색 지도의 탐색 도우미다. 한국어로 답하고, 학생의 기록에 없는 사실은 확인되지 않았다고 말한다.',
  '연구실 선택과 다음 행동은 대신 정하지 않는다. 후보를 비교하고 기록된 사실만 안내한다.',
  '개인적인 선택 이유나 의견을 대신 작성하지 않는다. 입력된 기록이 없으면 미작성이라고 말한다. 키워드 일치는 학생이 작성한 선택 이유가 아니다.',
  '선택한 후보가 두 곳이 아니면 두 연구실 비교가 아직 준비되지 않았다고 안내한다. 체험 주제가 없거나 실행한 단계가 없으면 체험 전임을 명시한다.',
  '단계 선택은 실행과 다르다. 아래 실행한 단계 목록만 실제 진행으로 취급하고, 방문·단계 선택만으로 완료했다고 말하지 않는다.',
  '담당 수업과 관련 학습 주제를 구분하고, 학기·학부/대학원·미확인 강의코드를 추측하지 않는다.',
  'RAG 체험은 미리 구성한 예시이다. 논문 알고리즘을 실행한 결과, 탐지 결과, 유사도 점수, 공격 성공률이라고 말하지 않는다.',
  '교육용 예시는 정상 14일 → 공격 30일 → 방어 14일이다. 필터로 제외된 문서는 미리 지정한 의심 문서다. 실제 AI 답변 생성·논문 재현·실측 성능이 아니다.',
  `현재 단계: ${context.step+1}`,
  `관심: ${context.interest||'미입력'}`,
  `선택한 연구실 수: ${selected.length}/2`,
  `추천 근거(선택 여부와 별개): ${recommend(context.interest).slice(0,4).map(({lab,matches})=>`${lab.name}: ${matches.join(', ')}`).join('; ')||'추천 후보 없음'}`,
  `체험할 연구실 id: ${context.experienceSelection?.labId||'미선택'}`,
  `체험 주제: ${context.experienceSelection?.topicId===ragTopic.id&&selected.some(l=>l.id===context.experienceSelection?.labId&&topicForLab(l))?ragTopic.title:'미선택 또는 현재 후보에 없음'}`,
  `선택한 실행 조건: ${context.rag.stage}; 실제 실행한 단계: ${context.rag.executed.map(id=>ragScenes[id].label).join(', ')||'없음'}`,
  `마지막 실행 결과: ${context.rag.displayedStage?ragScenes[context.rag.displayedStage].label:'미실행'}; 관찰: ${context.rag.observation||'미작성'}`,
  `선택한 공부: ${studyGroups.flatMap(g=>g.items).filter(i=>context.rag.studyIds.includes(i.id)).map(i=>i.label).join(', ')||'미선택'}; 4주 계획: ${context.rag.planSaved?'담음':'담지 않음'}`,
  `의견: ${context.reflection.interesting||'미작성'}`,
  `다음 행동: ${context.reflection.next||'미작성'}`,
  `개인적인 선택 이유(키워드 일치와 구분): ${JSON.stringify(context.reasons)}`,
  `내가 작성한 의견 전체: ${JSON.stringify(context.reflection)}`,
  `다음 일주일 탐색 방향: ${directions.find(d=>d.id===context.week.input.direction)?.title||'미선택'}`,
  `이번 주 확인할 질문: ${context.week.input.question||'미작성'}; 가능한 일정과 익숙한 정도: ${JSON.stringify(context.week.input)}`,
  `현재 저장된 계획: ${JSON.stringify(context.week.plan)}; 현재 보고 있는 활동 ID: ${context.week.activeId||'미선택'}`,
  '계획이 없으면 선택한 방향을 돕고 계획이 있으면 현재 활동과 사용자의 메모를 바탕으로 공부 방법을 설명한다. 일반 질문에 답할 뿐 계획을 수정하거나 완료 상태를 바꾸지 않는다. 계획 조정은 별도 수정안을 사용자가 확인 후 반영하는 기능이다.',
  `저장된 연구실 정보:\n${records}`
 ].join('\n');
 const contents=[...history.slice(-6).map(turn=>({role:turn.role==='assistant'?'model':'user',parts:[{text:turn.text.slice(0,2000)}]})),{role:'user',parts:[{text:question.slice(0,2000)}]}];
 return {system,contents};
}
