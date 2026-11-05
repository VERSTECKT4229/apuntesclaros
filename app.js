// ==LOGIC==
const NONE = 'Sin clasificar';
const MAX_BYTES = 8 * 1024 * 1024;
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function validateFile(f){
  if(!f || !f.type || !f.type.startsWith('image/')) return 'No es una imagen: ' + (f && f.name);
  if(f.size > MAX_BYTES) return 'Pesa más de 8 MB: ' + f.name;
  return null;
}
function classify(text, subjects){
  const t = norm(text); let best = NONE, bestN = 0;
  for(const s of subjects){
    let n = 0;
    for(const k of s.keywords){ const kk = norm(k).trim(); if(kk && t.includes(kk)) n++; }
    if(norm(s.name).trim() && t.includes(norm(s.name).trim())) n++;
    if(n > bestN){ best = s.name; bestN = n; }
  }
  return best;
}
function searchPhotos(photos, q){
  const t = norm(q).trim(); if(!t) return photos;
  return photos.filter(p => norm(p.name + ' ' + p.note).includes(t));
}
function pendingBySubject(photos){
  const r = {}; photos.filter(p => !p.reviewed).forEach(p => r[p.subject] = (r[p.subject]||0)+1); return r;
}
function buildBackup(subjects,photos){
  return JSON.stringify({app:'ApuntesClaros',version:1,date:new Date().toISOString(),subjects,photos});
}
function parseBackup(text){
  let d; try{ d = JSON.parse(text); }catch(e){ return {ok:false,error:'El archivo no se pudo leer como respaldo.'}; }
  if(!d || d.app !== 'ApuntesClaros') return {ok:false,error:'Este archivo no es un respaldo de ApuntesClaros.'};
  if(d.version !== 1) return {ok:false,error:'Versión de respaldo no compatible.'};
  if(!Array.isArray(d.subjects) || !Array.isArray(d.photos)) return {ok:false,error:'Al respaldo le faltan datos.'};
  for(const s of d.subjects){ if(!s || typeof s.name!=='string' || !s.name.trim() || !Array.isArray(s.keywords)) return {ok:false,error:'Hay una materia inválida en el respaldo.'}; }
  for(const p of d.photos){ if(!p || typeof p.id!=='string' || typeof p.subject!=='string' || typeof p.dataUrl!=='string' || !p.dataUrl.startsWith('data:image/')) return {ok:false,error:'Hay una foto inválida en el respaldo.'}; }
  return {ok:true,subjects:d.subjects,photos:d.photos};
}
// ==/LOGIC==
const COLORS=['#f4d35e','#9fd8b0','#f2a7b5','#9cc9ea','#c9b1e8','#f6b26b'];
const DEFAULTS=[{name:'Cálculo III',keywords:['integral','gradiente','derivada parcial','vector','multivariable','calculo'],color:COLORS[0]},
{name:'Sistemas y ensambladores',keywords:['circuito','logisim','acarreo','binario','ensamblador'],color:COLORS[1]},
{name:'Prácticas ágiles',keywords:['scrum','sprint','backlog','historia de usuario','agil'],color:COLORS[2]},
{name:'Programación',keywords:['codigo','python','java','funcion','algoritmo'],color:COLORS[3]}];
let db,subjects=[],photos=[],S={view:'home',subj:null,corte:'Todos'};
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
function open(){return new Promise((a,b)=>{const r=indexedDB.open('apuntesclaros',1);r.onupgradeneeded=()=>{r.result.createObjectStore('photos',{keyPath:'id'});r.result.createObjectStore('subjects',{keyPath:'name'});};r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error);});}
const tx=(st,m,f)=>new Promise((a,b)=>{const q=f(db.transaction(st,m).objectStore(st));q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error);});
const all=s=>tx(s,'readonly',o=>o.getAll()),put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
const colorOf=n=>(subjects.find(s=>s.name===n)||{}).color||'#cfcfcf';
const corteOf=p=>p.corte||1;
function shrink(f){return new Promise((a,b)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const k=Math.min(1,1280/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);a(c.toDataURL('image/jpeg',.8));};i.onerror=()=>{URL.revokeObjectURL(u);b(new Error('No se pudo leer '+f.name));};i.src=u;});}
async function refresh(){subjects=await all('subjects');photos=await all('photos');render();}

function repairStoredText(text){
  return String(text||'')
    .replaceAll('CÃ¡lculo III','Cálculo III')
    .replaceAll('PrÃ¡cticas Ã¡giles','Prácticas ágiles')
    .replaceAll('ProgramaciÃ³n','Programación')
    .replaceAll('CÃ³digo','Código')
    .replaceAll('Ã¡','á').replaceAll('Ã©','é').replaceAll('Ã­','í')
    .replaceAll('Ã³','ó').replaceAll('Ãº','ú').replaceAll('Ã±','ñ')
    .replaceAll('Â·','·');
}

async function repairStoredTexts(){
  let changed=false;
  for(const subject of subjects){
    const oldName=subject.name;
    const repaired=repairStoredText(oldName);
    if(repaired!==oldName){
      subject.name=repaired;
      await del('subjects',oldName);
      await put('subjects',subject);
      changed=true;
    }
    for(const photo of photos){
      if(repairStoredText(photo.subject===oldName?oldName:photo.subject)===repaired){
        photo.subject=repaired;
        await put('photos',photo);
        changed=true;
      }
    }
  }
  return changed;
}
function go(v,subj){S.view=v;if(subj!==undefined)S.subj=subj;S.corte='Todos';render();}

function render(){const v=$('v');v.innerHTML='';({home,subject,upload,subjects:subjectsView,summary}[S.view]||home)(v);}

function home(v){
  const p=pendingBySubject(photos),n=Object.values(p).reduce((a,b)=>a+b,0);
  const b=el('div','sheet');b.innerHTML=n?'<b>Te faltan '+n+' fotos por revisar</b><br>'+Object.entries(p).map(([k,x])=>k+': '+x).join('  ·  '):'<b>Todo al día</b><br>No tienes fotos pendientes.';v.appendChild(b);
  v.appendChild(el('h2',0,'Mis materias'));
  const g=el('div','cards');
  subjects.forEach(s=>{const c=el('div','nb');c.style.setProperty('--c',s.color);const tot=photos.filter(x=>x.subject===s.name).length;
    c.append(el('b',0,s.name),el('div','mu',tot+' fotos'),el('span','pill',(p[s.name]||0)+' sin revisar'));c.onclick=()=>go('subject',s.name);g.appendChild(c);});
  const o=photos.filter(x=>x.subject===NONE).length;
  if(o){const c=el('div','nb');c.style.setProperty('--c','#cfcfcf');c.append(el('b',0,NONE),el('div','mu',o+' fotos'));c.onclick=()=>go('subject',NONE);g.appendChild(c);}
  v.appendChild(g);
  v.appendChild(el('h2',0,'Respaldo'));
  const bk=el('div','panel'),msg=el('div','msg mu','');
  bk.appendChild(el('div','mu','Guarda un archivo con todas tus fotos, materias y notas, y cárgalo cuando quieras recuperarlas.'));
  const row=el('div','row'),ex=el('button','main','Exportar respaldo'),im=el('input');im.type='file';im.accept='.json,application/json';
  ex.onclick=()=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([buildBackup(subjects,photos)],{type:'application/json'}));
    a.download='respaldo-apuntesclaros-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    msg.textContent='Respaldo exportado: '+subjects.length+' materias y '+photos.length+' fotos.';
  };
  im.onchange=async()=>{
    const f=im.files[0];if(!f)return;
    const r=parseBackup(await f.text());
    if(!r.ok){msg.textContent='No se importó: '+r.error;return;}
    if(!confirm('Se agregarán '+r.photos.length+' fotos y '+r.subjects.length+' materias. Si ya existen, se reemplazan con las del respaldo. \u00bfContinuar?'))return;
    try{for(const s of r.subjects)await put('subjects',s);for(const p of r.photos)await put('photos',p);}
    catch(e){msg.textContent='Error al guardar: '+e.message;return;}
    await refresh();
  };
  row.append(ex,im);bk.append(row,msg);v.appendChild(bk);
}
function subject(v){
  const name=S.subj,col=colorOf(name);
  v.append(el('h2',0,name));
  const bar=el('div','top');const tabs=el('div','tabs');
  ['Todos',1,2,3].forEach(c=>{const b=el('button',c===S.corte?'on':'',c==='Todos'?'Todos':'Corte '+c);b.style.setProperty('--c',col);b.onclick=()=>{S.corte=c;render();};tabs.appendChild(b);});
  const act=el('nav');const u=el('button','main','+ Subir');u.onclick=()=>go('upload',name);const r=el('button',0,'Resumen');r.onclick=()=>go('summary',name);act.append(u,r);bar.append(tabs,act);v.appendChild(bar);if(subjects.some(s=>s.name===name))v.appendChild(voicePanel(name));
  let list=photos.filter(p=>p.subject===name&&(S.corte==='Todos'||corteOf(p)===S.corte)).sort((a,b)=>b.date.localeCompare(a.date));
  const q=el('input');q.type='search';q.placeholder='Buscar en notas';q.oninput=()=>draw(searchPhotos(list,q.value));v.appendChild(q);
  const g=el('div','grid');v.appendChild(g);const e=el('p','mu','Aún no hay apuntes aquí.');v.appendChild(e);
  function draw(l){g.innerHTML='';e.hidden=l.length>0;l.forEach((p,i)=>g.appendChild(card(p,i,col)));}draw(list);
}
const DICT_ERR={
  'not-allowed':'El navegador bloqueó el micrófono. Permite el acceso desde el candado de la dirección e inténtalo de nuevo.',
  'service-not-allowed':'El dictado fue bloqueado por el navegador. Usa Chrome o Edge sobre HTTPS o Live Server.',
  'network':'El dictado necesita Internet. Revisa tu conexión e inténtalo de nuevo.',
  'no-speech':'No se detectó voz. Revisa el micrófono y habla más cerca.',
  'audio-capture':'No se encontró un micrófono disponible. Conecta uno y vuelve a intentarlo.',
  'language-not-supported':'El idioma español no está disponible en este navegador.',
  'aborted':'El dictado se detuvo antes de reconocer texto. Inténtalo de nuevo.'
};

function voicePanel(name){
  const subjectData=subjects.find(x=>x.name===name);
  const p=el('div','panel');
  p.appendChild(el('b',0,'Notas por voz'));

  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const info=el('div','mu',SpeechRecognition
    ? 'Pulsa «Dictar», habla con calma y espera a que aparezca el texto antes de detenerlo.'
    : 'Este navegador no admite dictado por voz. Usa Chrome o Edge, o escribe la nota directamente.');
  const ta=el('textarea');
  ta.rows=4;
  ta.style.cssText='width:100%;margin:8px 0';
  ta.placeholder='Aquí aparecerá el texto dictado. También puedes escribir o pegar una nota.';
  const row=el('div','row');
  const mic=el('button','main','Dictar');
  const cs=el('select');
  [1,2,3].forEach(c=>{const option=el('option',0,'Corte '+c);option.value=c;cs.appendChild(option);});
  if(S.corte!=='Todos') cs.value=S.corte;
  const save=el('button',0,'Guardar nota');
  const msg=el('span','mu','');
  let recognition=null;
  let shouldListen=false;
  let baseText='';
  let lastFinal='';
  let restartTimer=null;

  mic.onclick=async()=>{
    if(!SpeechRecognition){msg.textContent='Dictado no disponible en este navegador.';return;}
    if(recognition){
      shouldListen=false;
      clearTimeout(restartTimer);
      recognition.stop();
      return;
    }
    if(location.protocol==='file:'){
      msg.textContent='Para que el micrófono funcione, abre la página con Live Server (localhost).';
    }
    try{
      if(navigator.mediaDevices?.getUserMedia){
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        stream.getTracks().forEach(track=>track.stop());
      }
      recognition=new SpeechRecognition();
      recognition.lang='es-CO';
      recognition.continuous=true;
      recognition.interimResults=true;
      recognition.maxAlternatives=1;
      shouldListen=true;
      baseText=ta.value.trim();
      lastFinal='';

      recognition.onstart=()=>{
        mic.textContent='Parar';
        mic.classList.add('on');
        msg.textContent='Escuchando... habla ahora.';
      };
      recognition.onresult=event=>{
        let interim='';
        let final='';
        for(let i=event.resultIndex;i<event.results.length;i++){
          const text=event.results[i][0].transcript.trim();
          if(text) (event.results[i].isFinal?final+=text+' ':interim+=text);
        }
        if(final){
          lastFinal+=final;
        }
        const separator=baseText && (lastFinal || interim) ? ' ' : '';
        ta.value=(baseText+separator+lastFinal+interim).trim();
      };
      recognition.onerror=event=>{
        if(event.error==='no-speech' && shouldListen){
          msg.textContent='No escuché nada todavía. Sigue hablando o pulsa Parar.';
          return;
        }
        if(event.error==='aborted' && shouldListen){
          msg.textContent='El dictado se reiniciará automáticamente.';
          return;
        }
        shouldListen=false;
        msg.textContent=DICT_ERR[event.error] || ('No fue posible dictar: '+event.error);
      };
      recognition.onend=()=>{
        recognition=null;
        mic.textContent='Dictar';
        mic.classList.remove('on');
        if(shouldListen){
          msg.textContent='Reconectando el dictado...';
          restartTimer=setTimeout(()=>{
            if(!shouldListen)return;
            mic.click();
          },350);
        }
      };
      recognition.start();
      mic.textContent='Parar';
      mic.classList.add('on');
      msg.textContent='Escuchando... habla ahora.';
    }catch(error){
      recognition=null;
      msg.textContent='No se pudo activar el micrófono: '+(error.message||error.name);
    }
  };

  save.onclick=async()=>{
    const text=ta.value.trim();
    if(!text){msg.textContent='Escribe o dicta una nota antes de guardar.';return;}
    if(recognition){shouldListen=false;clearTimeout(restartTimer);recognition.stop();}
    subjectData.voiceNotes=[...(subjectData.voiceNotes||[]),{
      id:Date.now()+'-'+Math.random().toString(36).slice(2,7),
      text,corte:+cs.value,date:new Date().toISOString()
    }];
    await put('subjects',subjectData);
    ta.value='';
    msg.textContent='Nota guardada.';
    refresh();
  };

  row.append(mic,cs,save,msg);
  p.append(info,ta,row);

  (subjectData.voiceNotes||[])
    .filter(n=>S.corte==='Todos'||n.corte===S.corte)
    .slice().reverse()
    .forEach(n=>{
      const d=el('div','row');
      d.append(el('span','mu','Corte '+n.corte+' · '+new Date(n.date).toLocaleDateString('es-CO')+': '),el('span',0,n.text));
      const remove=el('button',0,'Borrar');
      remove.onclick=async()=>{
        if(!confirm('¿Borrar esta nota de voz?'))return;
        subjectData.voiceNotes=subjectData.voiceNotes.filter(y=>y.id!==n.id);
        await put('subjects',subjectData);
        refresh();
      };
      d.appendChild(remove);
      p.appendChild(d);
    });
  return p;
}

function card(p,i,col){
  const d=el('div','ph'+(p.reviewed?' done':''));d.style.setProperty('--c',col);d.style.setProperty('--r',((i*37)%7-3)*.5+'deg');
  const im=el('img');im.src=p.dataUrl;im.alt=p.note||p.name;im.onclick=()=>{$('big').querySelector('img').src=p.dataUrl;$('big').style.display='flex';};
  const t=el('div','t',p.note||p.name);const m=el('div','mu','Corte '+corteOf(p)+'  ·  '+new Date(p.date).toLocaleDateString('es-CO'));
  const row=el('div','row');
  const sel=el('select');[...subjects.map(s=>s.name),NONE].forEach(o=>{const x=el('option',0,o);x.value=o;if(o===p.subject)x.selected=true;sel.appendChild(x);});
  sel.onchange=async()=>{p.subject=sel.value;await put('photos',p);refresh();};
  const cs=el('select');[1,2,3].forEach(c=>{const x=el('option',0,'C'+c);x.value=c;if(c===corteOf(p))x.selected=true;cs.appendChild(x);});
  cs.onchange=async()=>{p.corte=+cs.value;await put('photos',p);refresh();};
  const rv=el('button',0,p.reviewed?'Pendiente':'Revisada');rv.onclick=async()=>{p.reviewed=!p.reviewed;await put('photos',p);refresh();};
  const x=el('button',0,'Borrar');x.onclick=async()=>{if(confirm('\u00bfBorrar esta foto?')){await del('photos',p.id);refresh();}};
  row.append(sel,cs,rv,x);d.append(im,t,m,row);return d;
}
function upload(v){
  v.append(el('h2',0,'Subir fotos'));const p=el('div','panel');
  p.innerHTML='<div class="row"><input type="file" id="f" accept="image/*" multiple></div><div class="row"><input id="n" size="30" placeholder="Nota (ej: integrales dobles, clase 12)"></div><div class="row"><select id="s"></select><select id="c"><option value="1">Corte 1</option><option value="2">Corte 2</option><option value="3">Corte 3</option></select><button class="main" id="go">Guardar</button></div><div class="msg" id="m"></div>';
  v.appendChild(p);const s=$('s');
  [['auto','Detectar materia automáticamente'],...subjects.map(x=>[x.name,x.name])].forEach(([a,b])=>{const o=el('option',0,b);o.value=a;s.appendChild(o);});
  if(S.subj&&subjects.some(x=>x.name===S.subj))s.value=S.subj;
  $('go').onclick=async()=>{
    const fs=[...$('f').files],note=$('n').value.trim(),m=$('m');
    if(!fs.length){m.textContent='Elige al menos una foto.';return;}
    let ok=0,sorted=0,errs=[];
    for(const f of fs){const e=validateFile(f);if(e){errs.push(e);continue;}
      try{const d=await shrink(f);const subj=s.value==='auto'?classify(f.name+' '+note,subjects):s.value;
        await put('photos',{id:Date.now()+'-'+Math.random().toString(36).slice(2,7),name:f.name,note,subject:subj,corte:+$('c').value,date:new Date().toISOString(),reviewed:false,dataUrl:d});ok++;if(subj!==NONE)sorted++;}
      catch(x){errs.push(x.message);}}
    photos=await all('photos');m.textContent=ok+' guardada(s), '+sorted+' con materia.'+(errs.length?' Errores: '+errs.join('; '):'');
  };
}
function subjectsView(v){
  v.append(el('h2',0,'Materias y palabras clave'));const p=el('div','panel');
  subjects.forEach(s=>{const r=el('div','row');const c=el('span','pill',s.name);c.style.setProperty('--c',s.color);
    const x=el('button',0,'Quitar');x.onclick=async()=>{const own=photos.filter(p=>p.subject===s.name);if(!confirm('\u00bfQuitar '+s.name+'?'+(own.length?' Sus '+own.length+' fotos pasarán a "Sin clasificar".':'')))return;for(const p of own){p.subject=NONE;await put('photos',p);}await del('subjects',s.name);refresh();};r.append(c,el('span','mu',s.keywords.join(', ')),x);p.appendChild(r);});
  v.appendChild(p);const f=el('div','panel');f.innerHTML='<div class="row"><input id="sn" placeholder="Nueva materia"><input id="sk" size="30" placeholder="palabras clave, separadas por coma"><button class="main" id="sa">Agregar</button></div><div class="msg" id="sm"></div>';v.appendChild(f);
  $('sa').onclick=async()=>{const n=$('sn').value.trim();if(!n)return;if(subjects.some(s=>norm(s.name)===norm(n))){$('sm').textContent='Esa materia ya existe.';return;}
    await put('subjects',{name:n,keywords:$('sk').value.split(',').map(k=>k.trim()).filter(Boolean),color:COLORS[subjects.length%COLORS.length]});refresh();};
}
function summary(v){
  v.append(el('h2',0,'Resumen para estudiar'));const p=el('div','panel');
  p.innerHTML='<div class="mu">Genera un PDF con las fotos de una materia y corte, para dárselo a una IA que lea las imágenes.</div><div class="row"><select id="rs"></select><select id="rc"><option value="Todos">Todos los cortes</option><option value="1">Corte 1</option><option value="2">Corte 2</option><option value="3">Corte 3</option></select><button class="main" id="rg">Generar PDF</button></div><div class="msg" id="rm"></div>';
  v.appendChild(p);subjects.forEach(s=>{const o=el('option',0,s.name);o.value=s.name;$('rs').appendChild(o);});
  if(subjects.some(s=>s.name===S.subj))$('rs').value=S.subj;
  $('rg').onclick=()=>{const n=$('rs').value,c=$('rc').value;
    const l=photos.filter(x=>x.subject===n&&(c==='Todos'||corteOf(x)===+c)).sort((a,b)=>a.date.localeCompare(b.date));
    const sj=subjects.find(x=>x.name===n)||{},nt=(sj.voiceNotes||[]).filter(x=>c==='Todos'||x.corte===+c);
    if(!l.length&&!nt.length){$('rm').textContent='No hay fotos ni notas para esa selección.';return;}
    const pr=$('print');pr.innerHTML='';const cv=el('div','cover');cv.append(el('h1',0,'Paquete de estudio'),el('h2',0,n),el('p',0,(c==='Todos'?'Todos los cortes':'Corte '+c)+'  ·  '+l.length+' fotos  ·  '+nt.length+' notas de voz'),el('p',0,'Instrucción sugerida para la IA: lee cada imagen, resume los temas y dime qué debo estudiar.'));pr.appendChild(cv);
    if(nt.length){const nd=el('div','item');nd.appendChild(el('h2',0,'Notas de voz'));nt.forEach(x=>nd.appendChild(el('p',0,'(Corte '+x.corte+') '+x.text)));pr.appendChild(nd);}
    l.forEach((x,i)=>{const it=el('div','item'+(i%2?' pb':''));const im=el('img');im.src=x.dataUrl;it.append(im,el('div',0,(i+1)+'. '+(x.note||x.name)+' (Corte '+corteOf(x)+', '+new Date(x.date).toLocaleDateString('es-CO')+')'));pr.appendChild(it);});
    $('rm').textContent='En la ventana de impresión elige "Guardar como PDF".';setTimeout(()=>window.print(),300);};
}
$('nHome').onclick=()=>go('home');$('nUp').onclick=()=>go('upload',null);$('nSub').onclick=()=>go('subjects');$('big').onclick=()=>$('big').style.display='none';
(async()=>{try{db=await open();subjects=await all('subjects');
  if(!subjects.length){for(const s of DEFAULTS)await put('subjects',s);}
  else{for(const s of subjects){if(!s.color){s.color=COLORS[subjects.indexOf(s)%COLORS.length];await put('subjects',s);}}}
  photos=await all('photos');
  const repaired=await repairStoredTexts();
  await refresh();
  if(repaired){console.info('Se corrigieron textos guardados con una codificación antigua.');}}catch(e){$('v').textContent='No se pudo abrir el almacenamiento local: '+e.message;}})();
