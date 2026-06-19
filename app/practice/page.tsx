"use client";

import Link from "next/link";
import AnimateWrapper from "@/components/AnimateWrapper";
import {
  ArrowRight,
  ClipboardList,
  Sparkles,
  ChevronRight,
  Sliders,
} from "lucide-react";

export default function Practice() {
  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <AnimateWrapper delay={0.1}>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4 leading-tight">
            Lựa chọn{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600">
              Chế độ Luyện tập
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Cá nhân hóa lộ trình học thông qua làm đề thi chuẩn hoặc tập trung rèn luyện các Part còn yếu.
          </p>
        </AnimateWrapper>
      </div>

      {/* Main Grid: Modes selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Mode 1: Full Test Card */}
        <AnimateWrapper delay={0.2}>
          <div className="group relative overflow-hidden bg-white/80 border border-white/20 backdrop-blur-sm p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between h-full hover:shadow-md hover:border-purple-200/50 hover:-translate-y-1 cursor-pointer">
            {/* Entire card clickable link */}
            <Link
              href="/practice/full-test"
              className="absolute inset-0 rounded-3xl z-10"
              aria-label="Luyện theo đề (Full Test)"
            />

            {/* Blurry gradient background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl shrink-0 group-hover:bg-purple-100/80 transition-colors">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                  100 câu hỏi • 45 phút
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-2">
                Luyện theo đề (Full Test)
                <Sparkles className="h-4 w-4 text-amber-500" />
              </h2>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                Trải nghiệm quy trình thi thật: Nghe liên tục 4 phần từ Part 1 đến Part 4 trong một đề thi TOEIC chuẩn. Hệ thống sẽ tự động chấm điểm và hiển thị transcript sau khi nộp bài để bạn sửa lỗi nghe chép.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-20 pointer-events-none">
              <span className="text-xs text-slate-400">Dành cho việc kiểm tra toàn diện</span>
              <span className="px-6 py-2.5 rounded-full text-xs font-semibold bg-purple-600 text-white shadow-sm hover:bg-purple-700 transition-all flex items-center gap-1.5 hover:shadow group-hover:scale-105 cursor-pointer">
                Bắt đầu ngay
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </AnimateWrapper>

        {/* Mode 2: Custom Practice Card */}
        <AnimateWrapper delay={0.3}>
          <div className="group relative overflow-hidden bg-white/80 border border-white/20 backdrop-blur-sm p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between h-full hover:shadow-md hover:border-purple-200/50 hover:-translate-y-1 cursor-pointer">
            {/* Entire card clickable link */}
            <Link
              href="/practice/custom-practice"
              className="absolute inset-0 rounded-3xl z-10"
              aria-label="Luyện theo Part (Custom Practice)"
            />

            {/* Blurry gradient background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 group-hover:bg-indigo-100/80 transition-colors">
                  <Sliders className="h-8 w-8" />
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100">
                  Luyện theo Part • Tự chọn
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Luyện theo Part (Custom Practice)
              </h2>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                Lựa chọn luyện tập trung vào từng Part cụ thể đang là điểm yếu của bạn. Hỗ trợ tùy chỉnh tốc độ nghe, phím tắt thông minh và lặp câu để rèn luyện kỹ năng nghe chép chính tả chuyên sâu.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-20 pointer-events-none">
              <span className="text-xs text-slate-400">Dành cho học chuyên sâu từng phần</span>
              <span className="px-6 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5 hover:shadow group-hover:scale-105 cursor-pointer">
                Chọn Part
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </AnimateWrapper>
      </div>
    </div>
  );
}
