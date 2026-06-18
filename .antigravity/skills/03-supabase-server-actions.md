# Skill: Supabase CRUD via Next.js Server Actions

## Mục tiêu

Chuẩn hóa cách tương tác với cơ sở dữ liệu Supabase, đảm bảo tính bảo mật, type-safety và tối ưu hiệu năng trong môi trường Next.js App Router.

## Yêu cầu kỹ thuật (Implementation Guide)

1. **Vị trí và Khai báo:**

   - Mọi thao tác ghi/sửa/xóa (Mutations) phải được đặt trong thư mục `actions/` hoặc file có khai báo `"use server"` ở dòng đầu tiên.
   - Khởi tạo Supabase client bên trong action bằng utility function chuẩn: `createClient()` (từ `@supabase/ssr`).
2. **Xử lý Luồng Ghi dữ liệu (Progress Tracking):**

   - Khi người dùng nộp bài Dictation, Server Action cần nhận payload gồm: `userId`, `partId`, `questionId`, `accuracyPercentage`.
   - Bắt buộc phải có khối `try-catch` để bắt lỗi kết nối hoặc lỗi ràng buộc khóa ngoại (Foreign Key).
   - Ví dụ logic:
     ```javascript
     const { data, error } = await supabase
       .from('user_progress')
       .upsert({ 
         user_id: userId, 
         question_id: questionId, 
         score: accuracyPercentage,
         updated_at: new Date().toISOString()
       });
     ```
3. **Cập nhật UI sau khi gọi Action (Revalidation):**

   - Nếu action làm thay đổi dữ liệu cần hiển thị ngay (ví dụ: Danh sách bài tập đã làm), phải gọi `revalidatePath('/path-to-update')` trước khi `return` kết quả.
4. **Kiểm tra Xác thực (Auth Check):**

   - Đầu mỗi Server Action, LUÔN LUÔN phải gọi `supabase.auth.getUser()` để xác minh người dùng có quyền thực hiện hành động này hay không. Trả về lỗi `401 Unauthorized` nếu không có session.
