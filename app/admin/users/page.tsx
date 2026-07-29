import { getAdminUsersList } from "@/app/actions/admin";
import Link from "next/link";
import { ChevronRight, Award, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAdminUsersList();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
          Quản lý Học viên
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi danh sách toàn bộ học viên đang ôn luyện trên nền tảng.
        </p>
      </div>

      {/* Users List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Tên học viên</th>
              <th className="px-6 py-4">Ngày đăng ký</th>
              <th className="px-6 py-4 text-center">Số lượt làm đề</th>
              <th className="px-6 py-4 text-center">Độ chính xác chính tả</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Chưa có học viên nào tham gia
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  {/* Student Name */}
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      {user.fullName || "Chưa đặt tên"}
                    </Link>
                  </td>

                  {/* Registered Date */}
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>

                  {/* Exam Sessions Done */}
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">
                    {user.sessionsCount} bài
                  </td>

                  {/* Dictation Accuracy */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {user.avgAccuracy}%
                    </span>
                  </td>

                  {/* Actions (View Detail) */}
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform"
                    >
                      Chi tiết
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
  );
}
