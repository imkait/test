const diceElements = Array.from(document.querySelectorAll('.die'));
const rollButton = document.getElementById('rollButton');
const facesText = document.getElementById('faces');
const totalText = document.getElementById('total');

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

function paintDie(dieEl, value) {
  const pips = Array.from(dieEl.querySelectorAll('.pip'));
  pips.forEach((pip, index) => {
    pip.classList.toggle('on', facePatterns[value].includes(index));
  });
}

function updateResult(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  facesText.textContent = `點數：${values[0]} / ${values[1]} / ${values[2]}`;
  totalText.textContent = `總和：${total}`;
}

function setFaces(values) {
  diceElements.forEach((dieEl, i) => {
    paintDie(dieEl, values[i]);
  });
  updateResult(values);
}

function rollAllDice() {
  if (rollButton.disabled) {
    return;
  }

  rollButton.disabled = true;

  diceElements.forEach((dieEl, i) => {
    dieEl.classList.remove('rolling');
    void dieEl.offsetWidth;
    dieEl.style.setProperty('--dur', `${920 + i * 170}ms`);
    dieEl.classList.add('rolling');
  });

  const flicker = setInterval(() => {
    setFaces([randomFace(), randomFace(), randomFace()]);
  }, 85);

  setTimeout(() => {
    clearInterval(flicker);
    const finalFaces = [randomFace(), randomFace(), randomFace()];
    setFaces(finalFaces);
    rollButton.disabled = false;
  }, 1250);
}

rollButton.addEventListener('click', rollAllDice);
setFaces([randomFace(), randomFace(), randomFace()]);
