"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Brain,
  Flame,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import AnimateWrapper from "@/components/AnimateWrapper";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface Session {
  id: string;
  score: number;
  time_spent: number;
  status: string;
  created_at: string;
  tests: {
    title: string;
  } | null;
}

interface DetailedProgress {
  id: string;
  session_id: string;
  is_correct: boolean;
  dictation_accuracy: number | null;
  question_id: string;
  questions: {
    question_number: number;
    question_groups: {
      part_type: string;
    } | null;
  } | null;
}

interface Vocab {
  id: string;
  word: string;
  translation: string;
  ipa: string | null;
  context_sentence: string | null;
  created_at: string;
}

interface ProgressDashboardProps {
  profile: Profile;
  sessions: Session[];
  detailedProgress: DetailedProgress[];
  vocab: Vocab[];
  streak: number;
  avgAccuracy: number;
  correctRate: number;
  correctAnswers: number;
  totalQuestionsAnswered: number;
}

// Convert correct answers count to an estimated TOEIC Listening score (scale 5 - 495)
function calculateToeicScore(correctCount: number): number {
  if (correctCount <= 6) return 5;
  if (correctCount >= 96) return 495;
  return 5 + Math.round(((correctCount - 6) / 90) * 490);
}

export default function ProgressDashboard({
  profile,
  sessions,
  detailedProgress,
  vocab,
  streak,
  avgAccuracy,
  correctRate,
  correctAnswers,
  totalQuestionsAnswered,
}: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState<"full-test" | "part-practice">("full-test");

  // Format time (seconds to minutes/seconds)
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${sec} giây`;
    if (s === 0) return `${m} phút`;
    return `${m}p ${s}s`;
  };

  // Group detailed progress by session_id
  const progressBySession = useMemo(() => {
    const map: Record<string, DetailedProgress[]> = {};
    detailedProgress.forEach((p) => {
      if (!map[p.session_id]) {
        map[p.session_id] = [];
      }
      map[p.session_id].push(p);
    });
    return map;
  }, [detailedProgress]);

  // Classify and aggregate Full Test history
  const fullTestHistory = useMemo(() => {
    return sessions
      .filter((s) => s.status === "completed")
      .map((s) => {
        const testTitle = s.tests?.title || "Đề bài";
        const dateStr = new Date(s.created_at).toLocaleDateString("vi-VN", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: s.id,
          title: testTitle,
          date: dateStr,
          timeSpent: s.time_spent,
          score: s.score,
          estimatedScore: calculateToeicScore(s.score),
          createdAt: new Date(s.created_at).getTime(),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [sessions]);

  // Classify and aggregate Part Practice history
  const partPracticeHistory = useMemo(() => {
    return sessions
      .filter((s) => s.status === "in_progress")
      .map((s) => {
        const sessionProg = progressBySession[s.id] || [];
        const testTitle = s.tests?.title || "Đề bài";

        // Find parts practiced
        const partsSet = new Set<string>();
        sessionProg.forEach((p) => {
          const part = p.questions?.question_groups?.part_type;
          if (part) {
            partsSet.add(part);
          }
        });

        const partsArr = Array.from(partsSet).map((p) => {
          switch (p) {
            case "part_1": return "Part 1";
            case "part_2": return "Part 2";
            case "part_3": return "Part 3";
            case "part_4": return "Part 4";
            default: return p;
          }
        }).sort();

        // Calculate metrics
        const total = sessionProg.length;
        const correct = sessionProg.filter((p) => p.is_correct).length;
        
        const accuracies = sessionProg.filter((p) => p.dictation_accuracy !== null);
        const avgAcc = accuracies.length > 0
          ? Math.round(accuracies.reduce((sum, p) => sum + (p.dictation_accuracy || 0), 0) / accuracies.length)
          : null;

        const dateStr = new Date(s.created_at).toLocaleDateString("vi-VN", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        let partsText = partsArr.join(", ");
        if (partsArr.length === 0) {
          partsText = "Luyện tập tự do";
        }

        return {
          id: s.id,
          title: `${testTitle} - ${partsText}`,
          date: dateStr,
          timeSpent: s.time_spent,
          totalQuestions: total,
          correctQuestions: correct,
          dictationAccuracy: avgAcc,
          createdAt: new Date(s.created_at).getTime(),
        };
      })
      // Filter out sessions that have no questions answered to avoid empty practice rows
      .filter((s) => s.totalQuestions > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [sessions, progressBySession]);

  return (
    <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <AnimateWrapper delay={0.1}>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4 leading-tight">
            Tiến độ{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600">
              Luyện tập của bạn
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Theo dõi sự tiến bộ hàng ngày, điểm số làm đề thi thử và danh mục từ vựng học tập của bạn.
          </p>
        </AnimateWrapper>
      </div>

      {/* Profile Overview Card */}
      <AnimateWrapper delay={0.15} className="mb-10">
        <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
              {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Học viên xuất sắc</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{profile.full_name || "Học viên TOEIC"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Thành viên từ: {new Date(profile.created_at).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-100 px-4 py-2.5 rounded-2xl shrink-0 self-start md:self-auto">
            <Flame className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">{streak} ngày liên tiếp</span>
              <span className="text-[10px] text-amber-700">Duy trì học tập hàng ngày!</span>
            </div>
          </div>
        </div>
      </AnimateWrapper>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Card 1: Completed Sessions */}
        <AnimateWrapper delay={0.2}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm flex items-center gap-4 h-full">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Số lượt làm bài</span>
              <span className="text-2xl font-bold text-slate-900">{sessions.length} lượt</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{fullTestHistory.length} đề Full Test đã nộp</span>
            </div>
          </div>
        </AnimateWrapper>

        {/* Card 2: Average Dictation Accuracy */}
        <AnimateWrapper delay={0.25}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm flex items-center gap-4 h-full">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Độ chính xác chính tả</span>
              <span className="text-2xl font-bold text-slate-900">{avgAccuracy}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Trung bình qua luyện tập chính tả</span>
            </div>
          </div>
        </AnimateWrapper>

        {/* Card 3: Overall Correct Answers Rate */}
        <AnimateWrapper delay={0.3}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm flex items-center gap-4 h-full">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Tỷ lệ trả lời đúng</span>
              <span className="text-2xl font-bold text-slate-900">{correctRate}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{correctAnswers}/{totalQuestionsAnswered} câu trắc nghiệm</span>
            </div>
          </div>
        </AnimateWrapper>

        {/* Card 4: Saved Vocabulary Count */}
        <AnimateWrapper delay={0.35}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm flex items-center gap-4 h-full">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Từ vựng đã lưu</span>
              <span className="text-2xl font-bold text-slate-900">{vocab.length} từ</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Tra cứu ôn tập linh hoạt</span>
            </div>
          </div>
        </AnimateWrapper>
      </div>

      {/* Main dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Practice History - Left Column (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <AnimateWrapper delay={0.4}>
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Lịch sử làm bài thi & luyện tập
                </h3>

                {/* Sub-tabs Selection */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("full-test")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "full-test"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Full Test ({fullTestHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("part-practice")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "part-practice"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Luyện tập theo Part ({partPracticeHistory.length})
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "full-test" ? (
                  <motion.div
                    key="full-test-table"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {fullTestHistory.length === 0 ? (
                      <div className="text-center py-16">
                        <span className="text-3xl">📝</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-3">Chưa có lịch sử thi thử</h4>
                        <p className="text-xs text-slate-500 mt-1">Làm bài thi thử Full Test ngay hôm nay để bắt đầu chấm điểm và lưu lại kết quả!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              <th className="pb-3 pl-2">Đề thi</th>
                              <th className="pb-3">Ngày làm</th>
                              <th className="pb-3">Thời gian</th>
                              <th className="pb-3">Số câu đúng</th>
                              <th className="pb-3 pr-2 text-right">Điểm ước lượng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                            {fullTestHistory.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 pl-2 font-bold text-slate-900">{s.title}</td>
                                <td className="py-4 text-slate-500">{s.date}</td>
                                <td className="py-4 text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(s.timeSpent)}
                                </td>
                                <td className="py-4 font-bold text-slate-800">
                                  {s.score}/100 câu
                                </td>
                                <td className="py-4 pr-2 text-right">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs">
                                    {s.estimatedScore}/495
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="part-practice-table"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {partPracticeHistory.length === 0 ? (
                      <div className="text-center py-16">
                        <span className="text-3xl">🧩</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-3">Chưa có lịch sử luyện tập</h4>
                        <p className="text-xs text-slate-500 mt-1">Luyện tập chép chính tả theo từng Part để nâng cao phản xạ nghe hiểu!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              <th className="pb-3 pl-2">Bài tập luyện tập</th>
                              <th className="pb-3">Ngày làm</th>
                              <th className="pb-3">Đã làm</th>
                              <th className="pb-3">Tỷ lệ đúng</th>
                              <th className="pb-3 pr-2 text-right">Chép chính tả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                            {partPracticeHistory.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 pl-2 font-bold text-slate-900">{s.title}</td>
                                <td className="py-4 text-slate-500">{s.date}</td>
                                <td className="py-4 text-slate-500">
                                  {s.totalQuestions} câu
                                </td>
                                <td className="py-4 font-bold text-slate-800">
                                  {s.correctQuestions}/{s.totalQuestions} ({Math.round((s.correctQuestions / s.totalQuestions) * 100)}%)
                                </td>
                                <td className="py-4 pr-2 text-right">
                                  {s.dictationAccuracy !== null ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      🎯 {s.dictationAccuracy}% chính xác
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-medium">Không làm</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimateWrapper>
        </div>

        {/* Saved Vocabulary - Right Column */}
        <div className="space-y-6">
          <AnimateWrapper delay={0.45}>
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm h-full">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Sổ tay từ vựng ({vocab.length})
              </h3>

              {!vocab || vocab.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-3xl">📖</span>
                  <h4 className="text-sm font-bold text-slate-800 mt-3">Sổ từ vựng đang trống</h4>
                  <p className="text-xs text-slate-500 mt-1">Trong lúc chép chính tả, nhấp vào từ bất kỳ để dịch và bấm biểu tượng lưu từ vựng để lưu vào sổ tay!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {vocab.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 bg-slate-50/50 hover:bg-indigo-50/30 border border-slate-100/60 rounded-2xl transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{v.word}</span>
                        {v.ipa && (
                          <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                            {v.ipa}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1.5">{v.translation}</p>
                      {v.context_sentence && (
                        <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-2 leading-relaxed">
                          &ldquo;{v.context_sentence}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimateWrapper>
        </div>
      </div>
    </div>
  );
}
