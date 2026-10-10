const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const crypto=require('crypto');
const path=require('path');
const app=express(); const server=http.createServer(app);const io=new Server(server);
app.get('/',(req,res)=>res.redirect('/play'));
app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.get('/play',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use(express.static(path.join(__dirname,'public')));
const PORT=process.env.PORT||3000;
// Mỗi vòng mỗi đội gặp bài toán khác nhau dựa trên chuỗi giá trị quán phở.
// cash = khoản thu/chi một lần; demand = thay đổi lượng khách tiềm năng;
// unitCost = thay đổi chi phí biến đổi trên một bát; capacity = năng lực phục vụ.
const rounds=[
 {title:'Nguyên liệu & bảo quản',story:'Hai quán đang gặp hai vấn đề khác nhau ở khâu logistics đầu vào.',teams:{
 A:{title:'Quán A: 11 giờ đã hết bánh phở',story:'Quán bán 3.000 bát/tháng. Hôm nay lượng khách tăng, bánh phở dự kiến hết trước giờ trưa. Nhập gấp có giá cao, nhập quá nhiều dễ hỏng.',question:'Bạn xử lý việc thiếu bánh phở như thế nào?',options:[
  {text:'Đặt thêm theo lượng bán thực tế từng ca, chấp nhận phí giao nhanh',cash:-500000,demand:250,capacity:250,satisfaction:6,lesson:'Logistics đầu vào: dự báo nhu cầu, nhập đúng lúc; giảm nguy cơ mất khách.'},
  {text:'Đặt gấp lượng lớn để được giảm đơn giá, dự trữ cho ngày mai',cash:-800000,demand:230,capacity:350,satisfaction:2,lesson:'Có hàng phục vụ, nhưng bánh phở tươi có nguy cơ hư hỏng và phát sinh phí lưu kho.'},
  {text:'Liên hệ quán bánh phở lân cận để chia sẻ hàng trong ca, thanh toán giá cao hơn',cash:0,demand:-120,capacity:-150,satisfaction:-6,lesson:'Không chi thêm tiền mua hàng nhưng bỏ lỡ doanh thu và làm khách chờ thất vọng.'}]},
 B:{title:'Quán B: Thịt bò tồn kho sắp giảm chất lượng',story:'Dự báo bán 3.000 bát/tháng nhưng đơn giao hàng giảm. Kho còn nhiều thịt bò, nếu giữ quá lâu sẽ hao hụt.',question:'Bạn xử lý tồn kho thịt bò ra sao?',options:[
  {text:'Kiểm tra chất lượng, điều chỉnh đơn nhập mới và làm combo bán trong ngày',cash:-450000,demand:190,unitCost:-300,satisfaction:6,lesson:'Kiểm soát tồn kho theo chất lượng, đồng thời thúc đẩy tiêu thụ phần nguyên liệu còn an toàn.'},
  {text:'Giữ thịt trong điều kiện bảo quản đạt chuẩn và tạm hoãn nhập mới',cash:-650000,demand:90,satisfaction:4,lesson:'Giảm hao hụt nhờ bảo quản, nhưng vẫn tốn chi phí và phải giám sát thời hạn sử dụng.'},
  {text:'Tổ chức combo giới hạn trong ngày, công khai ngày nhập và giữ chất lượng',cash:-900000,demand:240,satisfaction:3,lesson:'Kích cầu hợp lý nhưng làm giảm phần lãi trên mỗi bát; không thể thay thế kiểm soát chất lượng.'}]}
 }},
 {title:'Nhà cung cấp & vận hành',story:'Giá nguyên liệu tăng trong khi khách yêu cầu ổn định chất lượng.',teams:{
 A:{title:'Quán A: Nhà cung cấp thịt bò tăng giá 15%',story:'Quán A phụ thuộc một nhà cung cấp. Chi phí thịt bò đang tăng, nhưng đổi sang nguồn rẻ chưa chắc ổn định.',question:'Bạn chọn hướng xử lý nào?',options:[
  {text:'Đàm phán hợp đồng cung ứng ổn định, cam kết sản lượng và kiểm tra chất lượng',cash:-400000,unitCost:-800,demand:120,satisfaction:5,lesson:'Mua sắm và quan hệ nhà cung cấp: tối ưu giá trên cơ sở chất lượng và nguồn hàng ổn định.'},
  {text:'Mua chung với quán khác để được mức giá sỉ, tăng kiểm tra đầu vào',cash:-700000,unitCost:-600,demand:100,satisfaction:3,lesson:'Tận dụng quy mô mua hàng, đổi lại là chi phí phối hợp và kiểm soát giao nhận.'},
  {text:'Điều chỉnh giá bán thêm 3.000đ, thông báo minh bạch cho khách',price:3000,cash:-150000,demand:-140,satisfaction:-2,lesson:'Bảo vệ biên lợi nhuận nhưng cần cân nhắc phản ứng của khách về giá trị nhận được.'}]},
 B:{title:'Quán B: Đầu bếp chia thịt không đều',story:'Mỗi bát dự kiến dùng 80g thịt. Một số ca bếp cho quá tay, ca khác lại ít hơn khiến khách phàn nàn và giá vốn biến động.',question:'Quán B nên làm gì trước?',options:[
  {text:'Chuẩn hóa định lượng, cân mẫu và đào tạo nhân viên theo ca',cash:-650000,unitCost:-1100,demand:160,satisfaction:7,lesson:'Hoạt động sản xuất: giảm hao hụt nhưng vẫn duy trì khẩu phần nhất quán.'},
  {text:'Đầu tư máy chia khẩu phần, kết hợp kiểm tra chất lượng đầu ra',cash:-1800000,unitCost:-1400,capacity:200,demand:180,satisfaction:6,lesson:'Ứng dụng công nghệ tăng năng suất, nhưng cần thời gian thu hồi chi phí đầu tư.'},
  {text:'Áp dụng kiểm tra chéo định lượng mỗi ca và thưởng nhân viên ít hao hụt',cash:-900000,unitCost:-350,demand:80,satisfaction:4,lesson:'Tăng kiểm soát trong hoạt động, song không xử lý triệt để gốc rễ của sai lệch định lượng.'}]}
 }},
 {title:'Marketing & chăm sóc khách hàng',story:'Cơ hội quảng bá và phản hồi khách hàng đòi hỏi các quán cân nhắc chi phí với giá trị.',teams:{
 A:{title:'Quán A: Reviewer đề nghị làm video giới thiệu',story:'Một KOL ẩm thực báo giá 2 triệu đồng. Quán có thể tăng khách nhưng độ tin cậy của người quảng bá chưa được kiểm chứng.',question:'Bạn chi ngân sách marketing như thế nào?',options:[
  {text:'Kiểm tra uy tín KOL, thỏa thuận nội dung minh bạch và giới hạn ngân sách',cash:-1550000,demand:240,satisfaction:4,lesson:'Marketing có kiểm soát rủi ro đối tác và đo hiệu quả chuyển đổi khách hàng.',kol:true},
  {text:'Ký ngay với KOL đang lên xu hướng, tận dụng thời điểm để kéo khách',cash:-2000000,demand:380,satisfaction:1,lesson:'Có cơ hội tăng nhận diện nhanh, nhưng rủi ro hình ảnh và chi phí cao.',kol:true,risky:true},
  {text:'Chạy chương trình khách thật đánh giá và check-in nhận quẩy',cash:-850000,demand:170,satisfaction:8,lesson:'Khuyến khích truyền miệng và chăm sóc khách hàng, tăng khách quay lại với chi phí vừa phải.'}]},
 B:{title:'Quán B: Khách đánh giá 1 sao vì phở nguội',story:'Một đơn giao hàng mất 40 phút khiến nước phở nguội. Khách đăng bài phản ánh. Quán lo chi phí bồi hoàn nhưng cũng sợ mất uy tín.',question:'Bạn xử lý phản hồi thế nào?',options:[
  {text:'Xin lỗi, xác minh và hoàn/đổi đơn hợp lý; cải thiện đóng gói giữ nhiệt',cash:-1050000,demand:200,satisfaction:10,lesson:'Dịch vụ khách hàng và logistics đầu ra: xử lý nguyên nhân lẫn hậu quả, bảo vệ lòng tin.'},
  {text:'Tặng voucher cho khách và rà soát thời gian giao hàng cùng shipper',cash:-750000,demand:110,satisfaction:6,lesson:'Hỗ trợ sau bán giúp giảm bất mãn nhưng cần cải tiến đóng gói, tránh lặp lỗi.'},
  {text:'Đề xuất hoàn phí ship và thay đối tác giao hàng trong giờ cao điểm',cash:-200000,demand:-110,satisfaction:-5,lesson:'Có thể tiết kiệm chi phí bồi thường trước mắt nhưng trách nhiệm trải nghiệm khách hàng chưa được giải quyết.'}]}
 }},
 {title:'Năng suất & chiến lược định giá',story:'Vòng cuối quyết định ai tạo được lợi thế cạnh tranh bền vững.',teams:{
 A:{title:'Quán A: Bếp quá tải giờ cao điểm',story:'Khách phải chờ 25 phút. Chủ quán có ngân sách hạn chế và đang mất một số đơn hàng.',question:'Bạn chọn giải pháp tăng năng lực phục vụ nào?',options:[
  {text:'Chuẩn hóa thao tác sơ chế, bố trí lại quy trình và phân ca hợp lý',cash:-700000,unitCost:-950,capacity:300,demand:200,satisfaction:8,lesson:'Vận hành và nhân lực: giảm thời gian chờ, giảm hao hụt mà không hy sinh chất lượng.'},
  {text:'Thuê thêm hai phụ bếp giờ cao điểm và huấn luyện ngắn',cash:-1500000,capacity:400,demand:240,satisfaction:6,lesson:'Tăng công suất nhanh nhưng chi phí lao động tăng; phù hợp khi nhu cầu thực sự cao.'},
  {text:'Giảm bớt món và dùng thực đơn giới hạn trong khung giờ đông',cash:-300000,capacity:200,demand:80,satisfaction:2,lesson:'Giảm phức tạp vận hành và tăng tốc phục vụ, song có thể giảm lựa chọn cho khách.'}]},
 B:{title:'Quán B: Có nên bán phở 65.000đ?',story:'Quán đang bán 50.000đ/bát. Một nhóm khách sẵn sàng trả thêm để có nước dùng ngon hơn và phục vụ tốt hơn; nhóm còn lại rất nhạy cảm giá.',question:'Bạn chọn chiến lược cạnh tranh nào?',options:[
  {text:'Giữ phở tiêu chuẩn 50.000đ, mở thêm phiên bản đặc biệt 65.000đ',cash:-1000000,demand:190,satisfaction:8,lesson:'Phân biệt giá trị: đáp ứng nhiều nhóm khách nhưng tăng yêu cầu quản lý menu.'},
  {text:'Tập trung tối ưu nguyên liệu và quy trình để bán 45.000đ',price:-5000,unitCost:-2000,cash:-650000,demand:320,satisfaction:4,lesson:'Dẫn đầu chi phí: có thể hút khách nhạy giá, nhưng biên lợi nhuận cần được tính kỹ.'},
  {text:'Chuyển toàn bộ lên 65.000đ và đầu tư không gian, dịch vụ',price:15000,cash:-2400000,demand:-300,satisfaction:9,lesson:'Khác biệt hóa: giá bán cao hơn đi kèm tăng giá trị, nhưng có nguy cơ mất khách bình dân.'}]}
 }}
];
const rooms=new Map();
// Rủi ro thị trường: các biến cố được rút sau khi đội bỏ phiếu; tỷ lệ giả lập.
// Biến cố sau quyết định: theo phương án của từng đội, minh bạch tác động thực tế.
// Cùng một quyết định có thể gặp biến cố tốt, trung tính hoặc xấu.
// Rủi ro ảnh hưởng đến biên độ kết quả, không biến một lựa chọn thành "đáp án sai".
// V5: biến cố gắn trực tiếp với quyết định và khâu chuỗi giá trị.
// Đơn vị tác động: demand = bát tiềm năng/tháng; reputation = điểm uy tín (0-100);
// satisfaction = điểm hài lòng; unitCost = đồng/bát; cash = khoản thu/chi một lần.
// Xác suất và tác động là giả định minh họa phục vụ học tập, không phải dữ liệu thực.
const eventBank={
 '0-A':[
  {up:['Đơn hàng bổ sung giao kịp giờ trưa','Nhà làm bánh giao kịp, quán phục vụ hết lượt khách tăng cao.',180,3,5,-250000],mid:['Bánh phở về trễ 20 phút','Một số khách phải chờ nhưng quán vẫn xoay xở phục vụ được.',-65,-1,-2,-180000],down:['Lô bánh nhập gấp không đạt yêu cầu','Khâu kiểm tra đầu vào phát hiện bánh có dấu hiệu hư hỏng nên quán loại bỏ toàn bộ. Khách chờ lâu, một số khách phản ánh; tuyệt đối không sử dụng nguyên liệu không an toàn.',-410,-12,-15,-2600000]},
  {up:['Nhập số lượng lớn đúng dịp cao điểm','Khách đến đông; lượng bánh dự trữ được sử dụng hết, chi phí trên mỗi bát giảm.',260,2,3,550000],mid:['Tồn kho tăng sau ngày đầu','Bánh phở còn dư, quán phải tăng bảo quản và theo dõi chất lượng.',-85,-2,-3,-650000],down:['Một phần bánh phở bị chua sau bảo quản','Quán hủy nguyên liệu không còn bảo đảm chất lượng, phát sinh phí xử lý và thiếu bánh cho ca sau.',-280,-7,-8,-1550000]},
  {up:['Quán đối tác hỗ trợ ngay trong giờ cao điểm','Hai bên phối hợp trơn tru, khách vẫn được phục vụ kịp thời.',155,3,4,320000],mid:['Chi phí lấy hàng cao hơn dự kiến','Bánh được cung cấp đúng chất lượng nhưng phí vận chuyển và mua gấp tăng.',0,0,0,-420000],down:['Nguồn bánh chia sẻ không đủ số lượng','Quán đối tác cũng đông khách nên chỉ giao được nửa đơn, quán bỏ lỡ nhiều lượt khách.',-250,-4,-6,-650000]}
 ],
 '0-B':[
  {up:['Combo tiêu thụ tốt và thịt được kiểm định đạt chuẩn','Quán kiểm tra nguyên liệu, bán hết phần an toàn và giảm thất thoát.',190,3,5,350000],mid:['Bán combo chậm hơn dự đoán','Nguyên liệu được kiểm tra nhưng tồn kho vẫn cao, cần thêm chi phí bảo quản.',-60,-1,-1,-420000],down:['Kiểm tra phát hiện lô thịt không đạt chuẩn','Quán chủ động ngừng sử dụng và tiêu hủy lô hàng; tránh nguy cơ mất an toàn nhưng chịu chi phí lớn.',-120,1,-1,-2450000]},
  {up:['Hệ thống lạnh ổn định và lượng khách hồi phục','Lượng thịt bảo quản đúng chuẩn được sử dụng trước hạn, giảm hao hụt.',125,2,3,220000],mid:['Chi phí điện và giám sát tăng','Bảo quản đạt chuẩn nhưng chi phí kho lạnh cao hơn kế hoạch.',-35,0,0,-430000],down:['Tủ lạnh trục trặc qua đêm','Nhiệt độ bảo quản không đạt; quán ngừng sử dụng và hủy lô thịt có nguy cơ mất an toàn.',-145,-5,-7,-1950000]},
  {up:['Combo minh bạch được khách đón nhận','Khách thích chương trình giới hạn với thịt được kiểm tra chất lượng.',240,5,5,170000],mid:['Chương trình hút khách nhưng giảm biên lợi nhuận','Quán bán nhiều combo song mức giảm giá khiến lãi không tăng tương ứng.',55,1,1,-360000],down:['Giảm giá không đủ để giải quyết tồn kho','Lượng khách mới ít, quán vẫn phải loại bỏ phần nguyên liệu không còn an toàn.',-135,-2,-3,-1200000]}
 ],
 '1-A':[
  {up:['Nhà cung cấp chấp nhận hợp đồng giá ổn định','Nguồn thịt đạt chuẩn, giao đúng giờ và giảm biến động giá vốn.',170,4,4,580000],mid:['Đàm phán kéo dài thêm một tuần','Quán giữ nguồn hàng ổn định nhưng chưa có mức giá mới ngay.',-30,0,0,-250000],down:['Đối tác giao thiếu dù đã ký thỏa thuận','Quán phải mua bổ sung từ nguồn được kiểm định với giá cao để tránh mất khách.',-140,-3,-4,-850000]},
  {up:['Liên kết mua chung đạt mức chiết khấu cao','Kiểm tra đầu vào đồng bộ giúp tiết kiệm tiền mua nguyên liệu.',210,3,4,680000],mid:['Phối hợp mua chung có chi phí vận chuyển','Mức giá sỉ tốt nhưng chi phí gom đơn, chia hàng cao hơn dự kiến.',-15,0,0,-250000],down:['Xe gom hàng giao trễ và thiếu lô','Hai quán phải dùng nguồn thay thế, tăng chi phí và chậm phục vụ.',-180,-3,-5,-1050000]},
  {up:['Khách chấp nhận giá mới nhờ chất lượng ổn định','Giá bán tăng nhưng lượng khách giảm ít hơn dự tính.',125,4,4,450000],mid:['Khách so sánh giá với quán bên cạnh','Một nhóm khách chuyển quán, biên lợi nhuận cải thiện vừa phải.',-115,-2,-3,-200000],down:['Đối thủ giữ giá và tung ưu đãi','Khách nhạy cảm giá rời đi nhiều, số bát bán ra giảm mạnh.',-340,-6,-8,-480000]}
 ],
 '1-B':[
  {up:['Định lượng 80g được tuân thủ ổn định','Nhân viên làm đều tay, ít hao hụt và khách hài lòng.',190,5,5,420000],mid:['Một số ca vẫn cân sai khẩu phần','Quán cần thêm thời gian huấn luyện và giám sát.',-35,-1,-1,-160000],down:['Giờ cao điểm nhân viên bỏ qua cân mẫu','Định lượng lại chênh lệch khiến khách phàn nàn, hao hụt tăng.',-170,-5,-6,-820000]},
  {up:['Máy chia khẩu phần hoạt động chính xác','Tốc độ ra món tăng, sai lệch giảm; đầu tư bắt đầu phát huy hiệu quả.',245,5,5,730000],mid:['Máy cần hiệu chỉnh trong tuần đầu','Quán phải bảo trì, thời gian hoàn vốn dài hơn dự kiến.',-40,-1,-2,-650000],down:['Máy hỏng đúng giờ cao điểm','Quán quay lại thao tác thủ công, chi phí sửa chữa phát sinh.',-260,-5,-5,-1550000]},
  {up:['Kiểm tra chéo phát hiện sai lệch kịp thời','Nhân viên hợp tác, mức hao hụt giảm rõ rệt.',150,3,4,390000],mid:['Thưởng giảm hao hụt làm tăng chi phí','Chi phí thưởng bù trừ phần tiết kiệm nguyên liệu.',-15,0,0,-210000],down:['Nhân viên hiểu sai mục tiêu thưởng','Một số ca tự giảm khẩu phần, khách phàn nàn và quán phải chấn chỉnh.',-225,-8,-10,-670000]}
 ],
 '2-A':[
  {up:['KOL đã thẩm định đăng video được đón nhận','Khách mục tiêu ở gần quán đến đông; quảng bá có hiệu quả thực tế.',330,5,5,350000],mid:['KOL đổi lịch quay trong phút cuối','Quán phải sắp lịch lại, chiến dịch đến muộn hơn dự kiến.',-55,-1,-1,-200000],down:['Dù đã rà soát, KOL vướng tranh cãi bất ngờ','Quán dừng nội dung liên quan, giải thích minh bạch, nhưng lượng khách mới giảm.',-285,-7,-10,-850000]},
  {up:['KOL đang nổi bất ngờ được công chúng yêu thích','Video lan truyền, khách kéo đến đông và quán thu lợi vượt mong đợi.',630,7,8,2000000],mid:['Video triệu lượt xem nhưng không đúng tệp khách','Lượt xem cao song khách ở xa, tiền quảng bá chuyển đổi thành đơn thấp.',-85,-1,-1,-650000],down:['KOL chưa thẩm định vướng bê bối','Quán bị liên đới trong tranh cãi; khách mới giảm, uy tín bị ảnh hưởng nhiều vòng.',-520,-13,-18,-2500000]},
  {up:['Chương trình check-in tạo hiệu ứng truyền miệng','Khách thật giới thiệu bạn bè và quay lại vào các tuần sau.',290,5,7,420000],mid:['Chủ yếu khách cũ nhận quẩy miễn phí','Khách hài lòng nhưng số khách mới tăng không nhiều.',-30,1,2,-280000],down:['Chi phí ưu đãi vượt ngân sách','Nhiều khách nhận quà một lần, ít quay lại, lãi giảm.',-140,-1,-2,-750000]}
 ],
 '2-B':[
  {up:['Khách sửa đánh giá sau khi được xử lý thỏa đáng','Quán đổi đơn và cải tiến hộp giữ nhiệt, khách tin tưởng trở lại.',265,7,9,380000],mid:['Bao bì mới hiệu quả nhưng chi phí cao','Phản hồi giảm, nhưng giá vốn đóng gói tăng ngắn hạn.',25,2,3,-320000],down:['Đối tác giao hàng tiếp tục giao trễ','Dù quán đã đổi hộp, nước dùng vẫn nguội và khách còn phàn nàn.',-150,-4,-6,-800000]},
  {up:['Voucher kéo khách quay lại','Khách ghi nhận thái độ cầu thị, đơn giao hàng phục hồi.',220,5,6,250000],mid:['Một số khách dùng voucher nhưng lỗi giao chưa dứt','Quán phải tiếp tục phối hợp đối tác vận chuyển.',-10,0,1,-210000],down:['Shipper tiếp tục giao chậm giờ cao điểm','Khách nhận voucher nhưng phàn nàn mới xuất hiện, uy tín giảm.',-220,-6,-8,-630000]},
  {up:['Đối tác mới giao nhanh vượt kỳ vọng','Thời gian giao hàng giảm, phở đến tay khách vẫn nóng.',255,6,7,310000],mid:['Chuyển đối tác phát sinh phí vận chuyển','Khách bớt phàn nàn nhưng phần lãi giao hàng chưa cải thiện.',15,1,2,-380000],down:['Đối tác mới quá tải trong ngày mưa','Nhiều đơn giao trễ, quán phải hoàn thêm phí và xử lý phản hồi.',-250,-7,-9,-930000]}
 ],
 '3-A':[
  {up:['Bố trí lại bếp giúp ra món nhanh hơn','Khách bớt chờ và quy trình giảm thất thoát nguyên liệu.',265,5,7,490000],mid:['Nhân viên cần thời gian làm quen quy trình mới','Một vài ca phục vụ chậm trước khi thao tác ổn định.',-25,0,0,-180000],down:['Thiếu phối hợp trong ca cao điểm','Sơ chế và ra món bị lệch nhịp khiến nhiều khách bỏ đi.',-215,-5,-6,-670000]},
  {up:['Hai phụ bếp mới xử lý giờ đông rất tốt','Công suất tăng, quán phục vụ thêm nhiều khách.',345,5,6,520000],mid:['Khách đến không nhiều như dự báo','Quán vẫn trả thêm tiền nhân công dù công suất không khai thác hết.',-60,-1,-1,-600000],down:['Nhân viên mới làm sai nhiều món','Quán mất chi phí nguyên liệu làm lại và khách chờ lâu hơn.',-240,-5,-7,-850000]},
  {up:['Menu rút gọn được khách ủng hộ','Ra món nhanh, giảm sai sót và tiết kiệm nguyên liệu.',190,4,5,350000],mid:['Khách quen tiếc một số món','Quán phục vụ nhanh hơn nhưng số đơn không tăng nhiều.',-45,-1,-2,-130000],down:['Nhiều khách muốn món đã bị cắt','Khách chuyển sang đối thủ có thực đơn đa dạng.',-270,-6,-8,-470000]}
 ],
 '3-B':[
  {up:['Phở đặc biệt được khách đặt thêm','Quán duy trì phở phổ thông và bán tốt phiên bản giá cao.',300,6,8,780000],mid:['Menu nhiều lựa chọn làm bếp chậm','Doanh thu tăng nhưng vận hành phức tạp hơn.',-45,-1,-2,-450000],down:['Bếp nhầm đơn thường và đặc biệt','Khách phàn nàn vì giá trị nhận được không đúng giá, phải đổi món.',-240,-7,-9,-920000]},
  {up:['Khách nhạy giá chuyển sang quán rất đông','Tối ưu quy trình giúp chi phí/bát đủ thấp để kinh doanh có lãi.',410,4,6,430000],mid:['Khách tăng nhưng biên lãi mỏng','Sản lượng tăng, song lợi nhuận tăng ít hơn kỳ vọng.',65,1,1,-180000],down:['Giảm giá khiến bếp vượt công suất','Không đủ năng lực phục vụ giờ cao điểm, khách bỏ đi.',-290,-6,-7,-650000]},
  {up:['Nhóm khách mới đánh giá cao trải nghiệm cao cấp','Khách sẵn sàng trả 65.000đ vì chất lượng và dịch vụ vượt trội.',370,7,9,1150000],mid:['Một phần khách cũ không theo mức giá mới','Giá bán cao hơn nhưng lượng khách bình dân giảm.',-160,-2,-3,-320000],down:['Khách cho rằng giá tăng không tương xứng','Khách để lại đánh giá tiêu cực, doanh thu giảm và uy tín suy yếu.',-430,-10,-12,-1100000]}
 ]
};
const chanceProfiles=[
 [[42,38,20],[35,40,25],[44,35,21]],
 [[42,36,22],[36,37,27],[40,39,21]],
 [[43,37,20],[36,30,34],[45,36,19]],
 [[44,34,22],[36,36,28],[37,39,24]]
];
function twistFor(round,team,choice){
 const variants=eventBank[`${round}-${team}`][choice];
 const weights=chanceProfiles[round][choice];let n=crypto.randomInt(100),idx=n<weights[0]?0:n<weights[0]+weights[1]?1:2;
 const v=variants[idx];return {kind:['up','mid','down'][idx],headline:v[0],description:v[1],demand:v[2],satisfaction:v[3],reputation:v[4],cash:v[5],chance:weights[idx]};
}
function newFin(){return {cash:0,customers:3000,price:50000,unitCost:25000,capacity:3100,satisfaction:75,reputation:75,history:[]}}
function makeCode(){let x;do{x=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(x));return x}
function safeName(n){return String(n||'Người chơi').trim().slice(0,22)||'Người chơi'}
function sanitize(r){return {code:r.code,status:r.status,round:r.round,totalRounds:rounds.length,scenario:r.status==='finished'?null:rounds[r.round]||null,teams:['A','B'].map(t=>({id:t,players:[...r.players.values()].filter(p=>p.team===t&&p.socketId).length,votes:[...r.votes.values()].filter(v=>v.team===t).length,finance:r.fin[t]})),last:r.last, timeLeft:r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):null,deadline:r.deadline}}
function broadcast(r){io.to(r.code).emit('state',sanitize(r))}
function roster(r){io.to(r.code).emit('roster',[...r.players.values()].map(p=>({name:p.name,team:p.team})))}
function resolve(r){if(r.status!=='voting')return;if(r.timer)clearTimeout(r.timer);const sc=rounds[r.round];r.status='results';r.deadline=null;let results={}; for(const team of ['A','B']){
 const teamScene=sc.teams[team];const tally=teamScene.options.map((_,i)=>[...r.votes.values()].filter(v=>v.team===team&&v.choice===i).length);
 let max=Math.max(...tally);let choice=tally.findIndex(n=>n===max);if(max===0)choice=1;
 const eff=teamScene.options[choice];const twist=twistFor(r.round,team,choice);const f=r.fin[team];
 const before={price:f.price,unitCost:f.unitCost,capacity:f.capacity,satisfaction:f.satisfaction,reputation:f.reputation,customers:f.customers,cash:f.cash};
 f.price+=eff.price||0;f.unitCost=Math.max(15000,f.unitCost+(eff.unitCost||0));f.satisfaction=Math.max(10,Math.min(100,f.satisfaction+(eff.satisfaction||0)+twist.satisfaction));f.reputation=Math.max(10,Math.min(100,f.reputation+twist.reputation));f.capacity=Math.max(2300,f.capacity+(eff.capacity||0));
 const after={price:f.price,unitCost:f.unitCost,capacity:f.capacity,satisfaction:f.satisfaction,reputation:f.reputation};
 const base=3000;const demandFromQuality=(f.satisfaction-75)*7+(f.reputation-75)*12;
 const demandFromPrice=-(f.price-50000)*0.018;
 const potential=Math.max(1700,Math.round(base+eff.demand+twist.demand+(f.satisfaction-75)*7+(f.reputation-75)*12-(f.price-50000)*0.018));const sold=Math.min(potential,f.capacity);
 const fixed=30000000;const monthly=(f.price-f.unitCost)*sold-fixed+eff.cash+twist.cash;
 f.cash+=monthly; f.customers=sold;const detail={team,choice,tally,sold,
 before,after,roundNumber:r.round+1,decisionEffects:{demand:eff.demand,cash:eff.cash,price:eff.price||0,unitCost:eff.unitCost||0,capacity:eff.capacity||0,satisfaction:eff.satisfaction||0},demandFromQuality,demandFromPrice,reasoning:{cause:`Quán chọn “${eff.text}”. ${twist.description}`,chain:`Quyết định tạo thay đổi ở khâu quản trị liên quan: ${eff.lesson} Biến cố ${twist.headline.toLowerCase()} làm khách tiềm năng ${twist.demand>=0?'tăng':'giảm'} ${Math.abs(twist.demand)} lượt, uy tín ${twist.reputation>=0?'tăng':'giảm'} ${Math.abs(twist.reputation)} điểm, hài lòng ${twist.satisfaction>=0?'tăng':'giảm'} ${Math.abs(twist.satisfaction)} điểm.`,future:`Sang vòng sau, uy tín ${f.reputation}/100, hài lòng ${f.satisfaction}/100, giá ${f.price.toLocaleString('vi-VN')}đ và chi phí mỗi bát ${f.unitCost.toLocaleString('vi-VN')}đ vẫn được giữ lại để tính tiếp lượng khách và lợi nhuận.`},
 unserved:Math.max(0,potential-sold),revenue:f.price*sold,variableCost:f.unitCost*sold,fixedCost:fixed,oneoff:eff.cash+twist.cash,twist:{headline:twist.headline,description:twist.description,cash:twist.cash,demand:twist.demand,kind:twist.kind,reputation:twist.reputation,satisfaction:twist.satisfaction},profit:monthly,cumulative:f.cash,note:eff.lesson,decision:eff.text,scenarioTitle:teamScene.title,defaulted:max===0};detail.reputation=f.reputation;detail.satisfaction=f.satisfaction;detail.potential=potential;f.history.push(detail);results[team]=detail;
 }
 r.last=results;broadcast(r);
}
io.on('connection',socket=>{
 socket.on('host:create',(_,ack)=>{const code=makeCode();const secret=crypto.randomBytes(16).toString('hex');const room={code,secret,status:'lobby',round:0,deadline:null,timer:null,players:new Map(),votes:new Map(),fin:{A:newFin(),B:newFin()},last:null};rooms.set(code,room);socket.join(code);socket.data={role:'host',code,secret};ack?.({ok:true,code,secret});broadcast(room)});
 socket.on('host:resume',({code,secret},ack)=>{const r=rooms.get(String(code||'').toUpperCase());if(!r||r.secret!==secret)return ack?.({ok:false,error:'Không thể kết nối lại phòng điều khiển'});socket.join(r.code);socket.data={role:'host',code:r.code,secret};ack?.({ok:true});broadcast(r);roster(r)});
 socket.on('player:join',({code,name,playerId,team},ack)=>{const r=rooms.get(String(code||'').toUpperCase());if(!r)return ack?.({ok:false,error:'Không tìm thấy mã phòng. Kiểm tra mã 6 ký tự và bảo đảm host đang mở phòng trên cùng website.'});if(r.status==='finished')return ack?.({ok:false,error:'Trò chơi đã kết thúc'});if(!['A','B'].includes(team))return ack?.({ok:false,error:'Chọn đội A hoặc B'});const id=String(playerId||crypto.randomBytes(12).toString('hex')).slice(0,64);const existing=r.players.get(id);if(existing&&existing.socketId&&existing.socketId!==socket.id)io.sockets.sockets.get(existing.socketId)?.disconnect(true);if(existing&&existing.team!==team&&r.status!=='lobby')return ack?.({ok:false,error:'Không thể đổi đội sau khi bắt đầu'});const p={name:safeName(name),team,playerId:id,socketId:socket.id};r.players.set(id,p);socket.join(r.code);socket.data={role:'player',code:r.code,playerId:id};ack?.({ok:true,playerId:id});broadcast(r);roster(r)});
 socket.on('player:vote',({choice},ack)=>{const r=rooms.get(socket.data?.code);const p=r?.players.get(socket.data?.playerId);if(!r||!p||p.socketId!==socket.id||r.status!=='voting')return ack?.({ok:false,error:'Chưa mở bỏ phiếu'});if(r.votes.has(p.playerId))return ack?.({ok:false,error:'Bạn đã bỏ phiếu vòng này'});const c=Number(choice);if(!Number.isInteger(c)||c<0||c>=rounds[r.round].teams[p.team].options.length)return ack?.({ok:false,error:'Phiếu không hợp lệ'});r.votes.set(p.playerId,{team:p.team,choice:c});ack?.({ok:true});broadcast(r)});
 socket.on('host:open',(_,ack)=>{const r=rooms.get(socket.data?.code);if(!r||socket.data?.role!=='host'||socket.data.secret!==r.secret)return; if(!['lobby','results'].includes(r.status))return; if(r.status==='results')r.round++;if(r.round>=rounds.length){r.status='finished';broadcast(r);return}r.status='voting';r.last=null;r.votes.clear();r.deadline=Date.now()+35000;r.timer=setTimeout(()=>resolve(r),35000);broadcast(r);ack?.({ok:true})});
 socket.on('host:close',()=>{const r=rooms.get(socket.data?.code);if(r&&socket.data.role==='host'&&r.secret===socket.data.secret)resolve(r)});
 socket.on('host:finish',()=>{const r=rooms.get(socket.data?.code);if(!r||socket.data.role!=='host'||r.secret!==socket.data.secret)return;if(r.timer)clearTimeout(r.timer);if(r.status==='voting')resolve(r);r.status='finished';r.deadline=null;broadcast(r)});
 socket.on('host:reset',()=>{const r=rooms.get(socket.data?.code);if(!r||socket.data.role!=='host'||r.secret!==socket.data.secret)return;if(r.timer)clearTimeout(r.timer);r.status='lobby';r.round=0;r.votes.clear();r.last=null;r.deadline=null;r.fin={A:newFin(),B:newFin()};broadcast(r)});
 socket.on('disconnect',()=>{const r=rooms.get(socket.data?.code);if(r&&socket.data?.role==='player'){const p=r.players.get(socket.data.playerId);if(p&&p.socketId===socket.id){p.socketId=null;broadcast(r);}}});
});
server.listen(PORT,()=>console.log(`Phở Đại Chiến running on http://localhost:${PORT}`));
