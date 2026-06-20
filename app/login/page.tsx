"use client";

import { useState } from "react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import AnimateWrapper from "@/components/AnimateWrapper";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isSignInPending, setIsSignInPending] = useState(false);
  const [isSignUpPending, setIsSignUpPending] = useState(false);
  
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSignInPending(true);
    setSignInError(null);
    setLocalMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await signInAction(formData);
    
    if (result.success && result.redirectTo) {
      window.location.href = redirectTo;
    } else {
      setIsSignInPending(false);
      if (result.error) {
        setSignInError(result.error);
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSignUpPending(true);
    setSignUpError(null);
    setLocalMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUpAction(formData);
    
    setIsSignUpPending(false);
    if (result.success && result.message) {
      setLocalMessage(result.message);
      setActiveTab("signin");
    } else if (result.error) {
      setSignUpError(result.error);
    }
  };

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    setLocalMessage(null);
    setSignInError(null);
    setSignUpError(null);
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AnimateWrapper delay={0.1}>
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <span className="text-4xl">🎧</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3">
              Chào mừng bạn đến với{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-indigo-600">
                TOEIC Dictation
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Luyện nghe chép chính tả chuẩn xác 100%</p>
          </div>
        </AnimateWrapper>

        {/* Auth Card */}
        <AnimateWrapper delay={0.2}>
          <div className="bg-white/80 border border-white/20 backdrop-blur-sm shadow-xl rounded-3xl p-6 sm:p-8 overflow-hidden relative">
            {/* Blurry decor */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none"></div>

            {/* Tab Header Switcher */}
            <div className="flex border-b border-slate-100 mb-8 p-1 bg-slate-50/50 rounded-xl relative">
              <button
                type="button"
                onClick={() => handleTabChange("signin")}
                className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-colors z-10 ${
                  activeTab === "signin" ? "text-purple-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng nhập
                {activeTab === "signin" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-100 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("signup")}
                className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-colors z-10 ${
                  activeTab === "signup" ? "text-purple-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng ký
                {activeTab === "signup" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-100 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Success and Error alerts */}
            <AnimatePresence mode="wait">
              {localMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium rounded-xl bg-green-50 text-green-700 border border-green-100"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{localMessage}</span>
                </motion.div>
              )}

              {/* Action State Sign In Errors */}
              {activeTab === "signin" && signInError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium rounded-xl bg-red-50 text-red-700 border border-red-100"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{signInError}</span>
                </motion.div>
              )}

              {/* Action State Sign Up Errors */}
              {activeTab === "signup" && signUpError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium rounded-xl bg-red-50 text-red-700 border border-red-100"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{signUpError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Form Containers */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {activeTab === "signin" ? (
                  <motion.form
                    key="signin-form"
                    onSubmit={handleSignInSubmit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">Email</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          required
                          autoFocus
                          placeholder="example@domain.com"
                          className="w-full text-sm rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 transition-all duration-200 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">Mật khẩu</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          name="password"
                          required
                          placeholder="••••••••"
                          className="w-full text-sm rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 transition-all duration-200 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSignInPending}
                      className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-sm hover:bg-purple-700 transition-all flex items-center justify-center gap-2 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                    >
                      {isSignInPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Đăng nhập
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup-form"
                    onSubmit={handleSignUpSubmit}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">Họ và tên</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          name="fullName"
                          required
                          autoFocus
                          placeholder="Nguyễn Văn A"
                          className="w-full text-sm rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 transition-all duration-200 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">Email</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="example@domain.com"
                          className="w-full text-sm rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 transition-all duration-200 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">Mật khẩu</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          name="password"
                          required
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full text-sm rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 transition-all duration-200 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSignUpPending}
                      className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-sm hover:bg-purple-700 transition-all flex items-center justify-center gap-2 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                    >
                      {isSignUpPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tạo tài khoản...
                        </>
                      ) : (
                        <>
                          Tạo tài khoản
                          <Sparkles className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </AnimateWrapper>
      </div>
    </div>
  );
}
