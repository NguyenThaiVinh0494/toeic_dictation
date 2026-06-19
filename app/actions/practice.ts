"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { CorrectAnswerOption } from "@/types/database";

export interface ActionResponse<T = null> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Get the current user or throw an error if unauthorized.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

/**
 * Get or create an in-progress session for a specific test.
 */
export async function getOrCreateSession(testId: string): Promise<string> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Query for existing in-progress session
    const { data: existing, error } = await supabase
      .from("user_test_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("test_id", testId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (existing) {
      return existing.id;
    }

    // Create a new in-progress session
    const { data: newSession, error: createError } = await supabase
      .from("user_test_sessions")
      .insert({
        user_id: user.id,
        test_id: testId,
        status: "in_progress",
        score: 0,
        time_spent: 0,
      })
      .select("id")
      .single();

    if (createError || !newSession) {
      throw new Error(createError?.message || "Failed to create session");
    }

    return newSession.id;
  } catch (error: unknown) {
    console.error("Error in getOrCreateSession:", error);
    throw error;
  }
}

/**
 * Save or update progress for a single question (e.g. during Part practice).
 */
export async function saveQuestionProgress(
  questionId: string,
  testId: string,
  selectedAnswer: CorrectAnswerOption | null,
  isCorrect: boolean,
  dictationAccuracy: number | null,
  dictationUserInput: string | null
): Promise<ActionResponse<string>> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Ensure session exists
    const sessionId = await getOrCreateSession(testId);

    // Check if progress already exists for this question in this session
    const { data: existing, error: findError } = await supabase
      .from("user_question_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (existing) {
      // Update
      const { error: updateError } = await supabase
        .from("user_question_progress")
        .update({
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          dictation_accuracy: dictationAccuracy,
          dictation_user_input: dictationUserInput,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from("user_question_progress")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          dictation_accuracy: dictationAccuracy,
          dictation_user_input: dictationUserInput,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return { success: true, data: sessionId, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
    console.error("Error in saveQuestionProgress:", error);
    return { success: false, data: null, error: msg };
  }
}

interface SubmitAnswerInput {
  questionId: string;
  selectedAnswer: CorrectAnswerOption | null;
  isCorrect: boolean;
}

/**
 * Submit full test results, creating a completed test session and saving all question responses.
 */
export async function submitFullTest(
  testId: string,
  timeSpent: number,
  answers: SubmitAnswerInput[]
): Promise<ActionResponse<{ sessionId: string; score: number }>> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Calculate score (number of correct answers)
    const score = answers.filter((ans) => ans.isCorrect).length;

    // Create a new completed session
    const { data: session, error: sessionError } = await supabase
      .from("user_test_sessions")
      .insert({
        user_id: user.id,
        test_id: testId,
        status: "completed",
        score,
        time_spent: timeSpent,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      throw new Error(sessionError?.message || "Failed to create test session");
    }

    const sessionId = session.id;

    // Batch insert all question progress rows
    const progressRows = answers.map((ans) => ({
      user_id: user.id,
      session_id: sessionId,
      question_id: ans.questionId,
      selected_answer: ans.selectedAnswer,
      is_correct: ans.isCorrect,
      dictation_accuracy: null,
      dictation_user_input: null,
    }));

    const { error: insertError } = await supabase
      .from("user_question_progress")
      .insert(progressRows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Revalidate dashboard or history path if there is one
    revalidatePath("/practice");

    return {
      success: true,
      data: { sessionId, score },
      error: null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
    console.error("Error in submitFullTest:", error);
    return { success: false, data: null, error: msg };
  }
}
