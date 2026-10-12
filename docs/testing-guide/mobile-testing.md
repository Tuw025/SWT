# Mobile E2E testing — Flutter và Android emulator

Theo catalog hiện tại, nhóm mobile có 44 case. Suite chạy app Flutter trên thiết bị/emulator và gọi backend HTTP thật. Chương trình test tự điền và bấm nút; bạn điều khiển ranh giới từng bước trong chế độ step.

## 1. Backend đang chạy

Trong PowerShell thứ nhất:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Giữ cửa sổ mở tại `http://127.0.0.1:5080`.

## 2. Mở điện thoại giả lập

Mở Android Studio, vào Device Manager/Virtual Device Manager và bấm Run cạnh điện thoại đã tạo. Đợi màn hình chính.

PowerShell thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
flutter devices
```

Ghi lại device ID của dòng android, ví dụ emulator-5554. Đây là ví dụ mặc định của runner; nếu máy có ID khác, thay giá trị --device trong lệnh dưới.

## 3. Chạy case với điều khiển từng bước

```powershell
npm.cmd run lab:mobile -- --case LAB1-DATE-11 --mode step --device emulator-5554
```

Runner tạo lại dữ liệu Dart từ catalog chung, chạy flutter pub get rồi flutter drive. Nó dùng Flutter mặc định tại `D:\flutter\bin\flutter.bat`. Cấu hình nền tảng Android đã có trong project; không chạy lại setup-mobile.ps1 trước mỗi bài test.

Khi app test mở, bảng TEST dưới màn hình hiển thị ID, input và bước sắp thực hiện:

- **Tiếp tục**: thực hiện một bước.
- **Chạy tự động**: chuyển sang tự chạy các bước.
- **Tạm dừng**: dừng tại ranh giới bước tiếp theo.

Chương trình tự nhập 29, 2, 2000 rồi bấm Check. Bạn đọc dialog `29/02/2000 is correct date time!` và xem bước đối chiếu. Bảng điều khiển thuộc harness test, không xuất hiện khi mở app bình thường bằng flutter run.

Nếu đang có một phiên flutter run khác trên cùng điện thoại, gõ q trong terminal đó và đợi kết thúc trước khi chạy suite. Không chạy hai suite đồng thời trên cùng emulator.

## 4. Các cách chạy khác

Quan sát tự động chậm:

```powershell
npm.cmd run lab:mobile -- --case LAB1-INPUT-07 --mode watch --delay 1200 --device emulator-5554
```

Chạy một case nhanh:

```powershell
npm.cmd run lab:mobile -- --case LAB1-DATE-01 --mode run --device emulator-5554
```

Chạy toàn bộ nhóm:

```powershell
npm.cmd run lab:mobile -- --mode run --device emulator-5554
```

Mobile dùng step/watch/run. Tùy chọn mode ui thuộc Playwright, không dùng cho mobile. Run không hiện bảng điều khiển bài học, nhưng app test vẫn chạy trên điện thoại.

## 5. Đọc kết quả

Log mỗi lần: `D:\Ki5\SWT\project\reports\labs\mobile-<timestamp>.log`.

Khi suite trả kết quả cho driver, JSON được ghi tại `D:\Ki5\SWT\project\reports\labs\mobile-results.json`: caseId, source, input, expected, actual, từng step và PASS/FAIL. File này được ghi lại ở lần hoàn tất mới; nếu build/launch lỗi trước khi suite báo kết quả, file có thể chưa được tạo hoặc vẫn là lần cũ. Kiểm tra thời điểm file và log của lần đang chạy.

Hiện không có lệnh `lab:report -- --profile mobile` hay HTML report mobile. Dùng JSON và log trên. Nhấn Tiếp tục là cho phép automation đi tiếp; chương trình vẫn tự kiểm tra expected/actual.

## 6. Giới hạn cần trình bày đúng

SUP-CLOSE-YES chặn riêng platform channel SystemNavigator.pop để xác nhận app yêu cầu thoát và suite vẫn giữ kết nối. Nó chưa chứng minh Android thực sự đóng Activity. Để kiểm tra hành vi OS, mở app thường và thao tác X → Yes; ghi rõ đó là kiểm thử manual.

R14 trên mobile chưa được suite này đo tự động. Phép đo performance ui trong menu là phép đo web. Font Arial trên Android có thể fallback; việc khai báo font không chứng minh font thực tế đã được render là Arial.

Package integration_test chạy trên thiết bị; flutter_test cung cấp API thao tác widget cho suite này. Không có bộ unit test riêng. Thư mục ios chỉ là cấu hình nền tảng đã tạo; hướng dẫn hiện tại thực hành Android.

## 7. Địa chỉ backend và Flutter SDK khác mặc định

Đổi Flutter SDK cho phiên PowerShell hiện tại:

```powershell
$env:FLUTTER_BINARY = 'D:\flutter\bin\flutter.bat'
```

Thay đường dẫn trên bằng flutter.bat thực tế nếu SDK ở vị trí khác. Runner đọc biến này; chỉ thêm Flutter vào PATH chưa thay được đường dẫn mặc định mà runner dùng.

Nếu backend chạy trên máy tính ở cổng 5090:

```powershell
npm.cmd run lab:mobile -- --case LAB1-DATE-11 --mode watch --device emulator-5554 --base-url http://127.0.0.1:5090 --mobile-url http://10.0.2.2:5090
```

Base-url dùng cho health check từ máy tính; mobile-url được đưa vào app. 10.0.2.2 là alias từ Android emulator tới loopback máy tính. Hướng dẫn này chưa thiết lập kết nối điện thoại thật qua LAN.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không tìm thấy Flutter | Kiểm tra flutter.bat và FLUTTER_BINARY |
| Không nhận emulator | Mở emulator, chờ boot xong, chạy flutter devices; dùng đúng ID |
| Platform folders already exist | Cấu hình nền tảng đã có; chạy lab:mobile để pub get/build, không lặp setup-mobile.ps1 |
| Không cài được NDK phiên bản yêu cầu | SDK Manager → SDK Tools → Show Package Details → NDK (Side by side); cài đúng phiên bản lỗi build yêu cầu |
| Cannot connect to the checker | Kiểm tra backend, cổng và mobile-url; với emulator dùng 10.0.2.2 thay địa chỉ loopback bên trong điện thoại |
| Terminal dừng lâu lúc build | Đọc log tải/build; nếu đã có Flutter run key commands hoặc driver kết nối, xem app/điểm dừng trên giả lập |
| Chưa thấy mobile-results.json | Đọc log; JSON chỉ ghi khi suite gửi kết quả tới driver |

Suite chính: `D:\Ki5\SWT\project\tests\mobile-e2e\lab_suite.dart`. Dữ liệu sinh: `D:\Ki5\SWT\project\tests\mobile-e2e\lab_cases.g.dart` (sinh lại trước mỗi lần chạy). Entry point: `D:\Ki5\SWT\project\apps\mobile\integration_test\lab_test.dart`. Driver: `D:\Ki5\SWT\project\apps\mobile\test_driver\lab_driver.dart`.

Tài liệu: [Flutter integration tests](https://docs.flutter.dev/testing/integration-tests), [Android emulator networking](https://developer.android.com/studio/run/emulator-networking-address).
