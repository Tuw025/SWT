# Performance — observe, UI, load và stress

Nhóm này có hai cách đo: k6 gửi HTTP dưới tải; Playwright đo từ click Check đến lúc dialog mở trên web. Tất cả dùng backend thật và dữ liệu từ catalog Lab.

## Chuẩn bị

Cửa sổ thứ nhất:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Giữ backend chạy. Cửa sổ thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
```

Runner tự tải k6 v2.3.0 Windows x64 vào `D:\Ki5\SWT\project\.tooling\k6` khi binary mặc định chưa có. Lần đầu cần Internet. K6 không cần thêm vào PATH. Có thể chỉ định một binary đã cài bằng --binary ở phần cuối tài liệu.

## Chọn bằng menu

```powershell
npm.cmd run lab:menu
```

Chọn Performance → một case hoặc toàn bộ case → observe/ui/load/stress → Enter chạy. Menu performance hiện luôn dùng mode run, vì vậy ui trong menu đo trên browser không hiện cửa sổ. Muốn thấy cửa sổ khi đo UI, dùng lệnh trực tiếp với mode watch.

## 1. Observe — đọc từng request/response

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-01 --profile observe
```

Case chọn dữ liệu 31/4/2026. Một VU gửi đúng một request cho case đó, in input/expected/actual/time/result. Nếu bỏ --case, một VU gửi lần lượt toàn bộ 47 dữ liệu, mỗi case một lần.

Có tám checks: HTTP status và bảy trường JSON. HTTP 200 + isValid=false + message NOT correct là kết quả nghiệp vụ đúng cho ngày không tồn tại. HTTP 422 dự kiến ở các case validation được coi là response hợp lệ cho thống kê HTTP failures; status và JSON vẫn được đối chiếu cho từng case.

Observe có khoảng nghỉ mặc định 700ms mỗi vòng để đọc log. Tổng lần chạy khoảng 0,7s không có nghĩa API mất 700ms. Nếu durationMs/p95 hiện 0, chỉ ghi nhận số đo công cụ cung cấp; một mẫu không đủ đánh giá hiệu năng ổn định hoặc kết luận xử lý thực tế bằng 0ms.

## 2. UI — kiểm tra requirement R14 trên web

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-11 --profile ui
```

Đo bằng clock trong browser: event click Check → thuộc tính open của dialog được bật. Kiểm tra message đúng và elapsedMs ≤1000. Đây là phép đo dialog mở trong DOM, không phải đo trực tiếp từng pixel đã được vẽ lên màn hình hoặc thời gian người dùng đọc thông báo.

Để thấy browser trong khi đo:

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-11 --profile ui --mode watch
```

Các khoảng nghỉ hỗ trợ quan sát nằm trước khoảng đo. Không thêm thao tác thủ công/pause giữa click và dialog mở. Mode ui nghĩa là mở Playwright UI; profile ui mới là chọn phép đo R14. Đối với bài đo đầu tiên nên dùng lệnh mẫu trên.

Chạy toàn bộ 36 case loại check được áp dụng:

```powershell
npm.cmd run lab:performance -- --profile ui
```

Các case LAB2-MONTH-* kiểm tra số ngày qua API, không thuộc phép đo UI. Chọn riêng một MONTH case rồi profile ui sẽ bị runner từ chối. Trong menu, hãy chọn DATE/INPUT hoặc chọn toàn bộ nhóm để runner tự lọc các case UI áp dụng.

Xem report:

```powershell
npm.cmd run lab:report -- --profile ui-performance
```

HTML tại `D:\Ki5\SWT\project\reports\labs\ui-performance\playwright`; attachment R14 timing có caseId, elapsedMs, limitMs. Thư mục này được tạo khi phép đo UI chạy. Mobile R14 chưa được đo tự động bởi bộ này.

## 3. Load — tải cố định

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-01 --profile load
```

Giữ 10 VU trong 20 giây. Mỗi VU lặp request → checks → nghỉ 0,2 giây. Một case được chọn sẽ được gửi nhiều lần, không phải đúng một request. Bỏ --case để dùng luân phiên toàn bộ 47 dữ liệu.

## 4. Stress — tăng rồi giảm tải

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-01 --profile stress
```

| Giai đoạn | Thời gian | Mục tiêu VU |
|---|---|---|
| 1 | 0–10 giây | Tăng 1 → 10 |
| 2 | 10–20 giây | Tăng 10 → 25 |
| 3 | 20–30 giây | Giảm 25 → 0 |

VU là người dùng mô phỏng gửi HTTP, không phải browser/điện thoại được mở. Không có giai đoạn giữ riêng tải đỉnh 25 VU. gracefulRampDown=5s cho vòng đang chạy thời gian hoàn tất khi giảm VU; bài không bắt buộc chạy đủ 35s.

Ví dụ `17/25 VUs, 567 complete, 0 interrupted`: 17 VU đang hoạt động, giới hạn cấu hình 25; 567 vòng hoàn tất; không có vòng bị ngắt. Mỗi vòng của script này gửi một request. Phần trăm tiến độ là tiến độ thời gian, không phải tỷ lệ PASS.

Đây là cấu hình tăng/giảm tải nhỏ phục vụ học. Nó chưa xác định điểm gãy, tải tối đa hay khả năng scale của production nếu chưa tăng tới mức gây chậm/lỗi và phân tích các điều kiện chạy.

## Đọc kết quả k6

| Số liệu/ngưỡng | Ý nghĩa |
|---|---|
| requests | Tổng số HTTP request do scenario phát sinh |
| checks | Tỷ lệ các điều kiện đối chiếu đạt |
| http_req_failed | Tỷ lệ HTTP request bị coi là lỗi theo callback của script |
| p95 | Phân vị 95 của thời gian HTTP; không phải trung bình hay cực đại |
| checks: rate==1 | Yêu cầu 100% checks đạt |
| http_req_failed: rate<0.01 | Yêu cầu tỷ lệ HTTP failures dưới 1% |
| http_req_duration: p(95)<1000 | Yêu cầu p95 HTTP dưới 1000ms |

HTTP duration gồm gửi, chờ và nhận response, không gồm thời gian hiển thị UI. Các ngưỡng tải là mục tiêu thực hành bổ sung; requirement R14 phải đối chiếu phép đo UI riêng. P95 trong summary là số tổng hợp toàn lần chạy, không tách theo từng giai đoạn tăng tải.

## File kết quả

K6 ghi các file sau theo profile đã chạy:

- `D:\Ki5\SWT\project\reports\labs\performance-observe.json`
- `D:\Ki5\SWT\project\reports\labs\performance-load.json`
- `D:\Ki5\SWT\project\reports\labs\performance-stress.json`

Log riêng có timestamp: `D:\Ki5\SWT\project\reports\labs\performance-<timestamp>.log`. Observe in từng request/response; load và stress in tiến trình và summary, không in toàn bộ response từng request để giảm tác động logging.

K6 hiện không tạo HTML report và không có report profile performance trong lab:report. Đọc JSON/log trực tiếp. UI timing dùng HTML của profile ui-performance. JSON mỗi profile chứa lần chạy mới nhất; sao chép trước khi chạy lại nếu cần giữ bằng chứng.

## Dùng công cụ hoặc backend ở vị trí khác

```powershell
npm.cmd run lab:performance -- --case LAB1-DATE-01 --profile observe --binary "D:\Tools\k6\k6.exe" --base-url http://127.0.0.1:5090
```

Đây là ví dụ đường dẫn tùy chọn; thay bằng k6.exe thực tế và bảo đảm backend đã chạy tại địa chỉ đó. Runner không tự bật server. Không cần đổi biến PROFILE/BASE_URL bằng tay khi dùng các tham số lab:* này.

Source k6: `D:\Ki5\SWT\project\tests\performance\student.lab.k6.js`. Source UI: `D:\Ki5\SWT\project\tests\performance\student-ui.lab.cjs`.

Tài liệu: [k6 metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/), [ramping VUs](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-vus/).
