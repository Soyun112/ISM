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
 assert.ok(await page.getByText('관심과 연결되는 항목',{exact:false}).count());
 await page.getByRole('button',{name:'관심 후보 선택',exact:true}).first().click();
 await page.getByRole('button',{name:'관심 후보 선택',exact:true}).first().click();
 await page.getByRole('button',{name:'선택한 항목 비교하기 →'}).click();
 await page.getByText('살펴볼 연구 질문',{exact:true}).first().waitFor();
 await page.getByText('최근 공개 논문',{exact:false}).first().waitFor();
 await page.getByRole('button',{name:'최근 논문과 학습 주제를 알려줘. ↗'}).click();
 await page.getByText('학습 주제:',{exact:false}).waitFor();
 await page.getByRole('button',{name:'비교 내용 확인 완료 →'}).click();
 await page.getByText('연구실별 체험은 준비 중입니다',{exact:true}).waitFor();
 await page.getByRole('button',{name:'체험 없이 준비 정리하기 →'}).click();
 await page.getByRole('button',{name:'공식 홈페이지 읽기',exact:true}).click();
 await page.getByRole('button',{name:'준비 기록 저장',exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Markdown 다운로드 ↓'}).click();
 assert.match((await download).suggestedFilename(),/\.md$/);
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.equal(stored.selected.length,2);
 assert.equal(stored.statuses[3],'완료');
 assert.equal(stored.messages.length,2);
 await page.getByRole('button',{name:'더 탐색하기 →',exact:true}).click();
 await page.getByRole('textbox',{name:'어떤 분야가 궁금한가요?'}).fill('자연어처리');
 const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.deepEqual(changed.statuses.slice(1),['재검토 필요','재검토 필요','재검토 필요']);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'도우미 닫기'}).click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: CSV discovery, researched details, persistence, chat, download, review states, mobile width');
}finally{await browser.close();}
