# Workflow: Dictation Submission & Review Flow

## Mục đích

Xử lý toàn bộ vòng đời của một lần người dùng bấm nút "Nộp bài Dictation" – từ lúc nhận input cho đến khi hiển thị highlight màu sắc và lưu DB.

## Các bước thực thi (Execution Steps)

1. **Bắt sự kiện (Event Handling):**

   - Lắng nghe sự kiện click vào nút "Submit" hoặc nhấn phím `Enter` trong thẻ `<textarea>`.
   - Ngăn chặn hành vi mặc định (preventDefault) và vô hiệu hóa (disable) form ngay lập tức để tránh double-submit.
2. **Gọi Engine Chấm Điểm (Invoke Diffing Engine):**

   - Đọc skill `@skills/02-text-diffing-engine.md`.
   - Chuyền `userInput` và `transcript` gốc vào hàm Diffing.
   - Nhận về mảng kết quả phân loại (correct, incorrect, missing).
   - Tính toán tỷ lệ phần trăm chính xác (Accuracy = Correct Words / Total Words).
3. **Cập nhật Giao diện (UI Re-render):**

   - Ẩn thẻ `<textarea>`.
   - Render mảng kết quả vừa nhận được thành các thẻ `<span>` với mã màu tương ứng (Xanh lá, Đỏ, Vàng).
   - Hiển thị tỷ lệ phần trăm chính xác lên màn hình.
   - Hiện nút "Làm lại" (Retry) và "Câu tiếp theo" (Next).
4. **Lưu Tiến độ (Persist Progress):**

   - Gọi Server Action để lưu kết quả (Accuracy, UserID, QuestionID) vào Supabase.
   - Việc lưu dữ liệu chạy ngầm, không được làm gián đoạn (block) quá trình xem lại kết quả của người dùng.
