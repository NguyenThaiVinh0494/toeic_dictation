# Skill: Text Diffing & Auto-Correction Engine

## Mục tiêu

So sánh văn bản người dùng nhập (User Input) với đáp án chuẩn (Transcript), đánh giá độ chính xác và phân loại từng từ thành 3 nhóm: Correct (Đúng), Incorrect (Sai), Missing (Thiếu).

## Quy trình Xử lý (Processing Steps)

1. **Tiền xử lý chuỗi (Preprocessing):**

   - Trước khi so sánh, cả `input` và `transcript` BẮT BUỘC phải được đưa qua hàm làm sạch:
     - Chuyển thành chữ thường: `.toLowerCase()`.
     - Loại bỏ toàn bộ dấu câu bằng Regex: `.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")`.
     - Xóa khoảng trắng thừa: `.replace(/\s{2,}/g, " ").trim()`.
2. **Thuật toán So sánh (Diffing Logic):**

   - Phân tách chuỗi đã làm sạch thành mảng các từ (words array) bằng `.split(" ")`.
   - Sử dụng thuật toán Khoảng cách Levenshtein (Levenshtein Distance) hoặc duyệt mảng hai con trỏ (Two-pointers) để so khớp từng từ.
   - Đầu ra (Output) phải là một mảng các object có định dạng:
     `Array<{ word: string, status: 'correct' | 'incorrect' | 'missing' }>`
3. **Render UI (Highlighting):**

   - Map qua mảng Output để render các thẻ `<span>` tương ứng:
     - `status === 'correct'`: className `text-green-500`
     - `status === 'incorrect'`: className `text-red-500 underline decoration-red-500`
     - `status === 'missing'`: className `text-yellow-700 bg-yellow-100 px-1 rounded`
