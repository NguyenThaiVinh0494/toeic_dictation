import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AnimateWrapper from "@/components/AnimateWrapper";
import FullTestWorkspace, { QuestionGroup } from "@/components/practice/FullTestWorkspace";

interface PageProps {
  params: Promise<{
    testId: string;
  }>;
}

export default async function FullTestWorkspacePage({ params }: PageProps) {
  const { testId } = await params;
  const supabase = await createClient();

  // Fetch test details
  const { data: testData, error: testError } = await supabase
    .from("tests")
    .select(`
      title,
      books (
        title
      )
    `)
    .eq("id", testId)
    .maybeSingle();

  if (testError || !testData) {
    redirect("/practice/full-test");
  }

  // Fetch all question groups and questions for this test
  const { data: groupsData, error: groupsError } = await supabase
    .from("question_groups")
    .select(`
      id,
      test_id,
      part_type,
      audio_url,
      image_url,
      reading_passage_text,
      transcript_text,
      translation_vi,
      questions (
        id,
        group_id,
        question_number,
        question_content,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
      )
    `)
    .eq("test_id", testId);

  if (groupsError || !groupsData || groupsData.length === 0) {
    redirect("/practice/full-test");
  }

  // Sort groups by part_type sequence (part_1 -> part_4), then by starting question number
  const partOrder = ["part_1", "part_2", "part_3", "part_4"];
  const sortedGroups = [...groupsData].sort((a, b) => {
    const partA = partOrder.indexOf(a.part_type);
    const partB = partOrder.indexOf(b.part_type);
    if (partA !== partB) return partA - partB;

    const aMin = a.questions && a.questions.length > 0
      ? Math.min(...a.questions.map((q) => q.question_number))
      : 999;
    const bMin = b.questions && b.questions.length > 0
      ? Math.min(...b.questions.map((q) => q.question_number))
      : 999;
    return aMin - bMin;
  });

  // Sort questions inside each group by question number
  sortedGroups.forEach((group) => {
    if (group.questions) {
      group.questions.sort((a, b) => a.question_number - b.question_number);
    }
  });

  const bookTitle = testData.books
    ? (testData.books as unknown as { title: string }).title
    : "ETS Book";

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Back to practice menu link */}
      <AnimateWrapper delay={0.05} className="mb-4">
        <Link
          href="/practice/full-test"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách đề thi Full Test
        </Link>
      </AnimateWrapper>

      {/* Header */}
      <AnimateWrapper delay={0.1} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                {bookTitle}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                Full Test Simulation
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {testData.title}
            </h1>
          </div>
        </div>
      </AnimateWrapper>

      {/* Workspace */}
      <FullTestWorkspace
        testId={testId}
        groups={sortedGroups as unknown as QuestionGroup[]}
      />
    </div>
  );
}
