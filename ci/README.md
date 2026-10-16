# CI/CD

Workflow `.github/workflows/tests.yml` dùng bộ Lab mới. Hướng dẫn: `docs/testing-guide/ci-cd-testing.md`. CI/CD chạy trên GitHub Actions khi push/PR hoặc chọn Run workflow; không có mục CI/CD trong lab:menu.

`npm run ci:local` và `npm run ci:topic -- web` là công cụ local tùy chọn để kiểm tra trước khi push. Script tự build/start/health-check/stop backend tại 5097 và ghi reports/ci/; không gửi code hoặc kích hoạt GitHub Actions.

GitHub Actions bắt buộc đặt workflow tại `.github/workflows`; folder ci sẽ giữ script hỗ trợ và hướng dẫn. Không đặt workflow ở ci rồi cho rằng GitHub sẽ tự chạy.

Pipeline chạy API47, Web44, Visual5 Windows, UI timing36, AI đã duyệt và k6 observe. Run workflow cho phép load/stress và Mobile44 trên emulator GitHub. Không thêm unit test. CD tạo ZIP backend/web sau test đạt; chưa triển khai lên server.

`run-k6.cjs` là bộ cũ; pipeline mới dùng tests/performance/student.lab.k6.js. AI chưa duyệt ghi SKIP, không ghi PASS. Baseline không được tự cập nhật trong CI. Một lần chạy GitHub thật vẫn cần xác minh trên Actions.
