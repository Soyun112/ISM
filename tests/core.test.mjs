import test from 'node:test';
import assert from 'node:assert/strict';
import {search,exampleWalls} from '../src/algorithms.ts';
import {decode,fresh,invalidate} from '../src/store.ts';
import {recommend} from '../src/recommend.ts';
import {generateReply} from '../src/chat.ts';
import {emptyRag,ragMarkdown} from '../src/rag.ts';
import {labs,taughtCourses} from '../src/data.ts';
test('BFS and A* return valid identical shortest lengths on varied maps',()=>{
 const maps=[[],exampleWalls,[1,10],Array.from({length:10},(_,i)=>40+i)];
 let seed=73;
 for(let trial=0;trial<60;trial++){const walls=[];for(let n=1;n<99;n++){seed=(seed*16807)%2147483647;if(seed%100<28)walls.push(n);}maps.push(walls);}
 for(const walls of maps){const bfs=search(walls,'BFS'),astar=search(walls,'A*');assert.equal(bfs.length,astar.length);for(const r of [bfs,astar]){assert.equal(new Set(r.visited).size,r.visited.length);assert.ok(r.visited.every(n=>!walls.includes(n)));if(r.length!==null){assert.equal(r.path[0],0);assert.equal(r.path.at(-1),99);assert.equal(r.length,r.path.length-1);for(let i=1;i<r.path.length;i++){const a=r.path[i-1],b=r.path[i];assert.equal(Math.abs(Math.floor(a/10)-Math.floor(b/10))+Math.abs(a%10-b%10),1);}}}}
 assert.equal(search([],'BFS').length,18);assert.equal(search([1,10],'A*').length,null);
});
test('invalid or old storage is safely replaced',()=>{for(const raw of ['broken','null','{}',JSON.stringify({...fresh(),version:0}),JSON.stringify({...fresh(),messages:[null]}),JSON.stringify({...fresh(),experiments:[{}]}),JSON.stringify({...fresh(),step:9})])assert.deepEqual(decode(raw),fresh());});
test('version 1 records migrate without dropping saved work',()=>{
 const legacy={version:1,step:2,interest:'길찾기',experienceInput:'자료구조',curiosity:'휴리스틱',recommended:true,selected:['search'],reasons:{search:'탐색'},courseIds:['search-related'],experiments:[],reflection:{interesting:'칸 수',next:'더 탐색하기'},messages:[{role:'assistant',text:'안내'}],statuses:['완료','완료','진행 중','시작 전']};
 const migrated=decode(JSON.stringify(legacy));
 assert.equal(migrated.version,2);assert.equal(migrated.interest,'길찾기');assert.equal(migrated.experienceInput,'자료구조');assert.equal(migrated.step,2);assert.deepEqual(migrated.selected,['search']);assert.equal(migrated.reflection.interesting,'칸 수');assert.deepEqual(migrated.prep,{focus:'',gap:'',topic:'',ask:''});assert.equal(migrated.messages.length,1);
});
test('saved records survive restoration and upstream changes',()=>{
 const s=fresh();s.interest='보안';s.selected=[labs[22].id];s.reasons[s.selected[0]]='보안이 궁금해서';s.statuses=['완료','완료','완료','완료'];s.experiments=[{id:'test',date:'2026-10-03',labIds:[labs[22].id],walls:exampleWalls,prediction:'A*가 적을 것',observation:'경로 길이는 같음',bfs:search(exampleWalls,'BFS'),astar:search(exampleWalls,'A*')}];s.messages=[{role:'user',text:'요약'}];s.reflection.next='더 탐색하기';
 const restored=decode(JSON.stringify(s));assert.deepEqual(restored,s);const changed=invalidate(restored,0);assert.deepEqual(changed.statuses,['완료','재검토 필요','재검토 필요','재검토 필요']);assert.deepEqual(changed.experiments,s.experiments);assert.deepEqual(changed.messages,s.messages);
});
test('all CSV catalog items appear, with only eight researched security details',()=>{
 assert.equal(labs.length,59);
 assert.equal(labs.filter(l=>l.type==='연구실').length,53);
 assert.equal(new Set(labs.map(l=>l.id)).size,labs.length);
 const detailed=labs.filter(l=>l.detail);
 assert.equal(detailed.length,8);
 assert.ok(detailed.every(l=>l.category==='보안·소프트웨어공학'&&l.detail.papers.every(p=>p.title&&p.year&&p.url.startsWith('https://'))));
 assert.ok(labs.every(l=>!l.professor.includes('가상')&&l.officialSources.length>0));
});
test('recommendation evidence matches catalog fields and unsupported input has empty result',()=>{const r=recommend('보안');assert.ok(r.length>=8);assert.ok(r.every(x=>x.matches.every(t=>x.lab.tags.includes(t)&&'보안'.includes(t))));assert.deepEqual(recommend('해양 생태학'),[]);});
test('catalog chat uses context without mutating saved records',async()=>{const s=fresh();s.interest='보안';s.selected=[labs[22].id,labs[23].id];const original=JSON.stringify(s);assert.match(await generateReply('선택한 연구실은 어떤 차이가 있어?',s),/보안/);assert.match(await generateReply('내 탐색 내용을 정리해줘.',s),/보안/);assert.match(await generateReply('오늘 날씨?',s),/저장된 연구실 정보/);assert.equal(JSON.stringify(s),original);});
test('search review note stays out of markdown until saved',()=>{assert.equal(ragMarkdown(emptyRag()),'');const note=ragMarkdown({...emptyRag(),committed:true,rule:'날짜가 있으면 보류한다'});assert.match(note,/검색 결과 묶음 점검/);assert.equal(note.includes('0.89'),false);});
test('recorded lecture sheets stay on the named professors',()=>{
 assert.deepEqual(taughtCourses['구형준'].map(c=>[c.name,c.code,c.time]),[['소프트웨어보안연구논문작성','ESW5042-41','수[DD]13:30-14:45 【1.5h(ON)+1.5h(OFF)】'],['컴퓨터네트워크개론','(SWE3022-41)','수[EE]15:00-16:15 【1.5h(ON)+1.5h(OFF)】']]);
 assert.deepEqual(taughtCourses['최형기'].map(c=>[c.name,c.code,c.time]),[['사이버보안기초와응용','GSAS009-81','목[02]20:00-21:20'],['인터넷통신개론','GSIS019-81','목[01]18:30-19:50'],['정보보호개론','SWE3025-41','월[DD]13:30-14:45,수[CC]12:00-13:15']]);
 assert.ok(labs.some(l=>l.professor==='구형준'&&taughtCourses[l.professor]));
});
test('prepared rag example stays labeled as an example',async()=>{const s=fresh();s.rag={stage:'attack',observation:'답변이 바뀌었다',planSaved:false,studyIds:[]};assert.match(await generateReply('가짜 문서가 들어가면 답변은 어떻게 바뀌나요?',s),/30일/);assert.match(await generateReply('제외된 문서는 실제 탐지 결과인가요?',s),/미리 지정/);assert.equal(s.rag.observation,'답변이 바뀌었다');});
