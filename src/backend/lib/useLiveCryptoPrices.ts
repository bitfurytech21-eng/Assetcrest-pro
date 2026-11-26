'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CryptoAssetSymbol } from './assetcrest-store';

export type ClientCryptoPriceMap = Partial<Record<CryptoAssetSymbol, number>>;

const BASE_STABLE_PRICES: ClientCryptoPriceMap = {
  USD: 1,
  USDC: 1,
  USDT: 1,
};

export function useLiveCryptoPrices(pollIntervalMs = 30000) {
  const [prices, setPrices] = useState<ClientCryptoPriceMap>(BASE_STABLE_PRICES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/market-data/prices', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Live exchange prices are temporarily unavailable.');
      }
      const data = (await response.json()) as {
        prices?: Record<string, number>;
        updatedAt?: string;
      };
      if (!data.prices || typeof data.prices !== 'object') {
        throw new Error('Invalid price feed response.');
      }
      setPrices({
        USD: 1,
        USDC: Number(data.prices.USDC) > 0 ? Number(data.prices.USDC) : 1,
        USDT: Number(data.prices.USDT) > 0 ? Number(data.prices.USDT) : 1,
        BTC: Number(data.prices.BTC) > 0 ? Number(data.prices.BTC) : undefined,
        ETH: Number(data.prices.ETH) > 0 ? Number(data.prices.ETH) : undefined,
        BNB: Number(data.prices.BNB) > 0 ? Number(data.prices.BNB) : undefined,
        SOL: Number(data.prices.SOL) > 0 ? Number(data.prices.SOL) : undefined,
        XRP: Number(data.prices.XRP) > 0 ? Number(data.prices.XRP) : undefined,
      });
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Unable to load live crypto prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, pollIntervalMs]);

  return { prices, loading, error, updatedAt, refresh };
}
