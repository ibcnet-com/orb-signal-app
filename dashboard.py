"""
dashboard.py — Local web dashboard for paper_broker.py

Run:
    pip install yfinance flask
    python dashboard.py

Then open: http://localhost:5000
"""

import threading
import time
from flask import Flask, jsonify, render_template_string, request
from paper_broker import PaperBroker

app = Flask(__name__)
broker = PaperBroker(starting_cash=100_000)

# ---------------------------------------------------------------------------
# Background thread: check pending orders every 30s
# ---------------------------------------------------------------------------

def _pending_checker():
    while True:
        time.sleep(30)
        try:
            broker.check_pending_orders()
        except Exception:
            pass

threading.Thread(target=_pending_checker, daemon=True).start()

# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/api/portfolio")
def api_portfolio():
    return jsonify(broker.portfolio())

@app.route("/api/history")
def api_history():
    return jsonify(broker.history())

@app.route("/api/pending")
def api_pending():
    return jsonify(broker.pending())

@app.route("/api/price/<ticker>")
def api_price(ticker):
    try:
        from paper_broker import _get_price
        return jsonify({"ticker": ticker.upper(), "price": _get_price(ticker)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/order", methods=["POST"])
def api_order():
    data = request.json
    action    = data.get("action")       # buy | sell
    ticker    = data.get("ticker", "")
    qty       = int(data.get("qty", 0))
    order_type = data.get("order_type", "market")
    limit_price = data.get("limit_price")
    stop_price  = data.get("stop_price")

    try:
        if order_type == "market":
            if action == "buy":
                result = broker.buy(ticker, qty)
            else:
                result = broker.sell(ticker, qty)
        elif order_type == "limit":
            result = broker.place_limit_order(action, ticker, qty, float(limit_price))
        elif order_type == "stop":
            result = broker.place_stop_order(action, ticker, qty, float(stop_price))
        else:
            return jsonify({"error": "Unknown order type"}), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/cancel/<order_id>", methods=["POST"])
def api_cancel(order_id):
    ok = broker.cancel_order(order_id)
    return jsonify({"cancelled": ok})

@app.route("/api/reset", methods=["POST"])
def api_reset():
    data = request.json or {}
    cash = data.get("cash", 100_000)
    broker.reset(starting_cash=float(cash))
    return jsonify({"ok": True})

@app.route("/api/add_funds", methods=["POST"])
def api_add_funds():
    data = request.json or {}
    amount = float(data.get("amount", 0))
    if amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400
    broker.cash += amount
    broker.starting_cash += amount  # keep P&L baseline consistent
    broker._save()
    return jsonify({"ok": True, "cash": round(broker.cash, 2)})

# ---------------------------------------------------------------------------
# Dashboard HTML (single-file, no external dependencies except CDN)
# ---------------------------------------------------------------------------

HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Paper Trader</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0c0f0e;
    --surface:  #131716;
    --border:   #1f2624;
    --muted:    #3a4440;
    --text:     #d4e0db;
    --dim:      #6b8078;
    --green:    #00e5a0;
    --red:      #ff4d6a;
    --yellow:   #f5c842;
    --blue:     #4db8ff;
    --mono:     'IBM Plex Mono', monospace;
    --sans:     'IBM Plex Sans', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: 14px;
    min-height: 100vh;
  }

  /* ── Layout ── */
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 28px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .logo {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: var(--green);
  }
  .logo span { color: var(--dim); font-weight: 400; }
  .header-right { display: flex; gap: 12px; align-items: center; }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 28px;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
  }
  .left-col { display: flex; flex-direction: column; gap: 20px; }
  .right-col { display: flex; flex-direction: column; gap: 20px; }

  /* ── Cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--dim);
  }
  .card-body { padding: 18px; }

  /* ── Stats bar ── */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .stat {
    background: var(--surface);
    padding: 16px 20px;
  }
  .stat-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 6px;
  }
  .stat-value {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 600;
  }
  .stat-sub {
    font-size: 11px;
    color: var(--dim);
    margin-top: 2px;
    font-family: var(--mono);
  }

  /* ── Positions table ── */
  table { width: 100%; border-collapse: collapse; }
  thead th {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--dim);
    text-align: right;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
  }
  thead th:first-child { text-align: left; }
  tbody td {
    font-family: var(--mono);
    font-size: 13px;
    padding: 11px 14px;
    text-align: right;
    border-bottom: 1px solid var(--border);
  }
  tbody td:first-child { text-align: left; font-weight: 600; color: var(--blue); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: rgba(255,255,255,0.02); }

  /* ── History ── */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-height: 300px;
    overflow-y: auto;
  }
  .history-item {
    display: grid;
    grid-template-columns: 60px 60px 1fr auto auto;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 12px;
  }
  .history-item:last-child { border-bottom: none; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .badge-buy  { background: rgba(0,229,160,0.15); color: var(--green); }
  .badge-sell { background: rgba(255,77,106,0.15); color: var(--red); }
  .badge-pending { background: rgba(245,200,66,0.15); color: var(--yellow); }
  .badge-limit { background: rgba(77,184,255,0.15); color: var(--blue); }
  .badge-stop  { background: rgba(245,200,66,0.15); color: var(--yellow); }

  /* ── Order form ── */
  .form-group { margin-bottom: 12px; }
  label {
    display: block;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 5px;
  }
  input, select {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--muted);
    border-radius: 4px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, select:focus { border-color: var(--green); }
  select option { background: var(--bg); }

  .btn {
    width: 100%;
    padding: 11px;
    border: none;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn:active { transform: scale(0.98); }
  .btn-buy  { background: var(--green); color: #000; }
  .btn-sell { background: var(--red); color: #fff; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-sm {
    padding: 5px 10px;
    font-size: 11px;
    background: transparent;
    border: 1px solid var(--muted);
    color: var(--dim);
    border-radius: 3px;
    cursor: pointer;
    font-family: var(--mono);
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-sm:hover { border-color: var(--red); color: var(--red); }

  /* ── Price ticker ── */
  .price-display {
    font-family: var(--mono);
    font-size: 28px;
    font-weight: 600;
    color: var(--green);
    text-align: center;
    padding: 8px 0 4px;
    min-height: 44px;
  }
  .price-ticker-label {
    text-align: center;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--dim);
    margin-bottom: 12px;
  }

  /* ── Conditional fields ── */
  .conditional { display: none; }
  .conditional.visible { display: block; }

  /* ── Misc ── */
  .green { color: var(--green); }
  .red   { color: var(--red); }
  .dim   { color: var(--dim); }
  .empty-state {
    text-align: center;
    padding: 28px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 1px;
  }
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--green);
    border-radius: 6px;
    padding: 12px 18px;
    font-family: var(--mono);
    font-size: 12px;
    max-width: 320px;
    transform: translateY(80px);
    opacity: 0;
    transition: all 0.25s ease;
    z-index: 999;
  }
  .toast.show { transform: translateY(0); opacity: 1; }
  .toast.error { border-left-color: var(--red); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 2px; }
</style>
</head>
<body>

<header>
  <div class="logo">PAPER<span>TRADER</span></div>
  <div class="header-right">
    <span id="last-update" class="dim" style="font-family:var(--mono);font-size:11px"></span>
    <button class="btn-sm" onclick="addFunds()" style="border-color:var(--green);color:var(--green)">+ Add Funds</button>
    <button class="btn-sm" onclick="confirmReset()">↺ Reset</button>
  </div>
</header>

<main>
  <div class="left-col">

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat">
        <div class="stat-label">Total Equity</div>
        <div class="stat-value" id="s-equity">—</div>
        <div class="stat-sub" id="s-equity-sub"></div>
      </div>
      <div class="stat">
        <div class="stat-label">Cash</div>
        <div class="stat-value" id="s-cash">—</div>
      </div>
      <div class="stat">
        <div class="stat-label">Market Value</div>
        <div class="stat-value" id="s-mv">—</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total P&amp;L</div>
        <div class="stat-value" id="s-pnl">—</div>
        <div class="stat-sub" id="s-pnl-pct"></div>
      </div>
    </div>

    <!-- Positions -->
    <div class="card">
      <div class="card-header">
        Positions
        <span id="pos-count" class="dim">0</span>
      </div>
      <div id="positions-body">
        <div class="empty-state">NO OPEN POSITIONS</div>
      </div>
    </div>

    <!-- Pending Orders -->
    <div class="card">
      <div class="card-header">
        Pending Orders
        <span id="pending-count" class="dim">0</span>
      </div>
      <div id="pending-body">
        <div class="empty-state">NO PENDING ORDERS</div>
      </div>
    </div>

    <!-- Order History -->
    <div class="card">
      <div class="card-header">Order History</div>
      <div id="history-body" class="history-list">
        <div class="empty-state">NO ORDERS YET</div>
      </div>
    </div>

  </div>

  <div class="right-col">

    <!-- Order form -->
    <div class="card">
      <div class="card-header">Place Order</div>
      <div class="card-body">

        <div class="form-group">
          <label>Ticker</label>
          <input id="f-ticker" type="text" placeholder="AAPL" style="text-transform:uppercase"
                 oninput="this.value=this.value.toUpperCase()" onblur="fetchPreviewPrice()"/>
        </div>

        <div class="price-display" id="preview-price">—</div>
        <div class="price-ticker-label" id="preview-label">enter a ticker above</div>

        <div class="form-group">
          <label>Order Type</label>
          <select id="f-type" onchange="onTypeChange()">
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
        </div>

        <div id="f-limit-group" class="form-group conditional">
          <label>Limit Price ($)</label>
          <input id="f-limit" type="number" step="0.01" placeholder="0.00"/>
        </div>

        <div id="f-stop-group" class="form-group conditional">
          <label>Stop Price ($)</label>
          <input id="f-stop" type="number" step="0.01" placeholder="0.00"/>
        </div>

        <div class="form-group">
          <label>Quantity (shares)</label>
          <input id="f-qty" type="number" min="1" placeholder="1"/>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
          <button class="btn btn-buy"  onclick="submitOrder('buy')">BUY</button>
          <button class="btn btn-sell" onclick="submitOrder('sell')">SELL</button>
        </div>
      </div>
    </div>

    <!-- Quick lookup -->
    <div class="card">
      <div class="card-header">Price Lookup</div>
      <div class="card-body">
        <div class="form-group">
          <label>Ticker</label>
          <div style="display:flex;gap:8px">
            <input id="l-ticker" type="text" placeholder="TSLA" style="text-transform:uppercase"
                   oninput="this.value=this.value.toUpperCase()" onkeydown="if(e.key==='Enter')lookupPrice()"/>
            <button class="btn btn-buy" style="width:auto;padding:0 16px" onclick="lookupPrice()">GO</button>
          </div>
        </div>
        <div class="price-display" id="lookup-price">—</div>
        <div class="price-ticker-label" id="lookup-label"></div>
      </div>
    </div>

  </div>
</main>

<div id="toast" class="toast"></div>

<script>
// ── Utils ────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const fmt = (n, d=2) => n == null ? '—' : Number(n).toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d});
const fmtUSD = n => n == null ? '—' : '$' + fmt(n);

function showToast(msg, error=false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (error ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

function colorClass(n) {
  return n > 0 ? 'green' : n < 0 ? 'red' : 'dim';
}

// ── Portfolio refresh ────────────────────────────────────────────────────

async function refreshPortfolio() {
  let p, hist, pend;
  try {
    [p, hist, pend] = await Promise.all([
      fetch('/api/portfolio').then(r=>r.json()),
      fetch('/api/history').then(r=>r.json()),
      fetch('/api/pending').then(r=>r.json()),
    ]);
  } catch(e) { return; }

  // Stats
  $('s-equity').textContent = fmtUSD(p.total_equity);
  $('s-equity').className = 'stat-value';
  $('s-cash').textContent  = fmtUSD(p.cash);
  $('s-mv').textContent    = fmtUSD(p.market_value);

  const pnl = p.total_pnl;
  $('s-pnl').textContent = (pnl >= 0 ? '+' : '') + fmtUSD(pnl);
  $('s-pnl').className = 'stat-value ' + colorClass(pnl);
  $('s-pnl-pct').textContent = (pnl >= 0 ? '+' : '') + fmt(p.total_pnl_pct) + '%';
  $('s-pnl-pct').className = 'stat-sub ' + colorClass(pnl);

  $('last-update').textContent = 'updated ' + new Date().toLocaleTimeString();

  // Positions
  $('pos-count').textContent = p.positions.length;
  if (p.positions.length === 0) {
    $('positions-body').innerHTML = '<div class="empty-state">NO OPEN POSITIONS</div>';
  } else {
    let html = `<table>
      <thead><tr>
        <th>Ticker</th><th>Qty</th><th>Avg Cost</th><th>Price</th><th>Mkt Val</th><th>P&amp;L</th><th>P&amp;L %</th>
      </tr></thead><tbody>`;
    for (const pos of p.positions) {
      const c = colorClass(pos.unrealized_pnl);
      const sign = pos.unrealized_pnl >= 0 ? '+' : '';
      html += `<tr>
        <td>${pos.ticker}</td>
        <td>${pos.qty}</td>
        <td>${fmtUSD(pos.avg_cost)}</td>
        <td>${fmtUSD(pos.current_price)}</td>
        <td>${fmtUSD(pos.market_value)}</td>
        <td class="${c}">${sign}${fmtUSD(pos.unrealized_pnl)}</td>
        <td class="${c}">${sign}${fmt(pos.unrealized_pnl_pct)}%</td>
      </tr>`;
    }
    html += '</tbody></table>';
    $('positions-body').innerHTML = html;
  }

  // Pending orders
  $('pending-count').textContent = pend.length;
  if (pend.length === 0) {
    $('pending-body').innerHTML = '<div class="empty-state">NO PENDING ORDERS</div>';
  } else {
    let html = `<table>
      <thead><tr>
        <th>ID</th><th>Type</th><th>Action</th><th>Ticker</th><th>Qty</th><th>Price</th><th></th>
      </tr></thead><tbody>`;
    for (const o of pend) {
      const priceLabel = o.limit_price != null ? fmtUSD(o.limit_price) : fmtUSD(o.stop_price);
      const actionBadge = `<span class="badge badge-${o.action}">${o.action.toUpperCase()}</span>`;
      const typeBadge   = `<span class="badge badge-${o.type}">${o.type.toUpperCase()}</span>`;
      html += `<tr>
        <td style="text-align:left;font-family:var(--mono);font-size:11px;color:var(--dim)">${o.id}</td>
        <td style="text-align:left">${typeBadge}</td>
        <td style="text-align:left">${actionBadge}</td>
        <td style="text-align:left;color:var(--blue);font-weight:600">${o.ticker}</td>
        <td>${o.qty}</td>
        <td>${priceLabel}</td>
        <td><button class="btn-sm" onclick="cancelOrder('${o.id}')">✕</button></td>
      </tr>`;
    }
    html += '</tbody></table>';
    $('pending-body').innerHTML = html;
  }

  // History (most recent first)
  const rev = [...hist].reverse();
  if (rev.length === 0) {
    $('history-body').innerHTML = '<div class="empty-state">NO ORDERS YET</div>';
  } else {
    $('history-body').innerHTML = rev.map(o => {
      const actionBadge = `<span class="badge badge-${o.action}">${o.action.toUpperCase()}</span>`;
      const typeLabel = o.type !== 'market' ? `<span class="badge badge-${o.type}">${o.type}</span>` : '';
      const ts = o.timestamp ? o.timestamp.split(' ')[1] : '';
      return `<div class="history-item">
        ${actionBadge}
        <span style="color:var(--blue);font-weight:600">${o.ticker}</span>
        <span class="dim">${o.qty} @ ${fmtUSD(o.price)} ${typeLabel}</span>
        <span>${fmtUSD(o.total)}</span>
        <span class="dim" style="font-size:10px">${ts}</span>
      </div>`;
    }).join('');
  }
}

// ── Order form ───────────────────────────────────────────────────────────

function onTypeChange() {
  const t = $('f-type').value;
  $('f-limit-group').classList.toggle('visible', t === 'limit');
  $('f-stop-group').classList.toggle('visible', t === 'stop');
}

let previewTimer;
async function fetchPreviewPrice() {
  const ticker = $('f-ticker').value.trim();
  if (!ticker) { $('preview-price').textContent = '—'; $('preview-label').textContent = 'enter a ticker above'; return; }
  $('preview-price').textContent = '…';
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    const r = await fetch(`/api/price/${ticker}`).then(x=>x.json());
    if (r.price) {
      $('preview-price').textContent = fmtUSD(r.price);
      $('preview-label').className = 'price-ticker-label green';
      $('preview-label').textContent = ticker;
    } else {
      $('preview-price').textContent = '—';
      $('preview-label').textContent = r.error || 'not found';
    }
  }, 400);
}

async function submitOrder(action) {
  const ticker = $('f-ticker').value.trim();
  const qty    = parseInt($('f-qty').value) || 0;
  const otype  = $('f-type').value;
  const limit  = parseFloat($('f-limit').value) || null;
  const stop   = parseFloat($('f-stop').value) || null;

  if (!ticker || qty <= 0) { showToast('Enter a ticker and quantity', true); return; }

  const body = { action, ticker, qty, order_type: otype };
  if (otype === 'limit') body.limit_price = limit;
  if (otype === 'stop')  body.stop_price  = stop;

  const r = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(x=>x.json());

  if (r.error) {
    showToast('✗ ' + r.error, true);
  } else {
    const msg = r.status === 'filled'
      ? `✓ ${action.toUpperCase()} ${qty} ${ticker} @ ${fmtUSD(r.price)}`
      : `✓ ${otype} order placed — ${action.toUpperCase()} ${qty} ${ticker}`;
    showToast(msg);
    $('f-ticker').value = '';
    $('f-qty').value = '';
    $('preview-price').textContent = '—';
    $('preview-label').textContent = 'enter a ticker above';
    refreshPortfolio();
  }
}

async function cancelOrder(id) {
  const r = await fetch(`/api/cancel/${id}`, { method: 'POST' }).then(x=>x.json());
  if (r.cancelled) { showToast('Order cancelled'); refreshPortfolio(); }
  else showToast('Could not cancel order', true);
}

// ── Price lookup ─────────────────────────────────────────────────────────

async function lookupPrice() {
  const ticker = $('l-ticker').value.trim();
  if (!ticker) return;
  $('lookup-price').textContent = '…';
  const r = await fetch(`/api/price/${ticker}`).then(x=>x.json());
  if (r.price) {
    $('lookup-price').textContent = fmtUSD(r.price);
    $('lookup-label').textContent = ticker;
    $('lookup-label').className = 'price-ticker-label green';
  } else {
    $('lookup-price').textContent = '—';
    $('lookup-label').textContent = r.error || 'not found';
  }
}

document.getElementById('l-ticker').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupPrice();
});

// ── Add Funds ─────────────────────────────────────────────────────────────

async function addFunds() {
  const amount = prompt('Add cash to portfolio ($):', '10000');
  if (amount === null) return;
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) { showToast('Enter a valid amount', true); return; }
  const r = await fetch('/api/add_funds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: n }),
  }).then(x=>x.json());
  if (r.error) { showToast('✗ ' + r.error, true); return; }
  showToast(`✓ Added $${n.toLocaleString()} — new cash: ${fmtUSD(r.cash)}`);
  refreshPortfolio();
}

// ── Reset ────────────────────────────────────────────────────────────────

async function confirmReset() {
  if (!confirm('Reset portfolio? All positions and history will be cleared.')) return;
  const cash = prompt('Starting cash ($):', '100000');
  if (cash === null) return;
  await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cash: parseFloat(cash) }),
  });
  showToast('Portfolio reset');
  refreshPortfolio();
}

// ── Init ─────────────────────────────────────────────────────────────────

refreshPortfolio();
setInterval(refreshPortfolio, 15000); // auto-refresh every 15s
</script>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML)


if __name__ == "__main__":
    print("\n  📈  Paper Trader running at http://localhost:5000\n")
    app.run(debug=False, port=5000)
