import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Headphones, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import AnimateWrapper from "@/components/AnimateWrapper";

interface PageProps {
  params: Promise<{
    testId: string;
  }>;
}

export default async function TestModeSelectionPage({ params }: PageProps) {
  const { testId } = await params;
  const supabase = await createClient();

  // Fetch test details
  const { data: testData, error: testError } = await supabase
    .from("tests")
    .select(`
      title,
      books (
        title
      ),
      question_groups (
        part_type,
        questions (
          id
        )
      )
    `)
    .eq("id", testId)
    .maybeSingle();

  if (testError || !testData) {
    redirect("/practice/full-test");
  }

  // Count questions in listening vs reading parts
  let listeningQuestions = 0;
  let readingQuestions = 0;

  if (testData.question_groups) {
    (testData.question_groups as unknown as { questions: { id: string }[] | null; part_type: string }[]).forEach((group) => {
      const qCount = group.questions ? group.questions.length : 0;
      if (["part_1", "part_2", "part_3", "part_4"].includes(group.part_type)) {
        listeningQuestions += qCount;
      } else if (["part_5", "part_6", "part_7"].includes(group.part_type)) {
        readingQuestions += qCount;
      }
    });
  }

  // Fallbacks if database is currently empty for some parts
  if (listeningQuestions === 0) listeningQuestions = 100;
  if (readingQuestions === 0) readingQuestions = 100;

  const bookTitle = testData.books
    ? (testData.books as unknown as { title: string }).title
    : "ETS Book";

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Back Link */}
      <AnimateWrapper delay={0.05} className="mb-6">
        <Link
          href="/practice/full-test"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách đề thi
        </Link>
      </AnimateWrapper>

      {/* Header Info */}
      <AnimateWrapper delay={0.1} className="mb-10">
        <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
              {bookTitle}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
              Chế độ Luyện đề
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{testData.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chọn một trong ba phương án dưới đây để bắt đầu làm bài thi thử.
          </p>
        </div>
      </AnimateWrapper>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mode 1: Listening Only */}
        <AnimateWrapper delay={0.15}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full hover:border-purple-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 rounded-full bg-purple-500/5 blur-xl"></div>
            <div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Luyện Listening</h3>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">
                Phần 1 - 4 • {listeningQuestions} câu hỏi
              </p>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                Tập trung rèn luyện kỹ năng nghe chép, phản xạ âm thanh với 4 Part Listening liên tục trong 45 phút. Áp dụng luật thi thật: Không tạm dừng/tua.
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                45 phút
              </span>
              <Link
                href={`/practice/full-test/${testId}/run?mode=listening`}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
              >
                Vào làm
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </AnimateWrapper>

        {/* Mode 2: Reading Only */}
        <AnimateWrapper delay={0.2}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full hover:border-purple-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl"></div>
            <div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Luyện Reading</h3>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">
                Phần 5 - 7 • {readingQuestions} câu hỏi
              </p>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                Rèn luyện khả năng đọc hiểu, ngữ pháp và từ vựng với các phần Part 5, 6, 7 trong 75 phút. Cho phép tự do chuyển câu và quản lý thời gian linh hoạt.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                75 phút
              </span>
              <Link
                href={`/practice/full-test/${testId}/run?mode=reading`}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Vào làm
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </AnimateWrapper>

        {/* Mode 3: Combined Full Test */}
        <AnimateWrapper delay={0.25}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full hover:border-purple-200/50 relative overflow-hidden group border-purple-100 bg-purple-50/10">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 rounded-full bg-purple-500/10 blur-xl"></div>
            <div>
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl w-fit mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Làm Full Test</h3>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">
                Trọn bộ 7 Parts • {listeningQuestions + readingQuestions} câu
              </p>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                Đánh giá toàn diện năng lực bản thân với đề thi tích hợp đầy đủ cả Listening và Reading trong 120 phút. Trải nghiệm áp lực phòng thi thật 100%.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                120 phút
              </span>
              <Link
                href={`/practice/full-test/${testId}/run?mode=full`}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
              >
                Bắt đầu thi
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </AnimateWrapper>
      </div>
    </div>
  );
}
