# Skill: Click-to-Translate & Dictionary Tooltip

## Mục tiêu

Cho phép người dùng click vào bất kỳ từ tiếng Anh nào trên giao diện Transcript để xem phiên âm và nghĩa tiếng Việt thông qua một Tooltip/Popover nhỏ gọn, mượt mà.

## Yêu cầu kỹ thuật (Implementation Guide)

1. **Chuẩn hóa từ vựng khi Click:**

   - Khi người dùng click vào một từ (ví dụ: "dogs," hoặc "Running!"), trước khi gọi API, BẮT BUỘC phải làm sạch từ đó: loại bỏ dấu câu (chấm, phẩy, ngoặc) và chuyển về chữ thường.
2. **Gọi API Từ điển (Dictionary API):**

   - Tạo một hàm bất đồng bộ (async function) để fetch dữ liệu từ một API từ điển miễn phí (ví dụ: Free Dictionary API `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`).
   - Cần xử lý trạng thái `isLoading` trong lúc chờ API trả về kết quả và bắt lỗi (try-catch) nếu từ vựng không tồn tại trong từ điển.
3. **Giao diện Tooltip (Popover UI):**

   - Sử dụng thư viện UI hiện có (như Radix UI Popover hoặc Shadcn Tooltip) để đảm bảo Popover luôn hiển thị đúng vị trí (tránh bị tràn ra ngoài màn hình).
   - Sử dụng Framer Motion để tạo hiệu ứng nảy nhẹ (`type: "spring"`) khi Tooltip xuất hiện.
   - Nội dung Tooltip bao gồm:
     - Từ vựng gốc (in đậm).
     - Phiên âm Quốc tế (IPA) (màu xám nhạt).
     - Định nghĩa ngắn gọn (ưu tiên loại từ cơ bản).
4. **Tối ưu Hiệu năng (Debounce & Cache):**

   - Để tránh gọi API quá nhiều lần cho cùng một từ, hãy cân nhắc lưu kết quả dịch vào một biến `useMemo` hoặc một Object cache đơn giản trên Client.
