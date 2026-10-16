# Kết quả xác minh các bộ test backend và web

Ngày chạy: 08/10/2026. Windows, .NET SDK 10.0.401, Playwright 1.62.1, k6 2.3.0. Backend thật không database; không có unit test. Lần xác minh cuối dùng server riêng ở cổng 5092 để kiểm tra đúng bản mã nguồn mới, không phụ thuộc server người dùng đang mở ở 5080. Các lệnh học tập vẫn mặc định 5080.

## Kết quả

| Nhóm | Lượt chạy | Kết quả |
|---|---:|---|
| API | 50 | Tất cả đạt |
| E2E Chromium | 23 | Tất cả đạt |
| E2E WebKit | 23 | Tất cả đạt |
| Visual Chromium | 5 | So sánh ảnh đạt |
| UI performance Chromium | 1 | Trong giới hạn 1000 ms |
| Tổng Playwright đã xác minh | 102 | 102 đạt, 0 lỗi, 0 bỏ qua |
| k6 smoke: 1 VU | 12 request | 48 checks đạt; 0 lỗi HTTP |
| k6 load: 10 VUs / 20 giây | 1000 request | 4000 checks đạt; 0 lỗi HTTP |

UI timing attachment: `{"elapsedMs": 12.799999997019768, "thresholdMs": 1000}`. k6 p95 smoke: 8.173 ms; p95 load: 0.778 ms. Đây là số đo cục bộ trong cấu hình đã chạy; không suy ra giới hạn hệ thống hoặc hiệu năng trên mọi máy. Thời lượng một test E2E gồm khởi tạo trang, nhập dữ liệu, kiểm tra và đóng dialog; nó không phải thời gian đáp ứng Check.

## Một khác biệt giao diện đã được test phát hiện

WebKit không tự focus nút Close khi bấm chuột như Chromium. Do đó Escape hủy hộp thoại nhưng focus trước đây về body. Bản cập nhật chủ động focus nút Close trước khi mở xác nhận. Test sau sửa xác nhận focus quay về nút trên cả Chromium và WebKit.

## Những phần chưa xác minh

- Firefox: đã thử mở, nhưng process thoát với 3221225506 (0xC0000022, access denied) trong môi trường sandbox, trước khi chạy assertion trên trang. Không ghi Firefox là pass và không coi lỗi công cụ này là lỗi nghiệp vụ. Lệnh cross-browser đã có để chạy trên môi trường thông thường.
- GitHub Actions: workflow đã viết, chưa có lần chạy trên GitHub. Không có deploy/release tự động.
- Flutter/mobile: tạm hoãn theo yêu cầu người dùng; không cần Flutter để chạy bộ test web/backend.
- Visual: 5 ảnh Windows được tạo và đã kiểm tra bố cục. Việc so sánh kỹ thuật đạt không thay việc người dùng duyệt baseline theo yêu cầu giảng viên. Linux/macOS cần baseline riêng.
- Tải k6 10 VUs là bài minh họa; chưa thực hiện stress, soak hoặc scalability.

## Báo cáo và cách chạy

- `playwright/index.html`: HTML report của lần xác minh 102 test.
- `playwright-results.json`, `junit.xml`: dữ liệu báo cáo.
- `testing-summary.json`: tóm tắt theo nhóm.
- `performance/k6-smoke.json`, `performance/k6-load.json`: số liệu k6.
- `browser-environment-check.json`: lần thử browser ban đầu và giới hạn Firefox; không phải kết quả cuối.

Từ project root, chạy `npm.cmd run test:e2e:headed` để nhìn thao tác hoặc `npm.cmd run test:e2e:debug -- --grep "E2E-DTC-001"` để xem từng bước. Dùng `npm.cmd run report` để mở report. Mỗi lần chạy Playwright sẽ thay báo cáo gần nhất; các số liệu trên là của lần xác minh được bàn giao.
