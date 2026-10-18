const fs=require('fs'),vm=require('vm'),assert=require('assert'),root=require('path').resolve(__dirname,'..')+'/';
let html='',resp={};const S={};
const ctx=vm.createContext({S,frame:h=>{html=h},button:(t,f)=>`<button onclick="${f}">${t}</button>`,escapeHtml:v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),document:{getElementById:()=>null},navigator:{},location:{reload(){}},alert(){},confirm:()=>true,
 fetch:async(u,o)=>{const r=resp[(o&&o.method)||'GET'];return {ok:r.ok!==false,json:async()=>r.body}},Promise,JSON,String,Object,Array,Error});
vm.runInContext(fs.readFileSync(root+'public/account.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 resp.GET={body:{authenticated:false}};await run('account()');assert(/Create my coach profile/.test(html)&&/recovery code/i.test(html)&&/No name, email, or photo/.test(html)&&/under 13/.test(html),'signed-out screen');
 resp.GET={body:{authenticated:false,preview:true}};await run('account()');assert(/not available in this preview/.test(html)&&!/Create my coach profile/.test(html),'preview screen');
 resp.GET={body:{authenticated:true,kind:'guest',label:'Coach #7K2Q'}};await run('account()');assert(/Coach #7K2Q/.test(html)&&/new recovery code/.test(html)&&/Sign out/.test(html),'guest screen');
 resp.GET={body:{authenticated:true,kind:'chatgpt',label:'ChatGPT account'}};await run('account()');assert(!/new recovery code/.test(html)&&/Sign out/.test(html),'chatgpt screen has no recovery code option');
 resp.POST={body:{ok:true,recoveryCode:'ABCD-EFGH-JKMN'}};await run('acctCreate()');assert(/ABCD-EFGH-JKMN/.test(html)&&/only way to get back/.test(html)&&/I saved it/.test(html),'new profile shows the code once with a warning');
 resp.GET={body:{authenticated:false}};resp.POST={ok:false,body:{error:'That code was not found. Check it and try again.'}};await run('acctRecover()');assert(/That code was not found/.test(html),'bad code shows a friendly error');
 resp.POST={ok:false,body:{error:'<img src=x onerror=alert(1)>'}};await run('acctRecover()');assert(!/<img src=x/.test(html),'error text is escaped');
 console.log('PASS: signed-out, preview, guest, and ChatGPT screens; code shown once with warning; friendly and escaped errors.');
})().catch(e=>{console.error(e);process.exit(1)});
