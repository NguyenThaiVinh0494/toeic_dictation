import { getAdminOverviewStats } from "@/app/actions/admin";
import AnimateWrapper from "@/components/AnimateWrapper";
import {
  Users,
  Calendar,
  Volume2,
  BookOpen,
  Sparkles,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminOverviewStats();

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
          Tổng quan Hệ thống
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Báo cáo thống kê hoạt động luyện tập và làm đề thi thử của toàn bộ học viên.
        </p>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Tổng số học viên
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {stats.totalStudents} học viên
            </span>
          </div>
        </div>

        {/* Total Exam Attempts */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Lượt thi hoàn thành
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {stats.totalSessions} lượt
            </span>
          </div>
        </div>

        {/* Avg Listening & Reading Score */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Lọc Correct Avg (L / R)
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {stats.avgListeningScore} / {stats.avgReadingScore}
            </span>
          </div>
        </div>

        {/* Average Dictation Accuracy */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Độ chính xác chính tả
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {stats.avgAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* System info block */}
      <div className="bg-linear-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/5 blur-2xl"></div>
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
            Chào mừng Admin!
          </span>
          <h2 className="text-xl font-extrabold mt-3">
            Bảng điều khiển quản trị TOEIC Dictation Platform
          </h2>
          <p className="text-xs text-purple-100 mt-2 leading-relaxed">
            Sử dụng bảng quản trị này để quản lý danh sách học viên, xem tiến trình làm bài, tạo thêm các đề thi trọn bộ, và thêm mới câu hỏi trắc nghiệm / chép chính tả cho cả 7 Parts.
          </p>
        </div>
      </div>
    </div>
  );
}
