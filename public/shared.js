'use strict';
const Fmt={
  num:n=>Number(n||0).toLocaleString('vi-VN'),
  money:n=>Math.round(Number(n||0)).toLocaleString('vi-VN')+' đ',
  mil:n=>(Number(n||0)/1e6).toLocaleString('vi-VN',{maximumFractionDigits:2})+' triệu',
  sign:n=>(n>0?'+':'')+Number(n||0).toLocaleString('vi-VN'),
  escape:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  ticker:deadline=>!deadline?'—':Math.max(0,Math.ceil((deadline-Date.now())/1000))+'s',
};
const {num,money,mil,escape:e,sign}=Fmt;
function metric(label,value){return `<div class="stat"><small>${e(label)}</small><strong>${e(value)}</strong></div>`}
function finCard(t){const f=t.finance;return `<section class="team ${t.id==='B'?'b':''}"><div class="teamhead"><h2 class="teamname ${t.id==='B'?'b-text':'a-text'}">🍜 QUÁN ${t.id}</h2><span class="chip">👥 ${t.count} người · 🗳️ ${t.votes} phiếu</span></div><p class="big-number ${f.cumulative<0?'moneynegative':''}">${mil(f.cumulative)}</p><p class="label">Lợi nhuận tích lũy</p><div class="stats">${metric('Bát đã bán tháng gần nhất',num(f.sold))}${metric('Giá bán / bát',money(f.price))}${metric('Chi phí biến đổi / bát',money(f.unitCost))}${metric('Công suất tối đa',num(f.capacity))}<div class="stat"><small>Hài lòng</small><strong>${f.satisfaction}%</strong><div class="bar"><span style="width:${f.satisfaction}%"></span></div></div><div class="stat"><small>Uy tín</small><strong>${f.reputation}%</strong><div class="bar"><span style="width:${f.reputation}%"></span></div></div></div></section>`}
function questionCard(s,t,votes=0){const x=s.teams[t];return `<section class="team ${t==='B'?'b':''}"><div class="teamhead"><span class="pill">QUÁN ${t}</span><span class="muted">${votes} phiếu đã gửi</span></div><h3 class="topic-title">${e(x.title)}</h3><p class="team-story">${e(x.story)}</p><p class="question">${e(x.question)}</p><div class="options">${x.options.map((o,i)=>`<div class="option"><b>${i+1}.</b> ${e(o.text)}</div>`).join('')}</div></section>`}
const difference=(v,u='')=>(v>0?'+':'')+num(v)+u;
function comparison(label,b,a,u=''){return `<div class="metric-row"><span>${e(label)}</span><b>${num(b)} → ${num(a)}${e(u)} (${difference(a-b)})</b></div>`}
function finances(r){const f=r.financial;return `${line('Doanh thu = giá bán × số bát',money(f.revenue))}${line('Chi phí biến đổi = giá vốn × số bát','−'+money(f.variableCost))}${line('Chi phí cố định','−'+money(f.fixedCost))}${line('Chi phí/thu nhập từ quyết định',Fmt.money(f.decisionCash))}${line('Chi phí/thu nhập từ biến cố',Fmt.money(f.eventCash))}<div class="divider"></div><div class="metric-row total"><span>Lãi/lỗ vòng ${r.round}</span><b class="${f.profit<0?'status-bad':'status-good'}">${money(f.profit)}</b></div>${line('Lợi nhuận tích lũy',money(f.cumulative))}`}
function line(l,v){return `<div class="metric-row"><span>${e(l)}</span><b>${e(v)}</b></div>`}
function resultCard(r){if(!r)return '';
 const x=r.event,a=r.after,b=r.before,muted=r.unvoted?'Phe chưa bỏ phiếu; hệ thống dùng phương án 2 mặc định.':r.tied?'Có phương án đồng phiếu; hệ thống đã bốc thăm giữa các phương án dẫn đầu.':'';
 return `<article class="report ${r.team==='B'?'b':''}"><div class="teamhead"><h3 class="teamname ${r.team==='B'?'b-text':'a-text'}">QUÁN ${r.team}</h3><span class="chip">Vòng ${r.round} · ${r.tallies.reduce((q,v)=>q+v,0)} phiếu</span></div><p class="big-number ${r.financial.profit<0?'moneynegative':''}">${r.financial.profit>0?'+':''}${mil(r.financial.profit)}</p><p class="label">Lãi/lỗ riêng vòng này</p>
 <div class="step"><h4>1 · QUYẾT ĐỊNH CỦA PHE</h4><p><strong>${e(r.decision)}</strong></p>${line('Số phiếu từng lựa chọn',r.tallies.map((n,i)=>`${i+1}: ${n}`).join('  |  '))}${muted?`<p class="notice">${e(muted)}</p>`:''}</div>
 <div class="twist ${x.kind}"><span class="kicker">2 · BIẾN CỐ SAU QUYẾT ĐỊNH</span><p><strong>${e(x.title)}</strong></p><p>${e(x.description)}</p></div>
 <div class="step"><h4>3 · BIẾN CỐ ĐÃ TÁC ĐỘNG NHƯ THẾ NÀO?</h4>${line('Khách tiềm năng do biến cố',difference(x.demand,' bát'))}${line('Khách chuyển dịch từ cạnh tranh',difference(r.effects.competitionImpact,' bát'))}${line('Uy tín do biến cố',difference(x.reputation,' điểm'))}${line('Hài lòng do biến cố',difference(x.satisfaction,' điểm'))}${line('Thu/chi từ biến cố',Fmt.money(x.cash))}<p>Khâu quản trị liên quan: ${e(r.lesson)}</p></div>
 <div class="step"><h4>4 · TÌNH HÌNH QUÁN SAU BIẾN CỐ</h4>${comparison('Uy tín',b.reputation,a.reputation,'%')}${comparison('Hài lòng',b.satisfaction,a.satisfaction,'%')}${comparison('Giá bán/bát',b.price,a.price,'đ')}${comparison('Giá vốn/bát',b.unitCost,a.unitCost,'đ')}${comparison('Công suất',b.capacity,a.capacity,' bát')}${line('Khách tiềm năng (trước giới hạn bếp)',num(r.financial.potential)+' bát')}${line('Thực tế phục vụ',num(r.financial.sold)+' bát')}${line('Khách bỏ lỡ do hết công suất',num(r.financial.unserved)+' bát')}</div>
 <div class="step"><h4>5 · TIỀN LÃI/LỖ TÍNH RA SAO?</h4>${finances(r)}</div>
 <div class="step"><h4>6 · HẬU QUẢ SANG VÒNG SAU & BÀI HỌC</h4><p>Giá bán, chi phí/bát, uy tín và sự hài lòng sau vòng này được giữ lại. Uy tín thấp làm giảm khách tiềm năng ở vòng sau; giá cao có thể làm khách nhạy giá rời đi.</p><p><strong>📚 Kiến thức:</strong> ${e(r.lesson)}</p></div></article>`}
function hintAboutSales(state){
 const ra=state.last?.A,rb=state.last?.B;
 if(!ra||!rb)return '';
 const high=ra.financial.sold>=rb.financial.sold?ra:rb;
 const low=high===ra?rb:ra;
 const richer=ra.financial.profit>=rb.financial.profit?ra:rb;
 const marginA=ra.financial.marginPerBowl,marginB=rb.financial.marginPerBowl;
 let msg=`Quán ${high.team} bán ${num(high.financial.sold)} bát, quán ${low.team} bán ${num(low.financial.sold)} bát. `;
 if(high!==richer) msg+=`Tuy nhiên, quán ${richer.team} lãi vòng này cao hơn. `;
 msg+=`Lãi góp/bát: A ${money(marginA)}, B ${money(marginB)}. `;
 const scarce=['A','B'].filter(t=>state.last[t].financial.unserved>0);
 if(scarce.length)msg+=`Quán ${scarce.join(', ')} có khách muốn mua nhưng công suất không đủ (tối đa ${scarce.map(t=>num(state.last[t].after.capacity)+' bát').join(' / ')}). `;
 msg+='Giá thấp và khách hài lòng giúp tăng nhu cầu, nhưng không bảo đảm lãi cao nếu biên lợi nhuận thấp hoặc bếp quá tải.';
 return `<div class="insight"><strong>💡 TẠI SAO BÁN NHIỀU CHƯA CHẮC LÃI NHIỀU?</strong><p>${e(msg)}</p></div>`;
}
function compactResultCard(r,showDetails=true){if(!r)return '';
 const d=r.event,f=r.financial,a=r.after,b=r.before;
 const soldDiff=f.sold-b.sold,satDiff=a.satisfaction-b.satisfaction,repDiff=a.reputation-b.reputation;
 const situation=d.kind==='up'?'THUẬN LỢI':d.kind==='down'?'BẤT LỢI':'PHÁT SINH';
 const outcome=d.kind==='up'?'good':d.kind==='down'?'bad':'neutral';
 const voteMsg=r.unvoted?'Không có phiếu: chọn phương án 2 mặc định.':r.tied?'Đồng phiếu: đã bốc thăm giữa các lựa chọn dẫn đầu.':'';
 return `<article class="outcome-card ${r.team==='B'?'b':''}">
  <div class="outcome-top"><div><span class="eyebrow">🍜 QUÁN ${r.team} · ${situation}</span><div class="outcome-money ${f.profit<0?'moneynegative':''}">${f.profit>0?'+':''}${mil(f.profit)}</div><span class="label">Lãi/lỗ vòng ${r.round} · Tích lũy ${mil(f.cumulative)}</span></div><span class="outcome-kind ${outcome}">${d.kind==='up'?'↗ TỐT':d.kind==='down'?'↘ XẤU':'→ VỪA'}</span></div>
  <div class="outcome-decision"><small>QUYẾT ĐỊNH ĐƯỢC CHỌN</small><strong>${e(r.decision)}</strong></div>
  <div class="outcome-event"><small>🎲 BIẾN CỐ</small><h3>${e(d.title)}</h3><p>${e(d.description)}</p></div>
  <div class="result-numbers"><div><small>Bán thực tế</small><b>${num(f.sold)} bát</b><span>Công suất: ${num(a.capacity)} bát</span></div><div><small>Khách muốn mua</small><b>${num(f.potential)} bát</b><span>${f.unserved>0?num(f.unserved)+' khách chưa phục vụ':'Đã đáp ứng đủ'}</span></div><div><small>Hài lòng</small><b>${a.satisfaction}%</b><span class="${satDiff>=0?'status-good':'status-bad'}">${difference(satDiff)} điểm</span></div><div><small>Uy tín</small><b>${a.reputation}%</b><span class="${repDiff>=0?'status-good':'status-bad'}">${difference(repDiff)} điểm</span></div></div>
  <p class="lesson-brief"><b>📚 Bài học:</b> ${e(r.lesson)}</p>
  ${voteMsg?`<p class="muted">${e(voteMsg)}</p>`:''}
  ${showDetails?`<details class="details-box"><summary>📊 Xem chi tiết cách tính & tác động dài hạn</summary><div class="details-inner">${resultCard(r)}</div></details>`:''}
 </article>`;
}
function resultsPair(state,ownTeam=null,showDetails=true){const last=state.last||{};return `<div class="reports compact-reports">${(ownTeam?[ownTeam]:['A','B']).map(t=>compactResultCard(last[t],showDetails)).join('')}</div>`}
function roundVerdict(state){
 const a=state.last?.A?.financial?.profit,b=state.last?.B?.financial?.profit;
 if(typeof a!=='number'||typeof b!=='number')return '';
 if(a===b)return '<span class="round-verdict">🤝 Hai quán hòa nhau về lợi nhuận vòng này</span>';
 return `<span class="round-verdict">🏁 Quán ${a>b?'A':'B'} lãi cao hơn trong vòng này</span>`;
}
function resultMiniScoreboard(state){return `<div class="mini-scores">${state.teams.map(t=>{const f=t.finance;return `<div class="mini-score ${t.id==='B'?'b':''}"><span>🍜 QUÁN ${t.id} · ${t.count} người chơi</span><strong>${mil(f.cumulative)}</strong><small>${num(f.sold)} bát đã bán · ${money(f.price)}/bát · Hài lòng ${f.satisfaction}%</small></div>`}).join('')}</div>`}

function endView(state){const a=state.teams.find(t=>t.id==='A').finance.cumulative,b=state.teams.find(t=>t.id==='B').finance.cumulative;const win=state.winner==='DRAW'?'HAI PHE HÒA NHAU':`QUÁN ${state.winner} CHIẾN THẮNG!`;return `<div class="winner"><p class="eyebrow">HẾT 4 VÒNG KINH DOANH</p><h1>🏆 ${win}</h1><p>Lợi nhuận tích lũy</p><div class="grid2">${metric('🍜 Quán A',money(a))}${metric('🍜 Quán B',money(b))}</div><p class="muted">Kết quả dựa trên lợi nhuận tích lũy sau 4 tháng giả định. Bảng điểm không thay thế việc phân tích chất lượng quyết định.</p></div>`}
function bottomNote(){return `<footer class="footer">PHỞ ĐẠI CHIẾN V7.2 · Mô phỏng giáo dục dựa trên quản trị chi phí chuỗi giá trị của Michael Porter · Số liệu, xác suất và sự kiện đều là giả định · Mỗi vòng tương ứng 1 tháng.</footer>`}
function toast(message){let node=document.querySelector('.toast');if(node)node.remove();node=document.createElement('div');node.className='toast';node.textContent=message;document.body.appendChild(node);setTimeout(()=>node.remove(),3900)}
