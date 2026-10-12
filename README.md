# Date Time Checker — thực hành Software Testing

Dự án hiện tại: `D:\Ki5\SWT\project`, phiên bản thực hành 1.3.0.
Backend C#/.NET10, web responsive và Flutter mobile dùng chung API; không database,
không unit test theo note của thầy. Bộ Lab giữ 52 case sinh viên + 3 bổ sung hành vi.

## Chạy mỗi buổi học

Terminal 1, giữ mở:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Terminal 2:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:menu
```

Menu gồm API, Web E2E, Mobile E2E, Visual, Performance, AI-assisted và CI/CD local.
Mở emulator trước nếu test Mobile. Các runner Lab/AI cần backend ở 5080;
pipeline CI tự build/mở/dừng backend riêng ở 5097. Không cần chạy flutter run
thủ công để bộ test tự thao tác. Web cùng backend tại http://127.0.0.1:5080.

## Hướng dẫn

- [Bắt đầu thực hành](docs/testing-guide/lab-start.md)
- [API](docs/testing-guide/api-testing.md)
- [Web E2E](docs/testing-guide/web-testing.md)
- [Mobile Flutter](docs/testing-guide/mobile-testing.md)
- [Visual](docs/testing-guide/visual-testing.md)
- [Performance](docs/testing-guide/performance-testing.md)
- [AI-assisted: đề xuất → duyệt → chạy → đọc kết quả](docs/testing-guide/ai-assisted-testing.md)
- [CI/CD: local → GitHub Actions → delivery ZIP](docs/testing-guide/ci-cd-testing.md)
- [Đối chiếu các case Lab](docs/test-plan/lab-design.md)

## Nội dung các thư mục

| Thư mục | Chức năng |
|---|---|
| apps/backend | Endpoint, xác thực input và nghiệp vụ lịch Gregorian |
| apps/web | HTML/CSS/JS, logo và thao tác UI |
| apps/mobile | App Flutter, wrapper Android/iOS, driver integration_test |
| tests/shared | Catalog Lab, mapping expected, helper UI dùng chung |
| tests/api, web-e2e, mobile-e2e | Các bộ test theo nền tảng |
| tests/visual, performance | So ảnh baseline, k6 và UI timing |
| tests/ai-assisted | Đề xuất AI, quyết định duyệt, prompt và test API/Web |
| tools | Menu/runner, API step, công cụ k6 |
| ci | Script tự quản lý backend và kết quả pipeline |
| .github/workflows | Workflow GitHub Actions và đóng gói delivery |
| docs | Requirement, kế hoạch và hướng dẫn |
| reports | Kết quả tạo sau chạy, không commit vào Git |

Chỉ khi cài lại dependency: npm.cmd ci, npx.cmd playwright install chromium.
Mobile cần Flutter/Android SDK/emulator đã cài trên máy. Flutter hiện dùng 3.47.6,
Android API36, NDK28.2.13676358. Visual Studio C++ không cần cho Android.

`test:*` và playwright.config.cjs giữ bộ regression cũ; thực hành Lab dùng lab:*,
playwright.lab.config.cjs và student.lab.cjs. CI mới gọi đúng bộ Lab.
AI-assisted không gọi AI lại khi chạy test đã sinh; đề xuất pending cần bạn duyệt.
CD chỉ tạo ZIP backend/web, chưa triển khai server. Lượt GitHub thật cần xác minh
tại Actions sau khi source được đưa lên https://github.com/Tuw025/SWT.
