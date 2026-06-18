# Skill: Audio Player & Timeline Synchronization

## Mục tiêu

Xây dựng Client Component quản lý trình phát âm thanh bài thi TOEIC, tích hợp phím tắt để tối ưu hóa trải nghiệm nghe chép (Dictation) mà không cần dùng chuột.

## Yêu cầu kỹ thuật (Implementation Guide)

1. **Quản lý Trạng thái (State Management):**

   - Sử dụng `useRef` để tham chiếu đến thẻ `<audio>` (hoặc instance của Wavesurfer.js nếu có dùng).
   - Sử dụng `useState` để quản lý: `isPlaying` (boolean), `playbackRate` (number), `currentTime` (number), và `duration` (number).
2. **Hệ thống Phím tắt (Hotkeys):**

   - Bắt sự kiện bàn phím bằng `useEffect` (lắng nghe `keydown` trên `window` hoặc thẻ vùng chứa).
   - `Space`: Toggle giữa Play và Pause. (Lưu ý: Phải `event.preventDefault()` để tránh trang bị cuộn xuống).
   - `Ctrl` + `ArrowLeft` (hoặc `Shift` + `Tab`): Tua lại (rewind) chính xác 3 giây (`audioRef.current.currentTime -= 3`).
   - `Ctrl` + `ArrowRight`: Tua tới 3 giây.
3. **Chức năng Tốc độ phát (Playback Rate):**

   - Cung cấp dropdown hoặc các nút chọn nhanh để thay đổi `audioRef.current.playbackRate`.
   - Các mốc hỗ trợ: `0.75x`, `1.0x`, `1.25x`.
4. **Đồng bộ UI:**

   - Cập nhật thanh tiến trình (Progress Bar) thông qua sự kiện `ontimeupdate` của thẻ `<audio>`.
