# AI-assisted testing

AI-assisted là cách AI hỗ trợ thiết kế/viết/đọc test, áp dụng lên API hoặc Web E2E.
Trong bài này, Codex đã đọc requirement và catalog Lab để đề xuất 6 case ở
`tests/ai-assisted/proposals.json`. Expected được viết trước khi chạy ứng dụng.
Các case đang pending, chưa có quyết định duyệt của bạn.

`lab:ai` xem, duyệt và chạy đề xuất đã lưu; **không gọi AI mới mỗi lần chạy**.
AI hỗ trợ thật diễn ra trong cuộc trò chuyện Codex và các lượt dùng prompt của bạn.
Không cần API key. Chưa cài Playwright MCP/Copilot/Katalon/testRigor,
chưa có self-healing locator. Lỗi locator vẫn báo FAIL để điều tra.

## 1. Mở backend

Terminal thứ nhất, giữ chạy:

```powershell
cd "D:\Ki5\SWT\project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Chờ `Now listening on: http://127.0.0.1:5080`.

## 2. Xem và duyệt

Terminal thứ hai:

```powershell
cd "D:\Ki5\SWT\project"
npm.cmd run lab:ai -- list
npm.cmd run lab:ai -- review
```

Nhập tên bạn. Mỗi case hiện requirement, input, expected, lý do AI và input trùng
Lab. Đối chiếu tài liệu rồi chọn `y` chấp nhận, `n` loại, `s` giữ nguyên; nhập lý do.
Không dùng tên/ý kiến giả để làm bằng chứng.

| Case | Mục đích |
|---|---|
| AI-001 | Khoảng trắng; dựa quyết định điều chỉnh số 4 trong requirements.md |
| AI-002 | Ba ô cùng sai; Day được báo trước Month và Year |
| AI-003 | Day 2.5 sai định dạng, không phải ngoài khoảng |
| AI-004 | 31/04/2026; trùng LAB1-DATE-01, cân nhắc loại |
| AI-005 | 29/02/2400: năm chia hết 400 |
| AI-006 | Month 13; trùng LAB1-INPUT-04, cân nhắc loại |

Quyết định lưu ở review-decisions.json, có tên, lý do, thời điểm, hash đề xuất.
Nếu sửa đề xuất phải duyệt lại. Kiểm tra schema không chứng minh expected đúng.

## 3. Quan sát API

Nếu bạn đã chấp nhận AI-005:

```powershell
npm.cmd run lab:ai -- run --case AI-005 --target api --mode step
```

Enter gửi request; xem actual; Enter đối chiếu 8 trường. Kết quả:
`reports/labs/ai-assisted/api-step.json`. Chế độ này không tạo HTML report.

## 4. Quan sát Web

```powershell
npm.cmd run lab:ai -- run --case AI-005 --target web --mode step
```

Trong Playwright Inspector, dùng Resume để thực hiện từng bước mở form, nhập
Day/Month/Year, bấm Check, kiểm tra thông báo. `watch` chạy chậm để xem;
`run` chạy nhanh không mở cửa sổ. Bỏ --case để chạy tất cả case đã duyệt.

```powershell
npm.cmd run lab:ai -- run --target web --mode run
npm.cmd run lab:ai -- report --target web
```

HTML/JSON/trace/ảnh tại `reports/labs/ai-web/`; API mode run tại
`reports/labs/ai-api/`. Log thời điểm tại `reports/labs/ai-assisted/`.
Chưa duyệt không được chạy. Menu chung: `lab:menu` → mục 6.

## 5. Nhờ AI hỗ trợ lượt mới hoặc đọc FAIL

```powershell
npm.cmd run lab:ai -- context
```

Mở reports/labs/ai-assisted/context.md, gửi nội dung cho Codex. File gồm prompt,
requirement, API contract, catalog Lab và đề xuất. Yêu cầu case còn thiếu, lưu
theo schema proposals.json, giữ ID riêng, rồi duyệt/chạy lại.

Prompt phân tích FAIL tại tests/ai-assisted/prompts/analyze-failure.md.
Gửi case, requirement, expected, actual, log/trace và hỏi trường nào khác, lỗi
thuộc ứng dụng/test/môi trường hay requirement chưa rõ. Không đổi expected để
khớp actual chỉ nhằm PASS. Giữ bằng chứng FAIL và lần xác minh sau sửa.

Tham khảo: [OpenAI: testing và review](https://learn.chatgpt.com/guides/best-practices).
