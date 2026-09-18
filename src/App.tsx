/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AssetCrest Gateway</h1>
        <p className="mt-3 text-slate-600 text-sm leading-relaxed">
          High-fidelity reverse proxy and gateway service for AssetCrest platform.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-[#1b4962] hover:bg-[#143547] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Launch AssetCrest
          </a>
        </div>
      </div>
    </div>
  );
}
