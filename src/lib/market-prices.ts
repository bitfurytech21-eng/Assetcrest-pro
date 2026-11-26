export type CryptoMarketSymbol =
  | 'USD'
  | 'USDC'
  | 'USDT'
  | 'BTC'
  | 'ETH'
  | 'BNB'
  | 'SOL'
  | 'XRP'
  | 'DOGE';

export type LiveCryptoPricesMap = Record<CryptoMarketSymbol, number>;
export type LiveCryptoChangesMap = Partial<Record<CryptoMarketSymbol, number>>;

type LiveMarketData = {
  prices: LiveCryptoPricesMap;
  changes: LiveCryptoChangesMap;
  updatedAt: string;
  source: 'binance' | 'kraken';
};

const BINANCE_PAIR_TO_SYMBOL: Record<string, Exclude<CryptoMarketSymbol, 'USD' | 'USDC' | 'USDT'>> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  SOLUSDT: 'SOL',
  XRPUSDT: 'XRP',
  DOGEUSDT: 'DOGE',
};

const BINANCE_SYMBOLS_QUERY = encodeURIComponent(JSON.stringify(Object.keys(BINANCE_PAIR_TO_SYMBOL)));
const KRAKEN_PAIR_TO_SYMBOL: Record<string, Exclude<CryptoMarketSymbol, 'USD' | 'USDC' | 'USDT'>> = {
  XXBTZUSD: 'BTC',
  XETHZUSD: 'ETH',
  BNBUSD: 'BNB',
  SOLUSD: 'SOL',
  XXRPZUSD: 'XRP',
  XDGUSD: 'DOGE',
};
const KRAKEN_PAIRS_QUERY = 'XBTUSD,ETHUSD,BNBUSD,SOLUSD,XRPUSD,DOGEUSD';
const REQUIRED_SYMBOLS: CryptoMarketSymbol[] = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'];

let cachedMarket: { expiresAt: number; data: LiveMarketData } | null = null;
let inflightPromise: Promise<LiveMarketData> | null = null;

function completeMarket(
  partialPrices: Partial<LiveCryptoPricesMap>,
  partialChanges: LiveCryptoChangesMap,
  source: LiveMarketData['source'],
): LiveMarketData {
  const prices: Partial<LiveCryptoPricesMap> = {
    USD: 1,
    USDC: 1,
    USDT: 1,
    ...partialPrices,
  };
  for (const symbol of REQUIRED_SYMBOLS) {
    if (!Number.isFinite(prices[symbol]) || (prices[symbol] ?? 0) <= 0) {
      throw new Error('Market provider returned an incomplete price set.');
    }
  }
  return {
    prices: prices as LiveCryptoPricesMap,
    changes: partialChanges,
    updatedAt: new Date().toISOString(),
    source,
  };
}

async function fetchFromBinance(): Promise<LiveMarketData> {
  const response = await fetch(
    'https://api.binance.com/api/v3/ticker/24hr?symbols=' + BINANCE_SYMBOLS_QUERY,
    {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'AssetCrest-MarketData/1.0' },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error('Binance market feed returned HTTP ' + response.status);
  const tickers = await response.json() as Array<{ symbol?: string; lastPrice?: string; priceChangePercent?: string }>;
  if (!Array.isArray(tickers)) throw new Error('Unexpected Binance market feed response.');

  const prices: Partial<LiveCryptoPricesMap> = {};
  const changes: LiveCryptoChangesMap = {};
  for (const entry of tickers) {
    const symbol = BINANCE_PAIR_TO_SYMBOL[String(entry.symbol || '').toUpperCase()];
    const price = Number(entry.lastPrice);
    const change = Number(entry.priceChangePercent);
    if (!symbol) continue;
    if (Number.isFinite(price) && price > 0) prices[symbol] = price;
    if (Number.isFinite(change)) changes[symbol] = change;
  }
  return completeMarket(prices, changes, 'binance');
}

async function fetchFromKraken(): Promise<LiveMarketData> {
  const response = await fetch(
    'https://api.kraken.com/0/public/Ticker?pair=' + KRAKEN_PAIRS_QUERY,
    {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'AssetCrest-MarketData/1.0' },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error('Kraken market feed returned HTTP ' + response.status);
  const payload = await response.json() as {
    error?: string[];
    result?: Record<string, { c?: string[]; o?: string }>;
  };
  if (payload.error?.length || !payload.result) throw new Error('Unexpected Kraken market feed response.');

  const prices: Partial<LiveCryptoPricesMap> = {};
  const changes: LiveCryptoChangesMap = {};
  for (const [pair, ticker] of Object.entries(payload.result)) {
    const symbol = KRAKEN_PAIR_TO_SYMBOL[pair];
    if (!symbol) continue;
    const price = Number(ticker.c?.[0]);
    const open = Number(ticker.o);
    if (Number.isFinite(price) && price > 0) prices[symbol] = price;
    if (Number.isFinite(price) && Number.isFinite(open) && open > 0) {
      changes[symbol] = ((price - open) / open) * 100;
    }
  }
  return completeMarket(prices, changes, 'kraken');
}

export async function fetchLiveCryptoPricesUsd(): Promise<LiveMarketData> {
  if (cachedMarket && cachedMarket.expiresAt > Date.now()) return cachedMarket.data;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    let data: LiveMarketData;
    try {
      data = await fetchFromBinance();
    } catch (binanceError) {
      console.warn('[AssetCrest] Binance market feed unavailable; trying Kraken:', binanceError);
      try {
        data = await fetchFromKraken();
      } catch (krakenError) {
        console.error('[AssetCrest] Both live market feeds failed:', krakenError);
        throw new Error('Live market data is temporarily unavailable from both exchange providers.');
      }
    }
    cachedMarket = { data, expiresAt: Date.now() + 5000 };
    return data;
  })().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}
