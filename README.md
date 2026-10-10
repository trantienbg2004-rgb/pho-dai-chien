# PHỞ ĐẠI CHIẾN – Game 2 quán phở online

## Mô tả
Trò chơi mô phỏng quản trị chuỗi giá trị cho sinh viên, có hai phe A/B. Sinh viên truy cập link chung, chọn đội, mỗi người bỏ một phiếu/vòng. Hai đội có cùng sự kiện nhưng quyết định riêng. Server kiểm phiếu, tự tính tiền và số bát bán, công bố đội thắng sau bốn vòng.

## Khởi chạy trên máy tính
Cài Node.js >=18 từ https://nodejs.org/
Mở Terminal tại thư mục này và chạy:

    npm install
    npm start

Sau đó truy cập `http://localhost:3000`, chọn `Tạo phòng mới`.

**Quan trọng:** `localhost` chỉ hoạt động trên máy host. Để tất cả sinh viên tham gia từ mạng khác, phải triển khai game lên một máy chủ Node.js có URL HTTPS công khai (ví dụ Render, Railway hoặc máy chủ nhà trường). Không thể cho người chơi ở nơi khác tham gia chỉ bằng link localhost.

## Triển khai Render (gợi ý)
1. Đưa toàn bộ thư mục dự án lên một repo GitHub riêng.
2. Tạo **Web Service** trên Render và kết nối repo.
3. Chọn Node, Build Command: `npm install`, Start Command: `npm start`.
4. Dùng URL HTTPS mà Render cấp để tạo phòng và gửi sinh viên, đồng thời trình chiếu giao diện host trên ClassIn.
5. Máy chủ phải hoạt động liên tục trong khi chơi. Một số dịch vụ miễn phí có thể ngủ khi ít truy cập; hãy mở trang trước khi lên lớp.

## Điều hành
- Chủ phòng tạo mã 6 ký tự; gửi link tham gia ở đầu màn hình lên chat ClassIn.
- Mỗi thành viên chọn A hoặc B. Không cần bật mic.
- Bấm mở vòng, sinh viên có 35 giây bỏ phiếu. Chủ phòng có thể kết thúc sớm.
- Phương án nhiều phiếu nhất của MỖI đội sẽ được áp dụng. Hòa phiếu: chọn phương án có số thứ tự nhỏ nhất. Nếu cả đội không bỏ phiếu: phương án 2 mặc định.
- Sau 4 vòng, game công bố đội có tổng lợi nhuận lớn hơn.
- Nếu trình duyệt host tải lại, cùng tab có thể kết nối lại nhờ sessionStorage.

## Giới hạn / chống gian lận
Mỗi định danh thiết bị/trình duyệt có một phiếu trong mỗi vòng; hệ thống không xác thực tài khoản nhà trường. Người cố ý dùng cửa sổ ẩn danh hoặc thiết bị khác có thể tạo thêm phiếu. Người điều hành nên yêu cầu đặt tên thật và quan sát tổng số thành viên.

## Mô hình tài chính (giả định để giảng dạy)
- Khởi điểm: 3.000 khách/tháng, giá 50.000đ/bát, chi phí biến đổi 25.000đ/bát, chi phí cố định 30 triệu/tháng, hài lòng 75%.
- Mỗi vòng = một tháng. Tình huống làm thay đổi cầu, năng lực phục vụ, giá bán, giá vốn, mức hài lòng, thu/chi phát sinh.
- Doanh thu = giá bán × số bát bán. Chi phí biến đổi = giá vốn × số bát bán.
- Lợi nhuận = doanh thu − chi phí biến đổi − chi phí cố định + thu/chi phát sinh của tình huống.
- Các hệ số và số lượng là **giả định để chơi**, không phải số liệu thực địa và không suy ra trực tiếp từ giáo trình.

## Gắn với kiến thức bài thuyết trình
- Vòng 1: logistics đầu vào / tồn kho.
- Vòng 2: procurement / quan hệ nhà cung cấp / giá.
- Vòng 3: marketing / dịch vụ khách hàng.
- Vòng 4: operations / HR / công nghệ quy trình.
- Kết luận: Porter – cạnh tranh bằng chi phí và/hoặc khác biệt hóa, tránh giảm chất lượng mù quáng.
