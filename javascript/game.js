// ── Dialogues ──────────────────────────────────────────────────────────────
const DIALOGUE_OK      = '"Veo que todo está en orden, eres inocente por ahora... No salgas de la casa hasta que termine el interrogatorio."';
const DIALOGUE_WARNING = '"Hay algo que no cuadra en tu historia. Te doy el beneficio de la duda esta vez, pero te seguiremos vigilando de cerca."';
const DIALOGUE_BAD     = '"Algo no cuadra, ahora eres sospechoso. Todos en esta casa vendrán conmigo a la estación."';

// ── Lives system ───────────────────────────────────────────────────────────
const LIVES_KEY = 'crimen_accidental_lives';
const MAX_LIVES = 2;

function getLives() {
  const v = sessionStorage.getItem(LIVES_KEY);
  return v === null ? MAX_LIVES : parseInt(v, 10);
}

function setLives(n) {
  sessionStorage.setItem(LIVES_KEY, String(n));
}

function resetLives() {
  sessionStorage.setItem(LIVES_KEY, String(MAX_LIVES));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Lives bar (injected into every frame) ──────────────────────────────────
function injectLivesBar() {
  const frame = document.querySelector('.frame');
  if (!frame || document.getElementById('lives-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'lives-bar';
  bar.className = 'lives-bar';
  bar.innerHTML = `
    <span class="lives-label">Coartada</span>
    <div class="lives-icons" id="lives-icons"></div>
  `;
  frame.prepend(bar);
  renderLivesPips(getLives());
}

function renderLivesPips(lives) {
  const container = document.getElementById('lives-icons');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const pip = document.createElement('div');
    pip.className = 'life-pip' + (i >= lives ? ' lost' : '');
    pip.id = `life-pip-${i}`;
    container.appendChild(pip);
  }
}

function animateLiveLost(newLives) {
  renderLivesPips(newLives);
  // shake the pip that just turned off
  const pip = document.getElementById(`life-pip-${newLives}`);
  if (pip) {
    pip.classList.add('shake');
    pip.addEventListener('animationend', () => pip.classList.remove('shake'), { once: true });
  }
}

// ── Warning screen (injected once) ─────────────────────────────────────────
function injectWarningScreen() {
  if (document.getElementById('screen-warning')) return;
  const frame = document.querySelector('.frame');
  const div = document.createElement('section');
  div.id = 'screen-warning';
  div.className = 'screen screen-warning';
  div.innerHTML = `
    <div class="officer-wrap animate-in" id="officer-warning">
      <img src="image/policia_molesto.png" alt="Policía molesto">
    </div>
    <div class="warning-content">
      <span class="warning-title">Investigación en riesgo</span>
      <div class="report" style="text-align:center;">
        <div class="who">Agente al mando</div>
        <p id="warning-text"></p>
      </div>
      <p class="lives-label" style="color:var(--danger); margin-top:4px;">— ÚLTIMA OPORTUNIDAD —</p>
      <button class="btn" id="btn-warning-continue">Continuar de todos modos</button>
    </div>
  `;
  frame.appendChild(div);
}

// ── Officer image helper ────────────────────────────────────────────────────
function restructureSelectionScreen() {
  const screen = document.getElementById('screen-selection');
  if (!screen || screen.dataset.restructured) return;
  screen.dataset.restructured = 'true';

  // Wrap existing children in .selection-content
  const content = document.createElement('div');
  content.className = 'selection-content';
  while (screen.firstChild) content.appendChild(screen.firstChild);

  // Officer image
  const officerWrap = document.createElement('div');
  officerWrap.className = 'officer-wrap';
  officerWrap.id = 'officer-selection';
  officerWrap.innerHTML = `<img src="image/Policia_tranquilo.png" alt="Policía">`;

  screen.appendChild(officerWrap);
  screen.appendChild(content);
}

function restructureResultScreen() {
  const screen = document.getElementById('screen-result');
  if (!screen || screen.dataset.restructured) return;
  screen.dataset.restructured = 'true';

  // Wrap existing children in .result-content
  const content = document.createElement('div');
  content.className = 'result-content';
  while (screen.firstChild) content.appendChild(screen.firstChild);

  // Officer image (placeholder src, will be set on evaluate)
  const officerWrap = document.createElement('div');
  officerWrap.className = 'officer-wrap animate-in';
  officerWrap.id = 'officer-result';
  officerWrap.innerHTML = `<img id="officer-result-img" src="" alt="Policía">`;

  screen.appendChild(officerWrap);
  screen.appendChild(content);
}

// ── Main ───────────────────────────────────────────────────────────────────
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
  let pendingSuccessAction = null; // stored for warning → continue flow

  // Inject lives UI and restructure screens for officer images
  injectLivesBar();
  injectWarningScreen();
  restructureSelectionScreen();
  restructureResultScreen();

  const el = {
    screens: {
      intro:     document.getElementById('screen-intro'),
      memorize:  document.getElementById('screen-memorize'),
      selection: document.getElementById('screen-selection'),
      result:    document.getElementById('screen-result'),
      warning:   document.getElementById('screen-warning'),
      next:      document.getElementById('screen-next'),
    },
    timer:           document.getElementById('timer'),
    grid:            document.getElementById('grid'),
    status:          document.getElementById('selection-status'),
    confirm:         document.getElementById('btn-confirm'),
    stamp:           document.getElementById('stamp'),
    resultText:      document.getElementById('result-text'),
    warningText:     document.getElementById('warning-text'),
    btnContinue:     document.getElementById('btn-continue'),
    btnRestart:      document.getElementById('btn-restart'),
    btnWarnContinue: document.getElementById('btn-warning-continue'),
  };

  // ── Screen management ──────────────────────────────────────────────────
  function showScreen(name) {
    Object.values(el.screens).forEach(s => s && s.classList.remove('active'));
    if (el.screens[name]) el.screens[name].classList.add('active');
  }

  // ── Countdown ─────────────────────────────────────────────────────────
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

  // ── Selection grid ─────────────────────────────────────────────────────
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

  // ── Evaluation ─────────────────────────────────────────────────────────
  function setOfficerResult(mood) {
    const img = document.getElementById('officer-result-img');
    const wrap = document.getElementById('officer-result');
    if (!img) return;
    img.src = mood === 'ok'
      ? 'image/Policia_tranquilo.png'
      : 'image/policia_molesto.png';
    // Re-trigger animation
    if (wrap) {
      wrap.classList.remove('animate-in');
      void wrap.offsetWidth; // force reflow
      wrap.classList.add('animate-in');
    }
  }

  function evaluate() {
    const correct = selected.every(id => correctIds.includes(id));

    if (correct) {
      // Win path — normal result screen
      el.stamp.textContent = 'INOCENTE';
      el.stamp.className   = 'stamp ok';
      el.resultText.textContent = DIALOGUE_OK;
      el.btnContinue.style.display = 'inline-block';
      el.btnRestart.style.display  = 'none';
      setOfficerResult('ok');
      showScreen('result');
      return;
    }

    // Wrong answer — lose a life
    const lives = getLives() - 1;
    setLives(lives);
    animateLiveLost(lives);

    if (lives > 0) {
      // Still has life — show warning, then let them advance
      el.warningText.textContent = DIALOGUE_WARNING;
      pendingSuccessAction = onSuccess;
      showScreen('warning');
    } else {
      // Game over — show caught screen
      el.stamp.textContent = 'SOSPECHOSO';
      el.stamp.className   = 'stamp bad';
      el.resultText.textContent = DIALOGUE_BAD;
      el.btnContinue.style.display = 'none';
      el.btnRestart.style.display  = 'inline-block';
      setOfficerResult('bad');
      showScreen('result');
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────
  function resetLevel() {
    resetLives();
    renderLivesPips(MAX_LIVES);
    selected = [];
    showScreen('intro');
    // Go back to first level
    window.location.href = 'index.html';
  }

  // ── Event listeners ────────────────────────────────────────────────────
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
    if (onRetry) {
      onRetry();
    } else {
      resetLevel();
    }
  });

  // Warning screen: continue to next level despite the mistake
  el.btnWarnContinue.addEventListener('click', () => {
    if (typeof pendingSuccessAction === 'function') {
      pendingSuccessAction();
    } else if (pendingSuccessAction) {
      window.location.href = pendingSuccessAction;
    }
    pendingSuccessAction = null;
  });

  const btnReplay = document.getElementById('btn-replay');
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      resetLives();
      window.location.href = 'index.html';
    });
  }
}