import React, { useEffect, useState } from 'react';
import { X, Menu, ArrowUp, Scale, ChartPie, Users, Building2, Mountain, HardHat, Sun, FlaskConical, ArrowLeftRight, Hourglass, TrendingUp, GitBranch, ChevronLeft, ChevronRight, MessageCircle, Clock3, MapPin, Facebook, Twitter, Mail, ArrowUpRight } from 'lucide-react';

const media = (file: string) => `https://assetcrest.co/wp-content/uploads/${file}`;

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
  ['March 1999', 'AssetCrest Founded', 'AssetCrest was established by a team of early technology enthusiasts with the goal of creating accessible financial solutions for the digital age. At this time, the internet was still emerging as a global platform, and our team was dedicated to exploring how digital finance could offer new opportunities for all investors.', '2017/04/blog-post-14-768x512.jpg'],
  ['June 2002', 'Digital Payment Integration', 'We introduced digital payment integrations, allowing investors to easily access and manage funds in an online ecosystem. This move marked our commitment to providing seamless investment experiences by ensuring that transactions were secure, efficient, and easy to manage.', '2019/04/blog-post-26-768x512.jpg'],
  ['August 2010', 'Blockchain Exploration Begins', 'With the emergence of blockchain technology, AssetCrest began exploring ways to integrate blockchain into our services. This was the beginning of our shift from traditional digital finance to decentralized finance (DeFi), with the goal of bringing blockchain-backed security and transparency to investors.', '2019/04/blog-post-18-768x512.jpg'],
  ['December 2012', 'Launch of First Blockchain Investment Product', 'AssetCrest launched its first blockchain-based investment product, allowing users to invest in digital assets with unparalleled security. This product offered features such as transparent transactions and minimized intermediary fees.', '2017/04/blog-post-05-768x512.jpg'],
  ['February 2015', 'Strategic Partnerships with Global Institutions', 'We formed partnerships with prominent global financial institutions to enhance the range of digital assets available on our platform. This strengthened AssetCrest’s reputation as a reliable partner in digital finance and expanded our reach into institutional investing.', '2017/04/blog-post-12-768x512.jpg'],
  ['September 2018', 'Launch of Mobile Investment App', 'Recognizing the shift towards mobile, we introduced our mobile app, bringing our investment tools to users’ fingertips with real-time market data, mobile trading, and personalized investment recommendations.', '2017/04/blog-post-04-768x512.jpg'],
  ['April 2020', 'Major Platform Expansion', 'During this pivotal year, AssetCrest expanded its platform to include a wider range of blockchain assets, staking options, and investment plans tailored to diverse user needs.', '2017/04/blog-post-10-768x512.jpg'],
  ['October 2022', 'Adoption of AI-Powered Investment Tools', 'To enhance investment performance and insights, we integrated AI-powered analytics, helping users make data-driven investment choices and explore predictive market trends and automated trading strategies.', '2017/04/blog-post-13-768x512.jpg'],
  ['May 2023', 'Industry Excellence Award', 'The original company history page states that AssetCrest was recognized with an award for “Excellence in Digital Trading and Investment” in 2023. This historical claim has not been independently verified.', '2017/04/blog-post-06-768x512.jpg'],
];

function Logo() {
  return (
    <a href="/" aria-label="AssetCrest home" className="inline-flex items-center">
      <img src={media('2024/12/logo-new.png')} alt="AssetCrest" className="h-[58px] w-auto max-w-[245px] object-contain sm:h-[80px] sm:max-w-[360px] lg:h-[100px] lg:max-w-[480px]" />
    </a>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = typeof window === 'undefined' ? '/' : `/${window.location.pathname.split('/').filter(Boolean).join('/')}`;
  return (
    <header id="top" className="assetcrest-site-header relative z-40 bg-white shadow-[0_3px_18px_rgba(27,73,98,.07)]">
      <div className="bg-[#1b4962] text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 text-[11px] sm:px-8 sm:text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2"><Clock3 className="ac-motion-icon h-4 w-4 text-[#e94d65]" /> Monday - Friday <strong className="font-semibold text-white">8AM - 9PM</strong></span>
            <span className="hidden items-center gap-2 md:inline-flex"><MapPin className="ac-motion-icon h-4 w-4 text-[#e94d65]" /> Moor House, 120 London Wall, London EC2Y 5ET, United Kingdom</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Visit our social pages</span>
            <a href="https://www.facebook.com/" aria-label="Facebook" className="site-social-link"><Facebook className="ac-motion-icon h-4 w-4" /></a>
            <a href="https://twitter.com/" aria-label="Twitter" className="site-social-link"><Twitter className="ac-motion-icon h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 lg:py-6">
        <Logo />
        <div className="hidden items-center gap-3 sm:flex">
          <a href="/register" className="site-action site-action-primary">Register <ArrowUpRight className="ac-motion-icon h-4 w-4" /></a>
          <a href="/login" className="site-action site-action-secondary">Login <ArrowUpRight className="ac-motion-icon h-4 w-4" /></a>
        </div>
        <button type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="assetcrest-primary-navigation" className="site-menu-toggle sm:hidden">
          {menuOpen ? <X className="ac-motion-icon h-6 w-6" /> : <Menu className="ac-motion-icon h-6 w-6" />}
        </button>
      </div>
      <nav id="assetcrest-primary-navigation" aria-label="Main navigation" className={`border-t border-slate-100 bg-white ${menuOpen ? 'block' : 'hidden'} sm:block`}>
        <div className="mx-auto flex max-w-[1240px] flex-col px-5 sm:flex-row sm:items-center sm:justify-center sm:px-8">
          {navItems.map(item => {
            const targetPath = `/${item.href.split('/').filter(Boolean).join('/')}`;
            return <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === targetPath ? 'page' : undefined} className={`site-nav-link ${pathname === targetPath ? 'is-active' : ''}`}>{item.label}</a>;
          })}
          <div className="grid grid-cols-2 gap-2 py-3 sm:hidden">
            <a href="/register" onClick={() => setMenuOpen(false)} className="site-action site-action-primary justify-center">Register</a>
            <a href="/login" onClick={() => setMenuOpen(false)} className="site-action site-action-secondary justify-center">Login</a>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <>
      <section className="bg-white px-6 py-14 text-center sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#e94d65]">Get started with AssetCrest</p>
          <h2 className="text-3xl font-bold text-[#1b4962] sm:text-4xl">Ready to explore your account?</h2>
          <div className="mt-8 flex flex-row justify-center gap-3 sm:gap-6">
            <a href="/register" className="site-footer-cta site-footer-cta-dark">Register</a>
            <a href="/login" className="site-footer-cta site-footer-cta-pink">Login</a>
          </div>
        </div>
      </section>
      <footer className="assetcrest-reference-footer bg-[#1b4962] px-6 pb-7 pt-14 text-white sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 border-b border-white/15 pb-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.15fr_1fr_1fr] lg:gap-14 lg:pb-14">
            <section>
              <h2 className="site-footer-heading">ASSETCREST Headquarters</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">At AssetCrest, we aim to make account information and support easy to access. Contact our team for general enquiries, assistance with your account, or help navigating the platform.</p>
              <div className="mt-6 space-y-3 text-sm">
                <a href="mailto:info@assetcrestonline.com" className="site-footer-contact"><Mail className="ac-motion-icon h-4 w-4" /> info@assetcrestonline.com</a>
                <a href="https://assetcrestonline.com" className="site-footer-contact"><ArrowUpRight className="ac-motion-icon h-4 w-4" /> assetcrestonline.com</a>
              </div>
            </section>
            <section>
              <h2 className="site-footer-heading">OUR LOCATIONS</h2>
              <p className="mt-2 text-sm font-semibold text-white">Where to find us?</p>
              <img src={media('2019/04/img-footer-map.png')} alt="Map illustration showing the AssetCrest office location" loading="lazy" className="mt-5 h-[142px] w-full max-w-[390px] object-contain object-left opacity-90" />
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">Moor House, 120 London Wall, London EC2Y 5ET, United Kingdom</p>
            </section>
            <section>
              <h2 className="site-footer-heading">GET IN TOUCH</h2>
              <p className="mt-2 text-sm font-semibold text-white">AssetCrest Social links</p>
              <p className="mt-5 text-sm leading-7 text-slate-300">For support or account-related questions, contact our team using the official company email address. Please never send passwords or verification codes through email.</p>
              <a href="mailto:customersupport@assetcrestonline.com" className="site-footer-contact mt-5"><Mail className="ac-motion-icon h-4 w-4" /> customersupport@assetcrestonline.com</a>
              <div className="mt-6 flex items-center gap-3">
                <a href="https://www.facebook.com/" aria-label="Facebook" className="site-footer-social"><Facebook className="ac-motion-icon h-5 w-5" /></a>
                <a href="https://twitter.com/" aria-label="Twitter" className="site-footer-social"><Twitter className="ac-motion-icon h-5 w-5" /></a>
              </div>
            </section>
          </div>
          <div className="flex flex-col items-center justify-between gap-5 pt-7 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-400">All rights reserved. © {new Date().getFullYear()} AssetCrest.</p>
            <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-[10px] font-bold uppercase tracking-[.12em] text-slate-300 sm:justify-end">
              {navItems.map(item => <a key={item.href} href={item.href} className="site-footer-nav-link">{item.label}</a>)}
              <a href="#top" className="site-footer-nav-link inline-flex items-center gap-1">Back to top <ArrowUp className="ac-motion-icon h-3 w-3" /></a>
            </nav>
          </div>
        </div>
      </footer>
    </>
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


function StatsSection() {
  const stats = [
    { value: '$7.1B', caption: 'Enabled over $7.1 billion in deposits', Icon: 'deposits' as const },
    { value: '$901M', caption: 'With over $901 million withdrawn', Icon: 'withdrawals' as const },
    { value: '209K', caption: 'Proudly serving 209,000+ users', Icon: 'users' as const },
  ];
  return <section aria-label="AssetCrest statistics" className="assetcrest-stats-section relative isolate overflow-hidden border-t border-[#E5E5E5] bg-white px-6 py-16 sm:py-20 lg:py-24">
    <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[48%] assetcrest-stats-stripes" aria-hidden="true" />
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-y-12 gap-x-10 md:grid-cols-3 md:gap-y-0 md:gap-x-8">
      {stats.map(({ value, caption, Icon }) => <article key={value} className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-[108px] w-[108px] items-center justify-center text-[#C95D68] sm:mb-7" aria-hidden="true">
          {Icon === 'deposits' && <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="34" y="39" width="52" height="42" rx="5" />
            <circle cx="60" cy="60" r="13" />
            <path d="M64.5 53.5c-1.2-1.4-2.8-2-4.8-2-2.6 0-4.5 1.3-4.5 3.4 0 5 10 2.4 10 7.5 0 2.1-2 3.6-4.9 3.6-2.1 0-4-.8-5.3-2.2M60 48v24" />
            <path d="M40 33c5-5 12-8 20-8 8 0 15 3 20 8" />
            <path d="m72 25 8 8-11 1" />
            <path d="M80 87c-5 5-12 8-20 8-8 0-15-3-20-8" />
            <path d="m48 95-8-8 11-1" />
          </svg>}
          {Icon === 'withdrawals' && <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="60" cy="60" r="39" />
            <circle cx="60" cy="60" r="29" />
            <path d="M60 12v9M60 99v9M12 60h9M99 60h9" />
            <g className="assetcrest-compass-needle"><path d="m60 37 8 25-8 21-8-21 8-25Z" /></g>
            <path d="M60 21v8M60 91v8M21 60h8M91 60h8" />
            <circle cx="60" cy="60" r="3" />
          </svg>}
          {Icon === 'users' && <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38 27h44l-4 34c-1 10-9 17-18 17s-17-7-18-17l-4-34Z" />
            <path d="M38 34H26c0 13 6 20 17 21M82 34h12c0 13-6 20-17 21" />
            <path d="M60 78v14M48 92h24" />
            <path d="M43 92h34l8 9H35l8-9Z" />
            <path d="M49 42l11 9 11-9-3 18-8-4-8 4-3-18Z" /><path d="m54 60-2 8 8-4 8 4-2-8" />
            <rect x="43" y="96" width="34" height="9" rx="1.5" />
          </svg>}
        </div>
        <p className="text-[56px] font-bold leading-none tracking-tight text-[#2F4660] tabular-nums">{value}</p>
        <p className="mt-4 max-w-[330px] text-[18px] font-normal leading-[1.55] text-[#191919] sm:text-xl">{caption}</p>
      </article>)}
    </div>
    <p className="mx-auto mt-10 max-w-7xl text-center text-[11px] leading-5 text-slate-500">Figures reproduced from the original AssetCrest website and have not been independently verified.</p>
  </section>;
}

function HomePage() {
  const [slide, setSlide] = useState(1);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [marketChanges, setMarketChanges] = useState<Record<string, number>>({});
  const [marketUpdatedAt, setMarketUpdatedAt] = useState('');
  const [marketStatus, setMarketStatus] = useState<'loading' | 'live' | 'unavailable'>('loading');
  const [testimonialIndex, setTestimonialIndex] = useState(5);

  useEffect(() => {
    let active = true;
    const loadMarket = async () => {
      try {
        const response = await fetch('/api/market-data/prices', { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Market feed unavailable');
        const payload = await response.json();
        if (!active || !payload.prices) return;
        setMarketPrices(payload.prices);
        setMarketChanges(payload.changes || {});
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

    <section aria-label="Live cryptocurrency market prices" className="overflow-hidden bg-white py-6 sm:py-10">
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
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-2">
          {sectors.map(({ title, copy, Icon }) => <article key={title} className="flex items-start gap-5 sm:gap-8">
            <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center text-[#d9576a] sm:h-[120px] sm:w-[120px]"><Icon className="h-[76px] w-[76px] sm:h-[100px] sm:w-[100px]" strokeWidth={1.35} /></div>
            <div className="min-w-0 flex-1"><h3 className="mb-3 text-[26px] font-extrabold leading-tight text-[#294760] sm:text-3xl">{title}</h3><p className="text-[17px] leading-[1.75] text-[#191919] sm:text-lg sm:leading-8">{copy}</p></div>
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
            <div className="relative flex h-[min(88vw,390px)] w-[min(88vw,390px)] items-center justify-center sm:h-[min(38vw,500px)] sm:w-[min(38vw,500px)]">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img" aria-label="96 percent progress ring">
                <circle cx="110" cy="110" r="101" fill="none" stroke="#f1f1f1" strokeWidth="8" />
                <circle cx="110" cy="110" r="101" fill="none" stroke="#e94d65" strokeWidth="8" strokeLinecap="butt" strokeDasharray="608 635" />
              </svg>
              <Icon className="absolute h-16 w-16 text-[#294760] sm:h-20 sm:w-20" strokeWidth={1.6} />
            </div>
            <h3 className="mt-8 text-3xl font-extrabold text-[#294760] sm:text-4xl">{title}</h3>
            <p className="mt-5 max-w-lg text-lg leading-[1.75] text-[#242424] sm:text-xl">{copy}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#1b4962] px-6 py-16 text-white sm:py-24" style={{ backgroundImage: 'linear-gradient(rgba(27,73,98,.94),rgba(27,73,98,.96)),url("' + media('2019/04/bgn-quotes.jpg') + '")' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#e94d65]">Great reviews for our services</p><h2 className="text-4xl font-extrabold leading-tight text-white sm:text-6xl">Trusted by some<br /><span className="text-[#e94d65]">Biggest Names</span></h2></div>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <img src={media(activeTestimonial.image)} alt={activeTestimonial.name} loading="lazy" className="h-32 w-32 rounded-full bg-white object-cover sm:h-52 sm:w-52" />
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

    <section aria-label="AssetCrest partner logos" className="bg-white px-0 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="assetcrest-partners-viewport" aria-label="Partner logos moving horizontally">
          <div className="assetcrest-partners-track">
            {[0, 1].map(copy => (
              <div key={copy} className="assetcrest-partners-group" aria-hidden={copy === 1}>
                {partnerLogos.map(file => (
                  <div key={file} className="assetcrest-partner-logo">
                    <img src={media('2019/04/' + file)} alt={copy === 0 ? file.replace(/^logo-/, '').replace(/\.png$/i, '').replace(/-/g, ' ') : ''} loading="lazy" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#f6f7f8] px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Unlock financial growth</p>
          <h2 className="text-4xl font-extrabold leading-tight text-[#1b4962] sm:text-5xl">Get your <span className="text-[#e94d65]">Investment Right</span></h2>
          <p className="mt-6 text-base leading-8 text-[#242424]">At AssetCrest, we strive for transparency, security, and innovation. Our mission is to provide investors with high-quality, tax-efficient financial solutions, backed by real-time market data, advanced technology, and a deep understanding of global financial markets.</p>
          <a href="/register" className="mt-8 inline-flex bg-[#e94d65] px-8 py-4 text-base font-bold text-white hover:bg-[#d83f58]">Register</a>
        </div>
        <img src={media('2019/04/img-callback.png')} alt="AssetCrest information and contact illustration" loading="lazy" className="mx-auto max-h-[440px] w-full object-contain" />
      </div>
    </section>
    <StatsSection />
  </>;
}

function AboutPage() {
  const principles = [
    ['Security First','We prioritize the safety of our users’ assets and data with state-of-the-art security measures and transparent protocols, ensuring peace of mind for all our investors.'],
    ['Innovation and Progress','Our platform is built on forward-thinking technology that adapts to market needs, providing advanced tools and resources for intelligent investment choices in the digital economy.'],
    ['Trust and Transparency','At AssetCrest, we believe in building trust through openness. We are committed to clear, transparent operations so that our investors are informed and confident.'],
    ['Exceptional User Experience','Simplicity is key. We focus on providing an intuitive and seamless experience for every investor, regardless of their experience level, ensuring ease in navigating the digital finance world.'],
    ['Financial Growth and Opportunity','Our platform is designed with growth in mind, offering diverse investment options that align with each investor’s financial goals, for meaningful, long-term wealth generation.'],
    ['Community and Support','AssetCrest is more than just a platform; it’s a community. We are dedicated to supporting our investors with excellent customer care and educational resources to help them succeed.'],
  ];
  return <>
    <PageHero eyebrow="Who we are" title="About AssetCrest" image="2019/04/bgn-cases-2.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Our story</p><h2 className="mb-7 text-3xl font-extrabold text-[#1b4962] sm:text-4xl">Making digital finance accessible</h2>
        <div className="space-y-5 text-base leading-8 text-slate-600">
          <p>AssetCrest was born out of a passion for reshaping the financial world. Our founding team, a group of blockchain enthusiasts and investment experts, envisioned a future where digital finance would be accessible to everyone—not just the tech-savvy or the wealthy few. At that time, the blockchain industry was still maturing, with countless potential but a need for dependable, secure platforms that could meet the complex needs of modern investors. So, we set out to build AssetCrest—a platform that combines the innovation of blockchain with the stability, security, and user-friendliness that investors expect.</p>
          <p>With a focus on innovation, we stay ahead of industry changes, offering tools and services that adapt to market dynamics and support our investors in achieving financial growth. We’re here to provide a space where digital assets are managed with integrity and forward-thinking strategies. For us, the future is digital, and our commitment is to be the gateway to that future for our community.</p>
          <p>What began as a small team has transformed into a thriving community of thousands of investors worldwide. Our platform now stands as a symbol of trust, reliability, and opportunity in a constantly changing blockchain landscape. We are proud to say that our growth is fueled by a clear mission and a bold vision: to make blockchain investments both profitable and secure for everyone. Assetera is designed to empower individuals and institutions alike, enabling them to navigate the digital asset landscape with confidence.</p>
          <p>Our vision is to create a world where digital finance is a seamless extension of the global economy. At AssetCrest, we aim to redefine investment in the blockchain space, transforming digital assets from a novelty to a reliable part of any investment portfolio. We envision a platform that goes beyond the traditional limitations of financial services by offering forward-thinking strategies, secure and transparent asset management, and an inclusive community.</p>
          <p>At AssetCrest, we are driven by a shared vision of making digital finance accessible, secure, and empowering for all. As we continue to grow, our commitment to innovation, transparency, and community support remains unwavering. We believe that the future of finance is digital and are dedicated to providing our users with the tools, resources, and trust they need to succeed in this evolving landscape.</p>
        </div><RegisterCTA />
      </div>
      <img src={media('2017/04/blog-post-06-1280x854.jpg')} alt="Digital finance and investment" loading="lazy" className="w-full shadow-xl" />
    </div></section>
    <section className="bg-[#f4f6f8] px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Our principles" title="What guides our work" /><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{principles.map(([title,copy])=><article key={title} className="bg-white p-8 shadow-sm"><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></article>)}</div></div></section>
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl">
      <SectionHeading eyebrow="Our people" title="Meet the team" />
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Calvin Durant','2019/04/img-people-06.jpg'],
          ['Caitlin Thomas','2019/04/img-people-05.jpg'],
          ['Amely Norwood','2019/04/img-people-07.jpg'],
          ['Darryl Penn','2019/04/img-people-08.jpg'],
        ].map(([name,image])=><article key={name} className="text-center"><img src={media(image)} alt={name} loading="lazy" className="aspect-[4/5] w-full object-cover" /><h3 className="mt-4 text-lg font-bold text-[#294760]">{name}</h3><a href="/register" className="mt-2 inline-block text-sm font-semibold text-[#d9576a]">Read more</a></article>)}
      </div>
      <div className="mt-16 border-t border-slate-200 pt-12">
        <SectionHeading eyebrow="Our partners" title="Partner brands" />
        <div className="grid grid-cols-2 items-center gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {['logo-hotel-berg.png','logo-hotel-california.png','logo-estato.png','logo-addison.png','logo-urbanist.png','logo-bold-news.png','logo-celeste.png','logo-applauz.png','logo-bello.png'].map(file=><img key={file} src={media('2019/04/'+file)} alt={file.replace('logo-','').replace('.png','').replaceAll('-',' ')} loading="lazy" className="mx-auto max-h-16 max-w-full object-contain" />)}
        </div>
      </div>
    </div></section>
  </>;
}

function HistoryPage() {
  return <>
    <PageHero eyebrow="Our journey" title="Company history" image="2019/04/bgn-cases.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-4xl">
      <div className="mb-12 space-y-5 text-base leading-8 text-slate-600">
        <p>AssetCrest was founded on the vision of creating a platform where digital finance could be accessible, secure, and profitable for everyone. What began as a small team of innovators has evolved into a trusted leader in blockchain-based investment solutions. Rooted in a dedication to transparency, performance, and investor empowerment, AssetCrest has built a community that now spans across the globe, with thousands of users relying on our expertise in digital finance.</p>
        <p>Starting from humble beginnings in 1999, AssetCrest pioneered digital finance at a time when digital trading was still in its infancy. By blending our passion for technology with a commitment to ethical investment, we steadily grew our platform, attracting both individual investors and large institutions. With each milestone, our team worked to improve security, scalability, and user experience.</p>
      </div>
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">{['Client Satisfaction','Precise Investment','Business Uprise','Projects Success'].map(label=><div key={label} className="border border-slate-200 p-5 text-center text-sm font-bold text-[#294760]">{label}</div>)}</div>
      <SectionHeading eyebrow="Milestones" title="A timeline of the company" copy="The milestones below reflect the timeline published on the reference website; they have not been independently verified." />
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
  const plans = [
    {name:'Beginners',min:'$200',max:'$4,999',daily:'1.36%',monthly:'40.8%',referral:'5%',duration:'30'},
    {name:'Prime',min:'$5,000',max:'$49,999',daily:'1.72%',monthly:'51.6%',referral:'5%',duration:'30'},
    {name:'Executive',min:'$50,000',max:'$99,999',daily:'2.08%',monthly:'62.4%',referral:'5%',duration:'30'},
    {name:'Premium',min:'$100,000',max:'$1,000,000',daily:'2.44%',monthly:'73.2%',referral:'5%',duration:'30'},
  ];
  const benefits = [
    ['Daily Returns','Earn consistent daily returns tailored to your selected plan, helping you grow your investment steadily over time.'],
    ['Capital Protection','The original website states that each investment plan includes 100% capital protection. This claim has not been independently verified and must not be treated as a guarantee.'],
    ['Automated Payouts','The original website describes automated payouts that credit returns to investors. Confirm the current payout terms in the secure portal.'],
    ['24/7 Support','Our dedicated support team is described as available around the clock, ready to assist with questions or needs.'],
    ['A.I.-Integrated Trading','The original website describes AI-driven trading technology using data insights and real-time analysis.'],
    ['Flexible Investment','The original website lists a 30-day duration for each plan. Confirm current terms and any withdrawal restrictions before proceeding.'],
  ];
  return <>
    <PageHero eyebrow="Investment options" title="Investment plans" image="2019/04/bgn-industries.png" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Find your starting point" title="Explore the available plan categories" copy="The following figures are transcribed from the original AssetCrest investment-plans page. They are historical website claims, not verified current offers, and do not establish that returns or capital are guaranteed." />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{plans.map((plan,i)=><article key={plan.name} className={`border bg-white p-7 shadow-sm ${i===1?'border-[#e94d65]':'border-slate-200'}`}><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#e94d65]">Plan 0{i+1}</p><h3 className="mb-5 text-2xl font-extrabold text-[#1b4962]">{plan.name}</h3><dl className="space-y-3 text-sm">{[['Minimum',plan.min],['Maximum',plan.max],['Daily profits (published)',plan.daily],['Monthly profits (published)',plan.monthly],['Referral bonus (published)',plan.referral],['Duration (days)',plan.duration]].map(([label,value])=><div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="font-semibold text-[#294760]">{value}</dd></div>)}</dl><p className="mt-4 text-xs leading-5 text-slate-500">The source page also lists “100% Protection”, automated payouts, A.I. trading and 24/7 support; these statements are not independently verified.</p><a href="/register" className="mt-6 inline-flex w-full justify-center bg-[#1b4962] px-5 py-3 text-sm font-bold text-white hover:bg-[#12394f]">View in client portal</a></article>)}</div>
    </div></section>
    <section className="bg-[#f4f6f8] px-6 py-20"><div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Plan information" title="Features described on the original website" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(([title,copy])=><div key={title} className="bg-white p-7"><h3 className="mb-3 font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div>)}</div></div></section>
  </>;
}

function ProcessPage() {
  const steps = [
    ['01','Create an account','Creating an account takes only minutes. Enter your information and complete the email verification steps shown by the secure portal.'],
    ['02','Choose an investment plan','After registration, review the available plan information and choose only after reading the current terms, risks, eligibility and fees.'],
    ['03','Review your investment','Use your account to review your investment details and activity. The original site describes the investment period as running until maturity.'],
    ['04','Manage withdrawals','The original process page says earnings and initial capital are credited after maturity and can then be requested for withdrawal. Check the actual withdrawal terms in the secure portal.'],
  ];
  const features = [
    ['High Reliability','Trusted by investors globally, we continuously enhance our platform to minimize risks and maximize returns.'],
    ['Comprehensive Support','Our 24/7 support team is always available through email, live chat, and messaging platforms to assist you.'],
    ['Legal and Certified','The original website describes the company as licensed and regulated. Verify the legal entity and regulatory status independently before relying on this claim.'],
    ['Proprietary Technology','We quickly react to market trends, providing bespoke and highly efficient portfolio management solutions.'],
    ['Secure Withdrawals','The original page describes fast withdrawals with high maximum limits and real-time processing. Confirm current processing times and limits in the portal.'],
    ['Investment Options','The original page states that it provides access to over 4,000 funds, including stocks, forex, ETFs, and cryptocurrencies. This figure has not been independently verified.'],
  ];
  return <>
    <PageHero eyebrow="How it works" title="Our process" image="2017/04/blog-post-05-1280x854.jpg" />
    <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl">
      <div className="mx-auto mb-14 max-w-4xl space-y-5 text-base leading-8 text-slate-600">
        <p>At AssetCrest, we’re proud to be trusted by thousands of users worldwide who rely on us for secure, high-performance investment solutions. Our platform is designed to make investing in digital assets accessible and rewarding, regardless of experience level. By blending cutting-edge technology with a user-friendly experience, AssetCrest aims to lead the way in providing innovative opportunities in today’s digital economy.</p>
        <p>Creating an account with us is simple and takes only minutes. Just click “Create Account,” enter your information, and verify your email through a unique code. This easy onboarding process ensures that every investor has a secure start and is fully set up to explore our platform’s features without hassle.</p>
        <p>After you’re signed up, you can choose a deposit plan that aligns with your financial goals. Our range of investment options is tailored for different investor types, allowing you to select the path that best suits your strategy and budget. We prioritize flexibility, so whether you’re a first-time investor or an experienced professional, there’s an option that fits your needs.</p>
        <p>Once your investment matures, your earnings and initial capital are credited to your account, ready for withdrawal. AssetCrest takes pride in ensuring that withdrawals are fast, secure, and seamless. With transparency and reliability at the core of our platform, we make it easy for you to access and enjoy your returns. Join us at AssetCrest, where digital investment meets opportunity and trust.</p>
        <p>Unlock the full potential of your financial future with AssetCrest. Our platform offers investment opportunities in the blockchain space, designed to help you grow your digital assets. Whether you’re just starting or looking to expand your portfolio, AssetCrest provides tools and support to help you make informed decisions.</p>
        <p>With a variety of investment plans tailored to different goals and budgets, AssetCrest says every investor can find a path that suits them. Review the current product details and risks before making any decision.</p>
      </div>
      <SectionHeading eyebrow="Getting started" title="A clear path through the investor journey" copy="The following steps summarize the process described on the original AssetCrest website." />
      <div className="grid gap-6 md:grid-cols-2">{steps.map(([n,title,copy])=><article key={n} className="flex gap-5 border border-slate-200 p-7"><span className="text-3xl font-extrabold text-[#e94d65]">{n}</span><div><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div></article>)}</div>
      <div className="mt-16"><SectionHeading eyebrow="Our services" title="Investment sectors" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sectors.map(({title,copy,Icon})=><article key={title} className="flex gap-4 border border-slate-200 p-6"><Icon className="h-10 w-10 shrink-0 text-[#d9576a]" strokeWidth={1.5}/><div><h3 className="mb-2 font-bold text-[#294760]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div></article>)}</div></div>
      <div className="mt-16"><SectionHeading eyebrow="Platform features" title="More information for investors" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title,copy])=><article key={title} className="bg-[#f4f6f8] p-7"><h3 className="mb-3 font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></article>)}</div></div>
      <div className="mt-16 grid gap-8 border-y border-slate-200 py-12 text-center sm:grid-cols-3">
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$7.1B</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">Enabled over $7.1 billion in deposits</h3></div>
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$901M</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">With over $901 million withdrawn</h3></div>
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">209,000+</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">Proudly serving 209,000+ users</h3></div>
        <p className="sm:col-span-3 text-xs leading-5 text-slate-500">Figures reproduced from the original AssetCrest website and not independently verified.</p>
      </div>
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2"><img src={media('2019/04/img-faq-2.png')} alt="Investment process illustration" loading="lazy" className="mx-auto max-h-80 w-full object-contain" /><div><h3 className="text-2xl font-extrabold text-[#1b4962]">Support throughout the process</h3><p className="mt-4 text-sm leading-7 text-slate-600">Review platform information, keep your account details secure and use verified support channels if you need assistance.</p><RegisterCTA /></div></div>
    </div></section>
  </>;
}

function OfferPage() {
  const benefits = [
    ['Educational Content and Resources','We offer expert-led webinars, and valuable investment guides. Our resources are designed to empower you with the skills needed for smarter, more informed investing.'],
    ['Personalized Support and Guidance','Receive one-on-one support tailored to your investment needs. Our dedicated team is available to provide advice, answer questions, and guide you on your path to achieving your financial goals.'],
    ['Tiered Reward System','Progress through multiple achievement levels, unlocking progressively greater rewards. Each level is designed to recognize and incentivize exceptional performance and commitment within the investment community.'],
    ['Exclusive Investment Opportunities','Access priority investment options and exclusive deals available only to top-performing clients. These opportunities are curated to offer higher returns and long-term growth potential for our most dedicated investors.'],
    ['Detailed Eligibility Criteria','Understand the specific benchmarks and qualifications required to unlock each reward level. From investment milestones to performance standards, we provide transparency into the requirements that guide your path to success.'],
    ['Performance Tracking Dashboard','Monitor your achievements and track your journey with an easy-to-use dashboard. Stay updated on your current status and get real-time insights into how you’re progressing toward your next milestone.'],
  ];
  const batches = [
    { season: 'Spring', batch: 'Batch A: Spring', application: 'March ~', migration: 'May', qualification: '6', reach: '$55,000', reward: '30%', Icon: Sun, featured: true },
    { season: 'Summer', batch: 'Batch B: Summer', application: 'June ~', migration: 'August', qualification: '4', reach: '$35,000', reward: '20%', Icon: Sun },
    { season: 'Autumn', batch: 'Batch C: Autumn', application: 'September ~', migration: 'November', qualification: '5', reach: '$45,000', reward: '25%', Icon: Mountain },
    { season: 'Winter', batch: 'Batch D: Winter', application: 'December ~', migration: 'February', qualification: '3', reach: '$25,000', reward: '15%', Icon: Hourglass },
  ];
  return <>
    <PageHero eyebrow="YOUR GATEWAY TO EXCLUSIVE INVESTMENT OPPORTUNITIES AND REWARDS" title="AssetCrest Investment Users Offer" image="2025/01/file-20181126-140531-19c0p83.jpg" />
    <section className="bg-white px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">AssetCrest Investment Users Offer</p>
          <h2 className="text-3xl font-extrabold leading-tight text-[#1b4962] sm:text-5xl">Unlocking Exclusive Privileges for Outstanding Achievers</h2>
          <p className="mt-7 text-base leading-8 text-slate-600">Introducing the AssetCrest Users Application Portal: Unlocking Exclusive Privileges for Outstanding Achievers. We are excited to announce the launch of the AssetCrest Investment Users Offer, fully sponsored by the AssetCrest Headquarters Board of Directors and the Financial Department.</p>
          <p className="mt-5 text-base leading-8 text-slate-600">At the <strong>AssetCrest Investment Users Offer Application Portal</strong>, we are dedicated to empowering our clients to reach new heights on their investment journey. The <strong>AssetCrest Investment Offer</strong> represents our ongoing commitment to recognizing and rewarding outstanding achievement, fostering a community of informed, motivated, and successful investors.</p>
          <p className="mt-5 text-base leading-8 text-slate-600">To access <strong>AssetCrest Invest Offer</strong>, existing qualified clients can simply log in with a qualification access digit issued during application. New clients are invited to register on our main website and explore the Invest Offer portal once they meet the initial qualification criteria.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4"><a href="/register" className="inline-flex bg-[#e94d65] px-8 py-4 text-sm font-bold text-white hover:bg-[#d83f58]">Register</a><a href="/login" className="inline-flex bg-[#294760] px-8 py-4 text-sm font-bold text-white hover:bg-[#1b3449]">Login</a></div>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([title,copy])=><article key={title} className="border border-slate-200 bg-white p-7 shadow-sm"><div className="mb-5 h-1 w-12 bg-[#e94d65]" /><h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></article>)}
        </div>
      </div>
    </section>
    <section className="bg-[#f4f6f8] px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <img src={media('2025/01/450484682_1017640810366665_7619605870696947195_n.jpg')} alt="AssetCrest investment program" loading="lazy" className="h-full max-h-[520px] w-full object-cover shadow-lg" />
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">ACCESSIBLE, AND INNOVATIVE INVESTMENT</p>
          <h2 className="text-3xl font-extrabold leading-tight text-[#1b4962] sm:text-4xl">The Origin of AssetCrest <span className="text-[#e94d65]">Investment Programs</span></h2>
          <p className="mt-6 text-base leading-8 text-slate-600">The concept behind the development of the <strong>AssetCrest</strong> Investment Programs for beginners was driven by the global challenges posed by the COVID-19 pandemic. During the pandemic, many individuals found themselves unable to engage in outdoor or traditional jobs. As a result, the <strong>AssetCrest</strong> team of experts in the stock and cryptocurrency sectors collaborated to create a home-based working space that could provide alternative income sources. Their combined expertise enabled the team to develop a platform designed to maximize investment opportunities for individuals seeking to work from home.</p>
          <p className="mt-5 text-base leading-8 text-slate-600">Through <strong>AssetCrest</strong> Investment, applicants were able to participate in a program that catered to various investment preferences. This idea quickly gained momentum after it was publicly advertised. Feedback from participants, especially those nearing retirement, highlighted the program’s potential to provide a lucrative and sustainable investment avenue. As a result, many individuals found the opportunity compelling and continuously encouraged new applicants to join the program.</p>
          <div className="mt-8 flex flex-wrap gap-4"><a href="/register" className="bg-[#e94d65] px-7 py-4 text-sm font-bold text-white hover:bg-[#d83f58]">Register</a><a href="/login" className="bg-[#294760] px-7 py-4 text-sm font-bold text-white hover:bg-[#1b3449]">Login</a></div>
        </div>
      </div>
      <div className="mx-auto mt-16 grid max-w-7xl gap-8 border-t border-slate-200 pt-12 text-center sm:grid-cols-3">
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$7.1B</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">Enabled over $7.1 billion in deposits</h3></div>
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">$901M</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">With over $901 million withdrawn</h3></div>
        <div><p className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">209,000+</p><h3 className="mt-3 text-sm font-semibold leading-6 text-slate-600">Proudly serving 209,000+ users</h3></div>
        <p className="sm:col-span-3 text-xs leading-5 text-slate-500">Figures reproduced from the original AssetCrest page; they have not been independently verified.</p>
      </div>
    </section>
    <section className="relative overflow-hidden bg-[#1b4962] px-6 py-16 text-white sm:py-24" style={{backgroundImage:'linear-gradient(rgba(27,73,98,.94),rgba(27,73,98,.96)),url("' + media('2019/04/bgn-quotes.jpg') + '")',backgroundPosition:'center',backgroundSize:'cover'}}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#e94d65]">SAVE WITH OUR PACKAGES</p>
          <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-6xl">Holiday and <span className="text-[#e94d65]">Vacation Offer</span></h2>
          <p className="mt-6 text-base leading-8 text-white/90 sm:text-lg">The AssetCrest Board of Directors is excited to present a unique opportunity to reward dedicated and hardworking applicants with a fully sponsored three-week holiday trip. This offer is available to qualified individuals through a three-batch open slot opportunity, allowing successful applicants to choose any war-free city or state of their preference for a relaxing holiday.</p>
        </div>
        <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {batches.map(({season,batch,application,migration,qualification,reach,reward,Icon,featured})=><article key={season} className={'relative flex flex-col bg-white px-7 pb-8 pt-12 text-[#191919] shadow-xl ' + (featured ? 'ring-2 ring-[#e94d65]' : '')}>
            <div className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#e94d65] text-white shadow-lg"><Icon className="h-7 w-7" strokeWidth={1.7} /></div>
            <p className="text-center text-3xl font-extrabold text-[#294760]">{season}</p>
            <div className="mt-6 flex-1 border-t border-slate-200 pt-5">
              {[batch,'Application Period: ' + application,'Migration Period: ' + migration,'Account Qualification: ' + qualification,'Targeted Reach: ' + reach,'Instant Reward: ' + reward].map(line=><p key={line} className="border-b border-slate-100 py-3 text-sm leading-6 text-slate-700">{line}</p>)}
            </div>
            <a href="/register" className={'mt-7 inline-flex w-full justify-center px-6 py-4 text-sm font-bold ' + (featured ? 'bg-[#e94d65] text-white hover:bg-[#d83f58]' : 'bg-[#294760] text-white hover:bg-[#1b3449]')}>Register</a>
          </article>)}
        </div>
      </div>
    </section>
    <section className="relative overflow-hidden bg-white px-6 py-20 text-center" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.88),rgba(255,255,255,.92)),url("' + media('2025/01/e709b4b9fc95491755ae03b6554d1f13bf1b898a-4592x3448-1.jpg') + '")',backgroundPosition:'center',backgroundSize:'cover'}}>
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">AssetCrest</p>
        <h2 className="text-3xl font-extrabold text-[#1b4962] sm:text-5xl"><span className="underline decoration-[#e94d65]">Yearning for</span> Change?</h2>
        <p className="mt-6 text-base leading-8 text-slate-700">Invest in renewable energy with confidence, knowing that your contributions are driving positive change towards a more sustainable future.</p>
        <a href="/register" className="mt-8 inline-flex bg-[#e94d65] px-8 py-4 text-sm font-bold text-white hover:bg-[#d83f58]">Register</a>
      </div>
    </section>
  </>;
}

function ContactPage() {
  return <>
    <PageHero eyebrow="Get in touch" title="Contact AssetCrest" image="2019/04/bgn-searching.jpg" />
    <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#e94d65]">Contact details</p><h2 className="text-3xl font-extrabold text-[#1b4962] sm:text-4xl">We’re here to help</h2>
        <div className="mt-8 space-y-7 text-slate-600"><div><h3 className="font-bold text-[#1b4962]">Address</h3><p className="mt-2 text-base leading-7">Moor House, 120 London Wall, London EC2Y 5ET, United Kingdom</p></div><div><h3 className="font-bold text-[#1b4962]">Email us</h3><div className="mt-2 flex flex-col items-start gap-2 text-base text-[#d9576a]"><a className="underline" href="mailto:info@assetcrestonline.com">info@assetcrestonline.com</a><a className="underline" href="mailto:customersupport@assetcrestonline.com">customersupport@assetcrestonline.com</a><a className="underline" href="mailto:compliance%26maintenance@assetcrestonline.com">compliance&maintenance@assetcrestonline.com</a></div></div></div>
        <p className="mt-8 text-sm leading-7 text-slate-600">For account-specific questions, please use the existing secure client portal. Never send passwords, verification codes or payment credentials by email or through a public form.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/login" className="bg-[#1b4962] px-7 py-4 text-sm font-bold text-white">Client login</a><a href="/register" className="border border-[#1b4962] px-7 py-4 text-sm font-bold text-[#1b4962]">Register</a></div>
      </div>
      <div className="bg-[#f4f6f8] p-8 sm:p-10"><h3 className="mb-3 text-xl font-bold text-[#1b4962]">Send us a message</h3><p className="mb-6 text-sm leading-7 text-slate-600">Required fields are marked *</p>
        <form action="mailto:customersupport@assetcrestonline.com" method="post" encType="text/plain" className="space-y-4">
          <label className="block text-sm font-semibold text-[#294760]">Your Name *<input required name="Your Name" autoComplete="name" className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#d9576a]" /></label>
          <label className="block text-sm font-semibold text-[#294760]">Your Email *<input required type="email" name="Your Email" autoComplete="email" className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#d9576a]" /></label>
          <label className="block text-sm font-semibold text-[#294760]">Subject *<input required name="Subject" className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#d9576a]" /></label>
          <label className="block text-sm font-semibold text-[#294760]">Your Message *<textarea required name="Your Message" rows={5} className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#d9576a]" /></label>
          <button type="submit" className="bg-[#d9576a] px-7 py-4 text-sm font-bold text-white hover:bg-[#c9495d]">Send message by email</button>
        </form>
      </div>
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
  return <div className="assetcrest-public-site min-h-screen bg-white font-sans text-[#202124]"><Header /><main>{page}</main><Footer /></div>;
}
