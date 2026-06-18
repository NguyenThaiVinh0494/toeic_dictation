# Rule 01: Core Architecture & Framework constraints

## 1. Next.js App Router (Tuyệt đối tuân thủ)

- Toàn bộ dự án BẮT BUỘC sử dụng kiến trúc App Router (thư mục `app/`). Tuyệt đối không sinh ra code sử dụng Pages Router (`pages/`) hay các hàm cũ như `getServerSideProps`.
- Mặc định mọi component được tạo ra phải là **Server Components**.
- Chỉ thêm chỉ thị `"use client"` ở dòng trên cùng của file đối với các "Node lá" (Leaf components) thực sự cần:
  - Quản lý trạng thái nội bộ bằng React Hooks (`useState`, `useEffect`, `useRef`).
  - Lắng nghe các sự kiện tương tác của người dùng (`onClick`, `onChange`, `onKeyDown`).
  - Sử dụng các Web APIs (như `window`, `document`, hoặc thẻ `<audio>`).

## 2. Quản lý trạng thái (State Management)

- Không tự ý đề xuất hoặc cài đặt các thư viện quản lý state bên thứ ba như Redux, MobX, hay Zustand trừ khi có chỉ thị rõ ràng.
- Ưu tiên truyền state qua Props đối với các component cha-con đơn giản.
- Sử dụng React Context API cho các trạng thái dùng chung toàn cục (ví dụ: `AuthContext` cho thông tin người dùng đăng nhập).

## 3. Data Fetching & Mutations

- Việc gọi dữ liệu (Fetch data) từ Supabase phải được thực hiện trực tiếp bên trong các Server Components bằng hàm `async/await` để tận dụng tối đa Server-Side Rendering (SSR).
- Mọi thao tác làm thay đổi dữ liệu cơ sở dữ liệu (Mutations - như Nộp bài, Lưu điểm, Thêm đề thi) BẮT BUỘC phải được định nghĩa bằng **Server Actions** (các hàm bất đồng bộ có `"use server"` bên trong thư mục `actions/`). Tuyệt đối không tạo các Route Handlers (`app/api/`) cho mục đích này để tránh dư thừa.
