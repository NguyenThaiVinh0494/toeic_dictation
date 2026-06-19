export type UserRole = "admin" | "student";
export type TestSessionStatus = "in_progress" | "completed";
export type CorrectAnswerOption = "A" | "B" | "C" | "D";

export interface Profile {
  id: string; // UUID references auth.users
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string; // Timestamptz
}

export interface Book {
  id: string; // UUID
  title: string;
  description: string | null;
  created_at: string;
}

export interface Test {
  id: string; // UUID
  book_id: string; // UUID references books
  title: string;
  created_at: string;
}

export interface QuestionGroup {
  id: string; // UUID
  test_id: string; // UUID references tests
  audio_url: string;
  image_url: string | null;
  reading_passage_text: string | null;
  transcript_text: string;
  translation_vi: string;
  created_at: string;
  part_type: string; // 'part_1', 'part_2', 'part_3', 'part_4'
}

export interface Question {
  id: string; // UUID
  group_id: string; // UUID references question_groups
  question_number: number;
  question_content: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null; // Nullable for Part 2
  correct_answer: CorrectAnswerOption;
  explanation: string | null;
  created_at: string;
}

export interface UserTestSession {
  id: string; // UUID
  user_id: string; // UUID references profiles
  test_id: string; // UUID references tests
  status: TestSessionStatus;
  score: number;
  time_spent: number; // in seconds
  created_at: string;
  updated_at: string;
}

export interface UserQuestionProgress {
  id: string; // UUID
  user_id: string; // UUID references profiles
  session_id: string; // UUID references user_test_sessions
  question_id: string; // UUID references questions
  selected_answer: CorrectAnswerOption | null;
  is_correct: boolean;
  dictation_accuracy: number | null; // Percentage (numeric)
  dictation_user_input: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSavedVocab {
  id: string; // UUID
  user_id: string; // UUID references profiles
  word: string;
  translation: string;
  ipa: string | null;
  context_sentence: string | null;
  created_at: string;
}

// Complete Supabase DB Definition for strong client typings
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Profile>;
      };
      books: {
        Row: Book;
        Insert: Omit<Book, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Book>;
      };
      tests: {
        Row: Test;
        Insert: Omit<Test, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Test>;
      };
      question_groups: {
        Row: QuestionGroup;
        Insert: Omit<QuestionGroup, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<QuestionGroup>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Question>;
      };
      user_test_sessions: {
        Row: UserTestSession;
        Insert: Omit<UserTestSession, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserTestSession>;
      };
      user_question_progress: {
        Row: UserQuestionProgress;
        Insert: Omit<UserQuestionProgress, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserQuestionProgress>;
      };
      user_saved_vocab: {
        Row: UserSavedVocab;
        Insert: Omit<UserSavedVocab, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<UserSavedVocab>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
