# PHỞ ĐẠI CHIẾN V6

## Điểm mới
- Responsive: máy tính, máy tính bảng, điện thoại; nút lớn, thông tin kết quả tự xuống dòng.
- Trang điều hành: `/admin`; trang sinh viên: `/play`.
- Sau mỗi quyết định, cả hai giao diện giải thích sáu bước: quyết định; biến cố có liên quan; tác động riêng biến cố; chỉ số trước/sau; công thức lãi/lỗ; ảnh hưởng sang vòng sau và kiến thức Porter.
- 8 tình huống chia theo hai quán trong 4 vòng, 3 phương án mỗi tình huống, nhiều kết cục có xác suất.

## Cập nhật Render
Thay `server.js`, `public/admin.html`, `public/index.html` trong repository GitHub cũ bằng bản V6; `package.json` giữ nguyên hoặc cập nhật từ ZIP; commit và chờ Render Live. Tạo phòng **mới** sau khi triển khai.

## Lưu ý
Các xác suất, tác động uy tín, mức hài lòng, nhu cầu và dữ liệu tài chính là giả định phục vụ giảng dạy. Mỗi vòng đại diện một tháng. Các biến cố có thể khiến phương án rủi ro thắng lớn hoặc thua nặng. Không được coi mô phỏng là dự báo kinh doanh thực tế.


## Bản vá giao diện Admin PC
- Trên màn hình rộng từ 900px: hai quán A/B cạnh nhau, tận dụng toàn bộ chiều rộng cửa sổ; áp dụng tương tự cho câu hỏi và kết quả.
- Giao diện người chơi giữ nguyên như V6.
- Có dự phòng khi trường `reputation` chưa có từ một trạng thái cũ, tránh `undefined%` ở bảng Admin; tạo phòng mới sau deploy để dùng dữ liệu đầy đủ.
