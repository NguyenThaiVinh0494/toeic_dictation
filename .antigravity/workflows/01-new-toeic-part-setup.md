# Workflow: Scaffold New TOEIC Part (1, 2, 3, or 4)

## Mục đích

Quy trình chuẩn hóa khi khởi tạo cấu trúc thư mục, giao diện và logic cho một phần thi Listening mới, đảm bảo tuân thủ mô hình 2 bước: Test Phase -> Dictation Phase.

## Các bước thực thi (Execution Steps)

1. **Phân tích Dữ liệu (Data Analysis):**

   - Đọc kỹ yêu cầu cấu trúc dữ liệu của Part tương ứng (ví dụ: Part 1 có hình ảnh, Part 3 có nhiều lượt lời).
   - Xác định các Props cần thiết để truyền từ Server Component xuống Client Component.
2. **Dựng Khung Giao diện (UI Scaffolding):**

   - Tạo Server Component chính tại `app/practice/part-[id]/page.tsx` để fetch dữ liệu từ Supabase.
   - Tạo Client Component tại `components/part-[id]/[PartId]Workspace.tsx` để quản lý trạng thái bài làm.
   - Bố cục màn hình chia làm 2 vùng rõ rệt (hoặc dùng Tabs): Vùng hiển thị câu hỏi/hình ảnh và Vùng làm bài.
3. **Tích hợp Luồng 2 Bước (Two-Phase Integration):**

   - **Phase 1 (Test):** Render các Radio Buttons (A, B, C, D) cho người dùng chọn đáp án. Khóa nút Submit Dictation cho đến khi hoàn thành Phase 1.
   - **Phase 2 (Dictation):** Tích hợp `AudioPlayer` và `DictationForm`. Chèn các hotkeys theo chuẩn hệ thống.
4. **Tích hợp Action (Wire-up Server Actions):**

   - Import và gắn các hàm Server Actions vào các nút "Nộp bài Test" và "Nộp bài Dictation".
   - Đảm bảo hiển thị trạng thái Loading (dùng `useTransition` hoặc `useFormStatus`) trong lúc chờ Server xử lý.
