# Hợp đồng API

## GET /api/health

HTTP 200, JSON:

```json
{"status":"ok","application":"Date Time Checker"}
```

## POST /api/date/check

Content-Type: `application/json`. `day`, `month`, `year` gửi dạng chuỗi để giữ nguyên input sai định dạng cho bài testing.

```json
{"day":"29","month":"2","year":"2000"}
```

### Ngày hợp lệ — HTTP 200

```json
{
  "outcome":"valid_date",
  "isValid":true,
  "message":"29/02/2000 is correct date time!",
  "field":null,
  "normalizedDate":"29/02/2000",
  "daysInMonth":29,
  "isLeapYear":true
}
```

### Ngày không tồn tại — HTTP 200

Với `29`, `2`, `1900`:

```json
{
  "outcome":"invalid_date",
  "isValid":false,
  "message":"29/02/1900 is NOT correct date time!",
  "field":null,
  "normalizedDate":"29/02/1900",
  "daysInMonth":28,
  "isLeapYear":false
}
```

HTTP 200 nghĩa là máy chủ đã xử lý yêu cầu; `isValid: false` thể hiện kết quả nghiệp vụ.

### Sai định dạng hoặc ngoài khoảng — HTTP 422

Với Day = `abc`:

```json
{
  "outcome":"validation_error",
  "isValid":null,
  "message":"Input data for Day is incorrect format!",
  "field":"Day",
  "normalizedDate":null,
  "daysInMonth":null,
  "isLeapYear":null
}
```

Với Day = `32`, message là `Input data for Day is out of range!`. Month/Year dùng cùng mẫu và tên field tương ứng. Thiếu hoặc null field được xử lý như ô trống (lỗi định dạng). Dừng ở lỗi đầu tiên theo thứ tự Day, Month, Year.

### Request không đúng giao thức

- HTTP 400: JSON hỏng, JSON null, body không phải object hoặc giá trị number/object/array thay cho string. `outcome: request_error`.
- HTTP 415: Content-Type không phải JSON. `outcome: request_error`.
- Giới hạn request 16 KiB; request quá lớn do Kestrel từ chối, không cam kết cùng schema lỗi JSON.
- HTTP 404: đường dẫn không tồn tại.

Endpoint không ghi dữ liệu, không yêu cầu tài khoản và không phụ thuộc dịch vụ bên ngoài. API phát sinh cho kiến trúc học tập, không có trong tài liệu desktop gốc.
