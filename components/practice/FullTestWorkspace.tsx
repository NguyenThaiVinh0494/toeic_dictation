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

  // Result scorecard states
  const [score, setScore] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Dictation review mode states (when reviewing incorrect questions)
  const [reviewGroupIdx, setReviewGroupIdx] = useState<number | null>(null);
  const [reviewPhase, setReviewPhase] = useState<"dictation" | "review">("dictation");
  const [dictationInput, setDictationInput] = useState("");
  const [dictationResult, setDictationResult] = useState<DiffResult[] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);

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
    if (status !== "testing") return;

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
  }, [status, handleExamSubmit]);

  // Keyboard Hotkeys (placed after togglePlay, rewind, forward are declared)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.tagName === "INPUT"
        ) {
          return;
        }
        e.preventDefault();
        togglePlay();
      }

      if (
        (e.ctrlKey && e.code === "ArrowLeft") ||
        (e.shiftKey && e.code === "Tab")
      ) {
        e.preventDefault();
        rewind(3);
      }

      if (e.ctrlKey && e.code === "ArrowRight") {
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

  // Start Dictation Review for a wrong question's group
  const startReviewGroup = (groupIdx: number) => {
    setReviewGroupIdx(groupIdx);
    setReviewPhase("dictation");
    setDictationInput("");
    setDictationResult(null);
    setAccuracy(null);
    setShowTranslation(false);
    
    // Stop exam audio and load review audio
    setIsPlaying(false);
    setCurrentTime(0);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
      }
    }, 50);
  };

  // Submit Dictation during Review
  const handleReviewDictationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewGroupIdx === null || isSavingReview) return;
    if (!dictationInput.trim()) return;

    setIsSavingReview(true);
    const targetGroup = groups[reviewGroupIdx];
    const diff = diffWords(targetGroup.transcript_text, dictationInput);
    setDictationResult(diff);

    const totalWords = diff.length;
    const correctWords = diff.filter((w) => w.status === "correct").length;
    const computedAccuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

    setAccuracy(computedAccuracy);
    setReviewPhase("review");

    if (computedAccuracy === 100) {
      setShowTranslation(true);
    }

    // Save dictation progress to database (linking to this session)
    try {
      const promises = targetGroup.questions.map((q) => {
        const userAnswer = selectedAnswers[q.id] || null;
        const isCorrect = userAnswer === q.correct_answer;
        return saveQuestionProgress(
          q.id,
          testId,
          userAnswer,
          isCorrect,
          computedAccuracy,
          dictationInput
        );
      });
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReview(false);
    }
  };

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
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;
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
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={
          (reviewGroupIdx !== null
            ? groups[reviewGroupIdx].audio_url
            : currentGroup?.audio_url) || undefined
        }
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
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

      {/* VIEW 1: TESTING PORTAL */}
      {status === "testing" && (
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

              {/* Part 1 Picture display */}
              {currentGroup.part_type === "part_1" && currentGroup.image_url && (
                <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
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
                      title="Lùi 3 giây (Shift + Tab)"
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

            {/* Questions area */}
            <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              {currentGroup.questions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                    <span className="inline-flex items-center justify-center shrink-0 h-5 w-5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Q{q.question_number}
                    </span>
                    <span>{q.question_content || "Listen and choose the correct option:"}</span>
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
                          <span className="flex-grow">{choice.val}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Navigation */}
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
                      onClick={() => selectGroup(gIdx)}
                      className={`h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                        isActiveGroup
                          ? "ring-2 ring-purple-600 bg-purple-100 text-purple-700"
                          : isAnswered
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
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

          {/* Dictation Review Portal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Incorrect questions list sidebar (5 cols) */}
            <div className="lg:col-span-5 bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <XCircle className="h-4.5 w-4.5 text-rose-500" />
                Câu hỏi làm sai ({wrongQuestions.length} câu)
              </h3>

              {wrongQuestions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  🎉 Tuyệt vời! Bạn đã trả lời đúng 100% các câu hỏi trong đề thi này!
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[450px] pr-1">
                  {wrongQuestions.map((wq) => {
                    const isReviewingThis = reviewGroupIdx === wq.groupIdx;
                    const selectedAns = selectedAnswers[wq.question.id] || "Không trả lời";
                    return (
                      <button
                        key={wq.question.id}
                        type="button"
                        onClick={() => startReviewGroup(wq.groupIdx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isReviewingThis
                            ? "border-purple-500 bg-purple-50/50 text-purple-800"
                            : "border-slate-150 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                            Q{wq.question.question_number}
                          </span>
                          <span className="text-[10px] text-slate-400">({getPartBadge(groups[wq.groupIdx].part_type)})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-red-500 line-through">Bạn: {selectedAns}</span>
                          <span className="text-green-600 font-bold">Đáp án: {wq.question.correct_answer}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dictation Review Form (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {reviewGroupIdx === null ? (
                <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-12 rounded-3xl text-center shadow-xs text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                  <Volume2 className="h-10 w-10 text-slate-400 animate-bounce" />
                  <p className="font-semibold text-slate-700">Luyện nghe chép sửa lỗi sai (Dictation Review)</p>
                  <p className="max-w-xs leading-relaxed text-slate-400">
                    Vui lòng chọn một câu hỏi làm sai ở danh sách bên trái để tiến hành nghe và chép chính tả lại đoạn hội thoại/bài nói đó.
                  </p>
                </div>
              ) : (
                <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6">
                  {/* Title of group under review */}
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                      Luyện chép lại Nhóm câu của Q{groups[reviewGroupIdx].questions[0].question_number}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {getPartBadge(groups[reviewGroupIdx].part_type)}
                    </span>
                  </div>

                  {/* Audio controller block */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
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

                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 border-t border-slate-200/50 pt-2 font-medium">
                      <Info className="h-3 w-3 shrink-0" />
                      <span>
                        Phím tắt: <b>Space</b> (Play/Pause), <b>Shift+Tab</b> / <b>Ctrl+⬅</b> (Tua lùi 3s)
                      </span>
                    </div>
                  </div>

                  {/* Dictation Phase or Review Phase */}
                  {reviewPhase === "dictation" ? (
                    <form onSubmit={handleReviewDictationSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-600">
                          Nghe kỹ audio và chép chính tả transcript tại đây:
                        </label>
                        <textarea
                          value={dictationInput}
                          onChange={(e) => setDictationInput(e.target.value)}
                          placeholder="Gõ chính tả..."
                          className="w-full min-h-32 p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-xs leading-relaxed focus:outline-none transition-all"
                          autoFocus
                          disabled={isSavingReview}
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={!dictationInput.trim() || isSavingReview}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          {isSavingReview ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              Nộp bài chép
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {accuracy !== null && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-500">Độ chính xác chép sửa sai</h4>
                            <p className="text-lg font-black text-slate-900 mt-1">
                              {accuracy}% <span className="text-[11px] font-normal text-slate-400">chính xác</span>
                            </p>
                          </div>
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-[11px] border-2 ${
                              accuracy === 100
                                ? "border-green-500 bg-green-50 text-green-600"
                                : "border-rose-500 bg-rose-50 text-rose-600"
                            }`}
                          >
                            {accuracy}%
                          </div>
                        </div>
                      )}

                      {/* Display comparison with dictionary onClick */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase">Transcript (Click vào từ để dịch):</h4>
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs leading-loose font-medium select-none">
                          {dictationResult?.map((item, idx) => {
                            let styleClass = "text-slate-700";
                            if (item.status === "correct") {
                              styleClass = "text-green-500 hover:text-green-600 font-semibold";
                            } else if (item.status === "incorrect") {
                              styleClass = "text-red-500 underline decoration-red-500 hover:text-red-600";
                            } else if (item.status === "missing") {
                              styleClass = "text-yellow-700 bg-yellow-100 px-1 rounded hover:bg-yellow-250/50";
                            }
                            return (
                              <span
                                key={idx}
                                onClick={(e) => handleWordClick(e, item.word)}
                                className="word-span inline-block mr-1.5 cursor-pointer transition-colors"
                              >
                                <span className={styleClass}>{item.word}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Translate Toggle */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowTranslation(!showTranslation)}
                          className="self-start text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {showTranslation ? "Ẩn dịch tiếng Việt" : "Xem dịch tiếng Việt"}
                        </button>
                        {showTranslation && (
                          <div className="bg-purple-50/20 border border-purple-100/30 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
                            <p className="font-bold text-purple-700 mb-1">🗣️ Bản dịch Việt ngữ:</p>
                            <p>{groups[reviewGroupIdx].translation_vi}</p>
                          </div>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewPhase("dictation");
                            setDictationInput("");
                            setDictationResult(null);
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Chép lại (Retry)
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewGroupIdx(null)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                        >
                          Quay lại danh sách câu sai
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
