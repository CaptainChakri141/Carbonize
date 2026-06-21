const test = require('node:test');
const assert = require('node:assert');
const {
  GLOBAL_SUSTAINABLE_TARGET,
  NATIONAL_AVERAGE_US,
  RECOMMENDATIONS,
  CHALLENGES_DATABASE,
  calculateEmissions,
  generateInsights,
  calculateProjectedSavings,
  DEFAULT_STATE,
  safeLoadState,
  escapeHTML,
  getState,
  setState
} = require('./app.js');

test('Security utilities: HTML escaping', () => {
  assert.strictEqual(escapeHTML('test'), 'test');
  assert.strictEqual(escapeHTML('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(escapeHTML('"hello" & \'world\''), '&quot;hello&quot; &amp; &#039;world&#039;');
});

test('Security utilities: LocalStorage state validation & prototype pollution protection', () => {
  // Test loading valid state
  const validStateJSON = JSON.stringify({
    theme: 'light',
    calculator: {
      carMileage: 12000,
      carFuel: 'electric'
    },
    ecoPoints: 150
  });
  
  const loaded = safeLoadState(validStateJSON);
  assert.ok(loaded);
  assert.strictEqual(loaded.theme, 'light');
  assert.strictEqual(loaded.calculator.carMileage, 12000);
  assert.strictEqual(loaded.calculator.carFuel, 'electric');
  assert.strictEqual(loaded.ecoPoints, 150);
  // Unspecified calculator keys should fall back to default values
  assert.strictEqual(loaded.calculator.flights, DEFAULT_STATE.calculator.flights);
  
  // Test prototype pollution defense
  const pollutedStateJSON = '{"theme":"light","__proto__":{"polluted":true},"calculator":{}}';
  const clean = safeLoadState(pollutedStateJSON);
  assert.strictEqual(clean, null); // should reject completely
  
  // Test stripping of invalid keys
  const extraKeysStateJSON = JSON.stringify({
    theme: 'dark',
    calculator: {
      carMileage: 5000
    },
    maliciousKey: 'maliciousContent'
  });
  const filtered = safeLoadState(extraKeysStateJSON);
  assert.ok(filtered);
  assert.strictEqual(filtered.maliciousKey, undefined);
  assert.strictEqual(filtered.theme, 'dark');

  // Test type validation
  const wrongTypesStateJSON = JSON.stringify({
    theme: 'dark',
    calculator: {
      carMileage: 'five thousand' // should fall back to default
    },
    ecoPoints: 'one hundred' // should fall back to default
  });
  const typeChecked = safeLoadState(wrongTypesStateJSON);
  assert.ok(typeChecked);
  assert.strictEqual(typeChecked.calculator.carMileage, DEFAULT_STATE.calculator.carMileage);
  assert.strictEqual(typeChecked.ecoPoints, DEFAULT_STATE.ecoPoints);
});

test('Calculation engine: default state emissions', () => {
  setState(JSON.parse(JSON.stringify(DEFAULT_STATE)));
  const emissions = calculateEmissions();
  
  // Transport: 6000 * 0.411 + 5 * 52 * 1.2 + 2 * 250 = 2466 + 312 + 500 = 3278
  assert.strictEqual(emissions.transport, 3278);
  // Energy: (80 * 12 * 0.85 * 0.9) + (40 * 12 * 1.2) = 734.4 + 576 = 1310.4 -> 1310
  assert.strictEqual(emissions.energy, 1310);
  // Diet: 1900 * (1 - 0.2 * 0.1) = 1900 * 0.98 = 1862
  assert.strictEqual(emissions.food, 1862);
  // Shopping: (2 * 12 * 15 + 1 * 150) * (1 - 0.4 * 0.2) = (360 + 150) * 0.92 = 510 * 0.92 = 469.2 -> 469
  assert.strictEqual(emissions.shopping, 469);
});

test('Calculation engine: boundary limits', () => {
  // 1. All inputs at absolute minimum (0)
  const minState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  minState.calculator = {
    carMileage: 0,
    carFuel: 'electric',
    publicTransit: 0,
    flights: 0,
    electricBill: 0,
    renewableShare: 100, // 100% renewable
    heatingBill: 0,
    heatingFuel: 'none',
    dietType: 'vegan',
    localFood: 100, // 100% local
    clothingItems: 0,
    techItems: 0,
    recycleShare: 100 // 100% recycle
  };
  setState(minState);
  const minEmissions = calculateEmissions();
  assert.strictEqual(minEmissions.transport, 0);
  assert.strictEqual(minEmissions.energy, 0);
  // Diet: 1000 * (1 - 1 * 0.1) = 900
  assert.strictEqual(minEmissions.food, 900);
  assert.strictEqual(minEmissions.shopping, 0);

  // 2. All inputs at maximum settings
  const maxState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  maxState.calculator = {
    carMileage: 30000,
    carFuel: 'diesel', // highest emission fuel
    publicTransit: 40,
    flights: 15,
    electricBill: 400,
    renewableShare: 0,
    heatingBill: 300,
    heatingFuel: 'oil', // highest emission heating
    dietType: 'heavy-meat',
    localFood: 0,
    clothingItems: 15,
    techItems: 10,
    recycleShare: 0
  };
  setState(maxState);
  const maxEmissions = calculateEmissions();
  // Transport: 30000 * 0.45 + 40 * 52 * 1.2 + 15 * 250 = 13500 + 2496 + 3750 = 19746
  assert.strictEqual(maxEmissions.transport, 19746);
  // Energy: (400 * 12 * 0.85 * 1.0) + (300 * 12 * 1.8) = 4080 + 6480 = 10560
  assert.strictEqual(maxEmissions.energy, 10560);
  // Diet: 3000 * (1 - 0) = 3000
  assert.strictEqual(maxEmissions.food, 3000);
  // Shopping: (15 * 12 * 15 + 10 * 150) * (1 - 0) = (2700 + 1500) = 4200
  assert.strictEqual(maxEmissions.shopping, 4200);
});

test('Insights logic: classifications', () => {
  // Eco Hero: <= 2000
  const heroInsights = generateInsights({ transport: 500, energy: 500, food: 500, shopping: 400 });
  assert.strictEqual(heroInsights.rating, 'Eco Hero');
  assert.strictEqual(heroInsights.colorClass, 'text-success');

  // Eco Conscious: <= 6000
  const consciousInsights = generateInsights({ transport: 1500, energy: 1500, food: 1000, shopping: 1000 });
  assert.strictEqual(consciousInsights.rating, 'Eco Conscious');
  assert.strictEqual(consciousInsights.colorClass, 'text-info');

  // Moderate Impact: <= 16000
  const moderateInsights = generateInsights({ transport: 4000, energy: 3000, food: 2000, shopping: 2000 });
  assert.strictEqual(moderateInsights.rating, 'Moderate Impact');
  assert.strictEqual(moderateInsights.colorClass, 'text-warning');

  // High Impact: > 16000
  const highInsights = generateInsights({ transport: 8000, energy: 6000, food: 3000, shopping: 2000 });
  assert.strictEqual(highInsights.rating, 'High Carbon Footprint');
  assert.strictEqual(highInsights.colorClass, 'text-danger');
});

test('Savings logic: action plan calculations', () => {
  const emissions = { transport: 4000, energy: 3000, food: 2000, shopping: 2000 };
  const completedRecs = ['t1', 'e1']; // t1 = 800 kg ($450), e1 = 150 kg ($75)
  const results = calculateProjectedSavings(emissions, completedRecs);
  
  assert.strictEqual(results.currentTotal, 11000);
  assert.strictEqual(results.co2Savings, 800 + 150);
  assert.strictEqual(results.cashSavings, 450 + 75);
  assert.strictEqual(results.projectedTotal, 11000 - 950);
});

test('Calculation details: vehicle fuel type multipliers', () => {
  const calcState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  calcState.calculator = {
    ...DEFAULT_STATE.calculator,
    carMileage: 10000,
    publicTransit: 0,
    flights: 0
  };

  // Test gasoline (Petrol) multiplier = 0.411
  calcState.calculator.carFuel = 'gas';
  setState(calcState);
  assert.strictEqual(calculateEmissions().transport, 4110);

  // Test diesel multiplier = 0.450
  calcState.calculator.carFuel = 'diesel';
  setState(calcState);
  assert.strictEqual(calculateEmissions().transport, 4500);

  // Test hybrid multiplier = 0.200
  calcState.calculator.carFuel = 'hybrid';
  setState(calcState);
  assert.strictEqual(calculateEmissions().transport, 2000);

  // Test electric vehicle multiplier = 0.100
  calcState.calculator.carFuel = 'electric';
  setState(calcState);
  assert.strictEqual(calculateEmissions().transport, 1000);
});

test('Calculation details: heating source factors', () => {
  const calcState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  calcState.calculator = {
    ...DEFAULT_STATE.calculator,
    electricBill: 0, // isolate heating
    renewableShare: 0,
    heatingBill: 100
  };

  // Gas heating factor = 1.2 (100 * 12 * 1.2 = 1440)
  calcState.calculator.heatingFuel = 'gas';
  setState(calcState);
  assert.strictEqual(calculateEmissions().energy, 1440);

  // Electric heating factor = 0.85 (100 * 12 * 0.85 = 1020)
  calcState.calculator.heatingFuel = 'electric';
  setState(calcState);
  assert.strictEqual(calculateEmissions().energy, 1020);

  // Boiler Oil factor = 1.8 (100 * 12 * 1.8 = 2160)
  calcState.calculator.heatingFuel = 'oil';
  setState(calcState);
  assert.strictEqual(calculateEmissions().energy, 2160);

  // None factor = 0 (100 * 12 * 0 = 0)
  calcState.calculator.heatingFuel = 'none';
  setState(calcState);
  assert.strictEqual(calculateEmissions().energy, 0);
});

test('Calculation details: dietary footprint levels', () => {
  const calcState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  calcState.calculator = {
    ...DEFAULT_STATE.calculator,
    localFood: 0 // local food share = 0
  };

  // Vegan = 1000
  calcState.calculator.dietType = 'vegan';
  setState(calcState);
  assert.strictEqual(calculateEmissions().food, 1000);

  // Vegetarian = 1400
  calcState.calculator.dietType = 'vegetarian';
  setState(calcState);
  assert.strictEqual(calculateEmissions().food, 1400);

  // Moderate = 1900
  calcState.calculator.dietType = 'moderate';
  setState(calcState);
  assert.strictEqual(calculateEmissions().food, 1900);

  // Heavy Meat = 3000
  calcState.calculator.dietType = 'heavy-meat';
  setState(calcState);
  assert.strictEqual(calculateEmissions().food, 3000);
});
