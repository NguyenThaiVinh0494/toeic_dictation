# 🎧 TOEIC Dictation - Nền Tảng Luyện Nghe Chép Chính Tả

## 🎯 Giới thiệu

**TOEIC Dictation** là một ứng dụng web được thiết kế chuyên biệt để giúp người học luyện tập phương pháp "nghe chép chính tả" (dictation). Dự án tập trung vào 4 phần thi Listening của đề thi TOEIC chuẩn, hỗ trợ người dùng nhận diện phát âm, nối âm và từ vựng hiệu quả, hướng tới việc chinh phục các mục tiêu điểm số cao như TOEIC 600+.

## ✨ Tính năng cốt lõi

### 1. Phân chia bài tập theo 4 Part TOEIC Listening

- **Part 1 (Photographs):** Nghe và chép lại các câu mô tả ngắn kết hợp xem hình ảnh minh họa tương ứng.
- **Part 2 (Question-Response):** Luyện chép nhanh câu hỏi và 3 lựa chọn phản hồi, tập trung nhận diện các từ để hỏi quan trọng (Wh-questions, Yes/No questions).
- **Part 3 (Conversations):** Nghe chép các đoạn hội thoại dài giữa 2-3 nhân vật. Hỗ trợ chia nhỏ và lặp lại theo từng lượt lời (turn-taking).
- **Part 4 (Talks):** Nghe chép các bài nói độc thoại ngắn (thông báo công cộng, bản tin, quảng cáo, hướng dẫn).

### 2. Trình phát Audio thông minh (Audio Player Controls)

- **Tùy chỉnh tốc độ linh hoạt:** Hỗ trợ các mức từ chậm đến nhanh (0.8x, 0.9x, 1.0x, 1.1x, 1.25x, 1.5x) giúp người học dễ thích nghi.
- **Hệ thống phím tắt (Hotkeys) tối ưu:** Người học không cần rời tay khỏi bàn phím:
  - `Space`: Phát / Tạm dừng audio.
  - `Ctrl` + `←` (hoặc `Shift` + `Tab`): Tua lại 3-5 giây để nghe lại.
  - `Tab` / `Enter`: Kiểm tra đáp án hoặc chuyển sang phần tiếp theo.
- **Tự động lặp (Loop):** Tự động lặp lại một câu hoặc đoạn hội thoại cho đến khi hoàn thành bài chép.
- **Sóng âm trực quan (Waveform):** Tích hợp biểu đồ sóng âm (ví dụ: `Wavesurfer.js`) giúp hiển thị vị trí phát trực quan, cho phép click chọn nghe lại từng từ/câu dễ dàng.

### 3. Kiểm tra lỗi tự động (Auto-Correction & Diff)

- **Chuẩn hóa văn bản trước khi so khớp:** Loại bỏ viết hoa/thường, các ký tự đặc biệt (dấu chấm, phẩy, hỏi chấm,...) để không phạt lỗi oan của người dùng.
- **Thuật toán so sánh tối ưu (Diff Engine):** Sử dụng thuật toán như _Levenshtein Distance_ hoặc thư viện _diff-match-patch_ để xác định chính xác từ sai, thiếu, hoặc thừa, tránh hiện tượng lệch vị trí hàng loạt từ phía sau khi người dùng lỡ bỏ sót 1 từ.
- **Đánh dấu màu sắc (Highlight) trực quan:**
  - **Xanh lá:** Từ hoàn toàn chính xác.
  - **Đỏ:** Từ gõ sai ký tự hoặc sai chính tả.
  - **Vàng:** Từ bị bỏ sót trong quá trình nghe.

### 4. Quản lý tiến độ (Progress Tracking)

- Thống kê số lượng bài tập đã hoàn thành theo từng Part.
- Tính toán chi tiết tỷ lệ phần trăm từ nghe đúng trên tổng số từ của bài tập để theo dõi sự tiến bộ.

---

## 🔄 Luồng hoạt động chính (User Workflow)

Hệ thống được thiết kế với luồng học tập mô phỏng quy trình luyện thi thực tế, kết hợp giữa việc kiểm tra kỹ năng và rèn luyện chuyên sâu.

### 1. Xác thực & Phân quyền (Authentication & Authorization)

- **Đăng ký / Đăng nhập:** Hệ thống yêu cầu xác thực tài khoản.
- **Phân quyền người dùng:**
  - _User (Người học):_ Truy cập các bài luyện tập và theo dõi lịch sử làm bài cá nhân.
  - _Admin/Manager:_ Quản lý kho đề thi, cập nhật audio, transcript và hình ảnh.

### 2. Chế độ luyện tập (Practice Modes)

Người dùng có thể cá nhân hóa lộ trình học thông qua 2 lựa chọn:

- **Luyện theo đề (Full Test):** Trải nghiệm tuần tự 4 Part Listening của một bộ đề thi hoàn chỉnh.
- **Luyện theo Part (Custom Practice):** Lựa chọn luyện tập trung vào một Part cụ thể đang là điểm yếu.

### 3. Quy trình làm bài chi tiết (Áp dụng cho cả 2 chế độ)

Mỗi Part đều được thiết kế theo phương pháp 2 bước: **Test (Kiểm tra) $\rightarrow$ Dictation (Chép chính tả)** nhằm tối ưu khả năng ghi nhớ và nhận diện lỗi sai.

- **Đối với Part 1 (Photographs):**
  - _Bước 1 (Làm bài):_ Xem hình ảnh, nghe 4 đáp án mô tả (A, B, C, D). Chọn đáp án đúng; hệ thống hiển thị kết quả chính xác ngay lập tức.
  - _Bước 2 (Chép chính tả):_ Tiến hành nghe và chép lại chính tả. Hỗ trợ 2 chế độ: **Chép câu đúng** (để đi nhanh) hoặc **Chép toàn bộ 4 phương án** (để ôn sâu các cấu trúc/từ vựng gây nhiễu).
- **Đối với Part 2 (Question-Response):**
  - _Bước 1 (Làm bài):_ Nghe một câu hỏi và 3 lựa chọn trả lời tương ứng (A, B, C). Chọn đáp án đúng; hệ thống hiển thị kết quả.
  - _Bước 2 (Chép chính tả):_ Tiến hành nghe và chép lại chính tả. Hỗ trợ 2 chế độ: **Chép câu hỏi + câu trả lời đúng** hoặc **Chép toàn bộ cuộc đối thoại** (gồm cả các câu trả lời sai).
- **Đối với Part 3 (Conversations) & Part 4 (Talks):**
  - _Bước 1 (Làm bài):_ Nghe toàn bộ đoạn hội thoại hoặc bài độc thoại ngắn. Chọn đáp án cho các câu hỏi trắc nghiệm liên quan.
  - _Bước 2 (Chép chính tả):_ Tiến hành nghe và chép lại chính tả. Hỗ trợ tính năng **Luyện chép theo từng câu (Sentence-by-sentence)** để chia nhỏ đoạn hội thoại/bài nói thành các câu ngắn dựa theo timeline của transcript, tránh quá tải khi nghe chép liên tục đoạn dài.

---

## 🛠 Công nghệ dự kiến (Tech Stack)

Dự án sử dụng mô hình kiến trúc Next.js (Full-stack Framework) kết hợp với Backend-as-a-Service (BaaS) từ Supabase:

- **Framework:** Next.js (Quản lý cả giao diện Frontend, Server-side Rendering - SSR, và các API Routes / Server Actions).
- **Database & Auth:** Supabase (Cung cấp PostgreSQL, hệ thống xác thực người dùng Supabase Auth, và SDK tích hợp sẵn tiện lợi).
- **Media Storage:** Supabase Storage (Lưu trữ các tệp âm thanh nghe chép chính tả `.mp3` và hình ảnh Part 1).
- **Quản lý mã nguồn:** Git & GitHub.

---

## 🗄️ Hạ tầng Dữ liệu & Triển khai (Database & Deployment)

Dự án triển khai ứng dụng Next.js nguyên khối (Monolith) trên Render, kết nối tới dịch vụ cơ sở dữ liệu và lưu trữ đám mây của Supabase.

### 1. Giải pháp Lưu trữ (Storage & Database)

- **Cơ sở dữ liệu (Database):** **Supabase PostgreSQL**
  - _Mục tiêu:_ Lưu trữ thông tin tài khoản người dùng, cấu trúc đề thi TOEIC phân cấp (Bộ đề $\rightarrow$ Parts $\rightarrow$ Audio/Transcript $\rightarrow$ Câu hỏi), lịch sử và tiến độ học tập.
  - _Kết nối tối ưu:_ Vì Next.js chạy dưới dạng một Server Node.js ổn định trên Render (không phải serverless functions), ứng dụng có thể duy trì kết nối bền vững (persistent connection pool) đến database thông qua Prisma hoặc Supabase Client, giúp truy vấn dữ liệu với độ trễ thấp nhất.
- **Lưu trữ tệp phương tiện (Media Storage):** **Supabase Storage**
  - _Mục tiêu:_ Lưu trữ các tệp âm thanh nghe chép chính tả (`.mp3`) và hình ảnh của Part 1.
  - _Hoạt động:_ Admin tải file trực tiếp lên Supabase Storage qua trang quản trị hoặc API. Client Next.js sẽ stream audio trực tiếp từ URL public của Supabase (qua hệ thống CDN tích hợp), giúp Render server không bị nghẽn băng thông.

### 2. Thiết lập Triển khai (Deployment Setup)

#### 🔸 Web App (Next.js) - Triển khai trên **Render**

- **Loại dịch vụ:** Web Service (Node.js Environment).
- **CI/CD:** Kết nối trực tiếp với Repo GitHub của dự án. Mỗi khi push code lên nhánh `main`, Render tự động kích hoạt tiến trình build và deploy phiên bản mới.
- **Lệnh Build & Run trên Render:**
  - _Build Command:_ `npm install && npm run build` (hoặc `yarn && yarn build` / `pnpm install && pnpm build`)
  - _Start Command:_ `npm run start` (hoặc `yarn start` / `pnpm start`)
- **Khắc phục "Ngủ đông" (Cold Start) trên Render Free:**
  - Vì Next.js được chạy dưới dạng một Web Service (Node server) trên Render gói Free, nó sẽ tự động ngủ đông nếu không có truy cập sau 15 phút.
  - _Giải pháp:_ Thiết lập một dịch vụ cron job ngoài (ví dụ: `Cron-job.org`) để tự động gửi request GET định kỳ đến endpoint `/api/health/` hoặc trang chủ của website mỗi 10-14 phút để duy trì server luôn hoạt động.
- **Không cần CORS phức tạp:** Vì cả giao diện người dùng và API Routes được chạy chung trên một máy chủ Next.js (cùng một domain trên Render), dự án sẽ không gặp các lỗi bảo mật về CORS thường thấy ở kiến trúc tách rời.

### 3. Quản lý cấu hình & Bảo mật (Security)

Các khóa bảo mật được lưu cấu hình qua **Environment Variables** trên dashboard quản trị của Render:

- `DATABASE_URL`: Đường dẫn kết nối trực tiếp PostgreSQL của Supabase.
- `NEXT_PUBLIC_SUPABASE_URL`: URL API của dự án Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Khóa công khai của Supabase (sử dụng ở Client).
- `SUPABASE_SERVICE_ROLE_KEY`: Khóa bảo mật cao (chỉ sử dụng ở Server-side để thực hiện các thao tác quản trị).
