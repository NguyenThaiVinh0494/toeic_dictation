import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import AnimateWrapper from "@/components/AnimateWrapper";
import { ArrowLeft, Headphones, BookOpen, Clock, Activity, ArrowRight, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    partId: string;
  }>;
}

// Map partId to display titles and icons
const partMeta: Record<
  string,
  { title: string; desc: string; icon: React.ReactNode; color: string; bg: string }
> = {
  "part-1": {
    title: "Part 1: Photographs (Tranh tả cảnh)",
    desc: "Luyện nghe và chép lại các câu mô tả ngắn kết hợp xem hình ảnh trực quan sinh động.",
    icon: <Headphones className="h-6 w-6 text-purple-600" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  "part-2": {
    title: "Part 2: Question-Response (Hỏi - Đáp)",
    desc: "Luyện phản xạ chép nhanh câu hỏi và 3 lựa chọn trả lời, tập trung nhận diện các dạng từ để hỏi.",
    icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  "part-3": {
    title: "Part 3: Conversations (Hội thoại)",
    desc: "Thử thách chép đoạn hội thoại dài 2-3 người. Hỗ trợ tính năng chia nhỏ và lặp từng lượt thoại.",
    icon: <Clock className="h-6 w-6 text-pink-600" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  "part-4": {
    title: "Part 4: Talks (Bài nói độc thoại)",
    desc: "Chép các bài nói độc thoại ngắn (tin tức, thông báo). Rèn luyện khả năng ghi nhớ thông tin dài.",
    icon: <Activity className="h-6 w-6 text-rose-600" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
};

interface GroupQueryResult {
  id: string;
  test_id: string;
  part_type: string;
  tests: {
    id: string;
    title: string;
    books: {
      id: string;
      title: string;
    } | null;
  } | null;
  questions: {
    id: string;
  }[] | null;
}

export default async function PartSelectionPage({ params }: PageProps) {
  const { partId } = await params;
  const normalizedPartId = partId.startsWith("part-") ? partId : `part-${partId}`;
  const meta = partMeta[normalizedPartId];

  // If the part ID is invalid, redirect to practice home
  if (!meta) {
    redirect("/practice");
  }

  // Convert partId to match Supabase database format (e.g. part-1 -> part_1)
  const dbPartType = normalizedPartId.replace("-", "_");

  // Fetch question groups with related test and book info
  const supabase = await createClient();
  const { data: groups, error } = await supabase
    .from("question_groups")
    .select(`
      id,
      test_id,
      part_type,
      tests (
        id,
        title,
        books (
          id,
          title
        )
      ),
      questions (
        id
      )
    `)
    .eq("part_type", dbPartType);

  if (error) {
    console.error("Error fetching exercises:", error);
  }

  // Aggregate question groups by test in JS
  const testMap: Record<
    string,
    {
      testId: string;
      testTitle: string;
      bookTitle: string;
      totalGroups: number;
      totalQuestions: number;
    }
  > = {};

  if (groups) {
    (groups as unknown as GroupQueryResult[]).forEach((group) => {
      const test = group.tests;
      if (!test) return;
      const book = test.books;
      if (!book) return;

      const testId = test.id;
      const questionsCount = group.questions ? group.questions.length : 0;

      if (!testMap[testId]) {
        testMap[testId] = {
          testId,
          testTitle: test.title,
          bookTitle: book.title,
          totalGroups: 0,
          totalQuestions: 0,
        };
      }

      testMap[testId].totalGroups += 1;
      testMap[testId].totalQuestions += questionsCount;
    });
  }

  const testsList = Object.values(testMap).sort((a, b) => {
    // Sort primarily by book title, then test title
    const bookCompare = a.bookTitle.localeCompare(b.bookTitle);
    if (bookCompare !== 0) return bookCompare;
    return a.testTitle.localeCompare(b.testTitle);
  });

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Back to practice menu link */}
      <AnimateWrapper delay={0.05} className="mb-6">
        <Link
          href="/practice/custom-practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chọn Part
        </Link>
      </AnimateWrapper>

      {/* Part Title Header */}
      <AnimateWrapper delay={0.1} className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 ${meta.bg} rounded-2xl shrink-0 mt-1`}>
              {meta.icon}
            </div>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
                Cải thiện kỹ năng chuyên sâu
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{meta.title}</h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">{meta.desc}</p>
            </div>
          </div>
        </div>
      </AnimateWrapper>

      {/* Exercises List */}
      <div className="space-y-6">
        <AnimateWrapper delay={0.15}>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            Danh sách bài tập ({testsList.length} đề khả dụng)
          </h2>
        </AnimateWrapper>

        {testsList.length === 0 ? (
          <AnimateWrapper delay={0.2}>
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-12 rounded-3xl text-center shadow-xs">
              <span className="text-3xl">📭</span>
              <h3 className="text-base font-bold text-slate-900 mt-4">Chưa có bài tập cho phần này</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Hệ thống đang cập nhật dữ liệu câu hỏi nghe chép chính tả cho Part này. Vui lòng quay lại sau hoặc thử các Part khác.
              </p>
            </div>
          </AnimateWrapper>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {testsList.map((test, index) => (
              <AnimateWrapper key={test.testId} delay={0.2 + index * 0.05}>
                <div className="group relative bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-purple-200/50 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                        {test.bookTitle}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950 group-hover:text-purple-600 transition-colors">
                      {test.testTitle}
                    </h3>
                    
                    <div className="flex gap-4 mt-4 text-xs text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 text-sm">{test.totalGroups}</span>
                        <span>Nhóm câu hỏi</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-100 pl-4">
                        <span className="font-semibold text-slate-700 text-sm">{test.totalQuestions}</span>
                        <span>Tổng số câu hỏi</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end">
                    <Link
                      href={`/practice/${normalizedPartId}/${test.testId}`}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group/btn"
                    >
                      Bắt đầu luyện tập
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
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
