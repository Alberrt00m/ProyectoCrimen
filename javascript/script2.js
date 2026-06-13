// ======================================================================
//  NIVEL 2 — Conexión con el flujo completo del juego
// ======================================================================
//  Cambios respecto a la versión anterior de este archivo:
//
//  1) "screen-next" sigue existiendo (ahora es la pantalla de "Caso
//     cerrado" / juego completado), así que el botón "btn-continue"
//     (veredicto INOCENTE) sigue haciendo showScreen('next') igual
//     que antes.
//
//  2) "btn-restart" (veredicto SOSPECHOSO) sigue reiniciando SOLO el
//     Nivel 2 con resetGame() -> showScreen('intro') de esta misma
//     página, igual que antes.
//
//  3) NUEVO: "btn-replay", que antes solo llamaba a resetGame()
//     (reiniciar este nivel), ahora representa "jugar de nuevo desde
//     cero" y redirige a /ProyectoCrimen/index.html (Nivel 1), que es
//     el inicio del juego completo.
// ======================================================================

// ---------- Data ----------
// Objetos que SÍ estaban en la escena (3 en este nivel)
const SCENE_ITEMS = [
  { id:'vaso',    img:'/ProyectoCrimen/vaso_añejo.png',     name:'Vaso añejo' },
  { id:'pato',    img:'/ProyectoCrimen/pato_inflable.png',  name:'Pato inflable' },
  { id:'maceta',  img:'/ProyectoCrimen/maceta_azul.png',    name:'Maceta azul' },
];

// Objetos que NO estaban en la escena (señuelos, 4 en este nivel)
const DECOY_ITEMS = [
  { id:'blusa',      img:'/ProyectoCrimen/blusa_verde.png',       name:'Blusa verde' },
  { id:'cargador',   img:'/ProyectoCrimen/cargador_negro.png',    name:'Cargador negro' },
  { id:'cuchillo',   img:'/ProyectoCrimen/cuchillo_raro.png',     name:'Cuchillo raro' },
  { id:'candelabro', img:'/ProyectoCrimen/candelabro_bronce.png', name:'Candelabro de bronce' },
];

const DIALOGUE_OK  = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_BAD = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

// ---------- Elements ----------
const screens = {
  intro: document.getElementById('screen-intro'),
  memorize: document.getElementById('screen-memorize'),
  selection: document.getElementById('screen-selection'),
  result: document.getElementById('screen-result'),
  next: document.getElementById('screen-next'), // ahora es "Caso cerrado"
};
const timerEl = document.getElementById('timer');
const grid = document.getElementById('grid');
const selectionStatus = document.getElementById('selection-status');
const btnConfirm = document.getElementById('btn-confirm');
const stampEl = document.getElementById('stamp');
const resultText = document.getElementById('result-text');
const btnContinue = document.getElementById('btn-continue');
const btnRestart = document.getElementById('btn-restart');

// correctIds incluye los 3 objetos correctos de este nivel.
const correctIds = SCENE_ITEMS.map(i => i.id);
let selected = [];
let countdownInterval = null;

function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Countdown ----------
function startCountdown(){
  let count = 5;
  timerEl.textContent = count;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    count--;
    if(count <= 0){
      clearInterval(countdownInterval);
      setupSelection();
      showScreen('selection');
    } else {
      timerEl.textContent = count;
    }
  }, 1000);
}

// ---------- Setup selection ----------
function setupSelection(){
  selected = [];
  btnConfirm.disabled = true;
  selectionStatus.textContent = 'Selecciona 2 objetos';

  // Se eligen al azar 2 de los 3 objetos correctos posibles...
  const real = shuffle(SCENE_ITEMS).slice(0, 2);
  // ...y 2 de los 4 señuelos posibles.
  // El grid sigue teniendo 4 cartas en total, igual que en el Nivel 1.
  const fake = shuffle(DECOY_ITEMS).slice(0, 2);

  const options = shuffle([...real, ...fake]);

  grid.innerHTML = '';
  options.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    card.style.setProperty('--rot', `${(idx % 2 === 0 ? -2 : 2)}deg`);
    card.innerHTML = `
      <div class="thumb"><img src="${item.img}" alt="${item.name}"></div>
      <span class="label">${item.name}</span>
    `;
    card.addEventListener('click', () => toggleCard(card, item.id));
    grid.appendChild(card);
  });
}

function toggleCard(card, id){
  const isSelected = selected.includes(id);
  if(isSelected){
    selected = selected.filter(s => s !== id);
    card.classList.remove('selected');
  } else {
    if(selected.length >= 2) return;
    selected.push(id);
    card.classList.add('selected');
  }
  selectionStatus.textContent = selected.length === 2
    ? 'Listo para confirmar'
    : `Selecciona ${2 - selected.length} más`;
  btnConfirm.disabled = selected.length !== 2;
}

// ---------- Evaluate ----------
function evaluate(){
  // si elige al menos un objeto erróneo (que no estaba en la escena) -> sospechoso
  const hasWrong = selected.some(id => !correctIds.includes(id));
  const correct = !hasWrong;

  if(correct){
    stampEl.textContent = 'INOCENTE';
    stampEl.className = 'stamp ok';
    resultText.textContent = DIALOGUE_OK;
    btnContinue.style.display = 'inline-block';
    btnRestart.style.display = 'none';
  } else {
    stampEl.textContent = 'SOSPECHOSO';
    stampEl.className = 'stamp bad';
    resultText.textContent = DIALOGUE_BAD;
    btnContinue.style.display = 'none';
    btnRestart.style.display = 'inline-block';
  }
  showScreen('result');
}

// ---------- Reset (reinicia SOLO este Nivel 2) ----------
function resetGame(){
  selected = [];
  showScreen('intro');
}

// ---------- Events ----------
document.getElementById('btn-start').addEventListener('click', () => {
  showScreen('memorize');
  startCountdown();
});

btnConfirm.addEventListener('click', evaluate);

// Veredicto INOCENTE -> pantalla "Caso cerrado" (juego completo)
btnContinue.addEventListener('click', () => showScreen('next'));

// Veredicto SOSPECHOSO -> reintentar solo este Nivel 2
btnRestart.addEventListener('click', resetGame);

// CAMBIO PRINCIPAL: "Jugar de nuevo" en la pantalla final ya no reinicia
// este nivel, sino TODO el juego desde el Nivel 1.
document.getElementById('btn-replay').addEventListener('click', () => {
  window.location.href = '/ProyectoCrimen/index.html';
});
