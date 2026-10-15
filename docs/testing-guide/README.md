# Hướng dẫn kiểm thử — bộ Lab hiện tại

Thư mục dự án đang dùng: `D:\Ki5\SWT\project`.

Bộ này dùng test case từ hai bài Lab của sinh viên, chọn và chạy bằng các lệnh `lab:*`. Dữ liệu được đọc từ `D:\Ki5\SWT\project\tests\shared\lab-cases.json`. Hướng dẫn được đối chiếu với menu, runner và cấu hình đang có ngày 10/10/2026.

## Đọc theo nhu cầu

| Bạn muốn làm gì? | Tài liệu |
|---|---|
| Khởi động backend và chạy case đầu tiên | [Bắt đầu thực hành](lab-start.md) |
| Gửi request, đọc response và nhấn Enter từng bước | [API testing](api-testing.md) |
| Xem trình duyệt tự nhập dữ liệu và bấm nút | [Web E2E testing](web-testing.md) |
| Chạy test tự động trên điện thoại giả lập | [Mobile E2E testing](mobile-testing.md) |
| So sánh ảnh chuẩn/ảnh mới và xem diff | [Visual regression](visual-testing.md) |
| Quan sát request, đo UI, chạy load hoặc stress | [Performance testing](performance-testing.md) |
| Giải thích integration khi không có database | [Integration trong dự án](integration-explained.md) |
| Nhờ AI đề xuất, duyệt và chạy case bổ sung | [AI-assisted testing](ai-assisted-testing.md) |
| Chạy GitHub Actions và xem delivery ZIP | [CI/CD testing](ci-cd-testing.md) |
| Truy nguồn và hiểu các điều chỉnh expected | [Thiết kế và đối chiếu hai Lab](../test-plan/lab-design.md) |

## Quy trình chạy chung

**Cửa sổ PowerShell thứ nhất — backend:**

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Giữ cửa sổ mở khi thấy `Now listening on: http://127.0.0.1:5080`.

**Cửa sổ PowerShell thứ hai — kiểm thử:**

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:menu
```

Menu cho chọn chủ đề, case và cách chạy. Mobile cần mở thêm Android emulator. Runner kiểm tra `/api/health` rồi dùng backend đã chạy; lệnh `lab:menu` và các runner `lab:*` không tự khởi động backend.

## Các lệnh chính

| Lệnh | Chức năng |
|---|---|
| `npm.cmd run lab:list` | Liệt kê ID, chủ đề áp dụng và tên case; không cần backend |
| `npm.cmd run lab:menu` | Chọn chủ đề/case/cách chạy tương tác |
| `npm.cmd run lab:api` | Chạy nhóm API |
| `npm.cmd run lab:web` | Chạy nhóm web |
| `npm.cmd run lab:mobile` | Chạy nhóm Flutter mobile |
| `npm.cmd run lab:visual` | Chạy nhóm so ảnh web |
| `npm.cmd run lab:performance` | Chạy performance API; mặc định profile observe |
| `npm.cmd run lab:report -- --profile web` | Mở HTML report web đã có; không cần backend |

Sau `--` của npm là tham số chuyển cho runner, ví dụ `--case LAB1-DATE-11 --mode step`. Lệnh trực tiếp không có `--case` chạy toàn bộ case thuộc nhóm; kiểm tra ví dụ cụ thể trong từng tài liệu trước khi chạy.

Theo catalog hiện tại: 47 case API, 44 web, 44 mobile, 5 visual; performance API dùng lại 47 dữ liệu, phép đo UI web áp dụng cho 36 case loại `check`.

## Phân biệt với bộ regression trước

Trong dự án vẫn có các lệnh `test:*`, `npm.cmd test` và cấu hình `playwright.config.cjs` của bộ regression ban đầu. Các tài liệu ở đây dùng bộ Lab mới: `lab:*`, `playwright.lab.config.cjs`, case `LAB1-*`, `LAB2-*`, `SUP-*` và kết quả trong `D:\Ki5\SWT\project\reports\labs`.

AI-assisted và pipeline CI/CD đã dùng bộ Lab hiện tại. Không tạo bộ unit test hoặc database.

## AI-assisted và CI/CD

Menu có 6 mục; mục 6 là AI-assisted và cần duyệt đề xuất trước khi chạy. CI/CD chạy trên GitHub Actions khi push/PR hoặc chọn Run workflow, quản lý backend và lưu bằng chứng. CD tạo gói backend/web, chưa triển khai server. Xem hai tài liệu trong bảng trên.


## Dashboard Local và GitHub

Xem [hướng dẫn dashboard](dashboard.md). Mở riêng bằng `npm.cmd run dashboard` tại http://127.0.0.1:5099. Runner Lab tự tạo báo cáo sau mỗi lượt; pipeline tự tạo artifact để dashboard đồng bộ. Backend vẫn mở riêng bằng start.ps1.
