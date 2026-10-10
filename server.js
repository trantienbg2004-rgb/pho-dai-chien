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
const profiles=[
 {name:'cân bằng',outcomes:[{weight:30,m:1.0,kind:'up'},{weight:50,m:0.3,kind:'mid'},{weight:20,m:-0.8,kind:'down'}]},
 {name:'bứt phá',outcomes:[{weight:38,m:2.4,kind:'up'},{weight:30,m:0.45,kind:'mid'},{weight:32,m:-1.9,kind:'down'}]},
 {name:'linh hoạt',outcomes:[{weight:46,m:1.55,kind:'up'},{weight:34,m:0.25,kind:'mid'},{weight:20,m:-1.25,kind:'down'}]}
];
const variations=[
 {up:['Đơn hàng tăng ngoài dự kiến','Khách quen giới thiệu thêm bạn bè','Đối tác phối hợp rất tốt'],mid:['Thị trường phản ứng đúng như dự báo','Kế hoạch diễn ra khá ổn định','Một số khâu triển khai bị chậm'],down:['Khách hàng thay đổi hành vi bất ngờ','Đối tác giao hàng gặp trục trặc','Chi phí phát sinh hơn dự tính']},
 {up:['Cơ hội bất ngờ: nhu cầu bùng nổ','Video nhận nhiều lời khen từ khách','Khách kéo đến sau một bài đăng tự nhiên'],mid:['Kết quả chỉ đạt mức trung bình','Doanh thu có tăng nhưng không đột biến','Mọi thứ diễn ra chậm hơn kỳ vọng'],down:['Một bài đăng tiêu cực lan truyền','Đối tác đột ngột hủy lịch','Lượng khách thực tế thấp hơn dự báo']},
 {up:['Đội vận hành xử lý cực kỳ hiệu quả','Chương trình gây được tiếng vang','Đối tác hỗ trợ vượt cam kết'],mid:['Phát sinh vấn đề nhỏ đã được xử lý','Khách phản hồi trái chiều','Kết quả gần mức dự kiến'],down:['Bếp bị quá tải đúng giờ cao điểm','Nguồn cung có thay đổi bất thường','Ưu đãi thu hút ít khách hơn dự kiến']}
];
const specific={
 '2-A-1':{
 up:['KOL đang lên xu hướng bất ngờ trở thành gương mặt cực kỳ được yêu thích!','Lượng khách đến quán tăng mạnh nhờ chiến dịch bắt đúng thời điểm.'],
 mid:['Video của KOL có nhiều lượt xem nhưng ít người sống gần quán.','Hiệu quả chuyển đổi thấp hơn kỳ vọng.'],
 down:['KOL bị cộng đồng phản đối sau một phát ngôn cũ.','Quán bị kéo vào tranh cãi và phải xử lý phản hồi.']
 },
 '2-A-0':{
 up:['KOL được thẩm định mang lại khách hàng trung thành','Video có tác động tích cực và phù hợp tệp khách hàng.'],
 mid:['KOL bất ngờ đổi lịch quay','Chiến dịch lùi lại, một phần chi phí chuẩn bị phát sinh.'],
 down:['Dù đã thẩm định, KOL vẫn vướng tranh cãi','Lượng khách mới thấp và cần khắc phục truyền thông.']
 },
 '2-A-2':{
 up:['Check-in nhận quẩy bất ngờ lan truyền','Nhiều khách đăng ảnh và rủ bạn bè tới ăn.'],
 mid:['Khách quen hưởng ứng tốt','Chương trình giữ chân khách nhưng tăng trưởng vừa phải.'],
 down:['Nhiều khách dùng ưu đãi nhưng không quay lại','Chi phí tặng quẩy tăng mà số khách trung thành không như dự báo.']
 }
};
function twistFor(round,team,choice){
 const prof=profiles[(round*2+(team==='B'?1:0)+choice)%3];
 const roll=crypto.randomInt(100);let total=0;let item=prof.outcomes[0];
 for(const candidate of prof.outcomes){total+=candidate.weight;if(roll<total){item=candidate;break}}
 const custom=specific[`${round}-${team}-${choice}`];
 const pool=variations[(round+choice)%variations.length];
 const headlines=pool[item.kind];
 const idx=crypto.randomInt(headlines.length);
 const headline=custom?custom[item.kind][0]:headlines[idx];
 const description=custom?custom[item.kind][1]:({up:'Phương án phát huy tác dụng vượt dự kiến.',mid:'Những lợi ích và hạn chế của quyết định đều xuất hiện.',down:'Quán phải ứng phó phát sinh ngoài kế hoạch.'})[item.kind];
 const scale=round===2?1.6:1;
 return {headline,description,kind:item.kind,profile:prof.name,
 cash:Math.round(item.m*450000*scale),demand:Math.round(item.m*190*scale),
 satisfaction:Math.round(item.m*3)};
}
function newFin(){return {cash:0,customers:3000,price:50000,unitCost:25000,capacity:3100,satisfaction:75,history:[]}}
function makeCode(){let x;do{x=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(x));return x}
function safeName(n){return String(n||'Người chơi').trim().slice(0,22)||'Người chơi'}
function sanitize(r){return {code:r.code,status:r.status,round:r.round,totalRounds:rounds.length,scenario:r.status==='finished'?null:rounds[r.round]||null,teams:['A','B'].map(t=>({id:t,players:[...r.players.values()].filter(p=>p.team===t&&p.socketId).length,votes:[...r.votes.values()].filter(v=>v.team===t).length,finance:r.fin[t]})),last:r.last, timeLeft:r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):null,deadline:r.deadline}}
function broadcast(r){io.to(r.code).emit('state',sanitize(r))}
function roster(r){io.to(r.code).emit('roster',[...r.players.values()].map(p=>({name:p.name,team:p.team})))}
function resolve(r){if(r.status!=='voting')return;if(r.timer)clearTimeout(r.timer);const sc=rounds[r.round];r.status='results';r.deadline=null;let results={}; for(const team of ['A','B']){
 const teamScene=sc.teams[team];const tally=teamScene.options.map((_,i)=>[...r.votes.values()].filter(v=>v.team===team&&v.choice===i).length);
 let max=Math.max(...tally);let choice=tally.findIndex(n=>n===max);if(max===0)choice=1;
 const eff=teamScene.options[choice];const twist=twistFor(r.round,team,choice);const f=r.fin[team]; f.price+=eff.price||0;f.unitCost=Math.max(15000,f.unitCost+(eff.unitCost||0));f.satisfaction=Math.max(10,Math.min(100,f.satisfaction+eff.satisfaction+twist.satisfaction));f.capacity=Math.max(2300,f.capacity+(eff.capacity||0));
 const base=3000;const potential=Math.max(1700,Math.round(base+eff.demand+twist.demand+(f.satisfaction-75)*8-(f.price-50000)*0.018));const sold=Math.min(potential,f.capacity);
 const fixed=30000000;const monthly=(f.price-f.unitCost)*sold-fixed+eff.cash+twist.cash;
 f.cash+=monthly; f.customers=sold;const detail={team,choice,tally,sold,unserved:Math.max(0,potential-sold),revenue:f.price*sold,variableCost:f.unitCost*sold,fixedCost:fixed,oneoff:eff.cash+twist.cash,twist:{headline:twist.headline,description:twist.description,cash:twist.cash,demand:twist.demand,kind:twist.kind,profile:twist.profile},profit:monthly,cumulative:f.cash,note:eff.lesson,decision:eff.text,scenarioTitle:teamScene.title,defaulted:max===0};f.history.push(detail);results[team]=detail;
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
