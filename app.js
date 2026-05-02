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
autolyseCheckbox.addEventListener('change', () => {
  const active = autolyseCheckbox.checked;
  document.getElementById('results').classList.toggle('autolyse', active);
  document.getElementById('inputs-grid').classList.toggle('autolyse', active);
  handleInput();
});

window.onload = function() {
  handleInput();
};
