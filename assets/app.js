const MODEL_URL='modelos/Raiz_Viva_TOGAF_ArchiMate.archimate';
const $=s=>document.querySelector(s);
const direct=(el,tag)=>Array.from(el.children).filter(n=>n.tagName===tag);
const xtype=el=>(el.getAttribute('xsi:type')||'').replace('archimate:','');
const bounds=el=>{const b=direct(el,'bounds')[0];return b?['x','y','width','height'].map(k=>Number(b.getAttribute(k)||0)):[0,0,0,0]};
const cleanType=t=>t.replace(/Relationship$/,'').replace(/([a-z])([A-Z])/g,'$1 $2');
const state={doc:null,elements:new Map(),relations:new Map(),views:[],current:null,zoom:1,selected:null,lastLayout:null};

const viewInfo={
  'view-map':['Mapa do exemplo','Uma visão índice para navegar pelas principais perspectivas construídas no arquivo ArchiMate.'],
  'view-motivation':['Problema, metas e requisitos','Parte dos direcionadores do negócio, conecta descarte e ruptura às metas e mostra os requisitos e princípios que orientam a arquitetura.'],
  'view-baseline':['Baseline e lacuna','Mostra o estado atual fragmentado e a lacuna que precisa ser vencida antes do piloto. A mudança não é apenas tecnológica.'],
  'view-business':['Fase B: Arquitetura de Negócio','Organiza papéis e o processo alvo de ponta a ponta: prever, recomendar, revisar, pedir e medir.'],
  'view-data-app':['Fase C: Dados e Aplicações','Expõe as fontes, a preparação dos dados, o motor de previsão, a recomendação e o portal de decisão humana.'],
  'view-technology':['Fase D: Arquitetura Tecnológica','Mostra a conectividade das lojas e os serviços tecnológicos propostos para ingestão, dados, modelos, APIs, segurança e observabilidade.'],
  'view-roadmap':['Roadmap TOGAF ADM A a H','Conecta as fases do ADM e a transição de baseline para piloto e target, com gestão de requisitos transversal.']
};

const typeColors={
  motivation:'#ecd9d2',strategy:'#e8e0cb',business:'#f2e5ad',application:'#cfe3ee',technology:'#d7ead4',implementation_migration:'#e4d8eb'
};

async function init(){
  try{
    const text=await fetch(MODEL_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Arquivo ArchiMate não encontrado');return r.text()});
    const doc=new DOMParser().parseFromString(text,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('O arquivo ArchiMate não pôde ser interpretado');
    state.doc=doc;parseModel();buildUI();selectView('view-motivation');
    $('#loading-state').style.display='none';
  }catch(err){$('#loading-state').innerHTML=`<p><strong>Não foi possível carregar o modelo.</strong><br>${err.message}</p>`;console.error(err)}
}

function parseModel(){
  for(const folder of state.doc.querySelectorAll('folder')){
    const ftype=folder.getAttribute('type')||'';
    for(const el of direct(folder,'element')){
      const t=xtype(el),id=el.id;
      if(t.endsWith('Relationship')) state.relations.set(id,{id,type:t,source:el.getAttribute('source'),target:el.getAttribute('target')});
      else if(t==='ArchimateDiagramModel') state.views.push({id,name:el.getAttribute('name')||id,node:el});
      else state.elements.set(id,{id,name:el.getAttribute('name')||id,type:t,layer:ftype,folder:folder.getAttribute('name')||ftype});
    }
  }
  state.views.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true}));
}

function buildUI(){
  $('#stat-elements').textContent=state.elements.size;
  $('#stat-relations').textContent=state.relations.size;
  $('#stat-views').textContent=state.views.length;
  const tabs=$('#view-tabs');
  state.views.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='view-tab';b.dataset.view=v.id;b.textContent=v.name.replace(/^\d+\.\s*/,'');b.onclick=()=>selectView(v.id);tabs.appendChild(b)});
  const dl=$('#model-elements');
  [...state.elements.values()].sort((a,b)=>a.name.localeCompare(b.name)).forEach(e=>{const o=document.createElement('option');o.value=e.name;dl.appendChild(o)});
  const search=$('#model-search');
  const runSearch=()=>{const q=search.value.trim().toLowerCase();if(!q)return;const e=[...state.elements.values()].find(x=>x.name.toLowerCase()===q)||[...state.elements.values()].find(x=>x.name.toLowerCase().includes(q));if(e)focusElement(e.id)};
  search.addEventListener('change',runSearch);search.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
  $('#zoom-in').onclick=()=>setZoom(state.zoom+.12);$('#zoom-out').onclick=()=>setZoom(state.zoom-.12);$('#fit-view').onclick=fitView;
  buildRoadmap();
}

function buildRoadmap(){
  const box=$('#adm-roadmap');
  const phases=[...state.elements.values()].filter(e=>e.type==='WorkPackage'&&/^Fase [A-H]:/.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name));
  phases.forEach(e=>{const phase=e.name.match(/^Fase ([A-H]):/)[1];const title=e.name.replace(/^Fase [A-H]:\s*/,'');const a=document.createElement('article');a.className='adm-step';a.innerHTML=`<span class="phase">${phase}</span><h3>${title}</h3>`;a.onclick=()=>focusElement(e.id);box.appendChild(a)});
}

function selectView(id,keepSelection=false){
  const v=state.views.find(x=>x.id===id);if(!v)return;state.current=v;state.zoom=1;if(!keepSelection)state.selected=null;
  document.querySelectorAll('.view-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  const info=viewInfo[id]||[v.name,'Visão carregada diretamente do arquivo ArchiMate.'];
  $('#view-kicker').textContent=v.name.match(/^\d+/)?.[0]?`Visão ${v.name.match(/^\d+/)[0]}`:'Visão';$('#view-title').textContent=info[0];$('#view-description').textContent=info[1];
  renderView();requestAnimationFrame(fitView);
  if(!state.selected)renderEmptyDetail();
}

function collectView(view){
  const groups=[],nodes=[],notes=[],refs=[],connections=[];
  function walk(parent,ox=0,oy=0){
    for(const c of direct(parent,'child')){
      const t=xtype(c),[x,y,w,h]=bounds(c),ax=ox+x,ay=oy+y;
      if(t==='Group'){groups.push({id:c.id,name:c.getAttribute('name')||'',fill:c.getAttribute('fillColor')||'#f2f2f2',x:ax,y:ay,w,h});walk(c,ax,ay)}
      else if(t==='DiagramObject'){
        const item={id:c.id,elementId:c.getAttribute('archimateElement'),x:ax,y:ay,w,h,connections:direct(c,'sourceConnection')};nodes.push(item)
      }else if(t==='Note')notes.push({id:c.id,text:c.getAttribute('content')||'',x:ax,y:ay,w,h});
      else if(t==='DiagramModelReference')refs.push({id:c.id,model:c.getAttribute('model'),x:ax,y:ay,w,h});
    }
  }
  walk(view.node);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  for(const n of nodes)for(const c of n.connections){const target=byId.get(c.getAttribute('target'));if(target)connections.push({id:c.id,source:n,target,relationId:c.getAttribute('relationship')})}
  let maxX=850,maxY=500;[...groups,...nodes,...notes,...refs].forEach(n=>{maxX=Math.max(maxX,n.x+n.w+30);maxY=Math.max(maxY,n.y+n.h+30)});
  return{groups,nodes,notes,refs,connections,w:maxX,h:maxY};
}

function renderView(){
  const svg=$('#architecture-svg');svg.innerHTML='';
  const L=collectView(state.current);state.lastLayout=L;svg.setAttribute('viewBox',`0 0 ${L.w} ${L.h}`);
  const ns='http://www.w3.org/2000/svg';
  const defs=document.createElementNS(ns,'defs');defs.innerHTML='<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#58756b"/></marker>';svg.appendChild(defs);
  for(const g of L.groups){const group=document.createElementNS(ns,'g');const r=document.createElementNS(ns,'rect');setAttrs(r,{x:g.x,y:g.y,width:g.w,height:g.h,fill:g.fill,'fill-opacity':.72,rx:18,class:'diagram-group'});group.appendChild(r);const t=textEl(g.x+14,g.y+20,g.name,'diagram-group-title');group.appendChild(t);svg.appendChild(group)}
  for(const c of L.connections){const s=c.source,t=c.target;const sx=s.x+s.w,sy=s.y+s.h/2,tx=t.x,ty=t.y+t.h/2,mx=(sx+tx)/2;const p=document.createElementNS(ns,'path');setAttrs(p,{d:`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`,class:'diagram-connection','data-source':s.elementId,'data-target':t.elementId,'marker-end':'url(#arrow)'});svg.appendChild(p)}
  L.refs.forEach(r=>svg.appendChild(referenceGroup(r,ns)));
  L.nodes.forEach(n=>svg.appendChild(nodeGroup(n,ns)));
  L.notes.forEach(n=>svg.appendChild(noteGroup(n,ns)));
  applySelection();setZoom(state.zoom);
}

function nodeGroup(n,ns){
  const e=state.elements.get(n.elementId)||{name:n.elementId||'Elemento',type:'Element',layer:''};const g=document.createElementNS(ns,'g');g.classList.add('diagram-node');g.dataset.element=n.elementId;
  const r=document.createElementNS(ns,'rect');setAttrs(r,{x:n.x,y:n.y,width:n.w,height:n.h,fill:typeColors[e.layer]||'#e8e8e2'});g.appendChild(r);
  const type=textEl(n.x+10,n.y+14,cleanType(e.type).toUpperCase(),'node-type');g.appendChild(type);
  wrapText(g,e.name,n.x+10,n.y+30,n.w-20,12,ns,Math.max(1,Math.floor((n.h-30)/13)));
  g.addEventListener('click',ev=>{ev.stopPropagation();selectElement(n.elementId)});return g;
}
function noteGroup(n,ns){const g=document.createElementNS(ns,'g');g.classList.add('diagram-note');const r=document.createElementNS(ns,'rect');setAttrs(r,{x:n.x,y:n.y,width:n.w,height:n.h});g.appendChild(r);wrapText(g,n.text,n.x+12,n.y+21,n.w-24,10,ns,Math.max(2,Math.floor((n.h-18)/13)));return g}
function referenceGroup(n,ns){const g=document.createElementNS(ns,'g');g.classList.add('diagram-reference');const r=document.createElementNS(ns,'rect');setAttrs(r,{x:n.x,y:n.y,width:n.w,height:n.h});g.appendChild(r);const v=state.views.find(x=>x.id===n.model);wrapText(g,v?.name||n.model,n.x+14,n.y+27,n.w-28,12,ns,3);g.onclick=()=>selectView(n.model);return g}
function textEl(x,y,text,cls){const t=document.createElementNS('http://www.w3.org/2000/svg','text');setAttrs(t,{x,y,class:cls});t.textContent=text;return t}
function wrapText(group,text,x,y,width,size,ns,maxLines=3){const max=Math.max(8,Math.floor(width/(size*.58))),words=(text||'').split(/\s+/);let lines=[''];for(const w of words){const i=lines.length-1;if((lines[i]+' '+w).trim().length<=max)lines[i]=(lines[i]+' '+w).trim();else if(lines.length<maxLines)lines.push(w);else{lines[i]=lines[i].replace(/\.*$/,'')+'…';break}}lines.forEach((line,i)=>{const t=document.createElementNS(ns,'text');setAttrs(t,{x,y:y+i*(size+2)});t.textContent=line;group.appendChild(t)})}
function setAttrs(el,obj){Object.entries(obj).forEach(([k,v])=>el.setAttribute(k,v))}

function selectElement(id){state.selected=id;renderDetail(id);applySelection()}
function applySelection(){
  const selected=state.selected;if(!selected){document.querySelectorAll('.diagram-node,.diagram-connection').forEach(x=>x.classList.remove('dimmed','selected'));return}
  const linked=new Set([selected]);for(const r of state.relations.values())if(r.source===selected||r.target===selected){linked.add(r.source);linked.add(r.target)}
  document.querySelectorAll('.diagram-node').forEach(n=>{const id=n.dataset.element;n.classList.toggle('selected',id===selected);n.classList.toggle('dimmed',!linked.has(id))});
  document.querySelectorAll('.diagram-connection').forEach(c=>c.classList.toggle('dimmed',c.dataset.source!==selected&&c.dataset.target!==selected));
}
function renderEmptyDetail(){$('#detail-panel').innerHTML='<div class="detail-empty"><span>Detalhes</span><h3>Selecione um elemento.</h3><p>Clique em uma caixa do diagrama para ver seu tipo ArchiMate e as relações de entrada e saída.</p></div>'}
function renderDetail(id){
  const e=state.elements.get(id);if(!e)return;const incoming=[],outgoing=[];for(const r of state.relations.values()){if(r.target===id)incoming.push(r);if(r.source===id)outgoing.push(r)}
  const list=(arr,dir)=>arr.length?`<div class="relation-list">${arr.map(r=>{const other=state.elements.get(dir==='in'?r.source:r.target);return `<div class="relation-item">${cleanType(r.type)}<strong>${dir==='in'?'←':'→'} ${escapeHtml(other?.name||'Elemento')}</strong></div>`}).join('')}</div>`:'<p class="detail-id">Nenhuma relação nesta direção.</p>';
  $('#detail-panel').innerHTML=`<div class="detail-card"><div class="detail-type">${cleanType(e.type)} · ${layerName(e.layer)}</div><h3>${escapeHtml(e.name)}</h3><p class="detail-id">${e.id}</p><div class="detail-section"><h4>Relações de entrada</h4>${list(incoming,'in')}</div><div class="detail-section"><h4>Relações de saída</h4>${list(outgoing,'out')}</div></div>`;
}
function layerName(l){return({motivation:'Motivação',strategy:'Estratégia',business:'Negócio',application:'Aplicações e dados',technology:'Tecnologia',implementation_migration:'Implementação'})[l]||l}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function focusElement(id){
  const view=state.views.find(v=>v.node.querySelector(`[archimateElement="${id}"]`));
  state.selected=id;if(view&&state.current?.id!==view.id)selectView(view.id,true);else{renderView();requestAnimationFrame(fitView)}renderDetail(id);
  document.getElementById('explorador').scrollIntoView({behavior:'smooth',block:'start'});
}
function setZoom(z){state.zoom=Math.min(1.8,Math.max(.35,z));const svg=$('#architecture-svg'),L=state.lastLayout;if(!L)return;svg.style.width=`${Math.round(L.w*state.zoom)}px`;svg.style.height=`${Math.round(L.h*state.zoom)}px`}
function fitView(){const wrap=$('#canvas-wrap'),L=state.lastLayout;if(!L)return;const z=Math.min(1,(wrap.clientWidth-28)/L.w);setZoom(z);wrap.scrollTo({left:0,top:0,behavior:'smooth'})}

init();
