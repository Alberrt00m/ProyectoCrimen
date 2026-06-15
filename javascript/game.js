const DIALOGUE_OK  = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_BAD = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initLevel(cfg) {
  const {
    sceneItems,
    decoyItems,
    showInGrid   = 2,
    pickCount    = 2,
    countdownSec = 5,
    onSuccess,
    onRetry      = null,
  } = cfg;

  const correctIds = sceneItems.map(i => i.id);
  let selected = [];
  let countdownInterval = null;

  const el = {
    screens: {
      intro:     document.getElementById('screen-intro'),
      memorize:  document.getElementById('screen-memorize'),
      selection: document.getElementById('screen-selection'),
      result:    document.getElementById('screen-result'),
      next:      document.getElementById('screen-next'),
    },
    timer:    document.getElementById('timer'),
    grid:     document.getElementById('grid'),
    status:   document.getElementById('selection-status'),
    confirm:  document.getElementById('btn-confirm'),
    stamp:    document.getElementById('stamp'),
    resultText: document.getElementById('result-text'),
    btnContinue: document.getElementById('btn-continue'),
    btnRestart:  document.getElementById('btn-restart'),
  };

  function showScreen(name) {
    Object.values(el.screens).forEach(s => s && s.classList.remove('active'));
    if (el.screens[name]) el.screens[name].classList.add('active');
  }

  function startCountdown() {
    let count = countdownSec;
    el.timer.textContent = count;
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownInterval);
        setupSelection();
        showScreen('selection');
      } else {
        el.timer.textContent = count;
      }
    }, 1000);
  }

  function setupSelection() {
    selected = [];
    el.confirm.disabled = true;
    updateStatus();

    const real    = shuffle(sceneItems).slice(0, showInGrid);
    const fake    = shuffle(decoyItems).slice(0, pickCount);
    const options = shuffle([...real, ...fake]);

    el.grid.innerHTML = '';
    options.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = item.id;
      card.style.setProperty('--rot', `${idx % 2 === 0 ? -2 : 2}deg`);
      card.innerHTML = `
        <div class="thumb"><img src="${item.img}" alt="${item.name}" loading="lazy"></div>
        <span class="label">${item.name}</span>
      `;
      card.addEventListener('click', () => toggleCard(card, item.id));
      el.grid.appendChild(card);
    });
  }

  function updateStatus() {
    const remaining = pickCount - selected.length;
    el.status.textContent = remaining === 0
      ? 'Listo para confirmar'
      : `Selecciona ${remaining} ${remaining === 1 ? 'objeto más' : 'objetos'}`;
  }

  function toggleCard(card, id) {
    if (selected.includes(id)) {
      selected = selected.filter(s => s !== id);
      card.classList.remove('selected');
    } else {
      if (selected.length >= pickCount) return;
      selected.push(id);
      card.classList.add('selected');
    }
    updateStatus();
    el.confirm.disabled = selected.length !== pickCount;
  }

  function evaluate() {
    const correct = selected.every(id => correctIds.includes(id));

    el.stamp.textContent = correct ? 'INOCENTE' : 'SOSPECHOSO';
    el.stamp.className   = correct ? 'stamp ok'  : 'stamp bad';
    el.resultText.textContent = correct ? DIALOGUE_OK : DIALOGUE_BAD;
    el.btnContinue.style.display = correct ? 'inline-block' : 'none';
    el.btnRestart.style.display  = correct ? 'none' : 'inline-block';

    showScreen('result');
  }

  function resetLevel() {
    selected = [];
    showScreen('intro');
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    showScreen('memorize');
    startCountdown();
  });

  el.confirm.addEventListener('click', evaluate);

  el.btnContinue.addEventListener('click', () => {
    if (typeof onSuccess === 'function') {
      onSuccess();
    } else {
      window.location.href = onSuccess;
    }
  });

  el.btnRestart.addEventListener('click', () => {
    if (onRetry) onRetry();
    else resetLevel();
  });

  const btnReplay = document.getElementById('btn-replay');
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
}