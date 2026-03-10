/**
 * brokers/index.js
 * Broker selector — change BROKER in .env to switch providers.
 * Supported: "alpaca" | "schwab" | "fidelity"
 */

import { AlpacaBroker }   from "./alpaca.js";
import { SchwabBroker }   from "./schwab.js";
import { FidelityBroker } from "./fidelity.js";

const BROKER = process.env.BROKER || "alpaca";
const MODE   = process.env.ALPACA_MODE || "paper";

const configs = {
  alpaca:   { apiKey: process.env.ALPACA_API_KEY, apiSecret: process.env.ALPACA_API_SECRET, mode: MODE },
  schwab:   { apiKey: process.env.SCHWAB_API_KEY,  apiSecret: process.env.SCHWAB_API_SECRET },
  fidelity: { apiKey: process.env.FIDELITY_API_KEY, apiSecret: process.env.FIDELITY_API_SECRET },
};

const brokers = { alpaca: AlpacaBroker, schwab: SchwabBroker, fidelity: FidelityBroker };

if (!brokers[BROKER]) throw new Error(`Unknown broker "${BROKER}". Valid: ${Object.keys(brokers).join(", ")}`);

export const broker      = new brokers[BROKER](configs[BROKER]);
export const BROKER_NAME = BROKER;
export const BROKER_MODE = MODE;
