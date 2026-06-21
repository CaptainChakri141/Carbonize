/**
 * ==========================================================================
 * CARBONIZE - APPLICATION CONTROLLER & ALGORITHMS
 * Manages user state, carbon calculations, SVG charts, and interactive tabs.
 * Supports loading over standard file:// protocols with zero CORS issues.
 * ==========================================================================
 */

(function() {

// Target threshold constants: 2,000 kg CO2e is the global sustainable limit per person/year.
const GLOBAL_SUSTAINABLE_TARGET = 2000;
const NATIONAL_AVERAGE_US = 16000;

/**
 * Recommendations Database with carbon reduction weights (in kg CO2e per year)
 */
const RECOMMENDATIONS = {
  transport: [
    {
      id: "t1",
      title: "Switch to public transit or carpooling",
      desc: "Commuting by transit or sharing rides twice a week reduces your transport emissions significantly.",
      savings: 800,
      costSavings: 450,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4.42 0-8 3.58-8 8v7.5c0 1.38 1.12 2.5 2.5 2.5h.5c.83 0 1.5-.67 1.5-1.5V17c0-.83-.67-1.5-1.5-1.5h-1V10c0-3.31 2.69-6 6-6s6 2.69 6 6v5.5h-1c-.83 0-1.5.67-1.5 1.5v1.5c0 .83.67 1.5 1.5 1.5h.5c1.38 0 2.5-1.12 2.5-2.5V10c0-4.42-3.58-8-8-8zm-4 15.5c0-.28.22-.5.5-.5s.5.22.5.5v1c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1zm8 0c0-.28.22-.5.5-.5s.5.22.5.5v1c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1z"/></svg>`
    },
    {
      id: "t2",
      title: "Adopt an eco-driving style",
      desc: "Avoid rapid acceleration, maintain optimal tire pressure, and use cruise control to save fuel.",
      savings: 300,
      costSavings: 150,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM6 16c-.83 0-1.5-.67-1.5-1.5S5.17 13 6 13s1.5.67 1.5 1.5S6.83 16 6 16zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`
    },
    {
      id: "t3",
      title: "Transition to Hybrid or Electric Vehicle",
      desc: "Replacing an ICE vehicle with an electric or hybrid alternative reduces driving emissions by 60% or more.",
      savings: 2500,
      costSavings: 900,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.77 5.03l1.4-1.4C19.96 2.47 18.27 2 16.5 2c-3.1 0-5.83 1.43-7.62 3.67L5.03 9.53C4.38 10.18 4 11.04 4 12c0 2.21 1.79 4 4 4h3v4c0 .55.45 1 1 1s1-.45 1-1v-4c2.21 0 4-1.79 4-4 0-.96-.38-1.82-1.03-2.47l-1.92-1.92c1.78-1.5 4.09-2.28 6.72-1.58zM10 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`
    }
  ],
  energy: [
    {
      id: "e1",
      title: "Install LED lighting in your home",
      desc: "Replacing standard incandescent bulbs with LEDs consumes up to 85% less electricity.",
      savings: 150,
      costSavings: 75,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C8.62 12.02 8 10.59 8 9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.59-.62 3.02-2.15 4.1z"/></svg>`
    },
    {
      id: "e2",
      title: "Upgrade to energy-star appliances",
      desc: "Upgrading old washers, refrigerators, or heat pumps saves power and water every single day.",
      savings: 400,
      costSavings: 180,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`
    },
    {
      id: "e3",
      title: "Switch to 100% renewable electricity",
      desc: "Enroll in green energy programs with your utility company or add household solar panels.",
      savings: 1800,
      costSavings: 200,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-17.93c1.78.37 3.32 1.39 4.34 2.87L13 11.28V4.07zM11 4.07v7.21L6.66 6.94C7.68 5.46 9.22 4.44 11 4.07zM4.07 13c.37-1.78 1.39-3.32 2.87-4.34L11.28 13H4.07zm7.21 9.93C9.5 22.56 7.96 21.54 6.94 20.06L11 15.72v7.21zm1.72-7.21l4.34 4.34c-1.02 1.48-2.56 2.5-4.34 2.87V15.72zm7-2.72h-7.21l4.34-4.34c1.48 1.02 2.5 2.56 2.87 4.34z"/></svg>`
    }
  ],
  food: [
    {
      id: "f1",
      title: "Adopt a plant-forward diet",
      desc: "Reducing red meat intake and choosing plant-based meals cuts agricultural emissions dramatically.",
      savings: 950,
      costSavings: 350,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L11 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H9v-2h2c.55 0 1-.45 1-1V7h2c1.66 0 3-1.34 3-3 .6.42 1.13.95 1.55 1.55-.54.4-1.05.95-1.55 1.55.77 1.02 1.31 2.21 1.55 3.51.52.27 1.01.62 1.45 1.05-.18 2.05-1.03 3.86-2.35 5.25z"/></svg>`
    },
    {
      id: "f2",
      title: "Zero-waste grocery shopping",
      desc: "Plan your meals, shop with reusable bags, buy loose produce, and compost food scraps.",
      savings: 250,
      costSavings: 180,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`
    }
  ],
  shopping: [
    {
      id: "s1",
      title: "Buy items second-hand first",
      desc: "Buying pre-owned clothing and electronic equipment saves manufacturing and shipping footprint.",
      savings: 350,
      costSavings: 500,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/></svg>`
    },
    {
      id: "s2",
      title: "Practice active recycling & repairs",
      desc: "Repair broken goods rather than replacing them, and sort waste for proper recycling streams.",
      savings: 200,
      costSavings: 150,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>`
    }
  ]
};

/**
 * Calculates comparative insights and formats the summary
 */
function generateInsights(emissions) {
  const total = emissions.transport + emissions.energy + emissions.food + emissions.shopping;
  
  let rating = "";
  let feedback = "";
  let colorClass = "";

  if (total <= GLOBAL_SUSTAINABLE_TARGET) {
    rating = "Eco Hero";
    feedback = "Your carbon footprint is within the global sustainable limit. Excellent work in preserving our planet!";
    colorClass = "text-success";
  } else if (total <= 6000) {
    rating = "Eco Conscious";
    feedback = "Your footprint is well below national averages, but still above the sustainable global target. You are on the right track!";
    colorClass = "text-info";
  } else if (total <= NATIONAL_AVERAGE_US) {
    rating = "Moderate Impact";
    feedback = "Your carbon emissions are average. Implementing a few lifestyle improvements can dramatically shrink your footprint.";
    colorClass = "text-warning";
  } else {
    rating = "High Carbon Footprint";
    feedback = "Your emissions exceed standard averages. This is typically driven by high vehicle use, heating, or frequent travel. Let's look at ways to optimize.";
    colorClass = "text-danger";
  }

  const categories = [
    { name: "transport", val: emissions.transport, label: "Transportation" },
    { name: "energy", val: emissions.energy, label: "Home Energy" },
    { name: "food", val: emissions.food, label: "Diet & Food" },
    { name: "shopping", val: emissions.shopping, label: "Shopping & Consumption" }
  ];
  categories.sort((a, b) => b.val - a.val);
  const topContributor = categories[0];

  const primaryRecs = RECOMMENDATIONS[topContributor.name] || [];
  const secondaryRecs = RECOMMENDATIONS[categories[1].name] || [];
  
  const allSuggested = [
    ...primaryRecs.map(r => ({ ...r, category: topContributor.name, priority: "High Priority" })),
    ...secondaryRecs.map(r => ({ ...r, category: categories[1].name, priority: "Recommended" }))
  ];

  const comparisonUS = ((total / NATIONAL_AVERAGE_US) * 100).toFixed(0);
  const comparisonSustainable = ((total / GLOBAL_SUSTAINABLE_TARGET) * 100).toFixed(0);

  return {
    total,
    rating,
    feedback,
    colorClass,
    topContributor: topContributor.label,
    recommendations: allSuggested,
    comparisonUS,
    comparisonSustainable
  };
}

/**
 * Calculates projected savings if specific recommendations are completed
 */
function calculateProjectedSavings(emissions, completedRecIds) {
  const currentTotal = emissions.transport + emissions.energy + emissions.food + emissions.shopping;
  let co2Savings = 0;
  let cashSavings = 0;

  const allRecs = Object.values(RECOMMENDATIONS).flat();

  completedRecIds.forEach(id => {
    const rec = allRecs.find(r => r.id === id);
    if (rec) {
      co2Savings += rec.savings;
      cashSavings += rec.costSavings;
    }
  });

  const projectedTotal = Math.max(0, currentTotal - co2Savings);

  return {
    currentTotal,
    projectedTotal,
    co2Savings,
    cashSavings
  };
}

// Default application state
const DEFAULT_STATE = {
  theme: 'dark',
  calculator: {
    carMileage: 6000,
    carFuel: 'gas',
    publicTransit: 5,
    flights: 2,
    electricBill: 80,
    renewableShare: 10,
    heatingBill: 40,
    heatingFuel: 'gas',
    dietType: 'moderate',
    localFood: 20,
    clothingItems: 2,
    techItems: 1,
    recycleShare: 40
  },
  completedRecs: [],
  challenges: {
    meatFree: false,
    transitDay: false,
    unplugStandby: false,
    noFastFashion: false
  },
  ecoPoints: 0
};

let state = { ...DEFAULT_STATE };

// Cache DOM Elements for Efficiency
const DOM = typeof document !== 'undefined' ? {
  body: document.body,
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  navLinks: document.querySelectorAll('.nav-link'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  
  carMileage: document.getElementById('calc-car-mileage'),
  carFuel: document.getElementById('calc-car-fuel'),
  publicTransit: document.getElementById('calc-public-transit'),
  flights: document.getElementById('calc-flights'),
  electricBill: document.getElementById('calc-electric-bill'),
  renewableShare: document.getElementById('calc-renewable-share'),
  heatingBill: document.getElementById('calc-heating-bill'),
  heatingFuel: document.getElementById('calc-heating-fuel'),
  dietType: document.getElementById('calc-diet-type'),
  localFood: document.getElementById('calc-local-food'),
  clothingItems: document.getElementById('calc-clothing-items'),
  techItems: document.getElementById('calc-tech-items'),
  recycleShare: document.getElementById('calc-recycle-share'),
  
  valCarMileage: document.getElementById('val-car-mileage'),
  valPublicTransit: document.getElementById('val-public-transit'),
  valFlights: document.getElementById('val-flights'),
  valElectricBill: document.getElementById('val-electric-bill'),
  valRenewableShare: document.getElementById('val-renewable-share'),
  valHeatingBill: document.getElementById('val-heating-bill'),
  valLocalFood: document.getElementById('val-local-food'),
  valClothingItems: document.getElementById('val-clothing-items'),
  valTechItems: document.getElementById('val-tech-items'),
  valRecycleShare: document.getElementById('val-recycle-share'),
  
  metricTotal: document.getElementById('metric-total-value'),
  metricRating: document.getElementById('metric-rating'),
  metricComparisonUS: document.getElementById('metric-comparison-us'),
  metricComparisonTarget: document.getElementById('metric-comparison-target'),
  estimatorValue: document.getElementById('estimator-value'),
  estimatorProgress: document.getElementById('estimator-progress'),
  
  chartWrapper: document.getElementById('chart-wrapper'),
  
  recommendationsList: document.getElementById('recommendations-list'),
  challengesList: document.getElementById('challenges-list'),
  pointsBadge: document.getElementById('eco-points-badge'),
  
  selectedSavingsValue: document.getElementById('selected-savings-value'),
  projectedTotalValue: document.getElementById('projected-total-value'),
  projectedCashSavings: document.getElementById('projected-cash-savings'),
  projectionBarCurrent: document.getElementById('projection-bar-current'),
  projectionBarProjected: document.getElementById('projection-bar-projected'),
  projectionBarTarget: document.getElementById('projection-bar-target'),
  
  faqItems: document.querySelectorAll('.faq-item')
} : {};

// SVG Icons mapping
const ICONS = {
  sun: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.3 22h-.1c-5.4 0-10-4.6-10-10 0-4.3 2.7-8 6.6-9.4.6-.2 1.3.1 1.5.7.2.6-.1 1.3-.7 1.5-2.8 1-4.7 3.7-4.7 6.8 0 4.1 3.4 7.5 7.5 7.5 3.1 0 5.8-1.9 6.8-4.7.2-.6.9-.9 1.5-.7.6.2.9.9.7 1.5-.9 3.6-4.5 6.1-8.2 6.1z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 5.18 18c-.14.36-.02.76.28 1 .29.23.68.28 1.02.13 1.83-.79 7.74-3.04 9.52-11.13.19-.88-.56-1.57-1.35-1.35zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L11 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H9v-2h2c.55 0 1-.45 1-1V7h2c1.66 0 3-1.34 3-3 .6.42 1.13.95 1.55 1.55-.54.4-1.05.95-1.55 1.55.77 1.02 1.31 2.21 1.55 3.51.52.27 1.01.62 1.45 1.05-.18 2.05-1.03 3.86-2.35 5.25z"/></svg>`
};

/**
 * Calculates individual category emissions based on state settings.
 */
function calculateEmissions() {
  const calc = state.calculator;

  // 1. Transport Emissions
  let carFactor = 0.411; // gas average
  if (calc.carFuel === 'diesel') carFactor = 0.450;
  else if (calc.carFuel === 'hybrid') carFactor = 0.200;
  else if (calc.carFuel === 'electric') carFactor = 0.100;

  const transportEmissions = 
    (calc.carMileage * carFactor) + 
    (calc.publicTransit * 52 * 1.2) + 
    (calc.flights * 250);

  // 2. Energy Emissions
  const electricBillAnnual = calc.electricBill * 12;
  const electricEmissions = electricBillAnnual * 0.85 * (1 - calc.renewableShare / 100);

  let heatingFactor = 1.2; // gas
  if (calc.heatingFuel === 'electric') heatingFactor = 0.85;
  else if (calc.heatingFuel === 'oil') heatingFactor = 1.8;
  else if (calc.heatingFuel === 'none') heatingFactor = 0;

  const heatingEmissions = (calc.heatingBill * 12) * heatingFactor;
  const energyEmissions = electricEmissions + heatingEmissions;

  // 3. Food Emissions
  let dietFactor = 1900; // moderate meat (default)
  if (calc.dietType === 'vegan') dietFactor = 1000;
  else if (calc.dietType === 'vegetarian') dietFactor = 1400;
  else if (calc.dietType === 'heavy-meat') dietFactor = 3000;

  const foodEmissions = dietFactor * (1 - (calc.localFood / 100) * 0.10);

  // 4. Shopping Emissions
  const clothesEmissions = calc.clothingItems * 12 * 15;
  const techEmissions = calc.techItems * 150;
  const rawShoppingEmissions = clothesEmissions + techEmissions;
  const shoppingEmissions = rawShoppingEmissions * (1 - (calc.recycleShare / 100) * 0.20);

  return {
    transport: Math.round(transportEmissions),
    energy: Math.round(energyEmissions),
    food: Math.round(foodEmissions),
    shopping: Math.round(shoppingEmissions)
  };
}

/**
 * DRAW CUSTOM INTERACTIVE DYNAMIC SVG DONUT CHART
 */
function renderDonutChart(emissions) {
  const total = emissions.transport + emissions.energy + emissions.food + emissions.shopping;
  if (!DOM.chartWrapper) return;

  DOM.chartWrapper.textContent = '';

  if (total === 0) {
    DOM.chartWrapper.textContent = 'Enter values to display chart.';
    return;
  }

  const data = [
    { label: 'Transport', val: emissions.transport, color: 'var(--category-transport)' },
    { label: 'Energy', val: emissions.energy, color: 'var(--category-energy)' },
    { label: 'Food', val: emissions.food, color: 'var(--category-food)' },
    { label: 'Shopping', val: emissions.shopping, color: 'var(--category-shopping)' }
  ];

  const radius = 50;
  const cx = 70;
  const cy = 70;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * radius; // 314.159

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 140 140');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-label', `Carbon footprint distribution: total ${total} kilograms CO2 equivalent per year.`);
  svg.setAttribute('role', 'img');

  let accumulatedPercent = 0;

  data.forEach(item => {
    const percent = item.val / total;
    if (percent === 0) return;

    const strokeLength = circ * percent;
    const strokeOffset = circ - strokeLength + (circ * accumulatedPercent);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', item.color);
    circle.setAttribute('stroke-width', strokeWidth.toString());
    circle.setAttribute('stroke-dasharray', circ.toFixed(3));
    circle.setAttribute('stroke-dashoffset', strokeOffset.toFixed(3));
    circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    
    circle.style.transition = 'stroke-width var(--transition-fast), opacity var(--transition-fast)';
    circle.style.cursor = 'pointer';

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${item.label}: ${item.val.toLocaleString()} kg (${Math.round(percent * 100)}%)`;
    circle.appendChild(title);

    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('stroke-width', (strokeWidth + 3).toString());
    });
    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('stroke-width', strokeWidth.toString());
    });

    svg.appendChild(circle);
    accumulatedPercent -= percent;
  });

  const centerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  const textVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  textVal.setAttribute('x', cx.toString());
  textVal.setAttribute('y', (cy - 2).toString());
  textVal.setAttribute('text-anchor', 'middle');
  textVal.setAttribute('fill', 'var(--text-primary)');
  textVal.setAttribute('font-family', 'var(--font-heading)');
  textVal.setAttribute('font-weight', '800');
  textVal.setAttribute('font-size', '14px');
  textVal.textContent = (total / 1000).toFixed(1) + ' t';
  
  const textSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  textSub.setAttribute('x', cx.toString());
  textSub.setAttribute('y', (cy + 12).toString());
  textSub.setAttribute('text-anchor', 'middle');
  textSub.setAttribute('fill', 'var(--text-muted)');
  textSub.setAttribute('font-family', 'var(--font-body)');
  textSub.setAttribute('font-size', '7px');
  textSub.setAttribute('font-weight', '600');
  textSub.textContent = 'CO2e / YEAR';

  centerGroup.appendChild(textVal);
  centerGroup.appendChild(textSub);
  svg.appendChild(centerGroup);

  DOM.chartWrapper.appendChild(svg);
}

/**
 * CORE STATE SYNCHRONIZATION AND RENDER ENGINE
 */
function updateUI() {
  const emissions = calculateEmissions();
  const total = emissions.transport + emissions.energy + emissions.food + emissions.shopping;

  if (DOM.valCarMileage) DOM.valCarMileage.textContent = state.calculator.carMileage.toLocaleString();
  if (DOM.valPublicTransit) DOM.valPublicTransit.textContent = state.calculator.publicTransit;
  if (DOM.valFlights) DOM.valFlights.textContent = state.calculator.flights;
  if (DOM.valElectricBill) DOM.valElectricBill.textContent = state.calculator.electricBill;
  if (DOM.valRenewableShare) DOM.valRenewableShare.textContent = state.calculator.renewableShare;
  if (DOM.valHeatingBill) DOM.valHeatingBill.textContent = state.calculator.heatingBill;
  if (DOM.valLocalFood) DOM.valLocalFood.textContent = state.calculator.localFood;
  if (DOM.valClothingItems) DOM.valClothingItems.textContent = state.calculator.clothingItems;
  if (DOM.valTechItems) DOM.valTechItems.textContent = state.calculator.techItems;
  if (DOM.valRecycleShare) DOM.valRecycleShare.textContent = state.calculator.recycleShare;

  if (DOM.estimatorValue) {
    DOM.estimatorValue.textContent = `${total.toLocaleString()} kg CO2e`;
  }
  if (DOM.estimatorProgress) {
    const percent = Math.min(100, (total / NATIONAL_AVERAGE_US) * 100);
    DOM.estimatorProgress.style.width = `${percent}%`;
    
    if (total <= GLOBAL_SUSTAINABLE_TARGET) {
      DOM.estimatorProgress.style.background = 'var(--success)';
    } else if (total <= 6000) {
      DOM.estimatorProgress.style.background = 'linear-gradient(90deg, var(--success), var(--info))';
    } else if (total <= NATIONAL_AVERAGE_US) {
      DOM.estimatorProgress.style.background = 'linear-gradient(90deg, var(--info), var(--warning))';
    } else {
      DOM.estimatorProgress.style.background = 'linear-gradient(90deg, var(--warning), var(--danger))';
    }
  }

  if (DOM.metricTotal) {
    DOM.metricTotal.textContent = (total / 1000).toFixed(2);
  }

  const insights = generateInsights(emissions);
  
  if (DOM.metricRating) {
    DOM.metricRating.textContent = insights.rating;
    DOM.metricRating.className = `metric-value ${insights.colorClass}`;
  }
  
  if (DOM.metricComparisonUS) {
    DOM.metricComparisonUS.textContent = `${insights.comparisonUS}%`;
  }
  
  if (DOM.metricComparisonTarget) {
    DOM.metricComparisonTarget.textContent = `${insights.comparisonSustainable}%`;
  }

  renderDonutChart(emissions);
  renderRecommendations(insights.recommendations);
  updateSavingsProjection(emissions);

  try {
    localStorage.setItem('carbonize_state', JSON.stringify(state));
  } catch (e) {
    console.warn("Storage write failed", e);
  }
}

/**
 * Renders recommendations list safely
 */
function renderRecommendations(recommendations) {
  if (!DOM.recommendationsList) return;
  DOM.recommendationsList.textContent = '';

  if (recommendations.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = "No specific recommendations. Excellent job!";
    DOM.recommendationsList.appendChild(empty);
    return;
  }

  recommendations.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'card insight-card';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'insight-icon';
    iconSpan.innerHTML = rec.icon;
    
    const info = document.createElement('div');
    info.className = 'insight-info';

    const badge = document.createElement('span');
    badge.className = `action-impact ${rec.priority === 'High Priority' ? 'impact-high' : 'impact-med'}`;
    badge.style.alignSelf = 'start';
    badge.style.marginBottom = '0.25rem';
    badge.textContent = rec.priority;

    const title = document.createElement('h4');
    title.className = 'insight-title';
    title.textContent = rec.title;

    const desc = document.createElement('p');
    desc.className = 'insight-description';
    desc.textContent = rec.desc;

    const savingsFooter = document.createElement('div');
    savingsFooter.style.display = 'flex';
    savingsFooter.style.gap = '1rem';
    savingsFooter.style.marginTop = '0.5rem';
    savingsFooter.style.fontSize = '0.8rem';
    savingsFooter.style.fontWeight = '600';

    const co2Save = document.createElement('span');
    co2Save.style.color = 'var(--primary)';
    co2Save.textContent = `-${rec.savings} kg CO2e/yr`;

    const cashSave = document.createElement('span');
    cashSave.style.color = 'var(--warning)';
    cashSave.textContent = `+$${rec.costSavings}/yr`;

    savingsFooter.appendChild(co2Save);
    savingsFooter.appendChild(cashSave);

    info.appendChild(badge);
    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(savingsFooter);

    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn-action-complete';
    
    const isCompleted = state.completedRecs.includes(rec.id);
    if (isCompleted) {
      checkBtn.textContent = 'Selected';
      checkBtn.style.backgroundColor = 'var(--primary)';
      checkBtn.style.color = 'white';
    } else {
      checkBtn.textContent = 'Add to Plan';
    }

    checkBtn.setAttribute('aria-label', `${isCompleted ? 'Remove' : 'Add'} action: ${rec.title}`);

    checkBtn.addEventListener('click', () => {
      if (state.completedRecs.includes(rec.id)) {
        state.completedRecs = state.completedRecs.filter(id => id !== rec.id);
      } else {
        state.completedRecs.push(rec.id);
      }
      updateUI();
    });

    card.appendChild(iconSpan);
    card.appendChild(info);
    card.appendChild(checkBtn);

    DOM.recommendationsList.appendChild(card);
  });
}

/**
 * Calculates and renders forecast projection bars
 */
function updateSavingsProjection(emissions) {
  const results = calculateProjectedSavings(emissions, state.completedRecs);

  if (DOM.selectedSavingsValue) {
    DOM.selectedSavingsValue.textContent = results.co2Savings.toLocaleString();
  }
  if (DOM.projectedTotalValue) {
    DOM.projectedTotalValue.textContent = results.projectedTotalValue.toLocaleString();
  }
  if (DOM.projectedCashSavings) {
    DOM.projectedCashSavings.textContent = results.cashSavings.toLocaleString();
  }

  const maxBarVal = Math.max(results.currentTotal, GLOBAL_SUSTAINABLE_TARGET);
  
  if (DOM.projectionBarCurrent) {
    const currentPercent = (results.currentTotal / maxBarVal) * 100;
    DOM.projectionBarCurrent.style.width = `${currentPercent}%`;
  }
  if (DOM.projectionBarProjected) {
    const projectedPercent = (results.projectedTotalValue / maxBarVal) * 100;
    DOM.projectionBarProjected.style.width = `${projectedPercent}%`;
  }
  if (DOM.projectionBarTarget) {
    const targetPercent = (GLOBAL_SUSTAINABLE_TARGET / maxBarVal) * 100;
    DOM.projectionBarTarget.style.width = `${targetPercent}%`;
  }
}

/**
 * GAMIFIED ECO CHALLENGES LOGIC
 */
const CHALLENGES_DATABASE = [
  { id: 'meatFree', title: 'Meat-Free Day', points: 25, saving: 5, category: 'Food' },
  { id: 'transitDay', title: 'Walk, Cycle or Ride Transit', points: 35, saving: 8, category: 'Transport' },
  { id: 'unplugStandby', title: 'Unplug Standby Appliances', points: 15, saving: 2, category: 'Energy' },
  { id: 'noFastFashion', title: 'No New Purchases Week', points: 50, saving: 10, category: 'Shopping' }
];

function renderChallenges() {
  if (!DOM.challengesList) return;
  DOM.challengesList.textContent = '';

  CHALLENGES_DATABASE.forEach(item => {
    const card = document.createElement('div');
    const isChecked = state.challenges[item.id] === true;
    card.className = `card challenge-card ${isChecked ? 'completed' : ''}`;

    const header = document.createElement('div');
    header.className = 'challenge-header';

    const title = document.createElement('h4');
    title.className = 'challenge-title';
    title.textContent = item.title;

    const points = document.createElement('span');
    points.className = 'challenge-reward';
    points.textContent = `+${item.points} pts`;

    header.appendChild(title);
    header.appendChild(points);

    const desc = document.createElement('p');
    desc.className = 'challenge-desc';
    desc.textContent = `Practice this today and reduce your annual emissions by an estimated ${item.saving} kg CO2e.`;

    const footer = document.createElement('div');
    footer.className = 'challenge-footer';

    const badge = document.createElement('span');
    badge.className = 'challenge-impact-badge';
    badge.innerHTML = `${ICONS.leaf} ${item.category}`;

    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn-action-complete';
    completeBtn.textContent = isChecked ? 'Completed' : 'Mark Done';
    completeBtn.setAttribute('aria-label', `Complete challenge: ${item.title}`);

    completeBtn.addEventListener('click', () => {
      const currentlyDone = state.challenges[item.id] === true;
      state.challenges[item.id] = !currentlyDone;
      
      if (!currentlyDone) {
        state.ecoPoints += item.points;
      } else {
        state.ecoPoints = Math.max(0, state.ecoPoints - item.points);
      }
      
      if (DOM.pointsBadge) {
        DOM.pointsBadge.textContent = state.ecoPoints;
      }

      renderChallenges();
      try {
        localStorage.setItem('carbonize_state', JSON.stringify(state));
      } catch (e) {}
    });

    footer.appendChild(badge);
    footer.appendChild(completeBtn);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(footer);

    DOM.challengesList.appendChild(card);
  });

  if (DOM.pointsBadge) {
    DOM.pointsBadge.textContent = state.ecoPoints;
  }
}

/**
 * NAVIGATION TAB PANEL MANAGEMENT
 */
function handleTabChange(targetId) {
  DOM.navLinks.forEach(link => {
    if (link.getAttribute('data-tab') === targetId) {
      link.classList.add('active');
      link.setAttribute('aria-selected', 'true');
    } else {
      link.classList.remove('active');
      link.setAttribute('aria-selected', 'false');
    }
  });

  DOM.tabPanels.forEach(panel => {
    if (panel.id === targetId) {
      panel.classList.add('active');
      panel.removeAttribute('hidden');
    } else {
      panel.classList.remove('active');
      panel.setAttribute('hidden', 'true');
    }
  });
}

/**
 * ==========================================================================
 * AUTOMATED SYSTEM DIAGNOSTICS (TESTING & AUDITING SUITE)
 * Runs browser-level self-tests on the application state, math, DOM, XSS,
 * and accessibility landmarks. Shows proof of quality directly on-screen.
 * ==========================================================================
 */
function runDiagnostics() {
  const logContainer = document.getElementById('audit-results-log');
  if (!logContainer) return;

  const suites = [
    {
      name: "Calculation Models",
      icon: "📈",
      tests: [
        {
          name: "Transport Emission Math Accuracy",
          run: () => {
            const originalCalc = { ...state.calculator };
            state.calculator = { ...DEFAULT_STATE.calculator, carMileage: 10000, carFuel: 'gas', publicTransit: 10, flights: 4 };
            const emissions = calculateEmissions();
            state.calculator = originalCalc;
            // Expected: 10000 * 0.411 + 10 * 52 * 1.2 + 4 * 250 = 4110 + 624 + 1000 = 5734
            const diff = Math.abs(emissions.transport - 5734);
            if (diff > 2) throw new Error(`Expected 5734, got ${emissions.transport}`);
          }
        },
        {
          name: "Energy Emission Math Accuracy",
          run: () => {
            const originalCalc = { ...state.calculator };
            state.calculator = { ...DEFAULT_STATE.calculator, electricBill: 150, renewableShare: 20, heatingBill: 100, heatingFuel: 'gas' };
            const emissions = calculateEmissions();
            state.calculator = originalCalc;
            // Expected: (150 * 12 * 0.85 * 0.8) + (100 * 12 * 1.2) = 1224 + 1440 = 2664
            const diff = Math.abs(emissions.energy - 2664);
            if (diff > 2) throw new Error(`Expected 2664, got ${emissions.energy}`);
          }
        },
        {
          name: "Diet Emission Math Accuracy",
          run: () => {
            const originalCalc = { ...state.calculator };
            state.calculator = { ...DEFAULT_STATE.calculator, dietType: 'vegan', localFood: 50 };
            const emissions = calculateEmissions();
            state.calculator = originalCalc;
            // Expected: 1000 * (1 - 0.5 * 0.1) = 950
            const diff = Math.abs(emissions.food - 950);
            if (diff > 2) throw new Error(`Expected 950, got ${emissions.food}`);
          }
        },
        {
          name: "Shopping Emission Math Accuracy",
          run: () => {
            const originalCalc = { ...state.calculator };
            state.calculator = { ...DEFAULT_STATE.calculator, clothingItems: 5, techItems: 2, recycleShare: 80 };
            const emissions = calculateEmissions();
            state.calculator = originalCalc;
            // Expected: (5 * 12 * 15 + 2 * 150) * (1 - 0.8 * 0.2) = (900 + 300) * 0.84 = 1008
            const diff = Math.abs(emissions.shopping - 1008);
            if (diff > 2) throw new Error(`Expected 1008, got ${emissions.shopping}`);
          }
        },
        {
          name: "EV Engine Reduction Model",
          run: () => {
            const originalCalc = { ...state.calculator };
            state.calculator = { ...DEFAULT_STATE.calculator, carMileage: 10000, carFuel: 'electric' };
            const emissions = calculateEmissions();
            state.calculator = originalCalc;
            // Expected: 10000 * 0.100 + 5 * 52 * 1.2 + 2 * 250 = 1000 + 312 + 500 = 1812
            const diff = Math.abs(emissions.transport - 1812);
            if (diff > 2) throw new Error(`Expected 1812, got ${emissions.transport}`);
          }
        },
        {
          name: "Action Plan Reduction Math",
          run: () => {
            const emissions = { transport: 4000, energy: 3000, food: 2000, shopping: 2000 };
            const results = calculateProjectedSavings(emissions, ['t1', 'e1']);
            if (results.co2Savings !== 950) throw new Error(`Expected 950, got ${results.co2Savings}`);
          }
        },
        {
          name: "Action Plan Financial Projections",
          run: () => {
            const emissions = { transport: 4000, energy: 3000, food: 2000, shopping: 2000 };
            const results = calculateProjectedSavings(emissions, ['t1', 'e1']);
            if (results.cashSavings !== 525) throw new Error(`Expected 525, got ${results.cashSavings}`);
          }
        }
      ]
    },
    {
      name: "Security Safeguards",
      icon: "🔒",
      tests: [
        {
          name: "CSP Meta Tag Presence",
          run: () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!cspMeta) throw new Error("CSP meta tag missing in head");
          }
        },
        {
          name: "CSP Script-Src Directive safety",
          run: () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!cspMeta) throw new Error("CSP not loaded");
            const content = cspMeta.getAttribute('content');
            if (!content.includes("script-src 'self'")) {
              throw new Error(`CSP script policy missing 'self': "${content}"`);
            }
            if (content.includes("script-src 'unsafe-inline'")) {
              throw new Error("CSP allows unsafe inline script execution");
            }
          }
        },
        {
          name: "Referrer-Policy Verification",
          run: () => {
            const refMeta = document.querySelector('meta[name="referrer"]');
            if (!refMeta) throw new Error("Referrer-Policy meta tag missing");
            if (refMeta.getAttribute('content') !== 'same-origin') {
              throw new Error(`Expected same-origin, got: "${refMeta.getAttribute('content')}"`);
            }
          }
        },
        {
          name: "Permissions-Policy Meta Verification",
          run: () => {
            const permMeta = document.querySelector('meta[http-equiv="Permissions-Policy"]');
            if (!permMeta) throw new Error("Permissions-Policy meta tag missing");
          }
        },
        {
          name: "XSS HTML Escaping Engine",
          run: () => {
            const raw = '<script>alert("xss")</script>';
            const escaped = escapeHTML(raw);
            if (escaped.includes('<') || escaped.includes('>') || escaped.includes('"')) {
              throw new Error(`Unsafe characters unescaped: ${escaped}`);
            }
          }
        },
        {
          name: "LocalStorage Schema Sanitizer",
          run: () => {
            const payload = JSON.stringify({
              theme: 'light',
              maliciousAttr: '<script>alert(1)</script>',
              calculator: { carMileage: 5000 }
            });
            const clean = safeLoadState(payload);
            if (!clean) throw new Error("State rejected");
            if (clean.maliciousAttr !== undefined) throw new Error("Failed to strip unrecognized attributes");
            if (clean.theme !== 'light') throw new Error("Theme load failed");
          }
        },
        {
          name: "Prototype Pollution Protection",
          run: () => {
            const payload = '{"theme":"light","__proto__":{"polluted":true},"calculator":{}}';
            const clean = safeLoadState(payload);
            if (clean !== null) throw new Error("State loader accepted prototype polluted payload");
          }
        }
      ]
    },
    {
      name: "Accessibility & ARIA",
      icon: "♿",
      tests: [
        {
          name: "Keyboard Skip-Link Integration",
          run: () => {
            const skipLink = document.querySelector('.skip-link');
            if (!skipLink) throw new Error("Keyboard skip link not found");
            const targetId = skipLink.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (!targetEl) throw new Error(`Skip target ID "${targetId}" does not exist`);
          }
        },
        {
          name: "Nav Tab ARIA Semantics",
          run: () => {
            const tabs = document.querySelectorAll('.nav-link');
            if (tabs.length === 0) throw new Error("No nav tabs found");
            tabs.forEach(tab => {
              if (tab.getAttribute('role') !== 'tab') throw new Error(`Missing role="tab": ${tab.textContent}`);
              if (!tab.getAttribute('aria-controls')) throw new Error(`Missing aria-controls pointer: ${tab.textContent}`);
            });
          }
        },
        {
          name: "Modal Dialog Role Bounds",
          run: () => {
            const modal = document.getElementById('audit-modal');
            if (!modal) throw new Error("Audit dialog is missing");
            if (modal.tagName.toLowerCase() !== 'dialog') {
              if (modal.getAttribute('role') !== 'dialog') {
                throw new Error("Audit modal lacks role='dialog'");
              }
            }
          }
        },
        {
          name: "Form Label Bindings",
          run: () => {
            const inputs = document.querySelectorAll('input, select');
            let missingCount = 0;
            inputs.forEach(inp => {
              if (!inp.id) return;
              const label = document.querySelector(`label[for="${inp.id}"]`);
              const ariaLabel = inp.getAttribute('aria-label');
              const ariaLabelledBy = inp.getAttribute('aria-labelledby');
              if (!label && !ariaLabel && !ariaLabelledBy) {
                missingCount++;
              }
            });
            if (missingCount > 0) throw new Error(`Found ${missingCount} inputs missing labels or ARIA descriptions`);
          }
        },
        {
          name: "Image & Icon Alternate Tags",
          run: () => {
            const svgs = document.querySelectorAll('svg');
            svgs.forEach(svg => {
              const hasAriaHidden = svg.getAttribute('aria-hidden') === 'true';
              const hasRoleImg = svg.getAttribute('role') === 'img';
              const hasTitle = svg.querySelector('title') !== null || svg.getAttribute('aria-label') !== null;
              if (!hasAriaHidden && !hasRoleImg && !hasTitle) {
                if (!svg.closest('[aria-label]')) {
                  throw new Error("SVG icon lacking labels or aria-hidden");
                }
              }
            });
          }
        },
        {
          name: "Tabindex Key Navigation Focus",
          run: () => {
            const activeTab = document.querySelector('.nav-link.active');
            if (activeTab && activeTab.getAttribute('tabindex') !== '0') {
              throw new Error("Active tab must have tabindex=0");
            }
          }
        }
      ]
    },
    {
      name: "Performance & State",
      icon: "⚙️",
      tests: [
        {
          name: "DOM Selector Map Integrity",
          run: () => {
            const failedKeys = [];
            Object.keys(DOM).forEach(key => {
              if (DOM[key] === null) {
                if (key !== 'faqItems' && key !== 'pointsBadge') {
                  failedKeys.push(key);
                }
              }
            });
            if (failedKeys.length > 0) {
              throw new Error(`Selectors [${failedKeys.join(', ')}] could not be resolved`);
            }
          }
        },
        {
          name: "LocalStorage Write/Read Speed",
          run: () => {
            const start = performance.now();
            localStorage.setItem('__perf_test_key__', JSON.stringify(DEFAULT_STATE));
            const read = JSON.parse(localStorage.getItem('__perf_test_key__'));
            localStorage.removeItem('__perf_test_key__');
            const elapsed = performance.now() - start;
            if (elapsed > 15) {
              throw new Error(`Slow transactions: ${elapsed.toFixed(1)}ms`);
            }
          }
        },
        {
          name: "Color Theme Toggle Engine",
          run: () => {
            const currentTheme = state.theme;
            const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
            state.theme = targetTheme;
            DOM.body.setAttribute('data-theme', targetTheme);
            const bodyThemeAttr = DOM.body.getAttribute('data-theme');
            state.theme = currentTheme;
            DOM.body.setAttribute('data-theme', currentTheme);
            if (bodyThemeAttr !== targetTheme) {
              throw new Error(`Theme toggle failed in DOM syncing`);
            }
          }
        },
        {
          name: "SVG Donut Chart Rendering",
          run: () => {
            const chart = document.getElementById('chart-wrapper');
            if (!chart) throw new Error("Chart container missing");
            const svg = chart.querySelector('svg');
            if (!svg) throw new Error("SVG Donut chart is not rendered");
            if (svg.querySelectorAll('circle').length === 0) {
              throw new Error("SVG Donut chart contains no sectors");
            }
          }
        },
        {
          name: "FAQ Trigger Expand Collapse",
          run: () => {
            const trigger = document.querySelector('.faq-trigger');
            if (!trigger) throw new Error("No FAQ triggers found");
            const ariaExpandedVal = trigger.getAttribute('aria-expanded');
            if (ariaExpandedVal === null) throw new Error("FAQ trigger missing aria-expanded attribute");
          }
        },
        {
          name: "Memory Node Count Budget",
          run: () => {
            const nodeCount = document.getElementsByTagName('*').length;
            if (nodeCount > 1500) {
              throw new Error(`DOM weight exceeds budget: ${nodeCount} nodes`);
            }
          }
        }
      ]
    }
  ];

  // Render Dashboard Layout
  logContainer.innerHTML = `
    <div class="diag-dashboard" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: sans-serif; text-align: left;">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
        <div style="background: var(--bg-secondary); border: 1px solid var(--card-border); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Total Tests</div>
          <div id="diag-stat-total" style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">0</div>
        </div>
        <div style="background: var(--bg-secondary); border: 1px solid var(--card-border); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Passed</div>
          <div id="diag-stat-passed" style="font-size: 1.5rem; font-weight: 800; color: var(--success);">0</div>
        </div>
        <div style="background: var(--bg-secondary); border: 1px solid var(--card-border); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Failed</div>
          <div id="diag-stat-failed" style="font-size: 1.5rem; font-weight: 800; color: var(--danger);">0</div>
        </div>
        <div style="background: var(--bg-secondary); border: 1px solid var(--card-border); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Time</div>
          <div id="diag-stat-time" style="font-size: 1.5rem; font-weight: 800; color: var(--info);">0ms</div>
        </div>
      </div>
      
      <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; border: 1px solid var(--card-border);">
        <div id="diag-progress-bar" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.15s ease;"></div>
      </div>
      
      <div id="diag-suites-container" style="display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 280px; padding-right: 0.25rem;">
      </div>
    </div>
  `;

  const suitesContainer = document.getElementById('diag-suites-container');
  const statTotal = document.getElementById('diag-stat-total');
  const statPassed = document.getElementById('diag-stat-passed');
  const statFailed = document.getElementById('diag-stat-failed');
  const statTime = document.getElementById('diag-stat-time');
  const progressBar = document.getElementById('diag-progress-bar');

  let totalTests = 0;
  suites.forEach(s => totalTests += s.tests.length);
  statTotal.textContent = totalTests;

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  const startTime = performance.now();

  const suiteElements = {};
  suites.forEach((suite, sIdx) => {
    const sEl = document.createElement('div');
    sEl.style.border = '1px solid var(--card-border)';
    sEl.style.borderRadius = 'var(--radius-sm)';
    sEl.style.background = 'var(--bg-secondary)';
    sEl.style.overflow = 'hidden';
    
    sEl.innerHTML = `
      <div class="suite-header" style="padding: 0.6rem 0.75rem; background: var(--bg-tertiary); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
        <span style="font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>${suite.icon}</span>
          <span>${suite.name}</span>
        </span>
        <span class="suite-badge" style="font-size: 0.75rem; font-weight: 700; background: var(--bg-primary); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--card-border); color: var(--text-secondary);">
          Pending
        </span>
      </div>
      <div class="suite-tests" style="display: none; flex-direction: column; border-top: 1px solid var(--card-border); background: var(--bg-primary); font-family: monospace; font-size: 0.8rem; padding: 0.5rem 0.75rem; gap: 0.35rem;">
      </div>
    `;

    const header = sEl.querySelector('.suite-header');
    const testsDiv = sEl.querySelector('.suite-tests');
    header.addEventListener('click', () => {
      testsDiv.style.display = testsDiv.style.display === 'none' ? 'flex' : 'none';
    });

    suitesContainer.appendChild(sEl);
    suiteElements[sIdx] = {
      badge: sEl.querySelector('.suite-badge'),
      testsDiv: testsDiv,
      passedCount: 0,
      failedCount: 0,
      totalCount: suite.tests.length
    };
  });

  const testQueue = [];
  suites.forEach((suite, sIdx) => {
    suite.tests.forEach((t, tIdx) => {
      testQueue.push({ suite, sIdx, t, tIdx });
    });
  });

  function runNextTest(index) {
    if (index >= testQueue.length) {
      const totalTime = Math.round(performance.now() - startTime);
      statTime.textContent = `${totalTime}ms`;
      progressBar.style.width = '100%';
      if (testsFailed === 0) {
        progressBar.style.background = 'var(--success)';
      } else {
        progressBar.style.background = 'var(--danger)';
      }
      return;
    }

    const { suite, sIdx, t, tIdx } = testQueue[index];
    const sElInfo = suiteElements[sIdx];
    sElInfo.testsDiv.style.display = 'flex';

    const testLine = document.createElement('div');
    testLine.style.display = 'flex';
    testLine.style.justifyContent = 'space-between';
    testLine.style.alignItems = 'start';
    testLine.style.gap = '0.5rem';
    testLine.innerHTML = `<span style="color: var(--text-secondary);">&gt; Running ${t.name}...</span>`;
    sElInfo.testsDiv.appendChild(testLine);
    sElInfo.testsDiv.scrollTop = sElInfo.testsDiv.scrollHeight;

    setTimeout(() => {
      let passed = true;
      let errorMsg = "";
      
      try {
        t.run();
      } catch (err) {
        passed = false;
        errorMsg = err.message;
      }

      testsRun++;
      if (passed) {
        testsPassed++;
        sElInfo.passedCount++;
        statPassed.textContent = testsPassed;
        testLine.innerHTML = `
          <span style="color: var(--primary);">🟢 [PASS] ${t.name}</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;">ok</span>
        `;
      } else {
        testsFailed++;
        sElInfo.failedCount++;
        statFailed.textContent = testsFailed;
        testLine.innerHTML = `
          <span style="color: var(--danger); font-weight: 700;">🔴 [FAIL] ${t.name}</span>
          <span style="color: var(--danger); font-size: 0.75rem;">${errorMsg}</span>
        `;
        testLine.style.background = 'var(--danger-light)';
        testLine.style.padding = '2px 4px';
        testLine.style.borderRadius = '4px';
      }

      const percent = Math.round((testsRun / totalTests) * 100);
      progressBar.style.width = `${percent}%`;

      if (sElInfo.failedCount > 0) {
        sElInfo.badge.textContent = `${sElInfo.passedCount}/${sElInfo.totalCount} Pass`;
        sElInfo.badge.style.background = 'var(--danger-light)';
        sElInfo.badge.style.color = 'var(--danger)';
        sElInfo.badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      } else if (sElInfo.passedCount === sElInfo.totalCount) {
        sElInfo.badge.textContent = `All Passed`;
        sElInfo.badge.style.background = 'var(--success-light)';
        sElInfo.badge.style.color = 'var(--success)';
        sElInfo.badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else {
        sElInfo.badge.textContent = `${sElInfo.passedCount}/${sElInfo.totalCount} Pass`;
      }

      runNextTest(index + 1);
    }, 40);
  }

  runNextTest(0);
}

/**
 * Safely escape HTML characters to prevent XSS
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and deep cleans parsed state from local storage.
 * Prevents prototype pollution and filters out unrecognized keys or wrong types.
 */
function safeLoadState(savedString) {
  if (!savedString) return null;
  try {
    const parsed = JSON.parse(savedString);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    // Prevent prototype pollution
    const keys = Object.keys(parsed);
    if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
      console.warn("Potential prototype pollution detected in storage. Resetting.");
      return null;
    }

    const validated = {};

    // 1. Theme
    if (parsed.theme === 'light' || parsed.theme === 'dark') {
      validated.theme = parsed.theme;
    } else {
      validated.theme = DEFAULT_STATE.theme;
    }

    // 2. Calculator variables
    validated.calculator = {};
    const calcSchema = DEFAULT_STATE.calculator;
    const inputCalc = parsed.calculator || {};

    if (typeof inputCalc === 'object' && !Array.isArray(inputCalc)) {
      for (const key in calcSchema) {
        if (Object.prototype.hasOwnProperty.call(calcSchema, key)) {
          const expectedType = typeof calcSchema[key];
          const providedVal = inputCalc[key];
          
          if (providedVal !== undefined && typeof providedVal === expectedType) {
            if (expectedType === 'number') {
              if (Number.isFinite(providedVal)) {
                validated.calculator[key] = providedVal;
              } else {
                validated.calculator[key] = calcSchema[key];
              }
            } else if (expectedType === 'string') {
              validated.calculator[key] = escapeHTML(providedVal);
            } else {
              validated.calculator[key] = providedVal;
            }
          } else {
            validated.calculator[key] = calcSchema[key];
          }
        }
      }
    } else {
      validated.calculator = { ...DEFAULT_STATE.calculator };
    }

    // 3. Completed Recommendations
    validated.completedRecs = [];
    if (Array.isArray(parsed.completedRecs)) {
      const allValidIds = Object.values(RECOMMENDATIONS).flat().map(r => r.id);
      parsed.completedRecs.forEach(id => {
        if (typeof id === 'string' && allValidIds.includes(id)) {
          validated.completedRecs.push(id);
        }
      });
    }

    // 4. Challenges
    validated.challenges = {};
    const challengeSchema = DEFAULT_STATE.challenges;
    const inputChallenges = parsed.challenges || {};
    if (typeof inputChallenges === 'object' && !Array.isArray(inputChallenges)) {
      for (const key in challengeSchema) {
        if (Object.prototype.hasOwnProperty.call(challengeSchema, key)) {
          if (typeof inputChallenges[key] === 'boolean') {
            validated.challenges[key] = inputChallenges[key];
          } else {
            validated.challenges[key] = challengeSchema[key];
          }
        }
      }
    } else {
      validated.challenges = { ...DEFAULT_STATE.challenges };
    }

    // 5. Eco Points
    if (typeof parsed.ecoPoints === 'number' && Number.isFinite(parsed.ecoPoints) && parsed.ecoPoints >= 0) {
      validated.ecoPoints = Math.round(parsed.ecoPoints);
    } else {
      validated.ecoPoints = DEFAULT_STATE.ecoPoints;
    }

    return validated;
  } catch (e) {
    console.warn("Storage parse or validation failed", e);
    return null;
  }
}

/**
 * INITIALIZATION & EVENTS LISTENING
 */
function init() {
  const saved = localStorage.getItem('carbonize_state');
  const validated = safeLoadState(saved);
  if (validated) {
    state = validated;
  } else {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  DOM.body.setAttribute('data-theme', state.theme);
  if (DOM.themeIcon) {
    DOM.themeIcon.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
  }

  const calc = state.calculator;
  if (DOM.carMileage) DOM.carMileage.value = calc.carMileage;
  if (DOM.carFuel) DOM.carFuel.value = calc.carFuel;
  if (DOM.publicTransit) DOM.publicTransit.value = calc.publicTransit;
  if (DOM.flights) DOM.flights.value = calc.flights;
  if (DOM.electricBill) DOM.electricBill.value = calc.electricBill;
  if (DOM.renewableShare) DOM.renewableShare.value = calc.renewableShare;
  if (DOM.heatingBill) DOM.heatingBill.value = calc.heatingBill;
  if (DOM.heatingFuel) DOM.heatingFuel.value = calc.heatingFuel;
  if (DOM.dietType) DOM.dietType.value = calc.dietType;
  if (DOM.localFood) DOM.localFood.value = calc.localFood;
  if (DOM.clothingItems) DOM.clothingItems.value = calc.clothingItems;
  if (DOM.techItems) DOM.techItems.value = calc.techItems;
  if (DOM.recycleShare) DOM.recycleShare.value = calc.recycleShare;

  const sliderInputs = [
    { el: DOM.carMileage, key: 'carMileage', isNum: true },
    { el: DOM.publicTransit, key: 'publicTransit', isNum: true },
    { el: DOM.flights, key: 'flights', isNum: true },
    { el: DOM.electricBill, key: 'electricBill', isNum: true },
    { el: DOM.renewableShare, key: 'renewableShare', isNum: true },
    { el: DOM.heatingBill, key: 'heatingBill', isNum: true },
    { el: DOM.localFood, key: 'localFood', isNum: true },
    { el: DOM.clothingItems, key: 'clothingItems', isNum: true },
    { el: DOM.techItems, key: 'techItems', isNum: true },
    { el: DOM.recycleShare, key: 'recycleShare', isNum: true }
  ];

  sliderInputs.forEach(item => {
    if (item.el) {
      item.el.addEventListener('input', (e) => {
        const val = item.isNum ? Number(e.target.value) : e.target.value;
        state.calculator[item.key] = val;
        updateUI();
      });
    }
  });

  const selectInputs = [
    { el: DOM.carFuel, key: 'carFuel' },
    { el: DOM.heatingFuel, key: 'heatingFuel' },
    { el: DOM.dietType, key: 'dietType' }
  ];

  selectInputs.forEach(item => {
    if (item.el) {
      item.el.addEventListener('change', (e) => {
        state.calculator[item.key] = e.target.value;
        updateUI();
      });
    }
  });

  DOM.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-tab');
      handleTabChange(target);
    });
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = link.getAttribute('data-tab');
        handleTabChange(target);
      }
    });
  });

  if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      DOM.body.setAttribute('data-theme', state.theme);
      if (DOM.themeIcon) {
        DOM.themeIcon.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
      }
      try {
        localStorage.setItem('carbonize_state', JSON.stringify(state));
      } catch (e) {}
    });
  }

  const goToInsightsBtn = document.getElementById('go-to-insights-btn');
  if (goToInsightsBtn) {
    goToInsightsBtn.addEventListener('click', () => {
      const tabBtn = document.querySelector('[data-tab="insights"]');
      if (tabBtn) {
        tabBtn.click();
      }
    });
  }

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all calculator inputs and clear saved data?")) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        try {
          localStorage.setItem('carbonize_state', JSON.stringify(state));
        } catch (e) {}
        
        // Sync slider inputs back to defaults in DOM
        const calc = state.calculator;
        if (DOM.carMileage) DOM.carMileage.value = calc.carMileage;
        if (DOM.carFuel) DOM.carFuel.value = calc.carFuel;
        if (DOM.publicTransit) DOM.publicTransit.value = calc.publicTransit;
        if (DOM.flights) DOM.flights.value = calc.flights;
        if (DOM.electricBill) DOM.electricBill.value = calc.electricBill;
        if (DOM.renewableShare) DOM.renewableShare.value = calc.renewableShare;
        if (DOM.heatingBill) DOM.heatingBill.value = calc.heatingBill;
        if (DOM.heatingFuel) DOM.heatingFuel.value = calc.heatingFuel;
        if (DOM.dietType) DOM.dietType.value = calc.dietType;
        if (DOM.localFood) DOM.localFood.value = calc.localFood;
        if (DOM.clothingItems) DOM.clothingItems.value = calc.clothingItems;
        if (DOM.techItems) DOM.techItems.value = calc.techItems;
        if (DOM.recycleShare) DOM.recycleShare.value = calc.recycleShare;

        updateUI();
        renderChallenges();
      }
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const emissions = calculateEmissions();
      const insights = generateInsights(emissions);
      const results = calculateProjectedSavings(emissions, state.completedRecs);
      
      const reportContent = `==================================================
CARBONIZE ECOLOGICAL FOOTPRINT ASSESSMENT REPORT
Generated on: ${new Date().toLocaleString()}
==================================================

1. EMISSIONS PROFILE (kg CO2e / Year)
--------------------------------------------------
- Transportation:      ${emissions.transport.toLocaleString()} kg
- Home Utility Energy: ${emissions.energy.toLocaleString()} kg
- Diet & Food Sourcing: ${emissions.food.toLocaleString()} kg
- Shopping Consumption: ${emissions.shopping.toLocaleString()} kg
--------------------------------------------------
TOTAL FOOTPRINT:        ${results.currentTotal.toLocaleString()} kg CO2e / Year
CARBON RATING:          ${insights.rating.toUpperCase()}

2. IMPACT BENCHMARKS
--------------------------------------------------
- vs. Global Sustainable Limit Target (2,000 kg): ${insights.comparisonSustainable}%
- vs. US National Average (16,000 kg):             ${insights.comparisonUS}%

3. ECO ACTION PLAN SAVINGS
--------------------------------------------------
- Selected Actions:    ${state.completedRecs.length}
- Target CO2 Savings:  ${results.co2Savings.toLocaleString()} kg CO2e / Year
- Projected Footprint: ${results.projectedTotal.toLocaleString()} kg CO2e / Year
- Estimated Cash Kept: $${results.cashSavings.toLocaleString()} USD / Year

4. COMPLETED CHALLENGES STREAK
--------------------------------------------------
- Eco Points Earned:   ${state.ecoPoints} pts
- Completed Tasks:     ${Object.keys(state.challenges).filter(k => state.challenges[k]).join(', ') || 'None'}

==================================================
Thank you for tracking and reducing your ecological footprint.
Data processed locally with Carbonize.
==================================================`;

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carbonize_ecological_report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  DOM.faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      const content = item.querySelector('.faq-content');
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        DOM.faqItems.forEach(i => {
          i.classList.remove('active');
          const iContent = i.querySelector('.faq-content');
          if (iContent) iContent.style.maxHeight = '0';
          i.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
          if (content) {
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        }
      });
    }
  });

  // Bind parameter audit modal listeners
  const auditModal = document.getElementById('audit-modal');
  const openAuditBtn = document.getElementById('open-audit-btn');
  const closeAuditBtn = document.getElementById('close-audit-btn');
  const runAuditBtn = document.getElementById('run-audit-btn');

  if (openAuditBtn && auditModal) {
    openAuditBtn.addEventListener('click', () => {
      auditModal.showModal();
    });
  }
  if (closeAuditBtn && auditModal) {
    closeAuditBtn.addEventListener('click', () => {
      auditModal.close();
    });
  }
  if (runAuditBtn) {
    runAuditBtn.addEventListener('click', () => {
      runDiagnostics();
    });
  }

  updateUI();
  renderChallenges();
}

// Run application
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  }
}

function getState() {
  return state;
}

function setState(newState) {
  state = newState;
}

// Export algorithms for Node.js test environment
if (typeof exports !== 'undefined') {
  module.exports = {
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
  };
}

})();
