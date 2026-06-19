"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import React, { useState } from "react";
import { Profile } from "@/types/database";
import { signOutAction } from "@/app/actions/auth";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Luyện tập", href: "/practice" },
    { name: "Tiến độ", href: "/progress" },
  ];

  const handleSignOut = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      const result = await signOutAction();
      if (result && result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-md" suppressHydrationWarning>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        {/* Trái: Brand / Logo */}
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-purple-600 transition-colors hover:text-purple-700"
          >
            <span className="text-2xl">🎧</span>
            <span>TOEIC Dictation</span>
          </Link>
        </div>

        {/* Giữa: Danh sách link điều hướng */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                  isActive ? "text-purple-600 font-semibold" : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Phải (Bắt buộc): Thông tin Auth & Ô tìm kiếm ở ngoài cùng bên phải */}
        <div className="flex items-center gap-4 ml-auto md:ml-0" suppressHydrationWarning>
          {/* Auth section */}
          {profile ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                <div className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 max-w-[75px] truncate">
                  {profile.full_name || "Học viên"}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-700 bg-white"
            >
              Đăng nhập
            </Link>
          )}

          {/* Search container */}
          <div className="relative flex items-center" suppressHydrationWarning>
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-48 md:w-56 rounded-full border border-slate-200/80 bg-slate-50/50 py-1.5 pl-4 pr-10 text-[10px] sm:text-xs transition-all duration-300 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 text-slate-800"
            />
            <button className="absolute right-3 text-slate-400 hover:text-purple-600 transition-colors">
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
