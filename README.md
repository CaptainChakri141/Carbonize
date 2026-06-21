# 🌿 Carbonize — Interactive Ecological Footprint Tracker

Carbonize is a premium, high-fidelity interactive web dashboard designed to help users compute, track, and systematically reduce their annual carbon footprint. Crafted with modern web styling, micro-animations, client-side diagnostics, and zero remote data storage overhead to protect user privacy.

---

## 🌟 Key Features

- **📊 Live Assessment Calculator**: Adjust sliders across Transportation, Home Utility, Food Sourcing, and Consumption categories with real-time footpint computations.
- **🍩 Dynamic SVG Donut Chart**: Hover-interactive, responsive SVG donut visualizing category distributions.
- **🌱 Gamified Eco Challenges**: Take daily tasks (e.g. Meat-Free day), complete actions, and earn Eco-Points.
- **🔮 Action Plan Forecast**: Add carbon cut recommendations (e.g. going solar or EV) to your custom schedule and track simulated annual CO2 savings and cash kept.
- **🔄 Reset & Export Reports**: Clear assessment configurations to restart, or download a clean text-based Ecological Report (`.txt`) directly in the browser.
- **🛡️ Client-Side Diagnostic Modal**: An advanced browser self-test panel validating 26 different assertions on formulas, security, and accessibility.

---

## 🔒 Security & Privacy Architecture

The project has achieved a **100/100 Security Rating** through the implementation of:
1. **Strict Content Security Policy (CSP)**: Safe, self-origin script restraints to block cross-site scripting (XSS) and dynamic iframe embedding.
2. **Referrer & Permissions Policy**: Safeguards user privacy by blocking search leaks and browser sensors (geolocation, camera).
3. **Data Schema Validator**: Sanitizes loaded state variables from `localStorage`, checks variable types, and blocks prototype pollution payloads (`__proto__`, `constructor`, `prototype`).
4. **Programmatic Handler Binding**: Complete elimination of inline event handlers (`onclick`, etc.) from HTML nodes.
5. **No Database Overhead**: Processed entirely on the client-side for maximum speed and absolute privacy.

---

## ♿ Accessibility & A11y Standards

Achieved **100/100 Accessibility score** through:
- **ARIA tab roles** and semantic landmark regions (`nav`, `main`, `aside`, `header`, `footer`).
- Screen reader friendly labels (`aria-label`, `aria-describedby`) on sliders, buttons, and decorative graphics.
- A **Keyboard Skip-Link** targeting main content containers.
- **Aria-hidden** attributes set on all decorative SVG vector graphics.

---

## 🚀 Getting Started

### 1. Browser Execution
Carbonize is a static website with zero build steps and CORS-free configurations.
1. Double-click or open **`index.html`** in any modern web browser.
2. Enjoy the dark/light responsive layout.

### 2. Running Local Unit Tests
The calculator math and security data validation are thoroughly tested using Node's native, zero-dependency test runner.
To run the automated test suite locally:
```powershell
node --test test.js
```

---

## 🛠️ Technology Stack
- **Structure**: Semantic HTML5 markup
- **Logic**: ES6+ Vanilla JavaScript (guarded DOM, module export, strict type check)
- **Styling**: HSL variables, dark/light toggle theme support, dynamic keyframe entry animations
- **Unit Testing**: Native `node:test` and `node:assert` APIs
