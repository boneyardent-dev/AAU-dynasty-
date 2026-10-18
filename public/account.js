// Coach account screen: create a profile (no personal info), sign in with a recovery code, or use ChatGPT.
// Server: /api/auth. After sign-in the page reloads so the normal account sync loads the saved game.
let aauAcct={authenticated:false,kind:null,label:'',preview:false},acctCode='';
async function acctRefresh(){try{const r=await fetch('/api/auth',{cache:'no-store'});if(r.ok)aauAcct=await r.json()}catch(e){}}
async function acctPost(body){let r,d={};try{r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});d=await r.json().catch(()=>({}))}catch(e){throw new Error('Connect to the internet and try again.')}
 if(!r.ok)throw new Error(d.error||'Something went wrong. Try again.');return d}
const acctBack=()=>`<div class="row" style="margin-top:12px">${button('Back','home()','alt')}</div>`;
async function account(msg=''){S.screen='account';frame('<div class="kicker">COACH ACCOUNT</div><h2>Checking your account</h2>');await acctRefresh();if(S.screen!=='account')return;
 const note=msg?`<div class="box" style="border-color:var(--lime)">${escapeHtml(msg)}</div>`:'';
 if(aauAcct.preview)return frame(`<div class="kicker">COACH ACCOUNT</div><h2>Accounts</h2>${note}<div class="box">Coach accounts are part of the live game. They are not available in this preview. Progress here saves on this device only.</div>${acctBack()}`);
 if(aauAcct.authenticated)return frame(`<div class="kicker">COACH ACCOUNT</div><h2>${escapeHtml(aauAcct.label)}</h2>${note}<div class="box"><p style="margin:0 0 8px">Your progress, rewards streak, and leaderboard standing save to this account.</p><p class="small" style="margin:0">${aauAcct.kind==='guest'?'To play on another phone, choose "I have a recovery code" there and enter your code. Lost your code? Make a new one here while you are signed in.':'You are signed in with ChatGPT.'}</p></div>
  <div class="row">${aauAcct.kind==='guest'?button('Get a new recovery code','acctNewCode()','alt'):''}${button('Sign out','acctLogout()','alt')}</div>${acctBack()}`);
 frame(`<div class="kicker">COACH ACCOUNT</div><h2>Save your program</h2>${note}
  <div class="box"><p style="margin:0 0 10px">Make a coach profile to save your progress, keep your daily streak, and compete on the weekly leaderboard. No name, email, or photo is needed.</p>${button('Create my coach profile','acctCreate()')}</div>
  <div class="box"><b>I have a recovery code</b><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><input id="acctCodeIn" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" placeholder="XXXX-XXXX-XXXX" aria-label="Recovery code" style="flex:1;min-width:180px;font:700 18px ui-monospace,monospace;letter-spacing:.08em;padding:10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit">${button('Sign in','acctRecover()','alt')}</div></div>
  <div class="small" style="margin:10px 2px">Players under 13: a parent should keep the recovery code safe. We do not collect personal information.</div>
  <div class="row"><a class="director-link" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT instead</a></div>${acctBack()}`)}
function acctShowCode(code,title){acctCode=code;frame(`<div class="kicker">COACH ACCOUNT</div><h2>${escapeHtml(title)}</h2><div class="box" style="text-align:center"><div class="small">Your recovery code</div><div id="acctCodeBox" style="font:800 28px/1.3 ui-monospace,monospace;letter-spacing:.08em;margin:10px 0">${escapeHtml(code)}</div><div class="row" style="justify-content:center">${button('Copy code','acctCopy()','alt')}</div></div>
 <div class="box">Write this down or take a screenshot. It is the only way to get back into this profile on another phone, and we cannot look it up for you. Keep it private.</div>${button('I saved it. Continue','acctDone()')}`)}
async function acctCreate(){try{const d=await acctPost({action:'guest'});acctShowCode(d.recoveryCode,'Welcome, coach')}catch(e){await account(e.message)}}
async function acctRecover(){const v=(document.getElementById('acctCodeIn')||{}).value||'';try{const d=await acctPost({action:'recover',code:v});location.reload()}catch(e){await account(e.message)}}
async function acctNewCode(){if(!confirm('Make a new code? Your old code will stop working.'))return;try{const d=await acctPost({action:'newcode'});acctShowCode(d.recoveryCode,'Your new recovery code')}catch(e){await account(e.message)}}
async function acctLogout(){try{await acctPost({action:'logout'})}catch(e){}location.reload()}
function acctDone(){acctCode='';location.reload()}
async function acctCopy(){try{await navigator.clipboard.writeText(acctCode);const b=document.getElementById('acctCodeBox');if(b)b.style.color='var(--lime)'}catch(e){const b=document.getElementById('acctCodeBox');if(b&&window.getSelection){const r=document.createRange();r.selectNodeContents(b);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}}}
