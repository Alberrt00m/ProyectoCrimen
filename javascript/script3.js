// ======================================================================
//  NIVEL 3 — Cambios respecto al Nivel 2 / Nivel 1
// ======================================================================
//  1) La escena cambia a "escena_3.jpeg" (ver nivel3.html). Esa imagen
//     todavía no fue subida, hay que agregarla a /ProyectoCrimen/.
//
//  2) SCENE_ITEMS (objetos correctos) vuelve a tener 2 objetos, igual
//     que el Nivel 1: "algodon" y "pastillas". Como solo hay 2, ambos
//     se usan siempre en el grid (no se sortean, igual que en el
//     Nivel 1).
//
//  3) DECOY_ITEMS (señuelos) tiene 4 objetos: billetera_marron,
//     champu_rojo, vino_dragon y reloj_rojo. De esos 4 se sortean 2
//     para cada partida (igual que el Nivel 2 hacía con sus señuelos).
//
//  4) MECÁNICA: el grid sigue mostrando 4 cartas en total
//     (2 correctas + 2 señuelo) y el jugador elige exactamente 2.
//     - Si las 2 elegidas son "algodon" y "pastillas" -> DIALOGUE_OK.
//     - Si al menos 1 de las 2 elegidas es un señuelo -> DIALOGUE_BAD.
//
//  5) Este es el ÚLTIMO nivel: "btn-continue" (INOCENTE) muestra
//     "screen-next" ("Caso cerrado", fin del juego). Desde ahí,
//     "btn-replay" redirige a /ProyectoCrimen/index.html para reiniciar
//     todo el juego desde el Nivel 1.
//     "btn-restart" (SOSPECHOSO) reinicia solo este Nivel 3.
// ======================================================================

// ---------- Data ----------
// Objetos que SÍ estaban en la escena (2 en este nivel, como en el Nivel 1)
const SCENE_ITEMS = [
  { id:'algodon',   img:'/ProyectoCrimen/algodon.png',   name:'Algodón' },
  { id:'pastillas', img:'/ProyectoCrimen/pastillas.png', name:'Pastillas' },
];

// Objetos que NO estaban en la escena (señuelos, 4 en este nivel)
const DECOY_ITEMS = [
  { id:'billetera', img:'/ProyectoCrimen/billetera_marron.png', name:'Billetera marrón' },
  { id:'champu',    img:'/ProyectoCrimen/champu_rojo.png',      name:'Champú rojo' },
  { id:'vino',      img:'/ProyectoCrimen/vino_dragon.png',      name:'Vino Casa Draconis' },
  { id:'reloj',     img:'/ProyectoCrimen/reloj_rojo.png',       name:'Reloj rojo' },
];

const DIALOGUE_OK  = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_BAD = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

// ---------- Elements ----------
const screens = {
  intro: document.getElementById('screen-intro'),
  memorize: document.getElementById('screen-memorize'),
  selection: document.getElementById('screen-selection'),
  result: document.getElementById('screen-result'),
  next: document.getElementById('screen-next'), // pantalla final "Caso cerrado"
};
const timerEl = document.getElementById('timer');
const grid = document.getElementById('grid');
const selectionStatus = document.getElementById('selection-status');
const btnConfirm = document.getElementById('btn-confirm');
const stampEl = document.getElementById('stamp');
const resultText = document.getElementById('result-text');
const btnContinue = document.getElementById('btn-continue');
const btnRestart = document.getElementById('btn-restart');

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

  // los 2 objetos correctos (algodón y pastillas) + 2 señuelos al azar
  // entre los 4 disponibles (igual que la mecánica del Nivel 1)
  const fake = shuffle(DECOY_ITEMS).slice(0, 2);
  const options = shuffle([...SCENE_ITEMS, ...fake]);

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

// ---------- Reset (reinicia SOLO este Nivel 3) ----------
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

// Veredicto INOCENTE -> pantalla final "Caso cerrado" (fin del juego)
btnContinue.addEventListener('click', () => showScreen('next'));

// Veredicto SOSPECHOSO -> reintentar solo este Nivel 3
btnRestart.addEventListener('click', resetGame);

// "Jugar de nuevo" en la pantalla final -> reinicia TODO el juego
// desde el Nivel 1
document.getElementById('btn-replay').addEventListener('click', () => {
  window.location.href = '/ProyectoCrimen/index.html';
});
