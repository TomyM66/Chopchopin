'use strict';

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {

const CHROMATIC=[{name:'C',black:false},{name:'C#',black:true},{name:'D',black:false},{name:'D#',black:true},{name:'E',black:false},{name:'F',black:false},{name:'F#',black:true},{name:'G',black:false},{name:'G#',black:true},{name:'A',black:false},{name:'A#',black:true},{name:'B',black:false}];
const OCTAVES=[4,5,6];
const KB_WHITE=['a','z','e','r','t','y','u','i','o','p','q','s','d','f','g','h','j','k','l','m','w','x','c','v','b','n',',',';'];
const SAMPLES_BASE='https://tonejs.github.io/audio/salamander/';
const WHITE_KEY_W=54;
const SOLFEGE_MAP={do:'C',ré:'D',re:'D',mi:'E',fa:'F',sol:'G',la:'A',si:'B',ti:'B'};

let readerPlayInterval=null, sampler=null;

// ── Audio Recording (MediaRecorder) ──
let mediaRecorder=null, audioChunks=[], isRecording=false, recordingStartTime=0, recordingDuration=0;
let audioStream=null;

/* ══ BUILD PIANO ══ */
const notes=[];
for(const oct of OCTAVES) for(const c of CHROMATIC) notes.push({full:`${c.name}${oct}`,name:c.name,black:c.black});

const keyMap={}, kbMap={};
const keysDiv=document.getElementById('keys');
let wi=0;
notes.forEach((note,i)=>{
  const el=document.createElement('div');
  if(!note.black){
    el.className='key-white'; el.dataset.note=note.full;
    const ch=KB_WHITE[wi]||'';
    el.innerHTML=`<span class="kb">${ch.toUpperCase()}</span><span class="lbl">${note.name}</span>`;
    if(ch) kbMap[ch]=note.full; wi++; keysDiv.appendChild(el);
  } else {
    const wb=notes.slice(0,i).filter(n=>!n.black).length;
    el.className='key-black'; el.dataset.note=note.full;
    el.style.left=`${wb*WHITE_KEY_W-11}px`;
    el.innerHTML=`<span class="kb"></span>`; keysDiv.appendChild(el);
  }
  keyMap[note.full]=el;
});

/* ══ AUDIO SAMPLER ══ */
function buildSampler(cb){
  const reverb=new Tone.Reverb({decay:2.8,wet:0.22}).toDestination();
  const eq=new Tone.EQ3({low:3,mid:0,high:-4,lowFrequency:300,highFrequency:4000}).connect(reverb);
  const comp=new Tone.Compressor({threshold:-24,ratio:3,attack:0.02,release:0.3}).connect(eq);
  const s=new Tone.Sampler({
    urls:{
      A0:'A0.mp3',C1:'C1.mp3','D#1':'Ds1.mp3','F#1':'Fs1.mp3',
      A1:'A1.mp3',C2:'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',
      A2:'A2.mp3',C3:'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',
      A3:'A3.mp3',C4:'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',
      A4:'A4.mp3',C5:'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',
      A5:'A5.mp3',C6:'C6.mp3','D#6':'Ds6.mp3','F#6':'Fs6.mp3',
      A6:'A6.mp3',C7:'C7.mp3','D#7':'Ds7.mp3','F#7':'Fs7.mp3',
      A7:'A7.mp3',C8:'C8.mp3'
    },
    release:1.6, baseUrl:SAMPLES_BASE, onload:cb
  });
  s.connect(comp); return s;
}

function playNote(noteStr,el){
  if(!sampler||!sampler.loaded) return;
  sampler.triggerAttackRelease(noteStr,'2n');
  animateKey(noteStr,el);
}

function animateKey(noteStr,el){
  el.classList.add('active');
  setTimeout(()=>el.classList.remove('active'),260);
  const rect=el.getBoundingClientRect();
  const f=document.createElement('div');
  f.className='note-flash'; f.textContent=noteStr.replace('#','♯');
  f.style.left=`${rect.left+rect.width/2-16}px`; f.style.top=`${rect.top-8}px`;
  document.body.appendChild(f); setTimeout(()=>f.remove(),800);
}

/* ══ EVENTS PIANO ══ */
keysDiv.addEventListener('mousedown',e=>{
  const el=e.target.closest('[data-note]');
  if(el){Tone.start();playNote(el.dataset.note,el);}
});
keysDiv.addEventListener('touchstart',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    const el=document.elementFromPoint(t.clientX,t.clientY)?.closest('[data-note]');
    if(el){Tone.start();playNote(el.dataset.note,el);}
  }
},{passive:false});
document.addEventListener('keydown',e=>{
  if(e.repeat) return;
  const note=kbMap[e.key.toLowerCase()];
  if(note&&keyMap[note]){Tone.start();playNote(note,keyMap[note]);}
});

/* ══ NOTE READER ══ */
const notesInput=document.getElementById('notes-input');
const seqDisplay=document.getElementById('seq-display');
const tempoRange=document.getElementById('tempo-val');
const tempoLabel=document.getElementById('tempo-label');
const octaveSel=document.getElementById('octave-sel');
const btnPlay=document.getElementById('btn-play-notes');
const btnStop=document.getElementById('btn-stop-notes');

tempoRange.addEventListener('input',()=>tempoLabel.textContent=tempoRange.value+' bpm');

function parseNotes(str){
  return str.toLowerCase().replace(/[,;]+/g,' ').trim().split(/\s+/).filter(Boolean).map(s=>{
    const b=SOLFEGE_MAP[s]; if(b) return b+octaveSel.value;
    if(/^[a-g]#?\d$/.test(s)) return s.charAt(0).toUpperCase()+s.slice(1);
    return null;
  }).filter(Boolean);
}

function renderSeq(parsed,activeIdx=-1){
  seqDisplay.innerHTML='';
  const raw=notesInput.value.toLowerCase().replace(/[,;]+/g,' ').trim().split(/\s+/).filter(Boolean);
  raw.forEach((s,i)=>{
    const el=document.createElement('div');
    el.className='seq-note'+(i===activeIdx?' playing':'');
    el.textContent=s;
    seqDisplay.appendChild(el);
  });
}

notesInput.addEventListener('input',()=>renderSeq(parseNotes(notesInput.value)));

btnPlay.addEventListener('click',()=>{
  Tone.start();
  const parsed=parseNotes(notesInput.value); if(!parsed.length) return;
  if(readerPlayInterval) clearTimeout(readerPlayInterval);
  btnPlay.disabled=true; btnStop.disabled=false;
  const ms=Math.round(60000/parseInt(tempoRange.value)); let idx=0;
  const tick=()=>{
    if(idx>=parsed.length){
      btnPlay.disabled=false; btnStop.disabled=true;
      renderSeq(parsed,-1); readerPlayInterval=null; return;
    }
    renderSeq(parsed,idx);
    const note=parsed[idx];
    if(sampler&&sampler.loaded){
      sampler.triggerAttackRelease(note,'8n');
      const el=keyMap[note]; if(el) animateKey(note,el);
    }
    idx++; readerPlayInterval=setTimeout(tick,ms);
  };
  tick();
});

btnStop.addEventListener('click',()=>{
  if(readerPlayInterval){clearTimeout(readerPlayInterval);readerPlayInterval=null;}
  btnPlay.disabled=false; btnStop.disabled=true;
  renderSeq(parseNotes(notesInput.value),-1);
});

/* ══ ENREGISTREMENT AUDIO (MediaRecorder) ══ */
const recDot=document.getElementById('rec-dot');
const btnRecord=document.getElementById('btn-record');

async function startRecording(){
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorder.ondataavailable = e => { if(e.data.size>0) audioChunks.push(e.data); };
    mediaRecorder.start(100);
    isRecording = true;
    recordingStartTime = Date.now();
    recDot.classList.add('recording');
    btnRecord.classList.add('active');
    showToast('● Enregistrement audio en cours…');
    // update timer display
    updateRecTimer();
  } catch(e) {
    showToast('⚠ Microphone non accessible');
    console.error(e);
  }
}

let recTimerInterval = null;
function updateRecTimer(){
  const label = document.getElementById('rec-timer');
  if(!label) return;
  clearInterval(recTimerInterval);
  recTimerInterval = setInterval(()=>{
    if(!isRecording){ clearInterval(recTimerInterval); label.textContent=''; return; }
    const s = Math.floor((Date.now()-recordingStartTime)/1000);
    label.textContent = `⏺ ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  },500);
}

function stopRecording(){
  return new Promise(resolve => {
    if(!mediaRecorder) return resolve(null);
    recordingDuration = Date.now() - recordingStartTime;
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // base64 data URL
      reader.readAsDataURL(blob);
      if(audioStream) audioStream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.stop();
    isRecording = false;
    clearInterval(recTimerInterval);
    const label = document.getElementById('rec-timer');
    if(label) label.textContent='';
    recDot.classList.remove('recording');
    btnRecord.classList.remove('active');
  });
}

btnRecord.addEventListener('click', async ()=>{
  if(!isRecording){
    await startRecording();
  } else {
    const audioDataUrl = await stopRecording();
    if(!audioDataUrl){ showToast('⚠ Aucun audio capturé'); return; }
    // store temporarily and open save dialog
    btnRecord._pendingAudio = audioDataUrl;
    btnRecord._pendingDuree = recordingDuration;
    showToast(`■ Enregistrement terminé · Clique "Sauvegarder" pour l'enregistrer`);
    // show save-audio box
    document.getElementById('save-audio-box').style.display='block';
    document.getElementById('save-audio-box').scrollIntoView({behavior:'smooth'});
    document.getElementById('save-audio-titre').focus();
  }
});

/* ══ SAUVEGARDER MORCEAU (notes texte) ══ */
document.getElementById('btn-save').addEventListener('click',()=>{
  document.getElementById('save-box').scrollIntoView({behavior:'smooth'});
  document.getElementById('save-titre').focus();
});

document.getElementById('btn-do-save').addEventListener('click', async () => {
  const titre   = document.getElementById('save-titre').value.trim();
  const access  = document.getElementById('save-access').value;
  const vitesse = parseInt(document.getElementById('save-vitesse').value);
  const notes   = notesInput.value.trim();
  const user    = JSON.parse(sessionStorage.getItem('utilisateurConnecte') || '{}');

  if (!titre) { showToast('⚠ Titre requis'); return; }
  if (!notes) { showToast('⚠ Aucune note dans la partition'); return; }
  if (!user.id) { showToast('⚠ Vous devez être connecté'); return; }

  try {
    const res = await fetch(`${API_URL}/morceaux`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utilisateur_id: user.id, titre, accessibilite: access, vitesse, notes })
    });
    if (res.ok) {
      showToast(`✓ Morceau "${titre}" sauvegardé`);
      document.getElementById('save-titre').value = '';
    } else {
      const data = await res.json();
      showToast(`⚠ ${data.erreur || 'Erreur sauvegarde'}`);
    }
  } catch (e) {
    showToast('⚠ Impossible de contacter le serveur');
  }
});

/* ══ SAUVEGARDER ENREGISTREMENT AUDIO ══ */
document.getElementById('btn-do-save-audio').addEventListener('click', async () => {
  const titre   = document.getElementById('save-audio-titre').value.trim();
  const access  = document.getElementById('save-audio-access').value;
  const user    = JSON.parse(sessionStorage.getItem('utilisateurConnecte') || '{}');
  const audioData = btnRecord._pendingAudio;

  if (!titre) { showToast('⚠ Titre requis'); return; }
  if (!audioData) { showToast('⚠ Aucun enregistrement en attente'); return; }
  if (!user.id) { showToast('⚠ Vous devez être connecté'); return; }

  try {
    const res = await fetch(`${API_URL}/enregistrements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utilisateur_id: user.id,
        titre,
        accessibilite: access,
        audio_data: audioData,
        duree_ms: btnRecord._pendingDuree || 0
      })
    });
    if (res.ok) {
      showToast(`✓ Son "${titre}" sauvegardé`);
      document.getElementById('save-audio-titre').value = '';
      document.getElementById('save-audio-box').style.display = 'none';
      btnRecord._pendingAudio = null;
    } else {
      const data = await res.json();
      showToast(`⚠ ${data.erreur || 'Erreur sauvegarde audio'}`);
    }
  } catch (e) {
    showToast('⚠ Impossible de contacter le serveur');
  }
});

/* ══ PROFIL ══ */
const modalProfile=document.getElementById('modal-profile');
document.getElementById('btn-profile').addEventListener('click', async ()=>{
  const user = JSON.parse(sessionStorage.getItem('utilisateurConnecte') || '{}');
  if (!user.id) { showToast('⚠ Non connecté'); return; }

  document.getElementById('p-pseudo').textContent = user.pseudo || '—';
  document.getElementById('p-email-disp').textContent = user.email || '—';

  // Charger morceaux et enregistrements
  await Promise.all([
    loadProfileMorceaux(user.id),
    loadProfileEnregistrements(user.id)
  ]);

  modalProfile.classList.add('open');
});
document.getElementById('modal-close-btn').addEventListener('click',()=>modalProfile.classList.remove('open'));
modalProfile.addEventListener('click',e=>{if(e.target===modalProfile)modalProfile.classList.remove('open');});

async function loadProfileMorceaux(userId){
  const list = document.getElementById('profile-morceaux-list');
  list.innerHTML = '<p class="p-loading">Chargement…</p>';
  try {
    const res = await fetch(`${API_URL}/morceaux/${userId}`);
    const morceaux = await res.json();
    if(!morceaux.length){ list.innerHTML='<p class="p-empty">Aucun morceau sauvegardé</p>'; return; }
    list.innerHTML = morceaux.map(m=>`
      <div class="profile-item" data-id="${m.id}" data-type="morceau">
        <div class="profile-item-info">
          <span class="profile-item-titre">${m.titre}</span>
          <span class="profile-item-meta">${m.vitesse} bpm · ${m.accessibilite} · ${new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
          ${m.notes ? `<span class="profile-item-notes">${m.notes.split(' ').slice(0,10).join(' ')}${m.notes.split(' ').length>10?'…':''}</span>` : ''}
        </div>
        <div class="profile-item-actions">
          <button class="btn-load-notes" data-notes="${encodeURIComponent(m.notes||'')}">▶ Charger</button>
          <button class="btn-del-morceau" data-id="${m.id}">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-load-notes').forEach(btn=>{
      btn.addEventListener('click',()=>{
        notesInput.value = decodeURIComponent(btn.dataset.notes);
        renderSeq(parseNotes(notesInput.value));
        modalProfile.classList.remove('open');
        showToast('✓ Partition chargée');
      });
    });
    list.querySelectorAll('.btn-del-morceau').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!confirm('Supprimer ce morceau ?')) return;
        await fetch(`${API_URL}/morceaux/${btn.dataset.id}`,{method:'DELETE'});
        await loadProfileMorceaux(userId);
      });
    });
  } catch(e){
    list.innerHTML='<p class="p-empty">Erreur de chargement</p>';
  }
}

async function loadProfileEnregistrements(userId){
  const list = document.getElementById('profile-sons-list');
  list.innerHTML = '<p class="p-loading">Chargement…</p>';
  try {
    const res = await fetch(`${API_URL}/enregistrements/${userId}`);
    const enrgs = await res.json();
    if(!enrgs.length){ list.innerHTML='<p class="p-empty">Aucun son enregistré</p>'; return; }
    list.innerHTML = enrgs.map(e=>{
      const dur = e.duree_ms ? `${(e.duree_ms/1000).toFixed(1)}s` : '?s';
      return `
      <div class="profile-item" data-id="${e.id}" data-type="son">
        <div class="profile-item-info">
          <span class="profile-item-titre">${e.titre}</span>
          <span class="profile-item-meta">${dur} · ${e.accessibilite} · ${new Date(e.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="profile-item-actions">
          <button class="btn-play-audio" data-audio="${encodeURIComponent(e.audio_data)}">▶ Écouter</button>
          <button class="btn-del-son" data-id="${e.id}">✕</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.btn-play-audio').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const src = decodeURIComponent(btn.dataset.audio);
        const audio = new Audio(src);
        audio.play();
        btn.textContent = '⏸ Lecture…';
        audio.onended = ()=>{ btn.textContent='▶ Écouter'; };
      });
    });
    list.querySelectorAll('.btn-del-son').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!confirm('Supprimer cet enregistrement ?')) return;
        await fetch(`${API_URL}/enregistrements/${btn.dataset.id}`,{method:'DELETE'});
        await loadProfileEnregistrements(userId);
      });
    });
  } catch(e){
    list.innerHTML='<p class="p-empty">Erreur de chargement</p>';
  }
}

/* ══ LOGOUT ══ */
document.getElementById('btn-logout').addEventListener('click',()=>{
  sessionStorage.removeItem('utilisateurConnecte');
  showToast('Déconnexion…');
  setTimeout(()=>{ window.location.href='accueil.html'; },1200);
});

/* ══ TOAST ══ */
const toast=document.getElementById('toast'); let toastTimer;
function showToast(msg){
  toast.textContent=msg; toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
}

/* ══ PARTICLES ══ */
const pColors=['#5865f2','#00d4ff','#9b59f5'];
for(let i=0;i<24;i++){
  const p=document.createElement('div'); p.className='particle';
  p.style.setProperty('--dur',`${7+Math.random()*8}s`);
  p.style.setProperty('--delay',`${Math.random()*10}s`);
  p.style.left=`${Math.random()*100}vw`; p.style.top=`${30+Math.random()*70}vh`;
  const sz=`${1+Math.random()*2.5}px`; p.style.width=sz; p.style.height=sz;
  const c=pColors[Math.floor(Math.random()*pColors.length)];
  p.style.background=c; p.style.boxShadow=`0 0 6px ${c}`;
  document.body.appendChild(p);
}

/* ══ INIT SAMPLER ══ */
const loading=document.getElementById('loading');
sampler=buildSampler(()=>{loading.style.opacity='0';setTimeout(()=>loading.remove(),600);});

}); // fin DOMContentLoaded
