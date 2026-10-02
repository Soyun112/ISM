import test from 'node:test';
import assert from 'node:assert/strict';
import {search,exampleWalls} from '../src/algorithms.ts';
import {decode,fresh,invalidate} from '../src/store.ts';
import {recommend} from '../src/recommend.ts';
import {generateReply} from '../src/chat.ts';
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
 const s=fresh();s.interest='길찾기';s.selected=['search'];s.reasons.search='탐색이 궁금해서';s.statuses=['완료','완료','완료','완료'];s.experiments=[{id:'test',date:'2026-10-03',labIds:['search'],walls:exampleWalls,prediction:'A*가 적을 것',observation:'경로 길이는 같음',bfs:search(exampleWalls,'BFS'),astar:search(exampleWalls,'A*')}];s.messages=[{role:'user',text:'요약'}];s.reflection.next='더 탐색하기';
 const restored=decode(JSON.stringify(s));assert.deepEqual(restored,s);const changed=invalidate(restored,0);assert.deepEqual(changed.statuses,['완료','재검토 필요','재검토 필요','재검토 필요']);assert.deepEqual(changed.experiments,s.experiments);assert.deepEqual(changed.messages,s.messages);
});
test('recommendation evidence matches tags and unsupported input has empty result',()=>{const r=recommend('로봇 길찾기');assert.ok(r.length>0);assert.ok(r.every(x=>x.matches.every(t=>x.lab.tags.includes(t)&&'로봇 길찾기'.includes(t))));assert.deepEqual(recommend('해양 생태학'),[]);});
test('demo chat uses context without mutating saved records',async()=>{const s=fresh();s.interest='길찾기';s.selected=['search','robot'];const original=JSON.stringify(s);assert.match(await generateReply('선택한 연구실은 어떤 차이가 있어?',s),/로봇/);assert.match(await generateReply('내 탐색 내용을 정리해줘.',s),/길찾기/);assert.match(await generateReply('오늘 날씨?',s),/지원하지/);assert.equal(JSON.stringify(s),original);});
