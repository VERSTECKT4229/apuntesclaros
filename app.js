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
let db,subjects=[],photos=[],notes=[],mediaUrls=[],S={view:'home',subj:null,corte:'Todos',editNoteId:null};
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
function open(){return new Promise((a,b)=>{const r=indexedDB.open('apuntesclaros',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'});if(!d.objectStoreNames.contains('subjects'))d.createObjectStore('subjects',{keyPath:'name'});if(!d.objectStoreNames.contains('notes'))d.createObjectStore('notes',{keyPath:'id'});if(!d.objectStoreNames.contains('audio')){const audio=d.createObjectStore('audio',{keyPath:'id'});audio.createIndex('noteId','noteId',{unique:false});}};r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error);r.onblocked=()=>b(new Error('Cierra otras pestañas de ApuntesClaros para actualizar el almacenamiento.'));});}
const tx=(st,m,f)=>new Promise((a,b)=>{const q=f(db.transaction(st,m).objectStore(st));q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error);});
const all=s=>tx(s,'readonly',o=>o.getAll()),put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
const colorOf=n=>(subjects.find(s=>s.name===n)||{}).color||'#cfcfcf';
const corteOf=p=>p.corte||1;
function shrink(f){return new Promise((a,b)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{try{const k=Math.min(1,1280/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(i.width*k));c.height=Math.max(1,Math.round(i.height*k));const context=c.getContext('2d');if(!context)throw new Error('El navegador no pudo preparar la imagen.');context.drawImage(i,0,0,c.width,c.height);a(c.toDataURL('image/jpeg',.8));}catch(e){b(e);}finally{URL.revokeObjectURL(u);}};i.onerror=()=>{URL.revokeObjectURL(u);b(new Error('No se pudo decodificar la imagen '+f.name));};i.src=u;});}
async function refresh(){subjects=await all('subjects');photos=await all('photos');notes=await all('notes');render();}
function storageError(error){
  if(error&&error.name==='QuotaExceededError')return 'Se agotó el espacio local del navegador. Libera espacio o elimina archivos e inténtalo de nuevo.';
  return 'No se pudieron guardar los cambios localmente: '+((error&&error.message)||'error de almacenamiento');
}
function releaseMediaUrls(){mediaUrls.forEach(url=>URL.revokeObjectURL(url));mediaUrls=[];}

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

function render(){releaseMediaUrls();const v=$('v');v.onpaste=null;v.innerHTML='';({home,subject,upload,subjects:subjectsView,summary,notes:notesView,noteForm:noteForm}[S.view]||home)(v);}

function home(v){
  const p=pendingBySubject(photos),n=Object.values(p).reduce((a,b)=>a+b,0);
  const reviewed=photos.filter(photo=>photo.reviewed).length;
  const progress=photos.length?Math.round(reviewed/photos.length*100):0;
  const dashboard=el('div','dashboard');
  dashboard.append(statCard(photos.length,'Apuntes','fotografías guardadas'),statCard(reviewed,'Revisados','apuntes completados'),statCard(progress+'%','Progreso','revisión general'),statCard(subjects.length,'Materias','organizadas'));
  v.appendChild(dashboard);
  const b=el('div','sheet');b.innerHTML=n?'<b>Te faltan '+n+' fotos por revisar</b><br>'+Object.entries(p).map(([k,x])=>k+': '+x).join('  ·  '):'<b>Todo al día</b><br>No tienes fotos pendientes.';v.appendChild(b);
  const notesLink=el('button','main','Abrir notas ('+notes.length+')');notesLink.onclick=()=>go('notes');v.appendChild(notesLink);
  v.appendChild(el('h2',0,'Mis materias'));
  const g=el('div','cards');
  subjects.forEach(s=>{const c=el('div','nb');c.style.setProperty('--c',s.color);const subjectPhotos=photos.filter(x=>x.subject===s.name);const tot=subjectPhotos.length;const reviewed=subjectPhotos.filter(x=>x.reviewed).length;const percent=tot?Math.round(reviewed/tot*100):0;
    const progress=el('div','subject-progress');progress.appendChild(el('span'));progress.firstChild.style.width=percent+'%';
    c.append(el('b',0,s.name),el('div','mu',tot+' fotos · '+percent+'% revisado'),el('span','pill',(p[s.name]||0)+' sin revisar'),progress);c.onclick=()=>go('subject',s.name);g.appendChild(c);});
  const o=photos.filter(x=>x.subject===NONE).length;
  if(o){const c=el('div','nb');c.style.setProperty('--c','#cfcfcf');c.append(el('b',0,NONE),el('div','mu',o+' fotos'));c.onclick=()=>go('subject',NONE);g.appendChild(c);}
  v.appendChild(g);
  const sampleButton=el('button',0,'Cargar datos de prueba');sampleButton.onclick=loadSampleNotes;v.appendChild(sampleButton);
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
const uid=()=>Date.now()+'-'+Math.random().toString(36).slice(2,9);
const get=(store,key)=>tx(store,'readonly',objectStore=>objectStore.get(key));
function saveNoteAndAudio(note,audioToSave,removedAudioIds){
  return new Promise((resolve,reject)=>{
    let transaction;
    try{
      transaction=db.transaction(['notes','audio'],'readwrite');
      transaction.objectStore('notes').put(note);
      removedAudioIds.forEach(id=>transaction.objectStore('audio').delete(id));
      audioToSave.forEach(clip=>transaction.objectStore('audio').put(clip));
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
      transaction.onabort=()=>reject(transaction.error||new Error('La transacción local fue cancelada.'));
    }catch(error){if(transaction)transaction.abort();reject(error);}
  });
}
function deleteNoteAndAudio(noteId){
  return new Promise((resolve,reject)=>{
    let transaction;
    try{
      transaction=db.transaction(['notes','audio'],'readwrite');
      transaction.objectStore('notes').delete(noteId);
      const request=transaction.objectStore('audio').index('noteId').openCursor(noteId);
      request.onsuccess=()=>{const cursor=request.result;if(cursor){cursor.delete();cursor.continue();}};
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
      transaction.onabort=()=>reject(transaction.error||new Error('La transacción local fue cancelada.'));
    }catch(error){if(transaction)transaction.abort();reject(error);}
  });
}
function notesView(v){
  v.append(el('h2',0,'Mis notas'));
  v.append(el('p','mu','Notas, imágenes y grabaciones se guardan en este navegador.'));
  const top=el('div','row'),add=el('button','main','+ Nueva nota'),samples=el('button',0,'Cargar datos de prueba');
  add.onclick=()=>{S.editNoteId=null;go('noteForm');};
  samples.onclick=loadSampleNotes;
  top.append(add,samples);v.appendChild(top);
  const controls=el('div','row'),search=el('input'),filter=el('select');
  search.type='search';search.placeholder='Buscar título, etiqueta o contenido';
  const allTags=el('option',0,'Todas las etiquetas');allTags.value='';filter.appendChild(allTags);
  [...new Set(notes.map(note=>note.tag).filter(Boolean))].sort().forEach(tag=>{const option=el('option',0,tag);option.value=tag;filter.appendChild(option);});
  controls.append(search,filter);v.appendChild(controls);
  const status=el('p','msg mu',''),list=el('div','cards');v.append(status,list);
  function draw(){
    const query=norm(search.value.trim()),tag=filter.value;
    const matches=notes.filter(note=>(!query||norm([note.title,note.tag,note.content].join(' ')).includes(query))&&(!tag||note.tag===tag))
      .slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    list.innerHTML='';
    if(!matches.length){list.appendChild(el('p','mu',notes.length?'No hay notas que coincidan.':'Aún no hay notas. Crea una o carga datos de prueba.'));return;}
    matches.forEach(note=>{
      const card=el('article','nb');card.style.setProperty('--c','#df735f');
      card.append(el('b',0,note.title),el('div','pill',note.tag||'Sin etiqueta'));
      if(note.content)card.appendChild(el('p','mu',note.content.length>150?note.content.slice(0,147)+'...':note.content));
      const details=el('div','mu',(note.images||[]).length+' imagen(es) · '+(note.audioIds||[]).length+' grabación(es)');
      card.appendChild(details);
      if(note.images&&note.images[0]){const image=el('img');image.src=note.images[0].dataUrl;image.alt=note.images[0].name||note.title;image.style.cssText='max-width:100%;max-height:140px;object-fit:cover;margin-top:8px';card.appendChild(image);}
      const actions=el('div','row'),edit=el('button',0,'Editar'),remove=el('button',0,'Borrar');
      edit.onclick=()=>{S.editNoteId=note.id;go('noteForm');};
      remove.onclick=async()=>{if(!confirm('¿Borrar la nota y sus grabaciones asociadas?'))return;try{await deleteNoteAndAudio(note.id);await refresh();}catch(error){status.textContent=storageError(error);}};
      actions.append(edit,remove);card.appendChild(actions);list.appendChild(card);
    });
  }
  search.oninput=draw;filter.onchange=draw;draw();
}
function noteForm(v){
  const current=notes.find(note=>note.id===S.editNoteId);
  const note=current||{id:uid(),title:'',tag:'',content:'',images:[],audioIds:[]};
  const images=(note.images||[]).slice(),newAudio=[],removedAudioIds=new Set();
  v.append(el('h2',0,current?'Editar nota':'Nueva nota'));
  const panel=el('section','panel'),title=el('input'),tag=el('input'),content=el('textarea');
  title.id='noteTitle';tag.id='noteTag';content.id='noteContent';
  title.placeholder='Título';title.maxLength=160;title.value=note.title;
  tag.placeholder='Etiqueta o categoría';tag.maxLength=60;tag.value=note.tag||'';
  content.placeholder='Escribe el contenido de la nota';content.rows=6;content.style.width='100%';content.value=note.content||'';
  const titleLabel=el('label',0,'Título'),tagLabel=el('label',0,'Etiqueta o categoría'),contentLabel=el('label',0,'Contenido');
  titleLabel.htmlFor=title.id;tagLabel.htmlFor=tag.id;contentLabel.htmlFor=content.id;
  panel.append(titleLabel,title,tagLabel,tag,contentLabel,content);
  const feedback=el('div','msg mu','');panel.appendChild(feedback);
  const file=el('input');file.type='file';file.accept='image/*';file.multiple=true;
  const pasteInfo=el('p','mu','También puedes pegar capturas con Ctrl+V dentro de este formulario.');
  const imageList=el('div','row');
  function drawImages(){
    imageList.innerHTML='';
    images.forEach((image,index)=>{
      const wrap=el('div','panel'),preview=el('img');preview.src=image.dataUrl;preview.alt=image.name||'Imagen adjunta';preview.style.cssText='display:block;max-width:180px;max-height:140px;object-fit:contain';
      const remove=el('button',0,'Quitar imagen');remove.onclick=()=>{images.splice(index,1);drawImages();};
      wrap.append(preview,el('span','mu',image.name||'Imagen'),remove);imageList.appendChild(wrap);
    });
  }
  async function addImageFiles(files){
    for(const imageFile of files){
      const error=validateFile(imageFile);
      if(error){feedback.textContent=error;continue;}
      try{const dataUrl=await shrink(imageFile);images.push({name:imageFile.name,dataUrl});feedback.textContent='Imagen validada y comprimida.';}
      catch(error){feedback.textContent='Imagen rechazada: '+error.message;}
    }
    drawImages();
  }
  file.onchange=()=>{addImageFiles(Array.from(file.files||[]));file.value='';};
  panel.append(el('label',0,'Imágenes adjuntas'),file,pasteInfo,imageList);drawImages();
  const audioHeading=el('h3',0,'Grabaciones de audio');
  const audioInfo=el('p','mu','Las grabaciones se guardan y pueden reproducirse o eliminarse. No se transcriben automáticamente.');
  const audioControls=el('div','row'),record=el('button','main','Iniciar grabación'),audioList=el('div','row');
  let recorder=null,stream=null,chunks=[];
  function renderAudio(clip,id,isNew){
    const row=el('div','panel');
    const label=el('span','mu',clip.name+' · '+(isNew?'Sin guardar':'Guardada localmente'));
    const player=el('audio');player.controls=true;player.preload='none';
    const url=URL.createObjectURL(clip.blob);mediaUrls.push(url);player.src=url;
    const remove=el('button',0,'Eliminar audio');
    remove.onclick=()=>{if(isNew){const index=newAudio.indexOf(clip);if(index>=0)newAudio.splice(index,1);}else removedAudioIds.add(id);URL.revokeObjectURL(url);mediaUrls=mediaUrls.filter(item=>item!==url);row.remove();};
    row.append(label,player,remove);audioList.appendChild(row);
  }
  (async()=>{
    for(const id of note.audioIds||[]){
      if(removedAudioIds.has(id))continue;
      try{const clip=await get('audio',id);if(clip&&audioList.isConnected)renderAudio(clip,id,false);}
      catch(error){feedback.textContent='No se pudo cargar una grabación: '+(error.message||error);}
    }
  })();
  record.onclick=async()=>{
    if(recorder&&recorder.state==='recording'){recorder.stop();record.textContent='Iniciar grabación';return;}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){feedback.textContent='Este navegador no admite grabación local. Prueba Chrome o Edge desde HTTPS o localhost.';return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];
      recorder=new MediaRecorder(stream);
      recorder.ondataavailable=event=>{if(event.data&&event.data.size)chunks.push(event.data);};
      recorder.onerror=event=>{feedback.textContent='Error al grabar audio: '+((event.error&&event.error.message)||'error del dispositivo');};
      recorder.onstop=()=>{
        stream.getTracks().forEach(track=>track.stop());stream=null;record.textContent='Iniciar grabación';
        const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
        if(blob.size){const clip={id:uid(),noteId:note.id,name:'grabacion-'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm',type:blob.type,date:new Date().toISOString(),blob};newAudio.push(clip);renderAudio(clip,clip.id,true);feedback.textContent='Grabación lista. Pulsa “Guardar nota” para persistirla.';}
        else feedback.textContent='La grabación quedó vacía; inténtalo de nuevo.';
        recorder=null;
      };
      recorder.start();record.textContent='Detener grabación';feedback.textContent='Grabando audio…';
    }catch(error){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;feedback.textContent=error.name==='NotAllowedError'?'Permiso de micrófono denegado. Habilítalo en el navegador e inténtalo de nuevo.':'No se pudo iniciar el micrófono: '+(error.message||error.name);}
  };
  audioControls.append(record);panel.append(audioHeading,audioInfo,audioControls,audioList);
  const actions=el('div','row'),save=el('button','main','Guardar nota'),cancel=el('button',0,'Cancelar');
  cancel.onclick=()=>go('notes');
  save.onclick=async()=>{
    const cleanTitle=title.value.trim(),cleanContent=content.value.trim();
    if(!cleanTitle){feedback.textContent='Escribe un título antes de guardar.';title.focus();return;}
    if(!cleanContent&&!images.length){feedback.textContent='Añade contenido o al menos una imagen antes de guardar.';content.focus();return;}
    if(recorder&&recorder.state==='recording'){recorder.stop();feedback.textContent='Grabación detenida. Pulsa Guardar nota de nuevo cuando aparezca el archivo.';return;}
    const ids=(note.audioIds||[]).filter(id=>!removedAudioIds.has(id));
    const clips=newAudio.map(clip=>({...clip,noteId:note.id}));
    const saved={...note,title:cleanTitle,tag:tag.value.trim(),content:cleanContent,images,audioIds:[...ids,...clips.map(clip=>clip.id)],updatedAt:new Date().toISOString()};
    if(!saved.createdAt)saved.createdAt=saved.updatedAt;
    try{await saveNoteAndAudio(saved,clips,[...removedAudioIds]);S.view='notes';S.editNoteId=null;await refresh();}
    catch(error){feedback.textContent=storageError(error);}
  };
  actions.append(save,cancel);panel.appendChild(actions);v.appendChild(panel);
  v.onpaste=event=>{
    const clipboard=event.clipboardData;
    const pastedFiles=Array.from(clipboard&&clipboard.files||[]);
    if(!pastedFiles.length&&clipboard)pastedFiles.push(...Array.from(clipboard.items||[]).filter(item=>item.kind==='file').map(item=>item.getAsFile()).filter(Boolean));
    if(!pastedFiles.length)return;
    event.preventDefault();addImageFiles(pastedFiles);
  };
}
async function loadSampleNotes(){
  const samples=[
    {id:'sample-integrales',title:'Prueba · Integrales',tag:'Cálculo',content:'Ejemplo de nota local con imagen adjunta para verificar búsqueda y edición.',color:'#f4d35e'},
    {id:'sample-ciclo-vida',title:'Prueba · Ciclo de vida',tag:'Programación',content:'Apunte de prueba para comprobar categorías, persistencia y eliminación.',color:'#9fd8b0'},
    {id:'sample-diseno',title:'Prueba · Diseño de interfaz',tag:'Diseño',content:'Nota de muestra independiente; los datos existentes se conservan.',color:'#9cc9ea'}
  ];
  try{
    const existingNotes=await all('notes');
    for(const sample of samples){
      if(existingNotes.some(note=>note.id===sample.id||(note.title===sample.title&&note.tag===sample.tag&&note.content===sample.content)))continue;
      const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
      const context=canvas.getContext('2d');if(!context)throw new Error('No se pudo generar la imagen de prueba.');
      context.fillStyle=sample.color;context.fillRect(0,0,16,16);
      context.fillStyle='#23304a';context.fillRect(4,4,8,8);
      const now=new Date().toISOString();
      const note={id:sample.id,title:sample.title,tag:sample.tag,content:sample.content,images:[{name:'imagen-de-prueba.png',dataUrl:canvas.toDataURL('image/png')}],audioIds:[],createdAt:now,updatedAt:now};
      await put('notes',note);existingNotes.push(note);
    }
    await refresh();
  }catch(error){alert(storageError(error));}
}
function statCard(value,title,caption){
  const card=el('div','stat-card');
  card.append(el('strong',0,value),el('b',0,title),el('span','mu',caption));
  return card;
}
function subject(v){
  const name=S.subj,col=colorOf(name);
  v.append(el('h2',0,name));
  const bar=el('div','top');const tabs=el('div','tabs');
  ['Todos',1,2,3].forEach(c=>{const b=el('button',c===S.corte?'on':'',c==='Todos'?'Todos':'Corte '+c);b.style.setProperty('--c',col);b.onclick=()=>{S.corte=c;render();};tabs.appendChild(b);});
  const act=el('nav');const u=el('button','main','+ Subir');u.onclick=()=>go('upload',name);const r=el('button',0,'Resumen');r.onclick=()=>go('summary',name);act.append(u,r);bar.append(tabs,act);v.appendChild(bar);
  let list=photos.filter(p=>p.subject===name&&(S.corte==='Todos'||corteOf(p)===S.corte)).sort((a,b)=>b.date.localeCompare(a.date));
  const q=el('input');q.type='search';q.placeholder='Buscar en notas';q.oninput=()=>draw(searchPhotos(list,q.value));v.appendChild(q);
  const g=el('div','grid');v.appendChild(g);const e=el('p','mu','Aún no hay apuntes aquí.');v.appendChild(e);
  function draw(l){g.innerHTML='';e.hidden=l.length>0;l.forEach((p,i)=>g.appendChild(card(p,i,col)));}draw(list);
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
  const rotate=el('button',0,'Girar');rotate.onclick=()=>rotatePhoto(p);
  const x=el('button',0,'Borrar');x.onclick=async()=>{if(confirm('\u00bfBorrar esta foto?')){await del('photos',p.id);refresh();}};
  row.append(sel,cs,rv,rotate,x);d.append(im,t,m,row);return d;
}
function rotatePhoto(photo){
  const image=new Image();
  image.onload=async()=>{
    const canvas=document.createElement('canvas');
    canvas.width=image.height;canvas.height=image.width;
    const context=canvas.getContext('2d');
    context.translate(canvas.width,0);context.rotate(Math.PI/2);
    context.drawImage(image,0,0);
    photo.dataUrl=canvas.toDataURL('image/jpeg',.88);
    await put('photos',photo);refresh();
  };
  image.src=photo.dataUrl;
}
function upload(v){
  v.append(el('h2',0,'Subir fotos'));const p=el('div','panel');
  p.innerHTML='<div class="row"><input type="file" id="f" accept="image/*" capture="environment" multiple><button id="camera" type="button">Abrir cámara</button></div><div class="row"><input id="n" size="30" placeholder="Nota (ej: integrales dobles, clase 12)"></div><div class="row"><select id="s"></select><select id="c"><option value="1">Corte 1</option><option value="2">Corte 2</option><option value="3">Corte 3</option></select><button class="main" id="go">Guardar</button></div><div class="msg" id="m"></div>';
  v.appendChild(p);
  $('camera').onclick=()=>{$('f').click();};
  const s=$('s');
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
$('nHome').onclick=()=>go('home');$('nNotes').onclick=()=>go('notes');$('nUp').onclick=()=>go('upload',null);$('nSub').onclick=()=>go('subjects');$('big').onclick=()=>$('big').style.display='none';
let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  $('installBanner').hidden=false;
});
$('installApp').onclick=async()=>{
  if(!installPrompt)return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt=null;
  $('installBanner').hidden=true;
};
window.addEventListener('appinstalled',()=>{$('installBanner').hidden=true;});
function updateConnectionStatus(){
  const status=$('connectionStatus');
  status.hidden=navigator.onLine;
  status.classList.toggle('offline',!navigator.onLine);
  status.textContent=navigator.onLine?'':'Sin conexión: tus datos locales siguen disponibles';
}
window.addEventListener('online',updateConnectionStatus);
window.addEventListener('offline',updateConnectionStatus);
updateConnectionStatus();
if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>{
    console.error('No se pudo activar el modo sin conexión:',error);
  }));
}
(async()=>{try{db=await open();subjects=await all('subjects');
  if(!subjects.length){for(const s of DEFAULTS)await put('subjects',s);}
  else{for(const s of subjects){if(!s.color){s.color=COLORS[subjects.indexOf(s)%COLORS.length];await put('subjects',s);}}}
  photos=await all('photos');
  const repaired=await repairStoredTexts();
  await refresh();
  if(repaired){console.info('Se corrigieron textos guardados con una codificación antigua.');}}catch(e){$('v').textContent='No se pudo abrir el almacenamiento local: '+e.message;}})();
