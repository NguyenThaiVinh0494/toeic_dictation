"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { CorrectAnswerOption } from "@/types/database";

export interface AdminStats {
  totalStudents: number;
  totalSessions: number;
  avgListeningScore: number; // average correct answers out of 100/200 scaled
  avgReadingScore: number;
  avgAccuracy: number;
}

export interface AdminUserListItem {
  id: string;
  fullName: string | null;
  email?: string;
  createdAt: string;
  sessionsCount: number;
  avgAccuracy: number;
}

export interface AdminTestListItem {
  id: string;
  title: string;
  bookTitle: string;
  questionGroupsCount: number;
  questionsCount: number;
}

/**
 * Verify current user is an authenticated Admin.
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return { supabase, user };
}

/**
 * Fetch overview stats for Admin Dashboard
 */
export async function getAdminOverviewStats(): Promise<AdminStats> {
  const { supabase } = await verifyAdmin();

  // 1. Get total students count
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  // 2. Get total test sessions
  const { count: sessionCount } = await supabase
    .from("user_test_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  // 3. Get all completed test sessions to compute average score
  const { data: sessions } = await supabase
    .from("user_test_sessions")
    .select("score, test_mode")
    .eq("status", "completed");

  let totalListeningCorrect = 0;
  let listeningCount = 0;
  let totalReadingCorrect = 0;
  let readingCount = 0;

  if (sessions) {
    sessions.forEach((s) => {
      if (s.test_mode === "listening") {
        totalListeningCorrect += s.score;
        listeningCount++;
      } else if (s.test_mode === "reading") {
        totalReadingCorrect += s.score;
        readingCount++;
      } else {
        // Full test (assumed 200 questions, 100 listening + 100 reading, score out of 200)
        // Let's divide equally for simple approximation, or count as part of both
        totalListeningCorrect += s.score / 2;
        listeningCount++;
        totalReadingCorrect += s.score / 2;
        readingCount++;
      }
    });
  }

  const avgListeningScore = listeningCount > 0 ? Math.round((totalListeningCorrect / listeningCount)) : 0;
  const avgReadingScore = readingCount > 0 ? Math.round((totalReadingCorrect / readingCount)) : 0;

  // 4. Get average dictation accuracy
  const { data: accuracies } = await supabase
    .from("user_question_progress")
    .select("dictation_accuracy")
    .not("dictation_accuracy", "is", null);

  let totalAccuracy = 0;
  let accuracyCount = 0;
  if (accuracies) {
    accuracies.forEach((a) => {
      if (a.dictation_accuracy !== null) {
        totalAccuracy += a.dictation_accuracy;
        accuracyCount++;
      }
    });
  }
  const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 0;

  return {
    totalStudents: studentCount || 0,
    totalSessions: sessionCount || 0,
    avgListeningScore,
    avgReadingScore,
    avgAccuracy,
  };
}

/**
 * Fetch all students list with basic stats
 */
export async function getAdminUsersList(): Promise<AdminUserListItem[]> {
  const { supabase } = await verifyAdmin();

  // Fetch profiles
  const { data: students, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (error || !students) {
    throw new Error(error?.message || "Failed to fetch students");
  }

  // Fetch session count and accuracy per student
  const result: AdminUserListItem[] = [];
  for (const s of students) {
    const { count: sCount } = await supabase
      .from("user_test_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", s.id)
      .eq("status", "completed");

    const { data: qProgress } = await supabase
      .from("user_question_progress")
      .select("dictation_accuracy")
      .eq("user_id", s.id)
      .not("dictation_accuracy", "is", null);

    let totalAcc = 0;
    let accCount = 0;
    if (qProgress) {
      qProgress.forEach((q) => {
        if (q.dictation_accuracy !== null) {
          totalAcc += q.dictation_accuracy;
          accCount++;
        }
      });
    }
    const avgAccuracy = accCount > 0 ? Math.round(totalAcc / accCount) : 0;

    result.push({
      id: s.id,
      fullName: s.full_name,
      createdAt: s.created_at,
      sessionsCount: sCount || 0,
      avgAccuracy,
    });
  }

  return result;
}

/**
 * Fetch detailed stats and history of a student
 */
export async function getAdminUserDetail(userId: string) {
  const { supabase } = await verifyAdmin();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .eq("id", userId)
    .single();

  // Fetch completed sessions
  const { data: sessions } = await supabase
    .from("user_test_sessions")
    .select(`
      id,
      score,
      time_spent,
      status,
      test_mode,
      created_at,
      tests (
        title
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Fetch detailed dictation progress
  const { data: detailedProgress } = await supabase
    .from("user_question_progress")
    .select(`
      id,
      is_correct,
      dictation_accuracy,
      dictation_user_input,
      questions (
        question_number,
        question_content,
        question_groups (
          part_type
        )
      )
    `)
    .eq("user_id", userId);

  return {
    profile,
    sessions: sessions || [],
    detailedProgress: detailedProgress || [],
  };
}

/**
 * Fetch all Books and Tests catalog with question counts
 */
export async function getAdminTestsCatalog(): Promise<AdminTestListItem[]> {
  const { supabase } = await verifyAdmin();

  const { data: tests, error } = await supabase
    .from("tests")
    .select(`
      id,
      title,
      books (
        title
      ),
      question_groups (
        questions (
          id
        )
      )
    `);

  if (error || !tests) {
    throw new Error(error?.message || "Failed to fetch tests catalog");
  }

  return tests.map((t) => {
    let qGroupsCount = 0;
    let questionsCount = 0;
    if (t.question_groups) {
      const groups = Array.isArray(t.question_groups) ? t.question_groups : [t.question_groups];
      qGroupsCount = groups.length;
      (groups as { questions?: { id: string }[] | { id: string } | null }[]).forEach((g) => {
        if (g.questions) {
          const qs = Array.isArray(g.questions) ? g.questions : [g.questions];
          questionsCount += qs.length;
        }
      });
    }

    let bookTitle = "ETS Book";
    if (t.books) {
      bookTitle = Array.isArray(t.books)
        ? t.books[0]?.title
        : (t.books as { title: string } | null)?.title || "ETS Book";
    }

    return {
      id: t.id,
      title: t.title,
      bookTitle,
      questionGroupsCount: qGroupsCount,
      questionsCount,
    };
  });
}

/**
 * Fetch all Books list (simple id, title)
 */
export async function getAdminBooks() {
  const { supabase } = await verifyAdmin();
  const { data, error } = await supabase
    .from("books")
    .select("id, title")
    .order("title");

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

/**
 * Add a new Book
 */
export async function createBook(title: string, description: string | null) {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("books")
    .insert({ title, description })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tests");
  return data;
}

/**
 * Add a new Test
 */
export async function createTest(bookId: string, title: string) {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("tests")
    .insert({ book_id: bookId, title })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tests");
  return data;
}

export interface QuestionInsertInput {
  question_number: number;
  question_content: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string | null;
  useful_phrases: string | null;
}

/**
 * Add a Question Group and its children Questions
 */
export async function createQuestionGroup(
  testId: string,
  partType: string,
  audioUrl: string | null,
  imageUrl: string | null,
  readingPassageText: string | null,
  transcriptText: string,
  translationVi: string,
  passageTranslation: string | null,
  questions: QuestionInsertInput[]
) {
  const { supabase } = await verifyAdmin();

  // 1. Insert question group
  const { data: group, error: groupError } = await supabase
    .from("question_groups")
    .insert({
      test_id: testId,
      part_type: partType,
      audio_url: audioUrl || "",
      image_url: imageUrl,
      reading_passage_text: readingPassageText,
      transcript_text: transcriptText,
      translation_vi: translationVi,
      passage_translation: passageTranslation,
    })
    .select("id")
    .single();

  if (groupError || !group) {
    throw new Error(groupError?.message || "Failed to create question group");
  }

  // 2. Insert questions
  const questionsToInsert = questions.map((q) => ({
    group_id: group.id,
    question_number: q.question_number,
    question_content: q.question_content,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    useful_phrases: q.useful_phrases,
  }));

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(questionsToInsert);

  if (questionsError) {
    // Attempt rolling back group (manually delete)
    await supabase.from("question_groups").delete().eq("id", group.id);
    throw new Error(questionsError.message);
  }

  revalidatePath(`/admin/tests/${testId}/questions`);
  return group.id;
}

export interface BulkQuestionInsertInput {
  question_number: number;
  question_content: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string | null;
  useful_phrases: string | null;
}

export interface BulkQuestionGroupInsertInput {
  part_type: string;
  audio_url: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  reading_passage_text: string | null;
  transcript_text: string;
  translation_vi: string;
  passage_translation: string | null;
  questions: BulkQuestionInsertInput[];
}

/**
 * Bulk import question groups and their questions.
 */
export async function importTestQuestionsBulk(
  testId: string,
  groups: BulkQuestionGroupInsertInput[],
  clearExisting: boolean
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await verifyAdmin();

  try {
    // 1. Clear existing if requested
    if (clearExisting) {
      // Fetch existing group IDs first to delete child questions manually (safety first)
      const { data: existingGroups } = await supabase
        .from("question_groups")
        .select("id")
        .eq("test_id", testId);

      if (existingGroups && existingGroups.length > 0) {
        const groupIds = existingGroups.map((g) => g.id);
        
        // Delete all child questions
        const { error: delQuestionsError } = await supabase
          .from("questions")
          .delete()
          .in("group_id", groupIds);
          
        if (delQuestionsError) {
          throw new Error("Lỗi khi xóa câu hỏi con cũ: " + delQuestionsError.message);
        }
      }

      // Delete groups
      const { error: delGroupsError } = await supabase
        .from("question_groups")
        .delete()
        .eq("test_id", testId);

      if (delGroupsError) {
        throw new Error("Lỗi khi xóa nhóm câu hỏi cũ: " + delGroupsError.message);
      }
    }

    // 2. Loop and insert groups & questions
    for (const groupInput of groups) {
      // Insert question group
      const { data: group, error: groupError } = await supabase
        .from("question_groups")
        .insert({
          test_id: testId,
          part_type: groupInput.part_type,
          audio_url: groupInput.audio_url || "",
          image_url: groupInput.image_url || null,
          image_url_2: groupInput.image_url_2 || null,
          image_url_3: groupInput.image_url_3 || null,
          reading_passage_text: groupInput.reading_passage_text || null,
          transcript_text: groupInput.transcript_text || "",
          translation_vi: groupInput.translation_vi || "",
          passage_translation: groupInput.passage_translation || null,
        })
        .select("id")
        .single();

      if (groupError || !group) {
        throw new Error(`Lỗi khi tạo nhóm câu hỏi (Part ${groupInput.part_type}): ${groupError?.message}`);
      }

      // Prepare and insert questions
      if (groupInput.questions && groupInput.questions.length > 0) {
        const questionsToInsert = groupInput.questions.map((q) => ({
          group_id: group.id,
          question_number: q.question_number,
          question_content: q.question_content || null,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          useful_phrases: q.useful_phrases || null,
        }));

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionsToInsert);

        if (questionsError) {
          throw new Error(`Lỗi khi lưu câu hỏi con của nhóm ${group.id}: ${questionsError.message}`);
        }
      }
    }

    revalidatePath(`/admin/tests/${testId}/questions`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
    return { success: false, error: msg };
  }
}
