## v2.8.0 — 2026-03-19
- Alpaca Paper Trading: bracket orders, account bar, auto-sync fills
- Algorithm Intelligence: AI Rules tracker, Confidence Accuracy, Signal Matrix, Ticker DNA
- Signal auto-removal: price reversal, 3:30pm cutoff, no momentum triggers
- Market hours check with Force Override button
- Smart report title: Today's vs Yesterday's based on market close time
- What's New cards moved to left column in How It Works
- Mobile nav buttons +20% for iPhone 17 Pro
- Signal stale timer (configurable, default 20 min)
- King David's Reverse Report row-by-row analysis
- Performance Analytics: 5 views including Edge Over Time chart
- PostgreSQL history: ai_postmortem_logs, signal_events, confidence_accuracy tables
- Footer version updated to v2.8.0

# ORBsignal Changelog

## v2.6.0 — 2026-03-17
- Added PostgreSQL persistent storage for all daily reports
- Added Performance Analytics tab with 5 views:
  - Signal Quality Tracker (win rate by High/Med/Low confidence)
  - Time-of-Day Analysis (best entry windows)
  - Ticker Scorecard (which tickers win most)
  - ORB Range Analysis (validates 0.2% range filter)
  - Edge Over Time chart (ORB vs Reverse history)
- Added King David's Reverse Report (row-by-row flipped signal analysis)
- Rewrote How It Works page to accurately reflect current app features
- Added What's New feature cards section
- Updated Aim vs Actual stats cards
- Updated version to v2.6.0

## v2.5.0 — 2026-03-16
- Added Reverse Report to Trade Log tab
- Shows flipped signals with P&L comparison and edge summary

## v2.4.14 — 2026-03-16
- Switched AI Postmortem from Anthropic to Groq (free tier, no CC required)
- Model: llama-3.3-70b-versatile

## v2.4.12 — 2026-03-16
- Switched back to Yahoo Finance for candles and quotes
- Uses browser-like headers for Railway compatibility

## v2.4.11 — 2026-03-16
- Switched Polygon.io to free-tier prev close endpoint for quotes/futures

## v2.4.10 — 2026-03-16
- Complete server.js rewrite to fix encoding corruption
- Polygon.io fully integrated for candles, quotes, futures
- AI Postmortem proxy route added to backend

## v2.4.7 — 2026-03-16
- Added /ai-postmortem backend proxy route (fixes CORS)
- Anthropic API called server-side

## v2.4.6 — 2026-03-16
- Fixed React.useEffect scope in TradeLogTab
- Fixed autoAnalyze scope using useEffect trigger

## v2.4.5 — 2026-03-15
- Fixed React.useState references in TradeLogTab
- Removed stale nettest route from server.js

## v2.4.3 — 2026-03-15
- Switched data source from Yahoo Finance to Polygon.io
- Removed yahoo-finance2 dependency (incompatible with Node 18)

## v2.4.2 — 2026-03-15
- Added Yahoo Finance crumb/cookie authentication
- Attempted fix for Railway IP block (later switched to Polygon)

## v2.4.1 — 2026-03-15
- Fixed API URL fallback pointing to localhost instead of Railway

## v2.4.0 — 2026-03-15
- Added AI Postmortem feature (auto-triggers on yesterday report load)
- Added Yesterday's ORB Report tab
- Added My Performance charts (P&L, Win Rate, By Ticker)
- Extracted TradeLogTab as proper top-level component

## v2.3.0 — 2026-03-12
- Fixed TradeLogTab crash (hooks in IIFE not allowed)
- Added performance chart section
- Added Yesterday's ORB report (initial version)

## v2.2.0 — 2026-03-11
- Fixed bare & in JSX
- Added annotated Mag 7 signal simulator with real data

## v2.1.0 — 2026-03-11
- Added trade logging and close trade modal
- Added CSV export
- Added trade stats (win rate, P&L, record)

## v2.0.0 — 2026-03-11
- Full rebuild with dark theme UI
- Added confidence scoring system (8 factors, max 97%)
- Added futures market tab
- Added pre-market gap analysis
- Added morning brief (4AM-9:45AM ET)
- Added economic calendar (FOMC, CPI, NFP)
- Added news check per ticker
- Added signal sound alerts

## v1.0.0 — Initial Release
- Basic ORB breakout detection
- Express proxy server
- React frontend
- Yahoo Finance data source
