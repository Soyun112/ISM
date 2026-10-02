export const brand = '연구실 탐색 지도';
export const steps = [
 {title:'관심 연구실 찾기',description:'관심에서 출발해, 더 알아볼 연구실 후보를 골라 보세요.',button:'연구실 후보 찾기',next:'선택한 연구실 알아보기'},
 {title:'연구실 비교와 수업 탐색',description:'선택한 후보가 풀려는 문제와 수업을 나란히 살펴보세요.',button:'정리하고 체험하기'},
 {title:'작은 연구 체험하기',description:'직접 바꾸고 비교하며 연구 질문을 경험해 보세요.',button:'실험 결과 저장',next:'내 탐색 정리하기'},
 {title:'내 탐색 정리하기',description:'체험에서 느낀 점과 다음 행동을 한곳에 정리해요.',button:'의견 저장'}
];
export const keywords = ['인공지능','길찾기','로봇','자연어','이미지','데이터','사람과 AI'];
export const experience = {id:'maze',title:'미로 길찾기 비교',question:'같은 목적지로 가는 경로를 찾을 때, 탐색 방법에 따라 살펴보는 칸의 수는 어떻게 달라질까?'};
export const questions = [
 ['이 연구실을 추천한 이유는?','관심 분야에 맞는 후보를 어떻게 좁혀?'],
 ['선택한 연구실은 어떤 차이가 있어?','교수님 수업과 관련 과목은 어떻게 달라?'],
 ['이 실험에서 무엇을 비교하면 돼?','체험 전에 적은 질문과 결과를 어떻게 보면 돼?'],
 ['저장한 내용으로 연구실을 더 비교하려면?','관련 수업과 다음에 볼 자료를 어떻게 이어볼까?','다음 준비 계획을 어떻게 정리하면 돼?']
];
export const prepFields = [
 ['focus','현재 더 관심이 가는 연구실 또는 연구 분야','비워 두면 선택한 연구실 이름을 가져옵니다.'],
 ['gap','처음 예상했던 내용과 실제 설명의 차이','짧게 적어도 괜찮아요.'],
 ['topic','체험할 주제','비워 두면 연결된 체험 이름을 가져옵니다.'],
 ['ask','체험을 통해 확인하고 싶은 질문','한 문장으로 적어도 충분해요.']
] as const;
export const opinionFields = [
 ['interesting','흥미로웠던 점'],
 ['differed','예상과 달랐던 점'],
 ['more','더 알아보고 싶은 분야나 연구실'],
 ['curious','아직 궁금한 점']
] as const;
export const nextActions = ['관련 과목 알아보기','입문 자료 읽기','작은 프로젝트 해보기','연구실에 물어볼 질문 정리하기','더 탐색하기'];
export const mapNodes = [
 {id:'interest',title:'관심 분야',step:0,edit:'관심 분야 수정'},
 {id:'labs',title:'선택한 연구실',step:0,edit:'선택한 연구실 수정'},
 {id:'study',title:'연구·수업 비교',step:1,edit:'연구·수업 비교 수정'},
 {id:'experiment',title:'체험 결과',step:2,edit:'체험 기록 수정'},
 {id:'opinion',title:'내 의견',step:3,edit:'의견 수정하기',anchor:'opinion'},
 {id:'next',title:'다음 행동',step:3,edit:'다음 행동 수정하기',anchor:'next-action'}
] as const;
export const copy = {
 selectionNote:'여기서의 선택은 더 알아볼 후보를 정하는 단계예요. 최종 지원 연구실을 결정하는 것은 아니에요.',
 selectionEmpty:'아직 선택한 연구실이 없습니다. 추천된 카드에서 더 알아볼 후보를 골라 주세요.',
 noLabs:'일치하는 연구실이 없습니다. ‘길찾기’, ‘자연어’, ‘이미지’처럼 관심을 조금 더 구체화해 보세요.',
 needSelection:'먼저 더 알아볼 연구실 후보를 선택해 주세요.',
 review:'앞 과정의 관심 또는 후보가 바뀌었습니다. 이전 기록은 보존되어 있으며 다시 확인해 주세요.',
 preparing:'선택한 연구실에서 바로 해볼 수 있는 체험은 준비 중입니다.',
 notFinal:'짧은 체험으로 적성이나 연구 능력을 판단하지 않습니다. 최종 연구실을 고르지 않아도 괜찮아요.',
 opinionGuide:'의견을 적고 저장하면 아래 탐색 결과에 반영돼요. 의견을 쓰기 전에도 오른쪽 탐색 도우미에게 물어볼 수 있어요.',
 prepGuide:'지금까지 고른 관심, 연구실, 수업을 모아서 보여 드려요.',
 blank:'미작성',
 chatHello:'안녕하세요! 관심 분야부터 준비 계획까지 함께 정리해요. 아래 예시 질문을 눌러 보세요.',
 chatDemo:'데모 응답 · 외부 검색 없음',
 chatFoot:'답변은 가상 데모 자료와 저장한 기록을 사용합니다. 선택이나 다음 행동은 대신 정하지 않아요.'
};
