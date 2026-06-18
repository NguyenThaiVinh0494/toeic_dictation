
# Rule 02: UI/UX, Styling & Animation Requirements

## 1. Hệ thống Styling & Bố cục (TailwindCSS)

- Chỉ sử dụng TailwindCSS utility classes. Tuyệt đối không viết CSS thuần.
- **Background (Màu nền chủ đạo):** Toàn bộ ứng dụng phải sử dụng nền sáng màu với hiệu ứng gradient tím nhẹ để tạo cảm giác hiện đại, thư giãn. BẮT BUỘC áp dụng class: `bg-gradient-to-br from-slate-50 via-purple-50 to-white` (hoặc tương tự) cho vùng chứa chính (main wrapper).
- Các thẻ nội dung (Card, Form) nên có màu nền trắng trong suốt (`bg-white/80`), viền mềm mại (`rounded-2xl`, `border-white`), kèm hiệu ứng kính mờ (`backdrop-blur-sm`) và đổ bóng nhẹ (`shadow-sm`).
- **Thanh điều hướng:** Background kính mờ sáng màu. Biểu tượng tìm kiếm luôn căn phải.

## 2. Hiệu ứng & Chuyển động (Framer Motion)

- Giao diện phải mang lại cảm giác "mãn nhãn" (eye-catching), linh hoạt và mượt mà.
- BẮT BUỘC sử dụng thư viện `framer-motion` cho các chuyển động (Animations).
- Mọi sự xuất hiện của component mới (Chuyển part, sang câu hỏi mới, hiển thị kết quả) phải có hiệu ứng xuất hiện mềm mại (Ví dụ: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }}`).
- Không sử dụng các animation giật cục hay quá dài gây chậm trễ trải nghiệm học tập.

## 3. Hệ thống Màu sắc Chữa lỗi (Dictation Highlighting)

Giao diện hiển thị kết quả chép chính tả phải tuân thủ nghiêm ngặt hệ màu sau:

- **Từ gõ đúng (Correct):** Chữ màu xanh lá (`text-green-500` hoặc `text-green-600`).
- **Từ gõ sai (Incorrect):** Chữ màu đỏ kèm gạch dưới (`text-red-500 underline decoration-red-500`).
- **Từ bỏ sót (Missing):** Chữ màu vàng đậm trên nền vàng nhạt (`text-yellow-700 bg-yellow-100 px-1 rounded-md`).

## 4. Trải nghiệm Nhập liệu (Input Experience)

- Form nhập Dictation phải luôn tự động focus (auto-focus).
- Khóa (Disable) nút Submit ngay lập tức sau khi nhấn để ngăn double-submit, đồng thời hiển thị trạng thái Loading có animation xoay (spinner) mượt mà.
