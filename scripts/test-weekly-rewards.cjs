const fs=require('fs'),vm=require('vm'),assert=require('assert'),root=require('path').resolve(__dirname,'..')+'/';
let calls=[],shown=[],hydrated=0,server={};
const ctx=vm.createContext({S:{},programs:[{n:'Mambas United'}],frame(){},button:(t,f)=>`<button onclick="${f}">${t}</button>`,escapeHtml:v=>String(v),
 vaultHydrate:async()=>{hydrated++},inventoryChange:async()=>{throw new Error('the phone must not add packs itself')},
 fetch:async(u,o)=>{const b=JSON.parse((o&&o.body)||'{}');calls.push(b.action);const r=server[b.action];return {ok:r.ok!==false,json:async()=>r.body}},Promise,JSON,String,Object,Array,Error,Date});
vm.runInContext(fs.readFileSync(root+'public/leaderboard.js','utf8'),ctx);
vm.runInContext('leaderboard=function(m){__shown(m)}',Object.assign(ctx,{__shown:m=>shown.push(m)}));
const claim=w=>vm.runInContext(`lbClaim('${w}')`,ctx);
(async()=>{
 server={claim:{body:{granted:4,claim:{week:'2026-10-12',packs:4,tier:'Podium',rank:2}}}};
 await claim('2026-10-12');assert.deepEqual(calls,['claim'],'one request; the server adds the packs');assert.equal(hydrated,1,'the vault is refreshed from the server');assert(/\+4 packs/.test(shown.at(-1)));
 server={claim:{body:{already:true}}};await claim('2026-10-05');assert.equal(hydrated,1);assert(/already claimed/.test(shown.at(-1)));
 server={claim:{ok:false,body:{error:'No reward for that week.'}}};await claim('2026-09-28');assert(/No reward/.test(shown.at(-1)),'errors are shown');
 server={claim:{body:{granted:1}}};await claim('2026-10-05');assert(/\+1 pack added/.test(shown.at(-1)));
 const html=vm.runInContext("lbRewardHtml([{week:'2026-10-12',packs:5,tier:'Champion',rank:1,games:6}])",ctx);assert(/Champion/.test(html)&&/Claim 5 packs/.test(html)&&/lbClaim\('2026-10-12'\)/.test(html),'reward card renders');
 assert.equal(vm.runInContext('lbRewardHtml([])',ctx),'');
 console.log('PASS: claim is one server request that grants the packs; phone only refreshes; repeat and error cases; reward card renders.');
})().catch(e=>{console.error(e);process.exit(1)});
