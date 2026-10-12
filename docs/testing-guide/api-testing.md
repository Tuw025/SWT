# API testing với test case hai Lab

## Chuẩn bị

Khởi động backend và giữ cửa sổ chạy theo [lab-start](lab-start.md). Mở PowerShell thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
```

Nhóm API hiện có 47 case. Nó gửi HTTP tới backend thật, không mở giao diện web/mobile và không gọi riêng hàm C# để làm unit test.

## Chạy một case, điều khiển bằng Enter

```powershell
npm.cmd run lab:api -- --case LAB1-DATE-01 --mode step
```

Case này gửi Day=31, Month=4, Year=2026.

1. Đọc source, input và expected.
2. Enter lần một: gửi POST `/api/date/check`.
3. Đọc HTTP status và JSON actual.
4. Enter lần hai: đối chiếu từng trường với expected.
5. Enter lần ba: kết thúc case hoặc sang case tiếp theo.

Expected chính: HTTP 200, outcome=invalid_date, isValid=false, daysInMonth=30, message=`31/04/2026 is NOT correct date time!`. HTTP 200 thể hiện request được xử lý; ngày không tồn tại vẫn là kết quả nghiệp vụ đúng.

Với Day=abc:

```powershell
npm.cmd run lab:api -- --case LAB1-INPUT-07 --mode step
```

Expected: HTTP 422, field=Day, message=`Input data for Day is incorrect format!`.

## Chạy tự động một case hoặc toàn bộ nhóm

```powershell
npm.cmd run lab:api -- --case LAB1-DATE-11 --mode run
```

Chạy toàn bộ 47 case:

```powershell
npm.cmd run lab:api -- --mode run
```

Run dùng Playwright API request và hiển thị request/response trong terminal. Watch của API cũng hiển thị dữ liệu trong terminal; case API không có trang giao diện để quan sát.

## Dữ liệu DayInMonth từ Lab 2

```powershell
npm.cmd run lab:api -- --case LAB2-MONTH-10 --mode run
```

Case chọn month=2, year=2100, dùng day=1 để đi qua API và đối chiếu daysInMonth=28. Bộ này không gọi trực tiếp hàm DaysInMonth. Return=0 ở các case ngoài khoảng của Lab được ánh xạ thành HTTP 422 và daysInMonth=null theo hợp đồng API. Đọc [bản đối chiếu](../test-plan/lab-design.md) để phân biệt expected gốc với hợp đồng hiện tại.

## Kết quả và báo cáo

| Cách chạy | Bằng chứng |
|---|---|
| step | `D:\Ki5\SWT\project\reports\labs\api-step.json` và log `api-<timestamp>.log` |
| run/watch | HTML tại `D:\Ki5\SWT\project\reports\labs\api\playwright`, JSON cùng nhóm và trace |

Sau run/watch:

```powershell
npm.cmd run lab:report -- --profile api
```

API step là chương trình đọc Enter riêng, không tạo HTML report mới. Nếu mở HTML sau một lần step, bạn có thể đang xem lần run/watch trước. Đọc api-step.json và log của lần step đang thực hành. Report opener không cần backend nếu report đã tồn tại.

Trong HTML, đọc các bước: nguồn case → POST input → expected/actual → đối chiếu status và từng trường. API không có screenshot UI; trace/JSON là bằng chứng phù hợp.

## Kiểm tra nguyên văn message của Lab

```powershell
npm.cmd run lab:api -- --case LAB1-DATE-11 --mode step --strict-source
```

App dùng `29/02/2000`, Lab ghi `29/2/2000`. Cấu hình thường kiểm tra message chuẩn hóa đã ghi trong kế hoạch; strict-source giữ sourceMessage của Lab. FAIL ở message trong trường hợp này thể hiện khác biệt format. Không sửa expected chỉ dựa trên actual; đối chiếu requirement và mapping trước.

Source chạy: `D:\Ki5\SWT\project\tests\api\student.lab.cjs`; dữ liệu chung: `D:\Ki5\SWT\project\tests\shared\lab-cases.json`; script step: `D:\Ki5\SWT\project\tools\api-step.cjs`.
