# Thiết kế và đối chiếu test case của hai Lab

Giữ 52 case có dữ liệu của bạn và bổ sung 3 case hành vi từ requirement. File Excel gốc được sao chép nguyên trạng vào docs/requirements/labs; không sửa file nộp bài. Catalog máy đọc nằm ở tests/shared/lab-cases.json. Không tự coi các ô P/F, ngày năm 2007 hay Defect ID có sẵn là bằng chứng của lần chạy mới.

## Nguồn và số lượng

| Nguồn | Case có dữ liệu | Cách dùng |
|---|---:|---|
| Lab1 / CheckDate | 11 | Kiểm tra ngày qua API, web và mobile |
| Lab1 / Input Validation | 9 | Kiểm tra định dạng và biên input |
| Lab1 / GUI | 5 | Kiểm tra layout, dialog và ảnh web |
| Lab2 / CheckDate | 16 | Chuyển từ T/F của hàm sang hành vi app/API |
| Lab2 / DayInMonth | 11 | Kiểm tra daysInMonth qua API với day=1 |
| Requirement bổ sung | 3 | Clear, Close No, Close Yes |

Mã Module2 trong Lab1 bị dùng lại ở hai sheet, UTCID trong Lab2 cũng lặp lại ở hai sheet. Namespace DATE/INPUT/GUI/MONTH tránh chọn nhầm case nhưng vẫn giữ nguyên ID, sheet và tọa độ nguồn trong catalog. Một cặp trùng hoàn toàn là LAB1-DATE-11 và LAB2-DATE-16; cả hai đều được giữ. Những case cùng lớp tương đương nhưng khác dữ liệu vẫn có thể giúp học, không tự xóa vì “dư”.

## Phạm vi từng nhóm

| Nhóm | Số case | Điều kiện kiểm tra | Cách quan sát |
|---|---:|---|
| API / integration | 47 | HTTP status, outcome, message, field, isValid, normalizedDate, daysInMonth, isLeapYear | Request/response, steps, JSON expected/actual; Enter để gửi/đối chiếu |
| Web E2E | 44 | Thao tác browser thật và phản hồi API thật; thông báo và trạng thái UI | watch, Inspector, Playwright UI, trace và ảnh |
| Mobile E2E | 44 | Flutter app thật trên emulator, backend HTTP thật, thông báo và layout | Bảng TEST, Tiếp tục, Tạm dừng, log từng bước |
| Visual regression | 5 | Ảnh của năm case GUI so với baseline web | Expected/actual/diff trong report |
| Performance API | 47 dữ liệu dùng lại | Assertion nghiệp vụ dưới tải + số đo p95/error rate | observe / load / stress; log và JSON metrics |
| Performance UI web | 36 phép đo | Check click → dialog mở ≤1000ms | Số đo trong trình duyệt, attachment timing |

API suite gọi endpoint thật rồi service thật nên đã kiểm tra integration không cần database. Không tạo suite unit; không chạy trực tiếp CheckDate/DayInMonth như bài lab unit. Visual và performance là loại mục tiêu kiểm thử, không buộc phải đặt sau mobile hay E2E theo một chuỗi. AI-assisted được bổ sung trong tests/ai-assisted, giữ riêng đề xuất Codex và quyết định người học, không đổi 55 case gốc. Workflow .github/workflows/tests.yml hiện chạy bộ .lab.cjs mới, k6 và Mobile tùy chọn; CD chỉ đóng gói backend/web. Xem hai hướng dẫn ai-assisted-testing.md và ci-cd-testing.md trong docs/testing-guide.

## Các điều chỉnh phải đọc trước khi kết luận PASS

1. 11 case ngày ở Lab1 ghi d/m/yyyy; app thực hành đã quy định dd/mm/yyyy. Catalog giữ sourceMessage nguyên bản và expected chuẩn hóa riêng. --strict-source kiểm tra nguyên văn message Lab, có thể FAIL do số 0 đệm. Không đổi input của bạn.

2. DayInMonth chỉ có month/year và Return số ngày. Vì API không có endpoint riêng cho hàm này, test POST với day=1. Với input hợp lệ, đối chiếu daysInMonth đúng số gốc. Với input ngoài khoảng, Return=0 của Lab ánh xạ sang HTTP 422, daysInMonth=null và field của lỗi; đây là khác biệt hợp đồng đã được ghi rõ. Không thêm một API chỉ để gọi hàm riêng.

3. LAB2-DATE-14 chọn 30/2/2020, Return F đúng; dòng log “success” không dùng làm expected của HTTP/UI. Các log “input1 is null” ở những ca input không null cũng là dữ liệu mẫu chưa được chuyển thành thông báo của requirement.

4. D38 ở Lab2 CheckDate là 2021; E38 có 3001 nhưng nằm ngoài cột case F:U. Mình đọc hàng được đánh O theo nhãn D38=2021 và ghi ô E38 là cần xem lại, không tự gán năm 3001 vào các case đó.

5. GUI error/message không chỉ định input cụ thể: dùng lại LAB1-INPUT-07 và LAB1-DATE-11 để mở dialog. Web có X; Flutter được bổ sung X trong hai dialog và icon thông tin ở Confirm để kiểm tra theo GUI Lab1. Layout/font native Android có khác Windows Forms; Arial khai báo có thể fallback nên chưa chứng minh font thực tế của thiết bị là Arial.

6. SUP-CLOSE-YES trên Android kiểm tra app phát yêu cầu SystemNavigator.pop qua platform channel được chặn riêng để suite còn trả kết quả. Không coi nó là E2E xác nhận OS đã đóng Activity; vẫn cần quan sát thủ công trên app thường. Web kiểm tra trạng thái Application closed, không đóng cửa sổ browser của bạn.

7. Visual baseline là ảnh web hiện tại, không phải ảnh Windows Forms được requirement phê duyệt. Cần bạn xem trước khi chấp nhận làm chuẩn. Test ảnh PASS chỉ chứng minh không đổi so với baseline; các assertion layout bổ sung kiểm tra thành phần/font CSS riêng.

## Case không được tự tạo dữ liệu để chạy

- **Lab2_PhamTuanTrien.xlsx / DayInMonth / Q9:Q49**: Không chạy: cột không chọn đủ input và expected return.
- **Lab2_PhamTuanTrien.xlsx / DayInMonth / R9:R49**: Không chạy: cột không chọn đủ input và expected return.
- **Lab2_PhamTuanTrien.xlsx / DayInMonth / S9:S49**: Không chạy: cột không chọn đủ input và expected return.
- **Lab2_PhamTuanTrien.xlsx / DayInMonth / T9:T49**: Không chạy: cột không chọn đủ input và expected return.
- **Lab2 / Function3**: Mẫu Input1/Input2 không có dấu chọn dữ liệu; không có nghiệp vụ ngày tháng. Không tạo test từ các header UTCID còn lại.
- **Lab2 / Example**: Ví dụ phương trình a,b,c, không thuộc Date Time Checker.
- **Lab1 / các dòng A10:D10**: Dòng ví dụ Company/Staff là mẫu, không phải case của dự án.
- **Lab1 / Test Report, Lab2 / ngày chạy và Defect ID**: Số tổng và trạng thái P/F có dấu vết mẫu, không sử dụng làm bằng chứng đã chạy test.
- **GUI mobile / Arial và Close X**: Arial có thể fallback trên Android. Bộ test ghi nhận hạn chế font; bổ sung nút X vào dialog Flutter để đáp ứng case GUI của Lab1.

## Phần còn thiếu trong thiết kế dữ liệu

Hai Lab chưa có case ô trống, thập phân, nhiều ô sai đồng thời, lỗi mạng và phục hồi. Bộ regression cũ có một số case này, nhưng không gắn chúng thành case bạn đã tự thiết kế. Chỉ bổ sung ba case Clear/Close cần cho hành vi requirement; nếu muốn mở rộng dữ liệu, nên ghi một source=Supplement rõ ràng và xác định expected trước. Không cần nhân tất cả dữ liệu API thành tất cả ảnh visual.

R14 có phép đo web; chưa có phép đo tự động mobile trong bộ này. Tải 25 VU không phải bằng chứng tìm được điểm gãy hay khả năng scale của production. R15 được kiểm tra trong các input/luồng đã chạy, không thể kết luận không bao giờ crash.

## Danh sách case để truy nguồn

| Mã trong chương trình | Nguồn / vị trí | Input | Expected / mục đích | Nhóm |
|---|---|---|---|---|
| LAB1-DATE-01 | Test Case_done.xls / CheckDate / [Module1 -1] / A11:D11 | day=31, month=4, year=2026 | 31/04/2026 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-02 | Test Case_done.xls / CheckDate / [Module1 -2] / A12:D12 | day=31, month=6, year=2026 | 31/06/2026 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-03 | Test Case_done.xls / CheckDate / [Module1 -3] / A14:D14 | day=31, month=9, year=2026 | 31/09/2026 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-04 | Test Case_done.xls / CheckDate / [Module1 -4] / A15:D15 | day=31, month=11, year=2026 | 31/11/2026 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-05 | Test Case_done.xls / CheckDate / [Module1 -5] / A17:D17 | day=30, month=4, year=2026 | 30/04/2026 is correct date time! | api, web, mobile, performance |
| LAB1-DATE-06 | Test Case_done.xls / CheckDate / [Module1 -6] / A18:D18 | day=29, month=2, year=2023 | 29/02/2023 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-07 | Test Case_done.xls / CheckDate / [Module1 -7] / A19:D19 | day=29, month=2, year=1900 | 29/02/1900 is NOT correct date time! | api, web, mobile, performance |
| LAB1-DATE-08 | Test Case_done.xls / CheckDate / [Module1 -8] / A20:D20 | day=31, month=3, year=2026 | 31/03/2026 is correct date time! | api, web, mobile, performance |
| LAB1-DATE-09 | Test Case_done.xls / CheckDate / [Module1 -9] / A21:D21 | day=28, month=2, year=2023 | 28/02/2023 is correct date time! | api, web, mobile, performance |
| LAB1-DATE-10 | Test Case_done.xls / CheckDate / [Module1 -10] / A22:D22 | day=29, month=2, year=2024 | 29/02/2024 is correct date time! | api, web, mobile, performance |
| LAB1-DATE-11 | Test Case_done.xls / CheckDate / [Module1 -11] / A23:D23 | day=29, month=2, year=2000 | 29/02/2000 is correct date time! | api, web, mobile, performance |
| LAB1-INPUT-01 | Test Case_done.xls / Input Validation / [Module2-1] / A11:D11 | day=0, month=1, year=2026 | Input data for Day is out of range! | api, web, mobile, performance |
| LAB1-INPUT-02 | Test Case_done.xls / Input Validation / [Module2-2] / A12:D12 | day=32, month=1, year=2026 | Input data for Day is out of range! | api, web, mobile, performance |
| LAB1-INPUT-03 | Test Case_done.xls / Input Validation / [Module2-3] / A14:D14 | day=1, month=0, year=2026 | Input data for Month is out of range! | api, web, mobile, performance |
| LAB1-INPUT-04 | Test Case_done.xls / Input Validation / [Module2-4] / A15:D15 | day=1, month=13, year=2026 | Input data for Month is out of range! | api, web, mobile, performance |
| LAB1-INPUT-05 | Test Case_done.xls / Input Validation / [Module2-5] / A16:D16 | day=1, month=12, year=999 | Input data for Year is out of range! | api, web, mobile, performance |
| LAB1-INPUT-06 | Test Case_done.xls / Input Validation / [Module2-6] / A17:D17 | day=1, month=12, year=3001 | Input data for Year is out of range! | api, web, mobile, performance |
| LAB1-INPUT-07 | Test Case_done.xls / Input Validation / [Module2-7] / A18:D18 | day=abc, month=12, year=2026 | Input data for Day is incorrect format! | api, web, mobile, performance |
| LAB1-INPUT-08 | Test Case_done.xls / Input Validation / [Module2-8] / A19:D19 | day=1, month=abc, year=2026 | Input data for Month is incorrect format! | api, web, mobile, performance |
| LAB1-INPUT-09 | Test Case_done.xls / Input Validation / [Module2-9] / A20:D20 | day=1, month=12, year=abc | Input data for Year is incorrect format! | api, web, mobile, performance |
| LAB1-GUI-01 | Test Case_done.xls / GUI / [Module2-1] / A11:D11 | Giao diện | Verify Main Application Layout | web, mobile, visual |
| LAB1-GUI-02 | Test Case_done.xls / GUI / [Module2-2] / A12:D12 | Giao diện | Verify Close Confirmation Dialog Layout | web, mobile, visual |
| LAB1-GUI-03 | Test Case_done.xls / GUI / [Module2-3] / A14:D14 | Giao diện | Verify Clear Button Layout | web, mobile, visual |
| LAB1-GUI-04 | Test Case_done.xls / GUI / [Module2-4] / A15:D15 | day=abc, month=12, year=2026 | Input data for Day is incorrect format! | web, mobile, visual |
| LAB1-GUI-05 | Test Case_done.xls / GUI / [Module2-5] / A16:D16 | day=29, month=2, year=2000 | 29/02/2000 is correct date time! | web, mobile, visual |
| LAB2-DATE-01 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID01 / D9:F53 | day=0, month=1, year=2021 | Input data for Day is out of range! | api, web, mobile, performance |
| LAB2-DATE-02 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID02 / D9:G53 | day=32, month=1, year=2021 | Input data for Day is out of range! | api, web, mobile, performance |
| LAB2-DATE-03 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID03 / D9:H53 | day=1, month=0, year=2021 | Input data for Month is out of range! | api, web, mobile, performance |
| LAB2-DATE-04 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID04 / D9:I53 | day=1, month=13, year=2021 | Input data for Month is out of range! | api, web, mobile, performance |
| LAB2-DATE-05 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID05 / D9:J53 | day=1, month=1, year=999 | Input data for Year is out of range! | api, web, mobile, performance |
| LAB2-DATE-06 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID06 / D9:K53 | day=1, month=1, year=3001 | Input data for Year is out of range! | api, web, mobile, performance |
| LAB2-DATE-07 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID07 / D9:L53 | day=1, month=1, year=1000 | 01/01/1000 is correct date time! | api, web, mobile, performance |
| LAB2-DATE-08 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID08 / D9:M53 | day=31, month=12, year=3000 | 31/12/3000 is correct date time! | api, web, mobile, performance |
| LAB2-DATE-09 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID09 / D9:N53 | day=30, month=4, year=2021 | 30/04/2021 is correct date time! | api, web, mobile, performance |
| LAB2-DATE-10 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID10 / D9:O53 | day=31, month=4, year=2021 | 31/04/2021 is NOT correct date time! | api, web, mobile, performance |
| LAB2-DATE-11 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID11 / D9:P53 | day=28, month=2, year=2021 | 28/02/2021 is correct date time! | api, web, mobile, performance |
| LAB2-DATE-12 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID12 / D9:Q53 | day=29, month=2, year=2021 | 29/02/2021 is NOT correct date time! | api, web, mobile, performance |
| LAB2-DATE-13 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID13 / D9:R53 | day=29, month=2, year=2020 | 29/02/2020 is correct date time! | api, web, mobile, performance |
| LAB2-DATE-14 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID14 / D9:S53 | day=30, month=2, year=2020 | 30/02/2020 is NOT correct date time! | api, web, mobile, performance |
| LAB2-DATE-15 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID15 / D9:T53 | day=29, month=2, year=2100 | 29/02/2100 is NOT correct date time! | api, web, mobile, performance |
| LAB2-DATE-16 | Lab2_PhamTuanTrien.xlsx / CheckDate / UTCID16 / D9:U53 | day=29, month=2, year=2000 | 29/02/2000 is correct date time! | api, web, mobile, performance |
| LAB2-MONTH-01 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID01 / D9:F47 | day=1, month=0, year=2020 | Return gốc=0; HTTP=422; daysInMonth=None | api, performance |
| LAB2-MONTH-02 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID02 / D9:G47 | day=1, month=13, year=2020 | Return gốc=0; HTTP=422; daysInMonth=None | api, performance |
| LAB2-MONTH-03 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID03 / D9:H47 | day=1, month=1, year=999 | Return gốc=0; HTTP=422; daysInMonth=None | api, performance |
| LAB2-MONTH-04 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID04 / D9:I47 | day=1, month=13, year=3001 | Return gốc=0; HTTP=422; daysInMonth=None | api, performance |
| LAB2-MONTH-05 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID05 / D9:J47 | day=1, month=1, year=1000 | Return gốc=31; HTTP=200; daysInMonth=31 | api, performance |
| LAB2-MONTH-06 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID06 / D9:K47 | day=1, month=12, year=3000 | Return gốc=31; HTTP=200; daysInMonth=31 | api, performance |
| LAB2-MONTH-07 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID07 / D9:L47 | day=1, month=4, year=2021 | Return gốc=30; HTTP=200; daysInMonth=30 | api, performance |
| LAB2-MONTH-08 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID08 / D9:M47 | day=1, month=2, year=2021 | Return gốc=28; HTTP=200; daysInMonth=28 | api, performance |
| LAB2-MONTH-09 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID09 / D9:N47 | day=1, month=2, year=2020 | Return gốc=29; HTTP=200; daysInMonth=29 | api, performance |
| LAB2-MONTH-10 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID10 / D9:O47 | day=1, month=2, year=2100 | Return gốc=28; HTTP=200; daysInMonth=28 | api, performance |
| LAB2-MONTH-11 | Lab2_PhamTuanTrien.xlsx / DayInMonth / UTCID11 / D9:P47 | day=1, month=2, year=2000 | Return gốc=29; HTTP=200; daysInMonth=29 | api, performance |
| SUP-CLEAR | ProjectIntroduction.docx / Requirement /  / Clear / Close | day=29, month=2, year=2000 | Clear xóa cả ba ô | web, mobile |
| SUP-CLOSE-NO | ProjectIntroduction.docx / Requirement /  / Clear / Close | day=29, month=2, year=2000 | No giữ app và dữ liệu | web, mobile |
| SUP-CLOSE-YES | ProjectIntroduction.docx / Requirement /  / Clear / Close | day=29, month=2, year=2000 | Yes yêu cầu đóng ứng dụng | web, mobile |
