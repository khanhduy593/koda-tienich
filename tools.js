/* Các tiện ích. Mỗi tiện ích: {id,name,icon,group,view(el)} */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,d){try{const v=localStorage.getItem('ti_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('ti_'+k,JSON.stringify(v))}catch(e){}}};
const fmt=(n,d=0)=>isFinite(n)?Number(n).toLocaleString('vi-VN',{maximumFractionDigits:d}):'—';
const vnd=n=>fmt(Math.round(n))+' đ';
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mv=el=>parseInt(String(el.value).replace(/\D/g,''))||0;
const dv=el=>parseFloat(String(el.value).replace(',','.'))||0;
const f=(l,i)=>`<label class="f"><span>${l}</span>${i}</label>`;
const rr=(l,v,big)=>`<div class="rr${big?' big':''}"><span>${l}</span><b>${v}</b></div>`;
const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const timers=[];
const every=(fn,ms)=>{fn();const id=setInterval(fn,ms);timers.push(id);return id};
const clearTimers=()=>{while(timers.length)clearInterval(timers.pop())};
const WD=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
const dstr=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pdate=v=>v?new Date(v+'T00:00:00'):null;
const today0=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const days=(a,b)=>Math.round((b-a)/864e5);
const timeStr=(d,sec,tz)=>{const o={hour:'2-digit',minute:'2-digit',hour12:!store.get('h24',true)};if(sec)o.second='2-digit';if(tz)o.timeZone=tz;return d.toLocaleTimeString('vi-VN',o)};

document.addEventListener('input',e=>{const t=e.target;if(t.classList&&t.classList.contains('money')){const d=t.value.replace(/\D/g,'');t.value=d?Number(d).toLocaleString('vi-VN'):''}});

function tabs(el,items){
  el.innerHTML=`<div class="seg">${items.map((x,i)=>`<button data-i="${i}">${x[0]}</button>`).join('')}</div><div class="pane"></div>`;
  const pane=$('.pane',el),key='tab_'+(window.TI&&TI.cur);
  const sel=i=>{$$('.seg button',el).forEach((b,j)=>b.classList.toggle('on',i==j));pane.innerHTML='';store.set(key,i);items[i][1](pane)};
  $('.seg',el).onclick=e=>{const b=e.target.closest('button');if(b)sel(+b.dataset.i)};
  sel(Math.min(items.length-1,Math.max(0,store.get(key,0))));
}

function live(el,fn){el._live=fn;if(!el._lb){el._lb=1;const h=e=>{if(el._live)el._live(e)};el.addEventListener('input',h);el.addEventListener('change',h)}fn()}

/* ---------- Thời tiết (theo vị trí / phường) ---------- */
const CITIES=[['Hà Nội',21.03,105.85],['TP. Hồ Chí Minh',10.78,106.70],['Đà Nẵng',16.05,108.22],['Hải Phòng',20.84,106.69],['Cần Thơ',10.03,105.78],['Huế',16.46,107.59],['Nha Trang',12.24,109.19],['Đà Lạt',11.94,108.44],['Vũng Tàu',10.35,107.08],['Quy Nhơn',13.78,109.22],['Buôn Ma Thuột',12.67,108.04],['Vinh',18.68,105.68],['Hạ Long',20.95,107.08],['Phú Quốc',10.22,103.96]];
const WC=c=>c==0?['☀️','Trời quang']:c<=2?['🌤️','Ít mây']:c==3?['☁️','Nhiều mây']:c<=48?['🌫️','Sương mù']:c<=57?['🌦️','Mưa phùn']:c<=67?['🌧️','Mưa']:c<=77?['❄️','Tuyết']:c<=82?['🌧️','Mưa rào']:['⛈️','Dông'];
const aqiLabel=a=>a<=50?'Tốt':a<=100?'Trung bình':a<=150?'Kém':a<=200?'Xấu':a<=300?'Rất xấu':'Nguy hại';
const DEFAULT_LOC={name:CITIES[0][0],lat:CITIES[0][1],lon:CITIES[0][2],isDefault:true};
const curCity=()=>{const c=store.get('city',null);return c&&isFinite(c.lat)&&isFinite(c.lon)?c:DEFAULT_LOC};
const cityLabel=c=>c.label||c.name;
async function getWeather(c){
  const key='w_'+(+c.lat).toFixed(3)+'_'+(+c.lon).toFixed(3),cached=store.get(key);
  if(cached&&Date.now()-cached.t<6e5)return cached.d;
  try{
    const q=`latitude=${c.lat}&longitude=${c.lon}`;
    const [w,a]=await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`).then(r=>r.json()),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi,pm2_5&timezone=auto`).then(r=>r.json()).catch(()=>null)]);
    if(!w.current)throw 0;
    const d={w,a};store.set(key,{t:Date.now(),d});return d;
  }catch(e){if(cached)return cached.d;throw e}
}
/* Tra cứu địa chỉ (OpenStreetMap Nominatim): tọa độ -> tên phường/xã, và tìm theo tên */
async function nom(path){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);
  try{const r=await fetch('https://nominatim.openstreetmap.org/'+path+(path.includes('?')?'&':'?')+'format=jsonv2&addressdetails=1&accept-language=vi',{signal:c.signal});if(!r.ok)throw new Error('http '+r.status);return await r.json()}
  finally{clearTimeout(t)}
}
function addrLabel(r){
  const a=(r&&r.address)||{};
  const ward=a.suburb||a.quarter||a.neighbourhood||a.village||a.hamlet||'';
  const mid=a.city_district||a.district||'';
  const area=a.city||a.town||a.state||a.county||'';
  const parts=[ward,mid,area].filter((x,i,arr)=>x&&arr.indexOf(x)===i);
  return parts.length?parts.join(', '):String((r&&r.display_name)||'').split(',').slice(0,3).join(',').trim();
}
const kmBetween=(a,b,c,d)=>{const t=x=>x*Math.PI/180,dl=t(c-a),dn=t(d-b),h=Math.sin(dl/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(h))};
function weatherTool(el){
  el.innerHTML='<div class="card" id="loc"></div><div id="wb" class="mut" style="text-align:center;padding:30px">Đang tải…</div>';
  const locEl=$('#loc',el),wb=$('#wb',el);
  let gpsMsg='',busy=false,searchOpen=false,results=[];
  const alive=()=>locEl.isConnected;
  const setLoc=c=>{store.set('city',c);paintLoc();load()};
  const getPos=(ok,bad)=>navigator.geolocation.getCurrentPosition(ok,bad,{enableHighAccuracy:true,timeout:15000,maximumAge:120000});
  const useGps=()=>{
    if(!navigator.geolocation){gpsMsg='Thiết bị không hỗ trợ định vị.';paintLoc();return}
    busy=true;gpsMsg='Đang xác định vị trí…';paintLoc();
    getPos(async p=>{
      const lat=+p.coords.latitude.toFixed(4),lon=+p.coords.longitude.toFixed(4);let label='Vị trí của tôi';
      try{const r=await nom(`reverse?lat=${lat}&lon=${lon}&zoom=16`);label=addrLabel(r)||label}catch(e){}
      busy=false;gpsMsg='';if(alive())setLoc({name:'Vị trí của tôi',label,lat,lon,gps:true});else store.set('city',{name:'Vị trí của tôi',label,lat,lon,gps:true});
    },err=>{busy=false;gpsMsg=err&&err.code===1?'Chưa được cho phép dùng vị trí. Hãy bật quyền vị trí cho Safari/ứng dụng trong Cài đặt iPhone, hoặc dùng “Tìm phường/xã”.':'Không xác định được vị trí. Hãy thử lại hoặc dùng “Tìm phường/xã”.';if(alive())paintLoc()});
  };
  const refreshGps=sv=>{ /* đang dùng vị trí GPS: tự cập nhật nếu bạn đã di chuyển */
    if(!navigator.geolocation)return;
    getPos(async p=>{
      const lat=+p.coords.latitude.toFixed(4),lon=+p.coords.longitude.toFixed(4);
      if(kmBetween(sv.lat,sv.lon,lat,lon)<0.4)return;
      let label=sv.label;try{const r=await nom(`reverse?lat=${lat}&lon=${lon}&zoom=16`);label=addrLabel(r)||label}catch(e){}
      const c={name:'Vị trí của tôi',label,lat,lon,gps:true};store.set('city',c);if(alive()){paintLoc();load()}
    },()=>{});
  };
  const doSearch=async()=>{
    const q=($('#q',el)||{}).value||'',box=$('#res',el);if(!box)return;
    if(q.trim().length<3){box.innerHTML='<div class="note">Nhập ít nhất 3 ký tự.</div>';return}
    box.innerHTML='<div class="note">Đang tìm…</div>';
    try{
      const rs=await nom('search?q='+encodeURIComponent(/việt nam/i.test(q)?q:q.trim()+', Việt Nam')+'&countrycodes=vn&limit=6');
      if(!alive())return;results=rs;
      box.innerHTML=rs.length?'<div class="card" style="margin:10px 0 0;padding:4px 14px">'+rs.map((r,i)=>`<div class="li go" data-i="${i}"><div class="t">${esc(addrLabel(r))}<div class="mut small">${esc(r.display_name||'')}</div></div></div>`).join('')+'</div>':'<div class="note">Không tìm thấy. Thử ghi thêm tên tỉnh/thành.</div>';
      $$('.go',box).forEach(b=>b.onclick=()=>{const r=results[+b.dataset.i],l=addrLabel(r);searchOpen=false;gpsMsg='';setLoc({name:l,label:l,lat:+(+r.lat).toFixed(4),lon:+(+r.lon).toFixed(4)})});
    }catch(e){if(alive())box.innerHTML='<div class="note">Không tìm được. Cần kết nối mạng.</div>'}
  };
  function paintLoc(){
    const c=curCity();
    locEl.innerHTML=`<div class="mut small">Thời tiết tại</div><div class="big" style="font-size:22px;line-height:1.25">${esc(cityLabel(c))}</div><div class="mut small">${c.isDefault?'Chưa chọn vị trí, đang hiển thị Hà Nội':`Tọa độ ${(+c.lat).toFixed(4)}, ${(+c.lon).toFixed(4)}`}</div>
    <div class="row eq" style="margin-top:10px"><button class="btn" id="gps"${busy?' disabled':''}>📍 Vị trí hiện tại</button><button class="btn ghost" id="srch">🔎 Tìm phường/xã</button></div>
    ${gpsMsg?`<div class="note" style="margin:8px 0 0">${esc(gpsMsg)}</div>`:''}
    ${searchOpen?'<div class="row" style="margin-top:10px"><input id="q" placeholder="VD: Phường Bến Nghé, TP. Hồ Chí Minh" enterkeyhint="search"><button class="btn" id="go">Tìm</button></div><div id="res"></div>':''}
    <label class="f" style="margin:12px 0 0"><span>Hoặc chọn nhanh thành phố</span><select id="city"><option value="">— chọn —</option>${CITIES.map(x=>`<option value="${x[0]}">${x[0]}</option>`).join('')}</select></label>`;
    $('#gps',el).onclick=useGps;
    $('#srch',el).onclick=()=>{searchOpen=!searchOpen;paintLoc();const q=$('#q',el);if(q)q.focus()};
    const go=$('#go',el);if(go){go.onclick=doSearch;$('#q',el).onkeydown=e=>{if(e.key==='Enter')doSearch()}}
    $('#city',el).onchange=e=>{const x=CITIES.find(c=>c[0]===e.target.value);if(x){gpsMsg='';setLoc({name:x[0],lat:x[1],lon:x[2]})}};
  }
  async function load(){
    const cc=curCity();wb.className='mut';wb.style.padding='30px';wb.style.textAlign='center';wb.innerHTML='Đang tải…';
    try{
      const {w,a}=await getWeather(cc);if(!alive()||cc!==curCity()&&(cc.lat!==curCity().lat||cc.lon!==curCity().lon))return;
      const cu=w.current,[e,t]=WC(cu.weather_code),dl=w.daily,aq=a&&a.current?a.current:null;
      wb.className='';wb.style.padding=0;wb.style.textAlign='';
      wb.innerHTML=`<div class="card"><div class="wx"><div><div class="t">${Math.round(cu.temperature_2m)}°</div><div>${t}</div><div class="mut small">Cảm giác ${Math.round(cu.apparent_temperature)}°</div></div><div class="e">${e}</div></div></div>
      <div class="res">${rr('Độ ẩm',cu.relative_humidity_2m+'%')}${rr('Gió',fmt(cu.wind_speed_10m,0)+' km/h')}${aq?rr('Chất lượng không khí (AQI)',Math.round(aq.us_aqi)+' · '+aqiLabel(aq.us_aqi)):''}${aq?rr('Bụi mịn PM2.5',fmt(aq.pm2_5,0)+' µg/m³'):''}${rr('Mặt trời mọc / lặn',dl.sunrise[0].slice(11)+' / '+dl.sunset[0].slice(11))}</div>
      <h2>Dự báo 7 ngày</h2><div class="card">${dl.time.map((d,i)=>{const dd=new Date(d+'T00:00:00'),lab=i?['CN','T2','T3','T4','T5','T6','T7'][dd.getDay()]+' '+pad(dd.getDate())+'/'+pad(dd.getMonth()+1):'Hôm nay';return `<div class="fc"><span style="width:84px">${lab}</span><span class="e">${WC(dl.weather_code[i])[0]}</span><span class="mut small">☂ ${dl.precipitation_probability_max[i]??0}%</span><span>${Math.round(dl.temperature_2m_min[i])}° / <b>${Math.round(dl.temperature_2m_max[i])}°</b></span></div>`}).join('')}</div>
      <div class="note">Cập nhật ${esc((cu.time||'').slice(11))} · Nguồn: Open-Meteo, dự báo theo tọa độ của vị trí (độ phân giải khoảng 10 km). Tên phường/xã lấy từ OpenStreetMap, có thể chưa theo kịp các thay đổi địa giới hành chính mới.</div>`;
    }catch(err){if(!alive())return;wb.className='mut';wb.style.padding='30px';wb.style.textAlign='center';wb.textContent='Không tải được dữ liệu. Kiểm tra mạng rồi thử lại.'}
  }
  paintLoc();load();
  const sv=store.get('city',null),perm=()=>navigator.permissions&&navigator.permissions.query?navigator.permissions.query({name:'geolocation'}):Promise.reject();
  if(!sv||!isFinite(sv.lat)){perm().then(s=>{if(!alive())return;if(s.state==='granted')useGps();else{gpsMsg='Nhấn “Vị trí hiện tại” để xem thời tiết ngay tại phường bạn đang ở.';paintLoc()}}).catch(()=>{if(alive()){gpsMsg='Nhấn “Vị trí hiện tại” để xem thời tiết ngay tại phường bạn đang ở.';paintLoc()}})}
  else if(sv.gps){perm().then(s=>{if(s.state==='granted'&&alive())refreshGps(sv)}).catch(()=>{})}
}

/* ---------- Giờ ---------- */
function clockTool(el){
  const Z=[['Việt Nam','Asia/Ho_Chi_Minh'],['Tokyo','Asia/Tokyo'],['Seoul','Asia/Seoul'],['Bắc Kinh','Asia/Shanghai'],['Singapore','Asia/Singapore'],['Dubai','Asia/Dubai'],['Paris','Europe/Paris'],['London','Europe/London'],['New York','America/New_York'],['Los Angeles','America/Los_Angeles'],['Sydney','Australia/Sydney']];
  el.innerHTML=`<div class="hero"><div class="clock" id="bc"></div><div class="mut" id="bd"></div></div><div class="card" id="wl"></div>`;
  every(()=>{const n=new Date();$('#bc',el).textContent=timeStr(n,true);$('#bd',el).textContent=`${WD[n.getDay()]}, ${dstr(n)}`;
    $('#wl',el).innerHTML=Z.map(z=>{const dd=new Date(n.toLocaleString('en-US',{timeZone:z[1]}));const df=days(new Date(n.getFullYear(),n.getMonth(),n.getDate()),new Date(dd.getFullYear(),dd.getMonth(),dd.getDate()));return `<div class="fc"><span style="width:110px;color:var(--tx)">${z[0]}</span><span class="mut small">${df==0?'Hôm nay':df>0?'Ngày mai':'Hôm qua'}</span><b>${timeStr(n,false,z[1])}</b></div>`}).join('')},1000);
}

/* ---------- Lịch âm ---------- */
const SOLAR_H={'1-1':'Tết Dương lịch','14-2':'Valentine','8-3':'Quốc tế Phụ nữ','30-4':'Giải phóng miền Nam','1-5':'Quốc tế Lao động','1-6':'Quốc tế Thiếu nhi','2-9':'Quốc khánh','20-10':'Phụ nữ Việt Nam','20-11':'Nhà giáo Việt Nam','24-12':'Giáng sinh'};
const LUNAR_H={'1/1':'Tết Nguyên Đán','2/1':'Mùng 2 Tết','3/1':'Mùng 3 Tết','15/1':'Rằm tháng Giêng','3/3':'Tết Hàn Thực','10/3':'Giỗ Tổ Hùng Vương','15/4':'Lễ Phật Đản','5/5':'Tết Đoan Ngọ','15/7':'Vu Lan','15/8':'Tết Trung Thu','9/9':'Tết Trùng Cửu','10/10':'Tết Thường Tân','23/12':'Ông Táo chầu trời'};
const holOf=(d,L)=>{const a=[];const s=SOLAR_H[d.getDate()+'-'+(d.getMonth()+1)];if(s)a.push(s);if(!L.leap){const l=LUNAR_H[L.d+'/'+L.m];if(l)a.push(l)}if(!L.leap&&L.d==15&&!l15(L))a.push('Rằm');if(!L.leap&&L.d==1&&L.m!=1)a.push('Mùng 1');return a};
const l15=L=>LUNAR_H[L.d+'/'+L.m];
function evOn(d,L){const s=iso(d);return store.get('calev',[]).filter(e=>e.rep==='none'?e.date===s:e.rep==='solar'?e.date.slice(5)===s.slice(5):(!L.leap&&e.ld===L.d&&e.lm===L.m)).sort((a,b)=>(a.time||'99')<(b.time||'99')?-1:1)}
const REPL={none:'Một lần',solar:'Hằng năm (dương lịch)',lunar:'Hằng năm (âm lịch)'};
function calTool(el){
  const v=store.get('calview',null);let y=new Date().getFullYear(),m=new Date().getMonth(),sel=today0();
  if(v&&v.s&&pdate(v.s)){y=v.y;m=v.m;sel=pdate(v.s)}
  const save=()=>store.set('calview',{y,m,s:iso(sel)});
  const draw=()=>{
    const first=new Date(y,m,1),n=new Date(y,m+1,0).getDate(),off=(first.getDay()+6)%7,t=today0();
    let h=`<div class="nav"><button class="btn ghost" id="pv">‹</button><b>Tháng ${m+1}/${y}</b><button class="btn ghost" id="nx">›</button></div><div class="cal">${['T2','T3','T4','T5','T6','T7','CN'].map(x=>`<div class="h">${x}</div>`).join('')}`;
    for(let i=0;i<off;i++)h+='<div class="e"></div>';
    for(let d=1;d<=n;d++){const dt=new Date(y,m,d),L=Lunar.info(dt),hol=holOf(dt,L).length>0,ev=evOn(dt,L).length>0;
      h+=`<div class="d${+dt==+t?' today':''}${+dt==+sel?' sel':''}${hol?' hol':''}" data-d="${d}">${ev?'<i class="dot"></i>':''}<b>${d}</b><small>${L.d==1?L.d+'/'+L.m:L.d}</small></div>`}
    h+='</div><div class="card" id="dt" style="margin-top:12px"></div><h2>Sự kiện của bạn</h2><div class="card" id="ev"></div><div class="card"><label class="f"><span>Tên sự kiện</span><input id="evt" placeholder="Giỗ, họp, sinh nhật…" maxlength="60"></label><div class="row">'+f('Giờ (tùy chọn)','<input type="time" id="evh">')+f('Lặp lại','<select id="evr"><option value="none">Một lần</option><option value="solar">Hằng năm (dương lịch)</option><option value="lunar">Hằng năm (âm lịch)</option></select>')+'</div><button class="btn full" id="evadd"></button></div><h2>Sắp tới (90 ngày)</h2><div class="card" id="up"></div><button class="btn ghost full" id="td">Về hôm nay</button>';
    el.innerHTML=h;
    const L=Lunar.info(sel),hs=holOf(sel,L),evs=evOn(sel,L);
    $('#dt',el).innerHTML=`<div class="big" style="font-size:24px">${WD[sel.getDay()]}, ${dstr(sel)}</div>${rr('Âm lịch',`${L.d}/${L.m}${L.leap?' (nhuận)':''}/${L.y}`)}${rr('Ngày',L.day)}${rr('Tháng',L.month)}${rr('Năm',L.year)}${hs.length?rr('Ngày lễ',hs.join(', ')):''}`;
    $('#ev',el).innerHTML=evs.length?evs.map(e=>`<div class="li"><div class="t">${e.time?`<b>${esc(e.time)}</b> · `:''}${esc(e.t)}<div class="mut small">${REPL[e.rep]}${e.rep==='lunar'?` · ${e.ld}/${e.lm} âm`:''}</div></div><button class="x" data-id="${e.id}" aria-label="Xóa">×</button></div>`).join(''):'<div class="mut">Chưa có sự kiện trong ngày này</div>';
    $('#evadd',el).textContent='Thêm vào '+dstr(sel);
    const up=[];for(let i=0;i<=90&&up.length<8;i++){const d=new Date(t);d.setDate(d.getDate()+i);const l=Lunar.info(d);evOn(d,l).forEach(e=>up.push({d,e,i}))}
    $('#up',el).innerHTML=up.length?up.map(u=>`<div class="li go" data-s="${iso(u.d)}"><div class="t">${u.e.time?`<b>${esc(u.e.time)}</b> · `:''}${esc(u.e.t)}<div class="mut small">${WD[u.d.getDay()]}, ${dstr(u.d)}</div></div><b>${u.i==0?'Hôm nay':u.i+' ngày'}</b></div>`).join(''):'<div class="mut">Chưa có sự kiện nào sắp tới</div>';
    $('#pv',el).onclick=()=>{m--;if(m<0){m=11;y--}save();draw()};
    $('#nx',el).onclick=()=>{m++;if(m>11){m=0;y++}save();draw()};
    $('#td',el).onclick=()=>{sel=today0();y=sel.getFullYear();m=sel.getMonth();save();draw()};
    $$('.d',el).forEach(c=>c.onclick=()=>{sel=new Date(y,m,+c.dataset.d);save();draw()});
    $$('.go',el).forEach(c=>c.onclick=()=>{sel=pdate(c.dataset.s);y=sel.getFullYear();m=sel.getMonth();save();draw();window.scrollTo(0,0)});
    $$('#ev .x',el).forEach(b=>b.onclick=()=>{store.set('calev',store.get('calev',[]).filter(e=>e.id!=b.dataset.id));draw()});
    $('#evadd',el).onclick=()=>{const tt=$('#evt',el).value.trim();if(!tt){$('#evt',el).focus();return}
      const a=store.get('calev',[]);a.push({id:Date.now(),t:tt,time:$('#evh',el).value,rep:$('#evr',el).value,date:iso(sel),ld:L.d,lm:L.m});store.set('calev',a);draw()};
  };
  draw();
}

/* ---------- Ngày tháng ---------- */
function dateTool(el){
  tabs(el,[['Tính tuổi',p=>{
    p.innerHTML=f('Ngày sinh','<input type="date" id="b">')+'<div class="res" id="o"></div>';
    live(p,()=>{const b=pdate($('#b',p).value),o=$('#o',p);if(!b){o.innerHTML='<div class="rr"><span>Chọn ngày sinh</span></div>';return}
      const t=today0();let y=t.getFullYear()-b.getFullYear(),mo=t.getMonth()-b.getMonth(),d=t.getDate()-b.getDate();
      if(d<0){mo--;d+=new Date(t.getFullYear(),t.getMonth(),0).getDate()}if(mo<0){y--;mo+=12}
      let nb=new Date(t.getFullYear(),b.getMonth(),b.getDate());if(nb<t)nb=new Date(t.getFullYear()+1,b.getMonth(),b.getDate());
      const L=Lunar.info(b);
      o.innerHTML=rr('Tuổi',`${y} tuổi ${mo} tháng ${d} ngày`,1)+rr('Đã sống',fmt(days(b,t))+' ngày')+rr('Sinh nhật tới',`${days(t,nb)} ngày nữa`)+rr('Âm lịch',`${L.d}/${L.m}/${L.y} (${L.year})`)+rr('Thứ',WD[b.getDay()])}); }],
   ['2 mốc',p=>{
    p.innerHTML=f('Từ ngày',`<input type="date" id="a" value="${iso(new Date())}">`)+f('Đến ngày','<input type="date" id="b">')+'<div class="res" id="o"></div>'+
    '<h2>Cộng / trừ ngày</h2>'+f('Số ngày (âm = trừ)','<input id="n" inputmode="numeric" value="30">')+'<div class="res" id="o2"></div>';
    live(p,()=>{const a=pdate($('#a',p).value),b=pdate($('#b',p).value),o=$('#o',p);
      o.innerHTML=a&&b?rr('Số ngày',fmt(Math.abs(days(a,b))),1)+rr('Tương đương',`${fmt(Math.abs(days(a,b))/7,1)} tuần · ${fmt(Math.abs(days(a,b))/30.44,1)} tháng`):'<div class="rr"><span>Chọn 2 ngày</span></div>';
      const n=parseInt($('#n',p).value)||0;if(a){const r=new Date(a);r.setDate(r.getDate()+n);$('#o2',p).innerHTML=rr('Kết quả',`${WD[r.getDay()]}, ${dstr(r)}`,1)}else $('#o2',p).innerHTML=''})}],
   ['Đếm ngược',p=>{
    const draw=()=>{const ev=store.get('events',[]).sort((a,b)=>a.date<b.date?-1:1),t=today0();
      p.innerHTML=`<div class="row">${f('Tên sự kiện','<input id="en" placeholder="Sinh nhật, du lịch…">')}${f('Ngày','<input type="date" id="ed">')}</div><div class="row" style="margin-bottom:12px"><button class="btn" id="add">Thêm</button><button class="btn ghost" id="tet">+ Tết</button></div>
      <div class="card">${ev.length?ev.map((e,i)=>{const d=days(t,pdate(e.date));return `<div class="li"><div class="t">${esc(e.name)}<div class="mut small">${dstr(pdate(e.date))}</div></div><b>${d>0?'còn '+d+' ngày':d==0?'Hôm nay':'đã qua '+(-d)+' ngày'}</b><button class="x" data-i="${i}">×</button></div>`}).join(''):'<div class="mut">Chưa có sự kiện</div>'}</div>`;
      $('#add',p).onclick=()=>{const n=$('#en',p).value.trim(),d=$('#ed',p).value;if(!n||!d)return;const a=store.get('events',[]);a.push({name:n,date:d});store.set('events',a);draw()};
      $('#tet',p).onclick=()=>{let yy=new Date().getFullYear(),s=Lunar.lunar2solar(1,1,yy,0,7);if(new Date(s[2],s[1]-1,s[0])<t){yy++;s=Lunar.lunar2solar(1,1,yy,0,7)}const a=store.get('events',[]);a.push({name:'Tết Nguyên Đán '+yy,date:`${s[2]}-${pad(s[1])}-${pad(s[0])}`});store.set('events',a);draw()};
      $$('.x',p).forEach(b=>b.onclick=()=>{const a=store.get('events',[]).sort((a,b)=>a.date<b.date?-1:1);a.splice(+b.dataset.i,1);store.set('events',a);draw()})};
    draw()}]]);
}

/* ---------- Tài chính ---------- */
function savingsTool(el){
  el.innerHTML=f('Số tiền gửi (đ)','<input class="money" inputmode="numeric" id="p" placeholder="0">')+f('Lãi suất (%/năm)','<input inputmode="decimal" id="r" placeholder="0">')+f('Kỳ hạn (tháng)','<input inputmode="numeric" id="n" placeholder="0">')+
  f('Hình thức','<select id="m"><option value="end">Lãi nhận cuối kỳ</option><option value="month">Lãi nhận hàng tháng</option><option value="comp">Lãi nhập gốc hàng tháng</option></select>')+'<div class="res" id="o"></div><div class="note">Tính gần đúng theo tháng (lãi = gốc × lãi suất × số tháng ÷ 12). Ngân hàng có thể tính theo số ngày thực tế.</div>';
  live(el,()=>{const P=mv($('#p',el)),r=dv($('#r',el))/100,n=dv($('#n',el)),m=$('#m',el).value;let i,tot,extra='';
    if(m==='comp'){tot=P*Math.pow(1+r/12,n);i=tot-P}else{i=P*r*n/12;tot=P+i;if(m==='month')extra=rr('Lãi mỗi tháng',vnd(P*r/12))}
    $('#o',el).innerHTML=rr('Tiền lãi',vnd(i),1)+rr('Tổng nhận cuối kỳ',vnd(tot))+extra+rr('Lãi hiệu dụng/năm',(P&&n)?fmt(i/P/n*12*100,2)+'%':'0%')});
}
function pctTool(el){
  const MODES={
    up:['Giá sau khi tăng/giảm %',()=>f('Giá ban đầu (đ)','<input class="money" inputmode="numeric" id="a" placeholder="0">')+f('Tăng hay giảm','<select id="d"><option value="-1">Giảm</option><option value="1">Tăng</option></select>')+f('Phần trăm (%)','<input inputmode="decimal" id="p" placeholder="0">'),
      a=>{const A=mv($('#a',a)),P=dv($('#p',a)),d=+$('#d',a).value;if(!A||!P)return '';const e=A*(1+d*P/100);
        return rr('Giá sau cùng',vnd(e),1)+rr(d<0?'Tiết kiệm được':'Phải trả thêm',vnd(Math.abs(e-A)))+rr('So với giá đầu',fmt(e/A,3)+' lần')+(d<0?rr(`Tăng lại ${fmt(P,2)}% sẽ thành`,vnd(e*(1+P/100)))+'<div class="note">Giảm rồi tăng lại cùng một tỷ lệ thì không về đúng giá cũ.</div>':'')}],
    chg:['Tìm % tăng/giảm giữa hai giá',()=>f('Giá cũ (đ)','<input class="money" inputmode="numeric" id="a" placeholder="0">')+f('Giá mới (đ)','<input class="money" inputmode="numeric" id="b" placeholder="0">'),
      a=>{const A=mv($('#a',a)),B=mv($('#b',a));if(!A||!B)return '';const c=(B-A)/A*100;
        return rr(c>=0?'Tăng':'Giảm',fmt(Math.abs(c),2)+'%',1)+rr('Chênh lệch',(B>=A?'+ ':'− ')+vnd(Math.abs(B-A)))+rr('Giá mới bằng',fmt(B/A,3)+' lần giá cũ')+rr(B>=A?'Muốn về giá cũ phải giảm':'Muốn về giá cũ phải tăng',fmt(Math.abs((B-A)/B*100),2)+'%')}],
    orig:['Tìm giá gốc',()=>f('Giá hiện tại (đ)','<input class="money" inputmode="numeric" id="a" placeholder="0">')+f('Giá hiện tại là sau khi','<select id="d"><option value="-1">Giảm</option><option value="1">Tăng</option></select>')+f('Phần trăm (%)','<input inputmode="decimal" id="p" placeholder="0">'),
      a=>{const A=mv($('#a',a)),P=dv($('#p',a)),d=+$('#d',a).value,k=1+d*P/100;if(!A||!P||k<=0)return '';const o=A/k;
        return rr('Giá gốc',vnd(o),1)+rr('Chênh lệch với giá hiện tại',(A>=o?'+ ':'− ')+vnd(Math.abs(A-o)))}],
    two:['Giảm giá nhiều lần liên tiếp',()=>f('Giá ban đầu (đ)','<input class="money" inputmode="numeric" id="a" placeholder="0">')+f('Giảm lần 1 (%)','<input inputmode="decimal" id="p" placeholder="0">')+f('Giảm thêm lần 2 (%)','<input inputmode="decimal" id="q" placeholder="0">')+f('Giảm thêm lần 3 (%, có thể để trống)','<input inputmode="decimal" id="r" placeholder="0">'),
      a=>{const A=mv($('#a',a)),L=['p','q','r'].map(k=>dv($('#'+k,a))).filter(x=>x>0);if(!A||!L.length)return '';const k=L.reduce((m,x)=>m*(1-x/100),1),e=A*k;
        return rr('Giá cuối',vnd(e),1)+rr('Tiết kiệm được',vnd(A-e))+rr('Tương đương giảm',fmt((1-k)*100,2)+'%')+`<div class="note">Cộng thẳng sẽ ra ${fmt(L.reduce((m,x)=>m+x,0),2)}%, nhưng mỗi lần giảm tính trên giá đã giảm nên thực tế ít hơn.</div>`}],
    of:['X% của một số',()=>f('Phần trăm (%)','<input inputmode="decimal" id="p" placeholder="0">')+f('Của số (đ)','<input class="money" inputmode="numeric" id="a" placeholder="0">'),
      a=>{const A=mv($('#a',a)),P=dv($('#p',a));if(!A||!P)return '';return rr(`${fmt(P,2)}% của ${fmt(A)}`,fmt(A*P/100,2),1)+rr('Phần còn lại',fmt(A*(1-P/100),2))}],
    ratio:['A bằng bao nhiêu % của B',()=>f('Số A','<input class="money" inputmode="numeric" id="a" placeholder="0">')+f('Số B','<input class="money" inputmode="numeric" id="b" placeholder="0">'),
      a=>{const A=mv($('#a',a)),B=mv($('#b',a));if(!B)return '';return rr('A bằng',fmt(A/B*100,2)+'% của B',1)+rr('B gấp A',A?fmt(B/A,3)+' lần':'—')}]
  };
  let cur='';
  el.innerHTML=f('Cách tính','<select id="m">'+Object.keys(MODES).map(k=>`<option value="${k}">${MODES[k][0]}</option>`).join('')+'</select>')+'<div id="ff"></div><div class="res" id="o"></div>';
  live(el,()=>{const m=$('#m',el).value;if(m!==cur){cur=m;$('#ff',el).innerHTML=MODES[m][1]();}
    $('#o',el).innerHTML=MODES[m][2](el)});
}
function loanTool(el){
  el.innerHTML=f('Số tiền vay (đ)','<input class="money" inputmode="numeric" id="p" value="1.000.000.000">')+f('Lãi suất (%/năm)','<input inputmode="decimal" id="r" value="9">')+f('Thời hạn (tháng)','<input inputmode="numeric" id="n" value="240">')+
  f('Cách trả','<select id="m"><option value="dec">Gốc đều, lãi giảm dần</option><option value="ann">Trả đều hàng tháng (niên kim)</option></select>')+'<div class="res" id="o"></div><h2>Lịch trả nợ</h2><div class="card scroll" id="t"></div>';
  live(el,()=>{const P=mv($('#p',el)),r=dv($('#r',el))/1200,n=Math.round(dv($('#n',el))),m=$('#m',el).value;if(!P||!n){$('#o',el).innerHTML='';$('#t',el).innerHTML='';return}
    let bal=P,tl=0,rows='',first=0,last=0;const pm=r?P*r/(1-Math.pow(1+r,-n)):P/n;
    for(let k=1;k<=n;k++){const it=bal*r,pr=m==='dec'?P/n:pm-it,pay=pr+it;bal=Math.max(0,bal-pr);tl+=it;if(k==1)first=pay;if(k==n)last=pay;if(k<=360)rows+=`<tr><td>${k}</td><td>${fmt(pr)}</td><td>${fmt(it)}</td><td>${fmt(pay)}</td><td>${fmt(bal)}</td></tr>`}
    $('#o',el).innerHTML=rr('Tháng đầu phải trả',vnd(first),1)+(m==='dec'?rr('Tháng cuối',vnd(last)):'')+rr('Tổng lãi',vnd(tl))+rr('Tổng gốc + lãi',vnd(P+tl));
    $('#t',el).innerHTML=`<table><tr><th>Kỳ</th><th>Gốc</th><th>Lãi</th><th>Tổng</th><th>Dư nợ</th></tr>${rows}</table>`});
}
function salaryTool(el){
  el.innerHTML=f('Chiều tính','<select id="d"><option value="g">Gross → Net</option><option value="n">Net → Gross</option></select>')+f('Mức lương (đ/tháng)','<input class="money" inputmode="numeric" id="s" value="30.000.000">')+f('Số người phụ thuộc','<input inputmode="numeric" id="dp" value="0">')+
  f('Trần lương đóng bảo hiểm (đ)','<input class="money" inputmode="numeric" id="cap" value="46.800.000">')+'<div class="res" id="o"></div><div class="note">Bảo hiểm: BHXH 8% + BHYT 1,5% + BHTN 1% = 10,5% (trần BHTN thực tế có thể khác trần BHXH). Giảm trừ bản thân 15,5 triệu, người phụ thuộc 6,2 triệu; biểu thuế 5 bậc (5/15/25/30/35%) theo luật có hiệu lực từ 2026. Kết quả mang tính tham khảo — hãy đối chiếu quy định hiện hành.</div>';
  const B=[[10e6,.05],[30e6,.15],[60e6,.25],[100e6,.30],[Infinity,.35]];
  const calc=(g,dp,cap)=>{const ins=Math.min(g,cap)*.105,ti=Math.max(0,g-ins-15.5e6-dp*6.2e6);let tax=0,prev=0;for(const[l,r]of B){if(ti>prev)tax+=(Math.min(ti,l)-prev)*r;prev=l}return{ins,ti,tax,net:g-ins-tax}};
  live(el,()=>{let s=mv($('#s',el)),dp=parseInt($('#dp',el).value)||0,cap=mv($('#cap',el))||46.8e6,g=s;
    if($('#d',el).value==='n'){let lo=s,hi=s*3+1e6;for(let i=0;i<60;i++){const mid=(lo+hi)/2;calc(mid,dp,cap).net<s?lo=mid:hi=mid}g=Math.round((lo+hi)/2)}
    const r=calc(g,dp,cap);
    $('#o',el).innerHTML=rr('Lương Gross',vnd(g))+rr('Bảo hiểm (10,5%)','− '+vnd(r.ins))+rr('Thu nhập tính thuế',vnd(r.ti))+rr('Thuế TNCN','− '+vnd(r.tax))+rr('Lương Net',vnd(r.net),1)});
}
const capText=iso8=>{const d=new Date(iso8);return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${dstr(d)}`};
function snapHead(D){
  const age=Date.now()-new Date(D.captured).getTime(),h=Math.floor(age/36e5);
  const stale=age>864e5?`<div class="banner">Bản chụp đã ${h>=48?Math.floor(h/24)+' ngày':h+' giờ'} trước, giá thực tế có thể đã đổi.</div>`:'';
  return stale+`<div class="res" style="margin-bottom:12px">${rr(D.dataLabel,esc(D.dataTime))}${rr(D.live?'Lấy lúc':'Chụp lúc',capText(D.captured))}${rr('Nguồn',`<a class="lnk" href="${esc(D.url)}" target="_blank" rel="noopener">${esc(D.source)}</a>`)}</div>`;
}
const snapFoot=D=>`<div class="note">${esc(D.note||'')}<br>${D.live?'Giá được lấy mới qua mạng khi bạn mở app, không chỉnh sửa trong app.':'Chưa lấy được giá mới qua mạng nên đang hiển thị bản chụp, không chỉnh sửa trong app.'}</div>`;
function snapTable(s){return `<h2>${esc(s.title)}</h2><div class="card tw"><table><tr>${s.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${s.rows.map(r=>`<tr>${r.map((c,ci)=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`}
function moreBlock(B){
  const age=Date.now()-new Date(B.captured).getTime(),h=Math.floor(age/36e5);
  const stale=age>864e5?`<div class="banner">Bản chụp đã ${h>=48?Math.floor(h/24)+' ngày':h+' giờ'} trước, giá thực tế có thể đã đổi.</div>`:'';
  return `<h2>${esc(B.title)}</h2>${stale}<div class="res" style="margin-bottom:12px">${rr(B.dataLabel,esc(B.dataTime))}${rr('Chụp lúc',capText(B.captured))}${rr('Nguồn',`<a class="lnk" href="${esc(B.url)}" target="_blank" rel="noopener">${esc(B.source)}</a>`)}</div><div class="card tw"><table><tr>${B.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${B.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div><div class="note">${esc(B.note||'')}</div>`;
}
function snapTool(key){return el=>{const D=DATA[key];el.innerHTML=snapHead(D)+D.sections.map(snapTable).join('')+(D.more||[]).map(moreBlock).join('')+snapFoot(D)}}
function tierRows(tiers,labels){return tiers.map((t,i)=>`<tr><td>${labels[i]}</td><td>${fmt(t[1])}</td></tr>`).join('')}
function fuelTool(el){
  const D=DATA.xang;
  el.innerHTML=snapHead(D)+D.sections.map(snapTable).join('')+'<h2>Tính chi phí chuyến đi</h2>'+f('Loại nhiên liệu','<select id="ft">'+D.fuels.map((x,i)=>`<option value="${i}">${x.n} · ${fmt(x.p)} đ/lít</option>`).join('')+'</select>')+
  f('Quãng đường (km)','<input inputmode="decimal" id="d" placeholder="0">')+f('Mức tiêu hao (lít/100 km)','<input inputmode="decimal" id="c" placeholder="0">')+f('Số người đi chung','<input inputmode="numeric" id="n" value="1">')+'<div class="res" id="o"></div>'+snapFoot(D);
  live(el,()=>{const p=D.fuels[+$('#ft',el).value].p,d=dv($('#d',el)),c=dv($('#c',el)),n=Math.max(1,parseInt($('#n',el).value)||1),L=d*c/100,cost=L*p;
    $('#o',el).innerHTML=rr('Xăng dầu tiêu thụ',fmt(L,2)+' lít')+rr('Chi phí',vnd(cost),1)+rr('Mỗi km',vnd(d?cost/d:0))+(n>1?rr('Mỗi người',vnd(cost/n)):'')});
}
function splitTool(el){
  tabs(el,[['Chia đều',p=>{
    p.innerHTML=f('Tổng tiền (đ)','<input class="money" inputmode="numeric" id="t" value="1.200.000">')+f('Số người','<input inputmode="numeric" id="n" value="4">')+f('Tiền tip / phí (%)','<input inputmode="decimal" id="tip" value="0">')+'<div class="res" id="o"></div>';
    live(p,()=>{const t=mv($('#t',p))*(1+dv($('#tip',p))/100),n=Math.max(1,parseInt($('#n',p).value)||1);$('#o',p).innerHTML=rr('Tổng cộng',vnd(t))+rr('Mỗi người',vnd(Math.ceil(t/n/1000)*1000),1)+'<div class="note">Đã làm tròn lên 1.000đ.</div>'})}],
   ['Ai trả bao nhiêu',p=>{
    let rows=store.get('split',[{n:'An',a:0},{n:'Bình',a:0},{n:'Chi',a:0}]);
    const draw=()=>{p.innerHTML=`<div class="note" style="margin-top:0">Nhập số tiền mỗi người ĐÃ chi, app tính ai chuyển cho ai.</div><div class="card">${rows.map((r,i)=>`<div class="row" style="margin-bottom:8px"><input data-i="${i}" data-k="n" value="${esc(r.n)}" placeholder="Tên"><input class="money" inputmode="numeric" data-i="${i}" data-k="a" value="${r.a?fmt(r.a):''}" placeholder="Đã chi"><button class="btn ghost" data-x="${i}">×</button></div>`).join('')}<button class="btn ghost full" id="add">+ Thêm người</button></div><div class="res" id="o"></div>`;
      $('#add',p).onclick=()=>{rows.push({n:'',a:0});store.set('split',rows);draw()};
      $$('[data-x]',p).forEach(b=>b.onclick=()=>{rows.splice(+b.dataset.x,1);store.set('split',rows);draw()});
      const calc=()=>{const tot=rows.reduce((s,r)=>s+r.a,0),sh=tot/(rows.length||1);let d=rows.map(r=>({n:r.n||'?',b:r.a-sh})),cr=d.filter(x=>x.b>1).sort((a,b)=>b.b-a.b),db=d.filter(x=>x.b<-1).sort((a,b)=>a.b-b.b),out='';
        for(const x of db){let need=-x.b;for(const c of cr){if(need<1)break;const m=Math.min(need,c.b);if(m>=1){out+=rr(`${esc(x.n)} → ${esc(c.n)}`,vnd(Math.round(m)));c.b-=m;need-=m}}}
        $('#o',p).innerHTML=rr('Tổng chi',vnd(tot))+rr('Mỗi người',vnd(sh),1)+(out||'<div class="rr"><span>Không ai phải chuyển</span></div>')};
      p.oninput=e=>{const t=e.target;if(t.dataset.i===undefined)return;rows[+t.dataset.i][t.dataset.k]=t.dataset.k==='a'?mv(t):t.value;store.set('split',rows);calc()};calc()};
    draw()}]]);
}
function ledgerTool(el){
  const draw=()=>{const L=store.get('ledger',[]),mon=iso(new Date()).slice(0,7);const ml=L.filter(x=>x.d.startsWith(mon));const inc=ml.filter(x=>x.t=='thu').reduce((s,x)=>s+x.a,0),exp=ml.filter(x=>x.t=='chi').reduce((s,x)=>s+x.a,0);
    el.innerHTML=`<div class="res">${rr('Thu tháng này',vnd(inc))}${rr('Chi tháng này',vnd(exp))}${rr('Còn lại',vnd(inc-exp),1)}</div><h2>Thêm khoản</h2>
    <div class="row">${f('Loại','<select id="t"><option value="chi">Chi</option><option value="thu">Thu</option></select>')}${f('Số tiền','<input class="money" inputmode="numeric" id="a">')}</div>${f('Ghi chú','<input id="n" placeholder="Ăn trưa, xăng…">')}<button class="btn full" id="add">Thêm</button>
    <h2>Gần đây</h2><div class="card">${L.length?L.slice().reverse().slice(0,40).map(x=>`<div class="li"><div class="t">${esc(x.n||(x.t=='chi'?'Chi':'Thu'))}<div class="mut small">${dstr(pdate(x.d))}</div></div><b>${x.t=='chi'?'−':'+'}${fmt(x.a)}</b><button class="x" data-id="${x.id}">×</button></div>`).join(''):'<div class="mut">Chưa có khoản nào</div>'}</div>`;
    $('#add',el).onclick=()=>{const a=mv($('#a',el));if(!a)return;L.push({id:Date.now(),t:$('#t',el).value,a,n:$('#n',el).value.trim(),d:iso(new Date())});store.set('ledger',L);draw()};
    $$('.x',el).forEach(b=>b.onclick=()=>{store.set('ledger',L.filter(x=>x.id!=b.dataset.id));draw()})};
  draw();
}
function debtTool(el){
  const draw=()=>{const L=store.get('debts',[]);const lend=L.filter(x=>!x.ok&&x.t=='cho').reduce((s,x)=>s+x.a,0),bor=L.filter(x=>!x.ok&&x.t=='no').reduce((s,x)=>s+x.a,0);
    el.innerHTML=`<div class="res">${rr('Người khác nợ bạn',vnd(lend))}${rr('Bạn nợ người khác',vnd(bor))}</div><h2>Thêm khoản</h2><div class="row">${f('Loại','<select id="t"><option value="cho">Cho vay</option><option value="no">Đi vay</option></select>')}${f('Số tiền','<input class="money" inputmode="numeric" id="a">')}</div>${f('Tên người','<input id="n">')}<button class="btn full" id="add">Thêm</button>
    <h2>Danh sách</h2><div class="card">${L.length?L.map(x=>`<div class="li${x.ok?' done':''}"><input type="checkbox" data-id="${x.id}" ${x.ok?'checked':''}><div class="t">${esc(x.n||'?')} <span class="mut small">${x.t=='cho'?'nợ bạn':'bạn nợ'} · ${dstr(pdate(x.d))}</span></div><b>${fmt(x.a)}</b><button class="x" data-x="${x.id}">×</button></div>`).join(''):'<div class="mut">Trống</div>'}</div><div class="note">Tick ô vuông khi đã trả xong.</div>`;
    $('#add',el).onclick=()=>{const a=mv($('#a',el));if(!a)return;L.unshift({id:Date.now(),t:$('#t',el).value,a,n:$('#n',el).value.trim(),d:iso(new Date()),ok:false});store.set('debts',L);draw()};
    $$('input[type=checkbox]',el).forEach(c=>c.onchange=()=>{L.find(x=>x.id==c.dataset.id).ok=c.checked;store.set('debts',L);draw()});
    $$('.x',el).forEach(b=>b.onclick=()=>{store.set('debts',L.filter(x=>x.id!=b.dataset.x));draw()})};
  draw();
}

/* ---------- Đời sống ---------- */
function todoTool(el){
  const draw=()=>{const L=store.get('todos',[]);
    el.innerHTML=`<div class="row" style="margin-bottom:12px"><input id="n" placeholder="Việc cần làm…" enterkeyhint="done"><button class="btn" id="add">Thêm</button></div><div class="card">${L.length?L.map(x=>`<div class="li${x.ok?' done':''}"><input type="checkbox" data-id="${x.id}" ${x.ok?'checked':''}><div class="t">${esc(x.t)}</div><button class="x" data-x="${x.id}">×</button></div>`).join(''):'<div class="mut">Chưa có việc nào 🎉</div>'}</div>${L.some(x=>x.ok)?'<button class="btn ghost full" id="clr">Xóa việc đã xong</button>':''}`;
    const add=()=>{const v=$('#n',el).value.trim();if(!v)return;L.unshift({id:Date.now(),t:v,ok:false});store.set('todos',L);draw()};
    $('#add',el).onclick=add;$('#n',el).onkeydown=e=>{if(e.key==='Enter')add()};
    $$('input[type=checkbox]',el).forEach(c=>c.onchange=()=>{L.find(x=>x.id==c.dataset.id).ok=c.checked;store.set('todos',L);draw()});
    $$('.x',el).forEach(b=>b.onclick=()=>{store.set('todos',L.filter(x=>x.id!=b.dataset.x));draw()});
    const cl=$('#clr',el);if(cl)cl.onclick=()=>{store.set('todos',L.filter(x=>!x.ok));draw()}};
  draw();
}
function noteTool(el){
  el.innerHTML=`<textarea id="n" style="min-height:60vh" placeholder="Ghi chú nhanh… (tự động lưu)"></textarea>`;
  const t=$('#n',el);t.value=store.get('note','');t.oninput=()=>store.set('note',t.value);
}
function pomoTool(el){
  let mode='work',end=0,left=25*60,run=false;const dur={work:25*60,rest:5*60};
  el.innerHTML=`<div class="seg"><button data-m="work" class="on">Tập trung 25′</button><button data-m="rest">Nghỉ 5′</button></div><div class="timer" id="tm"></div><div class="row"><button class="btn" id="go">Bắt đầu</button><button class="btn ghost" id="rs">Đặt lại</button></div><div class="note" id="cnt"></div>`;
  const show=()=>{$('#tm',el).textContent=`${pad(Math.floor(left/60))}:${pad(left%60)}`;$('#go',el).textContent=run?'Tạm dừng':'Bắt đầu'};
  const beep=()=>TI.beep(2);
  every(()=>{if(run){left=Math.max(0,Math.round((end-Date.now())/1000));if(left<=0){run=false;beep();if(mode==='work'){const k=store.get('pomo_'+iso(new Date()),0)+1;store.set('pomo_'+iso(new Date()),k)}}}show();$('#cnt',el).textContent='Hôm nay hoàn thành: '+store.get('pomo_'+iso(new Date()),0)+' phiên'},500);
  $('#go',el).onclick=()=>{TI.unlockAudio();if(run){run=false}else{if(left<=0)left=dur[mode];end=Date.now()+left*1000;run=true}show()};
  $('#rs',el).onclick=()=>{run=false;left=dur[mode];show()};
  $('.seg',el).onclick=e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.m;run=false;left=dur[mode];$$('.seg button',el).forEach(x=>x.classList.toggle('on',x==b));show()};
}
function waterTool(el){
  const key='water_'+iso(new Date());
  el.innerHTML=f('Cân nặng (kg) — để tính mục tiêu','<input inputmode="decimal" id="w">')+'<div class="card"><div class="rr big" style="border:0"><span>Đã uống hôm nay</span><b id="ml"></b></div><div class="wcup"><div id="bar"></div></div><div class="mut small" id="goal"></div></div><div class="row"><button class="btn" data-a="200">+200</button><button class="btn" data-a="250">+250</button><button class="btn" data-a="500">+500</button><button class="btn ghost" data-a="-250">−250</button></div><div class="note">Mục tiêu ≈ 33 ml × cân nặng (mặc định 2.000 ml). App chạy trên Safari/iPhone không nhắc được khi đóng, hãy dùng nhắc nhở của iPhone nếu cần.</div>';
  const w=$('#w',el);w.value=store.get('weight','');
  const draw=()=>{const g=dv(w)>0?Math.round(dv(w)*33/50)*50:2000,v=store.get(key,0);$('#ml',el).textContent=fmt(v)+' ml';$('#goal',el).textContent='Mục tiêu: '+fmt(g)+' ml';$('#bar',el).style.width=Math.min(100,v/g*100)+'%'};
  w.oninput=()=>{store.set('weight',w.value);draw()};
  $$('[data-a]',el).forEach(b=>b.onclick=()=>{store.set(key,Math.max(0,store.get(key,0)+ +b.dataset.a));draw()});draw();
}
function bmiTool(el){
  el.innerHTML=`<div class="row">${f('Giới tính','<select id="g"><option value="m">Nam</option><option value="f">Nữ</option></select>')}${f('Tuổi','<input inputmode="numeric" id="a" value="30">')}</div><div class="row">${f('Chiều cao (cm)','<input inputmode="decimal" id="h" value="165">')}${f('Cân nặng (kg)','<input inputmode="decimal" id="w" value="60">')}</div>${f('Vận động','<select id="act"><option value="1.2">Ít vận động</option><option value="1.375" selected>Nhẹ (1–3 buổi/tuần)</option><option value="1.55">Vừa (3–5 buổi/tuần)</option><option value="1.725">Nhiều (6–7 buổi/tuần)</option></select>')}<div class="res" id="o"></div><div class="note">Phân loại BMI theo chuẩn châu Á – Thái Bình Dương. Calo theo công thức Mifflin-St Jeor. Chỉ mang tính tham khảo.</div>`;
  live(el,()=>{const h=dv($('#h',el))/100,w=dv($('#w',el)),a=dv($('#a',el)),m=$('#g',el).value==='m',b=w/(h*h),cat=b<18.5?'Thiếu cân':b<23?'Bình thường':b<25?'Thừa cân':b<30?'Tiền béo phì':'Béo phì';
    const bmr=10*w+6.25*h*100-5*a+(m?5:-161),tdee=bmr*parseFloat($('#act',el).value);
    $('#o',el).innerHTML=rr('BMI',`${fmt(b,1)} · ${cat}`,1)+rr('Cân nặng lý tưởng (BMI 18,5–22,9)',`${fmt(18.5*h*h,1)}–${fmt(22.9*h*h,1)} kg`)+rr('Năng lượng nghỉ (BMR)',fmt(bmr)+' kcal')+rr('Calo/ngày để giữ cân',fmt(tdee)+' kcal')+rr('Nước nên uống',fmt(w*33/1000,1)+' lít/ngày')});
}
const FOOD={'Sáng':['Phở bò','Bún riêu','Bánh mì ốp la','Xôi mặn','Hủ tiếu','Bún bò Huế','Cháo sườn','Bánh cuốn','Bún chả','Mì Quảng','Bánh canh','Cơm tấm','Bột chiên','Bánh ướt'],'Trưa':['Cơm gà','Cơm sườn nướng','Bún thịt nướng','Mì xào bò','Cơm chiên dương châu','Bún đậu mắm tôm','Cơm văn phòng','Bánh mì chả cá','Cơm rang dưa bò','Bún măng vịt','Miến gà','Cơm cá kho'],'Tối':['Canh chua cá','Thịt kho trứng','Lẩu thái','Gà nướng','Đậu sốt cà chua','Cá kho tộ','Rau muống xào tỏi','Bò xào hành','Canh bí đỏ','Lẩu nấm','Bánh xèo','Gỏi cuốn','Sườn xào chua ngọt','Tôm rang thịt']};
function foodTool(el){
  let meal=['Sáng','Trưa','Tối'][Math.min(2,Math.max(0,[6,11,17].filter(h=>new Date().getHours()>=h).length-1))];
  el.innerHTML=`<div class="seg">${Object.keys(FOOD).map(k=>`<button data-m="${k}">${k}</button>`).join('')}</div><div class="card" style="text-align:center;padding:30px 14px"><div style="font-size:54px">🍜</div><div class="big" id="r" style="font-size:28px">?</div></div><button class="btn full" id="go">Quay món khác</button>`;
  const upd=()=>$$('.seg button',el).forEach(b=>b.classList.toggle('on',b.dataset.m===meal));
  const go=()=>{const l=FOOD[meal];let n=0;const id=setInterval(()=>{const r=$('#r',el);if(!r){clearInterval(id);return}r.textContent=l[rnd(l.length)];if(++n>10)clearInterval(id)},60)};
  $('.seg',el).onclick=e=>{const b=e.target.closest('button');if(b){meal=b.dataset.m;upd();go()}};
  $('#go',el).onclick=go;upd();go();
}

/* ---------- Công cụ ---------- */
const UN={'Diện tích':{'m²':1,'ha':1e4,'km²':1e6,'sào Bắc Bộ (360 m²)':360,'sào Trung Bộ (500 m²)':500,'công đất Nam Bộ (1.000 m²)':1000,'ft²':.09290304,'acre':4046.8564224},
 'Chiều dài':{'m':1,'cm':.01,'mm':.001,'km':1000,'inch':.0254,'ft':.3048,'dặm (mile)':1609.344,'hải lý':1852},
 'Khối lượng':{'kg':1,'g':.001,'tấn':1000,'tạ (100 kg)':100,'yến (10 kg)':10,'lb':.45359237,'oz':.028349523,'lượng vàng (37,5 g)':.0375,'chỉ vàng (3,75 g)':.00375,'phân vàng (0,375 g)':.000375},
 'Thể tích':{'lít':1,'ml':.001,'m³':1000,'gallon (US)':3.785411784,'cốc (240 ml)':.24},
 'Nhiệt độ':null};
function unitTool(el){
  el.innerHTML=f('Loại','<select id="c">'+Object.keys(UN).map(k=>`<option>${k}</option>`).join('')+'</select>')+'<div class="row">'+f('Giá trị','<input id="v" inputmode="decimal" value="1">')+f('Đổi từ','<select id="a"></select>')+'</div><div class="res" id="o"></div>';
  const fill=()=>{const c=$('#c',el).value,u=c==='Nhiệt độ'?['°C','°F','K']:Object.keys(UN[c]);$('#a',el).innerHTML=u.map(x=>`<option>${x}</option>`).join('');calc()};
  const calc=()=>{const c=$('#c',el).value,v=dv($('#v',el)),a=$('#a',el).value;let o='';
    if(c==='Nhiệt độ'){const C=a==='°C'?v:a==='°F'?(v-32)*5/9:v-273.15;o=rr('°C',fmt(C,2))+rr('°F',fmt(C*9/5+32,2))+rr('K',fmt(C+273.15,2))}
    else{const b=v*UN[c][a];o=Object.keys(UN[c]).filter(k=>k!==a).map(k=>rr(k,fmt(b/UN[c][k],6))).join('')}
    $('#o',el).innerHTML=o};
  $('#c',el).onchange=fill;$('#a',el).onchange=calc;$('#v',el).oninput=calc;fill();
}
const D0=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
function read3(n,full){const tr=Math.floor(n/100),ch=Math.floor(n%100/10),dv=n%10;let s='';
  if(tr>0||full)s+=D0[tr]+' trăm';
  if(ch>1){s+=' '+D0[ch]+' mươi';if(dv==1)s+=' mốt';else if(dv==4)s+=' tư';else if(dv==5)s+=' lăm';else if(dv>0)s+=' '+D0[dv]}
  else if(ch==1){s+=' mười';if(dv==5)s+=' lăm';else if(dv>0)s+=' '+D0[dv]}
  else if(dv>0){if(tr>0||full)s+=' lẻ';s+=' '+D0[dv]}
  return s.trim()}
function numWords(n){if(n===0)return 'Không';const U=['','nghìn','triệu','tỷ','nghìn tỷ','triệu tỷ'];const g=[];let x=n;while(x>0){g.push(x%1000);x=Math.floor(x/1000)}
  let out=[];for(let i=g.length-1;i>=0;i--){if(g[i]===0)continue;const hi=g.slice(i+1).some(v=>v>0);out.push(read3(g[i],hi)+(U[i]?' '+U[i]:''))}
  const s=out.join(' ');return s.charAt(0).toUpperCase()+s.slice(1)}
function wordsTool(el){
  el.innerHTML=f('Số tiền (đ)','<input class="money" inputmode="numeric" id="n" value="1.250.000">')+'<div class="card" id="o" style="font-size:18px"></div><button class="btn ghost full" id="cp">Sao chép</button>';
  let txt='';live(el,()=>{const n=mv($('#n',el));txt=n>9e15?'Số quá lớn':numWords(n)+' đồng';$('#o',el).textContent=txt});
  $('#cp',el).onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(txt);$('#cp',el).textContent='Đã sao chép ✓';setTimeout(()=>$('#cp',el).textContent='Sao chép',1200)};
}
function qrCanvas(text){
  const m=QR.matrix(text),n=m.length,b=4,sc=Math.max(4,Math.ceil(1000/(n+2*b))),S=(n+2*b)*sc,c=document.createElement('canvas');
  c.width=c.height=S;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,S,S);x.fillStyle='#000';
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(m[r][k])x.fillRect((k+b)*sc,(r+b)*sc,sc,sc);
  return c;
}
async function saveQR(c){
  const blob=await new Promise(r=>c.toBlob(r,'image/png')),file=new File([blob],'ma-qr.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e&&e.name==='AbortError')return}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='ma-qr.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);
}
function qrTool(el){
  el.innerHTML=f('Nội dung (link, văn bản, số điện thoại…)','<textarea id="t" style="min-height:80px" placeholder="https://"></textarea>')+'<div class="qr" id="q"></div><button class="btn full" id="sv">Lưu ảnh mã QR</button><div class="note" id="qn">Trên iPhone: chọn “Lưu hình ảnh” trong bảng chia sẻ, hoặc nhấn giữ vào mã QR rồi chọn Lưu vào Ảnh.</div>';
  let cv=null;const sv=$('#sv',el);
  live(el,()=>{const t=$('#t',el).value.trim(),q=$('#q',el);
    if(!t){cv=null;sv.disabled=true;q.innerHTML='<div style="text-align:center;color:#555;padding:48px 0;font-size:14px">Nhập nội dung để tạo mã</div>';return}
    try{cv=qrCanvas(t);const im=new Image();im.alt='Mã QR';im.src=cv.toDataURL('image/png');q.innerHTML='';q.appendChild(im);sv.disabled=false}
    catch(e){cv=null;sv.disabled=true;q.innerHTML='<div style="text-align:center;color:#555;padding:48px 0;font-size:14px">Nội dung quá dài (tối đa khoảng 200 ký tự)</div>'}});
  sv.onclick=async()=>{if(!cv)return;try{await saveQR(cv)}catch(e){}$('#qn',el).textContent='Nếu ảnh chưa được lưu, hãy nhấn giữ vào mã QR rồi chọn Lưu vào Ảnh.'};
}
function calcTool(el){
  const keys=['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='];
  el.innerHTML=`<div class="card" style="text-align:right"><div class="mut small" id="ex" style="min-height:20px"></div><div class="big" id="dp" style="word-break:break-all">0</div></div><div class="grid" style="grid-template-columns:repeat(4,1fr)">${keys.map(k=>`<button class="btn${/\d|\./.test(k)?' ghost':''}" data-k="${k}" style="padding:16px 0;font-size:20px">${k}</button>`).join('')}</div>`;
  let s='';const show=()=>{$('#dp',el).textContent=s||'0'};
  const ev=x=>{try{const e=x.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/(\d+(\.\d+)?)%/g,'($1/100)');if(!/^[\d+\-*/().\s]+$/.test(e))return 'Lỗi';const r=Function('"use strict";return ('+e+')')();return isFinite(r)?String(+r.toPrecision(12)):'Lỗi'}catch(e){return 'Lỗi'}};
  el.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;
    if(k==='C')s='';else if(k==='⌫')s=s.slice(0,-1);else if(k==='='){}else if(k==='±'){s=s.startsWith('-')?s.slice(1):s?'-'+s:s}else s+=k;
    if(k==='='){$('#ex',el).textContent=s;s=ev(s)==='Lỗi'?'':ev(s)}show()};
}
function randTool(el){
  el.innerHTML=f('Danh sách (mỗi dòng một tên)','<textarea id="l" placeholder="An&#10;Bình&#10;Chi&#10;Dũng"></textarea>')+'<div class="row"><button class="btn" id="one">Chọn 1 người</button></div><div class="row" style="margin-top:8px">'+f('Số nhóm','<input id="g" inputmode="numeric" value="2">')+'<button class="btn" id="tm" style="margin-top:6px">Chia nhóm</button></div><div class="card" id="o" style="min-height:60px"></div>';
  const L=$('#l',el);L.value=store.get('randlist','');const names=()=>{store.set('randlist',L.value);return L.value.split('\n').map(x=>x.trim()).filter(Boolean)};
  $('#one',el).onclick=()=>{const n=names();$('#o',el).innerHTML=n.length?`<div class="big" style="text-align:center">🎯 ${esc(n[rnd(n.length)])}</div>`:'Hãy nhập danh sách'};
  $('#tm',el).onclick=()=>{const n=shuffle(names()),g=Math.max(1,parseInt($('#g',el).value)||1);if(!n.length){$('#o',el).textContent='Hãy nhập danh sách';return}const T=Array.from({length:g},()=>[]);n.forEach((x,i)=>T[i%g].push(x));$('#o',el).innerHTML=T.map((t,i)=>rr('Nhóm '+(i+1),esc(t.join(', ')||'—'))).join('')};
}

const TOOLS=[
 {id:'gio',name:'Giờ & múi giờ',icon:'🕐',group:'Thời gian',view:clockTool},
 {id:'lich',name:'Lịch & sự kiện',icon:'📅',group:'Thời gian',view:calTool},
 {id:'thoitiet',name:'Thời tiết',icon:'🌤️',group:'Thời gian',view:weatherTool},
 {id:'ngay',name:'Ngày tháng',icon:'⏳',group:'Thời gian',view:dateTool},
 {id:'laisuat',name:'Lãi tiết kiệm',icon:'🏦',group:'Tài chính',view:savingsTool},
 {id:'vang',name:'Giá vàng',icon:'🪙',group:'Tài chính',view:snapTool('vang')},
 {id:'chungkhoan',name:'Chứng khoán',icon:'📈',group:'Tài chính',view:snapTool('ck')},
 {id:'phantram',name:'Tăng giảm %',icon:'🏷️',group:'Tài chính',view:pctTool},
 {id:'vay',name:'Tính khoản vay',icon:'🏠',group:'Tài chính',view:loanTool},
 {id:'luong',name:'Lương Gross/Net',icon:'💼',group:'Tài chính',view:salaryTool},
 {id:'chia',name:'Chia tiền nhóm',icon:'🍻',group:'Tài chính',view:splitTool},
 {id:'chitieu',name:'Sổ chi tiêu',icon:'👛',group:'Tài chính',view:ledgerTool},
 {id:'no',name:'Sổ nợ',icon:'🤝',group:'Tài chính',view:debtTool},
 {id:'xang',name:'Giá xăng dầu',icon:'⛽',group:'Tài chính',view:fuelTool},
 {id:'viec',name:'Việc cần làm',icon:'✅',group:'Đời sống',view:todoTool},
 {id:'ghichu',name:'Ghi chú',icon:'📝',group:'Đời sống',view:noteTool},
 {id:'pomodoro',name:'Pomodoro',icon:'🍅',group:'Đời sống',view:pomoTool},
 {id:'nuoc',name:'Uống nước',icon:'💧',group:'Đời sống',view:waterTool},
 {id:'bmi',name:'BMI & Calo',icon:'⚖️',group:'Đời sống',view:bmiTool},
 {id:'anGi',name:'Hôm nay ăn gì?',icon:'🍜',group:'Đời sống',view:foodTool},
 {id:'doidonvi',name:'Đổi đơn vị',icon:'📐',group:'Công cụ',view:unitTool},
 {id:'docso',name:'Đọc số thành chữ',icon:'🔢',group:'Công cụ',view:wordsTool},
 {id:'qr',name:'Tạo mã QR',icon:'▦',group:'Công cụ',view:qrTool},
 {id:'maytinh',name:'Máy tính',icon:'🧮',group:'Công cụ',view:calcTool},
 {id:'bocthang',name:'Bốc thăm / chia nhóm',icon:'👥',group:'Công cụ',view:randTool}
];
window.TI={qrCanvas,saveQR,cur:null,cleanups:[],$,$$,store,fmt,vnd,pad,esc,dstr,iso,pdate,today0,days,timeStr,WD,every,clearTimers,getWeather,WC,curCity,cityLabel,capText,holOf,TOOLS,f,rr,tabs,live,dv,rnd};
})();
