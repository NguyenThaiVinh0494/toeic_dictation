import { createClient } from "@/utils/supabase/server";
import { getProfileActions } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AdminQuestionsControl from "@/components/admin/AdminQuestionsControl";

interface PageProps {
  params: Promise<{
    testId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage({ params }: PageProps) {
  const { testId } = await params;
  const profile = await getProfileActions();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch test details
  const { data: testData, error: testError } = await supabase
    .from("tests")
    .select("title")
    .eq("id", testId)
    .maybeSingle();

  if (testError || !testData) {
    redirect("/admin/tests");
  }

  // Fetch all existing question groups and questions for this test
  const { data: groupsData } = await supabase
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
      passage_translation,
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
        explanation,
        useful_phrases
      )
    `)
    .eq("test_id", testId);

  // Sort groups by part_type sequence, then by starting question number
  const partOrder = ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6", "part_7"];
  const sortedGroups = groupsData
    ? [...groupsData].sort((a, b) => {
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
      })
    : [];

  // Sort questions inside each group by question number
  sortedGroups.forEach((group) => {
    if (group.questions) {
      group.questions.sort((a, b) => a.question_number - b.question_number);
    }
  });

  return (
    <AdminQuestionsControl
      testId={testId}
      testTitle={testData.title}
      initialGroups={sortedGroups}
    />
  );
}
