const audio=new AudioContext();
const NOTES={C:261.6,"C#":277,D:293,"D#":311,E:329,F:349,"F#":369,G:392,"G#":415,A:440,"A#":466,B:493};

let note=null,player=1,p1=0,p2=0,pianoTimer;
let curRhythm,rhythmTimer;

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function beep(freq,d=.15){
  const o=audio.createOscillator(),g=audio.createGain();
  o.frequency.value=freq;g.gain.value=.15;
  o.connect(g);g.connect(audio.destination);
  o.start();o.stop(audio.currentTime+d);
}

/* PIANO */
function playNote(){
  const keys=Object.keys(NOTES);
  note=keys[Math.floor(Math.random()*keys.length)];
  beep(NOTES[note]);
  startPianoTimer();
}

function startPianoTimer(){
  clearInterval(pianoTimer);
  let t=10;
  pianoTime.textContent=t;
  pianoTimer=setInterval(()=>{
    t--;pianoTime.textContent=t;
    if(t<=0){switchPlayer();clearInterval(pianoTimer);}
  },1000);
}

function switchPlayer(){
  player=player===1?2:1;
  turn.textContent="Player "+player;
  note=null;
}

function resetPiano(){
  p1=p2=0;player=1;
  p1El.textContent=0;p2El.textContent=0;
  turn.textContent="Player 1";
}

document.querySelectorAll('.white,.black').forEach(k=>{
  k.onclick=()=>{
    clearInterval(pianoTimer);
    beep(NOTES[k.dataset.n]);
    if(k.dataset.n===note){
      player===1?p1++:p2++;
      p1El.textContent=p1;p2El.textContent=p2;
    }
    switchPlayer();
  };
});

const p1El=document.getElementById("p1");
const p2El=document.getElementById("p2");

/* RHYTHM */
const rhythms={
  quarter:[1,1,1,1],
  eighth:[.5,.5,.5,.5],
  triplet:[.33,.33,.33],
  sixteenth:[.25,.25,.25,.25],
  sync:[1,.5,1]
};

function playRhythm(){
  const keys=Object.keys(rhythms);
  curRhythm=keys[Math.floor(Math.random()*keys.length)];
  let t=audio.currentTime;

  for(let r=0;r<4;r++){
    rhythms[curRhythm].forEach(d=>{
      const o=audio.createOscillator(),g=audio.createGain();
      o.frequency.value=800;
      g.gain.value=.15;
      o.connect(g);g.connect(audio.destination);
      o.start(t);o.stop(t+.06);
      t+=d*.5;
    });
  }
  startRhythmTimer();
}

function startRhythmTimer(){
  clearInterval(rhythmTimer);
  let t=10;
  rhythmTime.textContent=t;
  rhythmTimer=setInterval(()=>{
    t--;rhythmTime.textContent=t;
    if(t<=0)clearInterval(rhythmTimer);
  },1000);
}

document.querySelectorAll('.rhythm-btn').forEach(b=>{
  b.onclick=()=>{
    clearInterval(rhythmTimer);
    rhythmMsg.textContent=
      b.dataset.r===curRhythm?"✨ Correct Rhythm!":"❌ Wrong Rhythm";
  };
});
