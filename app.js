'use strict';

class UnitCard extends HTMLElement {
  connectedCallback() {
    if (!this.querySelector(':scope > .unit-header')) {
      const label = this.getAttribute('label');
      if (label) {
        const header = document.createElement('div');
        header.className = 'unit-header';
        header.innerHTML = `<span class="unit-name">${label}</span>`;
        this.prepend(header);
      }
    }
    for (const child of [...this.children]) {
      if (child.classList.contains('unit-header') || child.classList.contains('input-wrapper')) continue;
      const wrapper = document.createElement('div');
      wrapper.className = 'input-wrapper';
      if (child.dataset.unit) {
        wrapper.dataset.unit = child.dataset.unit;
        child.removeAttribute('data-unit');
      }
      child.replaceWith(wrapper);
      wrapper.append(child);
    }
  }

  getInput() {
    return parseFloat(this.querySelector('input')?.value?.trim()) ?? null;
  }

  setInput(value) {
    const input = this.querySelector('input');
    if (input) input.value = value;
  }

  setResult(value) {
    const span = this.querySelector('span.result');
    if (span) span.innerHTML = value;
  }
}
customElements.define('unit-card', UnitCard);

const cards = {
  // Inputs
  hydration_input:        document.querySelector('unit-card[name="hydration_input"]'),
  levain_input:           document.querySelector('unit-card[name="levain_input"]'),
  levain_ratio_feed:      document.getElementById('levain_ratio_feed'),
  levain_ratio_flour:     document.getElementById('levain_ratio_flour'),
  levain_ratio_water:     document.getElementById('levain_ratio_water'),
  salt_input:             document.querySelector('unit-card[name="salt_input"]'),
  total_flour_input:      document.querySelector('unit-card[name="total_flour_input"]'),
  reserve_water_input:    document.querySelector('unit-card[name="reserve_water_input"]'),
  levain_leftover_input:  document.querySelector('unit-card[name="levain_leftover_input"]'),
  // Outputs
  total_weight_result:    document.querySelector('unit-card[name="total_weight_result"]'),
  flour_result:           document.querySelector('unit-card[name="flour_result"]'),
  water_result:           document.querySelector('unit-card[name="water_result"]'),
  levain_result:          document.querySelector('unit-card[name="levain_result"]'),
  salt_result:            document.querySelector('unit-card[name="salt_result"]'),
  reserve_water_result:   document.querySelector('unit-card[name="reserve_water_result"]'),
  levain_feed_result:     document.querySelector('unit-card[name="levain_feed_result"]'),
  levain_flour_result:    document.querySelector('unit-card[name="levain_flour_result"]'),
  levain_water_result:    document.querySelector('unit-card[name="levain_water_result"]'),
};

const autolyseCheckbox = document.getElementById('autolyse');


function formatDisplay(n, digits=0) {
  return new Intl.NumberFormat("en", {maximumFractionDigits: digits}).format(n)
}

function handleInput() {
  var hydration_pct = cards.hydration_input.getInput();
  var levain_pct = cards.levain_input.getInput();
  var ratio_flour = parseFloat(cards.levain_ratio_flour.value);
  var ratio_water = parseFloat(cards.levain_ratio_water.value);
  var ratio_feed = parseFloat(cards.levain_ratio_feed.value);
  var salt_pct = cards.salt_input.getInput();
  var total_flour_g = cards.total_flour_input.getInput();
  var reserve_water_pct = autolyseCheckbox.checked ? cards.reserve_water_input.getInput() : 0;
  var levain_leftover_g = parseFloat(cards.levain_leftover_input.getInput());

  if (
    isNaN(hydration_pct)
    || isNaN(levain_pct)
    || isNaN(ratio_flour)
    || isNaN(ratio_water)
    || isNaN(ratio_feed)
    || ratio_flour == 0
    || ratio_water == 0
    || ratio_feed == 0
    || isNaN(salt_pct)
    || isNaN(total_flour_g)
    || isNaN(reserve_water_pct)
    || isNaN(levain_leftover_g)
  ) {
    return
  }

  const levain_hydration_pct = (ratio_water / ratio_flour) * 100;
  const total_water_g = hydration_pct * total_flour_g / 100;
  const levain_flour_g = levain_pct * total_flour_g / 100;
  const levain_water_g = levain_flour_g * levain_hydration_pct / 100;
  const total_levain_g = levain_flour_g + levain_water_g;
  const new_flour_g = total_flour_g - levain_flour_g;
  const reserve_water_g = total_flour_g * reserve_water_pct / 100;
  const new_water_g = total_water_g - levain_water_g - reserve_water_g;
  const new_salt_g = salt_pct * total_flour_g / 100;
  const total_weight_g = total_water_g + total_flour_g + new_salt_g;
  const total_required_levain_g = total_levain_g + levain_leftover_g;
  const levain_ratio_sum = ratio_flour + ratio_water + ratio_feed;
  const levain_feed_starter_g = total_required_levain_g * (ratio_feed / levain_ratio_sum);
  const levain_feed_flour_g = total_required_levain_g * (ratio_flour / levain_ratio_sum);
  const levain_feed_water_g = total_required_levain_g * (ratio_water / levain_ratio_sum);

  cards.total_weight_result.setResult(formatDisplay(total_weight_g));
  cards.water_result.setResult(formatDisplay(new_water_g - reserve_water_g));
  cards.flour_result.setResult(formatDisplay(new_flour_g));
  cards.levain_result.setResult(formatDisplay(total_levain_g));
  cards.salt_result.setResult(formatDisplay(new_salt_g, 2));
  cards.reserve_water_result.setResult(formatDisplay(reserve_water_g));
  cards.levain_feed_result.setResult(formatDisplay(levain_feed_starter_g));
  cards.levain_flour_result.setResult(formatDisplay(levain_feed_flour_g));
  cards.levain_water_result.setResult(formatDisplay(levain_feed_water_g));

  renderFlours();
}

function setAutolyse(active) {
  autolyseCheckbox.checked = active;
  document.getElementById('results').classList.toggle('autolyse', active);
  document.getElementById('inputs-grid').classList.toggle('autolyse', active);
}


// Add input listeners
for (const card of Object.values(cards)) {
  const input = card instanceof HTMLInputElement ? card : card.querySelector('input');
  input?.addEventListener('input', () => handleInput());
}

autolyseCheckbox.addEventListener('change', () => {
  setAutolyse(autolyseCheckbox.checked);
  handleInput();
});

//////////////////////////////////////////////////////
// Share
const shareBtn = document.getElementById('share-btn');
const shareLabel = document.getElementById('share-label');
const shareToast = document.getElementById('share-toast');
let toastTimer = null;

function buildShareUrl() {
  const url = new URL(location.href);
  const p = url.searchParams;
  p.set('h',  cards.hydration_input.getInput());
  p.set('l',  cards.levain_input.getInput());
  p.set('lrf', cards.levain_ratio_feed.value);
  p.set('lrl', cards.levain_ratio_flour.value);
  p.set('lrw', cards.levain_ratio_water.value);
  p.set('s',  cards.salt_input.getInput());
  p.set('f',  cards.total_flour_input.getInput());
  p.set('rw', cards.reserve_water_input.getInput());
  p.set('a',  autolyseCheckbox.checked ? '1' : '0');
  if (flourInputValues.length > 0) {
    p.set('fl', flourInputValues.join(','));
  } else {
    p.delete('fl');
  }
  const hasCustomName = flourNames.some(n => n.trim() !== '');
  if (hasCustomName) {
    p.set('fn', flourNames.join('|'));
  } else {
    p.delete('fn');
  }
  return url.toString();
}

function showToast(msg, error = false) {
  shareToast.textContent = msg;
  shareToast.className = 'share-toast visible' + (error ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { shareToast.className = 'share-toast'; }, 2500);
}

shareBtn.addEventListener('click', () => {
  const url = buildShareUrl();
  history.replaceState(null, '', url);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      shareLabel.textContent = 'Copied!';
      showToast('Link copied to clipboard.');
      setTimeout(() => { shareLabel.textContent = 'Share'; }, 2000);
    }).catch(() => showToast('URL updated in address bar.'));
  } else {
    showToast('URL updated in address bar.');
  }
});

//////////////////////////////////////////////////////
// Saves
const STORAGE_KEY = 'dough_saves';

function getSaves() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function putSaves(saves) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

function currentSettings() {
  return {
    hydration_pct:      cards.hydration_input.getInput(),
    levain_pct:         cards.levain_input.getInput(),
    levain_ratio_feed:  cards.levain_ratio_feed.value,
    levain_ratio_flour: cards.levain_ratio_flour.value,
    levain_ratio_water: cards.levain_ratio_water.value,
    salt_pct:           cards.salt_input.getInput(),
    total_flour_g:      cards.total_flour_input.getInput(),
    reserve_water_pct:  cards.reserve_water_input.getInput(),
    autolyse:           autolyseCheckbox.checked,
    flours:             JSON.stringify(flourInputValues),
    flourNames:         JSON.stringify(flourNames),
  };
}


function renderSaves() {
  const saves = getSaves();
  const section = document.getElementById('saves-section');
  const list = document.getElementById('saves-list');
  section.hidden = saves.length === 0;
  list.innerHTML = '';
  for (const save of saves) {
    const row = document.createElement('div');
    row.className = 'save-row';

    const label = document.createElement('span');
    label.className = 'save-label';
    label.textContent = save.label;

    const time = document.createElement('span');
    time.className = 'save-time';
    time.textContent = new Date(save.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const del = document.createElement('button');
    del.className = 'save-delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Delete save');
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      putSaves(getSaves().filter(s => s.id !== save.id));
      renderSaves();
    });

    row.addEventListener('click', () => {
      const s = save.settings;
      cards.hydration_input.setInput(s.hydration_pct);
      cards.levain_input.setInput(s.levain_pct);
      cards.levain_ratio_feed.value  = s.levain_ratio_feed  ?? cards.levain_ratio_feed.value;
      cards.levain_ratio_flour.value = s.levain_ratio_flour ?? cards.levain_ratio_flour.value;
      cards.levain_ratio_water.value = s.levain_ratio_water ?? cards.levain_ratio_water.value;
      cards.salt_input.setInput(s.salt_pct);
      cards.total_flour_input.setInput(s.total_flour_g);
      cards.reserve_water_input.setInput(s.reserve_water_pct);
      flourInputValues = JSON.parse(s.flours || '[]');
      flourNames = JSON.parse(s.flourNames || '[""]');
      while (flourNames.length < flourInputValues.length + 1) flourNames.push('');
      if (flourInputValues.length > 0 || flourNames.some(n => n.trim() !== '')) {
        floursToggle.setAttribute('aria-expanded', 'true');
        floursContent.hidden = false;
      } else {
        floursToggle.setAttribute('aria-expanded', 'false');
        floursContent.hidden = true;
      }
      setAutolyse(s.autolyse);
      handleInput();
    });

    row.append(label, time, del);
    list.append(row);
  }
}

const saveLabelInput = document.getElementById('save-label-input');
saveLabelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('save-btn').click();
});

const SETTINGS_KEYS = ['hydration_pct', 'levain_pct', 'levain_ratio_feed', 'levain_ratio_flour', 'levain_ratio_water', 'salt_pct', 'total_flour_g', 'reserve_water_pct', 'autolyse', 'flours', 'flourNames'];

function settingsEqual(a, b) {
  return SETTINGS_KEYS.every(k => String(a[k]) === String(b[k]));
}

document.getElementById('save-btn').addEventListener('click', () => {
  const label = saveLabelInput.value.trim();
  if (!label) {
    saveLabelInput.focus();
    return;
  }
  const saves = getSaves();
  const current = currentSettings();

  const dupeName = saves.find(s => s.label.toLowerCase() === label.toLowerCase());
  if (dupeName) {
    showToast(`"${dupeName.label}" already exists.`, true);
    return;
  }

  const dupeSettings = saves.find(s => settingsEqual(s.settings, current));
  if (dupeSettings) {
    showToast(`These settings already exist as "${dupeSettings.label}".`, true);
    return;
  }

  saves.unshift({ id: Date.now(), label, settings: current });
  putSaves(saves);
  renderSaves();
  saveLabelInput.value = '';
});

//////////////////////////////////////////////////////
// Theme toggle
const THEME_KEY = 'dough_theme';
const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'light' ? 'dark' : 'light');
});

//////////////////////////////////////////////////////
// Restore from URL params on load
window.onload = function() {
  setTheme(localStorage.getItem(THEME_KEY) || 'dark');

  const p = new URLSearchParams(location.search);
  if (p.has('h'))  cards.hydration_input.setInput(p.get('h'));
  if (p.has('l'))  cards.levain_input.setInput(p.get('l'));
  if (p.has('lrf')) cards.levain_ratio_feed.value  = p.get('lrf');
  if (p.has('lrl')) cards.levain_ratio_flour.value = p.get('lrl');
  if (p.has('lrw')) cards.levain_ratio_water.value = p.get('lrw');
  if (p.has('s'))  cards.salt_input.setInput(p.get('s'));
  if (p.has('f'))  cards.total_flour_input.setInput(p.get('f'));
  if (p.has('rw')) cards.reserve_water_input.setInput(p.get('rw'));
  if (p.has('a'))  setAutolyse(p.get('a') === '1');
  if (p.has('fl')) {
    flourInputValues = p.get('fl').split(',').filter(Boolean);
  }
  if (p.has('fn')) {
    flourNames = p.get('fn').split('|');
    while (flourNames.length < flourInputValues.length + 1) flourNames.push('');
  }
  if (p.has('fl') || p.has('fn')) {
    const floursOpen = flourInputValues.length > 0 || flourNames.some(n => n.trim() !== '');
    floursToggle.setAttribute('aria-expanded', String(floursOpen));
    floursContent.hidden = !floursOpen;
  }
  handleInput();
  renderSaves();
};

//////////////////////////////////////////////////////
// Different Flours
const floursToggle = document.getElementById('flours-toggle');
const floursContent = document.getElementById('flours-content');
const floursGrid = document.getElementById('flours-grid');
const flourAdd = document.getElementById('flour-add');
const flourRemove = document.getElementById('flour-remove');

let flourInputValues = []; // values for Flour 2, 3, ... (Flour 1 is computed)
let flourNames = [''];    // index 0 = Flour 1, index n = Flour n+1

function defaultFlourName(n) { return 'Flour ' + n; }

function flour1Value() {
  const sum = flourInputValues.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  return parseFloat((100 - sum).toFixed(2));
}

function updateFlour1() {
  const val = flour1Value();
  const totalFlour = parseFloat(cards.total_flour_input.getInput()) || 0;
  const levain_pct = parseFloat(cards.levain_input.getInput()) || 0;
  const levain_flour_g = levain_pct * totalFlour / 100;

  const flour_pct = document.getElementById('flour-1-value');
  const flour_grams = document.getElementById('flour-1-grams');
  if (flour_pct) flour_pct.textContent = val;
  if (flour_grams) flour_grams.textContent = formatDisplay(val / 100 * totalFlour - levain_flour_g);
}

function makeFlourNameInput(index) {
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'flour-name-input';
  nameInput.value = flourNames[index] || '';
  nameInput.placeholder = defaultFlourName(index + 1);
  nameInput.addEventListener('input', () => {
    flourNames[index] = nameInput.value;
    clearNamesBtn.disabled = !flourNames.some(n => n.trim() !== '');
  });
  return nameInput;
}

function renderFlours() {
  floursGrid.innerHTML = '';

  const totalFlour = parseFloat(cards.total_flour_input.getInput()) || 0;
  const f1 = flour1Value();

  const card1 = document.createElement('unit-card');
  card1.setAttribute('name', 'flour_1');
  const header1 = document.createElement('div');
  header1.className = 'unit-header';
  header1.append(makeFlourNameInput(0));
  const pct1Span = document.createElement('span');
  pct1Span.className = 'result';
  pct1Span.id = 'flour-1-value';
  pct1Span.dataset.unit = '%';
  pct1Span.textContent = f1;
  const grams1Span = document.createElement('span');
  grams1Span.className = 'result flour-grams';
  grams1Span.id = 'flour-1-grams';
  grams1Span.dataset.unit = 'g';
  grams1Span.textContent = formatDisplay(f1 / 100 * totalFlour);
  card1.append(header1, pct1Span, grams1Span);
  floursGrid.append(card1);

  flourInputValues.forEach((val, i) => {
    const card = document.createElement('unit-card');
    card.setAttribute('name', `flour_${i + 2}`);
    const header = document.createElement('div');
    header.className = 'unit-header';
    header.append(makeFlourNameInput(i + 1));
    const pct = parseFloat(val) || 0;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = '0';
    input.step = 'any';
    input.autocomplete = 'off';
    input.value = val;
    const gramsSpan = document.createElement('span');
    gramsSpan.className = 'result flour-grams';
    gramsSpan.textContent = formatDisplay(pct / 100 * totalFlour);
    input.addEventListener('input', () => {
      flourInputValues[i] = input.value;
      gramsSpan.textContent = formatDisplay((parseFloat(input.value) || 0) / 100 * totalFlour);
      updateFlour1();
    });
    input.dataset.unit = '%';
    gramsSpan.dataset.unit = 'g';
    card.append(header, input, gramsSpan);
    floursGrid.append(card);
  });

  flourRemove.disabled = flourInputValues.length === 0;
  clearNamesBtn.disabled = !flourNames.some(n => n.trim() !== '');
  updateFlour1();
}

floursToggle.addEventListener('click', () => {
  const expanded = floursToggle.getAttribute('aria-expanded') === 'true';
  floursToggle.setAttribute('aria-expanded', String(!expanded));
  floursContent.hidden = expanded;
});

const clearNamesBtn = document.getElementById('flour-clear-names');

flourAdd.addEventListener('click', () => {
  flourInputValues.push('');
  flourNames.push('');
  renderFlours();
});

flourRemove.addEventListener('click', () => {
  if (flourInputValues.length > 0) {
    flourInputValues.pop();
    flourNames.pop();
    renderFlours();
  }
});

clearNamesBtn.addEventListener('click', () => {
  flourNames = flourNames.map(() => '');
  renderFlours();
});
