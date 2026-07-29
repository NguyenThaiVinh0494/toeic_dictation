import { redirect } from "next/navigation";
import { getProfileActions } from "@/app/actions/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ArrowLeft,
  Settings,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const profile = await getProfileActions();

  // Route protection gatekeeper
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200/60 bg-white/80 backdrop-blur-md flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 pt-16">
        <div className="p-6 flex-grow flex flex-col gap-8">
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-4 px-3">
              Admin Control Panel
            </span>
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
              >
                <LayoutDashboard className="h-4.5 w-4.5" />
                Tổng quan
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
              >
                <Users className="h-4.5 w-4.5" />
                Quản lý Học viên
              </Link>
              <Link
                href="/admin/tests"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
              >
                <BookOpen className="h-4.5 w-4.5" />
                Quản lý Đề thi
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer links */}
        <div className="p-6 border-t border-slate-100 flex flex-col gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Về Trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-grow pl-64 pt-16 flex flex-col">
        <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
