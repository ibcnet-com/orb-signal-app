# ORBsignal Changelog

All notable changes to ORBsignal are documented here.

---

## v1.6.0 — 2026-03-10
- Added FOMC, CPI, and NFP economic calendar (2025–2026) with warning banner on high-impact days
- Added Yahoo Finance news check per ticker — flags earnings, FDA, SEC, lawsuits, upgrades/downgrades
- News and calendar warnings shown as badges on each signal card

## v1.5.0 — 2026-03-10
- Added ORB range size check (⚠ flags tiny range < 0.2%)
- Added SPY trend check (⚠ flags sideways market)
- Rule check badges displayed on every signal card
- Fixed signal countdown timer — now persists across scans instead of resetting every 60s

## v1.4.0 — 2026-03-10
- Redesigned signal cards with full trade plan: entry, stop loss, position size, two targets, R/R ratios
- Position size calculated from $1,000 max risk
- Target 1: 2:1 fixed R/R · Target 2: 2× ORB range extension
- Added ▲ BUY / ▼ SELL action button per signal
- Added countdown timer showing how long since signal fired
- Added late entry warning after 11:00 AM

## v1.3.0 — 2026-03-09
- Added sound alerts using Web Audio API (no files needed)
- Three rising tones for new breakout signal
- Soft chime for watching/no-breakout scans
- Sound only fires once per ticker per session (not on every rescan)
- Mute/unmute toggle in header and Alert Config tab
- Preview button in Alert Config

## v1.2.0 — 2026-03-09
- Added Trade Log tab with persistent SQLite database on Railway
- Stats bar: win rate, total P&L, trade count (W/L)
- + Log button on signal cards
- Close trade modal with exit price and win/loss outcome
- Export to CSV button
- Auto-refreshes trade log every 60s

## v1.1.0 — 2026-03-08
- Added broker adapter layer (Alpaca, Schwab stub, Fidelity stub)
- Server routes: /broker, /account, /positions, /orders, /trade, /order/:id
- scaffold.js created — single script to bootstrap all project files

## v1.0.0 — 2026-03-07
- Initial release
- Live Signals tab with Yahoo Finance data, ORB breakout detection
- How It Works tab with ORB chart, step-by-step rules, signal simulator
- Alert Config tab with watchlist, ORB window slider, volume filter
- PWA support for iPhone via Safari "Add to Home Screen"
- Deployed: Vercel (frontend) + Railway (backend)
