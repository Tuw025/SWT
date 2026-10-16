# Báo cáo

`baseline-verification.md` và `baseline-results.json` ghi những kiểm tra thực tế trong giai đoạn xây ứng dụng nền; không có unit test. Ảnh preview minh họa giao diện web.

Đã có HTML report Playwright trong `playwright/`, JSON trong `playwright-results.json`, JUnit XML trong `junit.xml` và k6 JSON trong `performance/`. Dùng `npm.cmd run report` từ project root để mở HTML report. Mỗi lượt Playwright ghi lại báo cáo gần nhất.

`testing-verification.md` ghi kết quả bộ test đã chạy thực tế. Mobile và GitHub CI chưa chạy. Không coi phần chưa chạy là pass; các baseline visual mới tạo vẫn cần người dùng duyệt.
