"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Lock,
  Trash2,
  Upload,
  Check,
  Loader2,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import { Profile } from "@/types/database";
import {
  updateProfile,
  uploadAvatarAction,
  updatePasswordAction,
  deleteAccountAction,
} from "@/app/actions/profile";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdate?: () => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}: ProfileEditModalProps) {
  // Tabs: "general" (Tên & Ảnh), "security" (Mật khẩu), "danger" (Xóa tài khoản)
  const [activeTab, setActiveTab] = useState<"general" | "security" | "danger">("general");

  // Form values
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFileBase64, setAvatarFileBase64] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");

  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Handle avatar selection & base64 conversion
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showMessage("error", "Dung lượng ảnh không được vượt quá 2MB.");
      return;
    }

    setAvatarFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setAvatarFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Save General Profile Details (Name & Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showMessage("error", "Vui lòng nhập tên hiển thị.");
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFileBase64) {
        const uploadRes = await uploadAvatarAction(avatarFileName, avatarFileBase64);
        if (!uploadRes.success || !uploadRes.publicUrl) {
          showMessage("error", uploadRes.error || "Không thể tải ảnh đại diện lên.");
          setLoading(false);
          return;
        }
        finalAvatarUrl = uploadRes.publicUrl;
      }

      // Update profile record
      const updateRes = await updateProfile(fullName, finalAvatarUrl);
      if (updateRes.success) {
        showMessage("success", "Cập nhật hồ sơ cá nhân thành công!");
        setAvatarFileBase64(null);
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        showMessage("error", updateRes.error || "Cập nhật hồ sơ thất bại.");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Đã xảy ra lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  // Save Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showMessage("error", "Vui lòng nhập mật khẩu cũ.");
      return;
    }
    if (password.length < 6) {
      showMessage("error", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      showMessage("error", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await updatePasswordAction(oldPassword, password);
      if (res.success) {
        showMessage("success", "Đổi mật khẩu thành công!");
        setOldPassword("");
        setPassword("");
        setConfirmPassword("");
      } else {
        showMessage("error", res.error || "Không thể đổi mật khẩu.");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      showMessage("error", "Vui lòng nhập chính xác chuỗi xác nhận.");
      return;
    }

    if (!confirm("CẢNH BÁO CỰC KỲ QUAN TRỌNG: Bạn có chắc chắn muốn xóa tài khoản này? Hành động này sẽ xóa sạch toàn bộ lịch sử học tập và không thể khôi phục.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteAccountAction();
      if (res.success) {
        // Redirection is handled by layout/server action revalidation or browser reload
        window.location.href = "/login";
      } else {
        showMessage("error", res.error || "Lỗi khi xóa tài khoản.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Đã xảy ra lỗi kết nối hệ thống.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col mx-4 max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>⚙️</span> Cài đặt tài khoản
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification alert banner */}
            {message && (
              <div
                className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                    : "bg-red-50 text-red-800 border-red-100"
                }`}
              >
                {message.type === "success" ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 px-4 mt-2">
              <button
                onClick={() => {
                  setActiveTab("general");
                  setMessage(null);
                }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "general"
                    ? "border-purple-600 text-purple-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Thông tin cá nhân
              </button>
              <button
                onClick={() => {
                  setActiveTab("security");
                  setMessage(null);
                }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "security"
                    ? "border-purple-600 text-purple-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Bảo mật & Mật khẩu
              </button>
              <button
                onClick={() => {
                  setActiveTab("danger");
                  setMessage(null);
                }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "danger"
                    ? "border-red-600 text-red-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-red-500"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa tài khoản
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              {/* Tab 1: General Info */}
              {activeTab === "general" && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Avatar Upload Selection Section */}
                  <div className="flex flex-col items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="relative group">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="h-20 w-20 rounded-full object-cover border-2 border-purple-500 shadow-sm"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-linear-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm uppercase">
                          {fullName ? fullName[0] : "U"}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-md cursor-pointer"
                        title="Tải ảnh lên"
                      >
                        <Upload className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Chọn ảnh từ thiết bị
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Hỗ trợ PNG, JPG dung lượng tối đa 2MB
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      readOnly
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 focus:outline-none select-none cursor-not-allowed"
                    />
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập tên của bạn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-slate-800"
                    />
                  </div>

                  {/* Save button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </button>
                  </div>
                </form>
              )}

               {/* Tab 2: Change Password */}
              {activeTab === "security" && (
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mật khẩu cũ
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-slate-800"
                    />
                  </div>

                  {/* Save button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        "Cập nhật mật khẩu"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Danger Zone */}
              {activeTab === "danger" && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-red-800">
                        Cảnh báo hành động nguy hiểm
                      </h4>
                      <p className="text-[11px] text-red-700 leading-relaxed">
                        Hành động xóa tài khoản này sẽ **không thể khôi phục**. Toàn bộ kết quả điểm thi thử, lịch sử chép chính tả và từ vựng đã lưu của bạn sẽ bị xoá vĩnh viễn khỏi hệ thống.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Vui lòng nhập dòng chữ <span className="text-red-600 font-extrabold">XÓA TÀI KHOẢN</span> để xác nhận:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="XÓA TÀI KHOẢN"
                      className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 text-slate-800 font-bold uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirmText !== "XÓA TÀI KHOẢN"}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-red-100"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang xóa tài khoản...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          Xác nhận xóa tài khoản vĩnh viễn
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
