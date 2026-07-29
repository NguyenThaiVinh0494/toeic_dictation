"use client";

import React, { useState, useTransition } from "react";
import { createBook, createTest } from "@/app/actions/admin";
import Link from "next/link";
import { Plus, BookOpen, ChevronRight, Loader2, ClipboardList } from "lucide-react";
import AnimateWrapper from "@/components/AnimateWrapper";

interface TestItem {
  id: string;
  title: string;
  bookTitle: string;
  questionGroupsCount: number;
  questionsCount: number;
}

interface BookItem {
  id: string;
  title: string;
}

interface AdminTestsControlProps {
  initialTests: TestItem[];
  books: BookItem[];
}

export default function AdminTestsControl({
  initialTests,
  books,
}: AdminTestsControlProps) {
  const [tests, setTests] = useState<TestItem[]>(initialTests);
  const [isPending, startTransition] = useTransition();

  // Book Form states
  const [bookTitle, setBookTitle] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookError, setBookError] = useState("");

  // Test Form states
  const [testTitle, setTestTitle] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [testError, setTestError] = useState("");

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      setBookError("Vui lòng điền tên sách đề");
      return;
    }
    setBookError("");

    startTransition(async () => {
      try {
        const newBook = await createBook(bookTitle, bookDesc);
        alert(`Đã thêm sách thành công! ID: ${newBook.id}`);
        setBookTitle("");
        setBookDesc("");
        // Reload page to reflect book dropdown changes
        window.location.reload();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Lỗi khi thêm sách";
        setBookError(errMsg);
      }
    });
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !selectedBookId) {
      setTestError("Vui lòng nhập tên đề và chọn sách đề tương ứng");
      return;
    }
    setTestError("");

    startTransition(async () => {
      try {
        const newTest = await createTest(selectedBookId, testTitle);
        alert(`Đã thêm đề thi thành công! ID: ${newTest.id}`);
        setTestTitle("");
        setSelectedBookId("");
        // Reload page to reflect lists changes
        window.location.reload();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Lỗi khi thêm đề thi";
        setTestError(errMsg);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Forms column (Add Book & Add Test) */}
      <div className="space-y-8 lg:col-span-1">
        {/* Add Book Box */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-purple-600" />
            Thêm Sách Đề Mới (Book)
          </h2>
          <form onSubmit={handleAddBook} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tên sách đề
              </label>
              <input
                type="text"
                placeholder="Ví dụ: ETS 2024"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mô tả sách (tùy chọn)
              </label>
              <textarea
                placeholder="Mô tả tóm tắt về đề thi..."
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 h-16 resize-none"
              />
            </div>
            {bookError && (
              <span className="text-[10px] font-bold text-red-500 block">
                {bookError}
              </span>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tạo Sách Đề
            </button>
          </form>
        </div>

        {/* Add Test Box */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-purple-600" />
            Thêm Đề Thi Mới (Test)
          </h2>
          <form onSubmit={handleAddTest} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Thuộc Sách Đề
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="">-- Chọn Sách Đề --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tên đề thi
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Test 1"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>
            {testError && (
              <span className="text-[10px] font-bold text-red-500 block">
                {testError}
              </span>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tạo Đề Thi
            </button>
          </form>
        </div>
      </div>

      {/* Tests Catalog list column */}
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-800">Danh mục Đề thi Hiện tại</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Tên đề thi / Sách đề</th>
                <th className="px-6 py-4 text-center">Số nhóm câu</th>
                <th className="px-6 py-4 text-center">Tổng số câu</th>
                <th className="px-6 py-4 text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Chưa có đề thi nào được tạo
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{test.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 uppercase font-semibold">
                          {test.bookTitle}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {test.questionGroupsCount} nhóm
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {test.questionsCount} câu hỏi
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/tests/${test.id}/questions`}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform"
                      >
                        Thêm câu hỏi
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
