'use strict';
const crypto=require('crypto');
const {rounds,eventBank,chanceProfiles}=require('./game-data');
const VERSION='7.1.0';
const N=30000000, MIN=15000;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const teams=['A','B'];
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function verifyData(){
 if(rounds.length!==4)throw Error('Cần đúng 4 vòng');
 for(let i=0;i<rounds.length;i++)for(const t of teams){
  const ops=rounds[i].teams?.[t]?.options;
  if(!ops||ops.length!==3)throw Error(`Sai số lựa chọn ${i}-${t}`);
  for(let j=0;j<3;j++){
   const ev=eventBank[`${i}-${t}`]?.[j], chances=chanceProfiles[i]?.[j];
   if(!ev||!chances||chances.length!==3||chances.reduce((s,x)=>s+x,0)!==100)throw Error(`Thiếu biến cố ${i}-${t}-${j}`);
   for(const k of ['up','mid','down'])if(!Array.isArray(ev[k])||ev[k].length!==6||!ev[k].slice(2).every(finite))throw Error(`Biến cố sai ${i}-${t}-${j}-${k}`);
  }
 }
 return true;
}
verifyData();
function initFin(){return {cumulative:0,sold:3000,potential:3000,price:50000,unitCost:25000,capacity:3100,satisfaction:75,reputation:75,history:[]};}
function createRoom(code,secret){return {code,secret,status:'lobby',round:0,deadline:null,players:new Map(),votes:new Map(),finance:{A:initFin(),B:initFin()},last:null,version:VERSION};}
function joinRoom(room,{name,team,id,socketId}){
 if(room.status==='finished')throw Error('Trận đấu đã kết thúc.');
 if(!teams.includes(team))throw Error('Bạn cần chọn quán A hoặc B.');
 const display=String(name||'').trim().slice(0,28);
 if(!display)throw Error('Vui lòng nhập tên.');
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))throw Error('Mã người chơi không hợp lệ.');
 const prev=room.players.get(id);
 if(prev&&prev.team!==team&&room.status!=='lobby')throw Error('Không được đổi phe sau khi bắt đầu trận.');
 room.players.set(id,{id,name:display,team,socketId});
 return prev?.socketId;
}
function startRound(room,durationSeconds=35,now=Date.now()){
 if(!['lobby','results'].includes(room.status))throw Error('Chưa thể bắt đầu vòng mới.');
 if(room.status==='results')room.round++;
 if(room.round>=rounds.length){room.status='finished';room.deadline=null;return;}
 room.status='voting';room.last=null;room.deadline=now+durationSeconds*1000;
 room.votes.clear();
}
function vote(room,id,choice,now=Date.now()){
 const player=room.players.get(id);
 if(!player||!player.socketId)throw Error('Bạn chưa tham gia phòng.');
 if(room.status!=='voting')throw Error('Không còn trong thời gian bỏ phiếu.');
 if(now>=room.deadline)throw Error('Hết giờ bỏ phiếu. Đang công bố kết quả.');
 if(room.votes.has(id))throw Error('Bạn đã bỏ phiếu trong vòng này.');
 if(!Number.isInteger(choice)||choice<0||choice>2)throw Error('Phiếu không hợp lệ.');
 room.votes.set(id,{team:player.team,choice});
}
function randomEvent(ri,t,choice,rand=()=>crypto.randomInt(100)){
 const events=eventBank[`${ri}-${t}`][choice],weights=chanceProfiles[ri][choice],roll=rand();
 const kind=roll<weights[0]?'up':roll<weights[0]+weights[1]?'mid':'down';
 const v=events[kind];
 return {kind,title:v[0],description:v[1],demand:v[2],satisfaction:v[3],reputation:v[4],cash:v[5],probability:weights[['up','mid','down'].indexOf(kind)]};
}
function decisionForTeam(room,t,rand){
 const tallies=[0,0,0];
 for(const v of room.votes.values())if(v.team===t)tallies[v.choice]++;
 const top=Math.max(...tallies);
 const leaders=tallies.flatMap((n,i)=>n===top?[i]:[]);
 const unvoted=top===0;
 const tied=!unvoted&&leaders.length>1;
 // Trường hợp không có phiếu, phương án số 2 được áp dụng mặc định và công khai.
 const choice=unvoted?1:leaders.length===1?leaders[0]:leaders[rand()%leaders.length];
 return {choice,tallies,unvoted,tied};
}
// Cả hai quán đều đối mặt cùng một thị trường. Trước tiên quyết định + biến cố,
// sau đó mới tính khách hàng, trong đó có phần dịch chuyển khách giữa hai quán.
function prepareTeam(room,t,rand){
 const decision=decisionForTeam(room,t,rand);
 const sc=rounds[room.round].teams[t],opt=sc.options[decision.choice];
 const event=randomEvent(room.round,t,decision.choice,rand);
 const before=room.finance[t];
 return {decision,sc,opt,event,before,
  price:clamp(before.price+(opt.price||0),30000,85000),
  unitCost:clamp(before.unitCost+(opt.unitCost||0),MIN,45000),
  capacity:clamp(before.capacity+(opt.capacity||0),1800,5000),
  satisfaction:clamp(before.satisfaction+(opt.satisfaction||0)+event.satisfaction,10,100),
  reputation:clamp(before.reputation+event.reputation,10,100)};
}
function computeTeam(room,t,plan,opponent){
 const {decision,sc,opt,event,before,price,unitCost,capacity,satisfaction,reputation}=plan;
 // Hai yếu tố riêng biệt: sức hút tuyệt đối và lượng khách dịch chuyển từ đối thủ.
 // Giảm giá / tăng hài lòng / tăng uy tín luôn nâng NHU CẦU trong cùng điều kiện.
 // Số bán thực tế có thể bị chặn bởi công suất; giá thấp không mặc nhiên lãi cao.
 const retention=Math.round((before.sold-3000)*0.25);
 const qualityImpact=(satisfaction-75)*7+(reputation-75)*12;
 const priceImpact=Math.round((50000-price)*0.018);
 const competitionImpact=clamp(Math.round((opponent.price-price)*0.011+(satisfaction-opponent.satisfaction)*4+(reputation-opponent.reputation)*6),-500,500);
 const potential=Math.max(0,Math.round(3000+retention+(opt.demand||0)+event.demand+qualityImpact+priceImpact+competitionImpact));
 const sold=Math.min(potential,capacity);
 const revenue=price*sold;
 const variableCost=unitCost*sold;
 const fixedCost=N;
 const oneOff=(opt.cash||0)+event.cash;
 const profit=revenue-variableCost-fixedCost+oneOff;
 const cumulative=before.cumulative+profit;
 const after={cumulative,sold,potential,price,unitCost,capacity,satisfaction,reputation,history:before.history.slice()};
 const result={team:t,round:room.round+1,scenario:sc.title,choice:decision.choice,decision:opt.text,tallies:decision.tallies,unvoted:decision.unvoted,tied:decision.tied,event,lesson:opt.lesson,
  before:{sold:before.sold,potential:before.potential??before.sold,price:before.price,unitCost:before.unitCost,capacity:before.capacity,satisfaction:before.satisfaction,reputation:before.reputation,cumulative:before.cumulative},
  after:{sold,potential,price,unitCost,capacity,satisfaction,reputation,cumulative},
  effects:{decisionDemand:opt.demand||0,eventDemand:event.demand,carryover:retention,qualityImpact,priceImpact,competitionImpact,decisionSatisfaction:opt.satisfaction||0,decisionCapacity:opt.capacity||0},
  financial:{potential,sold,unserved:Math.max(0,potential-sold),revenue,variableCost,fixedCost,decisionCash:opt.cash||0,eventCash:event.cash,oneOff,profit,cumulative,marginPerBowl:price-unitCost,marginTotal:(price-unitCost)*sold}
 };
 after.history.push(result);
 return {after,result};
}
function closeRound(room,rand=()=>crypto.randomInt(100)){
 if(room.status==='results')return {already:true,last:room.last};
 if(room.status!=='voting')throw Error('Chưa có vòng đang bỏ phiếu.');
 // Cả hai biến cố được xác định trước, tính kết quả trên cùng một mặt bằng so sánh.
 const plans={A:prepareTeam(room,'A',rand),B:prepareTeam(room,'B',rand)};
 const results={};const next={};
 for(const t of teams){const other=t==='A'?'B':'A';const out=computeTeam(room,t,plans[t],plans[other]);results[t]=out.result;next[t]=out.after;}
 // Chỉ commit khi cả hai đội đã tính xong: tránh cập nhật tài chính nửa vời.
 room.finance=next;room.status='results';room.deadline=null;room.last=results;
 return {already:false,last:results};
}
function finish(room){if(room.status==='voting')closeRound(room);if(room.status!=='results')throw Error('Hãy hoàn thành một vòng trước khi kết thúc.');room.status='finished';room.deadline=null;}
function reset(room){room.status='lobby';room.round=0;room.deadline=null;room.votes.clear();room.last=null;room.finance={A:initFin(),B:initFin()};}
function snapshot(room,{team=null,playerId=null,admin=false}={}){
 const publicTeams=teams.map(t=>({id:t,count:[...room.players.values()].filter(p=>p.team===t&&p.socketId).length,votes:[...room.votes.values()].filter(v=>v.team===t).length,finance:{...room.finance[t],history:undefined}}));
 const sc=rounds[room.round];
 return {version:VERSION,code:room.code,status:room.status,round:room.round,totalRounds:rounds.length,deadline:room.deadline,serverNow:Date.now(),title:sc?.title||null,story:sc?.story||null,
  teams:publicTeams,scenario:room.status==='finished'?null:admin?sc:team&&teams.includes(team)?{teams:{[team]:sc.teams[team]}}:null,
  myTeam:team,myVote:playerId&&room.votes.has(playerId)?room.votes.get(playerId).choice:null,
  last:room.last,winner:room.status==='finished'?(room.finance.A.cumulative===room.finance.B.cumulative?'DRAW':room.finance.A.cumulative>room.finance.B.cumulative?'A':'B'):null};
}
module.exports={VERSION,rounds,verifyData,createRoom,joinRoom,startRound,vote,closeRound,finish,reset,snapshot,randomEvent};
