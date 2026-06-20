"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile } from "@/types/database";

export interface SignUpState {
  success: boolean;
  error?: string;
  message?: string;
}

export interface SignInState {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function getProfileActions(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, created_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile as Profile;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      (error as Record<string, unknown>).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function signUpAction(
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password) {
    return { success: false, error: "Vui lòng điền đầy đủ email và mật khẩu." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          full_name: fullName || "",
          avatar_url: "",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản vừa tạo.",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
    return { success: false, error: msg };
  }
}

export async function signInAction(
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập email và mật khẩu." };
  }

  let isSuccessful = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    isSuccessful = true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
    return { success: false, error: msg };
  }

  if (isSuccessful) {
    revalidatePath("/", "layout");
    return { success: true, redirectTo: "/" };
  }

  return { success: false, error: "Đăng nhập không thành công." };
}

export async function signOutAction(): Promise<{ success: boolean; redirectTo?: string }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false };
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/login" };
}
