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

## 1. Chạy CI/CD qua GitHub

Menu thực hành chỉ có 6 mục. CI/CD chạy qua GitHub Actions khi push/PR hoặc chọn
Run workflow. Commit tại máy chưa kích hoạt CI; nhiều commit được push cùng một
lần sẽ kích hoạt một lượt cho bản code mới nhất. GitHub tự mở backend và chuẩn
bị công cụ; không cần giữ backend/emulator tại máy bạn cho lượt cloud.

```powershell
cd "D:\Ki5\SWT\project"
git status
```

Để thực hành: sửa một file, commit/push thay đổi đó rồi mở Actions để xem lượt
chạy. Để chạy Mobile hoặc chọn load/stress, dùng Run workflow như mục 4 bên dưới.
Mỗi lượt lưu reports/ci/<topic>/result.json, commands.log, backend.log và report Lab.

### Công cụ local tùy chọn

Các script ci:local và ci:topic vẫn có thể dùng trực tiếp để kiểm tra môi trường
tại máy trước khi push. Chúng không kích hoạt GitHub Actions và không có mục trong
menu. Mobile local cần mở emulator:

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
4. Chờ job Aggregate Allure dashboard report tạo artifact swt-dashboard-<run-id>-<attempt>.
5. Mở dashboard local bằng npm.cmd run dashboard rồi F5; chọn lượt GitHub để xem
   tổng kết và bấm Mở Allure Report. Không cần tải/generate thủ công.

Artifact lab-api/lab-web/lab-visual… vẫn giữ dữ liệu gốc, nay nằm dưới
<launch-id>/evidence/labs/. Artifact swt-dashboard chứa bản tổng hợp và report HTML.
Mobile có JSON và log từng bước; chưa có video tự động. Xem [dashboard.md](dashboard.md)
để biết điều kiện đăng nhập GitHub CLI và xử lý lỗi đồng bộ.

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

### Nếu Mobile lỗi sdkmanager: command not found

Đây là lỗi chuẩn bị môi trường CI, chưa chạy test case ứng dụng. Workflow phải
thiết lập Android SDK command-line tools và thêm sdkmanager vào PATH trước bước
cài platform/build-tools/NDK. Bản sửa dùng android-actions/setup-android@v4,
command-line tools 22.0, sau đó kiểm tra đường dẫn và phiên bản sdkmanager.
Không cần mở emulator tại máy bạn để sửa lỗi này trên GitHub.
Sau khi đẩy bản sửa, dùng Run workflow trên nhánh main và bật run_mobile để tạo
lượt mới. Re-run lượt cũ vẫn dùng workflow của commit cũ.

### Minh họa lỗi expected

Tạo nhánh thực hành, đổi một expected đã biết trong catalog, commit/push.
Xem CI đỏ và report chỉ ra trường sai. Khôi phục expected đúng requirement,
commit/push và quan sát chạy lại. Không merge expected sai vào nhánh chính.

Nguồn: [GitHub: trigger](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[GitHub: artifact](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).


## Dashboard Local và GitHub

Xem [hướng dẫn dashboard](dashboard.md). Mở riêng bằng `npm.cmd run dashboard` tại http://127.0.0.1:5099. Runner Lab tự tạo báo cáo sau mỗi lượt; pipeline tự tạo artifact để dashboard đồng bộ. Backend vẫn mở riêng bằng start.ps1.
