const SCENE_ITEMS = [
  { id:'libro',   img:'/ProyectoCrimen/image/libro_morado.png',   name:'Libro morado' },
  { id:'lampara', img:'/ProyectoCrimen/image/lampara_azul.png',    name:'Lampara azul' },
];
const DECOY_ITEMS = [
  { id:'almohada', img:'/ProyectoCrimen/image/almohada_morada.png', name:'Almohada morada' },
  { id:'toalla',   img:'/ProyectoCrimen/image/toalla_rosa.png',     name:'Toalla rosa' },
  { id:'telefono', img:'/ProyectoCrimen/image/telefono_roto.png',   name:'Teléfono roto' },
  {id:'copa de martini', img:'/ProyectoCrimen/image/copa_martini.png', name:'Copa de martini' },
];

const DIALOGUE_OK  = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_BAD = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

const screens = {
  intro: document.getElementById('screen-intro'),
  memorize: document.getElementById('screen-memorize'),
  selection: document.getElementById('screen-selection'),
  result: document.getElementById('screen-result'),
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

  // los 2 objetos reales + 2 señuelos al azar
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

// ---------- Reset (solo Nivel 1, cuando el veredicto es SOSPECHOSO) ----------
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

// CAMBIO PRINCIPAL: en vez de mostrar una pantalla interna ("screen-next"),
// al ganar el Nivel 1 saltamos al archivo del Nivel 2.
btnContinue.addEventListener('click', () => {
  window.location.href = '/ProyectoCrimen/nivel2.html';
});

btnRestart.addEventListener('click', resetGame);