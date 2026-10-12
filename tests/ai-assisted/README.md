# AI-assisted

- proposals.json: 6 đề xuất Codex, pending.
- review-decisions.json: tên/lý do/thời điểm/hash quyết định người học.
- catalog.cjs: schema và chọn case được duyệt còn khớp nội dung.
- api-ai.lab.cjs / web-ai.lab.cjs: chạy trên ứng dụng thật.
- prompts/: mẫu yêu cầu đề xuất mới và đọc FAIL.

Hướng dẫn: docs/testing-guide/ai-assisted-testing.md. Menu mục 6 hoặc npm run lab:ai.
Chạy lại case đã sinh không gọi AI lại. Không lấy actual làm expected.
