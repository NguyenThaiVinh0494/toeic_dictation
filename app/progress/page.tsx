import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getProfileActions } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/server";
import ProgressDashboard from "@/components/progress/ProgressDashboard";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const profile = await getProfileActions();

  // Protect route
  if (!profile) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/progress";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const supabase = await createClient();

  // Fetch test sessions with test titles
  const { data: sessions } = await supabase
    .from("user_test_sessions")
    .select(`
      id,
      score,
      time_spent,
      status,
      created_at,
      tests (
        title
      )
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Fetch detailed question progress
  const { data: detailedProgress } = await supabase
    .from("user_question_progress")
    .select(`
      id,
      session_id,
      is_correct,
      dictation_accuracy,
      question_id,
      questions (
        question_number,
        question_groups (
          part_type
        )
      )
    `)
    .eq("user_id", profile.id);

  // Fetch saved vocabulary
  const { data: vocab } = await supabase
    .from("user_saved_vocab")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Compute statistics
  const dictationRows = detailedProgress?.filter((p) => p.dictation_accuracy !== null) || [];
  const avgAccuracy = dictationRows.length > 0
    ? Math.round(dictationRows.reduce((acc, p) => acc + (p.dictation_accuracy || 0), 0) / dictationRows.length)
    : 0;

  const totalQuestionsAnswered = detailedProgress?.length || 0;
  const correctAnswers = detailedProgress?.filter((p) => p.is_correct).length || 0;
  const correctRate = totalQuestionsAnswered > 0
    ? Math.round((correctAnswers / totalQuestionsAnswered) * 100)
    : 0;

  // Calculate study streak (consecutive days)
  let streak = 0;
  if (sessions && sessions.length > 0) {
    const dates = sessions.map((s) => new Date(s.created_at).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map((d) => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // Descending order

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hasStudiedToday = uniqueDates.some((d) => d.toDateString() === today.toDateString());
    const hasStudiedYesterday = uniqueDates.some((d) => d.toDateString() === yesterday.toDateString());

    if (hasStudiedToday) {
      streak = 1;
      let checkDate = today;
      for (const dateVal of uniqueDates) {
        const diff = Math.floor((checkDate.getTime() - dateVal.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) continue; // Same day
        if (diff === 1) {
          streak++;
          checkDate = dateVal;
        } else {
          break;
        }
      }
    } else if (hasStudiedYesterday) {
      streak = 1;
      let checkDate = yesterday;
      for (const dateVal of uniqueDates) {
        const diff = Math.floor((checkDate.getTime() - dateVal.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0 || dateVal.toDateString() === today.toDateString()) continue;
        if (diff === 1) {
          streak++;
          checkDate = dateVal;
        } else {
          break;
        }
      }
    }
  }

  // Casting data safely for client component props
  const safeProfile = {
    id: profile.id,
    full_name: profile.full_name || null,
    avatar_url: profile.avatar_url || null,
    role: profile.role || "student",
    created_at: profile.created_at || new Date().toISOString()
  };

  const safeSessions = (sessions || []).map((s) => {
    let title = "Đề bài";
    if (s.tests) {
      const testVal = s.tests as unknown as { title: string } | { title: string }[];
      if (Array.isArray(testVal)) {
        title = testVal[0]?.title || "Đề bài";
      } else {
        title = testVal.title || "Đề bài";
      }
    }
    return {
      id: s.id,
      score: s.score,
      time_spent: s.time_spent,
      status: s.status,
      created_at: s.created_at,
      tests: s.tests ? { title } : null
    };
  });

  const safeDetailedProgress = (detailedProgress || []).map((p) => {
    let questionNumber = 0;
    let partType = "part_1";
    
    if (p.questions) {
      interface QueriedQuestion {
        question_number: number;
        question_groups: {
          part_type: string;
        } | {
          part_type: string;
        }[] | null;
      }
      const qVal = p.questions as unknown as QueriedQuestion | QueriedQuestion[];
      const q = Array.isArray(qVal) ? qVal[0] : qVal;
      if (q) {
        questionNumber = q.question_number || 0;
        const qg = q.question_groups;
        if (qg) {
          const qgVal = qg as unknown as { part_type: string } | { part_type: string }[];
          const group = Array.isArray(qgVal) ? qgVal[0] : qgVal;
          if (group) {
            partType = group.part_type || "part_1";
          }
        }
      }
    }
    
    return {
      id: p.id,
      session_id: p.session_id,
      is_correct: p.is_correct,
      dictation_accuracy: p.dictation_accuracy,
      question_id: p.question_id,
      questions: p.questions ? {
        question_number: questionNumber,
        question_groups: {
          part_type: partType
        }
      } : null
    };
  });

  const safeVocab = (vocab || []).map(v => ({
    id: v.id,
    word: v.word,
    translation: v.translation,
    ipa: v.ipa,
    context_sentence: v.context_sentence,
    created_at: v.created_at
  }));

  return (
    <ProgressDashboard
      profile={safeProfile}
      sessions={safeSessions}
      detailedProgress={safeDetailedProgress}
      vocab={safeVocab}
      streak={streak}
      avgAccuracy={avgAccuracy}
      correctRate={correctRate}
      correctAnswers={correctAnswers}
      totalQuestionsAnswered={totalQuestionsAnswered}
    />
  );
}
