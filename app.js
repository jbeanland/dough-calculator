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
}
customElements.define('unit-card', UnitCard);

const inputs = {
  hydration_pct: document.getElementById('hydration_pct'),
  levain_pct: document.getElementById('levain_pct'),
  levain_hydration_pct: document.getElementById('levain_hydration_pct'),
  salt_pct: document.getElementById('salt_pct'),
  total_flour_g: document.getElementById('total_flour_g'),
  reserve_water_pct: document.getElementById('reserve_water_pct'),
};

const cards = {
  hydration_input:        document.querySelector('unit-card[name="hydration_input"]'),
  levain_input:           document.querySelector('unit-card[name="levain_input"]'),
  levain_hydration_input: document.querySelector('unit-card[name="levain_hydration_input"]'),
  salt_input:             document.querySelector('unit-card[name="salt_input"]'),
  total_flour_input:      document.querySelector('unit-card[name="total_flour_input"]'),
  reserve_water_input:    document.querySelector('unit-card[name="reserve_water_input"]'),
  total_weight_result:    document.querySelector('unit-card[name="total_weight_result"]'),
  flour_result:           document.querySelector('unit-card[name="flour_result"]'),
  water_result:           document.querySelector('unit-card[name="water_result"]'),
  levain_result:          document.querySelector('unit-card[name="levain_result"]'),
  salt_result:            document.querySelector('unit-card[name="salt_result"]'),
  reserve_water_result:   document.querySelector('unit-card[name="reserve_water_result"]'),
};

function formatDisplay(n, digits=0) {
  return new Intl.NumberFormat("en", {maximumFractionDigits: digits}).format(n)
}

function handleInput() {
  var hydration_pct = parseFloat(document.getElementById('hydration_pct').value.trim());
  var levain_pct = parseFloat(document.getElementById('levain_pct').value.trim());
  var levain_hydration_pct = parseFloat(document.getElementById('levain_hydration_pct').value.trim());
  var salt_pct = parseFloat(document.getElementById('salt_pct').value.trim());
  var total_flour_g = parseFloat(document.getElementById('total_flour_g').value.trim());
  var reserve_water_pct = parseFloat(document.getElementById('reserve_water_pct').value.trim());
  if (isNaN(reserve_water_pct)) reserve_water_pct = 0;

  // if empty, don't calculate anything
  if (isNaN(hydration_pct) || isNaN(levain_pct) || isNaN(levain_hydration_pct) || isNaN(salt_pct) || isNaN(total_flour_g)) {
    return;
  }

  const total_water_g = hydration_pct * total_flour_g / 100;
  const levain_flour_g = levain_pct * total_flour_g / 100;
  const levain_water_g = levain_flour_g * levain_hydration_pct / 100;
  const total_levain_g = levain_flour_g + levain_water_g;
  const new_flour_g = total_flour_g - levain_flour_g;
  const reserve_water_g = autolyseCheckbox.checked ? (total_flour_g * reserve_water_pct / 100) : 0;
  const new_water_g = total_water_g - levain_water_g - reserve_water_g;
  const new_salt_g = salt_pct * total_flour_g / 100;
  const total_weight_g = total_water_g + total_flour_g + new_salt_g;

  document.getElementById('weight_result_g').innerHTML = formatDisplay(total_weight_g);
  document.getElementById('water_result_g').innerHTML = formatDisplay(new_water_g - reserve_water_g);
  document.getElementById('flour_result_g').innerHTML = formatDisplay(new_flour_g);
  document.getElementById('levain_result_g').innerHTML = formatDisplay(total_levain_g);
  document.getElementById('salt_result_g').innerHTML = formatDisplay(new_salt_g, 2);
  document.getElementById('reserve_water_result_g').innerHTML = formatDisplay(reserve_water_g);

  renderFlours();
}

// Wire up inputs
for (const [name, input] of Object.entries(inputs)) {
  input.addEventListener('input', () => handleInput());
}

const autolyseCheckbox = document.getElementById('autolyse');

function setAutolyse(active) {
  autolyseCheckbox.checked = active;
  document.getElementById('results').classList.toggle('autolyse', active);
  document.getElementById('inputs-grid').classList.toggle('autolyse', active);
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
  p.set('h',  inputs.hydration_pct.value);
  p.set('l',  inputs.levain_pct.value);
  p.set('lh', inputs.levain_hydration_pct.value);
  p.set('s',  inputs.salt_pct.value);
  p.set('f',  inputs.total_flour_g.value);
  p.set('rw', inputs.reserve_water_pct.value);
  p.set('a',  autolyseCheckbox.checked ? '1' : '0');
  if (flourInputValues.length > 0) {
    p.set('fl', flourInputValues.join(','));
  } else {
    p.delete('fl');
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
    hydration_pct:      inputs.hydration_pct.value,
    levain_pct:         inputs.levain_pct.value,
    levain_hydration_pct: inputs.levain_hydration_pct.value,
    salt_pct:           inputs.salt_pct.value,
    total_flour_g:      inputs.total_flour_g.value,
    reserve_water_pct:  inputs.reserve_water_pct.value,
    autolyse:           autolyseCheckbox.checked,
    flours:             JSON.stringify(flourInputValues),
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
      inputs.hydration_pct.value       = s.hydration_pct;
      inputs.levain_pct.value          = s.levain_pct;
      inputs.levain_hydration_pct.value = s.levain_hydration_pct;
      inputs.salt_pct.value            = s.salt_pct;
      inputs.total_flour_g.value       = s.total_flour_g;
      inputs.reserve_water_pct.value   = s.reserve_water_pct;
      flourInputValues = JSON.parse(s.flours || '[]');
      if (flourInputValues.length > 0) {
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

const SETTINGS_KEYS = ['hydration_pct', 'levain_pct', 'levain_hydration_pct', 'salt_pct', 'total_flour_g', 'reserve_water_pct', 'autolyse', 'flours'];

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
  if (p.has('h'))  inputs.hydration_pct.value      = p.get('h');
  if (p.has('l'))  inputs.levain_pct.value          = p.get('l');
  if (p.has('lh')) inputs.levain_hydration_pct.value = p.get('lh');
  if (p.has('s'))  inputs.salt_pct.value            = p.get('s');
  if (p.has('f'))  inputs.total_flour_g.value       = p.get('f');
  if (p.has('rw')) inputs.reserve_water_pct.value   = p.get('rw');
  if (p.has('a'))  setAutolyse(p.get('a') === '1');
  if (p.has('fl')) {
    flourInputValues = p.get('fl').split(',').filter(Boolean);
    if (flourInputValues.length > 0) {
      floursToggle.setAttribute('aria-expanded', 'true');
      floursContent.hidden = false;
    }
    else {
      floursToggle.setAttribute('aria-expanded', 'false');
      floursContent.hidden = true;
    }
  }
  handleInput();
  renderSaves();
  renderFlours();
};

//////////////////////////////////////////////////////
// Different Flours
const floursToggle = document.getElementById('flours-toggle');
const floursContent = document.getElementById('flours-content');
const floursGrid = document.getElementById('flours-grid');
const flourAdd = document.getElementById('flour-add');
const flourRemove = document.getElementById('flour-remove');

let flourInputValues = []; // values for Flour 2, 3, ... (Flour 1 is computed)

function flour1Value() {
  const sum = flourInputValues.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  return parseFloat((100 - sum).toFixed(2));
}

function updateFlour1() {
  const val = flour1Value();
  const totalFlour = parseFloat(inputs.total_flour_g.value) || 0;
  const levain_pct = parseFloat(inputs.levain_pct.value) || 0;
  const levain_flour_g = levain_pct * totalFlour / 100;

  const span = document.getElementById('flour-1-value');
  const grams = document.getElementById('flour-1-grams');
  if (span) span.textContent = val;
  if (grams) grams.textContent = Math.round(val / 100 * totalFlour - levain_flour_g).toLocaleString('en-US');
}

function renderFlours() {
  floursGrid.innerHTML = '';

  const totalFlour = parseFloat(inputs.total_flour_g.value) || 0;
  const f1 = flour1Value();
  const card1 = document.createElement('unit-card');
  card1.setAttribute('label', 'Flour 1');
  card1.setAttribute('name', 'flour_1');
  card1.innerHTML = `
    <span class="result" id="flour-1-value" data-unit="%">${f1}</span>
    <span class="result flour-grams" id="flour-1-grams" data-unit="g">${Math.round(f1 / 100 * totalFlour).toLocaleString('en-US')}</span>
  `;
  floursGrid.append(card1);

  flourInputValues.forEach((val, i) => {
    const card = document.createElement('unit-card');
    card.setAttribute('label', `Flour ${i + 2}`);
    card.setAttribute('name', `flour_${i + 2}`);
    const pct = parseFloat(val) || 0;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = '0';
    input.step = 'any';
    input.autocomplete = 'off';
    input.value = val;
    const gramsSpan = document.createElement('span');
    gramsSpan.className = 'result flour-grams';
    gramsSpan.textContent = Math.round(pct / 100 * totalFlour).toLocaleString('en-US');
    input.addEventListener('input', () => {
      flourInputValues[i] = input.value;
      gramsSpan.textContent = Math.round((parseFloat(input.value) || 0) / 100 * totalFlour).toLocaleString('en-US');
      updateFlour1();
    });
    input.dataset.unit = '%';
    gramsSpan.dataset.unit = 'g';
    card.append(input, gramsSpan);
    floursGrid.append(card);
  });

  flourRemove.disabled = flourInputValues.length === 0;
  updateFlour1();
}

floursToggle.addEventListener('click', () => {
  const expanded = floursToggle.getAttribute('aria-expanded') === 'true';
  floursToggle.setAttribute('aria-expanded', String(!expanded));
  floursContent.hidden = expanded;
});

flourAdd.addEventListener('click', () => {
  flourInputValues.push('');
  renderFlours();
});

flourRemove.addEventListener('click', () => {
  if (flourInputValues.length > 0) {
    flourInputValues.pop();
    renderFlours();
  }
});
