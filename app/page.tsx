import Link from "next/link";
import AnimateWrapper from "@/components/AnimateWrapper";
import { ArrowRight, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-grow flex flex-col justify-center items-center">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <AnimateWrapper delay={0.1}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100 mb-6">
            <Award className="h-3.5 w-3.5" />
            Phương pháp học Dictation tối ưu cho phần Listening trong đề thi TOEIC
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-4xl mx-auto leading-[1.15] mb-6">
            Chinh phục <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600">TOEIC Listening</span> bằng Nghe Chép Chính Tả
          </h1>
        </AnimateWrapper>

        <AnimateWrapper delay={0.2}>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed mb-8">
            Ứng dụng chuyên sâu giúp bạn tăng khả năng nhận diện phát âm, nuốt âm, nối âm và mở rộng vốn từ vựng thông qua lộ trình học 2 bước: kiểm tra trắc nghiệm kết hợp nghe chép chính tả chi tiết.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/practice"
              className="px-8 py-3.5 rounded-full text-sm font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            >
              Bắt đầu luyện tập
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </AnimateWrapper>
      </section>
    </div>
  );
}
