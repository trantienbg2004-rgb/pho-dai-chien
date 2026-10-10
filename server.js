const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const crypto=require('crypto');
const path=require('path');
const app=express(); const server=http.createServer(app);const io=new Server(server);
app.use(express.static(path.join(__dirname,'public')));
const PORT=process.env.PORT||3000;
const rounds=[
 {title:'Cơn sốt phở buổi sáng',story:'Đối thủ gần đó đóng cửa sửa chữa. Lượng khách tăng đột ngột, cả hai quán có nguy cơ hết hàng.',question:'Bạn xử lý lượng khách tăng thế nào?', options:[
  {text:'Nhập bổ sung khẩn cấp, trả giá cao',cash:-2200000,demand:450,satisfaction:2,capacity:450,note:'Đủ hàng nhưng phí mua và giao tăng.'},
  {text:'Giữ nguyên kho, chấp nhận bán hết sớm',cash:0,demand:350,satisfaction:-7,capacity:0,note:'Đỡ tốn tiền nhưng mất cơ hội bán thêm.'},
  {text:'Dự báo và đặt nguyên liệu vừa đủ theo ca',cash:-900000,demand:390,satisfaction:5,capacity:350,note:'Bổ sung có kế hoạch, giảm thiếu hàng.'}]},
 {title:'Giá thịt bò bất ngờ tăng',story:'Nhà cung cấp báo giá tăng 15%. Cả hai quán phải điều chỉnh hoạt động mua sắm.',question:'Quán bạn sẽ làm gì?',options:[
  {text:'Mua nguồn hàng rẻ, chất lượng thiếu ổn định',cash:1000000,demand:-120,satisfaction:-15,capacity:0,note:'Tiết kiệm trước mắt nhưng khách phàn nàn.'},
  {text:'Đàm phán hợp đồng với nhà cung cấp',cash:-500000,demand:70,satisfaction:4,capacity:0,note:'Giữ chất lượng và ổn định nguồn cung.'},
  {text:'Tăng giá mỗi bát thêm 5.000đ',cash:0,price:5000,demand:-170,satisfaction:-3,capacity:0,note:'Biên lợi nhuận tăng, nhưng có khách chuyển quán.'}]},
 {title:'Video TikTok về quán phở',story:'Một reviewer muốn tới thử phở. Nếu quán phục vụ tốt, nhiều người sẽ biết đến quán.',question:'Bạn quyết định đầu tư vào khâu nào?',options:[
  {text:'Chi 2 triệu chạy quảng cáo ngay',cash:-2000000,demand:320,satisfaction:0,capacity:0,note:'Có thêm người biết đến, nhưng chi phí quảng cáo tăng.'},
  {text:'Đào tạo phục vụ và cải thiện trải nghiệm',cash:-1100000,demand:190,satisfaction:12,capacity:0,note:'Tăng khả năng khách quay lại.'},
  {text:'Không làm gì, tiết kiệm ngân sách',cash:0,demand:-60,satisfaction:-2,capacity:0,note:'Tiết kiệm chi phí nhưng bỏ lỡ cơ hội.'}]},
 {title:'Bếp quá tải vào cuối tuần',story:'Khách chờ 25 phút, đơn giao hàng thường trễ. Chi phí vận hành và khiếu nại tăng.',question:'Lựa chọn tối ưu của bạn?',options:[
  {text:'Thuê thêm người phụ bếp theo ca',cash:-1400000,demand:170,satisfaction:6,capacity:270,note:'Tăng tốc độ nhưng tốn chi phí nhân công.'},
  {text:'Chuẩn hóa quy trình chế biến, định lượng',cash:-750000,demand:140,satisfaction:10,capacity:200,unitCost:-1200,note:'Giảm hao hụt nguyên liệu và nâng năng suất.'},
  {text:'Giảm khẩu phần để ra món nhanh hơn',cash:600000,demand:-190,satisfaction:-17,capacity:100,note:'Chi phí ngắn hạn thấp nhưng mất lòng tin.'}]}
];
const rooms=new Map();
function newFin(){return {cash:0,customers:3000,price:50000,unitCost:25000,capacity:3100,satisfaction:75,history:[]}}
function makeCode(){let x;do{x=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(x));return x}
function safeName(n){return String(n||'Người chơi').trim().slice(0,22)||'Người chơi'}
function sanitize(r){return {code:r.code,status:r.status,round:r.round,totalRounds:rounds.length,scenario:r.status==='finished'?null:rounds[r.round]||null,teams:['A','B'].map(t=>({id:t,players:[...r.players.values()].filter(p=>p.team===t).length,votes:[...r.votes.values()].filter(v=>v.team===t).length,finance:r.fin[t]})),last:r.last, timeLeft:r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):null,deadline:r.deadline}}
function broadcast(r){io.to(r.code).emit('state',sanitize(r))}
function roster(r){io.to(r.code).emit('roster',[...r.players.values()].map(p=>({name:p.name,team:p.team})))}
function resolve(r){if(r.status!=='voting')return;if(r.timer)clearTimeout(r.timer);const sc=rounds[r.round];r.status='results';r.deadline=null;let results={}; for(const team of ['A','B']){
 const tally=sc.options.map((_,i)=>[...r.votes.values()].filter(v=>v.team===team&&v.choice===i).length);
 let max=Math.max(...tally);let choice=tally.findIndex(n=>n===max);if(max===0)choice=1;
 const eff=sc.options[choice];const f=r.fin[team]; f.price+=eff.price||0;f.unitCost=Math.max(15000,f.unitCost+(eff.unitCost||0));f.satisfaction=Math.max(10,Math.min(100,f.satisfaction+eff.satisfaction));f.capacity=Math.max(2300,f.capacity+(eff.capacity||0));
 const base=3000;const potential=Math.max(1700,Math.round(base+eff.demand+(f.satisfaction-75)*8-(f.price-50000)*0.018));const sold=Math.min(potential,f.capacity);
 const fixed=30000000;const monthly=(f.price-f.unitCost)*sold-fixed+eff.cash;
 f.cash+=monthly; f.customers=sold;const detail={team,choice,tally,sold,unserved:Math.max(0,potential-sold),revenue:f.price*sold,variableCost:f.unitCost*sold,fixedCost:fixed,oneoff:eff.cash,profit:monthly,cumulative:f.cash,note:eff.note,defaulted:max===0};f.history.push(detail);results[team]=detail;
 }
 r.last=results;broadcast(r);
}
io.on('connection',socket=>{
 socket.on('host:create',(_,ack)=>{const code=makeCode();const secret=crypto.randomBytes(16).toString('hex');const room={code,secret,status:'lobby',round:0,deadline:null,timer:null,players:new Map(),votes:new Map(),fin:{A:newFin(),B:newFin()},last:null};rooms.set(code,room);socket.join(code);socket.data={role:'host',code,secret};ack?.({ok:true,code,secret});broadcast(room)});
 socket.on('host:resume',({code,secret},ack)=>{const r=rooms.get(String(code||'').toUpperCase());if(!r||r.secret!==secret)return ack?.({ok:false,error:'Không thể kết nối lại phòng điều khiển'});socket.join(r.code);socket.data={role:'host',code:r.code,secret};ack?.({ok:true});broadcast(r);roster(r)});
 socket.on('player:join',({code,name,playerId,team},ack)=>{const r=rooms.get(String(code||'').toUpperCase());if(!r)return ack?.({ok:false,error:'Mã phòng không tồn tại'});if(r.status==='finished')return ack?.({ok:false,error:'Trò chơi đã kết thúc'});if(!['A','B'].includes(team))return ack?.({ok:false,error:'Chọn đội A hoặc B'});const id=String(playerId||crypto.randomBytes(12).toString('hex')).slice(0,64);const existing=r.players.get(id);if(existing&&existing.team!==team&&r.status!=='lobby')return ack?.({ok:false,error:'Không thể đổi đội sau khi bắt đầu'});const p={name:safeName(name),team,playerId:id};r.players.set(id,p);socket.join(r.code);socket.data={role:'player',code:r.code,playerId:id};ack?.({ok:true,playerId:id});broadcast(r);roster(r)});
 socket.on('player:vote',({choice},ack)=>{const r=rooms.get(socket.data?.code);const p=r?.players.get(socket.data?.playerId);if(!r||!p||r.status!=='voting')return ack?.({ok:false,error:'Chưa mở bỏ phiếu'});if(r.votes.has(p.playerId))return ack?.({ok:false,error:'Bạn đã bỏ phiếu vòng này'});const c=Number(choice);if(!Number.isInteger(c)||c<0||c>=rounds[r.round].options.length)return ack?.({ok:false,error:'Phiếu không hợp lệ'});r.votes.set(p.playerId,{team:p.team,choice:c});ack?.({ok:true});broadcast(r)});
 socket.on('host:open',(_,ack)=>{const r=rooms.get(socket.data?.code);if(!r||socket.data?.role!=='host'||socket.data.secret!==r.secret)return; if(!['lobby','results'].includes(r.status))return; if(r.status==='results')r.round++;if(r.round>=rounds.length){r.status='finished';broadcast(r);return}r.status='voting';r.last=null;r.votes.clear();r.deadline=Date.now()+35000;r.timer=setTimeout(()=>resolve(r),35000);broadcast(r);ack?.({ok:true})});
 socket.on('host:close',()=>{const r=rooms.get(socket.data?.code);if(r&&socket.data.role==='host'&&r.secret===socket.data.secret)resolve(r)});
 socket.on('host:finish',()=>{const r=rooms.get(socket.data?.code);if(!r||socket.data.role!=='host'||r.secret!==socket.data.secret)return;if(r.timer)clearTimeout(r.timer);if(r.status==='voting')resolve(r);r.status='finished';r.deadline=null;broadcast(r)});
 socket.on('host:reset',()=>{const r=rooms.get(socket.data?.code);if(!r||socket.data.role!=='host'||r.secret!==socket.data.secret)return;if(r.timer)clearTimeout(r.timer);r.status='lobby';r.round=0;r.votes.clear();r.last=null;r.deadline=null;r.fin={A:newFin(),B:newFin()};broadcast(r)});
 socket.on('disconnect',()=>{});
});
server.listen(PORT,()=>console.log(`Phở Đại Chiến running on http://localhost:${PORT}`));
