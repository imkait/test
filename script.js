const diceElements = Array.from(document.querySelectorAll('.die'));
const rollButton = document.getElementById('rollButton');
const facesText = document.getElementById('faces');
const totalText = document.getElementById('total');
const ruleModeSelect = document.getElementById('ruleMode');
const ruleResultText = document.getElementById('ruleResult');
const historyList = document.getElementById('historyList');

const historyRecords = [];
let lastFinalFaces = null;
const redFaceValues = [1, 4];

const faceRotationMap = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateY(-90deg)',
  3: 'rotateX(-90deg)',
  4: 'rotateX(90deg)',
  5: 'rotateY(90deg)',
  6: 'rotateY(180deg)'
};

const facePatterns = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function randomFace() {
  return Math.floor(Math.random() * 6) + 1;
}

function buildFacePips(faceEl) {
  faceEl.innerHTML = '';
  for (let i = 0; i < 9; i += 1) {
    const pip = document.createElement('span');
    pip.className = 'pip';
    pip.setAttribute('aria-hidden', 'true');
    faceEl.appendChild(pip);
  }
}

function paintFace(faceEl, value) {
  faceEl.classList.toggle('red', redFaceValues.includes(value));
  faceEl.classList.toggle('black', !redFaceValues.includes(value));

  const pips = Array.from(faceEl.querySelectorAll('.pip'));
  pips.forEach((pip, index) => {
    pip.classList.toggle('on', facePatterns[value].includes(index));
  });
}

function paintDie(dieEl) {
  const faceElements = Array.from(dieEl.querySelectorAll('.face'));
  faceElements.forEach((faceEl) => {
    const value = Number(faceEl.dataset.face);
    paintFace(faceEl, value);
  });
}

function judgeBigSmall(total, values) {
  const isLeopard = values[0] === values[1] && values[1] === values[2];
  if (isLeopard) {
    return '豹子，大小通殺';
  }

  if (total >= 11) {
    return `大 (${total})`;
  }

  return `小 (${total})`;
}

function judgeLeopard(values) {
  const isLeopard = values[0] === values[1] && values[1] === values[2];
  if (isLeopard) {
    return `豹子 (${values[0]}-${values[1]}-${values[2]})`;
  }

  return '非豹子';
}

function getRuleResult(values, total) {
  const mode = ruleModeSelect.value;
  if (mode === 'bigSmall') {
    return `大/小：${judgeBigSmall(total, values)}`;
  }

  if (mode === 'leopard') {
    return `豹子：${judgeLeopard(values)}`;
  }

  return `${judgeBigSmall(total, values)} | ${judgeLeopard(values)}`;
}

function renderHistory() {
  historyList.innerHTML = '';

  if (historyRecords.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '尚無紀錄，先擲一次試試。';
    historyList.appendChild(empty);
    return;
  }

  historyRecords.forEach((record) => {
    const li = document.createElement('li');
    li.textContent = `${record.faces.join(' / ')} | 總和 ${record.total} | ${record.rule}`;
    historyList.appendChild(li);
  });
}

function pushHistory(values, total, ruleResult) {
  historyRecords.unshift({
    faces: values,
    total,
    rule: ruleResult
  });

  if (historyRecords.length > 10) {
    historyRecords.length = 10;
  }

  renderHistory();
}

function triggerVibration() {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate([80, 40, 100]);
  }
}

function playRollSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!playRollSound.ctx) {
    playRollSound.ctx = new AudioContextClass();
  }

  const ctx = playRollSound.ctx;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const burstCount = 6;

  for (let i = 0; i < burstCount; i += 1) {
    const start = now + i * 0.05;
    const duration = 0.045;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 180 + Math.random() * 180;

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}

function updateResult(values, shouldRecord = true) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const ruleResult = getRuleResult(values, total);

  facesText.textContent = `點數：${values[0]} / ${values[1]} / ${values[2]}`;
  totalText.textContent = `總和：${total}`;
  ruleResultText.textContent = `判定：${ruleResult}`;

  if (shouldRecord) {
    pushHistory(values, total, ruleResult);
    lastFinalFaces = [...values];
  }
}

function setFaces(values, shouldRecord = true) {
  diceElements.forEach((dieEl, i) => {
    const targetRotation = faceRotationMap[values[i]];
    const jitterX = Math.floor(Math.random() * 14) - 7;
    const jitterY = Math.floor(Math.random() * 14) - 7;
    dieEl.style.transform = `${targetRotation} rotateX(${jitterX}deg) rotateY(${jitterY}deg)`;
  });
  updateResult(values, shouldRecord);
}

function resetFaceMap() {
  diceElements.forEach((dieEl) => {
    const faceElements = Array.from(dieEl.querySelectorAll('.face'));
    faceElements.forEach((faceEl) => {
      buildFacePips(faceEl);
    });

    paintDie(dieEl);
  });
}

function rollAllDice() {
  if (rollButton.disabled) {
    return;
  }

  rollButton.disabled = true;
  playRollSound();
  triggerVibration();

  diceElements.forEach((dieEl, i) => {
    dieEl.classList.remove('rolling');
    void dieEl.offsetWidth;
    dieEl.style.setProperty('--dur', `${920 + i * 170}ms`);
    dieEl.classList.add('rolling');
  });

  const flicker = setInterval(() => {
    setFaces([randomFace(), randomFace(), randomFace()], false);
  }, 85);

  setTimeout(() => {
    clearInterval(flicker);
    const finalFaces = [randomFace(), randomFace(), randomFace()];
    setFaces(finalFaces);
    diceElements.forEach((dieEl) => {
      dieEl.classList.remove('rolling');
    });
    rollButton.disabled = false;
  }, 1250);
}

ruleModeSelect.addEventListener('change', () => {
  if (historyRecords.length > 0 && lastFinalFaces) {
    updateResult(lastFinalFaces, false);
    return;
  }

  setFaces([randomFace(), randomFace(), randomFace()], false);
});

rollButton.addEventListener('click', rollAllDice);
resetFaceMap();
renderHistory();
setFaces([randomFace(), randomFace(), randomFace()], false);
