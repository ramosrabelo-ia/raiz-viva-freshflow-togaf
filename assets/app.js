const MODEL_URL='./modelos/Raiz_Viva_TOGAF_ArchiMate.archimate';
const XSI='http://www.w3.org/2001/XMLSchema-instance';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const local=n=>n.localName||n.tagName;
const direct=(el,tag)=>[...el.children].filter(n=>local(n)===tag);
const xtype=el=>((el.getAttributeNS?.(XSI,'type')||el.getAttribute('xsi:type')||'').replace('archimate:',''));
const getBounds=el=>{const b=direct(el,'bounds')[0];return b?['x','y','width','height'].map(k=>Number(b.getAttribute(k)||0)):[0,0,0,0]};
const cleanType=t=>(t||'Elemento').replace(/Relationship$/,'').replace(/([a-z])([A-Z])/g,'$1 $2');
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const state={doc:null,elements:new Map(),relations:new Map(),views:[],currentView:null,zoom:1,selected:null,lastLayout:null,ready:false};

const viewCopy={
  'view-map':['Mapa do exemplo','Índice das visões construídas no arquivo ArchiMate.'],
  'view-motivation':['Problema, metas e requisitos','Drivers do negócio, metas propostas, requisitos e princípios que orientam a arquitetura.'],
  'view-baseline':['Baseline e lacuna','Estado atual fragmentado e a lacuna antes do piloto.'],
  'view-business':['Arquitetura de negócio','Papéis e processo alvo: prever, recomendar, revisar, pedir e medir.'],
  'view-data-app':['Dados e aplicações','Fontes, preparação, previsão, reposição, API e portal de decisão humana.'],
  'view-technology':['Arquitetura tecnológica','Ambiente das lojas, conectividade e serviços de tecnologia modelados.'],
  'view-roadmap':['Roadmap TOGAF ADM','Fases A a H e transição de baseline para piloto e target.']
};

const layerColors={motivation:'#efd9d4',strategy:'#eee5cc',business:'#f3e7b6',application:'#d7e8ee',technology:'#dcebd8',implementation_migration:'#e6ddea'};

function initNavigation(){
  $$('#nav button').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.jump)));
  $('#command-button').addEventListener('click',()=>{$('#ask-input').focus();$('#ask-input').select()});
  $('#ask-send').addEventListener('click',runAsk);
  $('#ask-input').addEventListener('keydown',e=>{if(e.key==='Enter')runAsk()});
  $$('#ask-suggestions button').forEach(b=>b.addEventListener('click',()=>answerQuestion(b.dataset.question)));
}

function showScreen(name){
  $$('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${name}`));
  $$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
  $('.workspace').scrollTo({top:0,behavior:'smooth'});
  if(name==='model'&&state.ready){requestAnimationFrame(()=>fitView())}
}

async function loadModel(){
  try{
    const response=await fetch(MODEL_URL,{cache:'no-store'});
    if(!response.ok)throw new Error(`arquivo não encontrado (${response.status})`);
    const text=await response.text();
    const doc=new DOMParser().parseFromString(text,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('XML inválido');
    state.doc=doc;
    parseModel();
    state.ready=true;
    $('#model-status').textContent='modelo ArchiMate carregado';
    $('#model-status').classList.add('ok');
    $('#context-count').textContent=`${state.elements.size} elementos · ${state.relations.size} relações`;
    populateSourceDrivenUI();
    buildViewTabs();
    selectView('view-motivation');
    $('#model-loading').style.display='none';
  }catch(error){
    console.error(error);
    $('#model-status').textContent='modelo indisponível';
    $('#model-status').classList.add('error');
    $('#model-loading').innerHTML=`<div><strong>Não consegui ler o arquivo ArchiMate.</strong><br><small>${esc(error.message)}</small><br><br><a href="${MODEL_URL}" download>baixar o arquivo original</a></div>`;
    $('#context-count').textContent='arquivo fonte disponível';
  }
}

function parseModel(){
  state.elements.clear();state.relations.clear();state.views=[];
  for(const folder of state.doc.querySelectorAll('folder')){
    const layer=folder.getAttribute('type')||'';
    for(const el of direct(folder,'element')){
      const type=xtype(el),id=el.getAttribute('id');
      if(!id)continue;
      if(type.endsWith('Relationship')){
        state.relations.set(id,{id,type,source:el.getAttribute('source'),target:el.getAttribute('target')});
      }else if(type==='ArchimateDiagramModel'){
        state.views.push({id,name:el.getAttribute('name')||id,node:el});
      }else{
        state.elements.set(id,{id,name:el.getAttribute('name')||id,type,layer,folder:folder.getAttribute('name')||layer});
      }
    }
  }
  state.views.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true}));
}

const elemsByType=type=>[...state.elements.values()].filter(e=>e.type===type);
const elem=id=>state.elements.get(id);
const names=ids=>ids.map(id=>elem(id)).filter(Boolean);

function populateSourceDrivenUI(){
  const requirements=[...elemsByType('Goal'),...elemsByType('Requirement'),...elemsByType('Principle'),...elemsByType('Outcome')];
  $('#problem-requirements').innerHTML=requirements.map(e=>`<span>${esc(e.name)}</span>`).join('');

  const processes=names(['process-prever','process-recomendar','process-excecao','process-pedido','process-aprender']);
  $('#business-process').innerHTML=processes.map((e,i)=>`${i?'<span class="process-arrow">→</span>':''}<div class="process-step"><strong>${esc(e.name)}</strong></div>`).join('');

  const rolePairs=[['role-planejador','Previsão'],['role-gerente','Exceções'],['role-comprador','Pedido'],['role-steward','Medição e dados']];
  $('#business-roles').innerHTML=rolePairs.map(([id,job])=>elem(id)?`<div><strong>${esc(elem(id).name)}</strong><small>${job}</small></div>`:'').join('');

  const sourceIds=['app-pdv','app-erp','app-wms','app-promocoes','app-clima'];
  $('#data-sources').innerHTML=names(sourceIds).map(e=>`<span>${esc(e.name)}</span>`).join('');

  const pipeIds=['app-ingestao','data-raw','app-features','data-curated','app-ml','app-regras','app-api','app-portal'];
  $('#data-pipeline').innerHTML=names(pipeIds).map((e,i)=>`${i?'<span class="pipeline-arrow">→</span>':''}<div class="pipeline-step"><b>${String(i+1).padStart(2,'0')}</b><strong>${esc(e.name)}</strong></div>`).join('');

  const techIds=['node-lojas','network-vpn','tech-dms','tech-kinesis','tech-s3','tech-glue','tech-sagemaker','tech-lambda','tech-aurora','tech-iam','tech-monitor','artifact-model'];
  $('#tech-grid').innerHTML=names(techIds).map(e=>`<div class="tech-item"><small>${esc(cleanType(e.type))}</small><strong>${esc(e.name)}</strong></div>`).join('');

  const phases=elemsByType('WorkPackage').filter(e=>/^Fase [A-H]:/.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name));
  $('#adm-grid').innerHTML=phases.map(e=>{const phase=e.name.match(/^Fase ([A-H]):/)[1];const title=e.name.replace(/^Fase [A-H]:\s*/,'');return `<div class="adm-card" data-element="${e.id}"><b>${phase}</b><strong>${esc(title)}</strong></div>`}).join('');
  $$('#adm-grid .adm-card').forEach(c=>c.addEventListener('click',()=>{showScreen('model');focusElement(c.dataset.element)}));
}

function buildViewTabs(){
  const tabs=$('#view-tabs');tabs.innerHTML='';
  state.views.forEach(v=>{
    const b=document.createElement('button');b.type='button';b.dataset.view=v.id;b.textContent=v.name.replace(/^\d+\.\s*/,'');
    b.addEventListener('click',()=>selectView(v.id));tabs.appendChild(b);
  });
  $('#zoom-in').addEventListener('click',()=>setZoom(state.zoom+.12));
  $('#zoom-out').addEventListener('click',()=>setZoom(state.zoom-.12));
  $('#fit-view').addEventListener('click',fitView);
  $('#model-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchModel()});
}

function selectView(id,keepSelection=false){
  const view=state.views.find(v=>v.id===id);if(!view)return;
  state.currentView=view;state.zoom=1;if(!keepSelection)state.selected=null;
  $$('#view-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  renderView();
  requestAnimationFrame(fitView);
  if(!state.selected)renderEmptyDetail();
}

function collectView(view){
  const groups=[],nodes=[],notes=[],refs=[],connections=[];
  function walk(parent,ox=0,oy=0){
    for(const c of direct(parent,'child')){
      const type=xtype(c),[x,y,w,h]=getBounds(c),ax=ox+x,ay=oy+y;
      if(type==='Group'){groups.push({id:c.id,name:c.getAttribute('name')||'',fill:c.getAttribute('fillColor')||'#eef0ec',x:ax,y:ay,w,h});walk(c,ax,ay)}
      else if(type==='DiagramObject'){nodes.push({id:c.id,elementId:c.getAttribute('archimateElement'),x:ax,y:ay,w,h,connections:direct(c,'sourceConnection')})}
      else if(type==='Note'){notes.push({id:c.id,text:c.getAttribute('content')||'',x:ax,y:ay,w,h})}
      else if(type==='DiagramModelReference'){refs.push({id:c.id,model:c.getAttribute('model'),x:ax,y:ay,w,h})}
    }
  }
  walk(view.node);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  for(const n of nodes){
    for(const c of n.connections){
      const target=byId.get(c.getAttribute('target'));
      if(target)connections.push({id:c.id,source:n,target,relationId:c.getAttribute('relationship')});
    }
  }
  let w=840,h=500;[...groups,...nodes,...notes,...refs].forEach(n=>{w=Math.max(w,n.x+n.w+30);h=Math.max(h,n.y+n.h+30)});
  return{groups,nodes,notes,refs,connections,w,h};
}

function renderView(){
  if(!state.currentView)return;
  const svg=$('#architecture-svg');svg.innerHTML='';
  const L=collectView(state.currentView);state.lastLayout=L;svg.setAttribute('viewBox',`0 0 ${L.w} ${L.h}`);
  const ns='http://www.w3.org/2000/svg';
  const defs=document.createElementNS(ns,'defs');defs.innerHTML='<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#5f7a70"/></marker>';svg.appendChild(defs);

  L.groups.forEach(g=>{const grp=document.createElementNS(ns,'g');const rect=document.createElementNS(ns,'rect');attrs(rect,{x:g.x,y:g.y,width:g.w,height:g.h,fill:g.fill,'fill-opacity':.7,rx:16,class:'diagram-group'});grp.appendChild(rect);grp.appendChild(textEl(g.x+14,g.y+20,g.name,'diagram-group-title'));svg.appendChild(grp)});
  L.connections.forEach(c=>{const s=c.source,t=c.target,sx=s.x+s.w,sy=s.y+s.h/2,tx=t.x,ty=t.y+t.h/2,m=(sx+tx)/2;const p=document.createElementNS(ns,'path');attrs(p,{d:`M ${sx} ${sy} C ${m} ${sy}, ${m} ${ty}, ${tx} ${ty}`,class:'diagram-connection','data-source':s.elementId,'data-target':t.elementId,'marker-end':'url(#arrow)'});svg.appendChild(p)});
  L.refs.forEach(n=>svg.appendChild(referenceGroup(n,ns)));
  L.nodes.forEach(n=>svg.appendChild(nodeGroup(n,ns)));
  L.notes.forEach(n=>svg.appendChild(noteGroup(n,ns)));
  applySelection();setZoom(state.zoom);
}

function nodeGroup(n,ns){
  const e=state.elements.get(n.elementId)||{name:n.elementId||'Elemento',type:'Element',layer:''};
  const g=document.createElementNS(ns,'g');g.classList.add('diagram-node');g.dataset.element=n.elementId;
  const r=document.createElementNS(ns,'rect');attrs(r,{x:n.x,y:n.y,width:n.w,height:n.h,fill:layerColors[e.layer]||'#eceeea'});g.appendChild(r);
  g.appendChild(textEl(n.x+10,n.y+14,cleanType(e.type).toUpperCase(),'node-type'));
  wrapText(g,e.name,n.x+10,n.y+30,n.w-20,11,ns,Math.max(1,Math.floor((n.h-28)/13)));
  g.addEventListener('click',ev=>{ev.stopPropagation();selectElement(n.elementId)});return g;
}

function noteGroup(n,ns){const g=document.createElementNS(ns,'g');g.classList.add('diagram-note');const r=document.createElementNS(ns,'rect');attrs(r,{x:n.x,y:n.y,width:n.w,height:n.h});g.appendChild(r);wrapText(g,n.text,n.x+12,n.y+20,n.w-24,9,ns,Math.max(2,Math.floor((n.h-16)/12)));return g}
function referenceGroup(n,ns){const g=document.createElementNS(ns,'g');g.classList.add('diagram-reference');const r=document.createElementNS(ns,'rect');attrs(r,{x:n.x,y:n.y,width:n.w,height:n.h});g.appendChild(r);const v=state.views.find(x=>x.id===n.model);wrapText(g,v?.name||n.model,n.x+14,n.y+28,n.w-28,11,ns,3);g.addEventListener('click',()=>selectView(n.model));return g}
function textEl(x,y,text,cls){const t=document.createElementNS('http://www.w3.org/2000/svg','text');attrs(t,{x,y,class:cls});t.textContent=text;return t}
function attrs(el,obj){Object.entries(obj).forEach(([k,v])=>el.setAttribute(k,v))}
function wrapText(group,text,x,y,width,size,ns,maxLines=3){const max=Math.max(8,Math.floor(width/(size*.58))),words=(text||'').split(/\s+/);let lines=[''];for(const word of words){const i=lines.length-1;if((lines[i]+' '+word).trim().length<=max)lines[i]=(lines[i]+' '+word).trim();else if(lines.length<maxLines)lines.push(word);else{lines[i]=lines[i].replace(/…?$/,'')+'…';break}}lines.forEach((line,i)=>{const t=document.createElementNS(ns,'text');attrs(t,{x,y:y+i*(size+2)});t.textContent=line;group.appendChild(t)})}

function selectElement(id){state.selected=id;renderDetail(id);applySelection()}
function applySelection(){
  const selected=state.selected;if(!selected){$$('.diagram-node,.diagram-connection').forEach(x=>x.classList.remove('dimmed','selected'));return}
  const linked=new Set([selected]);for(const r of state.relations.values())if(r.source===selected||r.target===selected){linked.add(r.source);linked.add(r.target)}
  $$('.diagram-node').forEach(n=>{const id=n.dataset.element;n.classList.toggle('selected',id===selected);n.classList.toggle('dimmed',!linked.has(id))});
  $$('.diagram-connection').forEach(c=>c.classList.toggle('dimmed',c.dataset.source!==selected&&c.dataset.target!==selected));
}
function renderEmptyDetail(){$('#detail-panel').innerHTML='<span class="detail-label">inspector</span><h3>Selecione um elemento</h3><p>Clique em uma caixa para ver seu tipo e suas relações.</p>'}
function renderDetail(id){
  const e=state.elements.get(id);if(!e)return;
  const incoming=[],outgoing=[];for(const r of state.relations.values()){if(r.target===id)incoming.push(r);if(r.source===id)outgoing.push(r)}
  const rels=(arr,dir)=>arr.length?`<div class="relation-list">${arr.map(r=>{const other=state.elements.get(dir==='in'?r.source:r.target);return `<div class="relation-item">${esc(cleanType(r.type))}<strong>${dir==='in'?'←':'→'} ${esc(other?.name||'Elemento')}</strong></div>`}).join('')}</div>`:'<p>nenhuma relação nesta direção</p>';
  $('#detail-panel').innerHTML=`<span class="detail-label">${esc(layerName(e.layer))} · ${esc(cleanType(e.type))}</span><h3>${esc(e.name)}</h3><p><code>${esc(e.id)}</code></p><div><strong>Entrada</strong>${rels(incoming,'in')}</div><div style="margin-top:14px"><strong>Saída</strong>${rels(outgoing,'out')}</div>`;
}
function layerName(layer){return({motivation:'Motivação',strategy:'Estratégia',business:'Negócio',application:'Aplicações e dados',technology:'Tecnologia',implementation_migration:'Implementação'})[layer]||layer}

function focusElement(id){
  if(!state.ready)return;
  const view=state.views.find(v=>v.node.querySelector(`[archimateElement="${CSS.escape(id)}"]`));
  state.selected=id;if(view&&state.currentView?.id!==view.id)selectView(view.id,true);else renderView();
  renderDetail(id);requestAnimationFrame(fitView);
}
function searchModel(){const q=$('#model-search').value.trim().toLowerCase();if(!q)return;const match=[...state.elements.values()].find(e=>e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q));if(match)focusElement(match.id)}
function setZoom(z){state.zoom=Math.min(1.8,Math.max(.3,z));const svg=$('#architecture-svg'),L=state.lastLayout;if(!L)return;svg.style.width=`${Math.round(L.w*state.zoom)}px`;svg.style.height=`${Math.round(L.h*state.zoom)}px`}
function fitView(){const wrap=$('.model-canvas-wrap'),L=state.lastLayout;if(!wrap||!L)return;const z=Math.min(1,(wrap.clientWidth-26)/L.w);setZoom(z);wrap.scrollTo({left:0,top:0,behavior:'smooth'})}

const answers={
  problema:{screen:'problem',text:'O problema modelado é a combinação de descarte elevado e ruptura de estoque, agravada por previsão em planilhas e sistemas operacionais fragmentados.'},
  freshflow:{screen:'data',text:'O FreshFlow recebe PDV, ERP, estoque, promoções e clima, prepara os dados, prevê demanda, gera recomendação de reposição e envia a decisão para revisão humana antes do pedido.'},
  togaf:{screen:'roadmap',text:'O TOGAF ADM organiza a transformação em oito fases, da visão e arquitetura de negócio até dados, tecnologia, migração, governança e gestão de mudanças.'},
  archimate:{screen:'model',text:'O ArchiMate é a linguagem usada no arquivo original para representar as relações entre motivação, negócio, aplicações, dados, tecnologia e implementação.'},
  humano:{screen:'business',text:'O princípio central é humano no loop: a IA recomenda e o responsável pode aceitar, ajustar ou rejeitar a recomendação com justificativa.'},
  tecnologia:{screen:'technology',text:'A arquitetura tecnológica de referência usa AWS DMS, Kinesis, S3, Glue, SageMaker, Lambda e API Gateway, Aurora, IAM, KMS, Secrets Manager e CloudWatch.'}
};
function answerQuestion(key){const a=answers[key]||answers.freshflow;$('#ask-answer').hidden=false;$('#ask-answer').innerHTML=`${esc(a.text)} <button class="text-link" id="answer-open">abrir seção →</button>`;$('#answer-open').addEventListener('click',()=>showScreen(a.screen))}
function runAsk(){const q=$('#ask-input').value.trim().toLowerCase();if(!q)return;let key='freshflow';if(/problema|descarte|ruptura/.test(q))key='problema';else if(/togaf|adm|fase/.test(q))key='togaf';else if(/archi|modelo|diagrama/.test(q))key='archimate';else if(/humano|decis|gestor|aceita|rejeita/.test(q))key='humano';else if(/aws|tecnologia|cloud|s3|sagemaker/.test(q))key='tecnologia';answerQuestion(key)}

initNavigation();
loadModel();
