const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let src = fs.readFileSync(filePath, 'utf8');

// 1. Add yahoo-finance2 import at the top (after existing imports)
const OLD_IMPORT = `import express from "express";
import cors from "cors";`;

const NEW_IMPORT = `import express from "express";
import cors from "cors";
import yahooFinance from "yahoo-finance2";`;

// 2. Replace the entire crumb block + fetchCandles with yahoo-finance2 version
const OLD_FETCH = src.match(/\/\/ Yahoo Finance crumb[\s\S]*?^async function fetchCandles[\s\S]*?^}/m);

// Find fetchCandles start/end more reliably
const crumbStart = src.indexOf('// Yahoo Finance crumb');
const fetchEnd   = src.indexOf('\nfunction detectORB');

const oldBlock = src.substring(crumbStart, fetchEnd);

const NEW_FETCH = `async function fetchCandles(ticker) {
  const data = await yahooFinance.chart(ticker, {
    interval: "1m",
    range: "1d",
    includePrePost: false,
  });
  const quotes = data?.quotes || [];
  return quotes
    .filter(q => q.open != null && q.close != null)
    .map(q => ({
      time:   new Date(q.date),
      open:   q.open,
      high:   q.high,
      low:    q.low,
      close:  q.close,
      volume: q.volume || 0,
    }));
}

`;

if (src.includes(OLD_IMPORT)) {
  src = src.replace(OLD_IMPORT, NEW_IMPORT);
  console.log('✓ Added yahoo-finance2 import');
} else {
  console.log('✗ Import anchor not found');
}

if (crumbStart !== -1 && fetchEnd !== -1) {
  src = src.substring(0, crumbStart) + NEW_FETCH + src.substring(fetchEnd + 1);
  console.log('✓ Replaced fetchCandles with yahoo-finance2');
} else {
  console.log('✗ Could not find fetchCandles block. crumbStart:', crumbStart, 'fetchEnd:', fetchEnd);
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('✓ server.js updated');
console.log('Now run: npm install yahoo-finance2 && git add . && git commit -m "v2.4.3 - switch to yahoo-finance2" && git push');
