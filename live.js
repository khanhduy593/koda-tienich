/* Cập nhật giá mới nhất qua mạng (vàng SJC, chứng khoán, xăng dầu, tỷ giá).
   Khi có mạng: lấy số liệu mới và ghi đè lên bản chụp sẵn trong DATA. Mất mạng hoặc lỗi: giữ bản gần nhất đã có. */
(function(){
'use strict';
const {store,pad}=TI;
const TTL=3*60e3,OKAGE=10*60e3;
const KEY={vang:'vang',ck:'ck',xang:'xang',fx:'fx',xs:'xs'};
const st={vang:{},ck:{},xang:{},fx:{},xs:{}};
const TTLK={xs:15*60e3};
const lis=new Set();
const vn=(n,d=0)=>Number(n).toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
const vnParts=d=>{const p={};new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short'}).formatToParts(d).forEach(x=>p[x.type]=x.value);return p};
const stamp=d=>{const p=vnParts(d);return `${p.hour}:${p.minute} · ${p.day}/${p.month}/${p.year}`};

/* gọi trực tiếp và qua 2 cầu nối CORS song song, lấy cái nào về đúng trước */
function race(url,parse,ms){
  const us=[url,'https://corsproxy.io/?url='+encodeURIComponent(url),'https://api.allorigins.win/raw?url='+encodeURIComponent(url)];
  return Promise.any(us.map(async u=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||7000);
    try{const r=await fetch(u,{signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error('http '+r.status);return parse(await r.text())}finally{clearTimeout(t)}}));
}
const bad=()=>{throw new Error('dữ liệu không hợp lệ')};

/* ---- Vàng SJC ---- */
async function gold(){
  const j=await race('https://sjc.com.vn/GoldPrice/Services/PriceService.ashx',t=>{const j=JSON.parse(t);if(!j||!j.success||!Array.isArray(j.data))bad();return j});
  const row=j.data.find(x=>/SJC 1L/i.test(x.TypeName||'')&&/H[oồ] Ch[ií] Minh/i.test(x.BranchName||''))||j.data.find(x=>/SJC 1L/i.test(x.TypeName||''));
  if(!row||!(row.BuyValue>0)||!(row.SellValue>0))bad();
  const f=v=>Number((v/1e6).toFixed(2)).toLocaleString('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:2})
  const ld=String(j.latestDate||'').match(/(\d{1,2}:\d{2})\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
  return {captured:new Date().toISOString(),dataLabel:'Cập nhật',dataTime:ld?`${ld[1]} · ${ld[2]}`:stamp(new Date()),source:'SJC (sjc.com.vn)',url:'https://sjc.com.vn',
    note:'Đơn vị: triệu đồng/lượng. Giá niêm yết trực tiếp của SJC tại Hồ Chí Minh, lấy qua mạng mỗi lần mở.',
    sections:[{title:'Vàng miếng SJC',cols:['Loại','Mua vào','Bán ra'],rows:[['SJC',f(row.BuyValue),f(row.SellValue)]]}],live:true};
}
/* ---- Chứng khoán (chỉ số) ---- */
async function stock(){
  const to=Math.floor(Date.now()/1000)+86400,from=to-16*86400;
  const S=[['VNINDEX','VN-Index'],['HNX','HNX-Index'],['UPCOM','UPCoM-Index']];
  const js=await Promise.all(S.map(([s])=>race(`https://services.entrade.com.vn/chart-api/v2/ohlcs/index?from=${from}&to=${to}&symbol=${s}&resolution=1D`,t=>{const j=JSON.parse(t);if(!j||!Array.isArray(j.c)||j.c.length<2||!Array.isArray(j.t))bad();return j})));
  const rows=js.map((j,i)=>{const c=j.c,last=c[c.length-1],prev=c[c.length-2];if(!(last>0)||!(prev>0))bad();const d=last-prev,p=d/prev*100,sg=d>0?'+':d<0?'−':'';
    return [S[i][1],vn(last,2),`${sg}${vn(Math.abs(d),2)} (${sg}${vn(Math.abs(p),2)}%)`]});
  const lt=new Date(js[0].t[js[0].t.length-1]*1000),now=new Date(),pl=vnParts(lt),pn=vnParts(now),same=pl.day===pn.day&&pl.month===pn.month,hr=+pn.hour+(+pn.minute)/60,wk=!['Sat','Sun'].includes(pn.weekday);
  const open=same&&wk&&hr>=9&&hr<15;
  return {captured:now.toISOString(),dataLabel:open?'Đang giao dịch':'Chốt phiên',dataTime:open?stamp(now):`15:00 · ${pl.day}/${pl.month}/${pl.year}`,source:'DNSE (Entrade)',url:'https://dnse.com.vn',
    note:open?'Phiên đang diễn ra, điểm số thay đổi liên tục. Số liệu lấy qua mạng mỗi lần mở.':'Số liệu chốt phiên gần nhất, lấy qua mạng mỗi lần mở. Không phải giá trực tiếp.',
    sections:[{title:'Chỉ số',cols:['Chỉ số','Điểm','+/- điểm'],rows}],live:true};
}
/* ---- Xăng dầu (Petrolimex, vùng 1) ---- */
async function fuel(){
  const html=await race('https://webgia.com/gia-xang-dau/petrolimex/',t=>{if(!/Petrolimex/i.test(t)||!/RON/i.test(t))bad();return t});
  const doc=new DOMParser().parseFromString(html,'text/html');
  const rows=[...doc.querySelectorAll('tr')].map(tr=>[...tr.children].map(c=>c.textContent.replace(/\s+/g,' ').trim())).filter(r=>r.length>=2);
  const price=r=>{const v=r&&parseInt(String(r[1]).replace(/\D/g,''),10);return v>10000&&v<90000?v:0};
  const e5=rows.find(r=>/E5 RON ?92/i.test(r[0])),e10=rows.find(r=>/E10 RON ?95.*(m[uứ]c 3|-III)/i.test(r[0]))||rows.find(r=>/RON ?95-?III/i.test(r[0])),dsl=rows.find(r=>/DO 0,05S/i.test(r[0]));
  const F=[['Xăng E5 RON92',e5],['Xăng E10 RON95-III',e10],['Dầu diesel 0.05S',dsl]];
  if(!F.every(([,r])=>price(r)))bad();
  const old=DATA.xang,tx=(doc.body.textContent||'').replace(/\s+/g,' ').match(/(\d{1,2}:\d{2})(?::\d{2})?\s*ngày\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  const fuels=F.map(([n,r])=>({n,p:price(r)}));
  const out=fuels.map((x,i)=>{const o=old.fuels&&old.fuels[i],oldRow=old.sections[0].rows[i];let ch='—';
    if(old.live&&o&&o.n===x.n){ch=o.p===x.p?(oldRow&&oldRow[2])||'—':((x.p>o.p?'+':'−')+vn(Math.abs(x.p-o.p)))}
    return [x.n,vn(x.p),ch]});
  return {captured:new Date().toISOString(),dataLabel:'Cập nhật',dataTime:tx?`${tx[1]} · ${tx[2]}`:stamp(new Date()),source:'Petrolimex (giá bán lẻ vùng 1)',url:'https://www.petrolimex.com.vn',
    note:'Giá bán lẻ tại vùng 1 theo Petrolimex, lấy qua mạng mỗi lần mở. Giá tại từng cửa hàng và vùng 2 có thể khác.',
    sections:[{title:'Giá bán lẻ vùng 1 (đồng/lít)',cols:['Mặt hàng','Giá','So kỳ trước'],rows:out}],fuels,live:true};
}
/* ---- Tỷ giá ---- */
async function fx(){
  if(!TI.loadFX)bad();const r=await TI.loadFX();if(!r)bad();
  return {captured:new Date().toISOString(),asOf:r.asOf,source:r.source,url:r.url,rates:r.rates,mid:!!r.mid,live:true};
}

/* ---- Xổ số miền Nam: lấy từ nhiều trang, kiểm tra từng trang, đối chiếu rồi mới hiển thị ---- */
const XSRC=[['xosodaiphat.com','https://xosodaiphat.com/xsmn-xo-so-mien-nam.html'],['xskt.com.vn','https://xskt.com.vn/xsmn'],['minhngoc.com.vn','https://www.minhngoc.com.vn/ket-qua-xo-so/mien-nam.html']];
const PRZ=[[/^(g\.?\s*8|giai\s*tam)$/,'g8',1,2],[/^(g\.?\s*7|giai\s*bay)$/,'g7',1,3],[/^(g\.?\s*6|giai\s*sau)$/,'g6',3,4],[/^(g\.?\s*5|giai\s*nam)$/,'g5',1,4],[/^(g\.?\s*4|giai\s*tu)$/,'g4',7,5],[/^(g\.?\s*3|giai\s*ba)$/,'g3',2,5],[/^(g\.?\s*2|giai\s*nhi)$/,'g2',1,5],[/^(g\.?\s*1|giai\s*nhat)$/,'g1',1,5],[/^(g\.?\s*(db|dac biet)|giai\s*dac\s*biet|db|dac biet)$/,'db',1,6]];
const nrm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();
function provName(raw){
  const t=nrm(raw).replace(/\bxs[a-z]{1,3}\b.*$/,'').replace(/\(.*\)/,'').trim(),all=new Set();
  Object.values(DATA.xs.sched).forEach(a=>a.forEach(n=>all.add(n)));
  const alias={'tphcm':'TP. Hồ Chí Minh','tp hcm':'TP. Hồ Chí Minh','tp.hcm':'TP. Hồ Chí Minh','ho chi minh':'TP. Hồ Chí Minh','tp ho chi minh':'TP. Hồ Chí Minh','tp. ho chi minh':'TP. Hồ Chí Minh','da lat':'Đà Lạt','lam dong':'Đà Lạt'};
  if(alias[t])return alias[t];
  for(const n of all){const m=nrm(n).replace(/\(.*\)/,'').trim();if(m===t)return n==='Đà Lạt (Lâm Đồng)'?'Đà Lạt':n}
  return t?raw.replace(/\s*\(.*\)/,'').replace(/\s*XS.*$/i,'').trim():'';
}
function dateNear(tb){
  let n=tb;const now=new Date(),vnY=+vnParts(now).year;
  for(let h=0;h<10&&n;h++){
    const txt=(h===0?(n.querySelector('tr')||n).textContent:n.textContent).replace(/\s+/g,' ').slice(0,h===0?200:260),m=txt.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{4}))?/);
    if(m){let y=m[3]?+m[3]:vnY;const d=+m[1],mo=+m[2];if(d>=1&&d<=31&&mo>=1&&mo<=12){const iso=`${y}-${pad(mo)}-${pad(d)}`;if(Date.parse(iso+'T00:00:00+07:00')<=Date.now()+864e5)return iso;if(!m[3]){y--;return `${y}-${pad(mo)}-${pad(d)}`}}}
    n=n.previousElementSibling||n.parentElement;
  }
  return null;
}
function parseLottery(html){
  const doc=new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi,' ').replace(/<\/(div|p|li)>/gi,' </$1>'),'text/html'),days={};
  doc.querySelectorAll('table').forEach(tb=>{
    const rows=[...tb.querySelectorAll('tr')].map(tr=>[...tr.children].map(c=>c.textContent.replace(/\s+/g,' ').trim())).filter(r=>r.length>=2);
    const body={};let head=null;
    rows.forEach(r=>{const k=PRZ.find(z=>z[0].test(nrm(r[0])));if(k)body[k[1]]=r.slice(1);else if(!head&&!Object.keys(body).length&&r.length>=2&&r.slice(1).every(x=>x&&!/^[\d\s]+$/.test(x)))head=r.slice(1)});
    if(!head||PRZ.some(z=>!body[z[1]]))return;
    const iso=dateNear(tb);if(!iso)return;
    const prov=head.map(provName);if(prov.some(x=>!x))return;
    const out=prov.map((n,j)=>{const o={n};
      for(const [,k,c,l] of PRZ){const cell=body[k][j];if(cell==null)return null;const v=cell.split(/[^0-9]+/).filter(Boolean);if(v.length!==c||!v.every(x=>x.length===l))return null;o[k]=v}
      return o});
    if(out.some(o=>!o)||new Set(prov).size!==prov.length)return;
    if(!days[iso])days[iso]=out;
  });
  return days;
}
async function xsOne([name,url]){
  const html=await race(url,t=>{if(t.length<2000)bad();return t},8000);
  const d=parseLottery(html);if(!Object.keys(d).length)bad();return {name,url,days:d};
}
async function lottery(){
  const res=[];let ok=0,firstAt=0;
  await new Promise(done=>{let left=XSRC.length;
    XSRC.forEach(src=>xsOne(src).then(r=>{res.push(r);ok++;if(!firstAt){firstAt=Date.now();setTimeout(done,2500)}}).catch(()=>{}).finally(()=>{if(--left===0)done()}))});
  if(!res.length)bad();
  /* gộp theo từng ngày + đài: lấy giá trị được nhiều nguồn trùng nhất */
  const votes={};
  res.forEach(r=>Object.entries(r.days).forEach(([iso,arr])=>arr.forEach(o=>{const key=iso+'|'+o.n,sig=JSON.stringify(PRZ.map(z=>o[z[1]]));
    ((votes[key]=votes[key]||{})[sig]=votes[key][sig]||{o,n:0,src:[]}).n++;votes[key][sig].src.push(r.name)})));
  const old=DATA.xs,days=JSON.parse(JSON.stringify(old.days)),agree={};let maxAgree=1,changed=0;
  Object.entries(votes).forEach(([key,v])=>{const best=Object.values(v).sort((a,b)=>b.n-a.n)[0],tie=Object.values(v).filter(x=>x.n===best.n).length>1;
    if(tie&&res.length>1)return; /* hai nguồn lệch nhau và không phân thắng bại: bỏ, giữ số cũ */
    const [iso,n]=key.split('|');const arr=days[iso]=days[iso]||[];const i=arr.findIndex(x=>x.n===n);
    if(i>=0){if(JSON.stringify(PRZ.map(z=>arr[i][z[1]]))!==JSON.stringify(PRZ.map(z=>best.o[z[1]])))changed++;arr[i]=best.o}else arr.push(best.o);
    agree[iso]=Math.max(agree[iso]||0,best.n);maxAgree=Math.max(maxAgree,best.n)});
  const fresh=Object.keys(agree);if(!fresh.length)bad();
  Object.keys(days).sort().slice(0,-7).forEach(k=>delete days[k]);
  /* thứ tự đài trong ngày theo lịch cố định */
  const keys=Object.keys(days).sort(),latest=keys[keys.length-1];
  return {captured:new Date().toISOString(),latest,days,source:res.map(r=>r.name).join(', '),
    links:XSRC.filter(x=>res.some(r=>r.name===x[0])).map(x=>[x[0],x[1]]),
    note:`Lấy qua mạng từ ${res.length}/${XSRC.length} trang (${res.map(r=>r.name).join(', ')}). `+(maxAgree>1?`Các ngày mới nhất đã đối chiếu, ${maxAgree} trang khớp nhau. `:'Chỉ có 1 trang trả về được nên chưa đối chiếu. ')+'Kết quả chỉ mang tính tham khảo, hãy dò vé theo kết quả chính thức của công ty xổ số kiến thiết.',
    nsrc:res.length,agree:maxAgree,live:true};
}
const FETCH={vang:gold,ck:stock,xang:fuel,fx,xs:lottery};

function apply(kind,patch){Object.assign(DATA[KEY[kind]],patch)}
/* nạp lại bản đã lấy lần trước (nếu mới hơn bản chụp sẵn) để mở app là có số liệu mới nhất đã biết */
Object.keys(FETCH).forEach(k=>{try{const c=store.get('live_'+k,null);if(c&&c.patch&&Date.parse(c.patch.captured)>Date.parse(DATA[KEY[k]].captured)){apply(k,c.patch);st[k].okAt=c.at}}catch(e){}});

function ensure(kind,force){
  const s=st[kind];if(!s)return Promise.resolve(false);
  if(s.p)return s.p;
  if(!force&&s.at&&Date.now()-s.at<(TTLK[kind]||TTL))return Promise.resolve(false);
  if(navigator.onLine===false){return Promise.resolve(false)}
  s.p=FETCH[kind]().then(patch=>{apply(kind,patch);const now=Date.now();s.at=now;s.okAt=now;store.set('live_'+kind,{at:now,patch});lis.forEach(f=>{try{f(kind)}catch(e){}});return true})
    .catch(()=>{s.at=Date.now()-(TTLK[kind]||TTL)+30e3;return false}).finally(()=>{s.p=null});
  return s.p;
}
const wait=(kinds,ms)=>Promise.race([Promise.all(kinds.map(k=>ensure(k))),new Promise(r=>setTimeout(r,ms||5500))]);
const isLive=k=>!!(st[k]&&st[k].okAt&&Date.now()-st[k].okAt<(k==='xs'?TTLK.xs+OKAGE:OKAGE));
const stale=kinds=>kinds.filter(k=>!isLive(k));
function kindsFor(n){
  const k=[];
  if(/\b(vang|sjc|24k|18k|pnj)\b/.test(n))k.push('vang');
  if(/\b(xang|diesel|ron ?9[25]|e5|e10|nhien lieu|do xang|dau do)\b/.test(n))k.push('xang');
  if(/(xo so|kqxs|xsmn|ve so|giai dac biet|ket qua xo)/.test(n))k.push('xs');
  if(/(chung khoan|vn.?index|vnindex|hnx|upcom|co phieu)/.test(n))k.push('ck');
  if(/(\busd\b|do la|\byen\b|\bjpy\b|\bwon\b|\bkrw\b|\bcny\b|nhan dan te|ty gia|ngoai te|\d\s*do\b)/.test(n))k.push('fx');
  return k;
}
function refreshAll(force){return Promise.all(Object.keys(FETCH).filter(k=>k!=='xs'||force===true).map(k=>ensure(k,force)))}
TI.liveNote=kinds=>{const s=stale(kinds);if(!s.length)return '';const k=s[0],D=DATA[KEY[k]],t=k==='fx'?stamp(new Date(D.asOf)):k==='xs'?stamp(new Date(D.captured)):String(D.dataTime).split(' (')[0];return `\n\n(Chưa lấy được giá mới nhất qua mạng, mình đang dùng số liệu lúc ${t}.)`};
TI.live={ensure,wait,isLive,stale,kindsFor,refreshAll,on:f=>{lis.add(f);return()=>lis.delete(f)},stamp};
/* tự làm mới khi mở app, khi quay lại app và mỗi 5 phút lúc đang mở */
setTimeout(()=>refreshAll(),300);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAll()});
addEventListener('online',()=>refreshAll(true));
setInterval(()=>{if(!document.hidden)refreshAll()},5*60e3);
})();
