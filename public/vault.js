// Server-held packs for signed-in players. The server decides every pack grant and card draw; this file
// mirrors the server's vault into the local collection so the existing screens keep working, and sends
// pack-affecting actions to the server instead of doing them on the phone. Not signed in = local play as before.
const aauVault={enabled:false,backedUp:false};
async function vaultCall(method,body){const r=await fetch('/api/vault',method==='POST'?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Could not reach the server. Try again.');e.status=r.status;throw e}return d}
function vaultCards(state){const out={};for(const x of state.cards||[]){const p=players.find(q=>q.id===x.playerId);if(!p)continue;
 out[x.cardKey]={playerId:x.playerId,edition:'silver-foil',rarity:x.rarity,quantity:x.quantity,favorite:!!x.favorite,attributes:cardAttributes(p),...(x.specialEdition?{specialEdition:x.specialEdition}:{})}}return out}
async function vaultApply(state,opts={}){
 if(!aauVault.backedUp){try{const k=collectionKey+':local-backup',raw=localStorage.getItem(collectionKey);if(raw&&!localStorage.getItem(k))localStorage.setItem(k,raw)}catch(e){}aauVault.backedUp=true}
 await inventoryChange(c=>{c.packs=state.packs;c.matches=state.matches;c.packThemes=state.packThemes||[];c.inventory=vaultCards(state);c.daily=state.daily;c.goals=state.goals;c.season=state.season;
  const sl=state.last;if(!sl)c.last=null;else if(!c.last||c.last.batchId!==sl.batchId)c.last={...sl,cards:(sl.cards||[]).map(x=>({...x,revealed:false}))};
  if(opts.opened&&sl&&sl.bonusSupport){c.support=c.support||{};c.support[sl.bonusSupport]=(c.support[sl.bonusSupport]||0)+1}})}
async function vaultHydrate(){if(typeof fetch!=='function')return false;
 try{const d=await vaultCall('GET');await vaultApply(d.vault);aauVault.enabled=true;
  try{if(typeof S!=='undefined'&&S.screen==='packs'&&typeof PR!=='undefined'&&PR.phase==='idle'&&typeof packRoom==='function')packRoom();else if(typeof S!=='undefined'&&S.screen==='rewards'&&typeof rewards==='function')rewards()}catch(e){}
  return true}catch(e){if(e.status===401)aauVault.enabled=false;return aauVault.enabled}}
// Opening a pack: the server draws the five cards.
if(typeof prCommitFiveCards==='function'){const local=prCommitFiveCards;
 prCommitFiveCards=async function(){if(!aauVault.enabled)return local();if(packBusy)return;packBusy=true;
  try{const d=await vaultCall('POST',{action:'open'});await vaultApply(d.vault,{opened:true});
   for(const pull of (d.vault.last&&d.vault.last.cards)||[])if(['Legendary','Mythic'].includes(pull.rarity)&&pull.specialEdition&&typeof circuitPost==='function'){const p=players.find(x=>x.id===pull.playerId);circuitPost('pull:'+pull.pullId,'PACK WATCH',(p?p.n:'A player')+' joins your collection in '+pull.specialEdition+'.')}
   if(typeof saveAll==='function')saveAll()}catch(e){alert(e.message)}finally{packBusy=false}}}
if(typeof collectPackBatch==='function'){const local=collectPackBatch;
 collectPackBatch=async function(){await local();if(aauVault.enabled){try{await vaultApply((await vaultCall('POST',{action:'collect'})).vault)}catch(e){}}}}
if(typeof toggleCardFavorite==='function'){const local=toggleCardFavorite;
 toggleCardFavorite=async function(key){await local(key);if(aauVault.enabled){try{const c=inventoryRead();await vaultCall('POST',{action:'favorite',cardKey:key,value:!!(c.inventory[key]&&c.inventory[key].favorite)})}catch(e){}}}}
// Rewards: the server grants them.
if(typeof rtClaimDaily==='function'){const local=rtClaimDaily;
 rtClaimDaily=async function(){if(!aauVault.enabled)return local();const d=await vaultCall('POST',{action:'daily'});await vaultApply(d.vault);return d.granted?{pk:d.granted,streak:d.streak}:null}}
if(typeof rtClaimGoal==='function'){const local=rtClaimGoal;
 rtClaimGoal=async function(id){if(!aauVault.enabled)return local(id);const d=await vaultCall('POST',{action:'goal',id});await vaultApply(d.vault);return d.granted||0}}
if(typeof rtClaimLevel==='function'){const local=rtClaimLevel;
 rtClaimLevel=async function(n){if(!aauVault.enabled)return local(n);const d=await vaultCall('POST',{action:'level',n});await vaultApply(d.vault);return d.granted||0}}
if(typeof rtXp==='function'){const local=rtXp;rtXp=function(c,n){if(aauVault.enabled)return;return local(c,n)}}
// Account-backed testing purchases are granted by the server so the phone cannot edit the vault.
if(typeof purchaseFeaturedPack==='function'){const local=purchaseFeaturedPack;
 purchaseFeaturedPack=async function(){if(!aauVault.enabled)return local();if(PR.shopBusy)return;const drop=prFeaturedDrop();PR.shopBusy=true;packRoom();try{const d=await vaultCall('POST',{action:'test-purchase',theme:drop.id});await vaultApply(d.vault);if(typeof prSound==='function')prSound('foil');}catch(e){alert(e.message)}finally{PR.shopBusy=false;packRoom()}}}
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('visibilitychange',()=>{if(!document.hidden&&aauVault.enabled)vaultHydrate()});
vaultHydrate();
