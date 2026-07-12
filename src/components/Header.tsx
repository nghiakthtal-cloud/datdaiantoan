import { ShieldCheck, Layers, Landmark } from "lucide-react";

export default function Header() {
  return (
    <header id="app-header" className="border-b border-slate-150 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-1.5">
              Smart GCN <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">AI OCR</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Hệ thống trích xuất & So khớp Sổ Đỏ tự động</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xác thực an toàn bằng Gemini 1.5/2.0 API</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg font-medium">
            <Layers className="w-4 h-4" />
            <span>Chính xác cao</span>
          </div>
        </div>
      </div>
    </header>
  );
}
