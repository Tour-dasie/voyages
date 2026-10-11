/* Recherche locale dans le carnet du voyage actuellement ouvert. */
let searchResults=[],searchDocuments=[];
function searchText(value){const raw=String(value??'');if(!/[<&]/.test(raw))return raw.replace(/\s+/g,' ').trim();const el=document.createElement('div');el.innerHTML=richHTML(String(value??''));return el.textContent.replace(/\s+/g,' ').trim();}
function searchNormalize(value){return searchText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ');}
function searchTerms(query){return searchNormalize(query).split(/[^\p{L}\p{N}]+/u).filter(x=>x&&!['de','du','des','la','le','les','l','d','a','au','aux','et','pour'].includes(x));}
function searchBody(value){
 const ignored=new Set(['id','co','photo','col','tag','push','quiet','notificationHour','n','stage','fl','receipt']);
 const labels={nm:'Pays',route:'Parcours',visa:'Formalités',film:'À filmer',note:'À noter',guide:'Guide',dd:'Dates',dt:'Date',date:'Date',t:'Informations',s:'Détails',p:'Tarif',sp:'Lieux',transport:'Transport',start:'Début',end:'Fin',budget:'Budget prévu',stay:'Hébergement',arrival:'Arrivée',booking:'Réservation'};
 const rows=[];
 function walk(v,label){if(v==null)return;if(Array.isArray(v)){v.forEach(x=>walk(x,label));return;}if(typeof v==='object'){Object.entries(v).forEach(([k,x])=>{if(!ignored.has(k))walk(x,labels[k]||label);});return;}if(typeof v==='boolean')return;const plain=searchText(v);if(plain)rows.push((label?label+' : ':'')+plain);}
 walk(value,'');return [...new Set(rows)].join('\n');
}
function buildSearchDocuments(){
 const docs=[];function add(title,kind,value,target,context=''){const body=searchBody(value);if(!body)return;docs.push({title:searchText(title),kind,body,context:searchText(context),target,normalized:searchNormalize(title+' '+context+' '+body)});}
 STAGES.forEach(st=>{
 const context=st.nm;add(st.nm,'Étape',{route:st.route,visa:st.visa,note:st.note,film:st.film,guide:st.guide,start:st.start,end:st.end,budget:st.budget},{view:'itin',stage:st.id},context);
 add('Infos pratiques '+st.nm,'Infos pratiques',PRATIQUE[st.id],{view:'guide'},context);
 (st.blocks||[]).forEach(b=>{const ctx=st.nm+' · '+b.c+' · '+(b.dd||'');const target={view:'itin',stage:st.id,block:st.id+'-'+b.c};
 add(b.c,'Destination',{sum:b.sum,practical:b.practical,social:SOCIAL[b.c]||b.social},target,ctx);
 (b.days||[]).forEach(day=>add(day.dt+' · '+searchText(day.t),'Journée',day,target,ctx));
 (b.spots||[]).forEach(sp=>add(typeof sp==='string'?sp:sp.n,'Lieu',sp,target,ctx));
 (b.resto||[]).forEach(sp=>add(typeof sp==='string'?sp:sp.n,'Restaurant',sp,target,ctx));
 });});
 REMINDERS.forEach(r=>add(r.t,'Rappel',r,{view:'rem',reminder:r.id},r.date||''));
 CHECK.forEach((r,i)=>add(r.t||r.n||'Préparatifs','Préparatifs',r,{view:'rem',tab:'prep'}));
 PACK.forEach(r=>add(r.t||r.n||r.name||'Bagages','Bagages',r,{view:'rem',tab:'pack'}));
 (HANDBOOK.sections||[]).forEach(r=>add(r.title||r.t||'Mode d’emploi','Guide du voyage',r,{view:'guide'}));
 (S.expenses||[]).forEach(r=>add(r.title||r.t||r.label||'Dépense','Budget',r,{view:'budget'}));
 (S.flights||[]).forEach(r=>add(r.from+' → '+r.to,'Vol',r,{view:'today'},r.date||''));
 BUDGET_PREVU.forEach(r=>add(r.nm||r.label||'Budget prévu','Budget',r,{view:'budget'}));
 return docs;
}
function openSearch(){
 if(!STAGES.length){toast('Ouvre un voyage pour rechercher dans son carnet.');return;}
 searchDocuments=buildSearchDocuments();const modal=document.getElementById('modal');modal.innerHTML='<div class="overlay"><div class="sheet search-sheet" role="dialog" aria-modal="true" aria-labelledby="search-title"><div class="search-heading"><h3 id="search-title">🔎 Rechercher dans le carnet</h3><button class="iconbtn" id="search-close" aria-label="Fermer la recherche">✕</button></div><label for="trip-search">Lieu, activité, transport ou rappel</label><input id="trip-search" type="search" placeholder="Exemple : Temple du Ciel" autocomplete="off"><p id="search-status" role="status" aria-live="polite"></p><div id="search-results"></div></div></div>';
 modal.querySelector('.overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});document.getElementById('search-close').onclick=closeModal;
 const input=document.getElementById('trip-search');input.oninput=renderSearchResults;input.onkeydown=e=>{if(e.key==='Escape')closeModal();};renderSearchResults();input.focus();
}
function renderSearchResults(){
 const input=document.getElementById('trip-search');if(!input)return;const terms=searchTerms(input.value);const root=document.getElementById('search-results');root.replaceChildren();searchResults=[];
 if(!terms.length){document.getElementById('search-status').textContent='Recherche dans toutes les rubriques du voyage ouvert. Saisis le nom d’un lieu ou quelques mots.';return;}
 searchResults=searchDocuments.filter(d=>terms.every(t=>d.normalized.includes(t))).sort((a,b)=>{const score=d=>terms.reduce((n,t)=>n+(searchNormalize(d.title).includes(t)?3:0),0);return score(b)-score(a);});
 document.getElementById('search-status').textContent=searchResults.length?searchResults.length+' résultat'+(searchResults.length>1?'s':'')+' dans le carnet.':'Aucun résultat. Essaie un nom plus court ou un autre mot.';
 let shown=0;function more(){const end=Math.min(shown+40,searchResults.length);for(;shown<end;shown++){const d=searchResults[shown],card=document.createElement('article');card.className='card search-result';const tag=document.createElement('p');tag.className='search-context';tag.textContent=d.kind+' · '+d.context;const title=document.createElement('h4');title.textContent=d.title;const body=document.createElement('div');body.className='search-body';body.textContent=d.body;const btn=document.createElement('button');btn.className='btn ghost';btn.textContent='Voir dans '+({itin:'l’itinéraire',guide:'les infos',rem:'les rappels',budget:'le budget'}[d.target.view]);btn.onclick=()=>openSearchTarget(d.target);card.append(tag,title,body,btn);root.append(card);}if(shown<searchResults.length){const btn=document.createElement('button');btn.className='btn ghost';btn.textContent='Afficher les résultats suivants';btn.onclick=()=>{btn.remove();more();};root.append(btn);}}
 more();
}
function openSearchTarget(target){closeModal();if(target.tab){remTab=target.tab;renderRem();}if(target.reminder){remTab='ech';remPeriod='all';remCategory='all';remStage='all';renderRem();}nav(target.view);if(target.stage)document.getElementById('stg-'+target.stage)?.classList.add('open');if(target.block)document.getElementById('blk-'+cssId(target.block))?.classList.add('open');setTimeout(()=>{const el=target.reminder?document.getElementById('rem-'+cssId(target.reminder)):target.block?document.getElementById('blk-'+cssId(target.block)):target.stage?document.getElementById('stg-'+target.stage):null;el?.scrollIntoView({behavior:'smooth',block:'center'});},100);}
