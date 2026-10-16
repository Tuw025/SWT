# Kiểm tra bản nền Date Time Checker

Ngày kiểm tra: 08/10/2026. Máy Windows của phiên làm việc; .NET SDK 10.0.401; browser Chromium. Đây là kiểm tra trong lúc xây ứng dụng, không phải các suite học từng chủ đề đã hoàn thành.

## Kết quả thực tế

| Hạng mục | Kết quả |
|---|---|
| Backend Debug build | Đạt; 0 warning, 0 error |
| Backend Release publish | Đạt |
| Bản publish chạy độc lập | Trang index, logo, health và API kiểm tra ngày hoạt động |
| API qua HTTP thật | 224/224 trường hợp đạt |
| Web trên Chromium | 16/16 kiểm tra đạt |
| Lỗi JavaScript trên trang | Không ghi nhận trong lượt kiểm tra |
| Bố cục 320, 390, 768 px | Không tràn ngang, nút Check hiển thị |
| Cú pháp JavaScript và hai script PowerShell | Đạt |
| Flutter analyze/build/device | Chưa chạy: thiếu Flutter SDK và thiết bị/emulator |
| Unit test | Không tạo theo yêu cầu |
| k6/JMeter và CI | Chưa triển khai ở giai đoạn này |

API được đối chiếu với `datetime.date` và `calendar` của Python cho các ngày đại diện ở tháng 2, tháng 4, tháng 12, năm 1000–3000 và các năm thế kỷ. Các phép kiểm tra cũng xác minh nguyên văn thông báo, status, định dạng, range, thứ tự lỗi và các request sai giao thức.

Web đã kiểm tra ngày hợp lệ/không hợp lệ, lỗi field, Clear, Close No giữ dữ liệu, Escape hủy xác nhận, Close Yes, mở lại, lỗi kết nối và phục hồi kết nối.

## Thời gian quan sát

- API: thời gian lớn nhất quan sát trong lượt kiểm tra là **40.776 ms**.
- Các lượt Check được đo trên Chromium: khoảng **54.385–75.727 ms**, gồm thao tác tự động và đợi hộp thoại.
- Đây là số đo local, không có tải lớn. Không suy ra khả năng chịu tải hay cam kết thời gian trên điện thoại từ các số đo này.
- Mục tiêu UI trong một giây đạt ở các lượt đo web này; mobile chưa được đo.

## Bằng chứng

- `baseline-results.json`: từng input/kết quả và số đo thực tế.
- `web-preview.png`: web desktop.
- `web-result-preview.png`: hộp kết quả trên web.
- `web-mobile-preview.png`: **website ở chiều rộng 390 px**, không phải screenshot ứng dụng Flutter.

Ảnh preview chưa phải baseline visual regression được duyệt. Mã xác minh phục vụ quá trình xây dựng nằm ngoài project bàn giao; các folder tests mới có README và dữ liệu ví dụ để bắt đầu bài học sau.

## Giới hạn đã ghi rõ

Bản nền chuyển requirement desktop cũ sang .NET 10/web/Flutter. Không xác nhận tương thích Windows XP, .NET Framework 2.0 hoặc installer desktop. Close trên web là chuyển sang màn hình đóng; không cưỡng chế đóng tab trình duyệt. Flutter cần chạy setup-mobile.ps1 để sinh Android/iOS bằng SDK chính thức, sau đó analyze và chạy trên thiết bị.
