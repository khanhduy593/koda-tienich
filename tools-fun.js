/* VietQR, xúc xắc, vòng quay may mắn, hỏi đáp vui, trò chơi */
(function(){
'use strict';
const {$,$$,store,esc,fmt,f,rr,live,dv,rnd,tabs,TOOLS}=TI;
const mv=el=>parseInt(String(el.value).replace(/\D/g,''))||0;
const noAccent=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888';

/* ================= VietQR ================= */
const BANKS=[['ACB','970416'],['Agribank','970405'],['BIDV','970418'],['Bac A Bank','970409'],['BaoViet Bank','970438'],['BVBank (Bản Việt)','970454'],['CAKE','546034'],['CBBank','970444'],['Co-opBank','970446'],['Đông Á Bank','970406'],['Eximbank','970431'],['GPBank','970408'],['HDBank','970437'],['Hong Leong','970442'],['HSBC','458761'],['Indovina','970434'],['Kiên Long Bank','970452'],['LPBank','970449'],['MB Bank','970422'],['MSB','970426'],['Nam A Bank','970428'],['NCB','970419'],['OCB','970448'],['PG Bank','970430'],['Public Bank','970439'],['PVcomBank','970412'],['Sacombank','970403'],['Saigonbank','970400'],['SCB','970429'],['SeABank','970440'],['SHB','970443'],['Shinhan','970424'],['Standard Chartered','970410'],['Techcombank','970407'],['Timo','963388'],['TPBank','970423'],['UBank','546035'],['VIB','970441'],['VietABank','970425'],['VietBank','970433'],['Vietcombank','970436'],['VietinBank','970415'],['VPBank','970432'],['VRB','970421'],['Woori','970457']];
const tlv=(id,v)=>id+String(v.length).padStart(2,'0')+v;
function crc16(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let k=0;k<8;k++)c=(c&0x8000)?(((c<<1)^0x1021)&0xFFFF):((c<<1)&0xFFFF)}return c.toString(16).toUpperCase().padStart(4,'0')}
function vietqr(bin,acc,amount,msg){
  const m=tlv('00','A000000727')+tlv('01',tlv('00',bin)+tlv('01',acc))+tlv('02','QRIBFTTA');
  let p=tlv('00','01')+tlv('01',amount?'12':'11')+tlv('38',m)+tlv('53','704')+(amount?tlv('54',String(amount)):'')+tlv('58','VN')+(msg?tlv('62',tlv('08',msg)):'');
  p+='6304';return p+crc16(p);
}
TI.vietqr=vietqr;TI.crc16=crc16;
function vietqrTool(el){
  const last=store.get('vqr_last',{bin:'970436',acc:'',name:'',amt:'',msg:''});
  el.innerHTML=f('Ngân hàng','<select id="b">'+BANKS.map(b=>`<option value="${b[1]}">${esc(b[0])}</option>`).join('')+'</select>')+
   f('Số tài khoản','<input id="a" inputmode="numeric" autocomplete="off" placeholder="Chỉ gồm chữ số">')+
   f('Tên chủ tài khoản (tự điền nếu đã lưu, hiện dưới mã QR)','<input id="n" autocomplete="off" placeholder="Ví dụ: Nguyễn Văn A">')+
   f('Số tiền (đ) — bỏ trống nếu để người chuyển tự nhập','<input class="money" id="m" inputmode="numeric" placeholder="0">')+
   f('Nội dung chuyển khoản (tối đa 50 ký tự)','<input id="c" maxlength="50" autocomplete="off" placeholder="Ví dụ: Tien an toi">')+
   '<div class="qr" id="q"></div><div class="res" id="info" style="margin-bottom:12px"></div><div class="row eq"><button class="btn" id="sv">Lưu ảnh</button><button class="btn ghost" id="ac">Lưu tài khoản</button></div>'+
   '<div id="sl"></div><div class="note">Mã tạo ngay trên máy bạn, không gửi đi đâu. Trước khi dùng thật, hãy thử quét bằng app ngân hàng với số tiền nhỏ để chắc chắn đúng. Nội dung sẽ được bỏ dấu tiếng Việt để app ngân hàng đọc được.</div>';
  $('#b',el).value=last.bin;$('#a',el).value=last.acc;$('#n',el).value=last.name;$('#m',el).value=last.amt?Number(last.amt).toLocaleString('vi-VN'):'';$('#c',el).value=last.msg;
  let cv=null;const sv=$('#sv',el);
  const bankName=b=>(BANKS.find(x=>x[1]===b)||['?'])[0];
  const drawSaved=()=>{const L=store.get('vqr_saved',[]);$('#sl',el).innerHTML=L.length?`<h2>Tài khoản đã lưu</h2><div class="card">${L.map(x=>`<div class="li go" data-id="${x.id}"><div class="t"><b>${esc(x.name||bankName(x.bin))}</b><div class="mut small">${esc(bankName(x.bin))} · ${esc(x.acc)}</div></div><button class="x" data-x="${x.id}" aria-label="Xóa">×</button></div>`).join('')}</div>`:''};
  live(el,()=>{
    const bin=$('#b',el).value,acc=$('#a',el).value.replace(/\D/g,''),amt=mv($('#m',el)),msg=noAccent($('#c',el).value.trim()).replace(/[^\x20-\x7E]/g,'').slice(0,50),q=$('#q',el),inf=$('#info',el);
    const nf=$('#n',el);if(!nf.value.trim()&&acc.length>=6){const sv0=store.get('vqr_saved',[]).find(x=>x.bin===bin&&x.acc===acc&&x.name);if(sv0)nf.value=sv0.name}
    store.set('vqr_last',{bin,acc,name:$('#n',el).value,amt,msg:$('#c',el).value});
    const ok=acc.length>=6&&acc.length<=19&&amt<=9999999999999;
    if(!ok){cv=null;sv.disabled=true;q.innerHTML='<div style="text-align:center;color:#555;padding:48px 0;font-size:14px">Nhập số tài khoản (6–19 chữ số) để tạo mã</div>';inf.innerHTML='';return}
    try{cv=TI.qrCanvas(vietqr(bin,acc,amt,msg));const im=new Image();im.alt='Mã VietQR';im.src=cv.toDataURL('image/png');q.innerHTML='';q.appendChild(im);sv.disabled=false}
    catch(e){cv=null;sv.disabled=true;q.innerHTML='<div style="text-align:center;color:#555;padding:48px 0;font-size:14px">Không tạo được mã</div>';return}
    inf.innerHTML=rr('Ngân hàng',esc(bankName(bin)))+rr('Số tài khoản',esc(acc))+($('#n',el).value.trim()?rr('Chủ tài khoản',esc($('#n',el).value.trim())):'')+rr('Số tiền',amt?fmt(amt)+' đ':'Người chuyển tự nhập')+(msg?rr('Nội dung',esc(msg)):'');
  });
  sv.onclick=async()=>{if(cv){try{await TI.saveQR(cv)}catch(e){}}};
  $('#ac',el).onclick=()=>{const acc=$('#a',el).value.replace(/\D/g,'');if(acc.length<6)return;const L=store.get('vqr_saved',[]).filter(x=>!(x.bin===$('#b',el).value&&x.acc===acc));L.unshift({id:Date.now(),bin:$('#b',el).value,acc,name:$('#n',el).value.trim()});store.set('vqr_saved',L.slice(0,12));drawSaved();$('#ac',el).textContent='Đã lưu ✓';setTimeout(()=>$('#ac',el).textContent='Lưu tài khoản',1200)};
  $('#sl',el).onclick=e=>{const x=e.target.closest('[data-x]');const L=store.get('vqr_saved',[]);
    if(x){store.set('vqr_saved',L.filter(v=>v.id!=x.dataset.x));drawSaved();return}
    const r=e.target.closest('.go');if(r){const v=L.find(v=>v.id==r.dataset.id);if(v){$('#b',el).value=v.bin;$('#a',el).value=v.acc;$('#n',el).value=v.name||'';$('#a',el).dispatchEvent(new Event('input',{bubbles:true}));window.scrollTo({top:0,behavior:'smooth'})}}};
  drawSaved();
}

/* ================= Xúc xắc & đồng xu ================= */
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const dieHTML=v=>`<div class="die" data-v="${v}">${Array.from({length:9},(_,i)=>`<i${PIPS[v].includes(i)?' class="p"':''}></i>`).join('')}</div>`;
function diceTool(el){tabs(el,[['Xúc xắc',dicePane],['Đồng xu',coinPane]])}
function dicePane(p){
  let n=store.get('dice_n',2),busy=false,hist=store.get('dice_h',[]);
  const draw=()=>{
    p.innerHTML=`<div class="chips" id="dn">${[1,2,3,4,5,6].map(i=>`<button class="chip2${i===n?' on':''}" data-n="${i}">${i} viên</button>`).join('')}</div><div class="dice-area card" id="da">${Array.from({length:n},()=>dieHTML(1+rnd(6))).join('')}</div><div class="center-sum" id="ds">Bấm “Tung” để bắt đầu</div><button class="btn full" id="roll">🎲 Tung</button>${hist.length?`<h2>Các lần tung gần đây</h2><div class="card">${hist.map(h=>`<div class="rr"><span>${h.d.join(' · ')}</span><b>${h.s}</b></div>`).join('')}</div>`:''}`;
  };
  draw();
  p.onclick=async e=>{
    const c=e.target.closest('[data-n]');if(c&&!busy){n=+c.dataset.n;store.set('dice_n',n);draw();return}
    if(!e.target.closest('#roll')||busy)return;
    busy=true;const da=$('#da',p),t0=Date.now(),T=2100,rb=$('#roll',p),ds=$('#ds',p);da.classList.add('rolling');rb.disabled=true;ds.textContent='Đang lắc…';
    await new Promise(r=>{const tick=()=>{if(!p.isConnected)return r();const el=Date.now()-t0;da.innerHTML=Array.from({length:n},()=>dieHTML(1+rnd(6))).join('');
      if(el>T*0.6)ds.textContent='Sắp ra rồi…';
      if(el>=T)return r();setTimeout(tick,60+Math.round(160*Math.pow(el/T,2)))};tick()});
    if(!p.isConnected||!$('#da',p)||$('#da',p)!==da){busy=false;return}
    const res=Array.from({length:n},()=>1+rnd(6));da.classList.remove('rolling');rb.disabled=false;da.innerHTML=res.map(dieHTML).join('');da.classList.add('landed');setTimeout(()=>da.classList.remove('landed'),300);
    const s=res.reduce((a,b)=>a+b,0);$('#ds',p).innerHTML=n>1?`Tổng: <b>${s}</b>`:`Ra mặt <b>${s}</b>`;
    hist=[{d:res,s},...hist].slice(0,6);store.set('dice_h',hist);busy=false;
    const h=$('h2',p);if(!h){draw();const a=$('#da',p);a.innerHTML=res.map(dieHTML).join('');$('#ds',p).innerHTML=n>1?`Tổng: <b>${s}</b>`:`Ra mặt <b>${s}</b>`}
    else{const card=h.nextElementSibling;card.innerHTML=hist.map(x=>`<div class="rr"><span>${x.d.join(' · ')}</span><b>${x.s}</b></div>`).join('')}
  };
}
function coinPane(p){
  let rot=0,busy=false,cnt=store.get('coin_c',{u:0,d:0});
  p.innerHTML=`<div class="coin-wrap"><div class="coin" id="co"><div class="face f1">NGỬA</div><div class="face f2">SẤP</div></div></div><div class="center-sum" id="cr">Bấm “Tung” để tung đồng xu</div><button class="btn full" id="cf">🪙 Tung</button><div class="note" id="cc"></div>`;
  const cc=()=>{$('#cc',p).textContent=`Tổng cộng: Ngửa ${cnt.u} lần · Sấp ${cnt.d} lần`};cc();
  $('#cf',p).onclick=()=>{
    if(busy)return;busy=true;const up=rnd(2)===0,co=$('#co',p);
    rot=Math.ceil(rot/360)*360+1800+(up?0:180);co.style.transform=`rotateY(${rot}deg)`;$('#cr',p).textContent='Đang tung…';$('#cf',p).disabled=true;setTimeout(()=>{if(busy&&p.isConnected)$('#cr',p).textContent='Sắp ra rồi…'},1500);
    setTimeout(()=>{if(!p.isConnected)return;if(up)cnt.u++;else cnt.d++;store.set('coin_c',cnt);$('#cr',p).innerHTML=`Ra mặt <b>${up?'NGỬA':'SẤP'}</b>`;cc();busy=false;$('#cf',p).disabled=false},2250);
  };
}

/* ================= Vòng quay may mắn ================= */
function wheelTool(el){
  let items=store.get('wheel_items',['Phở','Bún chả','Cơm tấm','Bánh mì','Lẩu','Mì Quảng']),ang=0,spin=false,raf=0;
  el.innerHTML=`<div class="wheelwrap"><div class="ptr"></div><canvas id="wc" width="640" height="640"></canvas><button class="wspin" id="sp">QUAY</button></div><div class="card wres" id="wr">Bấm QUAY để chọn</div>
  <label class="f"><span>Danh sách (mỗi dòng một mục, từ 2 đến 24 mục)</span><textarea id="wl" style="min-height:120px"></textarea></label>
  <div class="card"><label class="li"><input type="checkbox" id="rm" ${store.get('wheel_rm',false)?'checked':''}><span class="t">Loại bỏ mục vừa trúng khỏi vòng quay</span></label></div>`;
  const cv=$('#wc',el),ctx=cv.getContext('2d'),wl=$('#wl',el),sp=$('#sp',el);wl.value=items.join('\n');
  const parse=()=>wl.value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,24);
  function draw(){
    const n=items.length,R=320,c=getComputedStyle(document.documentElement),AC=css('--ac'),CARD=css('--card'),LINE=css('--line'),TX=css('--tx'),ON=css('--onac');
    ctx.clearRect(0,0,640,640);ctx.save();ctx.translate(R,R);
    if(n<2){ctx.fillStyle=CARD;ctx.beginPath();ctx.arc(0,0,R-6,0,7);ctx.fill();ctx.strokeStyle=LINE;ctx.lineWidth=4;ctx.stroke();ctx.fillStyle=css('--mut');ctx.font='700 28px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('Thêm ít nhất 2 mục',0,10);ctx.restore();return}
    const a=Math.PI*2/n;
    for(let i=0;i<n;i++){
      const s=ang+i*a;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R-6,s,s+a);ctx.closePath();
      const odd=i%2===1,last=n%2===1&&i===n-1;ctx.fillStyle=last?LINE:odd?CARD:AC;ctx.fill();ctx.strokeStyle=LINE;ctx.lineWidth=3;ctx.stroke();
      ctx.save();ctx.rotate(s+a/2);ctx.textAlign='right';ctx.fillStyle=(last||odd)?TX:ON;ctx.font=`800 ${n>14?22:n>9?26:30}px Nunito,sans-serif`;
      let t=items[i];if(t.length>13)t=t.slice(0,12)+'…';ctx.fillText(t,R-34,10);ctx.restore();
    }
    ctx.beginPath();ctx.arc(0,0,R-6,0,7);ctx.strokeStyle=AC;ctx.lineWidth=8;ctx.stroke();ctx.restore();
  }
  const winner=()=>{const n=items.length,a=Math.PI*2/n;let t=(-Math.PI/2-ang)%(Math.PI*2);if(t<0)t+=Math.PI*2;return Math.min(n-1,Math.floor(t/a))};
  wl.oninput=()=>{items=parse();store.set('wheel_items',items);ang=0;draw();sp.disabled=items.length<2};
  $('#rm',el).onchange=e=>store.set('wheel_rm',e.target.checked);
  sp.onclick=()=>{
    if(spin||items.length<2)return;spin=true;sp.disabled=true;$('#wr',el).textContent='…';
    const start=ang,total=Math.PI*2*(5+Math.random()*2)+Math.random()*Math.PI*2,D=3400,t0=performance.now();
    const step=t=>{const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);ang=start+total*e;draw();
      if(k<1&&el.isConnected){raf=requestAnimationFrame(step);return}
      spin=false;if(!el.isConnected)return;const w=items[winner()];
      const r=$('#wr',el);r.innerHTML=`🎉 <b>${esc(w)}</b>`;r.classList.remove('pop');void r.offsetWidth;r.classList.add('pop');
      if($('#rm',el).checked&&items.length>2){setTimeout(()=>{const i=items.indexOf(w);if(i>=0){items.splice(i,1);wl.value=items.join('\n');store.set('wheel_items',items);draw()}sp.disabled=items.length<2},900)}else sp.disabled=false;
    };
    raf=requestAnimationFrame(step);
  };
  TI.cleanups.push(()=>cancelAnimationFrame(raf));
  sp.disabled=items.length<2;draw();
}

/* ================= Hỏi đáp vui ================= */
const QZ=[
['Thủ đô của Việt Nam là thành phố nào?',['Hà Nội','Huế','Đà Nẵng','Hải Phòng'],'Hà Nội là thủ đô của Việt Nam.'],
['Đỉnh núi cao nhất Việt Nam là?',['Fansipan','Bạch Mã','Ngọc Linh','Tam Đảo'],'Fansipan cao khoảng 3.143 m, được gọi là “nóc nhà Đông Dương”.'],
['Hang động tự nhiên lớn nhất thế giới ở Quảng Bình có tên là?',['Sơn Đoòng','Phong Nha','Thiên Đường','Tú Làn'],'Hang Sơn Đoòng nằm trong Vườn quốc gia Phong Nha – Kẻ Bàng.'],
['Vịnh Hạ Long thuộc tỉnh nào?',['Quảng Ninh','Hải Phòng','Thanh Hóa','Nghệ An'],'Vịnh Hạ Long thuộc tỉnh Quảng Ninh.'],
['Việt Nam có hình dáng giống chữ cái nào?',['S','C','M','L'],'Dải đất hình chữ S.'],
['Ngày Quốc khánh của Việt Nam là ngày nào?',['2/9','30/4','1/5','19/8'],'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.'],
['Ngày 30/4 là ngày kỷ niệm gì?',['Giải phóng miền Nam, thống nhất đất nước','Quốc tế Lao động','Quốc khánh','Chiến thắng Điện Biên Phủ'],'30/4/1975 là ngày Giải phóng miền Nam.'],
['Ngày Phụ nữ Việt Nam là ngày nào?',['20/10','8/3','20/11','1/6'],'20/10 là Ngày Phụ nữ Việt Nam, còn 8/3 là Quốc tế Phụ nữ.'],
['Ngày Nhà giáo Việt Nam là ngày nào?',['20/11','20/10','15/8','10/3'],'20/11 hằng năm là Ngày Nhà giáo Việt Nam.'],
['Tết Trung thu rơi vào ngày nào âm lịch?',['15/8','15/7','5/5','1/1'],'Tết Trung thu là rằm tháng Tám.'],
['Tết Đoan Ngọ (giết sâu bọ) là ngày nào âm lịch?',['5/5','15/1','3/3','9/9'],'Tết Đoan Ngọ vào mùng 5 tháng 5 âm lịch.'],
['Giỗ Tổ Hùng Vương là ngày nào âm lịch?',['10/3','15/3','1/4','5/5'],'Giỗ Tổ Hùng Vương vào mùng 10 tháng 3 âm lịch.'],
['Ai là tác giả của Truyện Kiều?',['Nguyễn Du','Nguyễn Trãi','Hồ Xuân Hương','Nguyễn Đình Chiểu'],'Truyện Kiều là kiệt tác của đại thi hào Nguyễn Du.'],
['Truyền thuyết bánh chưng, bánh giầy gắn với nhân vật nào?',['Lang Liêu','Sơn Tinh','Thánh Gióng','Chử Đồng Tử'],'Hoàng tử Lang Liêu dâng bánh chưng, bánh giầy lên vua Hùng.'],
['Thành phố Hồ Chí Minh trước đây có tên là gì?',['Sài Gòn','Gia Định thành phố','Phú Xuân','Thăng Long'],'Sài Gòn được đổi tên thành Thành phố Hồ Chí Minh năm 1976.'],
['Hoa nào thường được xem là quốc hoa của Việt Nam?',['Hoa sen','Hoa đào','Hoa mai','Hoa cúc'],'Hoa sen tượng trưng cho sự thanh cao, thường được xem là quốc hoa.'],
['Con giáp đứng đầu trong 12 con giáp là?',['Tý (chuột)','Sửu (trâu)','Dần (hổ)','Mão (mèo)'],'Thứ tự bắt đầu từ Tý, Sửu, Dần, Mão…'],
['Một lượng vàng bằng bao nhiêu chỉ?',['10 chỉ','5 chỉ','12 chỉ','100 chỉ'],'1 lượng = 10 chỉ = 37,5 gam.'],
['Một chỉ vàng nặng khoảng bao nhiêu gam?',['3,75 gam','1 gam','5 gam','37,5 gam'],'1 chỉ ≈ 3,75 gam.'],
['Một tá là bao nhiêu cái?',['12','10','20','24'],'Một tá là 12.'],
['Một năm nhuận (dương lịch) có bao nhiêu ngày?',['366','365','364','367'],'Năm nhuận thêm ngày 29/2 nên có 366 ngày.'],
['Tháng nào trong năm có 28 ngày?',['Tất cả các tháng','Chỉ tháng 2','Không tháng nào','Tháng 2 và tháng 4'],'Tháng nào cũng có ít nhất 28 ngày, không riêng gì tháng 2!'],
['Cầu vồng thường được kể có mấy màu?',['7','5','6','8'],'Đỏ, cam, vàng, lục, lam, chàm, tím.'],
['Hành tinh nào gần Mặt Trời nhất?',['Sao Thủy','Sao Kim','Trái Đất','Sao Hỏa'],'Sao Thủy là hành tinh gần Mặt Trời nhất.'],
['Hành tinh nào lớn nhất Hệ Mặt Trời?',['Sao Mộc','Sao Thổ','Sao Hải Vương','Trái Đất'],'Sao Mộc lớn nhất trong Hệ Mặt Trời.'],
['Đại dương nào lớn nhất thế giới?',['Thái Bình Dương','Đại Tây Dương','Ấn Độ Dương','Bắc Băng Dương'],'Thái Bình Dương chiếm khoảng một phần ba bề mặt Trái Đất.'],
['Kí hiệu hóa học của vàng là gì?',['Au','Ag','Fe','Go'],'Au (từ chữ Latin “aurum”).'],
['Công thức hóa học của nước là gì?',['H₂O','CO₂','O₂','NaCl'],'Mỗi phân tử nước có 2 nguyên tử hydro và 1 nguyên tử oxy.'],
['Thực vật hấp thụ khí nào khi quang hợp?',['Khí cacbonic (CO₂)','Khí oxy (O₂)','Khí nitơ (N₂)','Khí hydro (H₂)'],'Cây hấp thụ CO₂ và thải ra oxy.'],
['Bộ phận nào của cơ thể bơm máu đi khắp nơi?',['Tim','Phổi','Gan','Thận'],'Tim co bóp liên tục để đẩy máu đi nuôi cơ thể.'],
['Số nguyên tố nhỏ nhất là số nào?',['2','1','3','0'],'2 là số nguyên tố nhỏ nhất và là số nguyên tố chẵn duy nhất.'],
['12 × 12 bằng bao nhiêu?',['144','124','122','132'],'12 × 12 = 144.'],
['Loài vật nào cao nhất thế giới?',['Hươu cao cổ','Voi','Đà điểu','Lạc đà'],'Hươu cao cổ có thể cao gần 6 mét.'],
['Loài chim nào sống ở Nam Cực và không biết bay?',['Chim cánh cụt','Đại bàng','Hải âu','Chim cú'],'Chim cánh cụt bơi rất giỏi nhưng không bay được.'],
['Tháp Eiffel nằm ở nước nào?',['Pháp','Ý','Anh','Đức'],'Tháp Eiffel ở thủ đô Paris, nước Pháp.'],
['Kim tự tháp Giza nổi tiếng nằm ở nước nào?',['Ai Cập','Mexico','Peru','Hy Lạp'],'Kim tự tháp Giza ở gần thủ đô Cairo, Ai Cập.'],
['Thủ đô của Nhật Bản là?',['Tokyo','Osaka','Kyoto','Hiroshima'],'Tokyo là thủ đô của Nhật Bản.'],
['Thủ đô của Hàn Quốc là?',['Seoul','Busan','Incheon','Daegu'],'Seoul là thủ đô của Hàn Quốc.'],
['Thủ đô của Thái Lan là?',['Bangkok','Chiang Mai','Phuket','Pattaya'],'Bangkok là thủ đô của Thái Lan.'],
['Năm 2026 theo âm lịch là năm con gì?',['Ngựa (Bính Ngọ)','Rắn (Ất Tỵ)','Dê (Đinh Mùi)','Khỉ (Mậu Thân)'],'2026 là năm Bính Ngọ, tuổi Ngựa.']
];
function quizTool(el){
  let qs=[],i=0,score=0,locked=false;
  const best=()=>store.get('quiz_best',0);
  const start=()=>{qs=shuf(QZ).slice(0,10).map(x=>({q:x[0],o:shuf(x[1].map((t,k)=>({t,ok:k===0}))),e:x[2]}));i=0;score=0;show()};
  function home(){el.innerHTML=`<div class="koda-hi" style="padding-top:10px">${TI.kodaSVG?TI.kodaSVG(72):''}<h3>Hỏi đáp vui</h3><div class="mut">10 câu hỏi ngẫu nhiên, chọn 1 trong 4 đáp án.</div></div><div class="res">${rr('Điểm cao nhất',best()?best()+'/10':'Chưa chơi')}</div><button class="btn full" id="go" style="margin-top:14px">Bắt đầu chơi</button><div class="note">Có ${QZ.length} câu hỏi về Việt Nam, khoa học và đời sống. Mỗi lượt chơi lấy ngẫu nhiên 10 câu.</div>`;$('#go',el).onclick=start}
  function show(){
    const q=qs[i];locked=false;
    el.innerHTML=`<div class="qz-top"><span>Câu ${i+1}/10</span><span>Điểm: <b>${score}</b></span></div><div class="wcup"><div style="width:${i/10*100}%"></div></div><div class="card qz-q">${esc(q.q)}</div><div class="ql" id="qo">${q.o.map((o,k)=>`<button class="qrow" data-k="${k}"><span>${esc(o.t)}</span><i></i></button>`).join('')}</div><div id="qe"></div>`;
    $('#qo',el).onclick=e=>{const b=e.target.closest('[data-k]');if(!b||locked)return;locked=true;
      const k=+b.dataset.k,ok=q.o[k].ok;if(ok)score++;
      $$('#qo .qrow',el).forEach((r,j)=>{r.classList.add(q.o[j].ok?'right':(j===k?'wrong':'dim'));r.querySelector('i').textContent=q.o[j].ok?'✓':(j===k?'✕':'')});
      $('#qe',el).innerHTML=`<div class="card qz-ex ${ok?'okk':''}"><b>${ok?'Chính xác! 🎉':'Chưa đúng rồi 😅'}</b><div>${esc(q.e)}</div></div><button class="btn full" id="nx">${i<9?'Câu tiếp ›':'Xem kết quả'}</button>`;
      $('#nx',el).onclick=()=>{i++;i<10?show():end()};
      requestAnimationFrame(()=>$('#nx',el)&&$('#nx',el).scrollIntoView({block:'nearest',behavior:'smooth'}));
    };
  }
  function end(){
    const nb=score>best();if(nb)store.set('quiz_best',score);
    el.innerHTML=`<div class="koda-hi" style="padding-top:14px"><div class="big">${score}/10</div><h3>${score>=9?'Xuất sắc! 🏆':score>=7?'Giỏi lắm! 👏':score>=5?'Khá tốt! 🙂':'Cố gắng lần sau nhé 💪'}</h3>${nb&&score>0?'<div class="chip">🎖️ Kỷ lục mới</div>':''}</div><div class="res">${rr('Điểm cao nhất',best()+'/10')}</div><div class="row eq" style="margin-top:14px"><button class="btn" id="again">Chơi lại</button><button class="btn ghost" id="hm">Về đầu</button></div>`;
    $('#again',el).onclick=start;$('#hm',el).onclick=home;
  }
  home();
}

/* ================= Trò chơi: Lật hình, 2048 ================= */
function gamesTool(el){tabs(el,[['Lật hình',memoryPane],['2048',g2048Pane]])}
const EMO=['🍎','🍌','🍇','🍓','🍉','🥑','🍒','🍍','🥕','🌽','🍔','🍕','🍩','🍪','🍦','🥭'];
function memoryPane(p){
  let cards,open=[],lock=false,moves=0,found=0,t0=0,timer=0;
  const best=()=>store.get('mem_best',0);
  const fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  function init(){
    clearInterval(timer);timer=0;t0=0;moves=0;found=0;open=[];lock=false;
    const e=shuf(EMO).slice(0,8);cards=shuf([...e,...e]);
    p.innerHTML=`<div class="qz-top"><span>Lượt: <b id="mv">0</b></span><span>Thời gian: <b id="tm">0:00</b></span><span>Tốt nhất: ${best()?best()+' lượt':'—'}</span></div><div class="mem" id="mb">${cards.map((c,i)=>`<button class="mc" data-i="${i}" aria-label="Thẻ ${i+1}"><span class="in"><span class="bk">?</span><span class="fr">${c}</span></span></button>`).join('')}</div><div id="mm"></div><button class="btn ghost full" id="nw" style="margin-top:12px">Ván mới</button>`;
    $('#nw',p).onclick=init;
  }
  init();
  TI.cleanups.push(()=>clearInterval(timer));
  p.onclick=e=>{
    const c=e.target.closest('.mc');if(!c||lock||c.classList.contains('open')||c.classList.contains('ok'))return;
    if(!t0){t0=Date.now();timer=setInterval(()=>{const m=$('#tm',p);if(!m){clearInterval(timer);return}m.textContent=fmtT(Math.round((Date.now()-t0)/1000))},500)}
    c.classList.add('open');open.push(c);
    if(open.length===2){moves++;$('#mv',p).textContent=moves;
      const [a,b]=open;
      if(cards[+a.dataset.i]===cards[+b.dataset.i]){a.classList.add('ok');b.classList.add('ok');open=[];found++;
        if(found===8){clearInterval(timer);const s=Math.round((Date.now()-t0)/1000),nb=!best()||moves<best();if(nb)store.set('mem_best',moves);
          $('#mm',p).innerHTML=`<div class="card qz-ex okk" style="margin-top:12px"><b>Hoàn thành! 🎉</b><div>${moves} lượt, ${fmtT(s)}${nb?' · Kỷ lục mới 🎖️':''}</div></div>`}}
      else{lock=true;setTimeout(()=>{a.classList.remove('open');b.classList.remove('open');open=[];lock=false},650)}}
  };
}
function g2048Pane(p){
  const N=4,MS=140;let g,score=0,over=false,won=false,busy=false,T=[];
  const best=()=>store.get('g2048_best',0);
  const save=()=>store.set('g2048',{g,score,over,won});
  const st=store.get('g2048',null);
  if(st&&st.g&&st.g.length===N)({g,score,over,won}=st);else{g=Array.from({length:N},()=>Array(N).fill(0));score=0;over=false;won=false;g[0][0]=0}
  p.innerHTML=`<div class="qz-top"><span class="scw">Điểm: <b id="sc">0</b><i class="gain" id="gn"></i></span><span>Cao nhất: <b id="bs">0</b></span><button class="chip2" id="nw">Ván mới</button></div><div class="b2048" id="bd"></div><div id="msg2"></div><div class="note">Vuốt trên bảng để dồn các ô về một phía. Hai ô cùng số sẽ gộp lại. Cố gắng tạo ra ô 2048!</div>`;
  const bd=$('#bd',p);
  const cls=v=>'tile2 t'+Math.min(v,2048);
  function mk(v,r,c,extra){const el=document.createElement('div');el.className=cls(v)+(extra?' '+extra:'');el.style.setProperty('--r',r);el.style.setProperty('--c',c);el.textContent=v;bd.appendChild(el);const t={v,r,c,el};T.push(t);return t}
  function place(t,r,c){t.r=r;t.c=c;t.el.style.setProperty('--r',r);t.el.style.setProperty('--c',c)}
  function drop(t){t.el.remove();T=T.filter(x=>x!==t)}
  function toG(){g=Array.from({length:N},()=>Array(N).fill(0));T.forEach(t=>{g[t.r][t.c]=t.v})}
  function addRandom(){const e=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!g[r][c])e.push([r,c]);if(!e.length)return;const [r,c]=e[rnd(e.length)],v=rnd(10)?2:4;g[r][c]=v;mk(v,r,c,'new')}
  function stats(){$('#sc',p).textContent=score;if(score>best())store.set('g2048_best',score);$('#bs',p).textContent=best();
    $('#msg2',p).innerHTML=over?'<div class="card qz-ex" style="margin-top:12px"><b>Hết nước đi 😅</b><div>Bấm “Ván mới” để chơi lại.</div></div>':(won?'<div class="card qz-ex okk" style="margin-top:12px"><b>Bạn đã đạt 2048! 🎉</b><div>Có thể chơi tiếp để lấy điểm cao hơn.</div></div>':'')}
  function setup(fresh){bd.innerHTML=Array.from({length:16},()=>'<div class="cell"></div>').join('');T=[];
    if(fresh){g=Array.from({length:N},()=>Array(N).fill(0));score=0;over=false;won=false;addRandom();addRandom()}
    else g.forEach((row,r)=>row.forEach((v,c)=>{if(v)mk(v,r,c)}));
    if(!T.length){addRandom();addRandom()}toG();save();stats()}
  const can=()=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!g[r][c])return true;if(c<N-1&&g[r][c]===g[r][c+1])return true;if(r<N-1&&g[r][c]===g[r+1][c])return true}return false};
  function move(d){ // 0 trái,1 phải,2 lên,3 xuống
    if(over||busy)return;const ref=Array.from({length:N},()=>Array(N).fill(null));T.forEach(t=>{ref[t.r][t.c]=t});
    let moved=false,gain=0;const merges=[];
    const rc=(k,j)=>d<2?[k,d===0?j:N-1-j]:[d===2?j:N-1-j,k];
    for(let k=0;k<N;k++){
      const x=[];for(let j=0;j<N;j++){const [r,c]=rc(k,j);if(ref[r][c])x.push(ref[r][c])}
      let pos=0;
      for(let i=0;i<x.length;i++){const [r,c]=rc(k,pos);
        if(x[i+1]&&x[i].v===x[i+1].v){const v=x[i].v*2;gain+=v;if(x[i].r!==r||x[i].c!==c||x[i+1].r!==r||x[i+1].c!==c)moved=true;
          place(x[i],r,c);place(x[i+1],r,c);merges.push([x[i],x[i+1],v,r,c]);i++}
        else{if(x[i].r!==r||x[i].c!==c)moved=true;place(x[i],r,c)}
        pos++}
    }
    if(!moved)return;busy=true;score+=gain;
    setTimeout(()=>{if(!p.isConnected)return;
      merges.forEach(([a,b,v,r,c])=>{drop(a);drop(b);mk(v,r,c,'mg')});
      toG();addRandom();if(!won&&T.some(t=>t.v>=2048))won=true;if(!can())over=true;save();stats();
      if(gain){const gn=$('#gn',p),sc=$('#sc',p);gn.textContent='+'+gain;gn.classList.remove('go');void gn.offsetWidth;gn.classList.add('go');sc.classList.remove('bump');void sc.offsetWidth;sc.classList.add('bump')}
      busy=false},MS);
  }
  let sx=0,sy=0,tr=false;
  bd.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;tr=true},{passive:true});
  bd.addEventListener('touchmove',e=>{if(tr)e.preventDefault()},{passive:false});
  bd.addEventListener('touchend',e=>{if(!tr)return;tr=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
    move(Math.abs(dx)>Math.abs(dy)?(dx<0?0:1):(dy<0?2:3))},{passive:true});
  const key=e=>{const m={ArrowLeft:0,ArrowRight:1,ArrowUp:2,ArrowDown:3}[e.key];if(m!==undefined&&p.isConnected){e.preventDefault();move(m)}};
  document.addEventListener('keydown',key);TI.cleanups.push(()=>document.removeEventListener('keydown',key));
  $('#nw',p).onclick=()=>{busy=false;setup(true)};
  setup(!(st&&st.g&&st.g.length===N));
}

/* ---------- Đăng ký ---------- */
const ad=(after,t)=>{const i=TOOLS.findIndex(x=>x.id===after);TOOLS.splice(i<0?TOOLS.length:i+1,0,t)};
ad('tygia',{id:'vietqr',name:'Mã QR nhận tiền',icon:'📲',group:'Tài chính',view:vietqrTool});
TOOLS.push({id:'xucxac',name:'Tung xúc xắc',icon:'🎲',group:'Giải trí',view:diceTool},
 {id:'vongquay',name:'Vòng quay may mắn',icon:'🎡',group:'Giải trí',view:wheelTool},
 {id:'hoidap',name:'Hỏi đáp vui',icon:'🧠',group:'Giải trí',view:quizTool},
 {id:'trochoi',name:'Trò chơi',icon:'🎮',group:'Giải trí',view:gamesTool});
})();
