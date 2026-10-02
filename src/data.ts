export type Lab = {id:string;name:string;professor:string;tags:string[];summary:string;problem:string;methods:string;project:string;experience?:string};
export const labs:Lab[] = [
 {id:'secai',name:'SecAI Lab',professor:'구형준',tags:['보안','정보보안','인공지능','AI','소프트웨어 보안','시스템 보안'],summary:'소프트웨어 보안, 시스템 보안, AI를 활용한 보안을 함께 봅니다. 일곱 분야 둘러보기가 연결되어 있습니다.',problem:'AI를 보안에 쓰는 일과 소프트웨어·시스템 보안을 어디서부터 보면 될까요?',methods:'분야마다 보는 대상과 질문을 나누어 살펴보기',project:'AI 보안, 프로그램 분석, 이상 탐지, 시스템 보안, 소프트웨어 테스팅, 사용자 인증, 네트워크 보안을 순서대로 여는 둘러보기',experience:'resources'},
 {id:'robot',name:'로봇 계획 연구실',professor:'가상 교수 나래',tags:['로봇','길찾기','인공지능','계획'],summary:'로봇이 주변 상황을 보고 안전하게 움직이도록 연구해요.',problem:'장애물이 있는 환경에서 로봇은 어떻게 이동할까요?',methods:'경로 계획, 센서 모델링, 시뮬레이션',project:'단순 격자 환경의 이동 계획 프로젝트'},
 {id:'language',name:'언어와 지식 연구실',professor:'가상 교수 다온',tags:['자연어','언어','챗봇','인공지능','AI'],summary:'컴퓨터가 문장의 의미와 정보를 다루는 방법을 살펴봐요.',problem:'표현이 다른 문장에서 같은 의미를 어떻게 찾을까요?',methods:'언어 모델, 텍스트 분류, 평가',project:'짧은 문장의 주제 분류 프로젝트'},
 {id:'vision',name:'시각 이해 연구실',professor:'가상 교수 라온',tags:['이미지','비전','영상','인공지능','AI'],summary:'사진 속 물체와 장면을 컴퓨터가 이해하도록 연구해요.',problem:'빛과 각도가 달라도 물체를 알아볼 수 있을까요?',methods:'영상 처리, 특징 추출, 신경망',project:'이미지 조건에 따른 분류 오류 비교 프로젝트'},
 {id:'human',name:'사람과 데이터 연구실',professor:'가상 교수 마루',tags:['사람과 AI','데이터','사용자','인터랙션','인공지능'],summary:'사람이 AI의 결과를 이해하고 활용하는 과정을 연구해요.',problem:'AI의 설명이 사람의 판단에 어떤 영향을 줄까요?',methods:'사용자 연구, 인터뷰, 데이터 분석',project:'설명 방식에 따른 사용자 이해 비교 프로젝트'}
];
export type Course = {id:string;labId:string;kind:'taught'|'related';name:string;learning:string;connection:string;term:string};
export const courses:Course[] = labs.flatMap((lab,i)=>[
 {id:lab.id+'-taught',labId:lab.id,kind:'taught' as const,name:lab.id==='secai'?'담당 과목 미확인':['로봇공학 입문','언어 정보 처리','영상 처리 입문','사용자 연구 입문'][i-1],learning:lab.methods,connection:lab.id==='secai'?'관심 분야는 학과 교원 소개에서 확인했습니다. 이번 학기 담당 과목은 아직 연결하지 않았습니다.':'가상 담당 수업입니다. 실제 연구와의 직접 연결은 별도 확인이 필요합니다.',term:i%2===0?'현재 담당 여부 미확인':'과거 담당 · 가상 2025년 2학기 (현재 미확인)'},
 {id:lab.id+'-related',labId:lab.id,kind:'related' as const,name:lab.id==='secai'?'기계학습 기초':i===4?'통계와 실험 설계':'선형대수와 기계학습',learning:lab.id==='secai'?'보안, 인공지능, 데이터 표현의 기초':'데이터 표현, 모델 평가, 기초 분석',connection:lab.methods+'를 이해하는 기초를 배웁니다.',term:'개설 학기 미확인 · 담당 교수 미확인'}
]);
export const source = 'SecAI는 학과 교원 소개와 https://secai.skku.edu 기준, 나머지 후보는 시연용 가상 데이터 · 확인 날짜: 2026-10-03';
