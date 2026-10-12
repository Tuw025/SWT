# Kế hoạch bổ sung kiểm thử

Ứng dụng nền đã có. Hiện đã triển khai suite API, web E2E, visual, thời gian UI và k6; mobile tạm để lại sau. Không viết unit test theo note giảng viên. Cách chạy từng nhóm nằm ở docs/testing-guide/web-testing.md; kết quả thực tế nằm ở reports/testing-verification.md.

| Thứ tự | Chủ đề | Phạm vi | Folder |
|---|---|---|---|
| 1 | API | Định dạng, khoảng, số ngày, năm nhuận, schema và status | tests/api |
| 2 | Web E2E | Nhập dữ liệu, Check, thông báo, Clear, Close Yes/No, lỗi mạng | tests/web-e2e |
| 3 | Visual | Form trống, kết quả, lỗi, xác nhận; desktop và màn hình nhỏ | tests/visual |
| 4 | Mobile E2E | Cùng nghiệp vụ trên Flutter thật; keyboard, Android Back, mạng | tests/mobile-e2e |
| 5 | Performance | Thời gian API dưới tải; thời gian click-to-dialog của UI | tests/performance |
| 6 | CI và báo cáo | Tự chạy suite đã có và lưu bằng chứng | ci, reports |

`tests/integration` có thể dùng chung các trường hợp API kiểm tra backend thật, tránh nhân đôi công việc. AI hỗ trợ viết test case, tìm biên, tạo bản nháp và đọc lỗi; ghi cách rà soát trong testing-guide, không tạo một suite AI riêng.

## Thiết kế dữ liệu kiểm thử

- Phân vùng tương đương: trống/chữ/thập phân/số hợp lệ/số ngoài khoảng.
- Biên Day: -1, 0, 1, 2, 30, 31, 32.
- Biên Month: 0, 1, 2, 11, 12, 13.
- Biên Year: 999, 1000, 1001, 2999, 3000, 3001.
- Bảng quyết định năm nhuận: 2000/2400 chia hết 400; 1900/2100/3000 chia hết 100; 2024 chia hết 4; 2023 không chia hết 4.
- Tháng 30 ngày: 30 hợp lệ, 31 không hợp lệ.
- Tháng 31 ngày: 31 hợp lệ, 32 ngoài khoảng Day.
- Thứ tự lỗi: nhiều field sai phải báo Day trước, sau đó Month, rồi Year.
- Chuyển trạng thái: đang mở → confirm → No giữ nguyên; confirm → Yes đóng; reopen trở về form trống.
- Mất kết nối: thông báo lỗi rõ ràng, không treo và có thể thử lại.

## Performance có hai phạm vi khác nhau

Requirement R14 là **từ lúc bấm Check tới lúc nhìn thấy kết quả**, gồm UI, HTTP, xử lý và rendering. Đo API response dưới một giây không tự chứng minh toàn bộ UI đạt yêu cầu.

Đối với k6/JMeter cần xác định trước tải, thời lượng và ngưỡng. Không gán bừa số concurrent users từ requirement này vì tài liệu không có con số đó. Số đo local chỉ mô tả máy và môi trường đã đo.

## Visual có baseline đã duyệt

Ảnh preview trong reports minh họa ứng dụng nền. Chúng chưa phải baseline regression được giảng viên/người dùng duyệt. Trước khi tạo suite visual, ổn định kích thước màn hình, browser, font và trạng thái dữ liệu.
