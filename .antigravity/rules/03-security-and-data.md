# Rule 03: Security & Database Operations

## 1. Quản lý Biến môi trường (Environment Variables)

- TUYỆT ĐỐI KHÔNG hardcode các URL, API Key, hoặc chuỗi kết nối Database vào bất kỳ file mã nguồn nào.
- Mọi thông tin nhạy cảm phải được gọi thông qua `process.env`.
- Cấu trúc khóa biến môi trường:
  - Client-side: Phải có tiền tố `NEXT_PUBLIC_` (ví dụ: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - Server-side: Các khóa bảo mật cao cấp (như `SUPABASE_SERVICE_ROLE_KEY` hoặc `DATABASE_URL`) tuyệt đối không được xuất hiện trong Client Components.

## 2. Khởi tạo và Tương tác Supabase

- Không import hàm `createClient` trực tiếp từ package `@supabase/supabase-js` một cách tự do.
- Luôn sử dụng các hàm khởi tạo đã được chuẩn hóa trong thư mục `utils/supabase/` để đảm bảo SSR Cookie hoạt động đúng:
  - Dùng `createBrowserClient()` cho Client Components.
  - Dùng `createClient()` (Server client) cho Server Components và Server Actions.

## 3. Phân quyền và Bảo mật Luồng dữ liệu (Data Security)

- **Xác thực trước khi Mutation:** Đầu mỗi Server Action, LUÔN LUÔN phải gọi hàm kiểm tra session hiện tại (ví dụ: `supabase.auth.getUser()`). Nếu không tồn tại user hợp lệ, lập tức trả về lỗi `Unauthorized` hoặc thực hiện Redirect.
- **Ràng buộc truy vấn (Query Constraints):** Khi truy vấn dữ liệu cá nhân (ví dụ: lịch sử làm bài, điểm số), bắt buộc phải đính kèm điều kiện `user_id` bằng với ID của người dùng đang đăng nhập hiện tại (`.eq('user_id', user.id)`). Tuyệt đối không cho phép truy vấn mở toàn bộ bảng lịch sử.
- **Kiểm soát Cột (Column Selection):** Không sử dụng `select('*')` đối với các bảng chứa dữ liệu quan trọng (như bảng `users`). Chỉ select đích danh các cột cần thiết cho giao diện.
