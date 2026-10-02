import test from 'node:test';
import assert from 'node:assert/strict';
import {search,exampleWalls} from '../src/algorithms.ts';
import {decode,fresh,invalidate,toggleCandidate,selectExperience,runRagStage,ragComplete} from '../src/store.ts';
import {recommend} from '../src/recommend.ts';
import {generateReply} from '../src/chat.ts';
import {emptyRag,ragMarkdown} from '../src/rag.ts';
import {labs,taughtCourses} from '../src/data.ts';
import {buildGeminiRequest} from '../src/geminiPrompt.ts';
import {askGemini} from '../server/gemini.ts';
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
 assert.equal(migrated.version,4);assert.equal(migrated.interest,'길찾기');assert.equal(migrated.experienceInput,'자료구조');assert.equal(migrated.step,2);assert.deepEqual(migrated.selected,['search']);assert.equal(migrated.reflection.interesting,'칸 수');assert.deepEqual(migrated.prep,{focus:'',gap:'',topic:'',ask:''});assert.equal(migrated.messages.length,1);
});
test('saved records survive restoration and upstream changes',()=>{
 const s=fresh();s.interest='보안';s.selected=[labs[22].id];s.reasons[s.selected[0]]='보안이 궁금해서';s.statuses=['완료','완료','완료','완료'];s.experiments=[{id:'test',date:'2026-10-03',labIds:[labs[22].id],walls:exampleWalls,prediction:'A*가 적을 것',observation:'경로 길이는 같음',bfs:search(exampleWalls,'BFS'),astar:search(exampleWalls,'A*')}];s.messages=[{role:'user',text:'요약'}];s.reflection.next='더 탐색하기';
 s.rag={...s.rag,executed:['normal','attack','defense'],displayedStage:'defense'};
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
test('prepared rag example stays labeled as an example',async()=>{const s=fresh();s.rag={...s.rag,stage:'attack',observation:'답변이 바뀌었다'};assert.match(await generateReply('가짜 문서가 들어가면 답변은 어떻게 바뀌나요?',s),/30일/);assert.match(await generateReply('제외된 문서는 실제 탐지 결과인가요?',s),/미리 지정/);assert.equal(s.rag.observation,'답변이 바뀌었다');});
test('gemini prompt carries the saved lab and no api key',()=>{const s=fresh();s.interest='보안';s.selected=[labs[22].id];const request=buildGeminiRequest('선택한 연구실은 어떤 차이가 있어?',s,[]);assert.match(request.system,new RegExp(labs[22].name));assert.equal(JSON.stringify(request).includes('GEMINI_API_KEY'),false);assert.equal(request.contents.at(-1).parts[0].text,'선택한 연구실은 어떤 차이가 있어?');});

test('two distinct candidates maximum, always removable, no automatic personal reasons',()=>{
 let s=toggleCandidate(fresh(),labs[22].id);assert.deepEqual(s.reasons,{});
 s=toggleCandidate(s,labs[23].id);const full=s;assert.equal(toggleCandidate(s,labs[24].id),full);
 s.reasons[labs[22].id]='내가 작성한 이유';s=toggleCandidate(s,labs[22].id);assert.equal(s.selected.length,1);assert.equal(s.reasons[labs[22].id],'내가 작성한 이유');
 s=toggleCandidate(s,labs[22].id);assert.equal(new Set(s.selected).size,2);assert.equal(s.reasons[labs[22].id],'내가 작성한 이유');
});
test('only the implemented SecAI topic can be selected',()=>{
 const sec=labs.find(l=>l.professor==='구형준'),other=labs.find(l=>l.professor==='최형기');
 let s=toggleCandidate(fresh(),sec.id);assert.equal(selectExperience(s,sec.id),s);
 s=toggleCandidate(s,other.id);assert.equal(selectExperience(s,other.id),s);
 const chosen=selectExperience(s,sec.id);assert.deepEqual(chosen.experienceSelection,{labId:sec.id,topicId:'rag-poison-defense'});assert.equal(chosen.step,2);
 assert.deepEqual(decode(JSON.stringify(chosen)).experienceSelection,chosen.experienceSelection);
});
test('stage selection and skipped stages never count as execution',()=>{
 let rag={...fresh().rag,stage:'defense'};assert.equal(ragComplete(rag),false);assert.equal(runRagStage(rag,'defense'),rag);
 rag=runRagStage(rag,'normal');assert.deepEqual(rag.executed,['normal']);assert.equal(rag.displayedStage,'normal');
 rag={...rag,stage:'attack'};assert.equal(rag.displayedStage,'normal');assert.equal(ragComplete(rag),false);
 rag=runRagStage(rag,'attack');rag=runRagStage(rag,'defense');assert.equal(ragComplete(rag),true);assert.deepEqual(runRagStage(rag,'normal').executed,['normal','attack','defense']);
});
test('legacy RAG data keeps personal work without claiming stage execution',()=>{
 const sec=labs.find(l=>l.professor==='구형준');const s={...fresh(),version:2,selected:[sec.id,labs[23].id,labs[24].id],prep:{focus:sec.id,gap:'생각 차이',topic:'내 주제',ask:'질문'},rag:{stage:'defense',observation:'이전 메모',planSaved:true,studyIds:['python']},statuses:['완료','완료','완료','완료']};
 const migrated=decode(JSON.stringify(s));assert.equal(migrated.selected.length,3);assert.equal(migrated.rag.observation,'이전 메모');assert.equal(migrated.rag.planSaved,true);assert.deepEqual(migrated.rag.studyIds,['python']);assert.deepEqual(migrated.rag.executed,[]);assert.equal(migrated.rag.displayedStage,null);assert.equal(migrated.statuses[2],'재검토 필요');assert.equal(migrated.prep.topic,'내 주제');assert.equal(migrated.experienceSelection.labId,sec.id);
});
test('new questions use interest and actual execution without fabricating completion or opinion',async()=>{
 const s=fresh();const before=JSON.stringify(s);assert.match(await generateReply('이 관심 분야를 더 구체적으로 나누면 어떻게 돼?',s),/아직 관심 분야/);assert.match(await generateReply('선택한 두 연구실의 가장 큰 차이는 뭐야?',s),/정확히 2개/);assert.match(await generateReply('이 체험을 직접 구현하려면 무엇부터 공부해야 해?',s),/아직 실행한 체험 단계가 없습니다/);assert.equal(JSON.stringify(s),before);
 const prompt=buildGeminiRequest('진행 상태?',{...s,rag:{...s.rag,stage:'attack'}},[]);assert.match(prompt.system,/실제 실행한 단계: 없음/);assert.match(prompt.system,/체험 주제: 미선택/);
});
test('existing server API carries the selected topic and executed stages to Gemini without a live call',async()=>{
 const originalFetch=globalThis.fetch;let request;
 globalThis.fetch=async(_url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'검증 응답'}]}}]})};};
 try{
  const sec=labs.find(l=>l.professor==='구형준'),s=fresh();s.selected=[sec.id,labs[23].id];s.experienceSelection={labId:sec.id,topicId:'rag-poison-defense'};s.rag={...s.rag,stage:'attack',executed:['normal'],displayedStage:'normal',studyIds:['python']};
  assert.equal(await askGemini({question:'현재 진행은?',context:s},'test-only-key','test-model'),'검증 응답');
  const prompt=request.systemInstruction.parts[0].text;assert.match(prompt,/체험 주제: RAG 오염 공격과 방어/);assert.match(prompt,/실제 실행한 단계: 정상/);assert.match(prompt,/선택한 공부: Python 기초/);assert.equal(prompt.includes('test-only-key'),false);
 }finally{globalThis.fetch=originalFetch;}
});
