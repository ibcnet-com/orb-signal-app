const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let src = fs.readFileSync(filePath, 'utf8');

const OLD = `async function fetchCandles(ticker) {
  const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=1m&range=1d&includePrePost=false\`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(\`Yahoo returned \${res.status} for \${ticker}\`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(\`No data for \${ticker}\`);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return result.timestamp.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i],
    low: low[i], close: close[i], volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);
}`;

const NEW = `// Yahoo Finance crumb/cookie auth (required since 2024)
let yfCookie = null;
let yfCrumb  = null;

async function refreshYahooCrumb() {
  try {
    const r1 = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const setCookie = r1.headers.get("set-cookie") || "";
    if (setCookie) yfCookie = setCookie.split(";")[0];

    const r2 = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": yfCookie || "",
      }
    });
    const crumb = await r2.text();
    if (crumb && crumb.length > 0 && !crumb.includes("<")) {
      yfCrumb = crumb.trim();
      console.log("Yahoo crumb refreshed:", yfCrumb.substring(0, 8) + "...");
    }
  } catch(e) {
    console.error("Yahoo crumb refresh failed:", e.message);
  }
}

function yahooHeaders() {
  const h = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://finance.yahoo.com/",
    "Origin": "https://finance.yahoo.com",
  };
  if (yfCookie) h["Cookie"] = yfCookie;
  return h;
}

async function fetchYahooChart(ticker) {
  const crumbParam = yfCrumb ? \`&crumb=\${encodeURIComponent(yfCrumb)}\` : "";
  const url = \`https://query2.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=1m&range=1d&includePrePost=false\${crumbParam}\`;
  const res = await fetch(url, { headers: yahooHeaders() });
  if (res.status === 401 || res.status === 403) {
    await refreshYahooCrumb();
    const crumbParam2 = yfCrumb ? \`&crumb=\${encodeURIComponent(yfCrumb)}\` : "";
    const url2 = \`https://query2.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=1m&range=1d&includePrePost=false\${crumbParam2}\`;
    const res2 = await fetch(url2, { headers: yahooHeaders() });
    if (!res2.ok) throw new Error(\`Yahoo \${res2.status} for \${ticker}\`);
    return res2.json();
  }
  if (!res.ok) throw new Error(\`Yahoo \${res.status} for \${ticker}\`);
  return res.json();
}

async function fetchCandles(ticker) {
  if (!yfCrumb) await refreshYahooCrumb();
  const json   = await fetchYahooChart(ticker);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(\`No data for \${ticker}\`);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return result.timestamp.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i],
    low: low[i], close: close[i], volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);
}`;

if (src.includes(OLD)) {
    src = src.replace(OLD, NEW);
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('✓ server.js patched with Yahoo crumb auth');
} else {
    console.log('✗ Could not find fetchCandles - checking...');
    const idx = src.indexOf('async function fetchCandles');
    console.log('fetchCandles found at char:', idx);
    if (idx >= 0) console.log('Context:', src.substring(idx, idx + 200));
}
