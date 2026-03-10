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
  @media(max-width:640px) {
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr; }
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
    border-radius: 10px;
    border: 1px solid #1e2a3a;
    padding: 16px 20px;
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    animation: slideIn 0.4s ease both;
  }
  .signal-card:hover { border-color: #2a3a55; transform: translateX(3px); }
  @keyframes slideIn {
    from { opacity:0; transform: translateX(-12px); }
    to { opacity:1; transform: translateX(0); }
  }
  .signal-dir {
    width: 44px; height: 44px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .signal-dir.long { background: rgba(0,212,170,0.12); border: 1px solid #00d4aa44; }
  .signal-dir.short { background: rgba(255,77,109,0.12); border: 1px solid #ff4d6d44; }
  .signal-info { flex: 1; }
  .signal-info h4 { font-size: 14px; color: #f0f4f8; margin-bottom: 4px; }
  .signal-info p { font-size: 11px; color: #64748b; }
  .signal-meta { text-align: right; }
  .signal-meta .price { font-size: 15px; font-weight: 700; }
  .signal-meta .price.long { color: #00d4aa; }
  .signal-meta .price.short { color: #ff4d6d; }
  .signal-meta .time { font-size: 10px; color: #475569; margin-top: 3px; }
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
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
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
        stroke="#facc1555" strokeWidth="1" strokeDasharray="3,3" />
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
            <line x1={cx} y1={py(c.h)} x2={cx} y2={py(c.l)} stroke={color} strokeWidth="1.5" />
            <rect x={x} y={py(Math.max(c.o, c.c))}
              width={cWidth} height={Math.max(2, Math.abs(py(c.o) - py(c.c)))}
              fill={color} opacity={i >= 8 ? 1 : 0.7} />
          </g>
        );
      })}

      {/* Breakout arrow */}
      {breakout && (
        <g transform={`translate(${pad.l + cWidth * 9 + gap * 10 + cWidth / 2}, ${orbHighY - 18})`}>
          <polygon points="0,-10 -7,0 7,0" fill="#00d4aa" />
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
  const [quotes, setQuotes] = useState({});
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [orbWindow, setOrbWindow] = useState(() => loadFromStorage("orb_window", 15));
  const [volFilter, setVolFilter] = useState(() => loadFromStorage("orb_volfilter", 150));
  const [alertSound, setAlertSound] = useState(() => loadFromStorage("orb_alertsound", true));
  const [alertEmail, setAlertEmail] = useState(() => loadFromStorage("orb_alertemail", false));
  const [alertPush, setAlertPush] = useState(() => loadFromStorage("orb_alertpush", true));
  const [watchlist, setWatchlist] = useState(() => loadFromStorage("orb_watchlist", DEFAULT_WATCHLIST));
  const [tickerInput, setTickerInput] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [newSignalFlash, setNewSignalFlash] = useState(false);
  const timerRef = useRef(null);

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
      localStorage.setItem("orb_alertsound", JSON.stringify(alertSound));
      localStorage.setItem("orb_alertemail", JSON.stringify(alertEmail));
      localStorage.setItem("orb_alertpush", JSON.stringify(alertPush));
    } catch { }
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }

  function resetConfig() {
    setWatchlist(DEFAULT_WATCHLIST);
    setOrbWindow(15);
    setVolFilter(150);
    setAlertSound(true);
    setAlertEmail(false);
    setAlertPush(true);
    try {
      ["orb_watchlist", "orb_window", "orb_volfilter", "orb_alertsound", "orb_alertemail", "orb_alertpush"]
        .forEach(k => localStorage.removeItem(k));
    } catch { }
  }

  // Fetch live quotes for header bar
  async function fetchQuotes() {
    try {
      const r = await fetch(`${API}/quote?tickers=SPY,QQQ,VIX`);
      const data = await r.json();
      const map = {};
      data.quotes.forEach(q => { map[q.ticker] = q; });
      setQuotes(map);
    } catch { }
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
      setLastScanned(new Date().toLocaleTimeString());
      if (data.signals.length > 0) {
        setNewSignalFlash(true);
        setTimeout(() => setNewSignalFlash(false), 1200);
      }
      if (data.errors?.length) setScanError(data.errors.join(", "));
    } catch (e) {
      setScanError("Cannot reach server. Is server.js running on port 3001?");
    } finally {
      setScanning(false);
    }
  }

  // Auto-scan on mount and every 60 seconds
  useEffect(() => {
    fetchQuotes();
    runScan();
    const quoteInt = setInterval(fetchQuotes, 30000);
    const scanInt = setInterval(runScan, 60000);
    return () => { clearInterval(quoteInt); clearInterval(scanInt); };
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

  return (
    <div className="app">
      <style>{style}</style>
      <header className="header">
        <div className="logo">ORB<span>signal</span></div>
        <div className="ticker-bar">
          {["SPY", "QQQ", "VIX"].map(t => {
            const q = quotes[t];
            if (!q) return <div key={t} className="ticker-item">{t} <span style={{ color: "#475569" }}>--</span></div>;
            const up = q.change >= 0;
            return (
              <div key={t} className="ticker-item">
                {t} <span className={up ? "up" : "down"}>{up ? "▲" : "▼"} {q.price} ({up ? "+" : ""}{q.change}%)</span>
              </div>
            );
          })}
          <div className="ticker-item"><span className="live-dot" />LIVE</div>
        </div>
      </header>

      <main className="main">
        <div className="hero">
          <div className="hero-label">
            <span>Day Trading Intelligence</span>
          </div>
          <h1>Master the<br /><em>Opening Range Breakout</em></h1>
          <p>Learn the rules, understand the logic, and receive real-time breakout signals — all in one place.</p>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
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
          {["learn", "signals", "configure"].map(t => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "learn" ? "📖 How It Works" : t === "signals" ? <span>⚡ Live Signals {newSignalFlash ? "🟢" : ""}</span> : "⚙️ Alert Config"}
            </button>
          ))}
        </div>

        {/* === LEARN TAB === */}
        {tab === "learn" && (
          <div>
            <div className="card">
              <div className="card-title">What is the Opening Range Breakout?</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>
                The ORB strategy captures the directional move that often follows the first burst of market activity. The "opening range" is simply the high and low formed in the first 15–30 minutes of trading. When price breaks decisively above or below that range, it signals institutional momentum that day traders can ride.
              </p>
              <div className="chart-wrap">
                <ORBChart />
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-line" style={{ background: "#facc15" }} />
                    <span>ORB High / Low</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{ background: "rgba(250,204,21,0.3)", height: 8 }} />
                    <span>ORB Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{ background: "#00d4aa" }} />
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
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {[
                      "Candle closes above/below ORB",
                      "Volume > 1.5× 20-bar avg",
                      "No major news event pending",
                      "Market trending (not sideways)",
                      "Entry before 11:00 AM",
                      "Risk max 1% of account",
                    ].map((r, i) => <div key={i} className="rule-chip"><div className="dot" />{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{ marginTop: 0 }}>
                  <div className="card-title">⚠ Avoid These Setups</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {[
                      "Wick-only breakout (no close)",
                      "Low volume < 1× average",
                      "Entry after 11:30 AM",
                      "FOMC / CPI days (volatility)",
                      "Tiny ORB range (< 0.2%)",
                    ].map((r, i) => <div key={i} className="rule-chip pill-warning"><div className="dot" />{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{ marginTop: 0 }}>
                  <div className="card-title">Signal Simulator</div>
                  <p style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Simulate a random ORB scenario and see entry/stop/target levels.</p>
                  <button className="btn btn-primary simulate-btn" onClick={runSim} disabled={simLoading}>
                    {simLoading ? "Simulating..." : "▶ Run Simulation"}
                  </button>
                  {simResult && (
                    <div className="alert-sim-result">
                      <div className="result-row"><span className="label">Entry Price</span><span className="value">{simResult.entry}</span></div>
                      <div className="result-row"><span className="label">Stop Loss</span><span className="value red">{simResult.stop}</span></div>
                      <div className="result-row"><span className="label">Take Profit</span><span className="value green">{simResult.target}</span></div>
                      <div className="result-row"><span className="label">Risk/Reward</span><span className="value">{simResult.rr}:1</span></div>
                      <div className="result-row"><span className="label">Outcome</span><span className={`value ${simResult.win ? "green" : "red"}`}>{simResult.outcome} {simResult.pct}</span></div>
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
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title">Today's ORB Signals</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#475569" }}>
                  <span className="live-dot" />
                  {lastScanned ? `Last scanned: ${lastScanned} · Auto-refreshes every 60s` : "Scanning watchlist..."}
                </p>
                <button className="btn btn-ghost" onClick={runScan} disabled={scanning}
                  style={{ fontSize: 10, padding: "6px 12px" }}>
                  {scanning ? "⟳ Scanning..." : "↺ Scan Now"}
                </button>
              </div>

              {scanError && (
                <div style={{
                  background: "rgba(255,77,109,0.08)", border: "1px solid #ff4d6d33",
                  borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 11, color: "#ff4d6d"
                }}>
                  ⚠ {scanError}
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
                  <p>No signals yet.<br />Click "Scan Now" or wait for auto-refresh.</p>
                </div>
              )}

              {signals.map((s, idx) => (
                <div key={`${s.id}-${idx}`} className="signal-card">
                  <div className={`signal-dir ${s.dir}`}>
                    {s.dir === "long" ? "▲" : "▼"}
                  </div>
                  <div className="signal-info">
                    <h4>{s.ticker} &nbsp; {confBadge(s.conf)}</h4>
                    <p>{s.reason}</p>
                    <p style={{ marginTop: 4, color: "#475569" }}>Vol: {s.vol}</p>
                  </div>
                  <div className="signal-meta">
                    <div className={`price ${s.dir}`}>${s.price}</div>
                    <div className="time">{s.time}</div>
                  </div>
                </div>
              ))}

              {noBreakout.length > 0 && (
                <div style={{ marginTop: signals.length ? 20 : 0 }}>
                  <div style={{
                    fontSize: 10, color: "#475569", letterSpacing: "0.15em",
                    textTransform: "uppercase", marginBottom: 10
                  }}>Watching — No Breakout Yet</div>
                  {noBreakout.map((s, idx) => (
                    <div key={`nb-${idx}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", background: "#080b10", borderRadius: 8,
                      border: "1px solid #1a2030", marginBottom: 8, fontSize: 11
                    }}>
                      <span style={{ color: "#94a3b8", fontWeight: "bold" }}>{s.ticker}</span>
                      <span style={{ color: "#475569" }}>Range: ${s.orbLow} – ${s.orbHigh}</span>
                      <span style={{ color: "#64748b" }}>${s.price}</span>
                      <span style={{ color: "#475569" }}>{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Signal Key</div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
                <div>🟢 <span style={{ color: "#00d4aa" }}>Long</span> — Breakout above ORB High</div>
                <div>🔴 <span style={{ color: "#ff4d6d" }}>Short</span> — Breakdown below ORB Low</div>
                <div><span className="badge high">High Conf</span> 200%+ volume</div>
                <div><span className="badge med">Med Conf</span> 120–200% volume</div>
                <div><span className="badge low">Low Conf</span> Under 120% — caution</div>
              </div>
            </div>
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
                <div style={{ marginBottom: 16 }}>
                  <div className="card-title" style={{ marginBottom: 10 }}>Watchlist</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {watchlist.map(t => (
                      <div key={t} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "#1a2540", border: "1px solid #2a3a55",
                        borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "#e2e8f0"
                      }}>
                        {t}
                        <button onClick={() => removeTicker(t)} style={{
                          background: "none", border: "none", color: "#ff4d6d",
                          cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2
                        }}>×</button>
                      </div>
                    ))}
                    {watchlist.length === 0 && (
                      <span style={{ fontSize: 11, color: "#475569" }}>No tickers — add one below</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={e => setTickerInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && addTicker()}
                      placeholder="Add ticker e.g. NVDA"
                      maxLength={5}
                      style={{
                        flex: 1, background: "#0f1520", border: "1px solid #2a3a55",
                        borderRadius: 6, padding: "8px 12px", color: "#e2e8f0",
                        fontFamily: "'Space Mono', monospace", fontSize: 11, outline: "none"
                      }}
                    />
                    <button className="btn btn-primary" onClick={addTicker} style={{ padding: "8px 14px" }}>
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
                  <span className="config-label">🔔 Sound Alert</span>
                  <button className={`toggle ${alertSound ? "on" : ""}`} onClick={() => setAlertSound(v => !v)} />
                </div>
                <div className="config-row">
                  <span className="config-label">📧 Email Alerts</span>
                  <button className={`toggle ${alertEmail ? "on" : ""}`} onClick={() => setAlertEmail(v => !v)} />
                </div>
                <div className="config-row">
                  <span className="config-label">📱 Push Notifications</span>
                  <button className={`toggle ${alertPush ? "on" : ""}`} onClick={() => setAlertPush(v => !v)} />
                </div>
                <div className="config-row">
                  <span className="config-label">Current ORB Window</span>
                  <span className="config-value">{orbWindow} min</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Volume Threshold</span>
                  <span className="config-value">{volFilter}%</span>
                </div>
                <button className="btn btn-primary" onClick={saveConfig} style={{ marginTop: 20, width: "100%" }}>
                  {saveFlash ? "✓ Saved!" : "Save Configuration"}
                </button>
                <button className="btn btn-ghost" onClick={resetConfig} style={{ marginTop: 8, width: "100%" }}>
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
