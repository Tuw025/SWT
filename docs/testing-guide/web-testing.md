# Web E2E testing — bộ Lab mới

Hướng dẫn này dùng các lệnh lab:web và case từ hai Lab. Đường dẫn làm việc: `D:\Ki5\SWT\project`. Theo catalog hiện tại, nhóm web có 44 case. Đây là bản thay thế hướng dẫn web của bộ regression trước.

## Chuẩn bị hai cửa sổ

Cửa sổ thứ nhất chạy backend:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Giữ cửa sổ mở sau dòng `Now listening on: http://127.0.0.1:5080`.

Cửa sổ thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
```

Runner lab:web kiểm tra backend có sẵn. Nó không tự khởi động backend. Nếu thiếu dependency/browser, làm bước cài một lần tại [lab-start](lab-start.md). Playwright tự mở cửa sổ trình duyệt cho bài test; bạn không cần mở Chrome thủ công trước.

## Chạy một case với Inspector

```powershell
npm.cmd run lab:web -- --case LAB1-DATE-11 --mode step
```

Nhấn Resume trong Inspector để thực hiện từng bước:

| Bước | Thao tác tự động | Bạn cần quan sát |
|---|---|---|
| 1 | Mở trang | Form Date Time Checker |
| 2 | Nhập Day=29 | Ô Day có 29 |
| 3 | Nhập Month=2 | Ô Month có 2 |
| 4 | Nhập Year=2000 | Ô Year có 2000 |
| 5 | Bấm Check | Request gửi tới backend thật và dialog mở |
| 6 | Đối chiếu message | 29/02/2000 is correct date time! |

Điểm dừng nằm trước hành động. Trang trắng lúc đầu có thể là điểm dừng trước page.goto. Resume đi tới điểm dừng bài học tiếp theo; Step over giúp xem từng lời gọi chi tiết. Khi test kết thúc, browser có thể đóng.

Test kiểm tra cả JSON gửi đi, HTTP/JSON trả về và thông báo trên UI. Ví dụ 31/4/2026 phải có isValid=false và message NOT correct; việc nhận HTTP 200 không thay thế assertion nghiệp vụ.

## Chạy chậm để quan sát

```powershell
npm.cmd run lab:web -- --case LAB1-INPUT-07 --mode watch --delay 1200
```

Watch mở browser và tự chạy. Delay là khoảng nghỉ sau bước bài học, tính bằng mili giây. Nó giúp đọc màn hình, không phải phép đo thời gian phản hồi API. Case này nhập Day=abc và kiểm tra Error dialog.

## Chọn case bằng Playwright UI

```powershell
npm.cmd run lab:web -- --mode ui
```

Trong UI chọn case để chạy và xem timeline, DOM, network và assertion. Đây là lệnh trực tiếp: menu lab:menu hiện chỉ đưa ra step/watch/run cho web, không có lựa chọn UI mode trong menu.

## Chạy nhanh

Một case:

```powershell
npm.cmd run lab:web -- --case LAB1-DATE-01 --mode run
```

Hai case:

```powershell
npm.cmd run lab:web -- --case LAB1-DATE-01,LAB1-DATE-11 --mode run
```

Toàn bộ nhóm web:

```powershell
npm.cmd run lab:web -- --mode run
```

Run chạy Chromium không hiện cửa sổ; watch/step có cửa sổ. Bộ Lab hiện cấu hình web trên Chromium. Các lệnh cross-browser cũ không phải lệnh chạy những case Lab này trên nhiều browser.

## Các case hành vi từ requirement

```powershell
npm.cmd run lab:web -- --case SUP-CLEAR --mode step
npm.cmd run lab:web -- --case SUP-CLOSE-NO --mode step
npm.cmd run lab:web -- --case SUP-CLOSE-YES --mode step
```

Clear phải xóa cả ba ô. Close No giữ form và dữ liệu. Close Yes trên web chuyển sang Application closed; đây là điều chỉnh cho nền tảng web đã ghi trong requirement, không cố đóng cửa sổ trình duyệt của bạn.

## Report và bằng chứng

```powershell
npm.cmd run lab:report -- --profile web
```

Chọn case vừa chạy và đọc Steps/Attachments/Trace. Report nằm tại `D:\Ki5\SWT\project\reports\labs\web\playwright`; JSON tại `D:\Ki5\SWT\project\reports\labs\web\playwright-results.json`; ảnh và trace tại `D:\Ki5\SWT\project\reports\labs\web\artifacts`. Trace/ảnh được bật cho cả lần PASS của bộ Lab.

HTML/JSON và artifacts của nhóm được ghi lại cho lần chạy gần nhất; log `D:\Ki5\SWT\project\reports\labs\web-<timestamp>.log` có tên riêng cho mỗi lần. Khi cần lưu bằng chứng của một lần trước, sao chép report/ảnh/trace trước khi chạy lại cùng nhóm.

Source suite: `D:\Ki5\SWT\project\tests\web-e2e\student.lab.cjs`. Flow dùng chung: `D:\Ki5\SWT\project\tests\shared\lab-web.cjs`. Cấu hình: `D:\Ki5\SWT\project\playwright.lab.config.cjs`.

Để học các nhóm còn lại, xem [mục lục](README.md). Tài liệu công cụ: [Playwright debug](https://playwright.dev/docs/debug), [Playwright UI](https://playwright.dev/docs/test-ui-mode).
