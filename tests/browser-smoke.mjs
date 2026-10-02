// Optional: install Playwright separately, run the dev server, then run this file.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('textbox',{name:'어떤 분야가 궁금한가요?'}).fill('구형준');
 await page.getByRole('button',{name:'후보 찾기 →'}).click();
 await page.getByText('연구실 이해하기',{exact:true}).first().waitFor();
 await page.getByText('연구 방법',{exact:false}).first().waitFor();
 await page.getByRole('button',{name:'관심 후보 선택',exact:true}).first().click();
 await page.getByRole('button',{name:'선택한 연구실 알아보기 →'}).click();
 await page.getByText('ESW5042-41',{exact:false}).waitFor();
 await page.getByRole('button',{name:/이 연구실 고르기/}).click();
 await page.getByRole('button',{name:'이 연구실로 체험하기 →'}).click();
 await page.getByRole('button',{name:'가짜 문서 넣기',exact:true}).click();
 await page.getByText('30일',{exact:false}).first().waitFor();
 await page.getByRole('button',{name:'방어 필터 켜기',exact:true}).click();
 await page.getByText('14일',{exact:false}).first().waitFor();
 await page.getByLabel('관찰 기록').fill('가짜 문서가 들어가면 답변이 바뀌었다');
 await page.getByRole('button',{name:'저장하고 내 탐색 정리하기',exact:true}).click();
 await page.getByText('RAG 오염·방어 예시 체험',{exact:false}).first().waitFor();
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.equal(stored.version,2);
 assert.equal(stored.rag.stage,'defense');
 assert.equal(stored.rag.observation,'가짜 문서가 들어가면 답변이 바뀌었다');
 await page.getByRole('button',{name:'이전 화면'}).click();
 await page.getByRole('button',{name:'이전 화면'}).click();
 await page.getByRole('textbox',{name:'어떤 분야가 궁금한가요?'}).fill('자연어처리');
 const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('lab-map-v1')));
 assert.equal(changed.rag.observation,'가짜 문서가 들어가면 답변이 바뀌었다');
 assert.ok(changed.statuses.slice(1).every(status=>status==='재검토 필요'||status==='시작 전'));
 assert.deepEqual(errors,[]);
 console.log('PASS: catalog card, lecture sheet, lab confirmation, prepared RAG example');
}finally{await browser.close();}
