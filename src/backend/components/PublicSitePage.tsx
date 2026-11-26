import React, { useEffect, useState } from 'react';

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
  ['Forex Trading', 'Explore the foreign-exchange market and the role of currency movements in a diversified investment strategy.'],
  ['Cryptocurrency Mining', 'Learn how proof-of-work networks use computing power to validate transactions and secure blockchain systems.'],
  ['Medical Cannabis', 'Explore the medical-cannabis sector and the importance of transparent supply chains and responsible operations.'],
  ['Real Estate Investments', 'Discover property investment themes, real assets and the factors that can influence long-term property value.'],
  ['Gold Mining', 'Understand gold production and the role precious metals can play in a diversified portfolio.'],
  ['Oil & Gas', 'Explore the energy market, including the forces that influence oil and gas supply, demand and pricing.'],
  ['Renewable Energy', 'Discover projects and technologies across solar, wind and hydroelectric energy.'],
  ['Green Hydrogen', 'Learn about renewable-powered hydrogen production and its potential role in lower-carbon energy systems.'],
  ['Energy Trading', 'Explore energy markets and the systems used to track and trade energy and environmental attributes.'],
];

const principles = [
  ['Cutting-Edge Security', 'Security should be built into every stage of a digital financial experience.'],
  ['Professional Expertise', 'Clear information and informed support help investors understand the opportunities they explore.'],
  ['Transparency', 'We aim to make product information, processes and relevant risks clear and accessible.'],
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
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';
  return (
    <header className="relative z-30 bg-white text-[#1b4962] shadow-sm">
      <div className="hidden border-b border-slate-100 bg-[#f7f8fa] text-xs text-slate-600 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <span>Monday - Friday · 8AM - 9PM</span>
          <span>Moor House, 120 London Wall, London EC2Y 5ET, United Kingdom</span>
          <span>Visit our social pages</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Logo />
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 text-2xl md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? '×' : '☰'}
        </button>
        <div className="hidden items-center gap-7 md:flex">
          <nav aria-label="Main navigation" className="flex items-center gap-5 lg:gap-7">
            {navItems.map(item => {
              const active = pathname === item.href.replace(/\/+$/, '') || (item.href === '/' && pathname === '/');
              return <a key={item.href} href={item.href} className={`text-sm font-semibold transition hover:text-[#e94d65] ${active ? 'text-[#e94d65]' : 'text-[#1b4962]'}`}>{item.label}</a>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            <a href="/register" className="bg-[#e94d65] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d83f58]">Register</a>
            <a href="/login" className="bg-[#1b4962] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12394f]">Login</a>
          </div>
        </div>
      </div>
      {menuOpen && <div className="border-t border-slate-100 bg-white px-5 pb-5 md:hidden">
        <nav aria-label="Mobile navigation" className="grid gap-1 py-3">
          {navItems.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-slate-100 py-3 text-sm font-semibold">{item.label}</a>)}
        </nav>
        <div className="grid grid-cols-2 gap-2 pt-3">
          <a href="/register" className="bg-[#e94d65] px-4 py-3 text-center text-sm font-bold text-white">Register</a>
          <a href="/login" className="bg-[#1b4962] px-4 py-3 text-center text-sm font-bold text-white">Login</a>
        </div>
      </div>}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#172d40] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="mb-5 inline-flex bg-white p-2"><Logo /></div>
          <p className="max-w-xs text-sm leading-7 text-slate-300">A digital-finance experience focused on accessible information, technology and investor resources.</p>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Explore</h3>
          <div className="grid gap-3 text-sm text-slate-300">{navItems.map(item => <a key={item.href} href={item.href} className="hover:text-white">{item.label}</a>)}</div>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Account</h3>
          <div className="grid gap-3 text-sm text-slate-300"><a href="/register" className="hover:text-white">Create an account</a><a href="/login" className="hover:text-white">Client login</a><a href="/app" className="hover:text-white">Investor portal</a></div>
        </div>
        <div>
          <h3 className="mb-4 text-base font-bold">Contact</h3>
          <p className="text-sm leading-7 text-slate-300">For account assistance, sign in to the secure client portal or use the support channel provided by the company.</p>
          <a href="/login" className="mt-4 inline-flex border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-[#172d40]">Contact support</a>
        </div>
      </div>
      <div className="border-t border-white/15 px-6 py-5 text-center text-xs text-slate-300">© {new Date().getFullYear()} AssetCrest. All rights reserved.</div>
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
  useEffect(() => {
    const id = window.setInterval(() => setSlide(current => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(id);
  }, []);
  const current = slides[slide];
  return <>
    <section className="relative isolate min-h-[650px] overflow-hidden bg-[#dfe5e9] sm:min-h-[720px]">
      {slides.map((item, index) => <div key={item.image} aria-hidden={index !== slide} className={`absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-700 ${index === slide ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94) 0%,rgba(255,255,255,.84) 44%,rgba(255,255,255,.18) 100%),url("${media(item.image)}")` }} />)}
      <div className="mx-auto flex min-h-[650px] max-w-7xl items-center px-6 py-20 sm:min-h-[720px]">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-5"><span className="h-1 w-24 bg-[#e94d65] sm:w-36" /><p className="max-w-xl text-sm font-semibold uppercase leading-snug tracking-wide text-[#191919] sm:text-xl">{current.eyebrow}</p></div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-.055em] text-[#294760] sm:text-7xl lg:text-8xl">{current.title}<br /><span className="text-[#d9576a]">{current.accent}</span></h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#202124] sm:text-xl sm:leading-9">{current.copy}</p>
          <RegisterCTA />
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3" aria-label="Choose homepage slide">
        {slides.map((item, index) => <button key={item.image} type="button" onClick={() => setSlide(index)} aria-label={`Show slide ${index + 1}`} aria-pressed={slide === index} className={`h-3 w-3 rounded-full border-2 border-[#e94d65] ${slide === index ? 'bg-[#e94d65]' : 'bg-white'}`} />)}
      </div>
    </section>

    <section className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Why AssetCrest" title="A considered approach to digital finance" copy="Explore information about digital assets, markets and investment themes, supported by a platform designed to make the investor journey easier to navigate." />
        <div className="grid gap-6 md:grid-cols-3">
          {principles.map(([title, copy], i) => <article key={title} className="border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center bg-[#fff0f2] text-2xl font-bold text-[#e94d65]">{['01','02','03'][i]}</div>
            <h3 className="mb-3 text-xl font-bold text-[#1b4962]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="bg-[#f4f6f8] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Future of Finance" title="Explore the sectors shaping tomorrow" copy="AssetCrest's published overview spans traditional markets, digital assets, real assets and emerging energy technologies." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map(([title, copy], i) => <article key={title} className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="h-1.5 bg-[#e94d65]" /><div className="p-7"><span className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-[#edf3f6] text-sm font-extrabold text-[#1b4962]">0{i+1}</span><h3 className="mb-3 text-lg font-bold text-[#1b4962] group-hover:text-[#e94d65]">{title}</h3><p className="text-sm leading-7 text-slate-600">{copy}</p></div>
          </article>)}
        </div>
        <div className="mt-10 text-center"><a href="/investment-plans/" className="inline-flex bg-[#1b4962] px-7 py-4 text-sm font-bold text-white hover:bg-[#12394f]">Explore investment plans</a></div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#1b4962] px-6 py-20 text-white sm:py-24" style={{ backgroundImage: `linear-gradient(90deg,rgba(20,55,78,.94),rgba(20,55,78,.88)),url("${media('2019/04/bgn-experience.png')}")` }}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#ff8798]">Growing with our clients</p><h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">A platform built around the investor journey</h2><p className="mt-6 text-base leading-8 text-slate-200">Explore digital finance with accessible information, clear navigation and tools designed to help you understand the markets and manage your account.</p><RegisterCTA /></div>
        <img src={media('2019/04/img-experience.png')} alt="AssetCrest digital finance experience" loading="lazy" className="mx-auto max-h-[390px] w-full max-w-lg object-contain" />
      </div>
    </section>

    <section className="bg-white px-6 py-20 sm:py-24"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Get started" title="Your next step starts here" copy="Create an account to access the client portal, or sign in if you already have an account."/><div className="flex flex-wrap justify-center gap-3"><a href="/register" className="bg-[#e94d65] px-8 py-4 font-bold text-white hover:bg-[#d83f58]">Create an account</a><a href="/login" className="bg-[#1b4962] px-8 py-4 font-bold text-white hover:bg-[#12394f]">Client login</a></div></div></section>
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
