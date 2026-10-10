PHỞ ĐẠI CHIẾN V6.3 – SỬA LỖI CHỐT PHIẾU VÀ HẾT GIỜ
===================================================

BẢN ĐẦY ĐỦ: Không cần copy/paste mã nguồn.

CẤU TRÚC TỆP ĐÚNG TRÊN GITHUB
pho-dai-chien/
  server.js
  package.json
  README.md
  public/
    admin.html
    index.html

CẬP NHẬT TRÊN GITHUB
1. Giải nén file ZIP.
2. Mở https://github.com/trantienbg2004-rgb/pho-dai-chien
3. Ở thư mục gốc, dùng Add file > Upload files tải đè server.js, package.json, README.md. Bấm Commit changes.
4. Bấm VÀO thư mục public trên GitHub rồi dùng Add file > Upload files tải đè CẢ HAI file admin.html và index.html. Bấm Commit changes.
5. Kiểm tra đường dẫn CHÍNH XÁC: public/admin.html và public/index.html, KHÔNG phải admin.html ở ngoài, KHÔNG phải admin.html.html.
6. Vào Render > pho-dai-chien > Manual Deploy > Deploy latest commit nếu chưa tự triển khai. Chờ trạng thái Live.
7. Vào https://pho-dai-chien.onrender.com/health phải hiện {"ok":true,"version":"6.3","status":"ready"}.
8. Mở https://pho-dai-chien.onrender.com/admin?release=6.3; nhấn Ctrl+Shift+R và tạo PHÒNG MỚI.
9. Người chơi vào https://pho-dai-chien.onrender.com/play?release=6.3 rồi nhập mã phòng mới.

CÁCH THỬ
- Mở một vòng (đồng hồ 35 giây); bấm Chốt phiếu ngay khi còn thời gian => tự hiện màn hình kết quả A/B.
- Bắt đầu vòng khác, không bấm gì; sau 35 giây => máy chủ tự chốt và hiện kết quả A/B.
- Nếu chưa có ai bỏ phiếu, máy chủ chọn phương án số 2 mặc định để game không bị mắc kẹt.

ĐÃ KHẮC PHỤC
- Gốc lỗi: dữ liệu biến cố dùng up/mid/down nhưng mã cũ đọc theo 0/1/2; gây lỗi tính toán ngay khi chốt hoặc hết giờ.
- Đọc đúng dữ liệu, kiểm tra cấu hình các biến cố.
- Chỉ ghi kết quả sau khi tính thành công CẢ HAI quán, tránh cộng tiền lặp khi lỗi.
- Giao diện Admin 2 cột trên PC, người chơi phù hợp điện thoại, giải thích tác động tài chính được giữ.
- Cảnh báo nếu trang V6.3 đang kết nối với máy chủ V6.2.

TRẠNG THÁI KIỂM THỬ
- Đã kiểm thử mô phỏng máy chủ: 72 biến cố, 108 tổ hợp hành động/biến cố, 4 vòng, chốt sớm, chốt tự động, không phiếu và kết thúc.
- Đã kiểm thử dựng giao diện Admin trên Chromium PC và giao diện người chơi trên Chromium mobile với dữ liệu kết quả mẫu.
- Chưa kiểm thử trực tiếp phiên bản triển khai trên dịch vụ Render của bạn; cần xác nhận URL /health sau khi cập nhật.

LƯU Ý
Phòng chơi lưu trong bộ nhớ máy chủ; tạo phòng mới sau mỗi lần deploy hoặc khi Render khởi động lại.
