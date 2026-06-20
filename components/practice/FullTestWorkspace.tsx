"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock,
  ClipboardList,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Sparkles,
  Info,
  Globe,
} from "lucide-react";
import { cleanWord, diffWords, DiffResult } from "@/utils/diff";
import { submitFullTest, saveQuestionProgress } from "@/app/actions/practice";
import { CorrectAnswerOption } from "@/types/database";

export interface Question {
  id: string;
  group_id: string;
  question_number: number;
  question_content: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null;
  correct_answer: CorrectAnswerOption;
  explanation: string | null;
}

export interface QuestionGroup {
  id: string;
  test_id: string;
  part_type: string;
  audio_url: string;
  image_url: string | null;
  reading_passage_text: string | null;
  transcript_text: string;
  translation_vi: string;
  questions: Question[];
}


interface FullTestWorkspaceProps {
  testId: string;
  groups: QuestionGroup[];
}

// Convert correct answers count to an estimated TOEIC Listening score (scale 5 - 495)
function calculateToeicScore(correctCount: number): number {
  if (correctCount <= 6) return 5;
  if (correctCount >= 96) return 495;
  // Linear scale approximation
  return 5 + Math.round(((correctCount - 6) / 90) * 490);
}

export default function FullTestWorkspace({ testId, groups }: FullTestWorkspaceProps) {
  // Mode: 'testing' | 'result'
  const [status, setStatus] = useState<"testing" | "result">("testing");
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, CorrectAnswerOption>>({});

  // Timer states
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);

  // Result scorecard states
  const [score, setScore] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Review explanation state
  const [showExplanation, setShowExplanation] = useState(false);

  // Audio player states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Dictionary tooltip states
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    word: string;
    top: number;
    left: number;
    ipa?: string;
    definition?: string;
    loading: boolean;
    error: boolean;
  } | null>(null);
  const dictCache = useRef<Record<string, { ipa?: string; definition?: string }>>({});

  const currentGroup = groups[currentGroupIdx];
  const totalQuestionsCount = groups.reduce((acc, g) => acc + g.questions.length, 0);

  // Audio actions wrapped in useCallback
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.log("Audio play failed:", err));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const rewind = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds);
  }, []);

  const forward = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      audioRef.current.duration || 999,
      audioRef.current.currentTime + seconds
    );
  }, []);

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Switch groups helper (both in exam & result navigation)
  const selectGroup = useCallback((idx: number) => {
    setCurrentGroupIdx(idx);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, []);

  // Exam Submission wrapped in useCallback
  const handleExamSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Format all answers
    const answersList = [];
    for (const group of groups) {
      for (const q of group.questions) {
        const selected = selectedAnswers[q.id] || null;
        const isCorrect = selected === q.correct_answer;
        answersList.push({
          questionId: q.id,
          selectedAnswer: selected,
          isCorrect,
        });
      }
    }

    const secondsSpent = 2700 - timeLeft;
    setTimeSpent(secondsSpent);

    try {
      const response = await submitFullTest(testId, secondsSpent, answersList);
      if (response.success && response.data) {
        setScore(response.data.score);
        setSessionId(response.data.sessionId);
        setStatus("result");
      } else {
        alert("Lỗi khi nộp bài: " + response.error);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi kết nối khi nộp bài!");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, groups, selectedAnswers, timeLeft, testId]);

  // 1. Timer Countdown Effect (placed after handleExamSubmit is declared)
  useEffect(() => {
    if (status !== "testing" || !isTestStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleExamSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, handleExamSubmit, isTestStarted]);

  // Autoplay sequence: play audio when a group changes or the test is started
  useEffect(() => {
    if (status === "testing" && isTestStarted && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Auto-play failed:", err));
    }
  }, [currentGroupIdx, isTestStarted, status]);

  // Keyboard Hotkeys (placed after togglePlay, rewind, forward are declared)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable hotkeys during active test phase
      if (status !== "result") return;

      // Toggle play/pause on Control key (works even when typing) or 'p'/'P' key (only when NOT typing)
      if (
        e.key === "Control" ||
        ((e.key === "p" || e.key === "P") &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "INPUT")
      ) {
        e.preventDefault();
        togglePlay();
      }

      // Rewind 3s on ArrowLeft (only when NOT focused on input/textarea) or Shift + Tab
      if (e.code === "ArrowLeft" || (e.shiftKey && e.code === "Tab")) {
        if (
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.tagName === "INPUT"
        ) {
          if (e.code === "ArrowLeft") return;
        }
        e.preventDefault();
        rewind(3);
      }

      // Fast forward 3s on ArrowRight (only when NOT focused on input/textarea)
      if (e.code === "ArrowRight") {
        if (
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.tagName === "INPUT"
        ) {
          return;
        }
        e.preventDefault();
        forward(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, rewind, forward]);


  // Filter wrong answers
  const wrongQuestions = useMemo(() => {
    if (status !== "result") return [];
    const list: { groupIdx: number; question: Question; indexInTest: number }[] = [];
    let absoluteIdx = 0;

    groups.forEach((group, groupIdx) => {
      group.questions.forEach((q) => {
        absoluteIdx++;
        const selected = selectedAnswers[q.id] || null;
        if (selected !== q.correct_answer) {
          list.push({
            groupIdx,
            question: q,
            indexInTest: absoluteIdx,
          });
        }
      });
    });

    return list;
  }, [status, selectedAnswers, groups]);



  // Dictionary tooltips
  const handleWordClick = async (event: React.MouseEvent<HTMLSpanElement>, rawWord: string) => {
    const cleaned = cleanWord(rawWord);
    if (!cleaned) return;

    if (!containerRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    const top = rect.top - parentRect.top - 100;
    const left = rect.left - parentRect.left + rect.width / 2;

    setTooltip({
      word: cleaned,
      top,
      left,
      loading: true,
      error: false,
    });

    if (dictCache.current[cleaned]) {
      setTooltip((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              ipa: dictCache.current[cleaned].ipa,
              definition: dictCache.current[cleaned].definition,
            }
          : null
      );
      return;
    }

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleaned}`);
      if (!res.ok) throw new Error("Word not found");

      const data = await res.json();
      const firstEntry = data[0];
      const ipa = firstEntry.phonetic || firstEntry.phonetics?.[0]?.text || "";
      const definition =
        firstEntry.meanings?.[0]?.definitions?.[0]?.definition || "No definition found.";

      dictCache.current[cleaned] = { ipa, definition };

      setTooltip((prev) =>
        prev && prev.word === cleaned
          ? {
              ...prev,
              loading: false,
              ipa,
              definition,
            }
          : null
      );
    } catch (err) {
      console.error(err);
      setTooltip((prev) =>
        prev && prev.word === cleaned
          ? {
              ...prev,
              loading: false,
              error: true,
              definition: "Không tìm thấy định nghĩa cho từ này.",
            }
          : null
      );
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (tooltip && !(e.target as HTMLElement).closest(".word-span")) {
      setTooltip(null);
    }
  };

  // Format timer
  const formatTimer = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const mins = Math.floor(secs / 60);
    const remain = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, "0")}:${remain.toString().padStart(2, "0")}`;
  };

  const formatTime = formatTimer;

  // Get part title for group
  const getPartBadge = (partType: string) => {
    switch (partType) {
      case "part_1":
        return "Part 1";
      case "part_2":
        return "Part 2";
      case "part_3":
        return "Part 3";
      case "part_4":
        return "Part 4";
      default:
        return "Listening";
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full flex flex-col gap-6 select-none"
    >
      <audio
        ref={audioRef}
        src={currentGroup?.audio_url || undefined}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (status === "testing" && isTestStarted) {
            if (currentGroupIdx < groups.length - 1) {
              selectGroup(currentGroupIdx + 1);
            }
          }
        }}
      />

      {/* Dictionary Popover Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: "absolute",
              top: `${tooltip.top}px`,
              left: `${tooltip.left}px`,
              transform: "translateX(-50%)",
            }}
            className="z-50 w-64 bg-slate-900 text-white p-4 rounded-xl shadow-xl text-xs flex flex-col gap-1.5 pointer-events-auto"
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45" />
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-sm capitalize text-purple-300">
                {tooltip.word}
              </span>
              {tooltip.ipa && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {tooltip.ipa}
                </span>
              )}
            </div>
            {tooltip.loading ? (
              <div className="flex items-center gap-2 py-2 text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tra cứu từ điển...</span>
              </div>
            ) : tooltip.error ? (
              <span className="text-rose-400 py-1">{tooltip.definition}</span>
            ) : (
              <p className="text-slate-200 leading-relaxed py-1">
                {tooltip.definition}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW 1: TESTING PORTAL - START SCREEN */}
      {status === "testing" && !isTestStarted && (
        <div className="max-w-2xl mx-auto w-full bg-white/80 border border-white/20 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-lg flex flex-col items-center text-center gap-6 my-8">
          <div className="h-16 w-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-2">
            <ClipboardList className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Bài Thi Thử TOEIC Listening</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Chuẩn bị bước vào phòng thi thử nghiêm ngặt mô phỏng 100% môi trường thi thật TOEIC Listening.
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 my-2">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thời gian làm bài</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">45 phút</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số lượng câu hỏi</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">{totalQuestionsCount} câu</span>
            </div>
          </div>

          <div className="w-full bg-amber-50/50 border border-amber-100/50 p-5 rounded-2xl text-left space-y-3">
            <h3 className="text-xs font-extrabold text-amber-850 flex items-center gap-1.5">
              <Info className="h-4 w-4 shrink-0 animate-pulse text-amber-600" />
              NỘI QUY PHÒNG THI (EXAM MODE)
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Âm thanh sẽ phát liên tục tự động từ câu 1 đến câu cuối cùng.</li>
              <li>Bạn <strong className="text-rose-650">không thể</strong> tạm dừng, tua lại hoặc tua nhanh âm thanh.</li>
              <li>Mỗi nhóm câu hỏi chỉ được nghe <strong className="text-rose-650">duy nhất 1 lần</strong>.</li>
              <li>Đồng hồ sẽ đếm ngược liên tục. Khi hết 45 phút, hệ thống sẽ tự động nộp bài.</li>
              <li>Hãy đảm bảo tai nghe và kết nối internet của bạn hoạt động ổn định trước khi bắt đầu.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsTestStarted(true);
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Bắt đầu làm bài
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: TESTING PORTAL - ACTIVE TEST */}
      {status === "testing" && isTestStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Work Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Top Bar with Timer */}
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-500">Thời gian làm bài:</span>
                <span className="text-base font-black font-mono text-slate-900 bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg">
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleExamSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:bg-purple-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang nộp bài...
                  </>
                ) : (
                  <>
                    Nộp bài thi
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Media Block & Audio Controls */}
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                  {getPartBadge(currentGroup.part_type)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Nhóm {currentGroupIdx + 1}/{groups.length}
                </span>
              </div>

              {/* Picture display (Part 1, Part 3 & 4 graphics) */}
              {currentGroup.image_url && (
                <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center shadow-xs">
                  <img
                    src={currentGroup.image_url}
                    alt="Question visual resource"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}

              {/* Part 3 & 4 Passage display */}
              {currentGroup.reading_passage_text && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-mono">
                  {currentGroup.reading_passage_text}
                </div>
              )}

              {/* Audio controller block */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-10 shrink-0">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    disabled={true}
                    className="flex-grow h-1 bg-slate-200 rounded-lg appearance-none cursor-not-allowed accent-purple-600 opacity-60"
                  />
                  <span className="text-[10px] font-mono text-slate-500 w-10 text-right shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                    <Info className="h-3.5 w-3.5 animate-pulse shrink-0 text-amber-600" />
                    <span>🔊 Âm thanh phát tự động (Không thể tạm dừng/tua)</span>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-150 px-2 py-1 rounded-lg">
                    Tốc độ: 1.0x
                  </div>
                </div>
              </div>
            </div>

            {/* Questions area */}
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              {currentGroup.questions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                    <span className="inline-flex items-center justify-center shrink-0 h-5 w-5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Q{q.question_number}
                    </span>
                    <span>
                      {currentGroup.part_type === "part_1"
                        ? "Look at the picture and choose the best statement."
                        : currentGroup.part_type === "part_2"
                        ? "Mark your answer on your answer sheet."
                        : q.question_content || "Listen and choose the correct option:"}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {(
                      [
                        { key: "A", val: q.option_a },
                        { key: "B", val: q.option_b },
                        { key: "C", val: q.option_c },
                        ...(q.option_d ? [{ key: "D", val: q.option_d }] : []),
                      ] as { key: CorrectAnswerOption; val: string }[]
                    ).map((choice) => {
                      const isSelected = selectedAnswers[q.id] === choice.key;
                      return (
                        <button
                          key={choice.key}
                          type="button"
                          onClick={() => {
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: choice.key,
                            }));
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "border-purple-500 bg-purple-50/50 text-purple-800"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {choice.key}
                          </span>
                          <span className="flex-grow">
                            {currentGroup.part_type === "part_1" || currentGroup.part_type === "part_2"
                              ? `Phương án ${choice.key}`
                              : choice.val}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

              {/* Navigation */}
              <div className="border-t border-slate-100 pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => selectGroup(Math.max(0, currentGroupIdx - 1))}
                  disabled={true}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 font-bold text-xs disabled:opacity-40 cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Nhóm trước
                </button>

                <button
                  type="button"
                  onClick={() => selectGroup(Math.min(groups.length - 1, currentGroupIdx + 1))}
                  disabled={true}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 font-bold text-xs disabled:opacity-40 cursor-not-allowed flex items-center gap-1"
                >
                  Nhóm sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          {/* Sidebar Question Map (4 cols) */}
          <div className="lg:col-span-4 bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              Bản đồ câu hỏi ({totalQuestionsCount} câu)
            </h3>

            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[420px] pr-1">
              {groups.flatMap((g, gIdx) =>
                g.questions.map((q) => {
                  const isAnswered = !!selectedAnswers[q.id];
                  const isActiveGroup = gIdx === currentGroupIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={true}
                      className={`h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-not-allowed opacity-90 ${
                        isActiveGroup
                          ? "ring-2 ring-purple-600 bg-purple-100 text-purple-700"
                          : isAnswered
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-50 border border-slate-200 text-slate-600"
                      }`}
                    >
                      {q.question_number}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-purple-600" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-slate-100 border border-slate-200" />
                <span>Chưa trả lời</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TEST RESULT SCORECARD & DICTATION REVIEW */}
      {status === "result" && (
        <div className="flex flex-col gap-8">
          {/* Result Header & Scorecard */}
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                Kết quả bài thi thử
              </h2>
              <p className="text-xs text-slate-500">
                Chúc mừng bạn đã hoàn thành bài thi TOEIC Listening! Hãy phân tích lỗi sai bên dưới.
              </p>
              {timeSpent !== null && (
                <span className="text-[11px] font-bold text-slate-400 mt-2">
                  Thời gian làm bài: {Math.floor(timeSpent / 60)} phút {timeSpent % 60} giây
                </span>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/50 p-4 rounded-2xl text-center flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số câu chính xác</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {score}/{totalQuestionsCount}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 p-4 rounded-2xl text-center flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Ước lượng điểm Listening</h3>
              <p className="text-3xl font-black text-amber-600 mt-1">
                {score !== null ? calculateToeicScore(score) : 0}/495
              </p>
            </div>
          </div>

          {/* Main Review Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Active Group Details and Questions (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Media Card */}
              <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                    {getPartBadge(currentGroup.part_type)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Nhóm {currentGroupIdx + 1}/{groups.length}
                  </span>
                </div>

                {/* Picture display (Part 1, Part 3 & 4 graphics) */}
                {currentGroup.image_url && (
                  <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center shadow-xs">
                    <img
                      src={currentGroup.image_url}
                      alt="Question visual resource"
                      className="object-contain w-full h-full"
                    />
                  </div>
                )}

                {/* Part 3 & 4 Passage display */}
                {currentGroup.reading_passage_text && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-mono">
                    {currentGroup.reading_passage_text}
                  </div>
                )}

                {/* Audio controller block */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 w-10 shrink-0">
                      {formatTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const newTime = parseFloat(e.target.value);
                        setCurrentTime(newTime);
                        if (audioRef.current) audioRef.current.currentTime = newTime;
                      }}
                      className="flex-grow h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="text-[10px] font-mono text-slate-500 w-10 text-right shrink-0">
                      {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-2 rounded-full bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
                      >
                        {isPlaying ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white translate-x-0.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => rewind(3)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50"
                        title="Lùi 3 giây (Shift + Tab hoặc Mũi tên trái)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                      {[0.75, 1.0, 1.25].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            playbackRate === rate ? "bg-purple-600 text-white" : "text-slate-600"
                          }`}
                        >
                          {rate.toFixed(2)}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions review display */}
              <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                {currentGroup.questions.map((q) => {
                  const userAns = selectedAnswers[q.id] || null;
                  const isCorrect = userAns === q.correct_answer;
                  const isAnswered = !!userAns;

                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                          <span className="inline-flex items-center justify-center shrink-0 h-5 w-5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            Q{q.question_number}
                          </span>
                          <span>{q.question_content || "Nghe và chọn phương án đúng:"}</span>
                        </h4>
                        
                        {/* Correct/Incorrect Badge */}
                        {isCorrect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-150">
                            Đúng
                          </span>
                        ) : isAnswered ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-150">
                            Sai (Bạn chọn: {userAns})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                            Chưa trả lời
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {(
                          [
                            { key: "A", val: q.option_a },
                            { key: "B", val: q.option_b },
                            { key: "C", val: q.option_c },
                            ...(q.option_d ? [{ key: "D", val: q.option_d }] : []),
                          ] as { key: CorrectAnswerOption; val: string }[]
                        ).map((choice) => {
                          const isChoiceCorrect = choice.key === q.correct_answer;
                          const isChoiceSelected = userAns === choice.key;

                          let choiceStyle = "border-slate-200 text-slate-700";
                          let numStyle = "bg-slate-50 border-slate-200 text-slate-600";

                          if (isChoiceCorrect) {
                            choiceStyle = "border-green-500 bg-green-50/50 text-green-800 font-bold";
                            numStyle = "bg-green-600 border-green-600 text-white";
                          } else if (isChoiceSelected) {
                            choiceStyle = "border-red-500 bg-red-50/50 text-red-800 font-bold";
                            numStyle = "bg-red-600 border-red-600 text-white";
                          }

                          return (
                            <div
                              key={choice.key}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-xs leading-relaxed transition-all ${choiceStyle}`}
                            >
                              <span
                                className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold border shrink-0 ${numStyle}`}
                              >
                                {choice.key}
                              </span>
                              <span className="flex-grow">{choice.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Seq Navigation */}
                <div className="border-t border-slate-100 pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => selectGroup(Math.max(0, currentGroupIdx - 1))}
                    disabled={currentGroupIdx === 0}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Nhóm trước
                  </button>

                  <button
                    type="button"
                    onClick={() => selectGroup(Math.min(groups.length - 1, currentGroupIdx + 1))}
                    disabled={currentGroupIdx === groups.length - 1}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  >
                    Nhóm sau
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Collapsable Transcript & Explanation */}
              <div className="bg-white/80 border border-white/20 backdrop-blur-sm rounded-3xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full flex items-center justify-between p-6 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-purple-600" />
                    Xem lời thoại & giải thích chi tiết (Transcript & Explanation)
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      showExplanation ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showExplanation && (
                  <div className="p-6 space-y-6 bg-slate-50/50 border-t border-slate-100">
                    {/* Transcript English with word lookup */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Lời thoại tiếng Anh (Click vào từ để tra từ điển):
                      </h4>
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl text-xs leading-loose font-medium text-slate-700 select-none shadow-xs">
                        {currentGroup.transcript_text.split(/\s+/).map((word, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => handleWordClick(e, word)}
                            className="word-span inline-block mr-1.5 cursor-pointer hover:text-purple-600 transition-colors"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Translation Vietnamese */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Bản dịch Việt ngữ:
                      </h4>
                      <div className="bg-purple-50/20 border border-purple-100/30 p-4 rounded-2xl text-xs leading-relaxed text-slate-650 font-medium">
                        {currentGroup.translation_vi}
                      </div>
                    </div>

                    {/* Explanations for each question */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Giải thích chi tiết đáp án:
                      </h4>
                      <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                        {currentGroup.questions.map((q) => (
                          <div key={q.id} className="text-xs text-slate-650 leading-relaxed border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                            <span className="font-bold text-slate-800 block mb-1">
                              Câu {q.question_number} (Đáp án: {q.correct_answer})
                            </span>
                            <p>{q.explanation || "Không có giải thích chi tiết cho câu hỏi này."}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Question Map Grid (4 cols) */}
            <div className="lg:col-span-4 bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                Bản đồ câu hỏi ({totalQuestionsCount} câu)
              </h3>

              <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[420px] pr-1">
                {groups.flatMap((g, gIdx) =>
                  g.questions.map((q) => {
                    const userAns = selectedAnswers[q.id] || null;
                    const isCorrect = userAns === q.correct_answer;
                    const isAnswered = !!userAns;
                    const isActive = gIdx === currentGroupIdx;

                    let btnStyle = "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200";

                    if (isCorrect) {
                      btnStyle = "bg-green-500 text-white shadow-xs border border-green-600 hover:bg-green-600";
                    } else if (isAnswered) {
                      btnStyle = "bg-rose-500 text-white shadow-xs border border-rose-600 hover:bg-rose-600";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => selectGroup(gIdx)}
                        className={`h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${btnStyle} ${
                          isActive ? "ring-3 ring-purple-600 ring-offset-2" : ""
                        }`}
                      >
                        {q.question_number}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[10px] text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-green-500" />
                  <span>Đúng</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-rose-500" />
                  <span>Sai</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-slate-100 border border-slate-200" />
                  <span>Chưa trả lời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
