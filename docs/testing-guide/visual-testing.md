# Visual regression với năm case GUI của Lab

Visual test đưa giao diện web tới trạng thái được mô tả trong case, kiểm tra thành phần rồi so ảnh với baseline. Nhóm hiện có năm case LAB1-GUI-01 đến LAB1-GUI-05.

## Chuẩn bị

Khởi động backend trong cửa sổ riêng theo [lab-start](lab-start.md), giữ nó chạy tại 127.0.0.1:5080. Trong cửa sổ test:

```powershell
cd "D:\Ki5\SWT\project"
```

## Chạy và quan sát một case

```powershell
npm.cmd run lab:visual -- --case LAB1-GUI-04 --mode watch
```

Case GUI-04 dùng dữ liệu Day=abc, Month=12, Year=2026 để mở Error dialog. Test đối chiếu thành phần và chụp ảnh màn hình trạng thái đó.

Để dừng trước từng bước:

```powershell
npm.cmd run lab:visual -- --case LAB1-GUI-04 --mode step
```

Chạy nhanh toàn bộ năm case:

```powershell
npm.cmd run lab:visual -- --mode run
```

## Các ảnh chuẩn

| Case | Trạng thái giao diện |
|---|---|
| LAB1-GUI-01 | Form chính, logo, title, nhãn và nút |
| LAB1-GUI-02 | Dialog xác nhận Close |
| LAB1-GUI-03 | Vị trí/nhãn Clear cạnh Check trên form |
| LAB1-GUI-04 | Error dialog |
| LAB1-GUI-05 | Message dialog của ngày hợp lệ |

Baseline Windows/Chromium của bộ Lab nằm ở `D:\Ki5\SWT\project\tests\visual\baselines\win32\lab-visual`. GUI-01 và GUI-03 có thể cùng ảnh form nhưng mục đích assertion khác nhau. Đây là ảnh chuẩn của bản web hiện tại; cần đối chiếu requirement khi chấp nhận baseline, không coi ảnh đó là bằng chứng giống từng pixel với Windows Forms gốc.

## Xem kết quả và diff

```powershell
npm.cmd run lab:report -- --profile visual
```

Report: `D:\Ki5\SWT\project\reports\labs\visual\playwright`. Ảnh/trace: `D:\Ki5\SWT\project\reports\labs\visual\artifacts`. JSON: `D:\Ki5\SWT\project\reports\labs\visual\playwright-results.json`.

Khi so ảnh thất bại, đọc expected image, actual image và diff. Phân biệt thay đổi CSS/layout, nội dung dialog, font, hệ điều hành và browser. PASS xác nhận các assertion và sự phù hợp với baseline trong cấu hình chạy đó, không xác nhận mọi trạng thái UI của app.

## Cập nhật baseline sau khi kiểm tra thay đổi

Nếu giao diện mới là thay đổi bạn đã đối chiếu và chấp nhận:

```powershell
npm.cmd run lab:visual -- --case LAB1-GUI-04 --mode watch --update
```

Sau đó chạy lại cùng case, bỏ --update:

```powershell
npm.cmd run lab:visual -- --case LAB1-GUI-04 --mode run
```

Update ghi ảnh chuẩn mới; nó không phải phép so sánh với ảnh chuẩn cũ. Không update chỉ để bỏ qua một sai khác chưa được giải thích. Trên hệ điều hành chưa có baseline, tạo ảnh lần đầu rồi duyệt trước khi dùng để đánh giá regression.

Source: `D:\Ki5\SWT\project\tests\visual\student.lab.cjs`. Dữ liệu GUI lấy từ catalog chung. Bộ này kiểm thử ảnh web; chưa có bộ visual snapshot native Android.

Tài liệu: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).
