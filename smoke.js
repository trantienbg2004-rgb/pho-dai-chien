'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const G=require('../game-engine');
let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
function engineChecks(){
 ok(G.verifyData(),'Toàn bộ dữ liệu hợp lệ');
 for(let ri=0;ri<4;ri++)for(const team of ['A','B'])for(let opt=0;opt<3;opt++)for(const roll of [0,55,99]){
   const e=G.randomEvent(ri,team,opt,()=>roll);
   ok(['up','mid','down'].includes(e.kind)&&e.title&&e.description,'Biến cố có mô tả rõ');
   const r=G.createRoom('ABCDE0','secret');r.round=ri;G.startRound(r,35);
   const id='abcdefghijkl';G.joinRoom(r,{name:'Test',team,id,socketId:'one'});G.vote(r,id,opt);
   const n=G.closeRound(r,()=>roll);const d=n.last[team];
   eq(d.financial.revenue,d.after.price*d.financial.sold,'Doanh thu = giá x bát');
   eq(d.financial.profit,d.financial.revenue-d.financial.variableCost-d.financial.fixedCost+d.financial.oneOff,'Phép tính lãi/lỗ');
   ok(d.financial.sold<=d.after.capacity,'Không bán vượt công suất');
   ok(d.after.reputation>=10&&d.after.reputation<=100,'Uy tín được giới hạn');
   eq(G.closeRound(r).already,true,'Chốt hai lần không tính lãi hai lần');
 }
 const room=G.createRoom('XYZ123','token');
 G.joinRoom(room,{id:'player1xxxx',name:'Lan',team:'A',socketId:'s1'});
 G.joinRoom(room,{id:'player2xxxx',name:'Minh',team:'B',socketId:'s2'});
 for(let round=0;round<4;round++){
  G.startRound(room,35,Date.now());
  G.vote(room,'player1xxxx',round%3);
  G.vote(room,'player2xxxx',(round+1)%3);
  assert.throws(()=>G.vote(room,'player1xxxx',0),/đã bỏ phiếu/);checks++;
  const r=G.closeRound(room,()=>10);
  eq(r.last.A.choice,round%3,'Đếm phiếu A đúng');
  eq(r.last.B.choice,(round+1)%3,'Đếm phiếu B đúng');
  eq(G.snapshot(room,{admin:true}).status,'results','Hiện màn hình kết quả');
  eq(G.snapshot(room,{team:'A'}).scenario.teams.B,undefined,'Người chơi chỉ nhận câu hỏi đội mình');
 }
 G.finish(room);eq(G.snapshot(room).status,'finished','Kết thúc 4 vòng');ok(['A','B','DRAW'].includes(G.snapshot(room).winner));
 G.reset(room);eq(room.round,0);eq(room.finance.A.cumulative,0);
 G.startRound(room,35);const no=G.closeRound(room,()=>55);
 eq(no.last.A.unvoted,true,'Không phiếu vẫn được công bố');eq(no.last.B.unvoted,true);
 const tie=G.createRoom('TIE123','k');G.startRound(tie,35);
 G.joinRoom(tie,{id:'tieperson001',name:'A',team:'A',socketId:'a'});
 G.joinRoom(tie,{id:'tieperson002',name:'B',team:'A',socketId:'b'});
 G.vote(tie,'tieperson001',0);G.vote(tie,'tieperson002',1);
 const w=G.closeRound(tie,()=>0);eq(w.last.A.tied,true,'Đồng phiếu có bốc thăm minh bạch');
 // Kiểm chứng quy luật giá/chất lượng: giá rẻ hơn + hài lòng cao hơn tăng NHU CẦU,
 // nhưng công suất có thể khiến số bán thực tế không tăng tương ứng.
 function scenario(price, satisfaction,capacity=3500){
  const x=G.createRoom('TEST12','secret');
  x.finance.A.price=price;x.finance.A.satisfaction=satisfaction;x.finance.A.capacity=capacity;
  G.startRound(x,35);
  G.joinRoom(x,{name:'Lan',team:'A',id:'scenario001',socketId:'s'});
  G.vote(x,'scenario001',0);
  return G.closeRound(x,()=>55).last.A;
 }
 const standard=scenario(50000,75,5000),attractive=scenario(45000,90,5000);
 ok(attractive.financial.potential>standard.financial.potential,'Giá thấp + hài lòng cao -> nhu cầu cao hơn khi mọi yếu tố khác không đổi');
 eq(attractive.financial.sold,attractive.financial.potential,'Đủ công suất thì bán đúng theo nhu cầu');
 const limited=scenario(45000,90,2800);
 eq(limited.financial.sold,limited.after.capacity,'Bếp quá tải: bán thực tế bằng công suất đã điều chỉnh');
 ok(limited.financial.potential>limited.financial.sold,'Có khách tiềm năng chưa được phục vụ dù giá hấp dẫn');
 // Lãi phụ thuộc biên đóng góp chứ không chỉ số bát, đúng như tình huống người dùng.
 const a=3141*(53000-25000),b=3300*(45000-21600);
 ok(b< a,'Bán 3300 bát giá 45k vẫn có thể tạo lãi góp thấp hơn bán 3141 bát giá 53k');
 console.log(`Engine: ${checks} kiểm tra thành công`);
}
class FakeSocket{
 constructor(id){this.id=id;this.handlers={};this.data={};this.connected=true;this.received=[]}
 on(name,fn){this.handlers[name]=fn}
 emit(name,data){this.received.push({name,data})}
 client(name,payload={}){return new Promise((resolve,reject)=>{const fn=this.handlers[name];if(!fn)return reject(Error('No event '+name));fn(payload,resolve)})}
 disconnect(){this.connected=false;this.handlers.disconnect?.()}
}
class FakeIO{
 constructor(){this.sockets={sockets:new Map()};this.events={}}
 on(name,fn){this.events[name]=fn}
 emit(name,data){for(const s of this.sockets.sockets.values())s.emit(name,data)}
 connect(id){const s=new FakeSocket(id);this.sockets.sockets.set(id,s);this.events.connection(s);return s}
}
function fakeServerChecks(){
 const Module=require('module');const previous=Module._load;
 const fakeExpress=()=>({disable(){},get(){},use(){}});fakeExpress.static=()=>()=>{};
 let capturedIO;
 class IO extends FakeIO{constructor(){super();capturedIO=this}}
 Module._load=function(spec,...rest){
  if(spec==='express')return fakeExpress;
  if(spec==='socket.io')return {Server:IO};
  if(spec==='http')return {createServer:()=>({listen(_port,_host,fn){fn?.()},close(){}})};
  return previous.call(this,spec,...rest);
 };
 const oldPORT=process.env.PORT;process.env.PORT='9100';
 const api=require('../server');
 Module._load=previous;
 if(oldPORT===undefined)delete process.env.PORT;else process.env.PORT=oldPORT;
 return {api,io:capturedIO};
}
async function serverChecks(){
 const {api,io}=fakeServerChecks();
 const admin=io.connect('admin1');
 const created=await admin.client('host:create');ok(created.ok,'Tạo phòng thành công');
 await Promise.resolve();
 eq(admin.received.at(-1).data.status,'lobby','Admin nhận trạng thái phòng');
 const A=io.connect('pA'),B=io.connect('pB');
 const ja=await A.client('player:join',{code:created.code,name:'Lan',team:'A',playerId:'abcdef123456'});
 const jb=await B.client('player:join',{code:created.code,name:'Minh',team:'B',playerId:'abcdef123457'});
 ok(ja.ok&&jb.ok,'Hai phe vào phòng thành công');
 await Promise.resolve();
 ok(A.received.some(x=>x.name==='state'&&x.data.teams[0].count===1),'Hiển thị quân số A');
 const op=await admin.client('host:open',{code:created.code,token:created.token,seconds:35});ok(op.ok,'Admin mở vòng');
 const va=await A.client('player:vote',{choice:0});const vb=await B.client('player:vote',{choice:2});ok(va.ok&&vb.ok,'Mỗi phe gửi phiếu');
 const reject=await A.client('player:vote',{choice:1});eq(reject.ok,false,'Không bỏ phiếu trùng');
 const close=await admin.client('host:close',{code:created.code,token:created.token});ok(close.ok,'Chốt sớm thành công');
 await Promise.resolve();
 ok(admin.received.some(x=>x.name==='state'&&x.data.status==='results'),'Admin nhận màn hình kết quả');
 ok(A.received.some(x=>x.name==='state'&&x.data.status==='results'),'Người chơi thấy kết quả');
 const second=await admin.client('host:close',{code:created.code,token:created.token});ok(second.ok&&second.already,'Chốt hai lần an toàn');
 const resum=io.connect('admin2');const rr=await resum.client('host:resume',{code:created.code,token:created.token});ok(rr.ok,'Admin khôi phục quyền');
 await admin.client('host:open',{code:created.code,token:created.token,seconds:35});
 const room=api.rooms.get(created.code);room.deadline=Date.now()-1;
 await new Promise(r=>setTimeout(r,520));
 eq(room.status,'results','Hết giờ tự công bố trên máy chủ');
 await Promise.resolve();ok(B.received.some(x=>x.name==='state'&&x.data.round===1&&x.data.status==='results'),'Người chơi nhận kết quả tự chốt');
 for(let i=2;i<4;i++){
  const ro=await admin.client('host:open',{code:created.code,token:created.token});ok(ro.ok,'Mở vòng '+i);
  const settled=await admin.client('host:close',{code:created.code,token:created.token});ok(settled.ok,'Chốt vòng '+i);
 }
 const fin=await admin.client('host:finish',{code:created.code,token:created.token});ok(fin.ok,'Công bố chung cuộc');
 eq(room.status,'finished','Trạng thái kết thúc đúng');
 console.log(`Máy chủ giả lập: tổng ${checks} kiểm tra thành công`);
}
engineChecks();
serverChecks().then(()=>{console.log('TẤT CẢ KIỂM THỬ ĐẠT ✅');process.exit(0)}).catch(e=>{console.error(e);process.exit(1)});
