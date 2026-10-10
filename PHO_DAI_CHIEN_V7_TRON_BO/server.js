'use strict';
const express=require('express');
const http=require('http');
const path=require('path');
const crypto=require('crypto');
const {Server}=require('socket.io');
const G=require('./game-engine');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{pingTimeout:30000,pingInterval:25000});
const rooms=new Map();
const PORT=Number(process.env.PORT)||3000;
const ROOT=path.join(__dirname,'public');
app.disable('x-powered-by');
app.get('/',(_,res)=>res.redirect('/play'));
app.get('/play',(_,res)=>res.sendFile(path.join(ROOT,'index.html')));
app.get('/admin',(_,res)=>res.sendFile(path.join(ROOT,'admin.html')));
app.get('/health',(_,res)=>res.json({ok:true,version:G.VERSION,status:'ready',activeRooms:rooms.size}));
app.use(express.static(ROOT));
function newCode(){let code;do{code=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(code));return code;}
function errText(err){console.error('[game]',err?.stack||err);return err instanceof Error?err.message:'Có lỗi xảy ra, hãy thử lại.';}
function ackSafe(ack,v){if(typeof ack==='function')ack(v);}
function toRoomCode(v){return String(v||'').trim().toUpperCase().slice(0,12);}
function sendState(room){
 for(const s of io.sockets.sockets.values()){
  if(s.data?.code!==room.code)continue;
  const role=s.data.role;
  const team=role==='player'?room.players.get(s.data.playerId)?.team:null;
  if(role==='player'&&!team)continue;
  s.emit('state',G.snapshot(room,{admin:role==='admin',team,playerId:role==='player'?s.data.playerId:null}));
 }
}
function hostRoom(socket,payload){
 const code=toRoomCode(payload?.code||socket.data?.code);
 const token=String(payload?.token||socket.data?.token||'');
 const r=rooms.get(code);
 if(!r||!token||r.secret!==token)throw Error('Không nhận diện được quyền Admin. Phòng có thể đã mất khi máy chủ khởi động lại. Hãy tạo phòng mới.');
 socket.data={role:'admin',code:r.code,token:r.secret};
 return r;
}
function runAck(ack,fn){try{ackSafe(ack,{ok:true,...fn()});}catch(e){ackSafe(ack,{ok:false,error:errText(e)});}}
function settle(room,reason){
 if(room.status!=='voting')return false;
 const outcome=G.closeRound(room);
 console.log(`[result] room=${room.code} round=${room.round+1} reason=${reason} A=${outcome.last.A.financial.profit} B=${outcome.last.B.financial.profit}`);
 sendState(room);
 return true;
}
io.on('connection',socket=>{
 socket.on('host:create',(_,ack)=>runAck(ack,()=>{
  const code=newCode(),token=crypto.randomBytes(24).toString('hex');
  const room=G.createRoom(code,token);rooms.set(code,room);
  socket.data={role:'admin',code,token};
  // Ack gửi trước state để tránh trình duyệt bỏ qua state vì chưa biết mã phòng.
  queueMicrotask(()=>sendState(room));
  console.log(`[room] created=${code}`);
  return {code,token,version:G.VERSION};
 }));
 socket.on('host:resume', (body,ack)=>runAck(ack,()=>{
  const room=hostRoom(socket,body);queueMicrotask(()=>sendState(room));return {code:room.code,version:G.VERSION};
 }));
 socket.on('player:join',(body,ack)=>runAck(ack,()=>{
  const code=toRoomCode(body?.code),room=rooms.get(code);
  if(!room)throw Error('Không tìm thấy mã phòng. Hãy nhập đúng 6 ký tự và chắc chắn Admin đang mở phòng.');
  const id=String(body?.playerId||crypto.randomBytes(12).toString('hex'));
  const oldSocket=G.joinRoom(room,{id,team:body?.team,name:body?.name,socketId:socket.id});
  socket.data={role:'player',code,playerId:id};
  if(oldSocket&&oldSocket!==socket.id){const other=io.sockets.sockets.get(oldSocket);if(other){other.emit('notice','Tài khoản này đã đăng nhập ở một cửa sổ khác.');other.disconnect(true);}}
  queueMicrotask(()=>sendState(room));
  return {code,id,team:body.team,version:G.VERSION};
 }));
 socket.on('player:vote',(body,ack)=>runAck(ack,()=>{
  const room=rooms.get(socket.data?.code);
  if(socket.data?.role!=='player'||!room)throw Error('Bạn phải vào phòng trước.');
  const p=room.players.get(socket.data.playerId);
  if(!p||p.socketId!==socket.id)throw Error('Phiên người chơi đã hết hạn, hãy tải lại trang.');
  if(room.status==='voting'&&Date.now()>=room.deadline)settle(room,'vote-after-deadline');
  G.vote(room,p.id,Number(body?.choice));
  queueMicrotask(()=>sendState(room));return {choice:Number(body?.choice)};
 }));
 socket.on('host:open',(body,ack)=>runAck(ack,()=>{
  const room=hostRoom(socket,body);
  G.startRound(room,Math.max(15,Math.min(120,Number(body?.seconds)||35)));
  queueMicrotask(()=>sendState(room));return {status:room.status,round:room.round};
 }));
 socket.on('host:close',(body,ack)=>runAck(ack,()=>{
  const room=hostRoom(socket,body);
  const already=room.status==='results';
  if(!already)settle(room,'host-manual');
  return {status:room.status,already};
 }));
 socket.on('host:finish',(body,ack)=>runAck(ack,()=>{
  const room=hostRoom(socket,body);
  if(room.status==='voting')settle(room,'host-finish');
  G.finish(room);queueMicrotask(()=>sendState(room));return {status:room.status};
 }));
 socket.on('host:reset',(body,ack)=>runAck(ack,()=>{
  const room=hostRoom(socket,body);
  G.reset(room);queueMicrotask(()=>sendState(room));return {status:room.status};
 }));
 socket.on('disconnect',()=>{
  if(socket.data?.role!=='player')return;
  const room=rooms.get(socket.data.code),p=room?.players.get(socket.data.playerId);
  if(p&&p.socketId===socket.id){p.socketId=null;sendState(room);}
 });
});
// Máy chủ là nơi quyết định hết giờ, không phụ thuộc trang Admin có đang mở hoặc bị lag.
// Đồng hồ khách chỉ để hiển thị; tick dự phòng mỗi 400ms tự chốt cả khi 0 phiếu.
const tick=setInterval(()=>{
 for(const room of rooms.values())if(room.status==='voting'&&Date.now()>=room.deadline){
  try{settle(room,'automatic-timeout');}catch(e){errText(e);io.emit('game:error','Không tính được kết quả, hãy xem Logs của Render.');}
 }
},400);
tick.unref?.();
server.listen(PORT,'0.0.0.0',()=>console.log(`PHO DAI CHIEN ${G.VERSION} ready http://localhost:${PORT}`));
module.exports={app,server,io,rooms};
