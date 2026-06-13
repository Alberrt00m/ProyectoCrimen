const SCENE_ITEMS = [
  { id:'algodon',   img:'/ProyectoCrimen/image/algodon.png',   name:'Algodón' },
  { id:'pastillas', img:'/ProyectoCrimen/image/pastillas.png', name:'Pastillas' },
];

const DECOY_ITEMS = [
  { id:'billetera', img:'/ProyectoCrimen/image/billetera_marron.png', name:'Billetera marrón' },
  { id:'champu',    img:'/ProyectoCrimen/image/champu_rojo.png',      name:'Champú rojo' },
  { id:'vino',      img:'/ProyectoCrimen/image/vino_dragon.png',      name:'Vino Casa Draconis' },
  { id:'reloj',     img:'/ProyectoCrimen/image/reloj_rojo.png',       name:'Reloj rojo' },
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
