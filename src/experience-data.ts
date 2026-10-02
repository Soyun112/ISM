import type {Lab} from './data.ts';

// Only publish topics with a working implementation and an explicit lab connection.
export const ragTopic = {
 id:'rag-poison-defense',title:'RAG 오염 공격과 방어',
 summary:'가짜 문서가 AI 답변을 바꾸는 과정과 필터 적용 결과를 살펴봅니다.',
 duration:'약 5분',format:'사전 구성된 교육용 예시',implementation:'rag' as const
};
export type ExperienceSelection={labId:string;topicId:string};
export const ragLabId='구형준:인공지능을활용한보안연구실 SecAI';
export function topicForLab(lab:Lab|undefined){
 return lab?.id===ragLabId?ragTopic:undefined;
}
export function shortLabName(lab:Lab){return lab.name.match(/[A-Za-z][A-Za-z0-9& -]*$/)?.[0].trim()||lab.name;}
