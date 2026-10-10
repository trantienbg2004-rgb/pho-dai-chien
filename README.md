# PHỞ ĐẠI CHIẾN V7.2 — TRỌN BỘ (THAY HOÀN TOÀN MÃ CŨ)

Mô phỏng kinh doanh hai quán phở A/B dựa trên bài thuyết trình về quản trị chi phí chuỗi giá trị (Michael Porter). Mỗi phe có tình huống và phương án riêng. Người chơi bình chọn trên điện thoại/máy tính; Admin công bố biến cố và lợi nhuận trên màn hình ClassIn.

## Thư mục gồm ĐỦ mọi file cần thiết

```text
pho-dai-chien/
├── server.js                 # Socket.IO, quản lý phòng và hết giờ tự chốt
├── game-engine.js            # Quy tắc bỏ phiếu, tài chính, tích lũy, tính kết quả
├── game-data.js              # 8 bài toán (4 vòng x 2 phe), 72 biến cố
├── package.json              # Cài đặt Node.js trên Render
├── README.md                 # Hướng dẫn này
├── HUONG_DAN_CAP_NHAT.txt    # Hướng dẫn ngắn gọn
├── public/
│   ├── admin.html            # Admin PC / điện thoại
│   ├── index.html            # Sinh viên /play
│   ├── theme.css             # Giao diện responsive
│   └── shared.js             # Hiển thị kết quả, số liệu
└── tests/
    └── smoke.js             # Kiểm thử mô phỏng máy chủ và toàn bộ 4 vòng
```

## ĐƯA LÊN GITHUB / RENDER — SAU KHI XÓA FILE CŨ

1. Giải nén ZIP này. Bạn sẽ thấy một **thư mục** chứa các tệp phía trên.
2. Vào kho GitHub `trantienbg2004-rgb/pho-dai-chien` của bạn.
3. Xóa các file cũ trong thư mục gốc, đồng thời xóa các file cũ bên trong `public/`. Đặc biệt xóa những file HTML bị đặt nhầm ở thư mục gốc như `index.html`, `admin.html`, `admin.html.html` nếu có. **KHÔNG xóa kho GitHub hoặc dịch vụ Render.**
4. Trở lại **thư mục gốc** của kho trên GitHub. Chọn **Add file > Upload files**.
5. Mở thư mục V7.2 vừa giải nén trong Windows. Nhấn Ctrl + A để chọn **tất cả nội dung bên trong** (không kéo thư mục bọc ngoài), sau đó kéo thả vào vùng Upload của GitHub. Kéo kèm cả các thư mục `public` và `tests`.
6. **Kiểm tra trên GitHub trước khi Commit:** ở thư mục gốc có `server.js`, `game-engine.js`, `game-data.js`, `package.json`, `public`. Bên trong `public` có đúng `admin.html`, `index.html`, `theme.css`, `shared.js`. Không có file `admin.html.html`.
7. Nhấn **Commit changes**.
8. Render của bạn sẽ tự Deploy commit mới. Nếu chưa: Render > `pho-dai-chien` > **Manual Deploy > Deploy latest commit**. Đợi đến khi **Live**.
9. Vào `https://pho-dai-chien.onrender.com/health`. Trang phải hiển thị `"version":"7.2.0"`. Sau đó mở một cửa sổ Admin mới, **tạo phòng mới**. Không dùng mã phòng cũ.

## Đường dẫn

- Admin: https://pho-dai-chien.onrender.com/admin
- Sinh viên: https://pho-dai-chien.onrender.com/play
- Kiểm tra máy chủ: https://pho-dai-chien.onrender.com/health

## Hướng dẫn sử dụng

1. Admin chọn **TẠO PHÒNG MỚI**, sau đó sao chép link cho sinh viên.
2. Sinh viên truy cập bằng điện thoại hoặc máy tính, nhập tên và chọn phe A hoặc B. Mỗi trình duyệt/thiết bị được ghi một phiếu trong mỗi vòng (không phải xác minh danh tính chính thức).
3. Admin chọn thời gian và nhấn **BẮT ĐẦU VÒNG**.
4. Mỗi đội nhận tình huống **khác nhau**, mọi người chọn một phương án và nhấn **GỬI PHIẾU**.
5. Admin có thể **CHỐT PHIẾU & CÔNG BỐ KẾT QUẢ NGAY** trước giờ. Nếu không bấm, **máy chủ tự chốt khi hết giờ**, cả khi không ai bỏ phiếu.
6. Game công bố lựa chọn nhiều phiếu nhất, biến cố bất ngờ tương ứng, tác động tới số khách, uy tín, hài lòng, công suất, doanh thu, chi phí và lợi nhuận. Sau 4 vòng công bố phe có lãi tích lũy cao hơn.

**Nếu không có phiếu trong một đội:** hệ thống chọn phương án số 2 làm mặc định và ghi rõ trong kết quả. **Nếu đồng phiếu:** bốc thăm giữa các lựa chọn nhiều phiếu nhất và công bố rõ. Quyết định có thể gặp biến cố thuận lợi/bất lợi.

## Liên hệ kiến thức

- Vòng 1: logistics đầu vào, tồn kho, bảo quản, nhập đúng lúc (JIT).
- Vòng 2: mua sắm, hợp tác nhà cung cấp, vận hành, định lượng 80g thịt/bát.
- Vòng 3: marketing/bán hàng, logistics đầu ra, dịch vụ khách hàng.
- Vòng 4: công nghệ, nhân lực, năng suất, chiến lược dẫn đầu chi phí / khác biệt hóa.
- Suốt 4 vòng: kiểm soát chi phí, doanh thu, phản ứng khách hàng, uy tín và giá trị tạo ra.

Mọi số liệu và xác suất là **giả định nhằm phục vụ bài học**, không phải dự báo kinh doanh thực tế.

## Tự kiểm tra (nếu có Node.js)

```bash
npm install
npm test
npm start
```

Sau đó truy cập `http://localhost:3000/admin` và `http://localhost:3000/play`.

## Lưu ý quan trọng về Render Free

Render Free có thể ngủ khi không có truy cập; phòng và trạng thái được giữ trong RAM nên sẽ mất nếu máy chủ ngủ/khởi động lại/triển khai bản mới. Hãy mở game trước giờ học, cho cả lớp vào và tránh deploy giữa trận. Nếu mất phòng, tạo mã phòng mới. Đây là giới hạn của lưu trữ RAM chứ không phải lỗi nút chốt phiếu.

## Thay đổi V7.2 — Giao diện công bố & cơ chế cạnh tranh

- Trên màn hình **Admin sau khi chốt**, phần công bố ưu tiên: Quyết định → Biến cố → Lãi/lỗ vòng → Số bát thực tế → Hài lòng/Uy tín. Hai quán vẫn nằm ngang trên PC.
- Các công thức chi tiết được **ẩn trong mục “Xem chi tiết cách tính & tác động dài hạn”**, chỉ mở khi muốn giải thích sâu cho giảng viên.
- Phân biệt **khách muốn mua (nhu cầu)** và **bát đã bán (không vượt công suất bếp)**; việc chênh hai số chứng tỏ bị quá tải, không phải công thức mất khách vô cớ.
- Mức giá, hài lòng và uy tín được đưa vào nhu cầu khách; hai quán có hiệu ứng **cạnh tranh tương đối**. Trong các điều kiện còn lại như nhau, hạ giá hoặc cải thiện hài lòng sẽ tăng nhu cầu, nhưng chưa chắc bán thêm nếu công suất đã tối đa.
- **Lợi nhuận** = Số bát bán × (Giá bán − Chi phí biến đổi/bát) − Chi phí cố định + Các khoản thu/chi phát sinh. Bán nhiều không bảo đảm lãi nhiều.
- Toàn bộ con số là giả định dạy học. Các hiệu ứng cạnh tranh, hệ số phản ứng nhu cầu, xác suất không phải số liệu điều tra thị trường thật.

**Lưu ý:** Nếu kho GitHub vẫn có `index.html`, `admin.html` hoặc file `.html.html` ở ngoài `public/`, hãy dọn sạch trước khi tải bộ này. Tải **nội dung bên trong** thư mục lên thư mục gốc của kho; Render tự cập nhật. Thử phòng mới sau mỗi lần triển khai.
