import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import AnimateWrapper from "@/components/AnimateWrapper";
import { ArrowLeft, ClipboardList, Sparkles, ArrowRight } from "lucide-react";

interface FullTestQueryResult {
  id: string;
  title: string;
  books: {
    id: string;
    title: string;
  } | null;
  question_groups: {
    questions: {
      id: string;
    }[] | null;
  }[] | null;
}

export default async function FullTestSelectionPage() {
  const supabase = await createClient();

  // Fetch tests with related books and question counts
  const { data: tests, error } = await supabase
    .from("tests")
    .select(`
      id,
      title,
      books (
        id,
        title
      ),
      question_groups (
        questions (
          id
        )
      )
    `);

  if (error) {
    console.error("Error fetching full tests:", error);
  }

  // Calculate total questions dynamically for each test
  const testsList = tests
    ? (tests as unknown as FullTestQueryResult[]).map((test) => {
        let totalQuestions = 0;
        if (test.question_groups) {
          test.question_groups.forEach((group) => {
            if (group.questions) {
              totalQuestions += group.questions.length;
            }
          });
        }
        return {
          testId: test.id,
          testTitle: test.title,
          bookTitle: test.books ? test.books.title : "ETS Book",
          totalQuestions,
        };
      })
    : [];

  // Sort tests by book title and then test title
  testsList.sort((a, b) => {
    const bookCompare = a.bookTitle.localeCompare(b.bookTitle);
    if (bookCompare !== 0) return bookCompare;
    return a.testTitle.localeCompare(b.testTitle);
  });

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Back Link */}
      <AnimateWrapper delay={0.05} className="mb-6">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chọn chế độ
        </Link>
      </AnimateWrapper>

      {/* Header Info */}
      <AnimateWrapper delay={0.1} className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl shrink-0 mt-1">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                Đánh giá năng lực thực tế
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Luyện đề thi thử (Full Test)</h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
                Làm trọn vẹn cả 4 phần Listening chuẩn format TOEIC liên tục trong 45 phút. Rèn luyện sự tập trung cao độ, khả năng quản lý thời gian và phân tích transcript chép chính tả chi tiết sau khi nộp bài.
              </p>
            </div>
          </div>
        </div>
      </AnimateWrapper>

      {/* Test List Section */}
      <div className="space-y-6">
        <AnimateWrapper delay={0.15}>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            Danh sách đề thi Full Test ({testsList.length} đề khả dụng)
          </h2>
        </AnimateWrapper>

        {testsList.length === 0 ? (
          <AnimateWrapper delay={0.2}>
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-12 rounded-3xl text-center shadow-xs">
              <span className="text-3xl">📭</span>
              <h3 className="text-base font-bold text-slate-900 mt-4">Chưa có đề thi thử nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Đang chuẩn bị dữ liệu đề thi trọn bộ. Vui lòng quay lại sau!
              </p>
            </div>
          </AnimateWrapper>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {testsList.map((test, index) => (
              <AnimateWrapper key={test.testId} delay={0.2 + index * 0.05}>
                <div className="cursor-pointer group relative bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-purple-200/50 flex flex-col justify-between h-full">
                  {/* Make the entire card clickable by absolute overlay Link */}
                  <Link
                    href={`/practice/full-test/${test.testId}`}
                    className="absolute inset-0 rounded-2xl z-10"
                    aria-label={`Thi thử ${test.testTitle}`}
                  />
                  
                  <div className="relative z-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                        {test.bookTitle}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-100 uppercase">
                        45 phút
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950 group-hover:text-purple-600 transition-colors">
                      {test.testTitle}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                      Bài thi thử đầy đủ gồm cả 4 phần Listening. Sau khi làm bài xong bạn có thể chuyển sang nghe chép chính tả tất cả các câu sai.
                    </p>

                    <div className="flex gap-4 mt-4 text-xs text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 text-sm">{test.totalQuestions || 100}</span>
                        <span>Tổng số câu hỏi</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end relative z-20 pointer-events-none">
                    <span
                      className="text-xs font-semibold text-purple-600 group-hover:text-purple-700 flex items-center gap-1"
                    >
                      Bắt đầu thi thử
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </AnimateWrapper>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
