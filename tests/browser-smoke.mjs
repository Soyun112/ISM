// Optional: install Playwright separately, run the dev server, then run this file.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'+ 보안',exact:true}).click();
 await page.getByRole('button',{name:'후보 찾기 →'}).click();
 assert.ok(await page.getByText('관심과 연결되는 항목 8개',{exact:false}).count());
 await page.getByRole('button',{name:'관심 후보 선택',exact:true}).first().click();
 await page.getByRole('button',{name:'관심 후보 선택',exact:true}).first().click();
 await page.getByRole('button',{name:'선택한 연구실 알아보기 →'}).click();
 await page.getByText('살펴볼 연구 질문',{exact:true}).first().waitFor();
 await page.getByText('최근 공개 논문',{exact:false}).first().waitFor();
 await page.getByLabel('추가 자료로 확인하고 싶은 질문').fill('최근 논문의 방법을 더 알아보고 싶다');
 await page.getByRole('button',{name:'체험 전 정리 저장 →'}).click();
 await page.getByRole('button',{name:'분야 열기',exact:true}).click();
 for (let i=0;i<7;i++) {
  await page.getByText('연구실이 보는 것',{exact:true}).waitFor();
  await page.getByRole('button',{name:/다음 분야|관심 분야 정하기/}).click();
 }
 await page.getByRole('button',{name:'AI 보안',exact:true}).click();
 await page.getByLabel('이 분야가 더 궁금한 이유').fill('검색된 문서를 어떻게 고르는지 궁금하다');
 await page.getByLabel('랩미팅에서 물어볼 질문').fill('정상 문서를 살리는 기준은 누가 정하나요?');
 await page.getByRole('button',{name:'체험해보기',exact:true}).click();
 await page.getByText('선배가 말합니다.',{exact:false}).waitFor();
 assert.equal(await page.getByText('0.89').count(),0);
 await page.getByRole('button',{name:'시작하기',exact:true}).click();
 await page.locator('article.rag-doc').filter({hasText:'도서관 공지'}).getByRole('button',{name:'근거로 쓴다',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByLabel('내 걸러내기 기준').fill('날짜가 있는 안내와 어긋나면 바로 버리지 않고 보류한다');
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('button',{name:'저장하고 돌아가기',exact:true}).click();
 await page.getByText('더 알고 싶은 분야를 하나 고르세요',{exact:false}).waitFor();
 await page.getByRole('button',{name:'둘러보기 저장',exact:true}).click();
 await page.getByRole('button',{name:'내 탐색 정리하기 →'}).click();
 await page.getByLabel('흥미로웠던 점').fill('보안 연구 질문이 흥미로웠다');
 await page.getByRole('button',{name:'공식 홈페이지 읽기',exact:true}).click();
 await page.getByRole('button',{name:'의견 저장',exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Markdown 다운로드 ↓'}).click();
 assert.match((await download).suggestedFilename(),/\.md$/);
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.equal(stored.version,2);
 assert.equal(stored.selected.length,2);
 assert.equal(stored.reflection.interesting,'보안 연구 질문이 흥미로웠다');
 assert.equal(stored.reflection.next,'공식 홈페이지 읽기');
 assert.equal(stored.prep.ask,'최근 논문의 방법을 더 알아보고 싶다');
 await page.getByRole('button',{name:'이전 화면'}).click();
 await page.getByRole('button',{name:'이전 화면'}).click();
 await page.getByRole('button',{name:'이전 화면'}).click();
 await page.getByRole('textbox',{name:'어떤 분야가 궁금한가요?'}).fill('자연어처리');
 const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.deepEqual(changed.statuses.slice(1),['재검토 필요','재검토 필요','재검토 필요']);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: CSV discovery, researched details, prep, opinion, persistence, download, review states, mobile width');
}finally{await browser.close();}
