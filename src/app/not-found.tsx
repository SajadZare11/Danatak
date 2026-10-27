import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900">صفحه مورد نظر یافت نشد (۴۰۴)</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          صفحه‌ای که به دنبال آن بودید یافت نشد یا ممکن است جابجا شده باشد.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
