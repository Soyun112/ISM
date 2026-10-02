import {catalogRows} from './catalog.ts';

export type Paper = {title:string;year:number;venue:string;description:string;url:string};
export type LabDetail = {
 overview:string;questions:string[];methods:string[];learningTopics:string[];
 researchUrl:string;publicationUrl:string;papers:Paper[];note?:string;
};
export type Lab = {
 id:string;name:string;professor:string;department:string;category:string;type:string;
 researchFields:string[];tags:string[];website:string;officialSources:string[];
 undergraduateRecruitment:string;note:string;detail?:LabDetail;
};

// The CSV is the source for every catalog entry. These researched notes enrich only eight entries.
const details:Record<string,LabDetail>={
 '구형준':{
  overview:'프로그램과 AI 시스템에 숨어 있는 보안 위험을 찾고, 분석 도구와 방어 방법을 연구합니다. 최근 공개 논문에는 바이너리 분석 모델의 견고성과 RAG 시스템 방어가 포함됩니다.',
  questions:['소스코드가 없는 프로그램에서도 취약한 동작을 파악할 수 있을까?','AI가 참고하는 문서에 악의적인 내용이 섞였을 때 답변을 보호할 수 있을까?'],
  methods:['바이너리·프로그램 분석','공격 사례 데이터 분석','AI 보안 평가'],
  learningTopics:['프로그래밍과 운영체제','컴퓨터 보안','기계학습 모델 평가'],
  researchUrl:'https://secai.skku.edu/research/',publicationUrl:'https://secai.skku.edu/publications/',
  papers:[
   {title:'Fool Me If You Can: On the Robustness of Binary Code Similarity Detection Models against Semantics-preserving Transformations',year:2026,venue:'FSE 2026',description:'기능을 유지하는 코드 변형이 바이너리 유사도 모델의 판단에 미치는 영향을 평가합니다.',url:'https://secai.skku.edu/publications/'},
   {title:'Rescuing the Unpoisoned: Efficient Defense against Knowledge Corruption Attacks on RAG Systems',year:2025,venue:'ACSAC 2025',description:'RAG 시스템에 섞인 악의적인 문서를 걸러 답변 오염을 줄이는 방법을 제안합니다.',url:'https://secai.skku.edu/publications/'}
  ]
 },
 '김형식':{
  overview:'보안 기술이 실제 사용자와 시스템에서 안전하게 작동하도록 인증, 사용성 보안, 모바일·웹 보안을 연구합니다. 최근 논문은 악성코드 탐지와 가상현실 인증도 다룹니다.',
  questions:['사용자가 편하게 쓰면서도 안전한 인증 방법은 무엇일까?','악성코드 탐지 도구가 회피 공격에도 견딜 수 있을까?'],
  methods:['사용자·시스템 보안 평가','취약점 분석','탐지 모델 실험'],
  learningTopics:['인증과 암호 기초','사용자 연구','웹·모바일 보안'],
  researchUrl:'https://seclab.skku.edu/',publicationUrl:'https://seclab.skku.edu/publications/',
  papers:[
   {title:'When Does Wasm Malware Detection Fail? A Systematic Analysis of Their Robustness to Evasion',year:2025,venue:'ASE 2025',description:'WebAssembly 악성코드 탐지기가 회피 기법을 만났을 때 실패하는 조건을 분석합니다.',url:'https://seclab.skku.edu/publications/'},
   {title:'When (Inter)actions Speak Louder Than (Pass)words: Task-Based Evaluation of Implicit Authentication in Virtual Reality',year:2025,venue:'RAID 2025',description:'가상현실에서 행동을 이용한 암묵적 인증을 과제 수행 상황에서 평가합니다.',url:'https://seclab.skku.edu/publications/'}
  ]
 },
 '우사이먼성일':{
  overview:'데이터와 AI를 사용해 보안·프라이버시 문제를 살핍니다. 최근 연구에서는 딥페이크 탐지의 실제 환경 견고성과 모델에서 민감한 정보를 잊게 하는 방법을 다룹니다.',
  questions:['화면을 다시 촬영한 딥페이크도 안정적으로 탐지할 수 있을까?','AI 모델에서 특정 정보를 지우면서 성능을 유지할 수 있을까?'],
  methods:['머신러닝 모델 실험','딥페이크 데이터셋 평가','머신 언러닝'],
  learningTopics:['기계학습과 컴퓨터비전','데이터셋 평가','프라이버시 기초'],
  researchUrl:'https://dash-lab.github.io/',publicationUrl:'https://dash-lab.github.io/Publication',
  papers:[
   {title:'Through the Lens: Benchmarking Deepfake Detectors Against Moiré-Induced Distortions',year:2025,venue:'NeurIPS 2025',description:'화면을 스마트폰으로 촬영할 때 생기는 무아레 현상이 딥페이크 탐지에 주는 영향을 비교합니다.',url:'https://dash-lab.github.io/Publication'},
   {title:'RUAGO: Effective and Practical Retain-Free Unlearning via Adversarial Attack and OOD Generator',year:2025,venue:'NeurIPS 2025',description:'기존 학습 데이터를 다시 쓰지 않고 모델에서 지정 정보를 제거하는 방법을 연구합니다.',url:'https://dash-lab.github.io/Publication'}
  ]
 },
 '이호준':{
  overview:'운영체제, 하드웨어, 클라우드에서 기존 방어의 약점을 찾고 새로운 보호 방식을 설계합니다. 최근 공개 연구는 메모리 기밀성과 가상화 환경의 시스템 보호를 다룹니다.',
  questions:['프로그램의 메모리 접근 흔적을 공격자로부터 감출 수 있을까?','가상화된 시스템 전체를 어떻게 보호할 수 있을까?'],
  methods:['시스템 설계·구현','운영체제·메모리 보안 실험','하드웨어 지원 보안'],
  learningTopics:['운영체제와 컴퓨터구조','시스템 프로그래밍','가상화·클라우드 기초'],
  researchUrl:'https://sslab.skku.edu/',publicationUrl:'https://sslab.skku.edu/',
  papers:[
   {title:'uMMU: Securing Data Confidentiality with Unobservable Memory Subsystem',year:2025,venue:'IEEE S&P 2025',description:'메모리 하위 시스템에서 드러나는 정보를 줄여 데이터 기밀성을 보호합니다.',url:'https://sslab.skku.edu/'},
   {title:'IncognitOS: A Practical Unikernel Design for Full-System Obfuscation in Confidential Virtual Machines',year:2025,venue:'ACSAC 2025',description:'기밀 가상 머신에서 시스템 동작의 노출을 줄이는 유니커널 설계를 제안합니다.',url:'https://sslab.skku.edu/'}
  ]
 },
 '최형기':{
  overview:'CSV와 공개 연구실 자료에는 네트워크 보안과 디지털 포렌식이 연구 분야로 소개됩니다. 공개된 교수 논문 목록에서는 최근 연구를 확인하기 어려워, 아래에 확인 가능한 기존 연구 사례만 표시합니다.',
  questions:['이동통신과 네트워크 인증 과정에서 어떤 공격이 가능한가?','연결된 기기의 권한과 통신을 어떻게 안전하게 설계할 수 있을까?'],
  methods:['네트워크 프로토콜 분석','인증·권한 모델 연구'],
  learningTopics:['컴퓨터 네트워크','암호와 인증','디지털 포렌식 기초'],
  researchUrl:'https://hit.skku.edu/',publicationUrl:'https://hit.skku.edu/~hkchoi/pubs.html',
  note:'공개 교수 논문 목록에서 확인한 가장 최근 항목은 2018년입니다. 현재 연구와 최근 논문은 재확인이 필요합니다.',
  papers:[
   {title:'Your Watch Can Watch You! Gear Up For The Broken Privilege Pitfalls In The Samsung Gear Smartwatch',year:2018,venue:'DEF CON 26',description:'스마트워치의 권한 설계가 보안에 미치는 문제를 다룬 공개 발표입니다. 최근 연구로 분류하지 않습니다.',url:'https://hit.skku.edu/~hkchoi/pubs.html'}
  ]
 },
 '황성재':{
  overview:'소프트웨어와 AI 시스템의 보안 취약점을 자동으로 찾고 안전한 개발 방법을 연구합니다. 연구실은 Android, 블록체인, 자동차, 클라우드와 AI 안전성을 연구 대상으로 소개합니다.',
  questions:['복잡한 시스템의 설정·코드 오류를 자동으로 발견할 수 있을까?','AI를 이용해 테스트를 생성하거나 보안 문제를 분석할 수 있을까?'],
  methods:['프로그램 분석과 퍼징','실증 보안 연구','AI 기반 취약점 탐지'],
  learningTopics:['소프트웨어 테스팅','프로그램 분석','시스템·블록체인 보안'],
  researchUrl:'https://softsec.skku.edu/',publicationUrl:'https://softsec.skku.edu/publications/',
  papers:[
   {title:'SpecTrum: Specification-Guided Differential Fuzzing for Ethereum Consensus Clients',year:2026,venue:'ASE 2026',description:'이더리움 합의 클라이언트 구현을 명세와 비교하며 차이를 찾는 자동 테스트를 연구합니다.',url:'https://softsec.skku.edu/publications/'},
   {title:'An Empirical Study and Benchmark of Kubernetes Misconfiguration Scanners',year:2026,venue:'ISSTA 2026',description:'Kubernetes 설정 오류 탐지 도구를 벤치마크로 비교 평가합니다.',url:'https://softsec.skku.edu/publications/'}
  ]
 },
 '이은석':{
  overview:'소프트웨어 오류를 찾고 고치는 과정을 자동화하는 소프트웨어공학 연구를 진행합니다. 대학 공식 연구자 목록에는 자동 프로그램 수정, 버그 보고서 분석, 테스트와 프로그래밍 과제 피드백 연구가 공개되어 있습니다.',
  questions:['오류 보고서만으로 문제가 생긴 코드 위치를 찾을 수 있을까?','프로그래밍 과제에 유용한 피드백을 자동으로 제공할 수 있을까?'],
  methods:['버그 위치 추적과 자동 수정','소프트웨어 테스트','정보검색·학습 기반 분류'],
  learningTopics:['소프트웨어공학','테스팅과 디버깅','정보검색·기계학습 기초'],
  researchUrl:'https://scholarx.skku.edu/researcher/6207b386-061b-4f68-8717-239943534bef/item',
  publicationUrl:'https://scholarx.skku.edu/researcher/6207b386-061b-4f68-8717-239943534bef/item',
  note:'CSV에 연구실 홈페이지가 없어 성균관대학교 공식 연구자 페이지를 근거로 사용했습니다.',
  papers:[
   {title:'Automated Feedback Generation for Programming Assignments Through Diversification',year:2025,venue:'CSEE&T 2025',description:'프로그래밍 과제에 대해 다양한 자동 피드백을 생성하는 방법을 연구합니다.',url:'https://pure.skku.edu/en/persons/eunseok-lee/'},
   {title:'Amur: Fixing Multi-Resource Leaks Guided by Resource Flow Analysis',year:2025,venue:'ASE 2025',description:'프로그램의 자원 흐름을 분석해 여러 자원 누수를 자동으로 수정하는 방법을 연구합니다.',url:'https://scholarx.skku.edu/researcher/6207b386-061b-4f68-8717-239943534bef/item'}
  ]
 },
 '차수영':{
  overview:'프로그램을 자동으로 분석하고 테스트해 소프트웨어 오류를 찾는 방법을 연구합니다. 최근 논문에는 기호 실행의 탐색 전략과 퍼징 입력 선택을 개선하는 연구가 있습니다.',
  questions:['수많은 실행 경로 중 오류를 찾기 좋은 경로를 어떻게 고를까?','테스트 입력을 더 효율적으로 만들어 코드의 더 많은 부분을 확인할 수 있을까?'],
  methods:['기호 실행','자동 테스트·퍼징','데이터 기반 탐색 전략'],
  learningTopics:['프로그래밍 언어와 자료구조','소프트웨어 테스팅','프로그램 분석'],
  researchUrl:'https://sal.skku.edu/',publicationUrl:'https://sal.skku.edu/publications',
  papers:[
   {title:'Enhancing Symbolic Execution with Self-Configuring Parameters',year:2026,venue:'ICSE 2026',description:'기호 실행 도구의 설정값을 자동 조정해 프로그램 경로 탐색을 개선합니다.',url:'https://sal.skku.edu/publications'},
   {title:'TopSeed: Learning Seed Selection Strategies for Symbolic Execution from Scratch',year:2025,venue:'ICSE 2025',description:'기호 실행에서 출발 입력을 고르는 전략을 학습해 테스트 효율을 높입니다.',url:'https://sal.skku.edu/publications'}
  ]
 }
};
const split=(value:string)=>value.split(';').map(v=>v.trim()).filter(Boolean);
const createTags=(category:string,fields:string[])=>[...new Set(
 [category,...fields].flatMap(value=>[value,...value.split(/[·\s/]+/)]).map(v=>v.trim()).filter(v=>v.length>=2)
)];
export const labs:Lab[]=catalogRows.map(([department,category,professor,name,type,research,website,sources,recruitment,note])=>{
 const researchFields=split(research);
 return {
  id:`${professor}:${name}`,name,professor,department,category:category||'미분류',type,researchFields,
  tags:createTags(category,researchFields),website,officialSources:split(sources),
  undergraduateRecruitment:recruitment||'미확인',note,
  detail:type==='연구실'&&category==='보안·소프트웨어공학'?details[professor]:undefined
 };
});
export const dataCheckedAt='2026-10-03';
