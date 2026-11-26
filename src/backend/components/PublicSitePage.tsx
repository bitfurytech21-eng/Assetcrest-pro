import React, { useEffect, useState } from 'react';
import { Menu, X, Scale, ChartPie, Users, Building2, Mountain, HardHat, Sun, FlaskConical, ArrowLeftRight, Hourglass, TrendingUp, GitBranch, ChevronLeft, ChevronRight } from 'lucide-react';

const media = (file: string) => `/reference-assets/${file}`;

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us/' },
  { label: 'Company', href: '/company-history/' },
  { label: 'Plans', href: '/investment-plans/' },
  { label: 'Process', href: '/our-process/' },
  { label: 'Vacation', href: '/offer/' },
  { label: 'Contact', href: '/contact-us/' },
];

const slides = [
  {
    eyebrow: 'SMART INVESTMENT FOR EVERY INVESTOR!',
    title: 'Invest with',
    accent: 'Confidence.',
    copy: 'Our platform combines simplicity, top-tier security, and data-driven insights to offer every investor a seamless and intelligent investing experience. Whether you’re new or experienced, invest with confidence.',
    image: '2019/04/img-slider-01.jpg',
  },
  {
    eyebrow: 'CUTTING-EDGE BLOCKCHAIN SOLUTIONS!',
    title: 'Unlock Financial',
    accent: 'Growth',
    copy: 'Step into the future of finance with blockchain-enabled investments. Discover tools designed to drive growth, transparency, and security, making every opportunity work harder for you.',
    image: '2019/04/img-slider-02.jpg',
  },
  {
    eyebrow: 'INVEST GLOBALLY, IMPACT LOCALLY!',
    title: 'Global',
    accent: 'Investments',
    copy: 'Join a global network of forward-thinking investors in shaping a digital future. Our platform connects investors with projects and opportunities around the world.',
    image: '2019/04/img-slider-03.jpg',
  },
];

const sectors = [
  { title: 'Forex Trading', copy: 'The forex market moves $5 trillion daily. With strategic analysis tools, we help clients benefit from trading opportunities, capturing revenue through smart forex investments.', Icon: Scale },
  { title: 'Cryptocurrency Mining', copy: 'Bitcoin mining generates new bitcoins by solving computational puzzles essential for securing the network. We provide expert services for efficient, secure mining operations, helping investors participate in the cryptocurrency market.', Icon: ChartPie },
  { title: 'Medical Cannabis', copy: 'We support the medical cannabis industry by ensuring transparent supply chains and safe access for patients. Our projects advance cannabis’s potential as a therapeutic solution.', Icon: Users },
  { title: 'Real Estate Investments', copy: 'Real estate is a prime wealth generator, providing income and growth. Our platform makes it easy to access this once-exclusive market, offering profitable real estate investment options.', Icon: Building2 },
  { title: 'Gold Mining', copy: 'Gold is a timeless safe-haven asset, ideal for portfolio stability and inflation protection. We help investors diversify and secure wealth with strategic gold investments.', Icon: Mountain },
  { title: 'Oil & Gas', copy: 'Investing in oil is now accessible to all. Our platform allows users to trade on oil prices easily, whether they’re beginners or seasoned investors, enabling profit from this essential sector.', Icon: HardHat },
  { title: 'Renewable Energy', copy: 'Our renewable energy services connect investors with projects in solar, wind, and hydroelectric power, combining profitability with environmental impact.', Icon: Sun },
  { title: 'Green Hydrogen', copy: 'We invest in green hydrogen projects, producing clean fuel through renewable energy. This innovative sector offers investors a way to support the future of sustainable energy.', Icon: FlaskConical },
  { title: 'Energy Trading', copy: 'Our energy trading marketplace connects green energy producers and consumers. Buy, sell, and track renewable energy certificates with ease and transparency.', Icon: ArrowLeftRight },
];

const principles = [
  ['Cutting-Edge Security', 'We employ the most advanced security protocols in the industry, including encryption, multi-signature authentication, and hardware security modules to protect your digital assets.', '2019/04/bgn-boxes-01.jpg'],
  ['Professional Expertise', 'Our team consists of leading financial experts and blockchain innovators. Whether you’re new to investing or experienced, we provide tailored strategies and continuous support to help you succeed.', '2019/04/bgn-boxes-02.jpg'],
  ['Regulatory Compliance', 'We adhere to strict regulatory standards across multiple jurisdictions, ensuring that your investments are legally compliant and fully protected.', '2019/04/bgn-boxes-03.jpg'],
];

const planNames = ['Beginners', 'Prime', 'Executive', 'Premium'];

const milestones = [
  ['March 1999', 'AssetCrest Founded', 'The reference company history describes the establishment of AssetCrest by a team exploring accessible digital financial solutions.', '2017/04/blog-post-14-768x512.jpg'],
  ['June 2002', 'Digital Payment Integration', 'The published timeline describes the introduction of online payment integrations and a focus on efficient digital transactions.', '2019/04/blog-post-26-768x512.jpg'],
  ['August 2010', 'Blockchain Exploration Begins', 'The timeline describes early exploration of blockchain technology and its potential for transparency and digital finance.', '2019/04/blog-post-18-768x512.jpg'],
  ['December 2012', 'First Blockchain Investment Product', 'The reference timeline marks the launch of a blockchain-based investment product.', '2017/04/blog-post-05-768x512.jpg'],
  ['February 2015', 'Strategic Partnerships', 'The published history describes partnerships intended to broaden the range of digital financial services.', '2017/04/blog-post-12-768x512.jpg'],
  ['September 2018', 'Mobile Investment App', 'The timeline describes the introduction of a mobile experience for accessing investment tools.', '2017/04/blog-post-04-768x512.jpg'],
  ['April 2020', 'Platform Expansion', 'The reference history describes an expansion of its digital-asset services and platform capabilities.', '2017/04/blog-post-10-768x512.jpg'],
  ['October 2022', 'Analytics Tools', 'The published timeline describes adding data and analytics tools to support investor research.', '2017/04/blog-post-13-768x512.jpg'],
];

function Logo() {
  return (
    <a href="/" aria-label="AssetCrest home" className="inline-flex items-center">
      <img src={media('2024/12/logo-new.png')} alt="AssetCrest" className="h-14 w-auto max-w-[245px] object-contain sm:h-[68px]" />
    </a>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="relative z-40 bg-white">
      <div className="mx-auto flex h-[104px] max-w-[1440px] items-center justify-start gap-7 px-6 sm:h-[150px] sm:gap-10 sm:px-10 lg:h-[190px] lg:gap-12 lg:px-[7%]">
        <button type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} className="flex h-12 w-12 shrink-0 items-center justify-center text-[#171717] sm:h-[72px] sm:w-[105px]">
          {menuOpen ? <X className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.2} /> : <Menu className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.2} />}
        </button>
        <Logo />
      </div>
      {menuOpen && <div className="absolute inset-x-0 top-full z-50 border-t border-slate-100 bg-white shadow-2xl">
        <div className="mx-auto grid max-w-7xl gap-1 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-slate-100 px-3 py-4 text-base font-semibold text-[#1b4962] hover:text-[#e94d65]">{item.label}</a>)}
          <div className="grid grid-cols-2 gap-3 pt-4 sm:col-span-2 lg:col-span-3">
            <a href="/register" className="bg-[#e94d65] px-6 py-4 text-center text-sm font-bold text-white">Register</a>
            <a href="/login" className="bg-[#1b4962] px-6 py-4 text-center text-sm font-bold text-white">Login</a>
          </div>
        </div>
      </div>}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#172d40] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-5 inline-flex bg-white p-2"><Logo /></div>
          <p className="max-w-xs text-sm leading-7 text-slate-300">AssetCrest's public information covers digital assets, financial markets, real estate and emerging investment themes.</p>
          <a href="/about-us/" className="mt-5 inline-flex text-sm font-bold text-[#ff9aaa] hover:text-white">About the company →</a>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Explore</h3>
          <div className="grid gap-3 text-sm text-slate-300">{navItems.map(item => <a key={item.href} href={item.href} className="hover:text-white">{item.label}</a>)}</div>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Client access</h3>
          <div className="grid gap-3 text-sm text-slate-300">
            <a href="/register" className="hover:text-white">Create an account</a>
            <a href="/login" className="hover:text-white">Client login</a>
            <a href="/app" className="hover:text-white">Investor portal</a>
            <a href="/our-process/" className="hover:text-white">How the process works</a>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-400">For account-specific support, use the secure client portal. Never share passwords or verification codes.</p>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Our location</h3>
          <img src={media('2019/04/img-footer-map.png')} alt="Location map image from the original AssetCrest website" loading="lazy" className="mb-4 h-28 w-full bg-white/5 object-contain" />
          <p className="text-sm leading-7 text-slate-300">Moor House, 120 London Wall, London EC2Y 5ET, United Kingdom</p>
          <a href="/contact-us/" className="mt-4 inline-flex border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-[#172d40]">Contact information</a>
        </div>
      </div>
      <div className="border-t border-white/15 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs text-slate-300 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} AssetCrest. All rights reserved.</span>
          <a href="#top" className="font-semibold hover:text-white">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}

function PageHero({ eyebrow, title, image = '2019/04/bgn-industries.png' }: { eyebrow: string; title: string; image?: string }) {
  return <section className="relative flex min-h-[250px] items-center overflow-hidden bg-[#1b4962] bg-cover bg-center px-6 py-16 text-white" style={{ backgroundImage: `linear-gradient(90deg,rgba(13,39,57,.88),rgba(13,39,57,.52)),url("${media(image)}")` }}>
    <div className="mx-auto w-full max-w-7xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#ff8798]">{eyebrow}</p>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
      <div className="mt-5 h-1 w-20 bg-[#e94d65]" />
    </div>
  </section>;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="mx-auto mb-12 max-w-3xl text-center">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">{eyebrow}</p>
    <h2 className="text-3xl font-extrabold leading-tight text-[#1b4962] sm:text-4xl">{title}</h2>
    {copy && <p className="mt-5 text-base leading-8 text-slate-600">{copy}</p>}
  </div>;
}

function RegisterCTA() {
  return <div className="mt-9 flex flex-wrap gap-3"><a href="/register" className="bg-[#e94d65] px-7 py-4 text-sm font-bold text-white hover:bg-[#d83f58]">Register</a><a href="/login" className="bg-[#1b4962] px-7 py-4 text-sm font-bold text-white hover:bg-[#12394f]">Login</a></div>;
}

function HomePage() {
  const [slide, setSlide] = useState(1);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [marketChanges, setMarketChanges] = useState<Record<string, number>>({});
  const [marketUpdatedAt, setMarketUpdatedAt] = useState('');
  const [marketStatus, setMarketStatus] = useState<'loading' | 'live' | 'unavailable'>('loading');
  const [testimonialIndex, setTestimonialIndex] = useState(5);

  useEffect(() => {
    const id = window.setInterval(() => setSlide(current => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'];
    const loadMarket = async () => {
      try {
        const [pricesResponse, ...quoteResponses] = await Promise.all([
          fetch('/api/market-data/prices', { headers: { Accept: 'application/json' } }),
          ...pairs.map(pair => fetch('/api/market-data/quote/' + pair, { headers: { Accept: 'application/json' } })),
        ]);
        if (!pricesResponse.ok) throw new Error('Market feed unavailable');
        const payload = await pricesResponse.json();
        const quotes = await Promise.all(quoteResponses.map(async response => response.ok ? response.json() : null));
        if (!active || !payload.prices) return;
        const nextPrices: Record<string, number> = { ...payload.prices };
        const nextChanges: Record<string, number> = {};
        quotes.forEach((quote, index) => {
          const price = Number(quote?.lastPrice);
          const change = Number(quote?.priceChangePercent);
          if (Number.isFinite(price) && price > 0) nextPrices[symbols[index]] = price;
          if (Number.isFinite(change)) nextChanges[symbols[index]] = change;
        });
        setMarketPrices(nextPrices);
        setMarketChanges(nextChanges);
        setMarketUpdatedAt(payload.updatedAt || new Date().toISOString());
        setMarketStatus('live');
      } catch {
        if (active) setMarketStatus('unavailable');
      }
    };
    loadMarket();
    const id = window.setInterval(loadMarket, 30000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  const current = slides[slide];
  const marketSymbols = [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: '◆' },
    { symbol: 'BNB', name: 'BNB', icon: '◆' },
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
    { symbol: 'XRP', name: 'XRP', icon: '✕' },
    { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  ];
  const testimonials = [
    { title: 'Transparency at Its Finest', quote: 'I’ve tried other investment platforms, but AssetCrest stands out with its transparency. They clearly outline potential risks and rewards, making it easier for me to make informed decisions. The level of detail in their service descriptions and the accessibility of their team make it a standout choice for anyone wanting straightforward investment options.', name: 'Collin Leblanc', country: 'South Africa', image: '2019/04/img-quote-02-160x160.jpg' },
    { title: 'Perfect for Diversifying My Portfolio', quote: 'AssetCrest has a wide range of investment plans, which allowed me to diversify my portfolio seamlessly. They offer different options tailored to risk tolerance, and it’s easy to shift between plans if needed. The flexibility they offer has made it my go-to platform for both short-term and long-term investments.', name: 'Lilah Chang', country: 'China', image: '2019/04/img-quote-05-160x160.jpg' },
    { title: 'Advanced Tools and Real-Time Insights', quote: 'AssetCrest’s platform gives me a wealth of data at my fingertips. The real-time insights and analytics have been a huge asset in helping me monitor my investments and make timely decisions. The combination of powerful tools and easy accessibility makes it ideal for digital investors who want control over their assets.', name: 'Justin Emerson', country: 'United Kingdom', image: '2019/04/img-quote-04-160x160.jpg' },
    { title: 'A Trusted Investment Hub for Beginners and Pros', quote: 'AssetCrest has created a user-friendly experience that accommodates both new investors and seasoned professionals. The platform’s straightforward layout and extensive educational resources make it easy to understand various investment options. From the intuitive dashboard to seamless account management, it’s clear AssetCrest prioritizes user experience. Highly recommended for anyone looking to enter digital investments.', name: 'Joanna Prestley', country: 'Canada', image: '2019/04/img-quote-03-160x160.jpg' },
    { title: 'Consistent Returns and Excellent Support', quote: 'AssetCrest has proven to be reliable with steady returns and professional support. Their investment plans are well-structured and transparent, which brings confidence in managing my portfolio. I especially appreciate the 24/7 customer support team—they’re responsive and genuinely knowledgeable. It feels like they have our best interests at heart.', name: 'Bradley Smith', country: 'United States', image: '2019/04/img-quote-01-160x160.jpg' },
    { title: 'Innovative and Secure Digital Platform', quote: 'Security is my top concern when it comes to digital investments, and Assetera doesn’t disappoint. They’ve integrated robust security protocols, so I feel safe with my assets on the platform. Their approach to combining innovative technology with traditional investment principles really sets them apart. A game-changer in the digital investment space!', name: 'Priscilla Jackson', country: 'France', image: '2019/04/img-quote-06-160x160.jpg' },
  ];
  const activeTestimonial = testimonials[testimonialIndex];
  const partnerLogos = ['logo-hotel-berg.png', 'logo-hotel-california.png', 'logo-estato.png', 'logo-addison.png', 'logo-urbanist.png', 'logo-bold-news.png', 'logo-celeste.png', 'logo-applauz.png', 'logo-bello.png'];
  const circles = [
    { title: 'Consistency', copy: 'Reliable results, time after time. AssetCrest is committed to stability in every market condition.', Icon: Hourglass },
    { title: 'Improvement', copy: 'Evolving with purpose. We continually refine our strategies to deliver smarter, stronger returns.', Icon: TrendingUp },
    { title: 'Branching', copy: 'Expanding possibilities. AssetCrest opens new avenues for growth and innovation in finance.', Icon: GitBranch },
  ];

  return <>
    <section id="top" className="relative isolate min-h-[620px] overflow-hidden bg-[#e8edf0] sm:min-h-[720px]">
      {slides.map((item, index) => <div key={item.image} aria-hidden={index !== slide} className={'absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-700 ' + (index === slide ? 'opacity-100' : 'opacity-0')} style={{ backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,.94) 0%,rgba(255,255,255,.84) 44%,rgba(255,255,255,.18) 100%),url("' + media(item.image) + '")' }} />)}
      <div className="mx-auto flex min-h-[620px] max-w-7xl items-center px-6 py-20 sm:min-h-[720px]">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-5"><span className="h-1 w-24 bg-[#e94d65] sm:w-36" /><p className="max-w-xl text-sm font-semibold uppercase leading-snug tracking-wide text-[#191919] sm:text-xl">{current.eyebrow}</p></div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-.055em] text-[#294760] sm:text-7xl lg:text-8xl">{current.title}<br /><span className="text-[#d9576a]">{current.accent}</span></h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#202124] sm:text-xl sm:leading-9">{current.copy}</p>
          <RegisterCTA />
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3" aria-label="Choose homepage slide">
        {slides.map((item, index) => <button key={item.image} type="button" onClick={() => setSlide(index)} aria-label={'Show slide ' + (index + 1)} aria-pressed={slide === index} className={'h-3 w-3 rounded-full border-2 border-[#e94d65] ' + (slide === index ? 'bg-[#e94d65]' : 'bg-white')} />)}
      </div>
    </section>

    <section className="bg-white px-6 py-8 sm:py-12">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
        {principles.map(([title, copy, image]) => <article key={title} className="relative min-h-[390px] overflow-hidden bg-cover bg-center px-7 py-10 shadow-[0_12px_38px_rgba(0,0,0,.12)] sm:min-h-[430px] sm:px-10 sm:py-12" style={{ backgroundImage: 'linear-gradient(180deg,rgba(255,255,255,.88),rgba(255,255,255,.76)),url("' + media(image) + '")' }}>
          <span className="mb-8 block h-1 w-16 bg-[#e94d65]" />
          <h2 className="mb-5 text-3xl font-extrabold leading-tight text-[#1b4962] sm:text-4xl">{title}</h2>
          <p className="max-w-md text-base leading-8 text-[#191919] sm:text-lg">{copy}</p>
          <a href="/register" className="mt-8 inline-flex min-w-[150px] items-center justify-center bg-[#e94d65] px-7 py-4 text-base font-bold text-white shadow-[0_4px_0_rgba(150,38,58,.25)] hover:bg-[#d83f58]">Register</a>
        </article>)}
      </div>
    </section>

    <section aria-label="Live cryptocurrency market prices" className="overflow-hidden bg-white py-10 sm:py-16">
      <div className="mx-auto mb-3 max-w-7xl px-6 text-center"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#e94d65]">Live cryptocurrency market</p></div>
      <div className="assetcrest-ticker-viewport">
        <div className="assetcrest-ticker-track">
          {[0, 1].map(copy => <div key={copy} className="flex shrink-0 items-center gap-10 pr-10 sm:gap-16 sm:pr-16">
            {marketSymbols.map(item => {
              const price = marketPrices[item.symbol];
              const change = marketChanges[item.symbol];
              return <div key={item.symbol} className="flex min-w-max items-center gap-3 sm:gap-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f4] text-2xl font-bold text-[#7c8790] sm:h-16 sm:w-16 sm:text-3xl">{item.icon}</span>
                <div className="whitespace-nowrap text-lg font-semibold text-[#171717] sm:text-2xl">{item.name} <span className="font-normal">({item.symbol})</span></div>
                <div className="whitespace-nowrap text-lg font-semibold tabular-nums text-[#171717] sm:text-2xl">{price ? '$ ' + price.toLocaleString('en-US', { maximumFractionDigits: price < 1 ? 5 : 2 }) : marketStatus === 'loading' ? 'Loading…' : '—'}</div>
                {Number.isFinite(change) && <div className={'whitespace-nowrap text-lg font-bold tabular-nums sm:text-2xl ' + (change < 0 ? 'text-[#d9475d]' : 'text-emerald-600')}>{change < 0 ? '↓ ' : '↑ '}{Math.abs(change).toFixed(2)}%</div>}
              </div>;
            })}
          </div>)}
        </div>
      </div>
      {marketUpdatedAt && <p className="mx-auto mt-3 max-w-7xl px-6 text-right text-[10px] text-slate-400">Live exchange data · Updated {new Date(marketUpdatedAt).toLocaleTimeString()}</p>}
      {marketStatus === 'unavailable' && <p className="mt-2 text-center text-xs text-slate-500">Live market data is temporarily unavailable. Prices will reappear when the exchange feed reconnects.</p>}
    </section>

    <section className="bg-white px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Future of Finance</p>
          <h2 className="text-3xl font-extrabold leading-tight text-[#1b4962] sm:text-5xl">Future of <span className="text-[#e94d65]">Finance</span></h2>
          <p className="mt-5 text-base leading-8 text-slate-600">At AssetCrest, we specialize in delivering cutting-edge investment opportunities in cryptocurrency markets, real estate, and digital assets. Our mission is to provide innovative, secure, and transparent trading solutions tailored to meet the needs of both new and seasoned investors. With a robust platform and expert guidance, we empower you to grow your financial future in a rapidly evolving digital economy.</p>
        </div>
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {sectors.map(({ title, copy, Icon }) => <article key={title} className="flex items-start gap-6 sm:gap-8">
            <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center text-[#d9576a] sm:h-[130px] sm:w-[130px]"><Icon className="h-[78px] w-[78px] sm:h-[108px] sm:w-[108px]" strokeWidth={1.35} /></div>
            <div className="min-w-0 flex-1"><h3 className="mb-3 text-2xl font-extrabold leading-tight text-[#294760] sm:text-3xl">{title}</h3><p className="text-base leading-8 text-[#191919] sm:text-lg">{copy}</p></div>
          </article>)}
        </div>
        <div className="mt-12 text-center"><a href="/register" className="inline-flex bg-[#e94d65] px-8 py-4 text-base font-bold text-white hover:bg-[#d83f58]">Register</a></div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#f7f7f7] px-6 py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[.12]" style={{ backgroundImage: 'url("' + media('2019/04/bgn-experience.png') + '")' }} />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div><img src={media('2019/04/img-experience.png')} alt="AssetCrest experience illustration" loading="lazy" className="mx-auto max-h-[450px] w-full object-contain" /></div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Growing with our clients</p>
            <h2 className="text-4xl font-extrabold leading-tight text-[#1b4962] sm:text-5xl">20+ Years of <span className="text-[#e94d65]">Experience</span></h2>
            <p className="mt-6 text-base leading-8 text-[#242424]">AssetCrest is a global financial company specializing in a wide range of investment services, from trading on cryptocurrency exchanges to investments in real estate, stocks, and gold. Our team of highly qualified professional traders ensures that we deliver secure, innovative, and profitable solutions for our clients.</p>
            <p className="mt-4 text-base leading-8 text-[#242424]">At AssetCrest, We blend cutting-edge technology with expert financial services to deliver a seamless, secure, and profitable investment experience. Whether you’re looking to diversify your portfolio, optimize your returns, or simply explore the digital financial frontier, we have the tools and expertise to help you succeed.</p>
            <RegisterCTA />
          </div>
        </div>
        <div className="mt-16 grid gap-14 sm:grid-cols-3 sm:gap-8">
          {circles.map(({ title, copy, Icon }) => <article key={title} className="flex flex-col items-center text-center">
            <div className="relative flex h-[250px] w-[250px] items-center justify-center sm:h-[270px] sm:w-[270px]">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img" aria-label="96 percent progress ring">
                <circle cx="110" cy="110" r="101" fill="none" stroke="#f1f1f1" strokeWidth="5" />
                <circle cx="110" cy="110" r="101" fill="none" stroke="#e94d65" strokeWidth="5" strokeLinecap="butt" strokeDasharray="608 635" />
              </svg>
              <Icon className="absolute h-14 w-14 text-[#294760]" strokeWidth={1.6} />
            </div>
            <h3 className="mt-7 text-3xl font-extrabold text-[#294760]">{title}</h3>
            <p className="mt-5 max-w-sm text-base leading-8 text-[#242424]">{copy}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#1b4962] px-6 py-16 text-white sm:py-24" style={{ backgroundImage: 'linear-gradient(rgba(27,73,98,.94),rgba(27,73,98,.96)),url("' + media('2019/04/bgn-quotes.jpg') + '")' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#e94d65]">Great reviews for our services</p><h2 className="text-4xl font-extrabold leading-tight text-white sm:text-6xl">Trusted by some<br /><span className="text-[#e94d65]">Biggest Names</span></h2></div>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <img src={media(activeTestimonial.image)} alt={activeTestimonial.name} loading="lazy" className="h-44 w-44 rounded-full bg-white object-cover sm:h-52 sm:w-52" />
          <h3 className="mt-9 max-w-3xl text-3xl font-extrabold leading-tight text-[#e94d65] sm:text-4xl">{activeTestimonial.title}</h3>
          <p className="mt-8 max-w-4xl text-base leading-8 text-white sm:text-2xl sm:leading-[1.65]">{activeTestimonial.quote}</p>
          <div className="mt-8 flex items-center gap-1 text-3xl text-white" aria-label="Five stars">★★★★★</div>
          <p className="mt-8 text-lg uppercase tracking-wide text-white">{activeTestimonial.name}</p>
          <p className="mt-4 text-2xl font-bold text-white">{activeTestimonial.country}</p>
          <div className="mt-12 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setTestimonialIndex((testimonialIndex + testimonials.length - 1) % testimonials.length)} aria-label="Previous testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button>
            {testimonials.map((item, index) => <button key={item.name} type="button" onClick={() => setTestimonialIndex(index)} aria-label={'Show testimonial ' + (index + 1)} aria-pressed={testimonialIndex === index} className={'h-3 w-3 rounded-full ' + (testimonialIndex === index ? 'bg-[#e94d65]' : 'bg-white/30')} />)}
            <button type="button" onClick={() => setTestimonialIndex((testimonialIndex + 1) % testimonials.length)} aria-label="Next testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-white px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl"><div className="grid grid-cols-2 items-center gap-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
        {partnerLogos.map(file => <div key={file} className="flex h-16 items-center justify-center px-3 py-2"><img src={media('2019/04/' + file)} alt="" loading="lazy" className="max-h-12 max-w-full object-contain opacity-75" /></div>)}
      </div></div>
    </section>

    <section className="relative overflow-hidden bg-[#f6f7f8] px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Unlock financial growth</p>
          <h2 className="text-4xl font-extrabold leading-tight text-[#1b4962] sm:text-5xl">Get your <span className="text-[#e94d65]">Investment Right</span></h2>
          <p className="mt-6 text-base leading-8 text-[#242424]">At AssetCrest, we strive for transparency, security, and innovation. Our mission is to provide investors with high-quality, tax-efficient financial solutions, backed by real-time market data, advanced technology, and a deep understanding of global financial markets.</p>
          <a href="/register" className="mt-8 inline-flex bg-[#e94d65] px-8 py-4 text-base font-bold text-white hover:bg-[#d83f58]">Register</a>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$7.1B</p><p className="mt-2 text-sm leading-6 text-slate-600">Enabled over $7.1 billion in deposits</p></div>
            <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$901M</p><p className="mt-2 text-sm leading-6 text-slate-600">With over $901 million withdrawn</p></div>
            <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">209K+</p><p className="mt-2 text-sm leading-6 text-slate-600">Proudly serving 209,000+ users</p></div>
          </div>
          <p className="mt-6 text-[11px] leading-5 text-slate-500">These figures are displayed on the reference website and have not been independently verified.</p>
        </div>
        <img src={media('2019/04/img-callback.png')} alt="AssetCrest information and contact illustration" loading="lazy" className="mx-auto max-h-[440px] w-full object-contain" />
      </div>
    </section>
  </>;
}

function AboutPage() {
  return <>
    <PageHero eyebrow="Who we are" title="About AssetCrest" image="2019/04/bgn-cases-2.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Our story</p><h2 className="mb-7 text-3xl font-extrabold text-[#1b4962] sm:text-4xl">Making digital finance easier to navigate</h2>
        <div className="space-y-5 text-base leading-8 text-slate-600">
          <p>AssetCrest was born out of a passion for reshaping the financial world. Our founding team, a group of blockchain enthusiasts and investment experts, envisioned a future where digital finance would be accessible to everyone—not just the tech-savvy or the wealthy few. We set out to build a platform that combines the innovation of blockchain with the stability, security and user-friendliness investors expect.</p>
          <p>With a focus on innovation, we aim to stay aware of industry changes and provide tools and services that adapt to market dynamics. We are here to provide a space where digital assets can be explored with integrity and forward-thinking strategies.</p>
          <p>Our vision is to create a world where digital finance is a seamless extension of the global economy. We aim to make digital assets easier to understand through secure, transparent information and an inclusive community.</p>
          <p>Our commitment to innovation, transparency and community support remains central to the way we describe our work and the experience we seek to provide.</p>
        </div><RegisterCTA />
      </div>
      <img src={media('2017/04/blog-post-06-1280x854.jpg')} alt="Digital finance and investment" loading="lazy" className="w-full shadow-xl" />
    </div></section>
    <section className="bg-[#f4f6f8] px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Our principles" title="What guides our work" /><div className="grid gap-6 md:grid-cols-3">{[['Consistency','We focus on clear processes and a dependable user experience.'],['Improvement','We continue to review our tools and services as technology and markets evolve.'],['Branching','We explore new areas of digital finance and emerging investment themes.']].map(([a,b])=><div key={a} className="bg-white p-8 shadow-sm"><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{a}</h3><p className="text-sm leading-7 text-slate-600">{b}</p></div>)}</div></div></section>
  </>;
}

function HistoryPage() {
  return <>
    <PageHero eyebrow="Our journey" title="Company history" image="2019/04/bgn-cases.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-4xl"><SectionHeading eyebrow="Milestones" title="A timeline of the company" copy="The milestones below reflect the timeline published on the reference website; they have not been independently verified." />
      <div className="relative space-y-8 before:absolute before:bottom-0 before:left-[17px] before:top-2 before:w-px before:bg-[#e5a0aa] sm:before:left-[23px]">
        {milestones.map(([date,title,copy,image])=><article key={date} className="relative grid gap-5 pl-12 sm:grid-cols-[150px_1fr] sm:gap-8 sm:pl-16">
          <span className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#e94d65] text-[0px] shadow sm:h-12 sm:w-12" />
          <p className="pt-1 text-sm font-bold text-[#e94d65]">{date}</p>
          <div className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[1fr_190px]"><div><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div><img src={media(image)} alt="" loading="lazy" className="h-32 w-full object-cover" /></div>
        </article>)}
      </div>
    </div></section>
  </>;
}

function PlansPage() {
  return <>
    <PageHero eyebrow="Investment options" title="Investment plans" image="2019/04/bgn-industries.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Find your starting point" title="Explore the available plan categories" copy="The reference website lists four plan categories. Current rates, minimums, terms, risk disclosures and eligibility must be confirmed in the secure portal before making any investment decision." />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{planNames.map((name,i)=><article key={name} className={`border bg-white p-8 shadow-sm ${i===1?'border-[#e94d65]':'border-slate-200'}`}><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#e94d65]">Plan 0{i+1}</p><h3 className="mb-4 text-2xl font-extrabold text-[#1b4962]">{name}</h3><p className="min-h-20 text-sm leading-7 text-slate-600">A plan category published by AssetCrest. Review the current terms, risks and eligibility requirements in the client portal.</p><a href="/register" className="mt-7 inline-flex w-full justify-center bg-[#1b4962] px-5 py-3 text-sm font-bold text-white hover:bg-[#12394f]">View in client portal</a></article>)}</div>
    </div></section>
    <section className="bg-[#f4f6f8] px-6 py-20"><div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Before investing" title="Information to review" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[['Understand the risks','Investment values can rise or fall. Review all material risks before committing funds.'],['Read the current terms','Confirm fees, investment duration, withdrawal rules and any applicable limits.'],['Verify the provider','Check the legal entity, regulatory status and custody arrangements independently.'],['Understand liquidity','Check when and how invested funds may be withdrawn.'],['Review support channels','Use verified company contact details and the secure portal for account-specific help.'],['Make informed decisions','Do not rely on projected or guaranteed returns without independently verifiable documentation.']].map(([a,b])=><div key={a} className="bg-white p-7"><h3 className="mb-3 font-bold text-[#1b4962]">{a}</h3><p className="text-sm leading-7 text-slate-600">{b}</p></div>)}</div></div></section>
  </>;
}

function ProcessPage() {
  const steps = [
    ['01','Create an account','Use the Register page to start account creation and follow the verification steps shown by the secure portal.'],
    ['02','Review the options','Explore the available plan information and read the terms, risks, eligibility and fees before proceeding.'],
    ['03','Make an informed decision','Only proceed after you have reviewed the investment details and confirmed the payment instructions inside your account.'],
    ['04','Manage your account','Use the client portal to review account activity, available statements and withdrawal information.'],
  ];
  return <>
    <PageHero eyebrow="How it works" title="Our process" image="2017/04/blog-post-05-1280x854.jpg" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Getting started" title="A clear path through the investor journey" copy="The reference site describes account creation, selecting an option and managing funds. The steps below keep those actions within the existing secure AssetCrest portal." />
      <div className="grid gap-6 md:grid-cols-2">{steps.map(([n,title,copy])=><article key={n} className="flex gap-5 border border-slate-200 p-7"><span className="text-3xl font-extrabold text-[#e94d65]">{n}</span><div><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div></article>)}</div>
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2"><img src={media('2019/04/img-faq-2.png')} alt="Investment process illustration" loading="lazy" className="mx-auto max-h-80 w-full object-contain" /><div><h3 className="text-2xl font-extrabold text-[#1b4962]">Support throughout the process</h3><p className="mt-4 text-sm leading-7 text-slate-600">Review platform information, keep your account details secure and use verified support channels if you need assistance.</p><RegisterCTA /></div></div>
    </div></section>
  </>;
}

function OfferPage() {
  const benefits = [
    ['Educational resources','Access investment guides and educational material to help you make informed decisions.'],
    ['Personalized support','Use the available support channels for questions about account access and platform processes.'],
    ['Program information','Review published program criteria and any applicable terms before participating.'],
    ['Eligibility details','Confirm eligibility requirements directly with the company before relying on an offer.'],
    ['Account tracking','Use the secure portal to review account information and any program status shown there.'],
    ['Opportunity updates','Check official company announcements for current program information.'],
  ];
  return <>
    <PageHero eyebrow="Client information" title="Investment offer" image="2019/04/bgn-quotes.jpg" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="AssetCrest offer" title="Information and resources for clients" copy="The reference page describes an investor offer and reward program. Participation, qualification and any benefits are subject to current written terms and eligibility confirmation." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(([a,b])=><article key={a} className="border border-slate-200 p-7"><div className="mb-5 h-1 w-12 bg-[#e94d65]" /><h3 className="mb-3 text-lg font-bold text-[#1b4962]">{a}</h3><p className="text-sm leading-7 text-slate-600">{b}</p></article>)}</div>
      <div className="mt-12 bg-[#f4f6f8] p-8 text-center sm:p-12"><h3 className="text-2xl font-extrabold text-[#1b4962]">Need to review your eligibility?</h3><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">Sign in to the existing client portal to review information associated with your account.</p><div className="mt-7 flex justify-center"><a href="/login" className="bg-[#1b4962] px-7 py-4 text-sm font-bold text-white hover:bg-[#12394f]">Login to client portal</a></div></div>
    </div></section>
  </>;
}

function ContactPage() {
  return <>
    <PageHero eyebrow="Get in touch" title="Contact AssetCrest" image="2019/04/bgn-searching.jpg" />
    <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Contact and support</p><h2 className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">How can we help?</h2><p className="mt-5 text-base leading-8 text-slate-600">For account-specific questions, please use the existing secure client portal. This keeps personal and account information within the authenticated service.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/login" className="bg-[#1b4962] px-7 py-4 text-sm font-bold text-white">Client login</a><a href="/register" className="border border-[#1b4962] px-7 py-4 text-sm font-bold text-[#1b4962]">Register</a></div></div>
      <div className="bg-[#f4f6f8] p-8 sm:p-10"><h3 className="mb-5 text-xl font-bold text-[#1b4962]">Support through your account</h3><p className="text-sm leading-7 text-slate-600">Sign in to access the support options made available to registered clients. Do not send passwords, verification codes or payment credentials by email or through public forms.</p><img src={media('2019/04/img-faq-1.png')} alt="Customer support" loading="lazy" className="mt-7 max-h-64 w-full object-contain" /></div>
    </div></section>
  </>;
}

export default function PublicSitePage() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';
  let page: React.ReactNode;
  switch (pathname) {
    case '/about-us': page = <AboutPage />; break;
    case '/company-history': page = <HistoryPage />; break;
    case '/investment-plans': page = <PlansPage />; break;
    case '/our-process': page = <ProcessPage />; break;
    case '/offer': page = <OfferPage />; break;
    case '/contact-us': page = <ContactPage />; break;
    default: page = <HomePage />;
  }
  return <div className="min-h-screen bg-white font-sans text-[#202124]"><Header /><main>{page}</main><Footer /></div>;
}
