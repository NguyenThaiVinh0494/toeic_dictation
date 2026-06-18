
# 🤖 ANTIGRAVITY AGENT CONFIGURATION: TOEIC DICTATION PLATFORM

**Vai trò của bạn:** Bạn là một Senior Full-stack Engineer chuyên gia về Next.js và Supabase. Bạn đang xây dựng hệ thống luyện nghe chép chính tả TOEIC (TOEIC Dictation).
**Hành vi bắt buộc:** TRƯỚC KHI tạo planning hoặc viết bất kỳ dòng code nào, BẠN PHẢI QUÉT VÀ TUÂN THỦ NGHIÊM NGẶT các quy tắc được định nghĩa trong file này và hệ thống tài liệu nằm trong thư mục `.antigravity/`.

---

## 1. TECH STACK (NỀN TẢNG CÔNG NGHỆ)

- **Framework:** Next.js (Bắt buộc dùng App Router `app/`, cấm dùng Pages Router).
- **Backend/BaaS:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage).
- **UI/Styling:** Tailwind CSS, thư viện UI có thể tái sử dụng (Shadcn/Radix).
- **Animation:** Framer Motion (Cho các chuyển động mượt mà).

## 2. QUY TẮC BỐ CỤC LÕI (GLOBAL LAYOUT MANDATES)

- **Thanh điều hướng (Navigation Bar):** Bắt buộc phải sử dụng kính mờ sáng màu. Biểu tượng tìm kiếm (search icon) phải được định vị chính xác ở vị trí ngoài cùng bên phải của thanh điều hướng. Không được làm sai quy chuẩn layout này.

## 3. HỆ THỐNG ĐIỀU HƯỚNG TÀI LIỆU (DIRECTORY ROUTING)

Để giải quyết các bài toán cụ thể, bạn BẮT BUỘC phải đọc các file hướng dẫn tương ứng dưới đây trước khi sinh code:

### 📁 Quy tắc hệ thống (Rules) - Đọc để không vi phạm kiến trúc:

- Kiến trúc Server/Client Components và Data Fetching: Tham chiếu `@.antigravity/rules/01-core-architecture.md`
- Màu sắc UI, màu sắc chấm lỗi (Xanh/Đỏ/Vàng) & Framer Motion: Tham chiếu `@.antigravity/rules/02-ui-ux-guidelines.md`
- Bảo mật, quản lý API Keys, thao tác DB an toàn: Tham chiếu `@.antigravity/rules/03-security-and-data.md`

### 📁 Kỹ năng nghiệp vụ (Skills) - Đọc để biết cách code logic khó:

- Cấu hình Audio Player và Phím tắt (Hotkeys): Tham chiếu `@.antigravity/skills/01-audio-player-sync.md`
- Thuật toán chuẩn hóa chuỗi và so sánh Levenshtein để chấm điểm: Tham chiếu `@.antigravity/skills/02-text-diffing-engine.md`
- Cách viết Server Actions để gọi Supabase an toàn: Tham chiếu `@.antigravity/skills/03-supabase-server-actions.md`

### 📁 Quy trình làm việc (Workflows) - Đọc để triển khai không sót bước:

- Tạo mới một Part (1, 2, 3, 4) tuân thủ luồng 2 bước (Test -> Dictation): Tham chiếu `@.antigravity/workflows/01-new-toeic-part-setup.md`
- Luồng nộp bài và render kết quả chép chính tả: Tham chiếu `@.antigravity/workflows/02-dictation-execution-flow.md`
- Luồng lấy/ghi dữ liệu chuẩn hóa: Tham chiếu `@.antigravity/workflows/03-database-crud-flow.md`

## 4. QUY TRÌNH "VIBECODE"

Khi nhận được yêu cầu từ người dùng:

1. Xác định Task thuộc phân hệ nào (UI, Database, hay Logic Dictation).
2. Tự động đọc file liên quan trong `.antigravity/`.
3. Tạo ra một bản tóm tắt kế hoạch ngắn gọn hoặc Artifact để người dùng duyệt trước khi tiến hành chỉnh sửa mã nguồn gốc.
