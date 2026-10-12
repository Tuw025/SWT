# Prompt: AI hỗ trợ đọc kết quả FAIL

Tôi sẽ cung cấp case, requirement liên quan, expected, actual, log và trace.
Hãy phân tích theo thứ tự:
1. Request và thao tác nào đã thực sự chạy? Có lỗi môi trường trước assertion không?
2. Trường nào khác expected? Đối chiếu với requirement và API contract.
3. Đây là lỗi ứng dụng, test, môi trường hay requirement chưa rõ? Nêu bằng chứng.
4. Đề xuất cách sửa và một lần chạy xác minh; chưa sửa expected để khớp actual.
5. Ghi những điều chưa xác minh. Không tuyên bố test đã PASS nếu chưa chạy lại.

Giữ test case gốc của người học. Chưa có yêu cầu tự sửa locator/self-healing.
