import test from 'node:test';
import assert from 'node:assert/strict';
import {areas} from '../src/areas.ts';
import {decode,fresh,invalidate} from '../src/store.ts';
import {recommend} from '../src/recommend.ts';
import {generateReply} from '../src/chat.ts';
import {emptyRag, normalizeRag, ragMarkdown} from '../src/rag.ts';
test('lab tour lists each documented field with a question',()=>{
 assert.equal(areas.length,7);
 assert.deepEqual(areas.map(a=>a.name),['AI 보안','프로그램 분석','이상 탐지','시스템 보안','소프트웨어 테스팅','사용자 인증','네트워크 보안']);
 assert.ok(areas.every(a=>a.about&&a.scene&&a.question));
 assert.equal(new Set(areas.map(a=>a.id)).size,areas.length);
});
test('invalid or old storage is safely replaced',()=>{for(const raw of ['broken','null','{}',JSON.stringify({...fresh(),version:4}),JSON.stringify({...fresh(),messages:[null]}),JSON.stringify({...fresh(),experiments:[{}]}),JSON.stringify({...fresh(),step:9})])assert.deepEqual(decode(raw),fresh());});
test('saved records survive restoration and upstream changes',()=>{
 const s=fresh();s.interest='보안';s.selected=['secai'];s.reasons.secai='분야가 궁금해서';s.statuses=['완료','완료','완료','완료'];s.experiments=[{id:'test',date:'2026-10-03',labIds:['secai'],note:'이상 탐지는 달라진 칸을 적는 일이었다',ask:'평소 기록은 어디까지 모으나요',focus:'anomaly',visits:areas.map(a=>({areaId:a.id,curious:a.id==='anomaly'}))}];s.messages=[{role:'user',text:'요약'}];s.reflection.next='더 탐색하기';
 const restored=decode(JSON.stringify(s));assert.deepEqual(restored,s);const changed=invalidate(restored,0);assert.deepEqual(changed.statuses,['완료','재검토 필요','재검토 필요','재검토 필요']);assert.deepEqual(changed.experiments,s.experiments);assert.deepEqual(changed.messages,s.messages);
});
test('recommendation evidence matches tags and unsupported input has empty result',()=>{const r=recommend('보안 인공지능');assert.equal(r[0].lab.professor,'구형준');assert.ok(r.length>0);assert.ok(r.every(x=>x.matches.every(t=>x.lab.tags.includes(t)&&'보안 인공지능'.includes(t))));assert.deepEqual(recommend('해양 생태학'),[]);});
test('demo chat uses context without mutating saved records',async()=>{const s=fresh();s.interest='보안';s.selected=['secai','robot'];const original=JSON.stringify(s);assert.match(await generateReply('선택한 연구실은 어떤 차이가 있어?',s),/SecAI/);assert.match(await generateReply('연구실 분야는 어떻게 둘러봐?',s),/AI 보안/);assert.match(await generateReply('내 탐색 내용을 정리해줘.',s),/보안/);assert.match(await generateReply('오늘 날씨?',s),/지원하지/);assert.equal(JSON.stringify(s),original);});
test('rag review note stays out of markdown until saved',()=>{
 const empty=emptyRag();
 assert.equal(ragMarkdown(empty),'');
 assert.deepEqual(normalizeRag('broken'),empty);
 const draft=emptyRag();
 draft.marks['1'].choice='use';
 draft.marks['4'].choice='hold';
 draft.marks['4'].reasons=['같은 말을 거의 그대로 반복함','없는 칩'];
 draft.marks['6'].choice='hold';
 draft.keep='6'; draft.rule='날짜가 있으면 바로 버리지 않는다'; draft.more=['방어 방식']; draft.ask='정상 문서는 누가 살피나요'; draft.committed=true;
 const saved=normalizeRag(JSON.stringify(draft));
 assert.deepEqual(saved.marks['4'].reasons,['같은 말을 거의 그대로 반복함']);
 const markdown=ragMarkdown(saved);
 assert.match(markdown,/근거로 쓴 문서: 1장 \/ 보류: 2장/);
 assert.match(markdown,/문서 6 \(보류됨\)/);
 assert.match(markdown,/방어 방식/);
 assert.doesNotMatch(markdown,/없는 칩/);
 assert.doesNotMatch(markdown,/0\.89/);
});
