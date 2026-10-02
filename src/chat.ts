import type {State} from './store.ts';
import {labs,relatedCourses,taughtCourses} from './data.ts';
import {recommend} from './recommend.ts';
import {ragTopic,topicForLab} from './experience-data.ts';
import {ragScenes,studyGroups} from './rag-demo.ts';

export type ChatContext=Pick<State,'step'|'interest'|'selected'|'reasons'|'courseIds'|'reflection'|'prep'|'experienceSelection'|'rag'|'week'>;

export async function generateReply(question:string,context:ChatContext):Promise<string>{
 const selected=labs.filter(l=>context.selected.includes(l.id));
 const topicLab=selected.find(l=>l.id===context.experienceSelection?.labId&&topicForLab(l));
 const topic=topicLab&&context.experienceSelection?.topicId===ragTopic.id?ragTopic:null;
 if(/구체적|나누|좁혀/.test(question)){
  if(!context.interest.trim())return '아직 관심 분야가 입력되지 않았습니다. 먼저 궁금한 분야를 적으면, 보유한 연구 분야와 질문을 바탕으로 나눠 볼 수 있어요.';
  const candidates=recommend(context.interest).slice(0,4);
  return candidates.length?'입력한 관심을 보유한 연구 분야에 따라 나눠 보면 다음과 같습니다.\n'+candidates.map(({lab})=>lab.name+': '+(lab.detail?.questions[0]||lab.researchFields.join(' · '))).join('\n')+'\n어떤 문제가 더 궁금한지는 직접 선택해 주세요.':'현재 자료에서 연결되는 연구 분야를 찾지 못했습니다. 예시 키워드로 관심을 구체화해 주세요.';
 }
 if(/추천|연결|이유/.test(question)&&!/가짜 문서/.test(question)){
  return recommend(context.interest).slice(0,4).map(({lab,matches})=>lab.name+' ('+lab.professor+'): 관심과 연결된 키워드 '+matches.join(', ')+'.').join('\n')||'아직 연결되는 추천 후보가 없습니다. 관심 분야를 먼저 입력해 주세요.';
 }
 if(/차이|비교/.test(question)){
  if(selected.length!==2)return '두 연구실의 차이를 비교하려면 서로 다른 후보를 정확히 2개 선택해 주세요. 아직 두 곳의 선택이 확인되지 않았습니다.';
  return selected.map(l=>l.name+': '+(l.detail?.methods.join(' · ')||l.researchFields.join(' · '))+'\n연구 질문: '+(l.detail?.questions[0]||'미확인')).join('\n\n')+'\n보유한 연구 방법과 문제의 차이이며, 개인 적합도나 우열은 판단하지 않습니다.';
 }
 if(/가짜 문서|30일|공격 성공/.test(question)){
  const status=topic?'선택한 주제는 '+topic.title+'입니다.':'아직 체험 주제를 선택하지 않았습니다.';
  return status+'\n'+(context.rag.executed.includes('attack')?'실행한 공격 단계에서는':'공격 단계를 실행하면')+' 미리 지정된 가짜 문서의 30일 정보를 참고하는 예시 답변을 보여 줍니다. 정상 자료는 14일입니다. 실제 AI 추론이나 공격 성공률 측정 결과가 아닙니다.';
 }
 if(/탐지|걸러|방어 필터|제외된 문서/.test(question))return '필터로 제외된 문서는 이 시나리오에 미리 지정한 의심 문서입니다. 실제 탐지 결과가 아닙니다. 정상 문서까지 빠지면 답변에 필요한 근거가 줄어들 수 있습니다.';
 if(/구현|무엇부터 공부|사전 공부/.test(question)){
  return (context.rag.executed.length?'현재 실행한 단계: '+context.rag.executed.map(id=>ragScenes[id].label).join(', '):'아직 실행한 체험 단계가 없습니다.')+'\n직접 구현하려면 Python 기초 → LLM 호출 → RAG·임베딩·벡터 검색 순서로 살펴보세요. 이후 위협 모델과 평가 기준을 정하고, 방어와 정상 문서 오탐을 함께 비교할 수 있습니다. 아래 사전 공부 항목은 선택 사항입니다.';
 }
 if(/수업|과목|학습|논문|자료/.test(question)){
  if(!selected.length)return '먼저 연구실 후보를 선택해 주세요. 아직 선택된 연구실의 수업을 안내할 수 없습니다.';
  return selected.map(l=>l.name+'\n담당 수업: '+((taughtCourses[l.professor]||[]).map(c=>c.name+' ('+c.code+')').join(', ')||'미확인')+'\n관련 학습 주제: '+(relatedCourses(l).map(c=>c.name).join(', ')||'미확인')).join('\n\n')+'\n담당 수업과 연구 이해를 위한 추천 학습 주제는 별개입니다. 개설 학기, 학부/대학원, 추천 주제의 강의코드는 미확인입니다.';
 }
 if(/정리|요약|계획|다음/.test(question)){
  const labels=studyGroups.flatMap(g=>g.items).filter(i=>context.rag.studyIds.includes(i.id)).map(i=>i.label);
  return '저장된 탐색 기록을 바탕으로 안내합니다.\n관심: '+(context.interest||'미입력')+'\n후보: '+(selected.map(l=>l.name).join(', ')||'미선택')+'\n체험 주제: '+(topic?.title||'미선택')+'\n실행한 단계: '+(context.rag.executed.map(id=>ragScenes[id].label).join(', ')||'없음')+'\n선택한 공부: '+(labels.join(', ')||'미선택')+'\n4주 계획: '+(context.rag.planSaved?'담음':'담지 않음')+'\n다음 행동: '+(context.reflection.next||'미선택')+'\n공부를 아직 고르지 않았다면 비교표의 학습 주제를 살펴보고 직접 정할 수 있습니다. 개인 의견이나 선택은 대신 작성하지 않습니다.';
 }
 if(/체험|실험|질문/.test(question))return '현재 체험은 SecAI Lab에 연결된 RAG 오염 공격과 방어 교육용 예시입니다. 정상 → 공격 → 방어를 각각 실행하고, 같은 질문의 답변과 문서가 어떻게 달라지는지 확인할 수 있습니다. 아직 실행하지 않은 단계를 완료로 보지 않습니다.';
 return '이 도우미는 저장된 연구실 정보와 선택 기록만 안내합니다. 공식 홈페이지와 논문 링크에서 최신 내용을 직접 확인해 주세요.';
}
