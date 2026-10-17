/* Tiện ích bổ sung: đếm số bằng chạm, bấm giờ & hẹn giờ, quy đổi tiền tệ. */
(function(){
'use strict';
const {$,$$,store,fmt,pad,esc,every,tabs,live,f,rr,TOOLS}=TI;

/* ---------- Âm thanh dùng chung (iOS cần mở khóa bằng một lần chạm) ---------- */
let AC=null;
function unlockAudio(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function beep(n){
  n=n||2;
  try{unlockAudio();if(AC){for(let k=0;k<n;k++){const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+k*.35;
    o.frequency.value=880;o.connect(g);g.connect(AC.destination);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.4,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.start(t);o.stop(t+.3)}}}catch(e){}
  if(navigator.vibrate)navigator.vibrate([200,100,200]);
}
TI.unlockAudio=unlockAudio;TI.beep=beep;

/* ---------- Giờ Việt Nam ---------- */
const VNDT=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric',hour12:false});
function vnStamp(iso){
  const d=new Date(iso);if(isNaN(d))return '—';
  const p={};VNDT.formatToParts(d).forEach(x=>p[x.type]=x.value);
  return `${p.hour==='24'?'00':p.hour}:${p.minute} · ${p.day}/${p.month}/${p.year}`;
}
/* "1.250,5" hoặc "1250,5" hoặc "1250.5" -> số */
function parseNum(s){
  s=String(s).trim().replace(/\s/g,'');if(!s)return 0;
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');
  else s=s.replace(',','.');
  const v=parseFloat(s);return isFinite(v)?v:0;
}

/* ---------- Đếm số bằng cách chạm ---------- */
function tallyTool(el){
  let C=store.get('tally',null);
  if(!Array.isArray(C)||!C.length)C=[{id:1,name:'Bộ đếm 1',n:0}];
  let act=store.get('tally_act',C[0].id),armR=0,armD=0;
  const cur=()=>C.find(x=>x.id===act)||C[0];
  const save=()=>{act=cur().id;store.set('tally',C);store.set('tally_act',act)};
  const draw=()=>{
    const c=cur();act=c.id;clearTimeout(armR);clearTimeout(armD);
    el.innerHTML=`<div class="chips">${C.map(x=>`<button class="chip2${x.id===act?' on':''}" data-id="${x.id}">${esc(x.name)} · <span data-n="${x.id}">${x.n}</span></button>`).join('')}<button class="chip2" id="add">+ Thêm</button></div>
    <div class="pad" id="pad" role="button" aria-label="Chạm để đếm thêm 1"><div class="padn" id="cn">${c.n}</div><div class="mut">Chạm vào đây để đếm +1</div></div>
    <div class="row eq"><button class="btn ghost" id="undo">−1</button><button class="btn ghost" id="rst">Đặt lại về 0</button></div>
    <h2>Tên bộ đếm</h2><div class="row"><input id="nm" value="${esc(c.name)}" maxlength="24"><button class="btn ghost" id="del">Xóa</button></div>`;
    $('.chips',el).onclick=e=>{const b=e.target.closest('.chip2');if(!b)return;
      if(b.id==='add'){const n={id:Date.now(),name:'Bộ đếm '+(C.length+1),n:0};C.push(n);act=n.id}else act=+b.dataset.id;
      save();draw()};
    $('#pad',el).onclick=()=>{c.n++;$('#cn',el).textContent=c.n;const sp=$(`[data-n="${c.id}"]`,el);if(sp)sp.textContent=c.n;save();if(navigator.vibrate)navigator.vibrate(8)};
    $('#undo',el).onclick=()=>{if(c.n>0){c.n--;$('#cn',el).textContent=c.n;const sp=$(`[data-n="${c.id}"]`,el);if(sp)sp.textContent=c.n;save()}};
    const rst=$('#rst',el);
    rst.onclick=()=>{if(!armR){rst.textContent='Chạm lần nữa để xóa về 0';armR=setTimeout(()=>{armR=0;rst.textContent='Đặt lại về 0'},2500);return}
      clearTimeout(armR);armR=0;c.n=0;save();draw()};
    $('#nm',el).onchange=e=>{c.name=e.target.value.trim()||c.name;save();draw()};
    const del=$('#del',el);
    del.onclick=()=>{if(!armD){del.textContent='Chạm lần nữa';armD=setTimeout(()=>{armD=0;del.textContent='Xóa'},2500);return}
      clearTimeout(armD);armD=0;
      if(C.length>1)C=C.filter(x=>x.id!==c.id);else{c.n=0;c.name='Bộ đếm 1'}
      act=C[0].id;save();draw()};
  };
  draw();
}

/* ---------- Bấm giờ & hẹn giờ ---------- */
function swFmt(ms){
  const t=Math.floor(ms/10),cs=t%100,s=Math.floor(t/100)%60,m=Math.floor(t/6000)%60,h=Math.floor(t/360000);
  return (h?h+':':'')+pad(m)+':'+pad(s)+'.'+pad(cs);
}
function stopwatchPane(p){
  let S=store.get('sw',null);
  if(!S||typeof S!=='object'||!Array.isArray(S.laps))S={run:false,start:0,acc:0,laps:[]};
  const total=()=>S.acc+(S.run?Date.now()-S.start:0),save=()=>store.set('sw',S);
  p.innerHTML=`<div class="timer sw" id="swt">00:00.00</div><div class="row eq"><button class="btn ghost" id="swb2"></button><button class="btn" id="swb1"></button></div><div class="card" id="swl" style="margin-top:14px"></div>`;
  const paint=()=>{
    $('#swb1',p).textContent=S.run?'Dừng':(S.acc?'Tiếp tục':'Bắt đầu');
    $('#swb2',p).textContent=S.run?'Vòng':'Đặt lại';
    $('#swb2',p).disabled=!S.run&&!S.acc&&!S.laps.length;
    $('#swl',p).innerHTML=S.laps.length?S.laps.map((t,i)=>`<div class="lap"><span class="mut">Vòng ${i+1}</span><span>+${swFmt(t-(i?S.laps[i-1]:0))}</span><b>${swFmt(t)}</b></div>`).reverse().join(''):'<div class="mut small" style="text-align:center">Chưa có vòng nào. Nhấn Vòng khi đang chạy để ghi mốc.</div>';
  };
  $('#swb1',p).onclick=()=>{if(S.run){S.acc+=Date.now()-S.start;S.run=false}else{S.start=Date.now();S.run=true}save();paint()};
  $('#swb2',p).onclick=()=>{if(S.run)S.laps.push(total());else S={run:false,start:0,acc:0,laps:[]};save();paint()};
  paint();
  const id=every(()=>{const t=$('#swt',p);if(!t){clearInterval(id);return}t.textContent=swFmt(total())},47);
}
function timerPane(p){
  let C=store.get('cd',null);
  if(!C||typeof C!=='object')C={run:false,end:0,left:0,dur:0};
  p.innerHTML=`<div class="timer" id="cdt">00:00</div><div class="chips">${[1,3,5,10,15,30].map(m=>`<button class="chip2" data-m="${m}">${m} phút</button>`).join('')}</div>
  <div class="row">${f('Phút','<input id="cdm" inputmode="numeric" placeholder="0">')}${f('Giây','<input id="cds" inputmode="numeric" placeholder="0">')}</div>
  <div class="row eq"><button class="btn ghost" id="cdr">Đặt lại</button><button class="btn" id="cdg">Bắt đầu</button></div><div class="note" id="cdn">Tiếng chuông chỉ kêu khi app đang mở.</div>`;
  const save=()=>store.set('cd',C),rem=()=>C.run?Math.max(0,C.end-Date.now()):C.left;
  const fmtT=ms=>{const s=Math.ceil(ms/1000),h=Math.floor(s/3600);return (h?h+':':'')+pad(Math.floor(s%3600/60))+':'+pad(s%60)};
  const fromInputs=()=>((parseInt($('#cdm',p).value)||0)*60+(parseInt($('#cds',p).value)||0))*1000;
  const setInputs=()=>{const s=Math.round((C.dur||0)/1000);$('#cdm',p).value=s?Math.floor(s/60):'';$('#cds',p).value=s?s%60:''};
  const msg=t=>{$('#cdn',p).textContent=t};
  const paint=()=>{$('#cdg',p).textContent=C.run?'Tạm dừng':(C.left>0&&C.left<C.dur?'Tiếp tục':'Bắt đầu');$('#cdm',p).disabled=$('#cds',p).disabled=C.run;$('#cdt',p).textContent=fmtT(rem())};
  setInputs();paint();
  $$('.chip2',p).forEach(b=>b.onclick=()=>{if(C.run)return;C={run:false,end:0,left:+b.dataset.m*60000,dur:+b.dataset.m*60000};save();setInputs();msg('Tiếng chuông chỉ kêu khi app đang mở.');paint()});
  const onIn=()=>{if(C.run)return;C.dur=C.left=fromInputs();save();paint()};
  $('#cdm',p).oninput=onIn;$('#cds',p).oninput=onIn;
  $('#cdg',p).onclick=()=>{
    if(C.run){C.left=rem();C.run=false}
    else{if(C.left<=0)C.left=C.dur=fromInputs();if(C.left<=0){msg('Hãy nhập thời gian cần hẹn.');return}
      unlockAudio();C.end=Date.now()+C.left;C.run=true;msg('Tiếng chuông chỉ kêu khi app đang mở.')}
    save();paint()};
  $('#cdr',p).onclick=()=>{C.run=false;C.left=C.dur;save();msg('Tiếng chuông chỉ kêu khi app đang mở.');paint()};
  const id=every(()=>{const t=$('#cdt',p);if(!t){clearInterval(id);return}
    if(C.run&&C.end-Date.now()<=0){C.run=false;C.left=0;save();beep(3);msg('Hết giờ!');paint()}
    t.textContent=fmtT(rem())},250);
}
function stopwatchTool(el){tabs(el,[['Bấm giờ',stopwatchPane],['Hẹn giờ',timerPane]])}

/* ---------- Quy đổi tiền tệ (tỷ giá lấy mới qua mạng) ---------- */
const FXC=[['USD','Đô la Mỹ','🇺🇸'],['JPY','Yên Nhật','🇯🇵'],['KRW','Won Hàn Quốc','🇰🇷'],['CNY','Nhân dân tệ','🇨🇳']];
async function jget(url,ms){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||8000);
  try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error('http '+r.status);return await r.json()}
  finally{clearTimeout(t)}
}
async function loadFX(){
  try{ /* 1) Vietcombank: giá ngân hàng mua vào / bán ra */
    for(let k=0;k<4;k++){
      const d=new Date(Date.now()+7*36e5-k*864e5).toISOString().slice(0,10);
      const j=await jget('https://www.vietcombank.com.vn/api/exchangerates?date='+d),arr=j&&(j.Data||j.data);
      if(Array.isArray(arr)&&arr.length){
        const rates={};
        FXC.forEach(([c])=>{const r=arr.find(x=>String(x.currencyCode).trim()===c);if(r){const b=parseFloat(r.transfer||r.cash),s=parseFloat(r.sell);if(b>0&&s>0)rates[c]={buy:b,sell:s}}});
        if(FXC.every(([c])=>rates[c]))return {source:'Vietcombank',url:'https://www.vietcombank.com.vn',asOf:j.UpdatedDate||j.updatedDate||new Date().toISOString(),rates,mid:false,kind:'live'};
      }
    }
  }catch(e){}
  try{ /* 2) Tỷ giá thị trường (trung bình), nhà cung cấp cập nhật mỗi ngày */
    const j=await jget('https://open.er-api.com/v6/latest/USD');
    if(j&&j.result==='success'&&j.rates&&j.rates.VND){
      const v=j.rates.VND,rates={USD:{buy:v,sell:v}};
      for(const c of ['JPY','KRW','CNY']){if(!(j.rates[c]>0))throw new Error('thiếu '+c);const x=v/j.rates[c];rates[c]={buy:x,sell:x}}
      return {source:'ExchangeRate-API (tỷ giá thị trường)',url:'https://www.exchangerate-api.com',asOf:new Date((j.time_last_update_unix||Date.now()/1000)*1000).toISOString(),rates,mid:true,kind:'live'};
    }
  }catch(e){}
  return null;
}
TI.loadFX=loadFX;
function fxTool(el){
  const snap=DATA.fx;
  let state={source:snap.source,url:snap.url,asOf:snap.asOf,rates:snap.rates,mid:false,kind:'snap'};
  const cache=store.get('fx_cache',null);
  if(cache&&cache.rates&&FXC.every(([c])=>cache.rates[c])&&new Date(cache.asOf)>new Date(snap.asOf))state=Object.assign({},cache,{kind:'cache'});
  let cur=store.get('fx_cur','USD'),dir=store.get('fx_dir','to'),busy=true,failed=false;
  if(!FXC.some(c=>c[0]===cur))cur='USD';if(dir!=='from')dir='to';
  el.innerHTML=`<div id="fxs"></div><div class="seg" id="fxd"><button data-d="to">Ngoại tệ → VND</button><button data-d="from">VND → ngoại tệ</button></div>
  <div class="chips" id="fxc">${FXC.map(c=>`<button class="chip2" data-c="${c[0]}">${c[2]} ${c[0]}</button>`).join('')}</div>
  ${f('Số tiền','<input id="fxa" inputmode="decimal" placeholder="0">')}<div class="res" id="fxo"></div>
  <h2>Bảng tỷ giá (đồng cho 1 đơn vị)</h2><div class="card tw" id="fxt"></div><button class="btn ghost full" id="fxr">Cập nhật ngay</button><div class="note" id="fxn"></div>`;
  const paintStatus=()=>{
    const k=state.kind,label=k==='live'?'Tỷ giá lúc':k==='cache'?'Tỷ giá lưu lần trước':'Bản chụp dự phòng';
    $('#fxs',el).innerHTML=(failed&&k!=='live'?`<div class="banner">Không kết nối được để lấy tỷ giá mới. Đang hiển thị ${k==='cache'?'số liệu đã lưu lần trước':'bản chụp Vietcombank'}.</div>`:'')+
      `<div class="res" style="margin-bottom:12px">${rr(label,esc(vnStamp(state.asOf)))}${rr('Nguồn',`<a class="lnk" href="${esc(state.url)}" target="_blank" rel="noopener">${esc(state.source)}</a>`)}${busy?rr('Trạng thái','Đang cập nhật…'):''}</div>`;
    $('#fxn',el).textContent=state.mid?'Đây là tỷ giá thị trường (trung bình), có thể chênh nhẹ so với tỷ giá ngân hàng. Tự cập nhật mỗi 5 phút khi đang mở.':'Ngoại tệ → VND tính theo giá ngân hàng mua vào (chuyển khoản), VND → ngoại tệ tính theo giá bán ra. Tự cập nhật mỗi 5 phút khi đang mở.';
  };
  const paintCalc=()=>{
    $$('#fxd button',el).forEach(b=>b.classList.toggle('on',b.dataset.d===dir));
    $$('#fxc .chip2',el).forEach(b=>b.classList.toggle('on',b.dataset.c===cur));
    const a=parseNum($('#fxa',el).value),r=state.rates[cur];
    $('#fxo',el).innerHTML=dir==='to'
      ?rr('Quy đổi',`≈ ${fmt(a*r.buy,0)} đ`,1)+rr('Tỷ giá áp dụng',`1 ${cur} = ${fmt(r.buy,2)} đ${state.mid?'':' (mua vào)'}`)
      :rr('Quy đổi',`≈ ${fmt(a/r.sell,2)} ${cur}`,1)+rr('Tỷ giá áp dụng',`1 ${cur} = ${fmt(r.sell,2)} đ${state.mid?'':' (bán ra)'}`);
  };
  const paintTable=()=>{
    $('#fxt',el).innerHTML=`<table><tr><th>Ngoại tệ</th>${state.mid?'<th>Tỷ giá</th>':'<th>Mua vào</th><th>Bán ra</th>'}</tr>${FXC.map(c=>{const r=state.rates[c[0]];return `<tr><td>${c[2]} 1 ${c[0]}</td>${state.mid?`<td>${fmt(r.buy,2)}</td>`:`<td>${fmt(r.buy,2)}</td><td>${fmt(r.sell,2)}</td>`}</tr>`}).join('')}</table>`;
  };
  const paintAll=()=>{if(!$('#fxs',el))return;paintStatus();paintCalc();paintTable()};
  const refresh=async()=>{
    busy=true;if($('#fxs',el))paintStatus();
    const r=await loadFX();busy=false;
    if(r){state=r;failed=false;store.set('fx_cache',{source:r.source,url:r.url,asOf:r.asOf,rates:r.rates,mid:r.mid})}else failed=true;
    paintAll();
  };
  $('#fxd',el).onclick=e=>{const b=e.target.closest('button');if(b){dir=b.dataset.d;store.set('fx_dir',dir);paintCalc()}};
  $('#fxc',el).onclick=e=>{const b=e.target.closest('.chip2');if(b){cur=b.dataset.c;store.set('fx_cur',cur);paintCalc()}};
  live(el,paintCalc);
  $('#fxr',el).onclick=refresh;
  paintAll();
  every(refresh,300000);
}

/* ---------- Đăng ký vào danh sách tiện ích ---------- */
function addAfter(id,tool){const i=TOOLS.findIndex(t=>t.id===id);TOOLS.splice(i<0?TOOLS.length:i+1,0,tool)}
addAfter('ngay',{id:'bamgio',name:'Bấm giờ & hẹn giờ',icon:'⏱️',group:'Thời gian',view:stopwatchTool});
addAfter('chungkhoan',{id:'tygia',name:'Quy đổi tiền tệ',icon:'💱',group:'Tài chính',view:fxTool});
addAfter('maytinh',{id:'demso',name:'Đếm số',icon:'👆',group:'Công cụ',view:tallyTool});
})();
