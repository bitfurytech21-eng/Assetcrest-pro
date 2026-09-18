/**
 * AssetCrest Pro - Live Trading View Terminal
 * Mobile-friendly, static UI aligned with AssetCrest brand colors, typography (Sarabun & Roboto),
 * and institutional tone.
 */

export interface MarketSymbol {
  id: string;
  symbol: string;
  tvSymbol: string;
  name: string;
  category: 'crypto' | 'forex' | 'commodities' | 'stocks';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  precision: number;
}

export const SUPPORTED_MARKETS: MarketSymbol[] = [
  {
    id: 'BTCUSDT',
    symbol: 'BTC/USDT',
    tvSymbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    category: 'crypto',
    price: 64850.25,
    change24h: 3.42,
    high24h: 65920.00,
    low24h: 63140.50,
    volume24h: '28.45B',
    precision: 2,
  },
  {
    id: 'ETHUSDT',
    symbol: 'ETH/USDT',
    tvSymbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    category: 'crypto',
    price: 3480.80,
    change24h: 4.15,
    high24h: 3560.00,
    low24h: 3320.10,
    volume24h: '14.20B',
    precision: 2,
  },
  {
    id: 'SOLUSDT',
    symbol: 'SOL/USDT',
    tvSymbol: 'BINANCE:SOLUSDT',
    name: 'Solana',
    category: 'crypto',
    price: 152.65,
    change24h: 6.84,
    high24h: 158.40,
    low24h: 142.20,
    volume24h: '4.82B',
    precision: 2,
  },
  {
    id: 'BNBUSDT',
    symbol: 'BNB/USDT',
    tvSymbol: 'BINANCE:BNBUSDT',
    name: 'BNB',
    category: 'crypto',
    price: 574.30,
    change24h: 1.95,
    high24h: 585.00,
    low24h: 562.50,
    volume24h: '1.65B',
    precision: 2,
  },
  {
    id: 'XRPUSDT',
    symbol: 'XRP/USDT',
    tvSymbol: 'BINANCE:XRPUSDT',
    name: 'XRP',
    category: 'crypto',
    price: 0.5840,
    change24h: -0.85,
    high24h: 0.6020,
    low24h: 0.5710,
    volume24h: '1.12B',
    precision: 4,
  },
  {
    id: 'DOGEUSDT',
    symbol: 'DOGE/USDT',
    tvSymbol: 'BINANCE:DOGEUSDT',
    name: 'Dogecoin',
    category: 'crypto',
    price: 0.1285,
    change24h: 5.12,
    high24h: 0.1340,
    low24h: 0.1210,
    volume24h: '890M',
    precision: 4,
  },
  {
    id: 'EURUSD',
    symbol: 'EUR/USD',
    tvSymbol: 'FX:EURUSD',
    name: 'Euro / US Dollar',
    category: 'forex',
    price: 1.0865,
    change24h: 0.22,
    high24h: 1.0895,
    low24h: 1.0835,
    volume24h: '98.5B',
    precision: 4,
  },
  {
    id: 'GBPUSD',
    symbol: 'GBP/USD',
    tvSymbol: 'FX:GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'forex',
    price: 1.2940,
    change24h: 0.38,
    high24h: 1.2985,
    low24h: 1.2890,
    volume24h: '64.2B',
    precision: 4,
  },
  {
    id: 'USDJPY',
    symbol: 'USD/JPY',
    tvSymbol: 'FX:USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex',
    price: 155.80,
    change24h: -0.45,
    high24h: 156.40,
    low24h: 155.20,
    volume24h: '82.0B',
    precision: 2,
  },
  {
    id: 'XAUUSD',
    symbol: 'Gold (XAU)',
    tvSymbol: 'OANDA:XAUUSD',
    name: 'Gold / US Dollar',
    category: 'commodities',
    price: 2415.60,
    change24h: 1.15,
    high24h: 2428.00,
    low24h: 2398.50,
    volume24h: '42.1B',
    precision: 2,
  },
  {
    id: 'USOIL',
    symbol: 'WTI Crude',
    tvSymbol: 'TVC:USOIL',
    name: 'Crude Oil WTI',
    category: 'commodities',
    price: 78.40,
    change24h: -1.25,
    high24h: 80.10,
    low24h: 77.80,
    volume24h: '25.6B',
    precision: 2,
  },
  {
    id: 'SPX500',
    symbol: 'S&P 500',
    tvSymbol: 'FOREXCOM:SPXUSD',
    name: 'S&P 500 Index',
    category: 'stocks',
    price: 5580.50,
    change24h: 0.65,
    high24h: 5610.20,
    low24h: 5550.00,
    volume24h: '38.9B',
    precision: 2,
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    tvSymbol: 'NASDAQ:NVDA',
    name: 'NVIDIA Corporation',
    category: 'stocks',
    price: 128.90,
    change24h: 4.80,
    high24h: 132.50,
    low24h: 124.30,
    volume24h: '18.4B',
    precision: 2,
  },
  {
    id: 'AAPL',
    symbol: 'AAPL',
    tvSymbol: 'NASDAQ:AAPL',
    name: 'Apple Inc.',
    category: 'stocks',
    price: 224.50,
    change24h: 1.05,
    high24h: 226.80,
    low24h: 222.10,
    volume24h: '12.3B',
    precision: 2,
  },
];

export function renderTradingPage(selectedSymbolId?: string): string {
  const currentSymbol =
    SUPPORTED_MARKETS.find(
      (m) =>
        m.id.toLowerCase() === (selectedSymbolId || '').toLowerCase() ||
        m.symbol.toLowerCase() === (selectedSymbolId || '').toLowerCase()
    ) || SUPPORTED_MARKETS[0];

  const marketsJson = JSON.stringify(SUPPORTED_MARKETS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${currentSymbol.symbol} - Live Trading View | AssetCrest</title>
  <meta name="description" content="AssetCrest institutional-grade live TradingView terminal. Advanced charting, technical analysis indicators, live order book, and execution.">
  <link rel="icon" type="image/png" href="https://assetcrest.co/wp-content/uploads/2023/07/cropped-assetcrest-favicon-32x32.png">
  
  <!-- AssetCrest Brand Fonts: Sarabun & Roboto -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      /* AssetCrest Exact Palette */
      --ac-coral: #e94d65;
      --ac-coral-hover: #d73c54;
      --ac-coral-glow: rgba(233, 77, 101, 0.28);
      --ac-coral-dim: rgba(233, 77, 101, 0.12);
      
      --ac-navy: #1b4962;
      --ac-navy-light: #245d7d;
      --ac-navy-border: rgba(27, 73, 98, 0.45);
      --ac-navy-glow: rgba(27, 73, 98, 0.3);

      /* Canvas & Dark Surfaces */
      --bg-canvas: #0b131c;
      --bg-panel: #0f1a26;
      --bg-panel-sub: #142232;
      --bg-card: #182b3f;
      --bg-card-hover: #1e354e;

      /* Borders */
      --border-main: rgba(27, 73, 98, 0.5);
      --border-sub: rgba(255, 255, 255, 0.06);
      --border-accent: rgba(233, 77, 101, 0.35);

      /* Typography */
      --text-main: #ffffff;
      --text-muted: #abb8c3;
      --text-dim: #6d8194;

      /* Bullish & Bearish */
      --green: #00d084;
      --green-glow: rgba(0, 208, 132, 0.22);
      --green-dim: rgba(0, 208, 132, 0.12);
      
      --red: #e94d65;
      --red-glow: rgba(233, 77, 101, 0.25);
      --red-dim: rgba(233, 77, 101, 0.12);

      --gold: #fcb900;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-family: 'Sarabun', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      max-width: 100vw;
      overflow-x: hidden;
      letter-spacing: -0.1px;
    }

    .mono {
      font-family: 'Roboto Mono', monospace;
    }

    /* Top Accent Stripe */
    .brand-top-stripe {
      height: 3px;
      background: linear-gradient(90deg, #e94d65 0%, #1b4962 45%, #00d084 100%);
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 102;
    }

    /* Terminal Header: Strict 52px height, perfectly aligned, zero overflow */
    .terminal-header {
      background-color: var(--bg-panel);
      border-bottom: 1px solid var(--border-main);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      height: 52px;
      position: sticky;
      top: 3px;
      z-index: 101;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }

    .logo-img {
      height: 26px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .logo-badge {
      background: var(--ac-coral-dim);
      color: var(--ac-coral);
      font-size: 10px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 4px;
      border: 1px solid rgba(233, 77, 101, 0.35);
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ac-coral);
      box-shadow: 0 0 6px var(--ac-coral);
    }

    /* Market Selector Dropdown Button */
    .market-selector-btn {
      background: var(--bg-panel-sub);
      border: 1px solid var(--ac-navy-border);
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-main);
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }

    .market-selector-btn:hover {
      background: var(--bg-card);
      border-color: var(--ac-coral);
    }

    /* Live Market Stats Header */
    .header-stats {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 9.5px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.4px;
    }

    .stat-value {
      font-size: 12.5px;
      font-weight: 700;
    }

    .price-large {
      font-size: 14.5px;
      font-weight: 800;
    }

    .text-green { color: var(--green); }
    .text-red { color: var(--red); }
    .text-coral { color: var(--ac-coral); }
    .text-navy { color: var(--ac-navy-light); }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn {
      padding: 6px 12px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      border: none;
      font-family: 'Sarabun', sans-serif;
      white-space: nowrap;
      height: 32px;
      line-height: 1;
    }

    .btn-coral {
      background: linear-gradient(135deg, #e94d65 0%, #d83951 100%);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(233, 77, 101, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-coral:hover {
      filter: brightness(1.08);
    }

    .btn-navy {
      background: var(--ac-navy);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .btn-navy:hover {
      background: var(--ac-navy-light);
    }

    .btn-secondary {
      background: var(--bg-panel-sub);
      color: var(--text-main);
      border: 1px solid var(--border-main);
    }
    .btn-secondary:hover {
      background: var(--bg-card);
      border-color: var(--ac-navy-light);
    }

    /* Ticker Tape Bar */
    .ticker-bar {
      height: 40px;
      background: #080e15;
      border-bottom: 1px solid var(--border-main);
      overflow: hidden;
      position: relative;
    }

    /* Quick Asset Chips Bar with Categories */
    .quick-assets-bar {
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-main);
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .quick-assets-bar::-webkit-scrollbar {
      display: none;
    }

    .filter-pill {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--text-muted);
      cursor: pointer;
      background: transparent;
      border: 1px solid transparent;
      flex-shrink: 0;
    }
    .filter-pill.active {
      background: var(--ac-navy);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.15);
    }

    .bar-divider {
      width: 1px;
      height: 16px;
      background: var(--border-main);
      margin: 0 4px;
      flex-shrink: 0;
    }

    .asset-chip {
      padding: 4px 9px;
      border-radius: 5px;
      background: var(--bg-panel-sub);
      border: 1px solid var(--border-main);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }
    .asset-chip:hover {
      background: var(--bg-card);
      color: var(--text-main);
    }
    .asset-chip.active {
      background: var(--ac-coral-dim);
      border-color: var(--ac-coral);
      color: #ffffff;
      box-shadow: 0 2px 6px var(--ac-coral-glow);
    }
    .asset-chip.active .asset-chip-symbol {
      color: var(--ac-coral);
      font-weight: 800;
    }

    /* Mobile Segment View Switcher (Visible only on mobile <= 768px) */
    .mobile-view-tabs {
      display: none;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-main);
      padding: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .mobile-view-tab {
      flex: 1;
      padding: 10px 6px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      font-family: 'Sarabun', sans-serif;
    }
    .mobile-view-tab.active {
      color: var(--ac-coral);
      border-bottom-color: var(--ac-coral);
      background: rgba(233, 77, 101, 0.05);
    }

    /* Main Terminal Layout */
    .terminal-body {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 345px;
      min-height: calc(100vh - 145px);
    }

    /* Chart & Bottom Area */
    .chart-panel-container {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-main);
      background: var(--bg-canvas);
      overflow: hidden;
    }

    .chart-wrapper {
      height: 540px;
      position: relative;
      background: #091017;
      width: 100%;
    }

    /* Bottom Section */
    .bottom-section {
      background: var(--bg-panel);
      border-top: 1px solid var(--border-main);
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .bottom-tabs {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border-main);
      padding: 0 12px;
      background: var(--bg-panel-sub);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .bottom-tabs::-webkit-scrollbar {
      display: none;
    }

    .tab-btn {
      padding: 11px 14px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Sarabun', sans-serif;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      color: var(--ac-coral);
      border-bottom-color: var(--ac-coral);
    }

    .tab-badge {
      background: rgba(255, 255, 255, 0.08);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
      color: var(--text-main);
      font-weight: 700;
    }
    .tab-btn.active .tab-badge {
      background: var(--ac-coral);
      color: #ffffff;
    }

    .tab-content {
      display: none;
      padding: 14px;
      flex: 1;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .tab-content.active {
      display: block;
    }

    /* Tables */
    .table-responsive-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .trading-table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    .trading-table th {
      color: var(--text-muted);
      font-weight: 700;
      padding: 9px 10px;
      border-bottom: 1px solid var(--border-main);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    .trading-table td {
      padding: 10px;
      border-bottom: 1px solid var(--border-sub);
      color: var(--text-main);
      white-space: nowrap;
    }
    .trading-table tr:hover td {
      background: rgba(27, 73, 98, 0.15);
    }

    .side-pill {
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .side-long {
      background: var(--green-dim);
      color: var(--green);
      border: 1px solid rgba(0, 208, 132, 0.3);
    }
    .side-short {
      background: var(--red-dim);
      color: var(--red);
      border: 1px solid rgba(233, 77, 101, 0.3);
    }

    /* Right Sidebar: Execution & Technical Analysis */
    .execution-sidebar {
      background: var(--bg-panel);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .panel-box {
      padding: 16px;
      border-bottom: 1px solid var(--border-main);
    }

    .panel-title {
      font-size: 13.5px;
      font-weight: 800;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .account-balance-pill {
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .account-balance-val {
      color: #ffffff;
      font-weight: 800;
    }

    /* Buy / Sell Direction Switch */
    .side-switch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .side-btn {
      padding: 10px;
      border-radius: 5px;
      font-weight: 800;
      font-size: 12.5px;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: center;
      font-family: 'Sarabun', sans-serif;
    }
    .side-btn-buy {
      background: var(--green-dim);
      color: var(--green);
      border-color: rgba(0, 208, 132, 0.3);
    }
    .side-btn-buy.active {
      background: var(--green);
      color: #0b131c;
      box-shadow: 0 3px 12px var(--green-glow);
    }
    .side-btn-sell {
      background: var(--red-dim);
      color: var(--red);
      border-color: rgba(233, 77, 101, 0.3);
    }
    .side-btn-sell.active {
      background: var(--ac-coral);
      color: #ffffff;
      box-shadow: 0 3px 12px var(--ac-coral-glow);
    }

    /* Order Type Selector */
    .order-type-tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 12px;
      background: var(--bg-panel-sub);
      padding: 3px;
      border-radius: 5px;
      border: 1px solid var(--border-main);
    }
    .order-type-btn {
      flex: 1;
      padding: 6px 6px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 11.5px;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
    }
    .order-type-btn.active {
      background: var(--ac-navy);
      color: #ffffff;
    }

    /* Form Fields */
    .form-group {
      margin-bottom: 11px;
    }
    .form-label {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .form-input {
      width: 100%;
      background: var(--bg-panel-sub);
      border: 1px solid var(--border-main);
      border-radius: 5px;
      padding: 9px 38px 9px 10px;
      color: var(--text-main);
      font-size: 13px;
      font-weight: 600;
      outline: none;
    }
    .form-input:focus {
      border-color: var(--ac-coral);
      box-shadow: 0 0 0 2px var(--ac-coral-dim);
    }
    .input-suffix {
      position: absolute;
      right: 10px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-dim);
    }

    /* Percent Buttons */
    .percent-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin-bottom: 12px;
    }
    .percent-btn {
      background: var(--bg-panel-sub);
      border: 1px solid var(--border-main);
      border-radius: 4px;
      padding: 5px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      text-align: center;
    }
    .percent-btn:hover {
      background: var(--bg-card);
      border-color: var(--ac-coral);
      color: #ffffff;
    }

    /* Leverage Box */
    .leverage-box {
      margin-bottom: 12px;
      background: var(--bg-panel-sub);
      padding: 10px 12px;
      border-radius: 5px;
      border: 1px solid var(--border-main);
    }
    .leverage-header {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--text-muted);
      margin-bottom: 6px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .leverage-val {
      color: var(--gold);
      font-weight: 800;
    }
    .slider {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: var(--bg-card);
      outline: none;
      cursor: pointer;
      accent-color: var(--ac-coral);
    }
    .leverage-presets {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
    }
    .leverage-chip {
      font-size: 10px;
      color: var(--text-dim);
      background: transparent;
      border: none;
      cursor: pointer;
      font-weight: 700;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .leverage-chip:hover {
      color: var(--ac-coral);
    }

    /* Order Summary */
    .summary-box {
      background: var(--bg-panel-sub);
      border-radius: 5px;
      padding: 10px 12px;
      margin-bottom: 12px;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--border-main);
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }
    .summary-val {
      color: var(--text-main);
      font-weight: 700;
    }

    /* Execute Button */
    .execute-btn {
      width: 100%;
      padding: 12px;
      border-radius: 5px;
      font-size: 13.5px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      letter-spacing: 0.2px;
      font-family: 'Sarabun', sans-serif;
    }
    .execute-btn-buy {
      background: linear-gradient(135deg, #00d084 0%, #059669 100%);
      color: #0b131c;
      box-shadow: 0 3px 12px var(--green-glow);
    }
    .execute-btn-sell {
      background: linear-gradient(135deg, #e94d65 0%, #c5334a 100%);
      color: #ffffff;
      box-shadow: 0 3px 12px var(--ac-coral-glow);
    }

    /* Technical Analysis Gauge */
    .ta-gauge-container {
      height: 360px;
      overflow: hidden;
    }

    /* Mobile Sticky Bottom Trading Actions (buy / sell shortcuts) */
    .mobile-bottom-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99;
      background: #0a121a;
      border-top: 1px solid var(--border-main);
      padding: 8px 12px;
      gap: 10px;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);
    }
    .mobile-bottom-bar-btn {
      flex: 1;
      padding: 11px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      font-family: 'Sarabun', sans-serif;
      text-align: center;
    }

    /* Toast */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 90vw;
    }
    .toast {
      background: var(--bg-panel);
      border: 1px solid var(--border-main);
      border-radius: 5px;
      padding: 10px 14px;
      color: white;
      font-size: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
    .toast-success {
      border-left: 4px solid var(--green);
    }
    .toast-error {
      border-left: 4px solid var(--ac-coral);
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 12px;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-main);
      border-radius: 8px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
    }
    .modal-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-main);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-panel-sub);
    }
    .modal-body {
      padding: 16px;
    }

    /* RESPONSIVE MOBILE ADAPTATIONS */
    @media (max-width: 1120px) {
      .terminal-body {
        grid-template-columns: 1fr;
      }
      .header-stats {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .brand-top-stripe {
        height: 2px;
      }
      .terminal-header {
        height: 48px;
        padding: 0 10px;
      }
      .logo-badge {
        display: none; /* Hide LIVE TERMINAL badge on mobile to prevent overflow */
      }
      .logo-img {
        height: 22px;
      }
      .market-selector-btn {
        padding: 5px 8px;
        font-size: 11.5px;
      }
      .header-actions .btn-navy,
      .header-actions .btn-secondary {
        display: none; /* Keep header clean: hide Portal/Website on mobile */
      }
      .header-actions .btn-coral {
        padding: 5px 10px;
        font-size: 11.5px;
        height: 28px;
      }
      .ticker-bar {
        height: 38px;
      }
      .quick-assets-bar {
        padding: 5px 10px;
      }

      /* Enable mobile view switcher */
      .mobile-view-tabs {
        display: flex;
      }

      /* Mobile chart height */
      .chart-wrapper {
        height: 360px;
      }

      /* Mobile views controlled by JS tab switcher */
      .mobile-hide {
        display: none !important;
      }
      .mobile-show {
        display: block !important;
      }

      /* Bottom bar for instant trading execution on mobile */
      .mobile-bottom-bar {
        display: flex;
      }

      body {
        padding-bottom: 56px; /* space for mobile bottom bar */
      }

      .bottom-section {
        border-top: none;
      }
    }
  </style>
</head>
<body>

  <!-- Top Accent Stripe -->
  <div class="brand-top-stripe"></div>

  <!-- Terminal Header: Strict, Clean, Never Overflows -->
  <header class="terminal-header">
    <div class="brand-section">
      <a href="/" class="logo-container" title="AssetCrest Home">
        <img class="logo-img" src="https://assetcrest.co/wp-content/uploads/2024/12/logo-new.png" alt="AssetCrest" onerror="this.onerror=null;this.style.display='none';document.getElementById('fallbackBrand').style.display='inline';">
        <span id="fallbackBrand" style="display:none; font-weight:800; font-size:18px; color:#ffffff;">
          <span style="color:#e94d65;">Asset</span>Crest
        </span>
      </a>

      <span class="logo-badge">
        <span class="live-dot"></span> LIVE
      </span>

      <!-- Market Selector Button -->
      <button id="marketDropdownBtn" class="market-selector-btn" onclick="toggleMarketModal()">
        <span id="activePairDisplay" class="mono">${currentSymbol.symbol}</span>
        <span style="font-size:8px; color:var(--text-dim); margin-left:1px;">▼</span>
      </button>
    </div>

    <!-- Live Market Stats (Desktop) -->
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">Price</span>
        <span id="headerLastPrice" class="stat-value price-large mono text-green">$${currentSymbol.price.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.precision, maximumFractionDigits: currentSymbol.precision })}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h Change</span>
        <span id="header24hChange" class="stat-value mono text-green">+${currentSymbol.change24h}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h High</span>
        <span id="header24hHigh" class="stat-value mono">$${currentSymbol.high24h.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.precision })}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h Low</span>
        <span id="header24hLow" class="stat-value mono">$${currentSymbol.low24h.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.precision })}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h Vol</span>
        <span id="header24hVol" class="stat-value mono">$${currentSymbol.volume24h}</span>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="header-actions">
      <button class="btn btn-coral" onclick="openDepositModal()">
        ⚡ Deposit
      </button>
      <a href="/login" class="btn btn-navy">
        Portal
      </a>
      <a href="/" class="btn btn-secondary" title="Return to Website">
        Home
      </a>
    </div>
  </header>

  <!-- Live TradingView Ticker Tape -->
  <div class="ticker-bar">
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
      {
        "symbols": [
          { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
          { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
          { "proName": "BINANCE:SOLUSDT", "title": "Solana" },
          { "proName": "BINANCE:BNBUSDT", "title": "BNB" },
          { "proName": "BINANCE:XRPUSDT", "title": "XRP" },
          { "proName": "FX:EURUSD", "title": "EUR/USD" },
          { "proName": "FX:GBPUSD", "title": "GBP/USD" },
          { "proName": "OANDA:XAUUSD", "title": "Gold" },
          { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
          { "proName": "NASDAQ:NVDA", "title": "Nvidia" }
        ],
        "showSymbolLogo": true,
        "isTransparent": true,
        "displayMode": "adaptive",
        "colorTheme": "dark",
        "locale": "en"
      }
      </script>
    </div>
  </div>

  <!-- Quick Market Navigation Bar with Category Filters -->
  <div class="quick-assets-bar">
    <button class="filter-pill active" onclick="filterQuickBar('all', this)">All Markets</button>
    <button class="filter-pill" onclick="filterQuickBar('crypto', this)">Crypto</button>
    <button class="filter-pill" onclick="filterQuickBar('forex', this)">Forex</button>
    <button class="filter-pill" onclick="filterQuickBar('commodities', this)">Commodities</button>
    <button class="filter-pill" onclick="filterQuickBar('stocks', this)">Equities</button>
    <div class="bar-divider"></div>
    <div id="quickAssetsContainer" style="display:flex; align-items:center; gap:6px;">
      <!-- Populated by JS -->
    </div>
  </div>

  <!-- Mobile View Switcher Tabs (Only visible on screens <= 768px) -->
  <div class="mobile-view-tabs" id="mobileViewTabs">
    <button class="mobile-view-tab active" onclick="switchMobileView('chart', this)">📊 Chart</button>
    <button class="mobile-view-tab" onclick="switchMobileView('trade', this)">⚡ Place Order</button>
    <button class="mobile-view-tab" onclick="switchMobileView('book', this)">📖 Order Book</button>
    <button class="mobile-view-tab" onclick="switchMobileView('positions', this)">💼 Positions (<span id="mobilePosBadge">0</span>)</button>
  </div>

  <!-- Main Terminal Body -->
  <div class="terminal-body">

    <!-- Left Column: TradingView Advanced Chart & Bottom Tabs -->
    <div class="chart-panel-container" id="chartPanelContainer">
      
      <!-- Chart Area -->
      <div class="chart-wrapper" id="tv_chart_container">
        <div class="tradingview-widget-container" style="height:100%;width:100%">
          <div id="tradingview_chart_element" style="height:100%;width:100%"></div>
        </div>
      </div>

      <!-- Bottom Panel Tabs (Positions, Order Book, Trades, Watchlist) -->
      <div class="bottom-section" id="bottomTabsContainer">
        <div class="bottom-tabs">
          <button class="tab-btn active" onclick="switchBottomTab('positions')">
            Open Positions <span class="tab-badge" id="positionsCountBadge">0</span>
          </button>
          <button class="tab-btn" onclick="switchBottomTab('orderbook')">
            Live Order Book & Trades
          </button>
          <button class="tab-btn" onclick="switchBottomTab('history')">
            Trade History
          </button>
          <button class="tab-btn" onclick="switchBottomTab('markets')">
            All Markets (${SUPPORTED_MARKETS.length})
          </button>
        </div>

        <!-- Tab 1: Positions -->
        <div class="tab-content active" id="tab_positions">
          <div class="table-responsive-wrapper">
            <table class="trading-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Leverage</th>
                  <th>Size (USD)</th>
                  <th>Entry Price</th>
                  <th>Mark Price</th>
                  <th>Liq. Price</th>
                  <th>Margin</th>
                  <th>Unrealized PnL</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="positionsTableBody">
                <tr>
                  <td colspan="10" style="text-align:center; padding: 28px; color: var(--text-dim);">
                    No open positions yet. Use the order ticket to place a trade.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 2: Live Order Book & Trades -->
        <div class="tab-content" id="tab_orderbook">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            <div>
              <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.4px;">
                Order Book Depth (Bids / Asks)
              </div>
              <div class="table-responsive-wrapper">
                <table class="trading-table" style="min-width: 100%; font-size:11px;">
                  <thead>
                    <tr>
                      <th>Price (USDT)</th>
                      <th>Size</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody id="orderBookBody">
                    <!-- Populated by JS -->
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.4px;">
                Market Trades
              </div>
              <div class="table-responsive-wrapper">
                <table class="trading-table" style="min-width: 100%; font-size:11px;">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Price</th>
                      <th>Amount</th>
                      <th>Side</th>
                    </tr>
                  </thead>
                  <tbody id="recentTradesBody">
                    <!-- Populated by JS -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: History -->
        <div class="tab-content" id="tab_history">
          <div class="table-responsive-wrapper">
            <table class="trading-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Size</th>
                  <th>Realized PnL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="historyTableBody">
                <tr>
                  <td colspan="8" style="text-align:center; padding: 28px; color: var(--text-dim);">
                    No trade history records found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 4: All Markets Watchlist -->
        <div class="tab-content" id="tab_markets">
          <div class="table-responsive-wrapper">
            <table class="trading-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Last Price</th>
                  <th>24h Change</th>
                  <th>24h High</th>
                  <th>24h Low</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="allMarketsTableBody">
                <!-- Populated by JS -->
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

    <!-- Right Column: Order Placement Ticket & Technical Analysis -->
    <div class="execution-sidebar" id="executionSidebar">

      <!-- Order Ticket -->
      <div class="panel-box">
        <div class="panel-title">
          <span>Place Order</span>
          <div class="account-balance-pill">
            Avail: <span id="availableBalanceDisplay" class="account-balance-val mono">$10,000.00</span>
          </div>
        </div>

        <!-- Buy / Sell Mode -->
        <div class="side-switch-grid">
          <button id="sideBtnBuy" class="side-btn side-btn-buy active" onclick="setOrderSide('buy')">
            ▲ BUY / LONG
          </button>
          <button id="sideBtnSell" class="side-btn side-btn-sell" onclick="setOrderSide('sell')">
            ▼ SELL / SHORT
          </button>
        </div>

        <!-- Order Type -->
        <div class="order-type-tabs">
          <button id="orderTypeMarket" class="order-type-btn active" onclick="setOrderType('market')">Market</button>
          <button id="orderTypeLimit" class="order-type-btn" onclick="setOrderType('limit')">Limit</button>
          <button id="orderTypeStop" class="order-type-btn" onclick="setOrderType('stop')">Stop</button>
        </div>

        <!-- Limit Price Input (Hidden for Market) -->
        <div class="form-group" id="limitPriceGroup" style="display:none;">
          <div class="form-label">
            <span>Limit Price</span>
            <span class="mono" style="cursor:pointer; color:var(--ac-coral);" onclick="fillCurrentPrice()">Use Current</span>
          </div>
          <div class="input-wrapper">
            <input type="number" step="any" id="inputLimitPrice" class="form-input mono" placeholder="0.00" oninput="calculateOrder()">
            <span class="input-suffix">USD</span>
          </div>
        </div>

        <!-- Amount Input -->
        <div class="form-group">
          <div class="form-label">
            <span>Order Margin (USD)</span>
            <span class="mono" id="amountUnitsDisplay">0.00 units</span>
          </div>
          <div class="input-wrapper">
            <input type="number" step="any" id="inputAmountUsd" class="form-input mono" value="1000" placeholder="1000" oninput="calculateOrder()">
            <span class="input-suffix">USD</span>
          </div>
        </div>

        <!-- Quick Percent Buttons -->
        <div class="percent-grid">
          <button class="percent-btn" onclick="applyBalancePercent(0.10)">10%</button>
          <button class="percent-btn" onclick="applyBalancePercent(0.25)">25%</button>
          <button class="percent-btn" onclick="applyBalancePercent(0.50)">50%</button>
          <button class="percent-btn" onclick="applyBalancePercent(1.00)">100%</button>
        </div>

        <!-- Leverage Slider -->
        <div class="leverage-box">
          <div class="leverage-header">
            <span>Leverage Multiplier</span>
            <span class="leverage-val mono" id="leverageDisplay">20x</span>
          </div>
          <input type="range" min="1" max="100" value="20" class="slider" id="leverageSlider" oninput="updateLeverage(this.value)">
          <div class="leverage-presets">
            <button class="leverage-chip" onclick="updateLeverage(1)">1x</button>
            <button class="leverage-chip" onclick="updateLeverage(5)">5x</button>
            <button class="leverage-chip" onclick="updateLeverage(10)">10x</button>
            <button class="leverage-chip" onclick="updateLeverage(20)">20x</button>
            <button class="leverage-chip" onclick="updateLeverage(50)">50x</button>
            <button class="leverage-chip" onclick="updateLeverage(100)">100x</button>
          </div>
        </div>

        <!-- Take Profit & Stop Loss Checkbox -->
        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted); cursor:pointer;">
            <input type="checkbox" id="enableTPSL" onchange="toggleTPSLInputs()" style="accent-color:var(--ac-coral);">
            <span>Take Profit / Stop Loss</span>
          </label>
        </div>

        <div id="tpslInputsContainer" style="display:none; margin-bottom:12px; flex-direction:column; gap:8px;">
          <div class="form-group" style="margin-bottom:0;">
            <div class="form-label"><span>Take Profit Price</span></div>
            <input type="number" step="any" id="inputTPPrice" class="form-input mono" placeholder="Target price">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <div class="form-label"><span>Stop Loss Price</span></div>
            <input type="number" step="any" id="inputSLPrice" class="form-input mono" placeholder="Stop price">
          </div>
        </div>

        <!-- Order Summary -->
        <div class="summary-box">
          <div class="summary-row">
            <span>Position Size:</span>
            <span class="summary-val mono" id="sumPositionSize">$20,000.00</span>
          </div>
          <div class="summary-row">
            <span>Required Margin:</span>
            <span class="summary-val mono" id="sumMarginRequired">$1,000.00</span>
          </div>
          <div class="summary-row">
            <span>Est. Liq. Price:</span>
            <span class="summary-val mono text-red" id="sumEstLiqPrice">$61,607.50</span>
          </div>
          <div class="summary-row">
            <span>Trading Fee (0.04%):</span>
            <span class="summary-val mono" id="sumTradingFee">$8.00</span>
          </div>
        </div>

        <!-- Execute Button -->
        <button id="executeOrderBtn" class="execute-btn execute-btn-buy" onclick="handleExecuteOrder()">
          Open Long Position (${currentSymbol.symbol})
        </button>

      </div>

      <!-- Technical Analysis Rating Widget (Desktop only, avoids mobile clutter) -->
      <div class="panel-box" id="taPanelBox">
        <div class="panel-title">
          <span>Technical Rating</span>
          <span style="font-size:10px; color:var(--text-dim); font-weight:600;">STATIC</span>
        </div>

        <div class="ta-gauge-container" id="taGaugeContainer">
          <div class="tradingview-widget-container">
            <div class="tradingview-widget-container__widget"></div>
            <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" async>
            {
              "interval": "15m",
              "width": "100%",
              "isTransparent": true,
              "height": 340,
              "symbol": "${currentSymbol.tvSymbol}",
              "showIntervalTabs": true,
              "displayMode": "single",
              "locale": "en",
              "colorTheme": "dark"
            }
            </script>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Mobile Sticky Bottom Quick Bar: 1-Tap Access to Buy / Sell -->
  <div class="mobile-bottom-bar" id="mobileBottomBar">
    <button class="mobile-bottom-bar-btn" style="background:linear-gradient(135deg,#00d084 0%,#059669 100%); color:#0b131c;" onclick="mobileQuickTrade('buy')">
      ▲ BUY / LONG
    </button>
    <button class="mobile-bottom-bar-btn" style="background:linear-gradient(135deg,#e94d65 0%,#c5334a 100%); color:#ffffff;" onclick="mobileQuickTrade('sell')">
      ▼ SELL / SHORT
    </button>
  </div>

  <!-- Market Selector Modal -->
  <div class="modal-overlay" id="marketModalOverlay" onclick="closeMarketModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 style="font-size:14px; font-weight:800;">Select Market to Trade</h3>
        <button onclick="toggleMarketModal()" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div class="modal-body">
        <input type="text" id="marketSearchInput" class="form-input" placeholder="Search crypto, forex, commodities, stocks..." oninput="filterMarkets(this.value)" style="margin-bottom:12px;">
        
        <div style="max-height:340px; overflow-y:auto;" id="marketModalList">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- Deposit Modal -->
  <div class="modal-overlay" id="depositModalOverlay" onclick="closeDepositModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 style="font-size:14px; font-weight:800;">Account Balance & Deposit</h3>
        <button onclick="closeDepositModal()" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
          Top up your practice balance instantly or access your investor client account.
        </p>

        <div style="background:var(--bg-panel-sub); padding:14px; border-radius:6px; border:1px solid var(--border-main); margin-bottom:14px;">
          <div style="font-weight:800; margin-bottom:4px; font-size:12.5px; color:var(--text-main);">🎮 Instant Demo Balance</div>
          <p style="font-size:11.5px; color:var(--text-dim); margin-bottom:10px;">Practice trading with zero risk and static margin.</p>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-coral" style="flex:1; justify-content:center;" onclick="addBalance(5000)">+$5k</button>
            <button class="btn btn-coral" style="flex:1; justify-content:center;" onclick="addBalance(10000)">+$10k</button>
            <button class="btn btn-secondary" style="flex:1; justify-content:center;" onclick="resetBalance(10000)">Reset $10k</button>
          </div>
        </div>

        <div style="background:var(--bg-panel-sub); padding:14px; border-radius:6px; border:1px solid var(--border-main);">
          <div style="font-weight:800; margin-bottom:4px; font-size:12.5px; color:var(--text-main);">💼 AssetCrest Portal</div>
          <p style="font-size:11.5px; color:var(--text-dim); margin-bottom:10px;">Sign in to your client account for wire & crypto funding.</p>
          <a href="/login" class="btn btn-navy" style="display:flex; justify-content:center;">
            Go to AssetCrest Portal
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- TradingView Library & Static Logic -->
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script>
    const MARKETS = ${marketsJson};
    let activeSymbol = MARKETS.find(m => m.id === '${currentSymbol.id}') || MARKETS[0];
    let orderSide = 'buy';
    let orderType = 'market';
    let leverage = 20;
    let selectedCategory = 'all';

    // Local Storage State
    let balance = parseFloat(localStorage.getItem('assetcrest_balance') || '10000.00');
    let positions = JSON.parse(localStorage.getItem('assetcrest_positions') || '[]');
    let tradeHistory = JSON.parse(localStorage.getItem('assetcrest_history') || '[]');

    // Audio chime
    function playChime(type) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'sell' || type === 'close') {
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
        } else {
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.1);
        }
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        // audio muted or denied
      }
    }

    // Initialize TradingView Chart: responsive & mobile optimized
    let tvWidget = null;
    function initTradingViewChart(symbolProName) {
      const container = document.getElementById('tradingview_chart_element');
      if (!container) return;
      container.innerHTML = '';

      const isMobile = window.innerWidth <= 768;

      if (window.TradingView) {
        tvWidget = new TradingView.widget({
          "autosize": true,
          "symbol": symbolProName,
          "interval": "15",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#0f1a26",
          "enable_publishing": false,
          "allow_symbol_change": false,
          "hide_side_toolbar": isMobile ? true : false, // Hide left drawing tools on mobile so candlesticks have space
          "withdateranges": !isMobile,
          "save_image": false,
          "container_id": "tradingview_chart_element",
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ],
          "overrides": {
            "mainSeriesProperties.candleStyle.upColor": "#00d084",
            "mainSeriesProperties.candleStyle.downColor": "#e94d65",
            "mainSeriesProperties.candleStyle.borderUpColor": "#00d084",
            "mainSeriesProperties.candleStyle.borderDownColor": "#e94d65",
            "mainSeriesProperties.candleStyle.wickUpColor": "#00d084",
            "mainSeriesProperties.candleStyle.wickDownColor": "#e94d65",
            "paneProperties.background": "#0b131c",
            "paneProperties.vertGridProperties.color": "rgba(27, 73, 98, 0.18)",
            "paneProperties.horzGridProperties.color": "rgba(27, 73, 98, 0.18)",
            "scalesProperties.textColor": "#abb8c3",
            "scalesProperties.lineColor": "rgba(27, 73, 98, 0.45)"
          }
        });
      }
    }

    // Rebuild Technical Analysis Gauge
    function reloadTechnicalAnalysis(symbolProName) {
      const container = document.getElementById('taGaugeContainer');
      if (!container) return;
      container.innerHTML = \`
        <div class="tradingview-widget-container">
          <div class="tradingview-widget-container__widget"></div>
        </div>
      \`;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        interval: "15m",
        width: "100%",
        isTransparent: true,
        height: 340,
        symbol: symbolProName,
        showIntervalTabs: true,
        displayMode: "single",
        locale: "en",
        colorTheme: "dark"
      });
      container.querySelector('.tradingview-widget-container').appendChild(script);
    }

    // Mobile View Navigation
    function switchMobileView(view, btnEl) {
      if (window.innerWidth > 768) return;

      document.querySelectorAll('.mobile-view-tab').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');

      const chartPanel = document.getElementById('chartPanelContainer');
      const executionSidebar = document.getElementById('executionSidebar');
      const bottomTabs = document.getElementById('bottomTabsContainer');
      const chartWrapper = document.getElementById('tv_chart_container');

      if (view === 'chart') {
        chartPanel.style.display = 'flex';
        chartWrapper.style.display = 'block';
        bottomTabs.style.display = 'none';
        executionSidebar.style.display = 'none';
      } else if (view === 'trade') {
        chartPanel.style.display = 'none';
        executionSidebar.style.display = 'flex';
        // Hide TA gauge on mobile to keep order form focused
        document.getElementById('taPanelBox').style.display = 'none';
      } else if (view === 'book') {
        chartPanel.style.display = 'flex';
        chartWrapper.style.display = 'none';
        bottomTabs.style.display = 'flex';
        executionSidebar.style.display = 'none';
        switchBottomTab('orderbook');
      } else if (view === 'positions') {
        chartPanel.style.display = 'flex';
        chartWrapper.style.display = 'none';
        bottomTabs.style.display = 'flex';
        executionSidebar.style.display = 'none';
        switchBottomTab('positions');
      }
    }

    // Quick trade trigger from mobile bottom bar
    function mobileQuickTrade(side) {
      setOrderSide(side);
      const tradeTabBtn = document.querySelectorAll('.mobile-view-tab')[1];
      switchMobileView('trade', tradeTabBtn);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Quick bar filter
    function filterQuickBar(cat, btnEl) {
      selectedCategory = cat;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      renderQuickAssetChips();
    }

    // Switch Market
    function selectMarket(marketId) {
      const market = MARKETS.find(m => m.id === marketId);
      if (!market) return;
      activeSymbol = market;

      const newUrl = new URL(window.location);
      newUrl.searchParams.set('symbol', market.id);
      window.history.pushState({}, '', newUrl);

      document.getElementById('activePairDisplay').innerText = market.symbol;
      document.getElementById('headerLastPrice').innerText = '$' + market.price.toLocaleString(undefined, { minimumFractionDigits: market.precision, maximumFractionDigits: market.precision });
      
      const changeEl = document.getElementById('header24hChange');
      changeEl.innerText = (market.change24h >= 0 ? '+' : '') + market.change24h + '%';
      changeEl.className = 'stat-value mono ' + (market.change24h >= 0 ? 'text-green' : 'text-red');

      document.getElementById('header24hHigh').innerText = '$' + market.high24h.toLocaleString(undefined, { minimumFractionDigits: market.precision });
      document.getElementById('header24hLow').innerText = '$' + market.low24h.toLocaleString(undefined, { minimumFractionDigits: market.precision });
      document.getElementById('header24hVol').innerText = '$' + market.volume24h;

      document.querySelectorAll('.asset-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-id') === market.id);
      });

      initTradingViewChart(market.tvSymbol);
      reloadTechnicalAnalysis(market.tvSymbol);
      calculateOrder();
      generateOrderBook();
      generateRecentTrades();

      closeMarketModal();
      showToast('Switched to ' + market.symbol, 'success');
    }

    // Order Execution State
    function setOrderSide(side) {
      orderSide = side;
      const btnBuy = document.getElementById('sideBtnBuy');
      const btnSell = document.getElementById('sideBtnSell');
      const execBtn = document.getElementById('executeOrderBtn');

      if (side === 'buy') {
        btnBuy.classList.add('active');
        btnSell.classList.remove('active');
        execBtn.className = 'execute-btn execute-btn-buy';
        execBtn.innerText = 'Open Long Position (' + activeSymbol.symbol + ')';
      } else {
        btnSell.classList.add('active');
        btnBuy.classList.remove('active');
        execBtn.className = 'execute-btn execute-btn-sell';
        execBtn.innerText = 'Open Short Position (' + activeSymbol.symbol + ')';
      }
      calculateOrder();
    }

    function setOrderType(type) {
      orderType = type;
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('orderType' + type.charAt(0).toUpperCase() + type.slice(1));
      if (activeBtn) activeBtn.classList.add('active');

      const limitGroup = document.getElementById('limitPriceGroup');
      if (type === 'limit' || type === 'stop') {
        limitGroup.style.display = 'block';
        if (!document.getElementById('inputLimitPrice').value) {
          fillCurrentPrice();
        }
      } else {
        limitGroup.style.display = 'none';
      }
      calculateOrder();
    }

    function fillCurrentPrice() {
      document.getElementById('inputLimitPrice').value = activeSymbol.price;
      calculateOrder();
    }

    function updateLeverage(val) {
      leverage = parseInt(val, 10);
      document.getElementById('leverageSlider').value = leverage;
      document.getElementById('leverageDisplay').innerText = leverage + 'x';
      calculateOrder();
    }

    function toggleTPSLInputs() {
      const enabled = document.getElementById('enableTPSL').checked;
      document.getElementById('tpslInputsContainer').style.display = enabled ? 'flex' : 'none';
      if (enabled) {
        const curPrice = activeSymbol.price;
        if (orderSide === 'buy') {
          document.getElementById('inputTPPrice').value = (curPrice * 1.05).toFixed(activeSymbol.precision);
          document.getElementById('inputSLPrice').value = (curPrice * 0.98).toFixed(activeSymbol.precision);
        } else {
          document.getElementById('inputTPPrice').value = (curPrice * 0.95).toFixed(activeSymbol.precision);
          document.getElementById('inputSLPrice').value = (curPrice * 1.02).toFixed(activeSymbol.precision);
        }
      }
    }

    function applyBalancePercent(percent) {
      const maxUsable = balance * percent;
      document.getElementById('inputAmountUsd').value = Math.max(10, Math.floor(maxUsable));
      calculateOrder();
    }

    function calculateOrder() {
      const amountUsd = parseFloat(document.getElementById('inputAmountUsd').value) || 0;
      const effectivePrice = (orderType === 'limit' || orderType === 'stop')
        ? (parseFloat(document.getElementById('inputLimitPrice').value) || activeSymbol.price)
        : activeSymbol.price;

      const positionSize = amountUsd * leverage;
      const units = effectivePrice > 0 ? (positionSize / effectivePrice) : 0;
      const fee = positionSize * 0.0004;

      let liqPrice = 0;
      if (orderSide === 'buy') {
        liqPrice = effectivePrice * (1 - (1 / leverage) * 0.90);
      } else {
        liqPrice = effectivePrice * (1 + (1 / leverage) * 0.90);
      }

      document.getElementById('amountUnitsDisplay').innerText = units.toFixed(4) + ' units';
      document.getElementById('sumPositionSize').innerText = '$' + positionSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('sumMarginRequired').innerText = '$' + amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('sumEstLiqPrice').innerText = '$' + Math.max(0, liqPrice).toLocaleString(undefined, { minimumFractionDigits: activeSymbol.precision, maximumFractionDigits: activeSymbol.precision });
      document.getElementById('sumTradingFee').innerText = '$' + fee.toFixed(2);
    }

    function handleExecuteOrder() {
      const amountUsd = parseFloat(document.getElementById('inputAmountUsd').value) || 0;
      if (amountUsd <= 0) {
        showToast('Please specify an order amount', 'error');
        return;
      }
      if (amountUsd > balance) {
        showToast('Insufficient margin ($' + balance.toFixed(2) + '). Please deposit funds.', 'error');
        return;
      }

      const entryPrice = (orderType === 'limit' || orderType === 'stop')
        ? (parseFloat(document.getElementById('inputLimitPrice').value) || activeSymbol.price)
        : activeSymbol.price;

      const positionSize = amountUsd * leverage;
      const fee = positionSize * 0.0004;

      balance -= (amountUsd + fee);
      localStorage.setItem('assetcrest_balance', balance.toString());
      updateBalanceUI();

      let liqPrice = 0;
      if (orderSide === 'buy') {
        liqPrice = entryPrice * (1 - (1 / leverage) * 0.90);
      } else {
        liqPrice = entryPrice * (1 + (1 / leverage) * 0.90);
      }

      const newPosition = {
        id: 'pos_' + Date.now(),
        symbol: activeSymbol.symbol,
        symbolId: activeSymbol.id,
        side: orderSide,
        leverage: leverage,
        margin: amountUsd,
        sizeUsd: positionSize,
        entryPrice: entryPrice,
        markPrice: entryPrice,
        liqPrice: liqPrice,
        createdAt: new Date().toISOString()
      };

      positions.unshift(newPosition);
      localStorage.setItem('assetcrest_positions', JSON.stringify(positions));
      renderPositions();

      playChime(orderSide);
      showToast(
        'Executed ' + orderSide.toUpperCase() + ' ' + activeSymbol.symbol + ' @ $' + entryPrice.toLocaleString() + ' (' + leverage + 'x)',
        'success'
      );
    }

    function closePosition(positionId) {
      const idx = positions.findIndex(p => p.id === positionId);
      if (idx === -1) return;

      const pos = positions[idx];
      const pnl = calculatePositionPnL(pos);

      balance += (pos.margin + pnl);
      localStorage.setItem('assetcrest_balance', balance.toString());
      updateBalanceUI();

      tradeHistory.unshift({
        id: 'trade_' + Date.now(),
        symbol: pos.symbol,
        side: pos.side,
        entryPrice: pos.entryPrice,
        exitPrice: pos.markPrice,
        sizeUsd: pos.sizeUsd,
        pnl: pnl,
        closedAt: new Date().toISOString()
      });
      localStorage.setItem('assetcrest_history', JSON.stringify(tradeHistory));

      positions.splice(idx, 1);
      localStorage.setItem('assetcrest_positions', JSON.stringify(positions));

      renderPositions();
      renderHistory();
      playChime('close');
      showToast('Closed ' + pos.symbol + ' (PnL: ' + (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2) + ')', pnl >= 0 ? 'success' : 'error');
    }

    function calculatePositionPnL(pos) {
      const priceDiff = pos.side === 'buy' ? (pos.markPrice - pos.entryPrice) : (pos.entryPrice - pos.markPrice);
      const ratio = priceDiff / pos.entryPrice;
      return pos.sizeUsd * ratio;
    }

    function renderPositions() {
      const tbody = document.getElementById('positionsTableBody');
      const badge = document.getElementById('positionsCountBadge');
      const mobBadge = document.getElementById('mobilePosBadge');
      badge.innerText = positions.length;
      if (mobBadge) mobBadge.innerText = positions.length;

      if (positions.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="10" style="text-align:center; padding: 28px; color: var(--text-dim);">
              No open positions yet. Use the order ticket to place a trade.
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = positions.map(pos => {
        const pnl = calculatePositionPnL(pos);
        const pnlPercent = (pnl / pos.margin) * 100;
        const pnlColorClass = pnl >= 0 ? 'text-green' : 'text-red';
        const pnlSign = pnl >= 0 ? '+' : '';

        return \`
          <tr>
            <td class="mono" style="font-weight:700;">\${pos.symbol}</td>
            <td><span class="side-pill \${pos.side === 'buy' ? 'side-long' : 'side-short'}">\${pos.side.toUpperCase()}</span></td>
            <td class="mono">\${pos.leverage}x</td>
            <td class="mono">$\${pos.sizeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="mono">$\${pos.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="mono">$\${pos.markPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="mono text-red">$\${pos.liqPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="mono">$\${pos.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="mono \${pnlColorClass}" style="font-weight:700;">
              \${pnlSign}$\${pnl.toFixed(2)} (\${pnlSign}\${pnlPercent.toFixed(2)}%)
            </td>
            <td>
              <button class="btn btn-secondary" style="padding:3px 8px; font-size:11px; height:24px;" onclick="closePosition('\${pos.id}')">
                Close
              </button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function renderHistory() {
      const tbody = document.getElementById('historyTableBody');
      if (tradeHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 28px; color: var(--text-dim);">No trade history records found.</td></tr>';
        return;
      }
      tbody.innerHTML = tradeHistory.map(t => {
        const pnlSign = t.pnl >= 0 ? '+' : '';
        const pnlColor = t.pnl >= 0 ? 'text-green' : 'text-red';
        return \`
          <tr>
            <td style="color:var(--text-dim); font-size:11px;">\${new Date(t.closedAt).toLocaleTimeString()}</td>
            <td class="mono" style="font-weight:700;">\${t.symbol}</td>
            <td><span class="side-pill \${t.side === 'buy' ? 'side-long' : 'side-short'}">\${t.side.toUpperCase()}</span></td>
            <td class="mono">$\${t.entryPrice.toFixed(2)}</td>
            <td class="mono">$\${t.exitPrice.toFixed(2)}</td>
            <td class="mono">$\${t.sizeUsd.toFixed(2)}</td>
            <td class="mono \${pnlColor}" style="font-weight:700;">\${pnlSign}$\${t.pnl.toFixed(2)}</td>
            <td><span style="color:var(--green); font-size:11px; font-weight:700;">FILLED</span></td>
          </tr>
        \`;
      }).join('');
    }

    function renderAllMarketsTable() {
      const tbody = document.getElementById('allMarketsTableBody');
      tbody.innerHTML = MARKETS.map(m => \`
        <tr>
          <td class="mono" style="font-weight:700; color:var(--text-main);">\${m.symbol}</td>
          <td>\${m.name}</td>
          <td><span style="text-transform:uppercase; font-size:10px; color:var(--text-muted); background:var(--bg-panel-sub); padding:2px 6px; border-radius:4px; font-weight:600;">\${m.category}</span></td>
          <td class="mono">$\${m.price.toLocaleString(undefined, { minimumFractionDigits: m.precision })}</td>
          <td class="mono \${m.change24h >= 0 ? 'text-green' : 'text-red'}" style="font-weight:700;">\${m.change24h >= 0 ? '+' : ''}\${m.change24h}%</td>
          <td class="mono">$\${m.high24h.toLocaleString(undefined, { minimumFractionDigits: m.precision })}</td>
          <td class="mono">$\${m.low24h.toLocaleString(undefined, { minimumFractionDigits: m.precision })}</td>
          <td>
            <button class="btn btn-secondary" style="padding:3px 8px; font-size:11px; height:24px;" onclick="selectMarket('\${m.id}')">
              Trade
            </button>
          </td>
        </tr>
      \`).join('');
    }

    function renderQuickAssetChips() {
      const container = document.getElementById('quickAssetsContainer');
      const filtered = selectedCategory === 'all' 
        ? MARKETS 
        : MARKETS.filter(m => m.category === selectedCategory);

      container.innerHTML = filtered.map(m => \`
        <div class="asset-chip \${m.id === activeSymbol.id ? 'active' : ''}" data-id="\${m.id}" onclick="selectMarket('\${m.id}')">
          <span class="asset-chip-symbol">\${m.symbol}</span>
          <span class="mono \${m.change24h >= 0 ? 'text-green' : 'text-red'}">\${m.change24h >= 0 ? '+' : ''}\${m.change24h}%</span>
        </div>
      \`).join('');
    }

    // Static Order Book generation (stable, no erratic jumping)
    function generateOrderBook() {
      const tbody = document.getElementById('orderBookBody');
      const p = activeSymbol.price;
      const prec = activeSymbol.precision;
      let rows = '';

      for (let i = 5; i >= 1; i--) {
        const askP = p + (i * p * 0.0004);
        const sz = (0.45 + i * 0.28).toFixed(3);
        rows += \`
          <tr>
            <td class="mono text-red">$\${askP.toFixed(prec)}</td>
            <td class="mono">\${sz}</td>
            <td class="mono">$\${(askP * sz).toFixed(2)}</td>
          </tr>
        \`;
      }
      rows += \`
        <tr style="background:rgba(27,73,98,0.3);">
          <td colspan="3" class="mono text-green" style="font-weight:700; text-align:center; padding:5px; letter-spacing:0.3px; font-size:11px;">
            SPREAD $\${(p * 0.0002).toFixed(2)} (MARK $\${p.toFixed(prec)})
          </td>
        </tr>
      \`;
      for (let i = 1; i <= 5; i++) {
        const bidP = p - (i * p * 0.0004);
        const sz = (0.52 + i * 0.24).toFixed(3);
        rows += \`
          <tr>
            <td class="mono text-green">$\${bidP.toFixed(prec)}</td>
            <td class="mono">\${sz}</td>
            <td class="mono">$\${(bidP * sz).toFixed(2)}</td>
          </tr>
        \`;
      }
      tbody.innerHTML = rows;
    }

    // Static Recent Trades feed (clean, professional)
    function generateRecentTrades() {
      const tbody = document.getElementById('recentTradesBody');
      let rows = '';
      const now = new Date();
      const tradeSizes = [0.42, 1.15, 0.08, 0.65, 2.10, 0.33, 0.94, 0.18];
      const tradeSides = ['buy', 'buy', 'sell', 'buy', 'sell', 'sell', 'buy', 'sell'];

      for (let i = 0; i < tradeSizes.length; i++) {
        const side = tradeSides[i];
        const offset = (i % 2 === 0 ? 1 : -1) * (i * 0.0002 * activeSymbol.price);
        const p = activeSymbol.price + offset;
        const amt = tradeSizes[i].toFixed(3);
        const time = new Date(now.getTime() - i * 65000).toLocaleTimeString();
        rows += \`
          <tr>
            <td style="color:var(--text-dim);">\${time}</td>
            <td class="mono \${side === 'buy' ? 'text-green' : 'text-red'}">$\${p.toFixed(activeSymbol.precision)}</td>
            <td class="mono">\${amt}</td>
            <td><span class="side-pill \${side === 'buy' ? 'side-long' : 'side-short'}">\${side.toUpperCase()}</span></td>
          </tr>
        \`;
      }
      tbody.innerHTML = rows;
    }

    function updateBalanceUI() {
      document.getElementById('availableBalanceDisplay').innerText = '$' + balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function addBalance(amt) {
      balance += amt;
      localStorage.setItem('assetcrest_balance', balance.toString());
      updateBalanceUI();
      closeDepositModal();
      showToast('Credited +$' + amt.toLocaleString() + ' demo margin!', 'success');
    }
    function resetBalance(amt) {
      balance = amt;
      localStorage.setItem('assetcrest_balance', balance.toString());
      updateBalanceUI();
      closeDepositModal();
      showToast('Reset balance to $' + amt.toLocaleString(), 'success');
    }

    function toggleMarketModal() {
      const modal = document.getElementById('marketModalOverlay');
      modal.classList.toggle('active');
      if (modal.classList.contains('active')) {
        filterMarkets('');
        document.getElementById('marketSearchInput').focus();
      }
    }
    function closeMarketModal() {
      document.getElementById('marketModalOverlay').classList.remove('active');
    }
    function filterMarkets(query) {
      const q = query.toLowerCase().trim();
      const filtered = MARKETS.filter(m => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.includes(q));
      const list = document.getElementById('marketModalList');
      list.innerHTML = filtered.map(m => \`
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:6px; cursor:pointer; margin-bottom:4px; background:var(--bg-panel-sub); border:1px solid var(--border-sub);" onclick="selectMarket('\${m.id}')">
          <div>
            <div class="mono" style="font-weight:700;">\${m.symbol}</div>
            <div style="font-size:11.5px; color:var(--text-dim);">\${m.name} · \${m.category.toUpperCase()}</div>
          </div>
          <div style="text-align:right;">
            <div class="mono" style="font-weight:700;">$\${m.price.toLocaleString(undefined, { minimumFractionDigits: m.precision })}</div>
            <div class="mono \${m.change24h >= 0 ? 'text-green' : 'text-red'}" style="font-size:11.5px; font-weight:700;">\${m.change24h >= 0 ? '+' : ''}\${m.change24h}%</div>
          </div>
        </div>
      \`).join('');
    }

    function openDepositModal() {
      document.getElementById('depositModalOverlay').classList.add('active');
    }
    function closeDepositModal() {
      document.getElementById('depositModalOverlay').classList.remove('active');
    }

    function switchBottomTab(tabKey) {
      document.querySelectorAll('.bottom-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      const tabs = {
        positions: { btnIdx: 0, contentId: 'tab_positions' },
        orderbook: { btnIdx: 1, contentId: 'tab_orderbook' },
        history: { btnIdx: 2, contentId: 'tab_history' },
        markets: { btnIdx: 3, contentId: 'tab_markets' }
      };
      const t = tabs[tabKey];
      if (!t) return;

      document.querySelectorAll('.bottom-tabs .tab-btn')[t.btnIdx].classList.add('active');
      document.getElementById(t.contentId).classList.add('active');
    }

    function showToast(msg, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
      toast.innerHTML = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    window.addEventListener('DOMContentLoaded', () => {
      updateBalanceUI();
      renderQuickAssetChips();
      renderPositions();
      renderHistory();
      renderAllMarketsTable();
      generateOrderBook();
      generateRecentTrades();
      calculateOrder();

      // On mobile initial load, show Chart tab
      if (window.innerWidth <= 768) {
        switchMobileView('chart', document.querySelectorAll('.mobile-view-tab')[0]);
      }

      setTimeout(() => {
        initTradingViewChart('${currentSymbol.tvSymbol}');
      }, 150);

      // Handle window resize dynamically between mobile and desktop layout
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          document.getElementById('chartPanelContainer').style.display = 'flex';
          document.getElementById('tv_chart_container').style.display = 'block';
          document.getElementById('bottomTabsContainer').style.display = 'flex';
          document.getElementById('executionSidebar').style.display = 'flex';
          document.getElementById('taPanelBox').style.display = 'block';
        }
      });
    });
  </script>

</body>
</html>`;
}
