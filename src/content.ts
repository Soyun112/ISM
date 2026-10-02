export const brand = '연구실 탐색 지도';

// Keep the forward four-screen flow from main; only the catalog content changes.
export const steps = [
 {title:'관심 연구실 찾기',description:'관심 분야와 연결되는 실제 연구실·연구 항목을 찾아보세요.',button:'후보 찾기',next:'선택한 연구실 알아보기'},
 {title:'연구와 수업 알아보기',description:'연구 질문, 방법, 최근 논문과 학습 주제를 비교한 뒤 체험할 연구실을 하나 골라 주세요.',button:'이 연구실로 체험하기',next:'작은 연구 체험하기'},
 {title:'작은 연구 체험하기',description:'미리 구성한 예시로, 잘못된 자료가 섞이면 답변이 어떻게 달라지는지 확인해 보세요.',button:'저장하고 내 탐색 정리하기',next:'내 탐색 정리하기'},
 {title:'내 탐색 정리하기',description:'알게 된 점과 다음 행동을 한곳에 정리해 보세요.',button:'의견 저장'}
];

export const keywords = ['보안','소프트웨어공학','AI 보안','프로그램 분석','운영체제','자연어처리','컴퓨터비전','데이터'];
export const questions = [
 ['이 연구실을 추천한 이유는?','관심 분야에 맞는 후보를 어떻게 좁혀?'],
 ['선택한 연구실은 어떤 차이가 있어?','최근 논문과 학습 주제를 알려줘.'],
 ['연구 체험은 언제 볼 수 있어?','체험 전에 어떤 질문을 적으면 좋을까?'],
 ['저장한 내용으로 연구실을 더 비교하려면?','다음 준비 계획을 어떻게 정리하면 돼?']
];

export const prepFields = [
 ['focus','현재 더 관심이 가는 연구실 또는 연구 분야','비워 두면 선택한 연구실 이름을 가져옵니다.'],
 ['gap','처음 예상했던 내용과 실제 설명의 차이','짧게 적어도 괜찮아요.'],
 ['topic','더 탐색하고 싶은 연구 주제','관심 논문이나 연구 질문을 적어 보세요.'],
 ['ask','추가 자료로 확인하고 싶은 질문','한 문장으로 적어도 충분해요.']
] as const;
export const opinionFields = [
 ['interesting','흥미로웠던 점'],
 ['differed','예상과 달랐던 점'],
 ['more','더 알아보고 싶은 분야나 연구실'],
 ['curious','아직 궁금한 점']
] as const;
export const nextActions = ['공식 홈페이지 읽기','대표 논문 읽기','학습 주제 공부하기','연구실에 물어볼 질문 정리하기','더 탐색하기'];
export const mapNodes = [
 {id:'interest',title:'관심 분야',step:0,edit:'관심 분야 수정'},
 {id:'labs',title:'선택한 연구실',step:0,edit:'선택한 연구실 수정'},
 {id:'study',title:'연구·수업 비교',step:1,edit:'연구·수업 비교 수정'},
 {id:'experiment',title:'연구 체험',step:2,edit:'체험 단계 보기'},
 {id:'opinion',title:'내 의견',step:3,edit:'의견 수정하기',anchor:'opinion'},
 {id:'next',title:'다음 행동',step:3,edit:'다음 행동 수정하기',anchor:'next-action'}
] as const;
export const copy = {
 selectionNote:'여기서의 선택은 더 알아볼 후보를 정하는 단계예요. 최종 지원 연구실을 결정하는 것은 아니에요.',
 selectionEmpty:'아직 선택한 연구실이 없습니다. 추천된 카드에서 더 알아볼 후보를 골라 주세요.',
 noLabs:'일치하는 항목이 없습니다. ‘보안’, ‘프로그램 분석’, ‘자연어처리’처럼 관심을 조금 더 구체화해 보세요.',
 needSelection:'먼저 더 알아볼 연구실 후보를 선택해 주세요.',
 review:'앞 과정의 관심 또는 후보가 바뀌었습니다. 이전 기록은 보존되어 있으며 다시 확인해 주세요.',
 preparing:'선택한 연구실의 실제 연구와 연결되는 체험은 준비 중입니다.',
 notFinal:'이 탐색만으로 적성이나 연구 능력을 판단하지 않습니다. 최종 연구실을 고르지 않아도 괜찮아요.',
 opinionGuide:'의견을 적고 저장하면 아래 탐색 결과에 반영돼요. 의견을 쓰기 전에도 오른쪽 탐색 도우미에게 물어볼 수 있어요.',
 prepGuide:'지금까지 고른 관심과 연구실, 공식 자료를 바탕으로 다음 질문을 정리해 보세요.',
 chooseLab:'비교한 후보 중에서 체험할 연구실을 하나만 고르세요.',
 confirmLab:'이 연구실로 다음 화면에서 간단한 체험을 합니다. 고른 연구실이 맞는지 확인한 뒤 넘어가세요.',
 blank:'미작성',
 chatHello:'안녕하세요! 관심 분야부터 준비 계획까지 함께 정리해요. 아래 예시 질문을 눌러 보세요.',
 chatDemo:'Gemini 답변 · 키는 서버에만 보관',
 chatFoot:'답변은 저장된 탐색 기록과 연구실 정보를 바탕으로 Gemini가 작성합니다. 연구실 선택과 다음 행동은 대신 정하지 않아요.'
};
