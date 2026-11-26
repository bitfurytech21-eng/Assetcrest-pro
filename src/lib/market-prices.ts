export type CryptoMarketSymbol =
  | 'USD'
  | 'USDC'
  | 'USDT'
  | 'BTC'
  | 'ETH'
  | 'BNB'
  | 'SOL'
  | 'XRP';

export type LiveCryptoPricesMap = Record<CryptoMarketSymbol, number>;

const BINANCE_PAIR_TO_SYMBOL: Record<string, Exclude<CryptoMarketSymbol, 'USD' | 'USDC' | 'USDT'>> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  SOLUSDT: 'SOL',
  XRPUSDT: 'XRP',
};

const BINANCE_SYMBOLS_QUERY = encodeURIComponent(
  JSON.stringify(Object.keys(BINANCE_PAIR_TO_SYMBOL))
);

let cachedPrices: { expiresAt: number; prices: LiveCryptoPricesMap; updatedAt: string } | null = null;
let inflightPromise: Promise<{ prices: LiveCryptoPricesMap; updatedAt: string }> | null = null;

export async function fetchLiveCryptoPricesUsd(): Promise<{
  prices: LiveCryptoPricesMap;
  updatedAt: string;
}> {
  if (cachedPrices && cachedPrices.expiresAt > Date.now()) {
    return { prices: cachedPrices.prices, updatedAt: cachedPrices.updatedAt };
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbols=${BINANCE_SYMBOLS_QUERY}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AssetCrest-MarketData/1.0',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      throw new Error('Live exchange price feed is temporarily unavailable.');
    }

    const tickers = (await response.json()) as Array<{ symbol?: string; price?: string }>;
    if (!Array.isArray(tickers)) {
      throw new Error('Unexpected response from live exchange price feed.');
    }

    const prices: Partial<LiveCryptoPricesMap> = {
      USD: 1,
      USDC: 1,
      USDT: 1,
    };

    for (const entry of tickers) {
      const pair = String(entry.symbol || '').toUpperCase();
      const targetSym = BINANCE_PAIR_TO_SYMBOL[pair];
      const numericPrice = Number(entry.price);
      if (targetSym && Number.isFinite(numericPrice) && numericPrice > 0) {
        prices[targetSym] = numericPrice;
      }
    }

    const requiredSymbols: CryptoMarketSymbol[] = [
      'USD',
      'USDC',
      'USDT',
      'BTC',
      'ETH',
      'BNB',
      'SOL',
      'XRP',
    ];
    for (const sym of requiredSymbols) {
      if (!Number.isFinite(prices[sym]) || (prices[sym] ?? 0) <= 0) {
        throw new Error(`Missing live market price for ${sym}.`);
      }
    }

    const updatedAt = new Date().toISOString();
    const resolved = prices as LiveCryptoPricesMap;
    cachedPrices = {
      prices: resolved,
      updatedAt,
      expiresAt: Date.now() + 5000,
    };
    return { prices: resolved, updatedAt };
  })().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}
