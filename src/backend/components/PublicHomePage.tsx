import React from 'react';

function AssetCrestLogo() {
  return (
    <a href="/" aria-label="AssetCrest home" className="inline-flex items-center gap-3">
      <svg viewBox="0 0 88 78" role="img" aria-label="AssetCrest" className="h-14 w-16 shrink-0">
        <polygon points="22,2 60,2 82,39 60,76 22,76 1,39" fill="#a51f35" />
        <polygon points="22,2 41,2 22,39 1,39" fill="#d64253" />
        <polygon points="41,2 60,2 82,39 60,39" fill="#4d101b" />
        <polygon points="22,76 1,39 22,39 41,58 60,39 82,39 60,76" fill="#7f1729" />
        <polygon points="22,39 41,18 60,39 49,39 41,31 33,39" fill="#ffffff" />
        <polygon points="22,39 33,39 41,53 49,39 60,39 41,68" fill="#ffffff" />
      </svg>
      <span className="text-[clamp(1.6rem,4vw,2.7rem)] font-bold tracking-[-0.055em] text-[#a83a4b]">ASSETCREST</span>
    </a>
  );
}

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-white text-[#17191d]">
      <header className="relative z-10 flex h-[112px] items-center justify-center border-b border-slate-200 bg-white px-5 sm:h-[142px]">
        <AssetCrestLogo />
      </header>

      <section className="relative isolate flex min-h-[calc(100svh-112px)] items-center overflow-hidden bg-[#edf0f2] px-6 py-16 sm:min-h-[calc(100svh-142px)] sm:px-10 lg:px-[7%]">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_76%_34%,rgba(255,255,255,0.98)_0%,rgba(248,248,248,0.92)_34%,transparent_66%),linear-gradient(115deg,#e7e8e8_0%,#f8f8f8_48%,#d9e0e7_100%)]" />
        <div aria-hidden="true" className="absolute -right-20 top-12 -z-10 h-[70%] w-[54%] rounded-[48%] bg-white/45 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 left-[18%] -z-10 h-[55%] w-[42%] rounded-full bg-[#9eacb9]/30 blur-3xl" />

        <div className="mx-auto w-full max-w-[1120px]">
          <div className="max-w-[790px]">
            <div className="mb-8 flex items-center gap-5 sm:mb-10">
              <span className="h-[4px] w-24 shrink-0 bg-[#d85a6b] sm:w-36" />
              <p className="max-w-[520px] text-[1.05rem] font-medium uppercase leading-[1.2] tracking-[0.015em] sm:text-[1.55rem]">
                Cutting-edge blockchain solutions!
              </p>
            </div>

            <h1 className="max-w-[760px] text-[clamp(3.5rem,9vw,7.4rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-[#294760]">
              Unlock<br />Financial<br /><span className="text-[#d9576a]">Growth</span>
            </h1>

            <p className="mt-8 max-w-[760px] text-[clamp(1.15rem,2.8vw,2rem)] leading-[1.55] text-[#202124] sm:mt-10">
              Step into the future of finance with blockchain-enabled investments. Discover tools designed to drive growth, transparency, and security, making every opportunity work harder for you.
            </p>

            <div className="mt-12 flex flex-wrap gap-4 sm:mt-16">
              <a
                href="/register"
                className="inline-flex min-h-[62px] min-w-[168px] items-center justify-center bg-[#d9576a] px-8 py-4 text-lg font-bold text-white shadow-[0_5px_0_rgba(135,43,59,0.18)] transition hover:bg-[#c9495d] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#d9576a]"
              >
                Register
              </a>
              <a
                href="/login"
                className="inline-flex min-h-[62px] min-w-[150px] items-center justify-center bg-[#294760] px-8 py-4 text-lg font-bold text-white shadow-[0_5px_0_rgba(22,43,61,0.2)] transition hover:bg-[#203a50] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#294760]"
              >
                Login
              </a>
            </div>
          </div>
        </div>

        <span aria-hidden="true" className="absolute right-[8%] top-[55%] h-7 w-7 rounded-full bg-[#d9576a]" />
        <a
          href="/login"
          aria-label="Open AssetCrest account"
          className="absolute bottom-8 right-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#3999d8] shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#3999d8] sm:bottom-10 sm:right-10"
        >
          <span className="h-9 w-9 rounded-br-[1.3rem] rounded-tl-[1.3rem] bg-white" />
        </a>
      </section>
    </main>
  );
}
