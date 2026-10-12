# Bắt đầu chạy bộ Lab mới

Mục tiêu bài đầu tiên: chương trình tự nhập `29/2/2000` trên web, bạn điều khiển từng bước và đọc kết quả.

## 1. Vào đúng dự án

Mở PowerShell:

```powershell
cd "D:\Ki5\SWT\project"
```

Tại đây có thư mục apps, tests, tools, docs, reports và các script khởi động. Gói cập nhật đã được cài vào project; không cần thư mục project-payload để chạy.

## 2. Kiểm tra công cụ khi cần

```powershell
node --version
npm.cmd --version
dotnet --list-sdks
```

Yêu cầu của dự án: Node.js 22 trở lên và .NET SDK 10. Chỉ khi dependency chưa có hoặc cần cài lại mới chạy:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
```

Không cần chạy lại hai lệnh cài đặt này trước mỗi bài test. npm.cmd/npx.cmd giúp tránh việc PowerShell chọn npm.ps1 bị execution policy chặn.

## 3. Khởi động backend — cửa sổ thứ nhất

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Chờ:

```text
Now listening on: http://127.0.0.1:5080
```

Giữ cửa sổ này mở. Nếu đã có backend tại địa chỉ này, dùng lại cửa sổ đang chạy. Nếu terminal hiện `Application is shutting down...` rồi trở về dòng `PS ...>`, backend đã dừng và cần khởi động lại.

Runner bộ Lab luôn kiểm tra backend có sẵn, không khởi động nó thay bạn. Khi thử ứng dụng thủ công, có thể mở `http://127.0.0.1:5080` trên trình duyệt máy tính.

## 4. Chạy menu — cửa sổ thứ hai

Mở PowerShell khác:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:menu
```

Trong menu:

1. Chọn **Web E2E**.
2. Chọn **LAB1-DATE-11** — 29/2/2000 hợp lệ. Đọc ID/tên case thay vì chỉ nhớ số thứ tự.
3. Chọn **step**.
4. Đọc source, input và expected được in ra.
5. Nhấn Enter ở câu nhắc cuối để chạy.

Để chạy đúng case đó trực tiếp, thay menu bằng:

```powershell
npm.cmd run lab:web -- --case LAB1-DATE-11 --mode step
```

Không chạy đồng thời cả menu và lệnh trực tiếp cho cùng bài thực hành.

## 5. Điều khiển Playwright Inspector

Trình duyệt và Inspector mở. Trang trắng ở điểm dừng đầu tiên là bình thường: test đang chờ trước thao tác mở trang.

Bấm **Resume** để đi tới điểm dừng bài học tiếp theo. Các thao tác lần lượt là mở trang → nhập Day → nhập Month → nhập Year → bấm Check → đối chiếu message. Có thể dùng **Step over** để xem các lời gọi chi tiết trong một bước.

Kết quả cần quan sát:

```text
29/02/2000 is correct date time!
```

Chương trình tự nhập và bấm nút. Bạn dùng Inspector để điều khiển tiến trình, tránh sửa dữ liệu của app bằng tay giữa các thao tác tự động. Khi case kết thúc, trình duyệt test có thể đóng và terminal in kết quả.

## 6. Xem report của lần chạy web

Trong cửa sổ chạy test:

```powershell
npm.cmd run lab:report -- --profile web
```

Chọn LAB1-DATE-11, đọc Steps, Attachments và Trace. Report nằm trong `D:\Ki5\SWT\project\reports\labs\web\playwright`; không dùng report của bộ regression cũ để đọc kết quả này.

## 7. Chuyển sang chủ đề khác

Giữ backend đang chạy, rồi chọn bài từ [mục lục](README.md). API/web/visual/performance không cần Android emulator. Mobile cần emulator được `flutter devices` nhận và không bị một phiên `flutter run` khác chiếm.

Các nhóm `lab:api`, `lab:web`, `lab:mobile`, `lab:visual`, `lab:performance` đều cần backend. `lab:list` và việc mở report đã có không cần backend.

## Khi đổi địa chỉ backend

Cửa sổ backend:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1 -ListenUrl "http://127.0.0.1:5090"
```

Cửa sổ test web/API/visual/performance truyền `--base-url`:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:web -- --case LAB1-DATE-11 --mode watch --base-url http://127.0.0.1:5090
```

Mobile cần cả địa chỉ backend trên máy tính và địa chỉ dùng bên trong emulator; xem [hướng dẫn mobile](mobile-testing.md). Menu hiện không hỏi địa chỉ, device ID hoặc đường dẫn binary; các tùy chọn này dùng bằng lệnh trực tiếp.

## Xử lý lỗi chung

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không có script lab:menu | Xem đang đứng ở D:\Ki5\SWT\project và package.json đã có scripts lab:* chưa |
| fetch failed / backend chưa sẵn sàng | Kiểm tra cửa sổ backend và cổng 5080; runner không tự bật server |
| Address already in use | Có tiến trình đang dùng cổng; dùng backend đúng dự án đang chạy hoặc chọn cổng khác như ví dụ trên |
| Không tìm thấy Playwright CLI | Chạy npm.cmd ci tại project root |
| Không tìm thấy browser executable | Chạy npx.cmd playwright install chromium |
| Không có case / case không thuộc nhóm | Chạy npm.cmd run lab:list và chọn đúng ID, đúng nhóm |
| PowerShell báo npm.ps1 bị chặn | Dùng npm.cmd và npx.cmd như trong hướng dẫn |

Khi kết thúc thực hành, Ctrl+C trong cửa sổ backend sẽ dừng backend. Cửa sổ mở report cũng có thể dừng bằng Ctrl+C khi xem xong.

## Hai chủ đề bổ sung

Menu mục 6: [AI-assisted](ai-assisted-testing.md), xem/duyệt/chạy case AI.
Menu mục 7: [CI/CD local](ci-cd-testing.md), tự mở backend riêng ở 5097 và chạy không tương tác.
CI local không yêu cầu backend học tập 5080 đã mở; các bài Lab độc lập vẫn yêu cầu.
