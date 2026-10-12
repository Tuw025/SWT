# Mobile E2E dùng test case của hai Lab

Đã có suite `lab_suite.dart`, dữ liệu sinh từ `tests/shared/lab-cases.json`, wrapper trong `apps/mobile/integration_test` và driver lưu JSON. Chạy từ root bằng `npm.cmd run lab:mobile -- --case LAB1-DATE-11 --mode step`; mở emulator và backend trước.

Xem `docs/testing-guide/lab-start.md` và `docs/test-plan/lab-design.md` để hiểu từng bước, cách ánh xạ dữ liệu, giới hạn Close Yes và trạng thái xác minh. Suite chạy trên thiết bị với `integration_test`, không phải unit test. Mã mobile mới chưa được chạy xác minh trên emulator trong môi trường agent.

Bấm Tiếp tục trên bảng TEST để thực hiện một bước; Chạy tự động/Tạm dừng đổi cách quan sát. Kết quả và từng bước nằm trong reports/labs/mobile-results.json và log có timestamp. App nền đã được sinh viên chạy thủ công thành công; suite mới chưa được xác minh trên emulator trong môi trường agent.
