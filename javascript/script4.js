// ======================================================================
//  NIVEL 4 — Último nivel del juego
// ======================================================================
//  Fórmula idéntica a los niveles anteriores. Cambios específicos:
//
//  1) SCENE_ITEMS (objetos correctos): 3 en este nivel —
//     aceite_verde, sarten_morada y microondas_blanco.
//     En el grid se sortean 2 de los 3 para cada partida
//     (igual que en el Nivel 2).
//
//  2) DECOY_ITEMS (señuelos): 4 objetos —
//     paño_amarillo, llaves_plateadas, pimienta y tasa_roja.
//     De los 4 se sortean 2 para cada partida.
//
//  3) El grid sigue mostrando 4 cartas (2 correctas + 2 señuelo),
//     el jugador elige 2. Si ambas son correctas -> INOCENTE.
//     Si al menos 1 es señuelo -> SOSPECHOSO.
//
//  4) Este es el ÚLTIMO nivel:
//     - INOCENTE -> "btn-continue" muestra "screen-next"
//       (pantalla "Caso cerrado", fin del juego).
//     - En "screen-next", "btn-replay" redirige a index.html
//       para reiniciar todo el juego desde el Nivel 1.
//     - SOSPECHOSO -> "btn-restart" reinicia solo este Nivel 4.
// ======================================================================

// ---------- Data ----------
// Objetos que SÍ estaban en la escena (3 en este nivel)
const SCENE_ITEMS = [
  { id:'aceite',    img:'/ProyectoCrimen/image/aceite_verde.png',      name:'Aceite de oliva' },
  { id:'sarten',    img:'/ProyectoCrimen/image/sarten_morada.png',     name:'Sartén morada' },
  { id:'microondas',img:'/ProyectoCrimen/image/microondas_blanco.png', name:'Microondas blanco' },
];

// Objetos que NO estaban en la escena (señuelos, 4 en este nivel)
const DECOY_ITEMS = [
  { id:'pano',    img:'/ProyectoCrimen/image/paño_amarillo.png',    name:'Paño amarillo' },
  { id:'llaves',  img:'/ProyectoCrimen/image/llaves_plateadas.png', name:'Llaves plateadas' },
  { id:'pimienta',img:'/ProyectoCrimen/image/pimienta.png',         name:'Pimienta' },
  { id:'tasa',    img:'/ProyectoCrimen/image/tasa_roja.png',        name:'Taza roja' },
];

const DIALOGUE_OK  = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_BAD = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

// ---------- Elements ----------
const screens = {
  intro:     document.getElementById('screen-intro'),
  memorize:  document.getElementById('screen-memorize'),
  selection: document.getElementById('screen-selection'),
  result:    document.getElementById('screen-result'),
  next:      document.getElementById('screen-next'), // pantalla final "Caso cerrado"
};
const timerEl         = document.getElementById('timer');
const grid            = document.getElementById('grid');
const selectionStatus = document.getElementById('selection-status');
const btnConfirm      = document.getElementById('btn-confirm');
const stampEl         = document.getElementById('stamp');
const resultText      = document.getElementById('result-text');
const btnContinue     = document.getElementById('btn-continue');
const btnRestart      = document.getElementById('btn-restart');

// correctIds incluye los 3 objetos correctos de este nivel.
// La evaluación chequea contra esta lista sin importar cuáles
// 2 de los 3 hayan salido sorteados en el grid.
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

function setupSelection(){
  selected = [];
  btnConfirm.disabled = true;
  selectionStatus.textContent = 'Selecciona 2 objetos';

  // 2 de los 3 objetos correctos sorteados al azar
  const real    = shuffle(SCENE_ITEMS).slice(0, 2);
  // 2 de los 4 señuelos sorteados al azar
  const fake    = shuffle(DECOY_ITEMS).slice(0, 2);
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

function evaluate(){
  const hasWrong = selected.some(id => !correctIds.includes(id));
  const correct  = !hasWrong;

  if(correct){
    stampEl.textContent       = 'INOCENTE';
    stampEl.className         = 'stamp ok';
    resultText.textContent    = DIALOGUE_OK;
    btnContinue.style.display = 'inline-block';
    btnRestart.style.display  = 'none';
  } else {
    stampEl.textContent       = 'SOSPECHOSO';
    stampEl.className         = 'stamp bad';
    resultText.textContent    = DIALOGUE_BAD;
    btnContinue.style.display = 'none';
    btnRestart.style.display  = 'inline-block';
  }
  showScreen('result');
}

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

// Veredicto SOSPECHOSO -> reintentar solo este Nivel 4
btnRestart.addEventListener('click', resetGame);

// "Jugar de nuevo" en la pantalla final -> reinicia TODO el juego
// desde el Nivel 1 (index.html)
document.getElementById('btn-replay').addEventListener('click', () => {
  window.location.href = '/ProyectoCrimen/index.html';
});