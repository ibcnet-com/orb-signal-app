import { useState, useEffect, useRef } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap');`;

const style = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090c10; }
  .app {
    font-family: 'Space Mono', monospace;
    background: #090c10;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 0;
  }
  .header {
    border-bottom: 1px solid #1e2a3a;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(9,12,16,0.95);
    backdrop-filter: blur(10px);
    position: sticky; top: 0; z-index: 100;
  }
  .logo {
    font-family: 'Instrument Serif', serif;
    font-size: 22px;
    letter-spacing: 0.02em;
    color: #f0f4f8;
  }
  .logo span { color: #00d4aa; font-style: italic; }
  .ticker-bar {
    display: flex; gap: 20px; font-size: 11px; color: #64748b;
  }
  .ticker-item { display: flex; gap: 6px; align-items: center; }
  .ticker-item .up { color: #00d4aa; }
  .ticker-item .down { color: #ff4d6d; }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #00d4aa;
    animation: pulse 1.5s infinite;
    display: inline-block; margin-right: 6px;
  }
  @keyframes pulse {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:0.4;transform:scale(0.8)}
  }
  .main { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }
  .hero {
    text-align: center;
    margin-bottom: 48px;
    padding: 48px 24px 36px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-label {
    font-size: 10px; letter-spacing: 0.25em;
    color: #00d4aa; text-transform: uppercase;
    margin-bottom: 14px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .hero h1 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 400;
    line-height: 1.1;
    color: #f0f4f8;
    margin-bottom: 16px;
  }
  .hero h1 em { color: #00d4aa; font-style: italic; }
  .hero p {
    font-size: 13px; color: #64748b;
    max-width: 480px; margin: 0 auto;
    line-height: 1.8;
  }
  /* Nav Tabs */
  .tabs {
    display: flex; gap: 4px;
    background: #0f1520;
    border: 1px solid #1e2a3a;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 36px;
  }
  .tab {
    flex: 1; padding: 10px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent; border: none;
    color: #475569; cursor: pointer;
    border-radius: 7px;
    transition: all 0.2s;
  }
  .tab.active {
    background: #1a2540;
    color: #00d4aa;
    border: 1px solid #00d4aa33;
  }
  .tab:hover:not(.active) { color: #94a3b8; }

  /* Cards */
  .card {
    background: #0f1520;
    border: 1px solid #1e2a3a;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; color: #00d4aa;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .card-title::after {
    content: ''; flex: 1;
    height: 1px; background: #1e2a3a;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

  /* ── Mobile bottom tab bar ── */
  .bottom-nav {
    display: none;
  }

  @media(max-width:768px) {
    /* Global */
    body { padding-bottom: 72px; }

    /* Hero */
    .hero { padding: 32px 16px 24px; }
    .hero h1 { font-size: 28px; }
    .hero p  { font-size: 12px; }

    /* Hide desktop tabs, show bottom nav */
    .tabs { display: none !important; }
    .bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(9,12,16,0.97);
      border-top: 1px solid #1e2a3a;
      z-index: 100;
      padding: 0;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .bottom-nav button {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px;
      padding: 10px 4px 8px;
      background: transparent; border: none;
      color: #475569; cursor: pointer;
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: color 0.2s;
    }
    .bottom-nav button.active { color: #00d4aa; }
    .bottom-nav button .nav-icon { font-size: 18px; line-height: 1; }

    /* Layout */
    .app-wrap { padding: 0 12px; }
    main { padding: 12px 0 0; }

    /* Cards */
    .card { padding: 16px; border-radius: 10px; margin-bottom: 14px; }
    .card-title { font-size: 9px; }

    /* Grids */
    .grid-2 { grid-template-columns: 1fr; gap: 12px; }
    .grid-3 { grid-template-columns: 1fr 1fr; gap: 10px; }

    /* Header bar */
    .quote-bar { gap: 12px; padding: 10px 12px; font-size: 10px; flex-wrap: wrap; }
    .header-actions { gap: 8px; }

    /* Signal cards */
    .signal-card { padding: 14px; }
    .tb-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .rule-badges { gap: 6px; }
    .rule-badge { font-size: 9px; padding: 3px 6px; }

    /* Trade log table — stack on mobile */
    table { font-size: 11px; }
    table th, table td { padding: 8px 6px; }

    /* Footer — hide on mobile (bottom nav replaces it) */
    .app-footer { display: none; }

    /* Config sliders */
    .slider-row { margin: 12px 0; }

    /* Futures grid */
    .futures-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }

    /* Stats bar */
    .stats-bar { gap: 10px; flex-wrap: wrap; }
    .stat-pill { font-size: 10px; padding: 6px 10px; }

    /* Watchlist chips */
    .ticker-chip { font-size: 10px; padding: 4px 8px; }
  }

  @media(max-width:400px) {
    .grid-3 { grid-template-columns: 1fr; }
    .futures-grid { grid-template-columns: 1fr !important; }
    .tb-grid { grid-template-columns: 1fr; }
  }

  /* ORB Chart Visual */
  .chart-wrap {
    background: #080b10;
    border: 1px solid #1e2a3a;
    border-radius: 10px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  .chart-wrap svg { width: 100%; height: auto; display: block; }

  /* Steps */
  .step {
    display: flex; gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #1a2030;
  }
  .step:last-child { border-bottom: none; }
  .step-num {
    width: 32px; height: 32px; border-radius: 50%;
    background: #1a2540;
    border: 1px solid #00d4aa44;
    color: #00d4aa;
    font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .step-body h4 { font-size: 13px; color: #e2e8f0; margin-bottom: 6px; }
  .step-body p { font-size: 12px; color: #64748b; line-height: 1.7; }

  /* Signal Alerts */
  .signal-card {
    background: #0f1520;
    border-radius: 12px;
    border: 1px solid #1e2a3a;
    padding: 20px;
    margin-bottom: 16px;
    animation: slideIn 0.4s ease both;
    transition: border-color 0.2s;
  }
  .signal-card.long  { border-left: 3px solid #00d4aa; }
  .signal-card.short { border-left: 3px solid #ff4d6d; }
  .signal-card:hover { border-color: #2a3a55; }
  @keyframes slideIn {
    from { opacity:0; transform: translateY(-8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .signal-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .signal-ticker {
    display: flex; align-items: center; gap: 10px;
  }
  .signal-dir {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .signal-dir.long  { background: rgba(0,212,170,0.12); border: 1px solid #00d4aa44; }
  .signal-dir.short { background: rgba(255,77,109,0.12); border: 1px solid #ff4d6d44; }
  .signal-ticker h3 { font-size: 18px; color: #f0f4f8; }
  .signal-ticker p  { font-size: 11px; color: #64748b; margin-top: 2px; }
  .signal-timer {
    font-size: 11px; color: #475569;
    background: #0a0f18; border: 1px solid #1e2a3a;
    border-radius: 6px; padding: 4px 10px;
    font-family: 'Space Mono', monospace;
  }
  .signal-timer.urgent { color: #facc15; border-color: #facc1544; }
  .trade-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 10px; margin-bottom: 14px;
  }
  .trade-box {
    background: #080b10; border: 1px solid #1a2030;
    border-radius: 8px; padding: 10px 12px;
  }
  .trade-box .tb-label { font-size: 9px; color: #475569; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom:4px; }
  .trade-box .tb-value { font-size: 14px; color: #e2e8f0; font-weight: 700; }
  .trade-box .tb-sub   { font-size: 10px; color: #475569; margin-top: 2px; }
  .trade-box.entry  .tb-value { color: #f0f4f8; }
  .trade-box.stop   .tb-value { color: #ff4d6d; }
  .trade-box.size   .tb-value { color: #facc15; }
  .targets-row {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 14px;
  }
  .target-box {
    background: rgba(0,212,170,0.05);
    border: 1px solid #00d4aa22;
    border-radius: 8px; padding: 10px 14px;
  }
  .target-box .t-label { font-size: 9px; color: #00d4aa88; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom:4px; }
  .target-box .t-price { font-size: 15px; color: #00d4aa; font-weight: 700; }
  .target-box .t-meta  { font-size: 10px; color: #475569; margin-top: 3px; }
  .signal-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid #1a2030;
    flex-wrap: wrap; gap: 8px;
  }
  .signal-footer .meta-text { font-size: 10px; color: #475569; }
  .action-btn {
    font-family: 'Space Mono', monospace;
    font-size: 12px; font-weight: 700;
    padding: 10px 24px; border-radius: 8px;
    border: none; cursor: pointer;
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: all 0.2s;
  }
  .action-btn.buy  { background: #00d4aa; color: #090c10; }
  .action-btn.sell { background: #ff4d6d; color: #fff; }
  .action-btn.buy:hover  { background: #00e8bb; transform: translateY(-1px); }
  .action-btn.sell:hover { background: #ff6b85; transform: translateY(-1px); }
  .time-warning {
    font-size: 10px; color: #facc15;
    background: rgba(250,204,21,0.08);
    border: 1px solid #facc1533;
    border-radius: 4px; padding: 3px 8px;
  }
  .badge {
    font-size: 9px; letter-spacing: 0.15em;
    padding: 3px 8px; border-radius: 4px;
    text-transform: uppercase; font-weight: 700;
  }
  .badge.high { background: rgba(0,212,170,0.15); color: #00d4aa; }
  .badge.med { background: rgba(250,204,21,0.15); color: #facc15; }
  .badge.low { background: rgba(100,116,139,0.15); color: #64748b; }

  /* Settings / Alert Config */
  .config-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 0; border-bottom: 1px solid #1a2030;
    font-size: 12px;
  }
  .config-row:last-child { border-bottom: none; }
  .config-label { color: #94a3b8; }
  .config-value { color: #e2e8f0; font-weight: 700; }
  .toggle {
    width: 40px; height: 22px; border-radius: 11px;
    background: #1e2a3a; border: none; cursor: pointer;
    position: relative; transition: background 0.3s;
  }
  .toggle.on { background: #00d4aa33; border: 1px solid #00d4aa66; }
  .toggle::after {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #475569; top: 3px; left: 3px;
    transition: all 0.3s;
  }
  .toggle.on::after { background: #00d4aa; transform: translateX(18px); }

  /* Stats Row */
  .stat-box {
    background: #080b10;
    border: 1px solid #1e2a3a;
    border-radius: 10px; padding: 18px;
    text-align: center;
  }
  .stat-box .val {
    font-family: 'Instrument Serif', serif;
    font-size: 32px; color: #00d4aa;
    display: block; margin-bottom: 6px;
  }
  .stat-box .lbl { font-size: 10px; color: #475569; letter-spacing: 0.15em; text-transform: uppercase; }

  /* Tooltip rule chip */
  .rule-chip {
    display: inline-flex; align-items: center; gap: 8px;
    background: #1a2540; border: 1px solid #2a3a55;
    border-radius: 6px; padding: 8px 14px;
    font-size: 11px; color: #94a3b8;
    margin: 4px;
  }
  .rule-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: #00d4aa; }
  .pill-warning { background: rgba(255,77,109,0.1); border-color: #ff4d6d33; }
  .pill-warning .dot { background: #ff4d6d; }

  /* Chart annotation */
  .chart-legend {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-top: 12px;
  }
  .legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: #64748b;
  }
  .legend-line {
    width: 20px; height: 2px;
  }
  .btn {
    font-family: 'Space Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px 20px;
    border-radius: 7px; border: none;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-primary {
    background: #00d4aa; color: #090c10; font-weight: 700;
  }
  .btn-primary:hover { background: #00e8bb; transform: translateY(-1px); }
  .btn-ghost {
    background: transparent; color: #64748b;
    border: 1px solid #1e2a3a;
  }
  .btn-ghost:hover { color: #94a3b8; border-color: #2a3a55; }

  /* Simulate btn */
  .simulate-btn {
    width: 100%; padding: 14px;
    margin-top: 16px;
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%; height: 4px;
    background: #1e2a3a; border-radius: 2px; outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%; background: #00d4aa; cursor: pointer;
  }
  .slider-row { margin: 16px 0; }
  .slider-row label { font-size: 11px; color: #64748b; display: flex; justify-content: space-between; margin-bottom: 8px; }
  .slider-row label span { color: #00d4aa; }

  select {
    background: #1a2540; border: 1px solid #2a3a55;
    color: #e2e8f0; font-family: 'Space Mono', monospace;
    font-size: 11px; padding: 8px 12px;
    border-radius: 6px; cursor: pointer; outline: none;
  }

  .empty-state {
    text-align: center; padding: 48px 24px;
    color: #475569; font-size: 12px;
  }
  .empty-state .icon { font-size: 32px; margin-bottom: 12px; }

  .alert-sim-result {
    background: #0a1520;
    border: 1px solid #00d4aa44;
    border-radius: 10px;
    padding: 20px;
    margin-top: 16px;
    animation: fadeIn 0.4s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .result-row { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 1px solid #1a2030; }
  .result-row:last-child { border-bottom: none; }
  .result-row .label { color: #64748b; }
  .result-row .value { color: #e2e8f0; }
  .result-row .value.green { color: #00d4aa; }
  .result-row .value.red { color: #ff4d6d; }

  .ticker-chip-input:focus { border-color: #00d4aa !important; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Morning Brief ── */
  .morning-brief {
    background: linear-gradient(135deg, #080f1a 0%, #0a1628 100%);
    border: 1px solid #00d4aa33;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .morning-brief::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 0% 50%, rgba(0,212,170,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .brief-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }
  .brief-title {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #00d4aa; display: flex; align-items: center; gap: 8px;
  }
  .brief-time {
    font-size: 10px; color: #2a3a55; font-family: 'Space Mono', monospace;
  }
  .brief-dismiss {
    background: none; border: none; color: #2a3a55; cursor: pointer;
    font-size: 16px; padding: 2px 6px; transition: color 0.2s;
  }
  .brief-dismiss:hover { color: #475569; }
  .brief-futures {
    display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .brief-future {
    background: #0f1520; border: 1px solid #1e2a3a;
    border-radius: 8px; padding: 10px 14px;
    min-width: 110px; flex: 1;
  }
  .brief-future.up   { border-color: #00d4aa33; }
  .brief-future.down { border-color: #ff4d6d33; }
  .brief-future-name { font-size: 9px; color: #475569; margin-bottom: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
  .brief-future-price { font-size: 15px; font-weight: 700; color: #f0f4f8; }
  .brief-future-chg { font-size: 11px; margin-top: 2px; }
  .brief-future-chg.up   { color: #00d4aa; }
  .brief-future-chg.down { color: #ff4d6d; }
  .brief-future-chg.flat { color: #475569; }
  .brief-movers { margin-bottom: 16px; }
  .brief-movers-title { font-size: 9px; color: #475569; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .brief-mover-row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 0; border-bottom: 1px solid #0f1520;
    font-size: 12px;
  }
  .brief-mover-row:last-child { border-bottom: none; }
  .brief-mover-ticker { font-weight: 700; color: #f0f4f8; width: 60px; }
  .brief-mover-price  { color: #94a3b8; flex: 1; }
  .brief-mover-gap    { font-weight: 600; min-width: 60px; text-align: right; }
  .brief-mover-gap.up   { color: #00d4aa; }
  .brief-mover-gap.down { color: #ff4d6d; }
  .brief-mover-gap.flat { color: #475569; }
  .brief-summary {
    background: #0a0f18; border-radius: 8px; padding: 12px 14px;
    font-size: 11px; color: #64748b; line-height: 1.7;
  }
  .brief-summary strong { color: #e2e8f0; }
  .brief-summary .tag {
    display: inline-block; font-size: 9px; padding: 2px 7px;
    border-radius: 4px; margin: 0 3px; font-weight: 600;
    letter-spacing: 0.05em;
  }
  .brief-summary .tag.bull { background: rgba(0,212,170,0.1); color: #00d4aa; border: 1px solid #00d4aa33; }
  .brief-summary .tag.bear { background: rgba(255,77,109,0.1); color: #ff4d6d; border: 1px solid #ff4d6d33; }
  .brief-summary .tag.warn { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid #facc1533; }

  .app-footer {
    border-top: 1px solid #1e2a3a;
    padding: 28px 32px;
    margin-top: 48px;
    background: rgba(9,12,16,0.95);
  }
  .footer-inner {
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 16px;
  }
  .footer-nav {
    display: flex; gap: 24px; flex-wrap: wrap;
  }
  .footer-nav a {
    font-size: 11px; color: #475569;
    text-decoration: none; letter-spacing: 0.08em;
    transition: color 0.2s;
  }
  .footer-nav a:hover { color: #00d4aa; }
  .footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .footer-copy {
    font-size: 10px; color: #2a3a55;
  }
  .footer-copy a { color: #2a3a55; text-decoration: none; transition: color 0.2s; }
  .footer-copy a:hover { color: #475569; }
  .footer-version a {
    font-size: 10px; color: #2a3a55;
    text-decoration: none; transition: color 0.2s;
    font-family: 'Space Mono', monospace;
  }
  .footer-version a:hover { color: #00d4aa; }
`;

// --- ORB Chart SVG ---
function ORBChart({ orbHigh = 182.5, orbLow = 179.8, breakout = true }) {
  const W = 540, H = 220;
  const pad = { l: 50, r: 20, t: 20, b: 30 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const priceMin = 178.5, priceMax = 185.5;
  const py = p => pad.t + ch * (1 - (p - priceMin) / (priceMax - priceMin));

  const orbHighY = py(orbHigh);
  const orbLowY = py(orbLow);

  // Simulated candles
  const candles = [
    { o: 180.1, h: 181.2, l: 179.6, c: 180.8, t: "9:30" },
    { o: 180.8, h: 181.8, l: 180.2, c: 181.5, t: "9:35" },
    { o: 181.5, h: 182.5, l: 181.0, c: 182.2, t: "9:40" },
    { o: 182.2, h: 182.6, l: 181.8, c: 179.9, t: "9:45" },
    { o: 179.9, h: 180.5, l: 179.7, c: 180.1, t: "9:50" },
    { o: 180.1, h: 180.4, l: 179.8, c: 180.0, t: "9:55" },
    { o: 180.0, h: 180.2, l: 179.8, c: 179.9, t: "10:00" },
    { o: 179.9, h: 181.0, l: 179.6, c: 181.0, t: "10:05" },
    { o: 181.0, h: 183.2, l: 180.8, c: 182.9, t: "10:10" },
    { o: 182.9, h: 184.0, l: 182.5, c: 183.8, t: "10:15" },
    { o: 183.8, h: 184.8, l: 183.4, c: 184.5, t: "10:20" },
    { o: 184.5, h: 185.2, l: 184.0, c: 185.0, t: "10:25" },
  ];
  const cWidth = 28;
  const gap = (cw - cWidth * candles.length) / (candles.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="breakoutFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* ORB Zone */}
      <rect x={pad.l} y={orbHighY} width={cw} height={orbLowY - orbHighY}
        fill="rgba(250,204,21,0.06)" />

      {/* ORB High line */}
      <line x1={pad.l} y1={orbHighY} x2={pad.l + cw} y2={orbHighY}
        stroke="#facc15" strokeWidth="1.5" strokeDasharray="5,4" />
      <text x={pad.l - 4} y={orbHighY + 4} textAnchor="end" fontSize="9" fill="#facc15">H {orbHigh}</text>

      {/* ORB Low line */}
      <line x1={pad.l} y1={orbLowY} x2={pad.l + cw} y2={orbLowY}
        stroke="#facc15" strokeWidth="1.5" strokeDasharray="5,4" />
      <text x={pad.l - 4} y={orbLowY + 4} textAnchor="end" fontSize="9" fill="#facc15">L {orbLow}</text>

      {/* ORB Window shading */}
      <rect x={pad.l} y={pad.t} width={cWidth * 7 + gap * 8} height={ch}
        fill="rgba(250,204,21,0.03)" />
      <line x1={pad.l + cWidth * 7 + gap * 8} y1={pad.t}
            x2={pad.l + cWidth * 7 + gap * 8} y2={pad.t + ch}
        stroke="#facc1555" strokeWidth="1" strokeDasharray="3,3"/>
      <text x={pad.l + cWidth * 7 + gap * 8 - 2} y={pad.t + 12} textAnchor="end" fontSize="9" fill="#facc1588">ORB Window</text>

      {/* Breakout fill */}
      {breakout && (
        <rect x={pad.l + cWidth * 8 + gap * 9} y={orbHighY}
          width={cw - (cWidth * 8 + gap * 9)} height={pad.t + ch - orbHighY}
          fill="url(#breakoutFill)" />
      )}

      {/* Candles */}
      {candles.map((c, i) => {
        const cx = pad.l + gap * (i + 1) + cWidth * i + cWidth / 2;
        const x = pad.l + gap * (i + 1) + cWidth * i;
        const isGreen = c.c >= c.o;
        const color = i >= 8 ? (isGreen ? "#00d4aa" : "#ff4d6d") : (isGreen ? "#4ade80" : "#f87171");
        return (
          <g key={i}>
            <line x1={cx} y1={py(c.h)} x2={cx} y2={py(c.l)} stroke={color} strokeWidth="1.5"/>
            <rect x={x} y={py(Math.max(c.o, c.c))}
              width={cWidth} height={Math.max(2, Math.abs(py(c.o) - py(c.c)))}
              fill={color} opacity={i >= 8 ? 1 : 0.7}/>
          </g>
        );
      })}

      {/* Breakout arrow */}
      {breakout && (
        <g transform={`translate(${pad.l + cWidth * 9 + gap * 10 + cWidth / 2}, ${orbHighY - 18})`}>
          <polygon points="0,-10 -7,0 7,0" fill="#00d4aa"/>
          <text y="20" textAnchor="middle" fontSize="9" fill="#00d4aa" fontWeight="bold">BREAKOUT</text>
        </g>
      )}

      {/* Time axis */}
      {candles.map((c, i) => {
        if (i % 3 !== 0) return null;
        const cx = pad.l + gap * (i + 1) + cWidth * i + cWidth / 2;
        return (
          <text key={i} x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="#475569">{c.t}</text>
        );
      })}
    </svg>
  );
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DEFAULT_WATCHLIST = ["SPY", "QQQ", "AAPL", "TSLA"];

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

// --- Main App ---
export default function ORBApp() {
  const [tab, setTab] = useState("learn");
  const [signals, setSignals] = useState([]);
  const [noBreakout, setNoBreakout] = useState([]);
  const [spyTrend, setSpyTrend]           = useState(null);
  const [economicEvent, setEconomicEvent] = useState(null);
  const [futures, setFutures]             = useState([]);
  const [premarket, setPremarket]         = useState([]);
  const [futuresLoading, setFuturesLoading] = useState(false);

  // Morning brief: visible 4AM–9:45AM ET
  const [briefDismissed, setBriefDismissed] = useState(false);
  const [briefForced, setBriefForced]       = useState(false);
  function isPreMarketHours() {
    const now = new Date();
    const et  = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const h   = et.getHours(), m = et.getMinutes();
    const mins = h * 60 + m;
    return mins >= 4 * 60 && mins < 9 * 60 + 45; // 4:00AM–9:45AM ET
  }
  function showBrief() {
    setBriefForced(true);
    setBriefDismissed(false);
    setTab("signals");
    window.scrollTo(0, 0);
    fetchFutures();
  }

  async function fetchFutures() {
    setFuturesLoading(true);
    try {
      const tickers = watchlist.join(",");
      const r    = await fetch(`${API}/futures?tickers=${tickers}`);
      const data = await r.json();
      setFutures(data.futures || []);
      setPremarket(data.premarket || []);
    } catch {}
    setFuturesLoading(false);
  }
  const [quotes, setQuotes] = useState({});
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [orbWindow, setOrbWindow] = useState(() => loadFromStorage("orb_window", 15));
  const [volFilter, setVolFilter] = useState(() => loadFromStorage("orb_volfilter", 150));
  const [maxRisk, setMaxRisk]     = useState(() => loadFromStorage("orb_maxrisk", 1000));
  const [alertSound, setAlertSound] = useState(() => loadFromStorage("orb_alertsound", true));
  const [alertEmail, setAlertEmail] = useState(() => loadFromStorage("orb_alertemail", false));
  const [alertPush, setAlertPush] = useState(() => loadFromStorage("orb_alertpush", true));
  const [watchlist, setWatchlist] = useState(() => loadFromStorage("orb_watchlist", DEFAULT_WATCHLIST));
  const [tickerInput, setTickerInput] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [newSignalFlash, setNewSignalFlash] = useState(false);
  const timerRef        = useRef(null);
  const audioCtxRef     = useRef(null);
  const alertedTickers  = useRef(new Set()); // tickers we've already sounded an alert for
  const signalFireTimes = useRef({});         // ticker -> timestamp when signal first appeared

  // ─── Sound engine (Web Audio API — no files needed) ──────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function playSignalAlert() {
    if (!alertSound) return;
    try {
      const ctx     = getAudioCtx();
      const now     = ctx.currentTime;
      // Three rising tones — "opportunity knocking"
      [[440, 0], [554, 0.15], [659, 0.30]].forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type      = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
        osc.start(now + delay);
        osc.stop(now  + delay + 0.4);
      });
    } catch {}
  }

  function playWatchingChime() {
    if (!alertSound) return;
    try {
      const ctx  = getAudioCtx();
      const now  = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  function addTicker() {
    const t = tickerInput.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!t || watchlist.includes(t)) { setTickerInput(""); return; }
    setWatchlist(prev => [...prev, t]);
    setTickerInput("");
  }

  function removeTicker(t) {
    setWatchlist(prev => prev.filter(x => x !== t));
  }

  function saveConfig() {
    try {
      localStorage.setItem("orb_watchlist", JSON.stringify(watchlist));
      localStorage.setItem("orb_window", JSON.stringify(orbWindow));
      localStorage.setItem("orb_volfilter", JSON.stringify(volFilter));
      localStorage.setItem("orb_maxrisk", JSON.stringify(maxRisk));
      localStorage.setItem("orb_alertsound", JSON.stringify(alertSound));
      localStorage.setItem("orb_alertemail", JSON.stringify(alertEmail));
      localStorage.setItem("orb_alertpush", JSON.stringify(alertPush));
    } catch {}
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }

  function resetConfig() {
    setWatchlist(DEFAULT_WATCHLIST);
    setOrbWindow(15);
    setVolFilter(150);
    setMaxRisk(1000);
    setAlertSound(true);
    setAlertEmail(false);
    setAlertPush(true);
    try {
      ["orb_watchlist","orb_window","orb_volfilter","orb_maxrisk","orb_alertsound","orb_alertemail","orb_alertpush"]
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  // Fetch live quotes for header bar
  async function fetchQuotes() {
    try {
      const r = await fetch(`${API}/quote?tickers=SPY,QQQ,VIX`);
      const data = await r.json();
      const map = {};
      data.quotes.forEach(q => { map[q.ticker] = q; });
      setQuotes(map);
    } catch {}
  }

  // Scan watchlist for ORB breakouts
  async function runScan() {
    if (scanning) return;
    setScanning(true);
    setScanError(null);
    try {
      const tickers = watchlist.join(",");
      const r = await fetch(`${API}/scan?tickers=${tickers}&orbWindow=${orbWindow}&volFilter=${volFilter}`);
      const data = await r.json();
      setSignals(data.signals || []);
      setNoBreakout(data.noBreakout || []);
      if (data.spyTrend)      setSpyTrend(data.spyTrend);
      if (data.economicEvent) setEconomicEvent(data.economicEvent);
      setLastScanned(new Date().toLocaleTimeString());
      // Only alert for tickers we haven't seen before this session
      const newTickers = (data.signals || []).filter(s => !alertedTickers.current.has(s.ticker));
      if (newTickers.length > 0) {
        newTickers.forEach(s => {
          alertedTickers.current.add(s.ticker);
          signalFireTimes.current[s.ticker] = Date.now(); // record when it first fired
        });
        setNewSignalFlash(true);
        setTimeout(() => setNewSignalFlash(false), 1200);
        playSignalAlert();
      } else if ((data.noBreakout || []).length > 0) {
        playWatchingChime();
      }
      if (data.errors?.length) setScanError(data.errors.join(", "));
    } catch (e) {
      setScanError("Cannot reach server. Is server.js running on port 3001?");
    } finally {
      setScanning(false);
    }
  }

  // Trade log state
  const [tradeLog, setTradeLog]     = useState([]);
  const [tradeStats, setTradeStats] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [closeModal, setCloseModal] = useState(null); // trade being closed
  const [exitPrice, setExitPrice]   = useState("");

  async function fetchTradeLog() {
    setLogLoading(true);
    try {
      const r    = await fetch(`${API}/trades`);
      const data = await r.json();
      setTradeLog(data.trades || []);
      setTradeStats(data.stats || null);
    } catch {}
    setLogLoading(false);
  }

  async function logSignalAsTrade(signal) {
    try {
      await fetch(`${API}/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker:      signal.ticker,
          dir:         signal.dir,
          entry_price: signal.price,
          confidence:  signal.conf,
          volume:      signal.vol,
          reason:      signal.reason,
          orb_high:    signal.orbHigh,
          orb_low:     signal.orbLow,
        }),
      });
      fetchTradeLog();
    } catch {}
  }

  async function closeTrade(id, exit_price, outcome) {
    try {
      await fetch(`${API}/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exit_price: parseFloat(exit_price), outcome }),
      });
      setCloseModal(null);
      setExitPrice("");
      fetchTradeLog();
    } catch {}
  }

  // Auto-scan on mount and every 60 seconds
  useEffect(() => {
    alertedTickers.current.clear();
    signalFireTimes.current = {};
    fetchQuotes();
    runScan();
    fetchTradeLog();
    fetchFutures();
    const quoteInt   = setInterval(fetchQuotes, 30000);
    const scanInt    = setInterval(runScan, 60000);
    const logInt     = setInterval(fetchTradeLog, 60000);
    const futuresInt = setInterval(fetchFutures, 60000);
    return () => { clearInterval(quoteInt); clearInterval(scanInt); clearInterval(logInt); clearInterval(futuresInt); };
  }, [watchlist, orbWindow, volFilter]);

  function runSim() {
    setSimLoading(true);
    setSimResult(null);
    setTimeout(() => {
      const win = Math.random() > 0.42;
      const rr = (Math.random() * 2 + 1.2).toFixed(1);
      const pct = win ? `+${(Math.random() * 1.8 + 0.4).toFixed(2)}%` : `-${(Math.random() * 0.8 + 0.2).toFixed(2)}%`;
      setSimResult({
        entry: `$${(180 + Math.random() * 5).toFixed(2)}`,
        stop: `$${(179 + Math.random() * 1).toFixed(2)}`,
        target: `$${(183 + Math.random() * 3).toFixed(2)}`,
        outcome: win ? "WIN" : "LOSS",
        rr,
        pct,
        win,
      });
      setSimLoading(false);
    }, 1600);
  }

  const confBadge = c => <span className={`badge ${c}`}>{c === "high" ? "High Conf" : c === "med" ? "Med Conf" : "Low Conf"}</span>;

  // ── Confidence Score (max 97%) ──────────────────────────────────────────────
  // Weight distribution (see CHANGELOG for full rationale):
  //   Breakout confirmed      20%  — core signal
  //   Volume surge            18%  — real buying/selling interest
  //   SPY trend aligned       15%  — market tailwind
  //   ORB range healthy       12%  — avoids false breakouts
  //   Entry before 11 AM      12%  — timing edge
  //   No major news           10%  — avoids news-driven chaos
  //   No economic event        8%  — avoids macro distortion
  //   Pre-market gap aligned   3%  — bonus confirmation
  //   TOTAL MAX               97%  — 100% certainty never exists
  function calcConfidenceScore(s) {
    const now = new Date();
    const et  = new Date(now.toLocaleString("en-US", { timeZone:"America/New_York" }));
    const h   = et.getHours(), m = et.getMinutes();
    const isBeforeEleven = h < 11 || (h === 11 && m === 0);

    // SPY aligned = trend matches trade direction
    const spyAligned = s.dir === "long"
      ? spyTrend?.trend === "up"
      : spyTrend?.trend === "down";

    // Pre-market gap aligned with trade direction
    const pmEntry = premarket.find(p => p.ticker === s.ticker);
    const gapAligned = pmEntry
      ? (s.dir === "long" ? pmEntry.gapPct > 0.3 : pmEntry.gapPct < -0.3)
      : null;

    const checks = [
      { label: "Breakout confirmed",      weight: 20, pass: true                          },
      { label: "Volume surge",            weight: 18, pass: s.vol >= volFilter            },
      { label: "SPY trend aligned",       weight: 15, pass: spyAligned                    },
      { label: "ORB range healthy",       weight: 12, pass: !s.tinyRange                  },
      { label: "Entry before 11 AM",      weight: 12, pass: isBeforeEleven                },
      { label: "No major news",           weight: 10, pass: !s.news?.hasNews              },
      { label: "No economic event",       weight:  8, pass: !economicEvent?.hasEvent      },
      { label: "Pre-market gap aligned",  weight:  3, pass: gapAligned === true, na: gapAligned === null },
    ];

    const score = checks.reduce((sum, c) => sum + (c.pass && !c.na ? c.weight : 0), 0);
    return { score, checks };
  }

  function ConfScoreBadge({ s }) {
    const [open, setOpen] = useState(false);
    const { score, checks } = calcConfidenceScore(s);
    const color = score >= 80 ? "#00d4aa" : score >= 60 ? "#facc15" : "#ff4d6d";
    const bg    = score >= 80 ? "rgba(0,212,170,0.12)" : score >= 60 ? "rgba(250,204,21,0.12)" : "rgba(255,77,109,0.12)";
    const border= score >= 80 ? "#00d4aa33" : score >= 60 ? "#facc1533" : "#ff4d6d33";
    return (
      <span style={{position:"relative", display:"inline-block"}}>
        <span
          onClick={() => setOpen(o => !o)}
          style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background:bg, border:`1px solid ${border}`, color,
            borderRadius:6, padding:"3px 10px", fontSize:11,
            fontFamily:"'Space Mono',monospace", cursor:"pointer",
            userSelect:"none", transition:"all 0.2s",
          }}>
          ⬡ {score}%
        </span>
        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 6px)", left:0,
            background:"#0d1623", border:"1px solid #1e2a3a",
            borderRadius:10, padding:"12px 14px", zIndex:200,
            minWidth:230, boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:9, color:"#475569", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10}}>
              Confidence Breakdown
            </div>
            {checks.map((c,i) => (
              <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"5px 0", borderBottom:"1px solid #0f1520", fontSize:11}}>
                <span style={{color: c.na ? "#2a3a55" : c.pass ? "#94a3b8" : "#475569"}}>
                  {c.na ? "~" : c.pass ? "✓" : "⚠"} {c.label}
                </span>
                <span style={{
                  fontFamily:"'Space Mono',monospace", fontSize:10,
                  color: c.na ? "#2a3a55" : c.pass ? color : "#2a3a55",
                  fontWeight: c.pass ? 700 : 400,
                }}>
                  {c.na ? "n/a" : c.pass ? `+${c.weight}%` : `+0%`}
                </span>
              </div>
            ))}
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8,
              paddingTop:8, borderTop:"1px solid #1e2a3a"}}>
              <span style={{fontSize:11, color:"#64748b"}}>Confidence Score</span>
              <span style={{fontFamily:"'Space Mono',monospace", fontSize:12, color, fontWeight:700}}>{score}%</span>
            </div>
            <div style={{fontSize:9, color:"#2a3a55", marginTop:6}}>
              Max 97% — 100% certainty never exists
            </div>
          </div>
        )}
      </span>
    );
  }

  function calcTrade(s) {
    const entry    = s.price;
    const orbRange = s.orbHigh - s.orbLow;
    // Stop: just inside ORB level
    const stop     = s.dir === "long"
      ? +(s.orbHigh - orbRange * 0.1).toFixed(2)
      : +(s.orbLow  + orbRange * 0.1).toFixed(2);
    const riskPerShare = Math.abs(entry - stop);
    const shares   = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
    // Target 1: 2:1 fixed R/R
    const t1 = s.dir === "long"
      ? +(entry + riskPerShare * 2).toFixed(2)
      : +(entry - riskPerShare * 2).toFixed(2);
    // Target 2: 2x ORB range extension
    const t2 = s.dir === "long"
      ? +(entry + orbRange * 2).toFixed(2)
      : +(entry - orbRange * 2).toFixed(2);
    const reward1 = +(Math.abs(t1 - entry) * shares).toFixed(0);
    const reward2 = +(Math.abs(t2 - entry) * shares).toFixed(0);
    const rr1     = riskPerShare > 0 ? (Math.abs(t1 - entry) / riskPerShare).toFixed(1) : "—";
    const rr2     = riskPerShare > 0 ? (Math.abs(t2 - entry) / riskPerShare).toFixed(1) : "—";
    return { entry, stop, shares, t1, t2, reward1, reward2, rr1, rr2, riskPerShare: +riskPerShare.toFixed(2) };
  }

  function SignalCard({ s, idx }) {
    const [elapsed, setElapsed] = useState("");
    // Use the persistent fire time from parent — survives re-renders across scans
    const firedAt = signalFireTimes.current[s.ticker] || Date.now();

    useEffect(() => {
      const update = () => {
        const secs = Math.floor((Date.now() - firedAt) / 1000);
        if (secs < 60)        setElapsed(`${secs}s ago`);
        else if (secs < 3600) setElapsed(`${Math.floor(secs/60)}m ${secs%60}s ago`);
        else                  setElapsed(`${Math.floor(secs/3600)}h ago`);
      };
      update();
      const int = setInterval(update, 1000);
      return () => clearInterval(int);
    }, [firedAt]);

    const t  = calcTrade(s);
    const now = new Date();
    const late = now.getHours() >= 11;
    const orderType = "Market Order";

    return (
      <div className={`signal-card ${s.dir}`} key={`${s.id}-${idx}`}>
        {/* Header */}
        <div className="signal-header">
          <div className="signal-ticker">
            <div className={`signal-dir ${s.dir}`}>{s.dir === "long" ? "▲" : "▼"}</div>
            <div>
              <h3>{s.ticker} &nbsp; {confBadge(s.conf)} &nbsp; <ConfScoreBadge s={s} /></h3>
              <p>{s.dir === "long" ? "LONG — Buy Breakout" : "SHORT — Sell Breakout"} · {orderType}</p>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6}}>
            <span className={`signal-timer ${late ? "urgent" : ""}`}>⏱ {elapsed}</span>
            {late && <span className="time-warning">⚠ Late entry — use caution</span>}
          </div>
        </div>

        {/* Entry / Stop / Size */}
        <div className="trade-grid">
          <div className="trade-box entry">
            <div className="tb-label">Entry Price</div>
            <div className="tb-value">${t.entry}</div>
            <div className="tb-sub">Market order now</div>
          </div>
          <div className="trade-box stop">
            <div className="tb-label">Stop Loss</div>
            <div className="tb-value">${t.stop}</div>
            <div className="tb-sub">-${t.riskPerShare}/share</div>
          </div>
          <div className="trade-box size">
            <div className="tb-label">Position Size</div>
            <div className="tb-value">{t.shares} shares</div>
            <div className="tb-value">${(t.shares * t.entry).toLocaleString("en-US", {maximumFractionDigits:0})}</div>
            <div className="tb-sub">~${maxRisk.toLocaleString()} max risk</div>
          </div>
        </div>

        {/* Targets */}
        <div className="targets-row">
          <div className="target-box">
            <div className="t-label">Target 1 — 2:1 R/R</div>
            <div className="t-price">${t.t1}</div>
            <div className="t-meta">+${t.reward1} reward · {t.rr1}:1 R/R</div>
          </div>
          <div className="target-box">
            <div className="t-label">Target 2 — 2× ORB Range</div>
            <div className="t-price">${t.t2}</div>
            <div className="t-meta">+${t.reward2} reward · {t.rr2}:1 R/R</div>
          </div>
        </div>

        {/* Rule checks */}
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: s.tinyRange ? "rgba(255,77,109,0.1)" : "rgba(0,212,170,0.08)",
            border: `1px solid ${s.tinyRange ? "#ff4d6d44" : "#00d4aa33"}`,
            color: s.tinyRange ? "#ff4d6d" : "#00d4aa"}}>
            {s.tinyRange ? "⚠ Tiny range (<0.2%)" : `✓ Range OK (${s.orbRangePct}%)`}
          </span>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: spyTrend?.trend === "sideways" ? "rgba(250,204,21,0.08)" : spyTrend?.trend === "unknown" ? "rgba(71,85,105,0.2)" : "rgba(0,212,170,0.08)",
            border: `1px solid ${spyTrend?.trend === "sideways" ? "#facc1544" : spyTrend?.trend === "unknown" ? "#47556944" : "#00d4aa33"}`,
            color: spyTrend?.trend === "sideways" ? "#facc15" : spyTrend?.trend === "unknown" ? "#475569" : "#00d4aa"}}>
            {spyTrend?.trend === "up"       ? `✓ SPY trending up (+${spyTrend.spyChange}%)` :
             spyTrend?.trend === "down"     ? `✓ SPY trending down (${spyTrend.spyChange}%)` :
             spyTrend?.trend === "sideways" ? `⚠ SPY sideways (${spyTrend?.spyChange}%)` :
             "— SPY trend unknown"}
          </span>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: late ? "rgba(255,77,109,0.08)" : "rgba(0,212,170,0.08)",
            border: `1px solid ${late ? "#ff4d6d44" : "#00d4aa33"}`,
            color: late ? "#ff4d6d" : "#00d4aa"}}>
            {late ? "⚠ Entry after 11 AM" : "✓ Entry window open"}
          </span>
          {economicEvent?.hasEvent && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(250,204,21,0.08)", border:"1px solid #facc1544", color:"#facc15"}}>
              ⚠ {economicEvent.label}
            </span>
          )}
          {s.news?.hasNews && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(255,77,109,0.08)", border:"1px solid #ff4d6d44", color:"#ff4d6d"}}
              title={s.news.headlines?.join(" | ")}>
              ⚠ Major news — hover to see
            </span>
          )}
          {s.news && !s.news.hasNews && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(0,212,170,0.08)", border:"1px solid #00d4aa33", color:"#00d4aa"}}>
              ✓ No major news
            </span>
          )}
        </div>
        <div className="signal-footer">
          <div>
            <div className="meta-text">ORB Range: ${s.orbLow} – ${s.orbHigh} &nbsp;·&nbsp; Vol: {s.vol} &nbsp;·&nbsp; Fired: {s.time}</div>
            <div className="meta-text" style={{marginTop:3}}>{s.reason}</div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button className="btn btn-ghost" onClick={() => logSignalAsTrade(s)}
              style={{fontSize:9, padding:"6px 12px"}}>
              + Log
            </button>
            <button className={`action-btn ${s.dir === "long" ? "buy" : "sell"}`}>
              {s.dir === "long" ? "▲ BUY" : "▼ SELL"} {s.ticker}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{style}</style>
      <header className="header">
        <div className="logo">ORB<span>signal</span></div>
        <div className="ticker-bar">
          {["SPY","QQQ","VIX"].map(t => {
            const q = quotes[t];
            if (!q) return <div key={t} className="ticker-item">{t} <span style={{color:"#475569"}}>--</span></div>;
            const up = q.change >= 0;
            return (
              <div key={t} className="ticker-item">
                {t} <span className={up ? "up" : "down"}>{up ? "▲" : "▼"} {q.price} ({up ? "+" : ""}{q.change}%)</span>
              </div>
            );
          })}
          <div className="ticker-item"><span className="live-dot"/>LIVE</div>
          <button onClick={() => setAlertSound(v => !v)}
            style={{background:"none", border:"none", cursor:"pointer", fontSize:16, color: alertSound ? "#00d4aa" : "#475569"}}
            title={alertSound ? "Mute alerts" : "Unmute alerts"}>
            {alertSound ? "🔔" : "🔕"}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="hero">
          <div className="hero-label">
            <span>Day Trading Intelligence</span>
          </div>
          <h1>Master the<br/><em>Opening Range Breakout</em></h1>
          <p>Learn the rules, understand the logic, and receive real-time breakout signals — all in one place.</p>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{marginBottom: 32}}>
          <div className="stat-box">
            <span className="val">68%</span>
            <span className="lbl">Historical Win Rate</span>
          </div>
          <div className="stat-box">
            <span className="val">2.1x</span>
            <span className="lbl">Avg Risk/Reward</span>
          </div>
          <div className="stat-box">
            <span className="val">9:30–10:00</span>
            <span className="lbl">ORB Window</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: "learn",     label: "📖 How It Works" },
            { id: "signals",   label: <span>⚡ Live Signals {newSignalFlash ? "🟢" : ""}</span> },
            { id: "futures",   label: "📈 Futures" },
            { id: "tradelog",  label: "📋 Trade Log" },
            { id: "configure", label: "⚙️ Alert Config" },
          ].map(t => (
            <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>{ setTab(t.id); if(t.id==="tradelog") fetchTradeLog(); if(t.id==="futures") fetchFutures(); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* === LEARN TAB === */}
        {tab === "learn" && (
          <div>
            <div className="card">
              <div className="card-title">What is the Opening Range Breakout?</div>
              <p style={{fontSize:13, color:"#94a3b8", lineHeight:1.8, marginBottom:20}}>
                The ORB strategy captures the directional move that often follows the first burst of market activity. The "opening range" is simply the high and low formed in the first 15–30 minutes of trading. When price breaks decisively above or below that range, it signals institutional momentum that day traders can ride.
              </p>
              <div className="chart-wrap">
                <ORBChart />
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"#facc15"}}/>
                    <span>ORB High / Low</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"rgba(250,204,21,0.3)", height:8}}/>
                    <span>ORB Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"#00d4aa"}}/>
                    <span>Breakout Candles</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Step-by-Step Rules</div>
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-body">
                    <h4>Wait for the Opening Range</h4>
                    <p>Let the first 15 or 30 minutes trade freely. Mark the highest high and lowest low of that window — that's your range.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-body">
                    <h4>Wait for a Clean Breakout</h4>
                    <p>A candle must close above the ORB high (bullish) or below the ORB low (bearish). Don't enter on a wick alone.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-body">
                    <h4>Confirm with Volume</h4>
                    <p>The breakout candle should show at least 1.5× average volume. Low-volume breakouts fail far more often.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">4</div>
                  <div className="step-body">
                    <h4>Enter and Set Stops</h4>
                    <p>Enter at close of breakout candle. Stop loss goes just inside the ORB range (below high for longs, above low for shorts).</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">5</div>
                  <div className="step-body">
                    <h4>Target 2:1 Risk/Reward</h4>
                    <p>Set take profit at 2× the size of your stop. Trail stop after 1R is captured. Exit before 3:30 PM.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="card-title">Entry Rules Checklist</div>
                  <div style={{display:"flex", flexWrap:"wrap"}}>
                    {[
                      "Candle closes above/below ORB",
                      "Volume > 1.5× 20-bar avg",
                      "No major news event pending",
                      "Market trending (not sideways)",
                      "Entry before 11:00 AM",
                      "Risk max 1% of account",
                    ].map((r,i) => <div key={i} className="rule-chip"><div className="dot"/>{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{marginTop:0}}>
                  <div className="card-title">⚠ Avoid These Setups</div>
                  <div style={{display:"flex", flexWrap:"wrap"}}>
                    {[
                      "Wick-only breakout (no close)",
                      "Low volume < 1× average",
                      "Entry after 11:30 AM",
                      "FOMC / CPI days (volatility)",
                      "Tiny ORB range (< 0.2%)",
                    ].map((r,i) => <div key={i} className="rule-chip pill-warning"><div className="dot"/>{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{marginTop:0}}>
                  <div className="card-title">Signal Simulator</div>
                  <p style={{fontSize:11, color:"#64748b", marginBottom:12}}>Simulate a random ORB scenario and see entry/stop/target levels.</p>
                  <button className="btn btn-primary simulate-btn" onClick={runSim} disabled={simLoading}>
                    {simLoading ? "Simulating..." : "▶ Run Simulation"}
                  </button>
                  {simResult && (
                    <div className="alert-sim-result">
                      <div className="result-row"><span className="label">Entry Price</span><span className="value">{simResult.entry}</span></div>
                      <div className="result-row"><span className="label">Stop Loss</span><span className="value red">{simResult.stop}</span></div>
                      <div className="result-row"><span className="label">Take Profit</span><span className="value green">{simResult.target}</span></div>
                      <div className="result-row"><span className="label">Risk/Reward</span><span className="value">{simResult.rr}:1</span></div>
                      <div className="result-row"><span className="label">Outcome</span><span className={`value ${simResult.win?"green":"red"}`}>{simResult.outcome} {simResult.pct}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SIGNALS TAB === */}
        {tab === "signals" && (
          <div>

            {/* ── Morning Brief ── */}
            {(isPreMarketHours() || briefForced) && !briefDismissed && (
              <div className="morning-brief">
                <div className="brief-header">
                  <div className="brief-title">
                    🌅 Pre-Market Morning Brief
                    <span className="brief-time">
                      {new Date().toLocaleDateString("en-US", { timeZone:"America/New_York", weekday:"short", month:"short", day:"numeric" })}
                      {" · "}
                      {new Date().toLocaleTimeString("en-US", { timeZone:"America/New_York", hour:"2-digit", minute:"2-digit" })} ET
                    </span>
                  </div>
                  <button className="brief-dismiss" onClick={() => { setBriefDismissed(true); setBriefForced(false); }} title="Dismiss">✕</button>
                </div>

                {futures.length === 0 && (
                  <div style={{color:"#475569", fontSize:12, padding:"12px 0"}}>⟳ Loading futures data...</div>
                )}

                {futures.length > 0 && (<>
                {/* Index futures */}
                <div className="brief-futures">
                  {futures.filter(f => f.category === "index").map(f => (
                    <div key={f.symbol} className={`brief-future ${f.trend}`}>
                      <div className="brief-future-name">{f.name}</div>
                      <div className="brief-future-price">{f.price ? `$${f.price.toLocaleString()}` : "—"}</div>
                      <div className={`brief-future-chg ${f.trend === "up" ? "up" : f.trend === "down" ? "down" : "flat"}`}>
                        {f.change != null ? `${f.change > 0 ? "▲" : f.change < 0 ? "▼" : "—"} ${Math.abs(f.change)}%` : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gap movers */}
                {premarket.filter(p => Math.abs(p.gapPct || 0) > 0.3).length > 0 && (
                  <div className="brief-movers">
                    <div className="brief-movers-title">Gap Movers — Your Watchlist</div>
                    {premarket
                      .filter(p => Math.abs(p.gapPct || 0) > 0.3)
                      .sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct))
                      .map(p => (
                        <div key={p.ticker} className="brief-mover-row">
                          <span className="brief-mover-ticker">{p.ticker}</span>
                          <span className="brief-mover-price">${p.prePrice}</span>
                          <span className={`brief-mover-gap ${p.gapDir}`}>
                            {p.gapPct > 0 ? "▲" : "▼"} {Math.abs(p.gapPct)}%
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Auto-generated text summary */}
                <div className="brief-summary">
                  {(() => {
                    const es  = futures.find(f => f.symbol === "ES=F");
                    const nq  = futures.find(f => f.symbol === "NQ=F");
                    const cl  = futures.find(f => f.symbol === "CL=F");
                    const gapUp   = premarket.filter(p => p.gapPct > 0.5).length;
                    const gapDown = premarket.filter(p => p.gapPct < -0.5).length;
                    const mktBias = (es?.trend === "up" && nq?.trend === "up") ? "bull"
                                  : (es?.trend === "down" && nq?.trend === "down") ? "bear"
                                  : "warn";
                    return (
                      <span>
                        <strong>Market bias:</strong>
                        <span className={`tag ${mktBias}`}>
                          {mktBias === "bull" ? "BULLISH" : mktBias === "bear" ? "BEARISH" : "MIXED"}
                        </span>
                        {es && <> — S&P futures <strong>{es.change > 0 ? "up" : "down"} {Math.abs(es.change)}%</strong></>}
                        {nq && <>, Nasdaq <strong>{nq.change > 0 ? "up" : "down"} {Math.abs(nq.change)}%</strong></>}.
                        {cl && <> Crude oil at <strong>${cl.price}</strong> ({cl.change > 0 ? "+" : ""}{cl.change}%).</>}
                        {economicEvent?.hasEvent && <> <span className="tag warn">⚠ {economicEvent.label}</span> today — trade smaller.</>}
                        {(gapUp > 0 || gapDown > 0) && <> {gapUp > 0 && <><strong>{gapUp}</strong> ticker{gapUp > 1 ? "s" : ""} gapping up.</>} {gapDown > 0 && <><strong>{gapDown}</strong> gapping down.</>}</>}
                        {" "}ORB window opens at <strong>9:30 AM ET</strong>.
                      </span>
                    );
                  })()}
                </div>
                </>)}
              </div>
            )}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-title">Today's ORB Signals</div>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
                <p style={{fontSize:11, color:"#475569"}}>
                  <span className="live-dot"/>
                  {lastScanned ? `Last scanned: ${lastScanned} · Auto-refreshes every 60s` : "Scanning watchlist..."}
                </p>
                <button className="btn btn-ghost" onClick={runScan} disabled={scanning}
                  style={{fontSize:10, padding:"6px 12px"}}>
                  {scanning ? "⟳ Scanning..." : "↺ Scan Now"}
                </button>
              </div>

              {scanError && (
                <div style={{background:"rgba(255,77,109,0.08)", border:"1px solid #ff4d6d33",
                  borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:11, color:"#ff4d6d"}}>
                  ⚠ {scanError}
                </div>
              )}

              {economicEvent?.hasEvent && (
                <div style={{background:"rgba(250,204,21,0.06)", border:"1px solid #facc1544",
                  borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:11, color:"#facc15",
                  display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:16}}>⚠</span>
                  <div>
                    <strong>{economicEvent.label} today</strong>
                    <span style={{color:"#94a3b8", marginLeft:8}}>— High volatility expected. ORB signals less reliable.</span>
                  </div>
                </div>
              )}

              {scanning && !signals.length && (
                <div className="empty-state">
                  <div className="icon">📡</div>
                  <p>Scanning {watchlist.join(", ")}...</p>
                </div>
              )}

              {!scanning && !scanError && signals.length === 0 && noBreakout.length === 0 && (
                <div className="empty-state">
                  <div className="icon">📡</div>
                  <p>No signals yet.<br/>Click "Scan Now" or wait for auto-refresh.</p>
                </div>
              )}

              {signals.map((s, idx) => (
                <SignalCard key={`${s.id}-${idx}`} s={s} idx={idx} />
              ))}

              {noBreakout.length > 0 && (
                <div style={{marginTop: signals.length ? 20 : 0}}>
                  <div style={{fontSize:10, color:"#475569", letterSpacing:"0.15em",
                    textTransform:"uppercase", marginBottom:10}}>Watching — No Breakout Yet</div>
                  {noBreakout.map((s, idx) => (
                    <div key={`nb-${idx}`} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 14px", background:"#080b10", borderRadius:8,
                      border:"1px solid #1a2030", marginBottom:8, fontSize:11
                    }}>
                      <span style={{color:"#94a3b8", fontWeight:"bold"}}>{s.ticker}</span>
                      <span style={{color:"#475569"}}>Range: ${s.orbLow} – ${s.orbHigh}</span>
                      <span style={{color:"#64748b"}}>${s.price}</span>
                      <span style={{color:"#475569"}}>{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Signal Key</div>
              <div style={{display:"flex", gap:24, flexWrap:"wrap", fontSize:12, color:"#64748b"}}>
                <div>🟢 <span style={{color:"#00d4aa"}}>Long</span> — Breakout above ORB High</div>
                <div>🔴 <span style={{color:"#ff4d6d"}}>Short</span> — Breakdown below ORB Low</div>
                <div><span className="badge high">High Conf</span> 200%+ volume</div>
                <div><span className="badge med">Med Conf</span> 120–200% volume</div>
                <div><span className="badge low">Low Conf</span> Under 120% — caution</div>
              </div>
            </div>
          </div>
        )}

        {/* === FUTURES TAB === */}
        {tab === "futures" && (
          <div>
            {/* Futures grid */}
            <div className="card" style={{marginBottom:20}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                <div className="card-title">Futures Markets</div>
                <button className="btn btn-ghost" onClick={fetchFutures}
                  style={{fontSize:10, padding:"6px 12px"}}>
                  {futuresLoading ? "⟳ Loading..." : "↺ Refresh"}
                </button>
              </div>
              {futures.length === 0 && !futuresLoading && (
                <div className="empty-state">
                  <div className="icon">📈</div>
                  <p>Loading futures data...</p>
                </div>
              )}
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10}}>
                {futures.map(f => (
                  <div key={f.symbol} style={{
                    background:"#080b10", border:`1px solid ${f.trend==="up"?"#00d4aa33":f.trend==="down"?"#ff4d6d33":"#1a2030"}`,
                    borderRadius:10, padding:"14px 16px"
                  }}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
                      <div>
                        <div style={{fontSize:11, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2}}>{f.name}</div>
                        <div style={{fontSize:10, color:"#2a3a55"}}>{f.symbol}</div>
                      </div>
                      <span style={{fontSize:9, padding:"2px 7px", borderRadius:4,
                        background: f.trend==="up"?"rgba(0,212,170,0.1)":f.trend==="down"?"rgba(255,77,109,0.1)":"rgba(71,85,105,0.2)",
                        color: f.trend==="up"?"#00d4aa":f.trend==="down"?"#ff4d6d":"#475569",
                        border: `1px solid ${f.trend==="up"?"#00d4aa33":f.trend==="down"?"#ff4d6d33":"#1a2030"}`
                      }}>
                        {f.trend==="up"?"▲ UP":f.trend==="down"?"▼ DOWN":"— FLAT"}
                      </span>
                    </div>
                    <div style={{fontSize:20, fontWeight:700, color:"#f0f4f8", marginBottom:4}}>
                      {f.price ? `$${f.price.toLocaleString()}` : "—"}
                    </div>
                    <div style={{fontSize:11, color: f.change > 0 ? "#00d4aa" : f.change < 0 ? "#ff4d6d" : "#475569"}}>
                      {f.change != null ? `${f.change > 0 ? "+" : ""}${f.change}%` : "—"}
                      {f.prevClose && <span style={{color:"#2a3a55", marginLeft:8}}>prev ${f.prevClose.toLocaleString()}</span>}
                    </div>
                    {f.high && f.low && (
                      <div style={{fontSize:10, color:"#2a3a55", marginTop:4}}>
                        H: ${f.high.toLocaleString()} · L: ${f.low.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-market watchlist */}
            <div className="card">
              <div className="card-title" style={{marginBottom:16}}>Pre-Market — Your Watchlist</div>
              {premarket.length === 0 && (
                <div className="empty-state" style={{padding:"20px 0"}}>
                  <div className="icon">🌅</div>
                  <p>No pre-market data yet.<br/>Available from ~4:00 AM ET.</p>
                </div>
              )}
              {premarket.length > 0 && (
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #1e2a3a", color:"#475569", textAlign:"left"}}>
                      {["Ticker","Pre-Market Price","Prev Close","Gap %","Direction"].map(h => (
                        <th key={h} style={{padding:"8px 12px", fontWeight:"normal", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {premarket.map(p => (
                      <tr key={p.ticker} style={{borderBottom:"1px solid #0f1520"}}>
                        <td style={{padding:"12px", color:"#f0f4f8", fontWeight:"bold"}}>{p.ticker}</td>
                        <td style={{padding:"12px", color:"#e2e8f0"}}>{p.prePrice ? `$${p.prePrice}` : "—"}</td>
                        <td style={{padding:"12px", color:"#475569"}}>{p.prevClose ? `$${p.prevClose}` : "—"}</td>
                        <td style={{padding:"12px", color: p.gapPct > 0.5 ? "#00d4aa" : p.gapPct < -0.5 ? "#ff4d6d" : "#475569"}}>
                          {p.gapPct != null ? `${p.gapPct > 0 ? "+" : ""}${p.gapPct}%` : "—"}
                        </td>
                        <td style={{padding:"12px"}}>
                          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
                            background: p.gapDir==="up"?"rgba(0,212,170,0.1)":p.gapDir==="down"?"rgba(255,77,109,0.1)":"rgba(71,85,105,0.15)",
                            color: p.gapDir==="up"?"#00d4aa":p.gapDir==="down"?"#ff4d6d":"#475569",
                            border: `1px solid ${p.gapDir==="up"?"#00d4aa33":p.gapDir==="down"?"#ff4d6d33":"#1a203044"}`
                          }}>
                            {p.gapDir==="up"?"▲ Gap Up":p.gapDir==="down"?"▼ Gap Down":"— Flat"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* === TRADE LOG TAB === */}
        {tab === "tradelog" && (
          <div>
            {tradeStats && (
              <div className="grid-3" style={{marginBottom:20}}>
                <div className="stat-box">
                  <span className="val" style={{fontSize:24}}>{tradeStats.winRate}%</span>
                  <span className="lbl">Win Rate</span>
                </div>
                <div className="stat-box">
                  <span className="val" style={{fontSize:24, color: tradeStats.totalPnl >= 0 ? "#00d4aa" : "#ff4d6d"}}>
                    ${tradeStats.totalPnl >= 0 ? "+" : ""}{tradeStats.totalPnl}
                  </span>
                  <span className="lbl">Total P&L</span>
                </div>
                <div className="stat-box">
                  <span className="val" style={{fontSize:24}}>{tradeStats.total}</span>
                  <span className="lbl">Total Trades ({tradeStats.wins}W / {tradeStats.losses}L)</span>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title">Trade History</div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                <p style={{fontSize:11, color:"#475569"}}>
                  {logLoading ? "Loading..." : `${tradeLog.length} trades recorded`}
                </p>
                <a href={`${API}/trades/export`} target="_blank"
                  className="btn btn-ghost" style={{fontSize:10, padding:"6px 12px", textDecoration:"none"}}>
                  ⬇ Export CSV
                </a>
              </div>

              {tradeLog.length === 0 && !logLoading && (
                <div className="empty-state">
                  <div className="icon">📋</div>
                  <p>No trades logged yet.<br/>Click "+ Log Trade" on any signal to record it.</p>
                </div>
              )}

              {tradeLog.length > 0 && (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%", borderCollapse:"collapse", fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #1e2a3a", color:"#475569", textAlign:"left"}}>
                        {["Ticker","Dir","Entry","Stop","Target","Exit","Outcome","P&L","Conf","Logged"].map(h => (
                          <th key={h} style={{padding:"8px 10px", fontWeight:"normal", letterSpacing:"0.1em", textTransform:"uppercase", fontSize:10}}>{h}</th>
                        ))}
                        <th style={{padding:"8px 10px"}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeLog.map(t => (
                        <tr key={t.id} style={{borderBottom:"1px solid #0f1520"}}>
                          <td style={{padding:"10px", color:"#f0f4f8", fontWeight:"bold"}}>{t.ticker}</td>
                          <td style={{padding:"10px", color: t.dir === "long" ? "#00d4aa" : "#ff4d6d"}}>{t.dir === "long" ? "▲ Long" : "▼ Short"}</td>
                          <td style={{padding:"10px", color:"#94a3b8"}}>${t.entry_price}</td>
                          <td style={{padding:"10px", color:"#ff4d6d"}}>${t.stop_price}</td>
                          <td style={{padding:"10px", color:"#00d4aa"}}>${t.target_price}</td>
                          <td style={{padding:"10px", color:"#94a3b8"}}>{t.exit_price ? `$${t.exit_price}` : "—"}</td>
                          <td style={{padding:"10px"}}>
                            <span className={`badge ${t.outcome === "win" ? "high" : t.outcome === "loss" ? "low" : "med"}`}>
                              {t.outcome}
                            </span>
                          </td>
                          <td style={{padding:"10px", color: t.pnl_dollar > 0 ? "#00d4aa" : t.pnl_dollar < 0 ? "#ff4d6d" : "#475569"}}>
                            {t.pnl_dollar != null ? `${t.pnl_dollar > 0 ? "+" : ""}$${t.pnl_dollar} (${t.pnl_pct}%)` : "—"}
                          </td>
                          <td style={{padding:"10px"}}>
                            <span className={`badge ${t.confidence}`}>{t.confidence}</span>
                          </td>
                          <td style={{padding:"10px", color:"#475569"}}>
                            {new Date(t.logged_at).toLocaleDateString("en-US", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}
                          </td>
                          <td style={{padding:"10px"}}>
                            {t.outcome === "open" && (
                              <button className="btn btn-ghost" onClick={() => setCloseModal(t)}
                                style={{fontSize:9, padding:"4px 10px"}}>
                                Close
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Close Trade Modal */}
            {closeModal && (
              <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}>
                <div className="card" style={{width:340, margin:0}}>
                  <div className="card-title">Close Trade — {closeModal.ticker}</div>
                  <p style={{fontSize:12, color:"#94a3b8", marginBottom:16}}>
                    {closeModal.dir === "long" ? "▲ Long" : "▼ Short"} · Entry: ${closeModal.entry_price}
                  </p>
                  <div className="slider-row">
                    <label>Exit Price</label>
                    <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
                      placeholder={`e.g. ${closeModal.target_price}`}
                      style={{width:"100%", background:"#0f1520", border:"1px solid #2a3a55", borderRadius:6,
                        padding:"8px 12px", color:"#e2e8f0", fontFamily:"'Space Mono', monospace", fontSize:12, outline:"none"}} />
                  </div>
                  <div style={{display:"flex", gap:8, marginTop:12}}>
                    <button className="btn btn-primary" style={{flex:1}}
                      onClick={() => closeTrade(closeModal.id, exitPrice, parseFloat(exitPrice) > closeModal.entry_price === (closeModal.dir === "long") ? "win" : "loss")}>
                      ✓ Close as {exitPrice && (parseFloat(exitPrice) > closeModal.entry_price === (closeModal.dir === "long") ? "WIN" : "LOSS")}
                    </button>
                    <button className="btn btn-ghost" onClick={() => closeTrade(closeModal.id, closeModal.entry_price, "cancelled")}>
                      Cancel Trade
                    </button>
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%", marginTop:8}}
                    onClick={() => { setCloseModal(null); setExitPrice(""); }}>
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === CONFIG TAB === */}
        {tab === "configure" && (
          <div className="grid-2">
            <div>
              <div className="card">
                <div className="card-title">ORB Strategy Settings</div>
                <div className="slider-row">
                  <label>ORB Window <span>{orbWindow} min</span></label>
                  <input type="range" min="5" max="60" step="5" value={orbWindow}
                    onChange={e => setOrbWindow(Number(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Min Volume Filter <span>{volFilter}% of avg</span></label>
                  <input type="range" min="100" max="400" step="10" value={volFilter}
                    onChange={e => setVolFilter(Number(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Max Risk Per Trade <span style={{color:"#facc15"}}>${maxRisk.toLocaleString()}</span></label>
                  <input type="range" min="100" max="10000" step="100" value={maxRisk}
                    onChange={e => setMaxRisk(Number(e.target.value))} />
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:10, color:"#2a3a55", marginTop:4}}>
                    <span>$100</span>
                    <span>$2,500</span>
                    <span>$5,000</span>
                    <span>$10,000</span>
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <div className="card-title" style={{marginBottom:10}}>Watchlist</div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:10}}>
                    {watchlist.map(t => (
                      <div key={t} style={{
                        display:"flex", alignItems:"center", gap:5,
                        background:"#1a2540", border:"1px solid #2a3a55",
                        borderRadius:6, padding:"5px 10px", fontSize:11, color:"#e2e8f0"
                      }}>
                        {t}
                        <button onClick={() => removeTicker(t)} style={{
                          background:"none", border:"none", color:"#ff4d6d",
                          cursor:"pointer", fontSize:13, lineHeight:1, padding:0, marginLeft:2
                        }}>×</button>
                      </div>
                    ))}
                    {watchlist.length === 0 && (
                      <span style={{fontSize:11, color:"#475569"}}>No tickers — add one below</span>
                    )}
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={e => setTickerInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && addTicker()}
                      placeholder="Add ticker e.g. NVDA"
                      maxLength={5}
                      style={{
                        flex:1, background:"#0f1520", border:"1px solid #2a3a55",
                        borderRadius:6, padding:"8px 12px", color:"#e2e8f0",
                        fontFamily:"'Space Mono', monospace", fontSize:11, outline:"none"
                      }}
                    />
                    <button className="btn btn-primary" onClick={addTicker} style={{padding:"8px 14px"}}>
                      + Add
                    </button>
                  </div>
                </div>
                <div className="config-row">
                  <span className="config-label">Signal Cutoff Time</span>
                  <select>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>12:00 PM</option>
                  </select>
                </div>
                <div className="config-row">
                  <span className="config-label">Confidence Filter</span>
                  <select>
                    <option>All Signals</option>
                    <option>Medium + High Only</option>
                    <option>High Confidence Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="card">
                <div className="card-title">Alert Notifications</div>
                <div className="config-row">
                  <span className="config-label">
                    {alertSound ? "🔔 Sound Alert" : "🔕 Sound Muted"}
                  </span>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <button className="btn btn-ghost" onClick={() => { playSignalAlert(); }}
                      style={{fontSize:10, padding:"4px 10px"}} title="Preview signal sound">
                      ▶ Preview
                    </button>
                    <button className={`toggle ${alertSound?"on":""}`} onClick={() => setAlertSound(v => !v)}/>
                  </div>
                </div>
                <div className="config-row">
                  <span className="config-label">📧 Email Alerts</span>
                  <button className={`toggle ${alertEmail?"on":""}`} onClick={() => setAlertEmail(v => !v)}/>
                </div>
                <div className="config-row">
                  <span className="config-label">📱 Push Notifications</span>
                  <button className={`toggle ${alertPush?"on":""}`} onClick={() => setAlertPush(v => !v)}/>
                </div>
                <div className="config-row">
                  <span className="config-label">Current ORB Window</span>
                  <span className="config-value">{orbWindow} min</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Volume Threshold</span>
                  <span className="config-value">{volFilter}%</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Max Risk Per Trade</span>
                  <span className="config-value" style={{color:"#facc15"}}>${maxRisk.toLocaleString()}</span>
                </div>
                <button className="btn btn-primary" onClick={saveConfig} style={{marginTop:20, width:"100%"}}>
                  {saveFlash ? "✓ Saved!" : "Save Configuration"}
                </button>
                <button className="btn btn-ghost" onClick={resetConfig} style={{marginTop:8, width:"100%"}}>
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <nav className="footer-nav">
            <a href="#" onClick={e => { e.preventDefault(); setTab("learn"); window.scrollTo(0,0); }}>📖 How It Works</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("signals"); window.scrollTo(0,0); }}>⚡ Live Signals</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("futures"); fetchFutures(); window.scrollTo(0,0); }}>📈 Futures</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("tradelog"); fetchTradeLog(); window.scrollTo(0,0); }}>📋 Trade Log</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("configure"); window.scrollTo(0,0); }}>⚙️ Alert Config</a>
            <a href="#" onClick={e => { e.preventDefault(); showBrief(); }}>🌅 Morning Brief</a>
          </nav>
          <div className="footer-bottom">
            <div className="footer-copy">
              © {new Date().getFullYear()} <a href="https://ibcnet.com" target="_blank" rel="noopener noreferrer">IBCnet</a>. All rights reserved.
            </div>
            <div className="footer-version">
              <a href="https://github.com/ibcnet-com/orb-signal-app/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">
                v2.1.0
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="bottom-nav">
        {[
          { id: "learn",     icon: "📖", label: "How To" },
          { id: "signals",   icon: "⚡", label: "Signals" },
          { id: "futures",   icon: "📈", label: "Futures" },
          { id: "tradelog",  icon: "📋", label: "Log" },
          { id: "configure", icon: "⚙️", label: "Config" },
        ].map(t => (
          <button key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id);
              if (t.id === "tradelog") fetchTradeLog();
              if (t.id === "futures")  fetchFutures();
              window.scrollTo(0, 0);
            }}>
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
