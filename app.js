'use strict';

const inputs = {
  hydration_pct: document.getElementById('hydration_pct'),
  levain_pct: document.getElementById('levain_pct'),
  levain_hydration_pct: document.getElementById('levain_hydration_pct'),
  salt_pct: document.getElementById('salt_pct'),
  total_flour_g: document.getElementById('total_flour_g'),
  reserve_water_pct: document.getElementById('reserve_water_pct'),
};

function round(n, decimals = 6) {
  return parseFloat(n.toFixed(decimals));
}

function formatDisplay(n) {
  return Math.round(n).toString();
}

function formatSalt(n) {
  return n.toFixed(2);
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

  document.getElementById('weight_result_g').innerHTML = formatDisplay(round(total_weight_g));
  document.getElementById('water_result_g').innerHTML = formatDisplay(round(new_water_g - reserve_water_g));
  document.getElementById('flour_result_g').innerHTML = formatDisplay(round(new_flour_g));
  document.getElementById('levain_result_g').innerHTML = formatDisplay(round(total_levain_g));
  document.getElementById('salt_result_g').innerHTML = formatSalt(new_salt_g);
  document.getElementById('reserve_water_result_g').innerHTML = formatDisplay(round(reserve_water_g));


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
      setAutolyse(s.autolyse);
      handleInput();
    });

    row.append(label, time, del);
    list.append(row);
  }
}

const saveLabelInput = document.getElementById('save-label-input');

const SETTINGS_KEYS = ['hydration_pct', 'levain_pct', 'levain_hydration_pct', 'salt_pct', 'total_flour_g', 'reserve_water_pct', 'autolyse'];

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
  handleInput();
  renderSaves();
  renderFlours();
};

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
  const span = document.getElementById('flour-1-value');
  if (span) span.textContent = flour1Value();
}

function renderFlours() {
  floursGrid.innerHTML = '';

  const card1 = document.createElement('div');
  card1.className = 'unit-card';
  card1.innerHTML = `
    <div class="unit-header"><span class="unit-name">Flour 1</span></div>
    <div class="input-wrapper"><span class="result" id="flour-1-value">${flour1Value()}</span></div>
  `;
  floursGrid.append(card1);

  flourInputValues.forEach((val, i) => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    const header = document.createElement('div');
    header.className = 'unit-header';
    header.innerHTML = `<span class="unit-name">Flour ${i + 2}</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = '0';
    input.step = 'any';
    input.autocomplete = 'off';
    input.value = val;
    input.addEventListener('input', () => {
      flourInputValues[i] = input.value;
      updateFlour1();
    });
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    wrapper.append(input);
    card.append(header, wrapper);
    floursGrid.append(card);
  });

  flourRemove.disabled = flourInputValues.length === 0;
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
