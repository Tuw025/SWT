# Requirement của Date Time Checker

Nguồn: `ProjectIntroduction.docx` được sao chép nguyên trạng vào thư mục này. Bản gốc là URD-FU-SWT v0.1, xây dựng cho ứng dụng C# desktop. Bản hiện tại chuyển cùng nghiệp vụ sang backend C#, web và Flutter theo yêu cầu học testing của người dùng.

## Quy tắc bắt buộc

| ID | Quy tắc | Nơi thực hiện |
|---|---|---|
| R01 | Có logo FU/FPT ở trên trái; tiêu đề Date Time Checker màu xanh | Web và Flutter |
| R02 | Ba nhãn Day, Month, Year căn trái; ba ô nhập; hai nút Clear, Check | Web và Flutter |
| R03 | Day là số nguyên 1–31 | Backend, lỗi hiển thị qua UI |
| R04 | Month là số nguyên 1–12 | Backend, lỗi hiển thị qua UI |
| R05 | Year là số nguyên 1000–3000 | Backend, lỗi hiển thị qua UI |
| R06 | Phân biệt lỗi định dạng với lỗi ngoài khoảng | Backend |
| R07 | Tháng 1,3,5,7,8,10,12 có 31 ngày; 4,6,9,11 có 30 ngày | Backend |
| R08 | Tháng 2 có 29 ngày trong năm nhuận, 28 ngày nếu không nhuận | Backend |
| R09 | Năm chia hết 400 là nhuận; chia hết 100 nhưng không 400 là không nhuận; còn lại chia hết 4 là nhuận | Backend |
| R10 | Ngày phải không vượt số ngày của tháng | Backend |
| R11 | Clear xóa cả ba ô | Web và Flutter |
| R12 | Close hỏi "Are you sure to exit?"; No giữ ứng dụng, Yes đóng | Web và Flutter, điều chỉnh theo nền tảng |
| R13 | Dùng nguyên văn các thông báo trong ảnh requirement | Backend/đối thoại UI |
| R14 | Kết quả xuất hiện trong 1 giây sau Check | Cần đo trên luồng UI; số đo API riêng không đủ |
| R15 | Không crash trong các tình huống dữ liệu và lỗi mạng đã kiểm tra | Mỗi nền tảng |

## Lỗi ghi trong tài liệu và quyết định áp dụng

1. Tài liệu ghi "Day" cho khoảng 1000–3000: hiểu là **Year**, nhất quán với ba ô nhập.
2. "Georgian calendar" được hiểu là **Gregorian calendar**, theo hai flowchart.
3. Tài liệu chưa xác định thứ tự lỗi nếu nhiều ô sai: chọn **Day → Month → Year**, chỉ báo lỗi đầu tiên.
4. Input nguyên giữ dưới dạng chuỗi; chấp nhận khoảng trắng ở đầu/cuối, chữ số 0 đầu và dấu +/− ở đầu. Âm là số nguyên nhưng ngoài khoảng; thập phân, ký hiệu mũ, chữ và ô trống là sai định dạng. Ký tự dấu âm nhận là dấu ASCII `-`.
5. Ngày trong kết quả chuẩn hóa thành `dd/mm/yyyy`; không có giờ hay timezone vì requirement chỉ nhập ngày.
6. Dữ liệu ngoài định dạng/ngoài khoảng khác với ngày không tồn tại: 31/04/2024 đúng khoảng từng ô nhưng là ngày không hợp lệ.

## Điều chỉnh công nghệ và giao diện

| Tài liệu gốc | Bản thực hành |
|---|---|
| C# Windows Forms | Backend C# ASP.NET Core + web + Flutter mobile |
| .NET Framework 2.0; VS2005/2008; Windows XP | .NET 10 cho backend; Flutter SDK hiện đại cho mobile |
| Form không có nút maximize/minimize | Web có khung ứng dụng không có hai nút này; không điều khiển chrome của trình duyệt |
| Yes đóng cửa sổ | Web chuyển sang trạng thái Application closed; Android yêu cầu hệ điều hành đóng Activity; iOS dùng trạng thái đóng vì ứng dụng không tự thoát theo cách Windows |
| Arial 26 cho tiêu đề | Web dùng Arial 26pt; Flutter khai báo Arial 34.67 logical px nhưng có thể fallback font do thiết bị không có Arial |
| Layout desktop cố định | Giữ thành phần chính, thêm responsive, nhãn khoảng nhập và khoảng cách dễ dùng |
| Không nêu API | Bổ sung API để web, mobile và các bộ test dùng chung nghiệp vụ |
| Không nêu database | Không thêm database hay cơ chế lưu dữ liệu |
| Không có note về unit | Không tạo unit test theo note mới của thầy |

Không tuyên bố tương thích Windows XP hay hoàn thành installer theo tài liệu cũ. Nếu giảng viên yêu cầu đối chiếu từng pixel Windows Forms hoặc hỗ trợ .NET Framework 2.0, cần một phiên bản desktop khác.

## Phạm vi giai đoạn 1

Triển khai ứng dụng nền, hợp đồng API, cấu trúc thư mục testing và kế hoạch. Backend/web được build và kiểm tra thực tế; mức kiểm tra được ghi trong reports. Flutter source đã viết nhưng cần SDK và thiết bị để xác minh.
