# Dashboard chung cho Local và GitHub Actions

Dashboard: **http://127.0.0.1:5099**. Backend và dashboard là hai tiến trình độc lập.

## Mở dashboard trước

Trong PowerShell:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run dashboard
```

Giữ terminal mở rồi truy cập địa chỉ trên bằng Chrome/Edge. Dashboard không cần
backend, Flutter hoặc emulator chỉ để xem báo cáo. Chạy `npm.cmd ci` sau khi lấy
code mới nếu chưa có thư viện Allure. Allure 3 được cài theo package-lock, không
cần cài thêm Java cho việc tạo báo cáo.

## Luồng 1 — test tại máy

Terminal khác mở backend:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Terminal tiếp theo mở menu:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:menu
```

Chọn một topic và case như trước. Mobile cần mở emulator. Kết thúc lượt test,
runner tự tạo báo cáo Allure, kể cả khi assertion FAIL. Không cần lệnh tạo báo cáo.
Quay về dashboard và F5 hoặc bấm **Tải lại kết quả**. Chọn lượt ở danh sách bên
trái; trang tổng quan ghi phạm vi, kết quả, thời gian và giới hạn. Bấm **Mở Allure
Report** nếu cần tra cứu bằng chứng. Không thêm menu chạy nhiều topic.

Dashboard có thể tắt trong lúc test; kết quả vẫn được lưu. Tắt backend không làm
mất báo cáo. Chỉ các lệnh Lab/menu, AI run và ci:topic được tích hợp tự động;
các lệnh test:* cũ là bộ thực hành cũ, không tạo lượt dashboard.

## Luồng 2 — test trên GitHub

Push code hoặc chọn Actions → Student Lab CI and delivery → Run workflow.
Không cần backend hoặc emulator tại máy. Muốn chạy Mobile bật run_mobile; chọn
observe/load/stress cho k6. Mỗi workflow là một lượt tổng hợp.

Job **Aggregate Allure dashboard report** thu kết quả các nhóm sau khi test/build
kết thúc, kể cả khi nhóm test thất bại. Job tạo artifact
`swt-dashboard-<run-id>-<attempt>`, giữ 14 ngày. Dashboard local tự tìm và tải gói
này qua GitHub CLI. Bạn chỉ cần F5; khi đang tải trang thông báo đồng bộ và tự
đọc lại khi hoàn tất. Có thể mất thêm thời gian sau các job test để tạo/upload.

Dashboard cần Internet và phiên GitHub CLI của người đang mở terminal:

```powershell
gh auth status
```

Nếu chưa đăng nhập, chạy `gh auth login` trong PowerShell bình thường. Không đặt
token trong code, URL hoặc gửi token vào chat. Dashboard không thay đổi repo và
không kích hoạt workflow. Giao diện hiển thị thông báo khi mất mạng, chưa đăng
nhập, không có artifact hoặc artifact hết hạn. Báo cáo đã tải vẫn xem offline.
Các workflow cũ trước bản cập nhật chưa có artifact dashboard nên chỉ hiện thông
tin lượt chạy và liên kết Actions, không bịa kết quả Allure từ log cũ.

Mặc định đồng bộ 15 workflow gần nhất, tối đa 3 báo cáo mới mỗi đợt; đợt kiểm tra
cách nhau tối thiểu 20 giây, kiểm tra nền mỗi 60 giây. Nguồn mặc định Tuw025/SWT.
Đổi repository bằng DASHBOARD_REPOSITORY, port bằng DASHBOARD_PORT khi cần.
Không cần cấu hình Pages để xem cả hai nguồn trên cùng dashboard local.

## Đọc đúng báo cáo

- PASS: các kiểm tra có kết quả trong phạm vi đã chọn đều đạt; xem các nhóm SKIP.
- FAIL: có assertion hoặc ngưỡng performance không đạt.
- ERROR: lỗi chuẩn bị/chạy công cụ hoặc không có bằng chứng. Không tự kết luận lỗi app.
- INCOMPLETE/INTERRUPTED: thiếu kết quả hoặc lượt bị dừng; không coi là PASS.
- SKIP: không chạy, ví dụ Mobile không bật hoặc AI chưa có case được duyệt.
- Số case là số lần thực thi theo nhóm, không phải số yêu cầu nghiệp vụ độc lập.
- k6 request và threshold là số liệu riêng, không cộng thành case API/Web.
- Profile observe không đánh giá chịu tải; API p95 không thay cho R14 UI.
- Local có thay đổi chưa commit được đánh dấu. Pipeline chỉ kiểm tra commit đã push.
- Lượt bị hủy hoàn toàn có thể không kịp tạo artifact; dashboard giữ trạng thái hủy.

Dashboard tổng hợp do dự án xây để chọn lượt và đọc tóm tắt. Phần **Allure Report**
là báo cáo HTML thực được Allure CLI tạo từ kết quả của đúng lượt đó. Hai phần
được phục vụ dưới cùng địa chỉ local. Không theo dõi trực tiếp từng bước đang chạy.

## Vị trí dữ liệu

`reports/dashboard/local/<id>/`: kết quả từng lượt Local.
`reports/dashboard/github/github-<run-id>-<attempt>/`: báo cáo GitHub đã tải.
Mỗi lượt có summary.json, dữ liệu gốc, allure-results và report/. Không commit
reports, node_modules, .backups hoặc thông tin đăng nhập.

Nếu cổng 5099 đang bận, kiểm tra có terminal dashboard đang mở hay chưa. Ctrl+C
đóng dashboard; backend ở terminal khác vẫn chạy. Dữ liệu test Lab, quyết định
duyệt AI và các menu quan sát/step được giữ nguyên.
