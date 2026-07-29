"use client";

import React, { useState, useTransition } from "react";
import { createQuestionGroup } from "@/app/actions/admin";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Download } from "lucide-react";
import AdminBulkImportModal from "./AdminBulkImportModal";

interface QuestionInput {
  question_number: number;
  question_content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  useful_phrases: string;
}

interface AdminQuestion {
  id: string;
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

interface AdminQuestionGroup {
  id: string;
  part_type: string;
  audio_url: string | null;
  image_url: string | null;
  reading_passage_text: string | null;
  transcript_text: string;
  translation_vi: string;
  passage_translation: string | null;
  questions: AdminQuestion[];
}

interface AdminQuestionsControlProps {
  testId: string;
  testTitle: string;
  initialGroups: AdminQuestionGroup[];
}

export default function AdminQuestionsControl({
  testId,
  testTitle,
  initialGroups,
}: AdminQuestionsControlProps) {
  const [groups, setGroups] = useState<AdminQuestionGroup[]>(initialGroups);
  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [partType, setPartType] = useState("part_1");
  const [audioUrl, setAudioUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [readingPassage, setReadingPassage] = useState("");
  const [passageTranslation, setPassageTranslation] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translationVi, setTranslationVi] = useState("");
  const [formError, setFormError] = useState("");

  // Questions inside new group
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      question_number: 1,
      question_content: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      explanation: "",
      useful_phrases: "",
    },
  ]);

  // UI state: toggle view of existing groups
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroupIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddQuestionField = () => {
    // Automatically guess next question number
    const maxNum = questions.reduce((max, q) => (q.question_number > max ? q.question_number : max), 0);
    setQuestions((prev) => [
      ...prev,
      {
        question_number: maxNum + 1,
        question_content: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        explanation: "",
        useful_phrases: "",
      },
    ]);
  };

  const handleRemoveQuestionField = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionInput, value: string | number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value } as QuestionInput;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (partType.includes("part_1") || partType.includes("part_2") || partType.includes("part_3") || partType.includes("part_4")) {
      // Listening parts usually require audio
      if (!audioUrl.trim()) {
        setFormError("Vui lòng nhập đường dẫn Audio (audio_url) cho các Part Listening.");
        return;
      }
    }

    // Validate that questions are filled
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim()) {
        setFormError(`Câu hỏi ${i + 1} cần có đầy đủ Option A, B, C.`);
        return;
      }
      if (partType !== "part_2" && !q.option_d.trim()) {
        setFormError(`Câu hỏi ${i + 1} (khác Part 2) cần có Option D.`);
        return;
      }
    }

    setFormError("");

    startTransition(async () => {
      try {
        const formattedQuestions = questions.map((q) => ({
          question_number: Number(q.question_number),
          question_content: q.question_content || null,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: partType === "part_2" ? null : q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          useful_phrases: q.useful_phrases || null,
        }));

        await createQuestionGroup(
          testId,
          partType,
          audioUrl || null,
          imageUrl || null,
          readingPassage || null,
          transcript,
          translationVi,
          passageTranslation || null,
          formattedQuestions
        );

        alert("Đã thêm nhóm câu hỏi thành công!");
        // Reset form
        setAudioUrl("");
        setImageUrl("");
        setReadingPassage("");
        setPassageTranslation("");
        setTranscript("");
        setTranslationVi("");
        setQuestions([
          {
            question_number: 1,
            question_content: "",
            option_a: "",
            option_b: "",
            option_c: "",
            option_d: "",
            correct_answer: "A",
            explanation: "",
            useful_phrases: "",
          },
        ]);
        window.location.reload();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Lỗi khi thêm nhóm câu hỏi";
        setFormError(errMsg);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh mục đề thi
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">
            Quản lý câu hỏi
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {testTitle}
          </h1>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Download className="h-4 w-4 rotate-180" />
            Nhập hàng loạt (Bulk JSON)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to Add Question Group (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-purple-600" />
            Thêm Nhóm Câu Hỏi Mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chọn Part
                </label>
                <select
                  value={partType}
                  onChange={(e) => setPartType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="part_1">Part 1 - Photo (Nghe)</option>
                  <option value="part_2">Part 2 - Question-Response (Nghe)</option>
                  <option value="part_3">Part 3 - Conversations (Nghe)</option>
                  <option value="part_4">Part 4 - Talks (Nghe)</option>
                  <option value="part_5">Part 5 - Incomplete Sentences (Đọc)</option>
                  <option value="part_6">Part 6 - Text Completion (Đọc)</option>
                  <option value="part_7">Part 7 - Reading Comprehension (Đọc)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đường dẫn ảnh (imageUrl - tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="URL ảnh Supabase Storage..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Audio URL (only for Part 1-4) */}
            {["part_1", "part_2", "part_3", "part_4"].includes(partType) && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đường dẫn Audio (audio_url - Bắt buộc cho Listening)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            {/* Reading Passage Text (for Part 6-7, or Part 3-4 graphics passage) */}
            {["part_3", "part_4", "part_6", "part_7"].includes(partType) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Đoạn văn đọc hiểu / Đoạn văn mô tả (reading_passage_text)
                  </label>
                  <textarea
                    placeholder="Nhập đoạn văn đọc hiểu..."
                    value={readingPassage}
                    onChange={(e) => setReadingPassage(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 h-24 resize-y"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bản dịch đoạn văn (passage_translation)
                  </label>
                  <textarea
                    placeholder="Nhập bản dịch tiếng Việt của đoạn văn..."
                    value={passageTranslation}
                    onChange={(e) => setPassageTranslation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 h-24 resize-y"
                  />
                </div>
              </div>
            )}

            {/* Transcripts (Only for Listening parts) */}
            {["part_1", "part_2", "part_3", "part_4"].includes(partType) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Transcript nguyên bản (Tiếng Anh)
                  </label>
                  <textarea
                    placeholder="Nhập lời thoại chính tả tiếng Anh..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 h-24 resize-y font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bản dịch nghĩa (Tiếng Việt)
                  </label>
                  <textarea
                    placeholder="Nhập bản dịch tiếng Việt tương ứng..."
                    value={translationVi}
                    onChange={(e) => setTranslationVi(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 h-24 resize-y"
                  />
                </div>
              </div>
            )}

            {/* Questions list header */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800">Danh sách câu hỏi con ({questions.length})</h3>
              <button
                type="button"
                onClick={handleAddQuestionField}
                className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg hover:bg-purple-100/50 cursor-pointer"
              >
                + Thêm câu hỏi con
              </button>
            </div>

            {/* Questions editor container */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {questions.map((q, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Xóa câu hỏi con"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Số thứ tự câu (TOEIC)
                      </label>
                      <input
                        type="number"
                        value={q.question_number}
                        onChange={(e) => handleQuestionChange(index, "question_number", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Đề bài câu hỏi (question_content - tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: What is suggested about..."
                        value={q.question_content}
                        onChange={(e) => handleQuestionChange(index, "question_content", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Options A B C D */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Option A</label>
                      <input
                        type="text"
                        value={q.option_a}
                        onChange={(e) => handleQuestionChange(index, "option_a", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Option B</label>
                      <input
                        type="text"
                        value={q.option_b}
                        onChange={(e) => handleQuestionChange(index, "option_b", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Option C</label>
                      <input
                        type="text"
                        value={q.option_c}
                        onChange={(e) => handleQuestionChange(index, "option_c", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    {partType !== "part_2" && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Option D</label>
                        <input
                          type="text"
                          value={q.option_d}
                          onChange={(e) => handleQuestionChange(index, "option_d", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Correct answer & Explanation */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Đáp án đúng</label>
                      <select
                        value={q.correct_answer}
                        onChange={(e) => handleQuestionChange(index, "correct_answer", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        {partType !== "part_2" && <option value="D">D</option>}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Giải thích đáp án (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Vì sao đáp án này đúng..."
                        value={q.explanation}
                        onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Từ vựng nổi bật (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Từ vựng / Cấu trúc..."
                        value={q.useful_phrases}
                        onChange={(e) => handleQuestionChange(index, "useful_phrases", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formError && (
              <span className="text-[10px] font-bold text-red-500 block">
                {formError}
              </span>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu Nhóm Câu Hỏi
            </button>
          </form>
        </div>

        {/* Right Column: List of Existing Question Groups (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">
            Các Nhóm Câu Hỏi Đang Có ({groups.length})
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {groups.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-400 text-xs">
                Chưa có câu hỏi nào trong đề thi này
              </div>
            ) : (
              groups.map((group: AdminQuestionGroup) => {
                const isExpanded = expandedGroupIds[group.id] || false;
                const minQ = group.questions && group.questions.length > 0
                  ? Math.min(...group.questions.map((q) => q.question_number))
                  : null;
                const maxQ = group.questions && group.questions.length > 0
                  ? Math.max(...group.questions.map((q) => q.question_number))
                  : null;

                const qRange = minQ === maxQ ? `Câu ${minQ}` : `Câu ${minQ} - ${maxQ}`;

                return (
                  <div key={group.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs text-left hover:bg-slate-50/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 uppercase">
                            {group.part_type.replace("_", " ")}
                          </span>
                          <span className="font-bold text-slate-700">{qRange}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-50 text-[11px] text-slate-500 space-y-3 bg-slate-50/30">
                        {group.audio_url && (
                          <div>
                            <span className="font-bold text-slate-700 block">Audio:</span>
                            <span className="font-mono text-[9px] break-all">{group.audio_url}</span>
                          </div>
                        )}
                        {group.image_url && (
                          <div>
                            <span className="font-bold text-slate-700 block">Hình ảnh:</span>
                            <span className="font-mono text-[9px] break-all block mb-1">{group.image_url}</span>
                            <div className="mt-1 max-w-[200px] border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <img src={group.image_url} alt="Preview" className="w-full h-auto object-contain max-h-[120px]" />
                            </div>
                          </div>
                        )}
                        {group.reading_passage_text && (
                          <div>
                            <span className="font-bold text-slate-700 block">Đoạn văn đọc:</span>
                            <p className="whitespace-pre-line mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100 text-[10px] font-mono">{group.reading_passage_text}</p>
                          </div>
                        )}
                        {group.passage_translation && (
                          <div>
                            <span className="font-bold text-slate-700 block">Bản dịch đoạn văn:</span>
                            <p className="whitespace-pre-line mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100 text-[10px]">{group.passage_translation}</p>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Các câu hỏi con:</span>
                          <div className="space-y-1.5">
                            {group.questions.map((q) => (
                              <div key={q.id} className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-700">Q{q.question_number}: {q.question_content || "Nghe/Đọc và chọn"}</span>
                                  <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-150 rounded font-bold text-[9px] shrink-0">Đáp án: {q.correct_answer}</span>
                                </div>
                                {q.explanation && (
                                  <div className="text-[10px] text-slate-500 bg-slate-50/50 p-1.5 rounded border border-slate-100">
                                    <span className="font-bold text-slate-600">Giải thích:</span> {q.explanation}
                                  </div>
                                )}
                                {q.useful_phrases && (
                                  <div className="text-[10px] text-purple-600 bg-purple-50/50 p-1.5 rounded border border-purple-100">
                                    <span className="font-bold text-purple-700">Từ vựng/Cấu trúc:</span> {q.useful_phrases}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AdminBulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        testId={testId}
        testTitle={testTitle}
        onImportSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
