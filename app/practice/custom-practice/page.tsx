"use client";

import Link from "next/link";
import AnimateWrapper from "@/components/AnimateWrapper";
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  BookOpen,
  Clock,
  Activity,
  Award,
} from "lucide-react";

export default function CustomPracticeSelection() {
  const parts = [
    {
      id: "part-1",
      number: "Part 1",
      title: "Photographs (Tranh tả cảnh)",
      desc: "Luyện nghe và chép lại các câu mô tả ngắn kết hợp xem hình ảnh trực quan sinh động.",
      icon: <Headphones className="h-6 w-6 text-purple-500" />,
      tag: "Dễ",
      stats: "6 bài học",
    },
    {
      id: "part-2",
      number: "Part 2",
      title: "Question-Response (Hỏi - Đáp)",
      desc: "Luyện phản xạ chép nhanh câu hỏi và 3 lựa chọn trả lời, tập trung nhận diện các dạng từ để hỏi.",
      icon: <BookOpen className="h-6 w-6 text-indigo-500" />,
      tag: "Trung bình",
      stats: "12 bài học",
    },
    {
      id: "part-3",
      number: "Part 3",
      title: "Conversations (Hội thoại)",
      desc: "Thử thách chép đoạn hội thoại dài 2-3 người. Hỗ trợ tính năng chia nhỏ và lặp từng lượt thoại.",
      icon: <Clock className="h-6 w-6 text-pink-500" />,
      tag: "Khó",
      stats: "8 bài học",
    },
    {
      id: "part-4",
      number: "Part 4",
      title: "Talks (Bài nói độc thoại)",
      desc: "Chép các bài nói độc thoại ngắn (tin tức, thông báo). Rèn luyện khả năng ghi nhớ thông tin dài.",
      icon: <Activity className="h-6 w-6 text-rose-500" />,
      tag: "Khó",
      stats: "8 bài học",
    },
  ];

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Back to practice menu link */}
      <AnimateWrapper delay={0.05} className="mb-6">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chế độ luyện tập
        </Link>
      </AnimateWrapper>

      {/* Part Title Header */}
      <AnimateWrapper delay={0.1} className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-indigo-50 rounded-2xl shrink-0 mt-1">
              <Award className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Luyện theo Part (Custom Practice)
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Lựa chọn Part luyện nghe chép chính tả
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
                Tập trung cải thiện các kỹ năng nghe theo từng dạng bài của đề thi TOEIC. Chọn một phần bên dưới để tiếp tục chọn đề bài tập.
              </p>
            </div>
          </div>
        </div>
      </AnimateWrapper>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parts.map((part, index) => (
          <AnimateWrapper key={part.id} delay={0.15 + index * 0.05}>
            <div className="cursor-pointer group relative bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-indigo-100/50 flex flex-col justify-between h-full">
              {/* Make the entire card clickable by absolute overlay Link */}
              <Link
                href={`/practice/${part.id}`}
                className="absolute inset-0 rounded-2xl z-10"
                aria-label={`Luyện tập ${part.number}`}
              />

              <div className="relative z-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300">
                      {part.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {part.number}
                      </span>
                      <h4 className="text-base font-bold text-slate-950 mt-0.5">{part.title}</h4>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      part.tag === "Dễ"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : part.tag === "Trung bình"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {part.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">{part.desc}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto relative z-20 pointer-events-none">
                <span className="text-xs text-slate-500 font-medium">{part.stats}</span>
                <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                  Luyện tập ngay
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </AnimateWrapper>
        ))}
      </div>
    </div>
  );
}
