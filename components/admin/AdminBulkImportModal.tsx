"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, Loader2, AlertTriangle, FileText, Info } from "lucide-react";
import { importTestQuestionsBulk } from "@/app/actions/admin";

interface AdminBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testTitle: string;
  onImportSuccess: () => void;
}

const SCHEMA_TEMPLATE = `[
  {
    "part_type": "part_1",
    "audio_url": "https://example.com/audio.mp3",
    "image_url": "https://example.com/image.jpg",
    "reading_passage_text": null,
    "transcript_text": "The man is working at the desk.",
    "translation_vi": "Người đàn ông đang làm việc tại bàn.",
    "passage_translation": null,
    "questions": [
      {
        "question_number": 1,
        "question_content": null,
        "option_a": "The man is cooking.",
        "option_b": "The man is working at the desk.",
        "option_c": "The man is running.",
        "option_d": "The man is sleeping.",
        "correct_answer": "B",
        "explanation": "Dựa vào tranh chọn B.",
        "useful_phrases": "work at the desk: làm việc tại bàn"
      }
    ]
  }
]`;

export default function AdminBulkImportModal({
  isOpen,
  onClose,
  testId,
  testTitle,
  onImportSuccess,
}: AdminBulkImportModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [clearExisting, setClearExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setError(null);
  };

  // Perform schema validation on client side
  const validateJsonSchema = (data: unknown) => {
    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu gốc phải là một Mảng (Array) chứa danh sách các nhóm câu hỏi.");
    }

    if (data.length === 0) {
      throw new Error("Mảng dữ liệu không được rỗng.");
    }

    const validParts = ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6", "part_7"];
    const groups = data as Array<{
      part_type?: string;
      questions?: Array<{
        question_number?: number;
        option_a?: string;
        option_b?: string;
        option_c?: string;
        option_d?: string | null;
        correct_answer?: string;
      }>;
    }>;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const gIndex = `Nhóm thứ ${i + 1}`;

      if (!group.part_type) {
        throw new Error(`${gIndex}: Thiếu trường 'part_type' (ví dụ: 'part_1').`);
      }
      if (!validParts.includes(group.part_type)) {
        throw new Error(`${gIndex}: 'part_type' không hợp lệ. Phải là một trong: ${validParts.join(", ")}`);
      }
      if (!group.questions || !Array.isArray(group.questions)) {
        throw new Error(`${gIndex}: Thiếu hoặc sai định dạng trường 'questions' (phải là Array).`);
      }

      for (let j = 0; j < group.questions.length; j++) {
        const q = group.questions[j];
        const qIndex = `${gIndex}, Câu hỏi thứ ${j + 1}`;

        if (typeof q.question_number !== "number") {
          throw new Error(`${qIndex}: 'question_number' phải là một số.`);
        }
        if (!q.option_a || !q.option_b || !q.option_c) {
          throw new Error(`${qIndex}: Thiếu 'option_a', 'option_b' hoặc 'option_c' (bắt buộc).`);
        }
        if (group.part_type !== "part_2" && !q.option_d) {
          throw new Error(`${qIndex}: Đối với Part khác Part 2, bắt buộc phải có 'option_d'.`);
        }
        if (!q.correct_answer || !["A", "B", "C", "D"].includes(q.correct_answer)) {
          throw new Error(`${qIndex}: 'correct_answer' phải là A, B, C hoặc D.`);
        }
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Chỉ chấp nhận tệp tin định dạng JSON (.json)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonInput(text);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      setError("Vui lòng dán dữ liệu JSON hoặc tải tệp lên.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseErr) {
        throw new Error("Lỗi cú pháp JSON. Vui lòng kiểm tra lại dấu phẩy, ngoặc kép.");
      }

      // Step 2: Validate JSON Schema
      validateJsonSchema(parsedData);

      // Step 3: Call Server Action
      const result = await importTestQuestionsBulk(testId, parsedData, clearExisting);
      if (result.success) {
        setSuccess("Nhập câu hỏi hàng loạt thành công!");
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Có lỗi xảy ra khi lưu vào Database.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định khi xử lý JSON.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(SCHEMA_TEMPLATE);
    alert("Đã copy JSON mẫu vào Clipboard!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col mx-4 max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>📥</span> Nhập câu hỏi hàng loạt (JSON Import)
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase">
                  Đề thi: {testTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Layout body */}
            <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left pane: Textarea input / File upload (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    dragActive
                      ? "border-purple-500 bg-purple-50/50"
                      : "border-slate-200 hover:border-purple-300 bg-slate-50/30"
                  }`}
                >
                  <Upload className="h-8 w-8 text-purple-500 mb-2 animate-bounce" />
                  <p className="text-xs text-slate-655 font-bold">
                    Kéo thả file JSON vào đây hoặc{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-purple-650 hover:underline cursor-pointer font-extrabold"
                    >
                      chọn file từ máy tính
                    </button>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Chỉ chấp nhận tệp tin .json</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                  />
                </div>

                <form onSubmit={handleImportSubmit} className="flex-grow flex flex-col gap-4">
                  <div className="flex-grow flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dán nội dung JSON đề thi:
                    </label>
                    <textarea
                      placeholder="Dán mã JSON đề thi ở đây..."
                      value={jsonInput}
                      onChange={handleJsonChange}
                      className="w-full min-h-[220px] p-3 text-[11px] font-mono border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-slate-50/30 resize-y leading-normal"
                    />
                  </div>

                  {/* Overwrite checkbox */}
                  <div className="flex items-center gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="clearExisting"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-350 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="clearExisting"
                      className="text-xs font-bold text-slate-700 cursor-pointer select-none"
                    >
                      Xóa toàn bộ câu hỏi cũ của đề thi này trước khi nhập mới
                    </label>
                  </div>

                  {/* Message displays */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    type="submit"
                    disabled={loading || !jsonInput.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý nhập câu hỏi...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Xác nhận và Nhập dữ liệu
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right pane: Schema template instructions (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Info className="h-4 w-4 text-purple-600 shrink-0" />
                    Hướng dẫn & Cấu trúc Mẫu
                  </h3>

                  <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
                    <p>
                      Mỗi đề thi TOEIC sẽ bao gồm một danh sách mảng các nhóm câu hỏi (groups). Mỗi nhóm câu hỏi chứa các thuộc tính mô tả đoạn văn, hình ảnh, âm thanh, transcript và danh sách các câu hỏi trắc nghiệm con.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>
                        <b>part_type:</b> part_1, part_2, ..., part_7.
                      </li>
                      <li>
                        <b>correct_answer:</b> Chỉ chấp nhận A, B, C, D.
                      </li>
                      <li>
                        <b>option_d:</b> Có thể để `null` đối với Part 2.
                      </li>
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={copyTemplate}
                        className="px-2.5 py-1 text-[9px] font-bold bg-white hover:bg-slate-50 text-slate-650 border border-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Copy code mẫu
                      </button>
                    </div>
                    <pre className="w-full max-h-[220px] overflow-y-auto p-3 text-[9px] font-mono bg-slate-900 text-slate-200 rounded-xl leading-normal">
                      {SCHEMA_TEMPLATE}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
