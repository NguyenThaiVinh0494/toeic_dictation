# Workflow: Standard Supabase Database Operation

## Mục đích

Chuẩn hóa cách tạo mới một hàm tương tác với cơ sở dữ liệu Supabase thông qua Next.js Server Actions hoặc Server Components.

## Các bước thực thi (Execution Steps)

1. **Kiểm tra Xác thực (Auth Gatekeeper):**

   - Luôn khởi tạo `supabase = await createClient()`.
   - Bắt buộc kiểm tra session: `const { data: { user }, error } = await supabase.auth.getUser()`.
   - Nếu không có user, lập tức ném lỗi (throw Error) hoặc `redirect('/login')`.
2. **Viết Truy vấn (Query Construction):**

   - Thực thi lệnh `.select()`, `.insert()`, hoặc `.update()`.
   - Phải xử lý lỗi rõ ràng bằng cú pháp: `if (error) throw new Error(error.message)`.
   - Không được `select('*')` nếu bảng có chứa dữ liệu nhạy cảm. Chỉ select các cột thực sự cần dùng.
3. **Cập nhật Cache (Cache Invalidation):**

   - ĐỐI VỚI SERVER ACTIONS (Mutation): Nếu hành động thay đổi dữ liệu (như nộp bài xong thì cần cập nhật điểm ở Dashboard), bắt buộc phải gọi `revalidatePath('/đường-dẫn-cần-cập-nhật')`.
4. **Trả về Kết quả (Return Standard):**

   - Trả về object chứa dữ liệu và thông báo lỗi (nếu có) để Client dễ dàng hiển thị Toast Notification.
   - Ví dụ định dạng trả về: `{ success: true, data: result, error: null }`.
