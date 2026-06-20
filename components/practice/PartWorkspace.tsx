"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronRight,
  CheckCircle,
  XCircle,
  BookOpen,
  Info,
  ChevronLeft,
  Settings,
  Globe,
  Loader2,
} from "lucide-react";
import { cleanWord, diffWords, DiffResult } from "@/utils/diff";
import { saveQuestionProgress } from "@/app/actions/practice";
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


interface PartWorkspaceProps {
  partId: string;
  testId: string;
  groups: QuestionGroup[];
}

export default function PartWorkspace({ partId, testId, groups }: PartWorkspaceProps) {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);

  // Phase states:
  // 'test' -> Answering multiple choice questions
  // 'dictation' -> Dictation typing input
  // 'review' -> Viewing results of dictation and transcript
  const [phase, setPhase] = useState<"test" | "dictation" | "review">("test");

  // Phase 1 (Test) states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, CorrectAnswerOption>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);

  // Phase 2 (Dictation) states
  const [dictationInput, setDictationInput] = useState("");
  const [dictationResult, setDictationResult] = useState<DiffResult[] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [dictationSubmitted, setDictationSubmitted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Audio player states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Tooltip dictionary states
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
  
  // Dictionary API cache
  const dictCache = useRef<Record<string, { ipa?: string; definition?: string }>>({});

  const currentGroup = groups[currentGroupIdx];

  // Auto-focus textarea in dictation phase
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (phase === "dictation" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  // Reset states when changing question groups
  const resetGroupState = (idx: number) => {
    setCurrentGroupIdx(idx);
    setPhase("test");
    setSelectedAnswers({});
    setTestSubmitted(false);
    setDictationInput("");
    setDictationResult(null);
    setAccuracy(null);
    setDictationSubmitted(false);
    setShowTranslation(false);
    setTooltip(null);

    // Stop and reload audio for new group
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  };

  // Audio helper functions wrapped in useCallback to prevent hook dependency issues
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

  // Keyboard Hotkeys (placed after helper function declarations)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, rewind, forward]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  // Phase 1 (Test) actions
  const handleAnswerSelect = (questionId: string, option: CorrectAnswerOption) => {
    if (testSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleTestSubmit = () => {
    // Verify all questions are answered
    const allAnswered = currentGroup.questions.every((q) => selectedAnswers[q.id]);
    if (!allAnswered) {
      alert("Vui lòng trả lời toàn bộ các câu hỏi trắc nghiệm!");
      return;
    }
    setTestSubmitted(true);
  };

  // Phase 2 (Dictation) actions
  const handleDictationSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (dictationSubmitted || isSavingProgress) return;

    if (!dictationInput.trim()) {
      alert("Vui lòng gõ nội dung nghe được trước khi nộp bài!");
      return;
    }

    setIsSavingProgress(true);
    const diff = diffWords(currentGroup.transcript_text, dictationInput);
    setDictationResult(diff);

    // Calculate accuracy percentage
    const totalWords = diff.length;
    const correctWords = diff.filter((w) => w.status === "correct").length;
    const computedAccuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    setAccuracy(computedAccuracy);
    setDictationSubmitted(true);
    setPhase("review");

    // Reveal translation automatically if 100% accurate
    if (computedAccuracy === 100) {
      setShowTranslation(true);
    }

    // Save progress to database via Server Action
    try {
      const promises = currentGroup.questions.map((q) => {
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
      console.error("Failed to save progress to DB:", err);
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Click to translate popover dictionary fetch
  const handleWordClick = async (event: React.MouseEvent<HTMLSpanElement>, rawWord: string) => {
    const cleaned = cleanWord(rawWord);
    if (!cleaned) return;

    // Calculate popup absolute position
    if (!containerRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    const top = rect.top - parentRect.top - 100; // Position above word
    const left = rect.left - parentRect.left + rect.width / 2;

    setTooltip({
      word: cleaned,
      top,
      left,
      loading: true,
      error: false,
    });

    // Check cache
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

      // Cache result
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

  // Close dictionary tooltip when clicking elsewhere
  const handleContainerClick = (e: React.MouseEvent) => {
    if (tooltip && !(e.target as HTMLElement).closest(".word-span")) {
      setTooltip(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 w-full select-none"
    >
      {/* Audio player hidden element */}
      <audio
        ref={audioRef}
        src={currentGroup.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Dictionary Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              position: "absolute",
              top: `${tooltip.top}px`,
              left: `${tooltip.left}px`,
              transform: "translateX(-50%)",
            }}
            className="z-50 w-64 bg-slate-900 text-white p-4 rounded-xl shadow-xl text-xs flex flex-col gap-1.5 pointer-events-auto"
          >
            {/* Arrow */}
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

      {/* Left panel: Media & Audio Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Media card */}
        <div className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-purple-500" />
              Tài nguyên nghe
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Nhóm {currentGroupIdx + 1}/{groups.length}
            </span>
          </div>

          {/* Picture display */}
          {currentGroup.image_url ? (
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-xs flex items-center justify-center">
              <img
                src={currentGroup.image_url}
                alt="TOEIC Listening Practice"
                className="object-contain w-full h-full"
              />
            </div>
          ) : partId === "part-1" ? (
            <div className="aspect-4/3 w-full rounded-2xl bg-purple-50/50 border border-dashed border-purple-200 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <span>🖼️ Không tìm thấy hình ảnh mô tả</span>
            </div>
          ) : null}

          {/* Part 3 & 4 Passage display if any */}
          {currentGroup.reading_passage_text && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-mono">
              {currentGroup.reading_passage_text}
            </div>
          )}

          {/* Fallback image/text box for part 2 */}
          {partId === "part-2" && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 rounded-2xl border border-indigo-100/30 text-center flex flex-col items-center justify-center gap-2 min-h-40">
              <Volume2 className="h-10 w-10 text-indigo-500 animate-pulse" />
              <h4 className="font-bold text-slate-800 text-xs">Part 2: Hỏi & Đáp</h4>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Nghe kỹ câu hỏi và 3 lựa chọn trả lời bên dưới. Phản xạ nhanh và chọn đáp án đúng nhất.
              </p>
            </div>
          )}

          {/* Audio controller block */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 mt-2">
            {/* Progress timeline */}
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
                onChange={handleProgressBarChange}
                className="flex-grow h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-slate-500 w-10 text-right shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Play controls */}
            <div className="flex items-center justify-between">
              {/* Play / pause buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white translate-x-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => rewind(3)}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Tua lùi 3 giây (Shift + Tab hoặc Mũi tên trái)"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      playbackRate === rate
                        ? "bg-purple-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {rate.toFixed(2)}x
                  </button>
                ))}
              </div>
            </div>

            {/* Hotkeys reminder banner */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 border-t border-slate-200/50 pt-2 font-medium">
              <Info className="h-3 w-3 shrink-0" />
              <span>
                Phím tắt: <b>Ctrl / P</b> (Play/Pause), <b>Shift+Tab / Mũi tên trái</b> (Lùi 3s), <b>Mũi tên phải</b> (Tiến 3s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Workspace Form (Phase 1 & 2) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {/* Phase 1: Multiple choice test form */}
          {phase === "test" && (
            <motion.div
              key="test-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6"
            >
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Bước 1: Trắc nghiệm (Test Phase)
                </h3>
                <span className="text-[11px] bg-amber-50 border border-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  Test
                </span>
              </div>

              {/* Questions list */}
              <div className="space-y-6">
                {currentGroup.questions.map((q) => (
                  <div key={q.id} className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="inline-flex items-center justify-center shrink-0 h-5 w-5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Q{q.question_number}
                      </span>
                      <span>
                        {testSubmitted
                          ? q.question_content || "Nghe và chọn phương án trả lời chính xác:"
                          : partId === "part-2"
                          ? "Mark your answer on your answer sheet."
                          : partId === "part-1"
                          ? "Look at the picture and choose the best statement."
                          : q.question_content || "Nghe và chọn phương án trả lời chính xác:"}
                      </span>
                    </h4>

                    {/* Choice items */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {(
                        [
                          { key: "A", val: q.option_a },
                          { key: "B", val: q.option_b },
                          { key: "C", val: q.option_c },
                          ...(q.option_d ? [{ key: "D", val: q.option_d }] : []),
                        ] as { key: CorrectAnswerOption; val: string }[]
                      ).map((choice) => {
                        const isSelected = selectedAnswers[q.id] === choice.key;
                        const isCorrect = choice.key === q.correct_answer;
                        const isIncorrect = isSelected && !isCorrect;

                        let buttonClass = "border-slate-200 hover:bg-slate-50";
                        if (testSubmitted) {
                          if (isCorrect) {
                            buttonClass = "border-green-300 bg-green-50/50 text-green-700";
                          } else if (isIncorrect) {
                            buttonClass = "border-red-300 bg-red-50/50 text-red-700";
                          } else {
                            buttonClass = "border-slate-100 opacity-50";
                          }
                        } else if (isSelected) {
                          buttonClass = "border-purple-500 bg-purple-50/50 text-purple-800";
                        }

                        return (
                          <button
                            key={choice.key}
                            type="button"
                            onClick={() => handleAnswerSelect(q.id, choice.key)}
                            disabled={testSubmitted}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 active:scale-[0.99] cursor-pointer ${buttonClass}`}
                          >
                            <span
                              className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-extrabold border shrink-0 ${
                                isSelected || (testSubmitted && isCorrect)
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              {choice.key}
                            </span>
                            <span className="flex-grow">
                              {testSubmitted
                                ? choice.val
                                : partId === "part-1" || partId === "part-2"
                                ? `Phương án ${choice.key}`
                                : choice.val}
                            </span>

                            {testSubmitted && isCorrect && (
                              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            )}
                            {testSubmitted && isIncorrect && (
                              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Answer Explanation */}
                    {testSubmitted && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed mt-2"
                      >
                        <div className="font-bold text-indigo-700 flex items-center gap-1 mb-1">
                          <Settings className="h-3.5 w-3.5 animate-spin-slow" />
                          Giải thích câu Q{q.question_number}:
                        </div>
                        <p>{q.explanation}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit / Unlock next phase button */}
              <div className="border-t border-slate-100 pt-4 flex justify-end">
                {!testSubmitted ? (
                  <button
                    type="button"
                    onClick={handleTestSubmit}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Nộp câu trả lời
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhase("dictation")}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Tiến hành Chép chính tả (Dictation)
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase 2: Dictation typing input */}
          {phase === "dictation" && (
            <motion.form
              key="dictation-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleDictationSubmit}
              className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6"
            >
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                  Bước 2: Nghe chép chính tả (Dictation Phase)
                </h3>
                <span className="text-[11px] bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                  Dictation
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600">
                  Gõ lại toàn bộ những gì bạn nghe được (Transcript):
                </label>
                <textarea
                  ref={textareaRef}
                  value={dictationInput}
                  onChange={(e) => setDictationInput(e.target.value)}
                  placeholder="Gõ chính tả tại đây... (Ví dụ: The woman is painting a picture...)"
                  className="w-full min-h-36 p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm leading-relaxed focus:outline-none transition-all"
                  disabled={isSavingProgress}
                />
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPhase("test")}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Xem lại Trắc nghiệm
                </button>

                <button
                  type="submit"
                  disabled={isSavingProgress || !dictationInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  {isSavingProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Nộp bài chép
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Phase 3: Review / Highlighted transcript */}
          {phase === "review" && (
            <motion.div
              key="review-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 border border-white/20 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6"
            >
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Kết quả chép chính tả (Evaluation)
                </h3>
                <span className="text-[11px] bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  Review
                </span>
              </div>

              {/* Accuracy display score card */}
              {accuracy !== null && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500">Độ chính xác nghe chép</h4>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {accuracy}% <span className="text-xs font-normal text-slate-400">từ chính xác</span>
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center font-extrabold text-sm border-3 ${
                      accuracy === 100
                        ? "border-green-500 bg-green-50 text-green-600"
                        : accuracy >= 70
                        ? "border-amber-500 bg-amber-50 text-amber-600"
                        : "border-rose-500 bg-rose-50 text-rose-600"
                    }`}
                  >
                    {accuracy === 100 ? "💯" : `${accuracy}`}
                  </div>
                </div>
              )}

              {/* Evaluated transcript with click-to-translate */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Transcript (Click vào từ để dịch):
                </h4>
                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl min-h-20 text-sm leading-loose tracking-wide select-none">
                  {dictationResult?.map((item, idx) => {
                    let styleClass = "text-slate-700";
                    if (item.status === "correct") {
                      styleClass = "text-green-500 hover:text-green-600 font-medium";
                    } else if (item.status === "incorrect") {
                      styleClass = "text-red-500 underline decoration-red-500 hover:text-red-600";
                    } else if (item.status === "missing") {
                      styleClass = "text-yellow-700 bg-yellow-100 px-1 rounded-md hover:bg-yellow-200/80";
                    }

                    return (
                      <span
                        key={idx}
                        onClick={(e) => handleWordClick(e, item.word)}
                        className={`word-span inline-block mr-1.5 cursor-pointer transition-colors ${styleClass}`}
                      >
                        {item.word}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Translation dropdown toggle */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="self-start text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="h-4 w-4" />
                  {showTranslation ? "Ẩn bản dịch tiếng Việt" : "Xem bản dịch tiếng Việt"}
                </button>

                {showTranslation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="bg-purple-50/20 border border-purple-100/30 p-4 rounded-xl text-xs text-slate-600 leading-relaxed font-medium"
                  >
                    <div className="font-bold text-purple-700 flex items-center gap-1 mb-1">
                      🗣️ Bản dịch Việt ngữ:
                    </div>
                    <p>{currentGroup.translation_vi}</p>
                  </motion.div>
                )}
              </div>

              {/* Action review navigation buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("dictation");
                    setDictationSubmitted(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Làm lại chính tả (Retry)
                </button>

                {currentGroupIdx < groups.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => resetGroupState(currentGroupIdx + 1)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Câu tiếp theo
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Hoàn thành bài tập!</span>
                    <Link
                      href={`/practice/${partId}`}
                      className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
                    >
                      Quay lại Menu
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
