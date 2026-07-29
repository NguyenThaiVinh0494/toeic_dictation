"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Service role client to perform operations bypassing RLS (avatar uploads and user deletion)
const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export interface ActionResponse {
  success: boolean;
  error?: string;
  publicUrl?: string;
}

/**
 * Update user profile details (full name & avatar URL).
 */
export async function updateProfile(
  fullName: string,
  avatarUrl: string | null
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
    return { success: false, error: msg };
  }
}

/**
 * Upload an avatar image from a Base64 string.
 */
export async function uploadAvatarAction(
  fileName: string,
  base64Data: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    // Parse the base64 content
    const mimeTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "").replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Clean file name or generate a safe unique name
    const extension = mimeType.split("/")[1] || "png";
    const safeFileName = `avatars/${user.id}-${Date.now()}.${extension}`;

    // Upload to toeic-media bucket using service role client to bypass policies
    const { error: uploadError } = await adminSupabase.storage
      .from("toeic-media")
      .upload(safeFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("toeic-media").getPublicUrl(safeFileName);

    return { success: true, publicUrl };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải ảnh lên.";
    return { success: false, error: msg };
  }
}

/**
 * Update the user's password.
 */
export async function updatePasswordAction(
  oldPassword: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    // Verify old password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return { success: false, error: "Mật khẩu cũ không chính xác." };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật mật khẩu.";
    return { success: false, error: msg };
  }
}

/**
 * Permanently delete the user's account and sign them out.
 */
export async function deleteAccountAction(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    // Delete user from auth.users (cascades to profiles and other related data in Postgres)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Sign out user client-side (clears cookies / session)
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa tài khoản.";
    return { success: false, error: msg };
  }
}
