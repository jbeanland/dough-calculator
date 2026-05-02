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
  // Show up to 4 significant decimal places without trailing zeros
  const s = parseFloat(n.toFixed(4)).toString();
  return s;
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
  document.getElementById('salt_result_g').innerHTML = formatDisplay(round(new_salt_g));
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

// Restore from URL params on load
window.onload = function() {
  const p = new URLSearchParams(location.search);
  if (p.has('h'))  inputs.hydration_pct.value      = p.get('h');
  if (p.has('l'))  inputs.levain_pct.value          = p.get('l');
  if (p.has('lh')) inputs.levain_hydration_pct.value = p.get('lh');
  if (p.has('s'))  inputs.salt_pct.value            = p.get('s');
  if (p.has('f'))  inputs.total_flour_g.value       = p.get('f');
  if (p.has('rw')) inputs.reserve_water_pct.value   = p.get('rw');
  if (p.has('a'))  setAutolyse(p.get('a') === '1');
  handleInput();
};
