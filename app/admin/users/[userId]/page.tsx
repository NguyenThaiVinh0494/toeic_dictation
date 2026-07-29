import { getAdminUserDetail } from "@/app/actions/admin";
import Link from "next/link";
import { ArrowLeft, Clock, Award, CheckCircle, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const detail = await getAdminUserDetail(userId);

  if (!detail.profile) {
    redirect("/admin/users");
  }

  const { profile, sessions, detailedProgress } = detail;

  // Compute stats
  const totalSessions = sessions.length;
  const dictationRows = detailedProgress.filter((p) => p.dictation_accuracy !== null);
  const avgAccuracy = dictationRows.length > 0
    ? Math.round(dictationRows.reduce((acc, p) => acc + (p.dictation_accuracy || 0), 0) / dictationRows.length)
    : 0;

  const totalQuestions = detailedProgress.length;
  const correctAnswers = detailedProgress.filter((p) => p.is_correct).length;
  const correctRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const formatTimeSpent = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${sec} giây`;
    return `${m}p ${s}s`;
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách học viên
        </Link>
      </div>

      {/* Profile summary card */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
            {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
          </div>
          <div>
            <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider block">
              Chi tiết học tập
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {profile.full_name || "Học viên"}
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Đăng ký ngày: {new Date(profile.created_at).toLocaleDateString("vi-VN")} | ID: {profile.id}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Completed exams */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
            Tổng lượt thi thử
          </span>
          <span className="text-xl font-extrabold text-slate-900 block mt-1">
            {totalSessions} bài thi
          </span>
        </div>

        {/* Avg Accuracy */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
            Chép chính tả trung bình
          </span>
          <span className="text-xl font-extrabold text-slate-900 block mt-1">
            {avgAccuracy}%
          </span>
        </div>

        {/* Correct Rate */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
            Tỷ lệ trả lời đúng
          </span>
          <span className="text-xl font-extrabold text-slate-900 block mt-1">
            {correctRate}% <span className="text-xs text-slate-400 font-medium">({correctAnswers}/{totalQuestions})</span>
          </span>
        </div>
      </div>

      {/* Attempt History List */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Lịch sử làm đề thi & bài tập</h2>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Tên đề thi</th>
                <th className="px-6 py-4">Thời gian nộp</th>
                <th className="px-6 py-4">Chế độ</th>
                <th className="px-6 py-4 text-center">Thời gian làm</th>
                <th className="px-6 py-4 text-right">Kết quả đúng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Học viên chưa thực hiện bài thi nào
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  let modeText = "Full Test";
                  if (s.test_mode === "listening") modeText = "Luyện Listening";
                  else if (s.test_mode === "reading") modeText = "Luyện Reading";

                  const maxQuestions = s.test_mode === "full" ? 200 : 100;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {Array.isArray(s.tests) ? s.tests[0]?.title : (s.tests as { title?: string } | null)?.title || "Đề thi"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(s.created_at).toLocaleDateString("vi-VN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        {modeText}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono">
                        {formatTimeSpent(s.time_spent)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-purple-600">
                        {s.score} / {maxQuestions} câu
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
