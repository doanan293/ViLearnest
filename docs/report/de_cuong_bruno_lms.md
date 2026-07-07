# ĐỀ CƯƠNG BÁO CÁO HỌC PHẦN

**Tên đề tài:** Nghiên cứu giải pháp kiểm thử API tự động dựa trên Git-friendly workflow với công cụ Bruno và thử nghiệm trên hệ thống LMS

---

## I. THÔNG TIN CHUNG
* **Sinh viên thực hiện:** [Họ và tên Sinh viên]
* **Mã số sinh viên:** [MSSV]
* **Lớp:** [Mã lớp]
* **Giáo viên hướng dẫn:** [Họ và tên GVHD]
* **Hệ thống thử nghiệm:** Dự án Andv-LMS (Learning Management System)
  * Frontend: Next.js / React
  * Backend: Fastify (REST API)

---

## II. NỘI DUNG CHI TIẾT CÁC CHƯƠNG

### CHƯƠNG 1: MỞ ĐẦU & CƠ SỞ LÝ THUYẾT VỀ KIỂM THỬ API
* **1.1. Tổng quan về kiểm thử phần mềm**
  * Định nghĩa kiểm thử phần mềm.
  * Vị trí của kiểm thử API trong kim tự tháp kiểm thử (Test Pyramid).
* **1.2. Tầm quan trọng của kiểm thử API**
  * Lý do cần kiểm thử API tự động thay vì kiểm thử thủ công (Manual Testing).
  * Lợi ích về mặt hiệu năng, tính nhất quán và thời gian kiểm thử.
* **1.3. Thách thức trong làm việc nhóm khi kiểm thử API**
  * Vấn đề xung đột mã nguồn (merge conflict) khi nhiều lập trình viên cùng chỉnh sửa bộ test.
  * Hạn chế của các công cụ lưu trữ dạng file đơn khối (monolithic JSON) lớn như Postman.

### CHƯƠNG 2: NGHIÊN CỨU CÔNG CỤ KIỂM THỬ API BRUNO
* **2.1. Giới thiệu công cụ Bruno**
  * Lịch sử hình thành và triết lý thiết kế (Local-first, Open-source, Git-friendly).
  * So sánh nhanh Bruno với các công cụ phổ biến khác (Postman, Insomnia).
* **2.2. Định dạng lưu trữ Bru Markup**
  * Khái niệm Bru markup language.
  * Cú pháp và cách thức tổ chức các request dưới dạng các file `.bru` riêng lẻ trong thư mục.
* **2.3. Viết kịch bản kiểm thử với Bruno**
  * Khái niệm Assertions trong Bruno (xác thực không cần code).
  * Scripting với JavaScript (Pre-request và Post-response scripts) để xử lý logic phức tạp.
  * Quản lý biến môi trường (Environment Variables) trong Bruno.

### CHƯƠNG 3: THIẾT KẾ KỊCH BẢN KIỂM THỬ TRÊN HỆ THỐNG LMS
* **3.1. Giới thiệu hệ thống thử nghiệm Andv-LMS**
  * Kiến trúc tổng quan của dự án Andv-LMS.
  * Cấu trúc REST API của Backend (Fastify) và kết nối Cơ sở dữ liệu.
* **3.2. Thiết kế kịch bản kiểm thử chức năng (Functional Test Cases)**
  * **Kịch bản nhóm Auth (Xác thực):** Đăng nhập thành công, đăng nhập thất bại (sai mật khẩu, sai định dạng email, thiếu trường bắt buộc).
  * **Kịch bản nhóm Course (Khóa học):** Lấy danh sách khóa học, tạo khóa học mới với các quyền tương ứng.
* **3.3. Thiết kế kịch bản kiểm thử bảo mật (Security Test Cases) với Bruno**
  * **Bỏ qua xác thực & phân quyền (Authentication/Authorization Bypass):** Gửi yêu cầu truy cập các API yêu cầu đăng nhập/quyền giáo viên nhưng không đính kèm Token hoặc dùng Token sai quyền, xác thực xem hệ thống có chặn lại bằng mã `401 Unauthorized` hoặc `403 Forbidden` không.
  * **Kiểm tra ngăn chặn mã độc (Basic Injection Prevention):** Thử nghiệm gửi các ký tự đặc biệt hoặc payload độc hại (SQL/XSS) qua tham số API và kiểm tra xem hệ thống có lọc dữ liệu và trả về lỗi hợp lệ (`400 Bad Request`) hay không.
  * **Kiểm tra giới hạn tần suất (Rate Limiting):** Sử dụng script gửi liên tiếp requests để xác thực xem server có phản hồi mã `429 Too Many Requests` khi quá tần suất cho phép hay không.
* **3.4. Hiện thực hóa kịch bản bằng Bruno**
  * Thiết lập cấu trúc thư mục chứa các file kiểm thử `.bru` trong dự án.
  * Viết mã kịch bản kiểm thử chức năng và kiểm thử bảo mật bằng các xác thực (Assertions/Scripts) của Bruno.

### CHƯƠNG 4: THỰC THI KIỂM THỬ VÀ TRỰC QUAN HÓA KẾT QUẢ
* **4.1. Tự động hóa kiểm thử bằng Bruno CLI**
  * Cài đặt và chạy toàn bộ thư mục test thông qua thư viện `@usebruno/cli`.
  * Cấu hình biến môi trường động để dễ chuyển đổi môi trường chạy test.
* **4.2. Trực quan hóa kết quả với Allure Report**
  * Cấu hình Bruno CLI xuất file kết quả dạng JUnit XML.
  * Tích hợp Allure Report để tạo Dashboard giao diện Web hiển thị trực quan tỷ lệ Pass/Fail và thống kê các ca kiểm thử bảo mật.
* **4.3. Đánh giá hiệu quả thực nghiệm**
  * **Về mặt chức năng:** Tỷ lệ thành công của các API chính, độ ổn định của hệ thống.
  * **Về mặt bảo mật:** Đánh giá độ an toàn của API trước các lỗi phân quyền và brute-force thông qua bộ test Bruno.

### CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
* **5.1. Kết quả đạt được**
  * Minh chứng được sự tiện lợi của Git-friendly workflow trong phát triển và kiểm thử dự án phần mềm theo nhóm.
* **5.2. Hạn chế của đề tài**
  * Giới hạn của môi trường kiểm thử (chạy cục bộ nên chưa phản ánh chính xác 100% môi trường mạng thực tế).
  * Những hạn chế trong việc đồng bộ hóa dữ liệu kiểm thử (test data seeding) tự động.
* **5.3. Hướng phát triển**
  * Tích hợp toàn bộ quy trình kiểm thử (Bruno + Allure + k6) vào pipeline CI/CD tự động (như GitHub Actions).
  * Nghiên cứu tích hợp kiểm thử hộp đen tự động sinh kịch bản (fuzzing API).
