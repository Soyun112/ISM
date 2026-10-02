import type {State} from './store.ts';
import {labs} from './data.ts';
import {recommend} from './recommend.ts';
import {ragScenes} from './rag-demo.ts';
import {ragTopic} from './experience-data.ts';
import {allResources,directions,sourceBasis} from './planning.ts';
import {opinionFields} from './content.ts';

export function weekMarkdown(s:State){
 const selected=labs.filter(l=>s.selected.includes(l.id));
 const matches=recommend(s.interest);
 const lines=['# 내 탐색과 다음 일주일','',`입력한 관심: ${s.interest||'미입력'}`,'','## 두 연구실과 관심의 연결'];
 for(const lab of selected){lines.push(`### ${lab.name} (${lab.professor})`,`관심 연결 근거: ${matches.find(x=>x.lab.id===lab.id)?.matches.join(', ')||'현재 관심과 일치하는 키워드 없음'}`,`개인적인 선택 이유: ${s.reasons[lab.id]||'아직 남긴 이유가 없어요'}`,`연구 문제: ${lab.detail?.questions.join(' / ')||'미확인'}`,`연구 방법: ${lab.detail?.methods.join(', ')||lab.researchFields.join(', ')}`,`공식 자료: ${lab.website||lab.officialSources.join(', ')||'미확인'}`,'');}
 lines.push('## 저장한 관련 수업·학습 주제',...s.courseIds.map(id=>{const r=allResources.find(r=>r.id===id||r.code===id);return `- ${r?.title||id} / 강의코드 ${r?.code||'미확인'}`;}),s.courseIds.length?'':'저장한 항목 없음','','## 선택한 연구 체험',`주제: ${s.experienceSelection?.topicId===ragTopic.id?ragTopic.title:'미선택'}`,`연결 연구실: ${labs.find(l=>l.id===s.experienceSelection?.labId)?.name||'미선택'} (최종 연구실 확정을 뜻하지 않음)`,`실제로 실행한 단계: ${s.rag.executed.map(id=>ragScenes[id].label).join(', ')||'없음'}`,`관찰 메모: ${s.rag.observation||'아직 남긴 의견이 없어요'}`,'','## 내 의견',...opinionFields.map(([id,label])=>`- ${label}: ${s.reflection[id]||'미작성'}`),'','## 다음 탐색 방향',directions.find(d=>d.id===s.week.input.direction)?.title||'아직 선택하지 않았어요',`확인하고 싶은 질문: ${s.week.input.question||'미작성'}`,`입력한 시작 날짜: ${s.week.input.startDate}`,`가능한 날짜: ${s.week.input.availableDates.join(', ')||'미선택'}`,`하루 가능한 시간: ${s.week.input.minutes}분`,`익숙한 정도: ${{new:'처음 접함',concepts:'개념은 알고 있음',code:'코드로 해본 적 있음'}[s.week.input.familiarity]}`,'','## 추천 계획');
 const plan=s.week.plan;
 if(!plan)lines.push('아직 계획을 만들지 않았어요. 탐색 결과만 저장했습니다.');
 else{
  lines.push(`계획 기준 방향: ${directions.find(d=>d.id===plan.input.direction)?.title}`,`계획 기준 관심: ${plan.basis.interest}`,`계획 기준 연구실: ${plan.basis.labIds.map(id=>labs.find(l=>l.id===id)?.name||id).join(', ')}`);
  if(plan.basis.signature!==sourceBasis(s).signature)lines.push('주의: 현재 탐색 기록과 다른 이전 선택을 기준으로 만든 계획입니다.');
  for(const a of plan.activities){lines.push('',`### ${a.done?'[완료]':'[미완료]'} ${a.date} · ${a.title} (${a.minutes}분)`,`활동 ID: ${a.id}`,`추천 이유: ${a.reason}`,`할 일: ${a.task}`,`완료 기준: ${a.completion}`,`생각할 질문: ${a.question}`,`한 줄 메모: ${a.note||'미작성'}`);for(const id of a.resourceIds){const r=allResources.find(r=>r.id===id);if(r)lines.push(`- 자료: ${r.title}${r.code?` / ${r.code}`:''}${r.url?` — ${r.url}`:''}`);}}
 }
 lines.push('','추천 계획은 직접 수정할 수 있습니다. RAG 체험은 사전 구성된 교육용 예시입니다.');
 return lines.join('\n');
}
