# CI/CD cho bộ Lab hiện tại

Repo: [Tuw025/SWT](https://github.com/Tuw025/SWT).
Workflow phải ở `.github/workflows/tests.yml`; GitHub không tự đọc YAML trong ci/.

CI: push/PR → lấy source → cài công cụ → build → mở backend → chạy test → lưu
bằng chứng → trả kết quả. Không cần bật backend máy bạn cho lượt GitHub.
CD của bản này là **continuous delivery**: tạo ZIP backend/web sau test đạt.
Chưa có máy chủ triển khai nên chưa có continuous deployment hoặc đăng app store.

## Các job

| Job | Khi chạy | Nội dung |
|---|---|---|
| api | push/PR/Run workflow | 47 case HTTP/JSON |
| web | push/PR/Run workflow | 44 case UI |
| visual | push/PR/Run workflow | 5 ảnh so baseline Windows |
| ui-performance | push/PR/Run workflow | 36 case click → dialog DOM (R14) |
| ai | push/PR/Run workflow | API+Web đã duyệt; chưa duyệt ghi SKIP |
| performance | Mặc định observe | 47 bộ input k6; Run workflow chọn load/stress |
| mobile | Run workflow bật run_mobile | 44 case trên emulator GitHub |
| delivery | Test đạt, trừ PR | ZIP backend/web và phạm vi kiểm thử |

Không thêm unit test; integration chưa có suite riêng. AI job không gọi AI mới.
Muốn có bằng chứng đủ nhóm: duyệt AI, commit/push, Run workflow bật Mobile.

Baseline win32 dùng Windows runner, nhưng font/OS có thể khác máy bạn. Nếu visual
FAIL hãy xem expected/actual/diff; không tự cập nhật baseline trong CI để che lỗi.
UI timing trên runner dùng chung có thể nhiễu; cần điều tra FAIL và xác minh lại.
k6 p95 <1000ms là mục tiêu API học tập, không thay cho R14 UI.
Mobile Close Yes xác minh platform-channel, chưa chứng minh OS đóng Activity.

## 1. Thử pipeline local

Không cần tự mở backend. Pipeline mở/dừng backend riêng ở 5097; có thể giữ backend
học tập ở 5080 chạy. Cần Chromium và k6 như các buổi học trước.

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run ci:local
```

Chạy API → Web → Visual → UI timing → AI đã duyệt → k6 observe, không dừng chờ Enter.
Xem reports/ci/<topic>/result.json, commands.log, backend.log và report Lab.
Menu chung mục 7 cũng chạy lệnh này. Mobile local chạy riêng, cần mở emulator:

```powershell
npm.cmd run ci:topic -- mobile --device emulator-5554
```

Nếu 5097 bận, một nhóm có thể chọn port khác:

```powershell
npm.cmd run ci:topic -- web --port 5098
```

## 2. Đưa project lên GitHub

Cài Git nếu chưa có. Gốc repo phải có package.json, apps/, tests/, ci/, .github/;
không thêm lớp project/ bên ngoài. Đăng nhập khi Git hỏi, không gửi token vào chat.

Chỉ dùng các lệnh sau nếu repo SWT trống và project chưa là repo Git:

```powershell
cd "D:\Ki5\SWT\project"
git init -b main
git remote add origin https://github.com/Tuw025/SWT.git
git add .
git status --short
git commit -m "Add Lab tests, AI-assisted practice and CI delivery"
git push -u origin main
```

Trước commit, kiểm tra không đưa node_modules, SDK, reports, bin/obj/build,
.backups, .env lên repo. Cần commit baseline PNG, proposal và quyết định duyệt.
Nếu Git hỏi danh tính, đặt user.name/user.email của chính bạn.

Repo đã có README/commit: clone vào thư mục mới, copy source vào gốc checkout
(loại thư mục sinh ra bên trên), review, commit/push. Không force push. Nếu project
đã có .git/origin, kiểm tra git remote -v và dùng cấu hình đó, không init lại mù quáng.

## 3. Quan sát Actions và report

1. Repo → Actions → Student Lab CI and delivery → chọn lượt chạy.
2. Mở từng job và bước chạy test: xem ID case, PASS/FAIL.
3. Summary có kết quả nhóm; AI chưa duyệt ghi SKIP, không coi là PASS.
4. Tải artifact lab-api/lab-web/lab-visual… ở cuối trang và giải nén.
5. Giữ nguyên thư mục report Playwright; mở bằng npx playwright show-report:

```powershell
npx.cmd playwright show-report "C:\duong-dan-da-giai-nen\reports\labs\web\playwright"
```

Thay đường dẫn mẫu bằng vị trí thực tế. Chọn case để xem steps, expected/actual,
ảnh, trace. Mobile có JSON và log từng bước; chưa có video tự động.

## 4. Chạy Mobile hoặc load/stress

Workflow phải có trên default branch để nút Run workflow xuất hiện.
Actions → Student Lab CI and delivery → Run workflow → chọn performance_profile
observe/load/stress; bật run_mobile khi cần. GitHub cài Flutter3.47.6, Java25,
AndroidAPI36, NDK28.2.13676358 và mở emulator. Không cần Android Studio ở máy bạn.
Lượt cloud đầu cần xác minh thực tế khả năng tải SDK và tương thích môi trường;
kiểm tra YAML local không chứng minh toàn bộ cloud đã PASS.

## 5. Gói delivery

Artifact date-time-checker-<số lượt> chứa ZIP backend/web. Giải nén ZIP ứng dụng,
cần .NET10 ASP.NET Core Runtime, chạy tại thư mục ứng dụng:

```powershell
dotnet .\DateTimeChecker.Api.dll --urls http://127.0.0.1:5080
```

Mở URL trên trình duyệt. test-scope.json ghi commit và trạng thái Mobile.
Gói không chứa Flutter; Mobile SKIP không đồng nghĩa mọi nền tảng đã được test.

## Bài tập FAIL → sửa → PASS

Tạo nhánh thực hành, đổi một expected đã biết trong catalog, commit/push.
Xem CI đỏ và report chỉ ra trường sai. Khôi phục expected đúng requirement,
commit/push và quan sát chạy lại. Không merge expected sai vào nhánh chính.

Nguồn: [GitHub: trigger](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[GitHub: artifact](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).
