# Integration trong bộ Lab hiện tại

Integration kiểm tra sự phối hợp giữa các thành phần. Database chỉ là một thành phần có thể tham gia; dự án này không cần database.

## Luồng được kiểm tra

```text
Request JSON từ test
    → HTTP endpoint /api/date/check
    → đọc day/month/year
    → DateChecker xử lý định dạng, khoảng và lịch
    → endpoint trả status + JSON
    → test đối chiếu response
```

Web/mobile E2E đi thêm qua giao diện: nhập dữ liệu → gọi API thật → nhận JSON → hiện dialog → kiểm tra UI.

## Chạy một ví dụ có sẵn

Cửa sổ thứ nhất:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Giữ backend chạy. Cửa sổ thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:api -- --case LAB1-DATE-07 --mode step
```

Case này dùng 29/2/1900; năm 1900 không nhuận. Đọc request và expected, Enter gửi, đọc actual, Enter đối chiếu. Expected: HTTP 200, isValid=false, daysInMonth=28, isLeapYear=false và message `29/02/1900 is NOT correct date time!`.

Case API kiểm tra HTTP endpoint, nghiệp vụ lịch và JSON serialization phối hợp đúng. Nó không gọi riêng hàm IsLeapYear để làm unit test.

## Integration và API có thể cùng áp dụng

API testing mô tả giao diện HTTP được dùng để kiểm tra. Integration mô tả phạm vi các thành phần phối hợp. Một bài gửi HTTP tới backend thật có thể thuộc cả hai cách nhìn.

`D:\Ki5\SWT\project\tests\integration` hiện chỉ có README giải thích; không có suite độc lập hay lệnh lab:integration. Các case API hiện kiểm tra chuỗi tích hợp backend. Tránh trình bày thư mục này như một bộ test riêng đã chạy.

## Phân biệt với mobile integration_test

Mobile hiện có suite tại `D:\Ki5\SWT\project\tests\mobile-e2e\lab_suite.dart`, được gọi từ entry point trong package Flutter. Chạy theo [mobile-testing](mobile-testing.md), ví dụ:

```powershell
npm.cmd run lab:mobile -- --case LAB1-DATE-07 --mode step --device emulator-5554
```

Mở emulator, dùng ID thực tế và giữ backend hoạt động trước lệnh này. Flutter integration_test chạy trên thiết bị; nhập dữ liệu, gọi backend và kiểm tra dialog cũng tạo thành luồng mobile E2E. Flutter_test là API thao tác/assertion mà suite dùng, không phải một bộ unit test mới.

Ví dụ lỗi phối hợp: frontend gửi date nhưng API chờ day; endpoint đổi nhầm Day/Month; client đọc text trong khi response có message; client coi mọi HTTP 422 là lỗi kết nối rồi bỏ qua nội dung validation.

Không tạo unit suite theo note của thầy. AI-assisted và CI/CD của bộ mới để giai đoạn sau. Xem [API guide](api-testing.md), [web guide](web-testing.md) và [mục lục](README.md).
