(function(){
'use strict';
const {$,$$,store,fmt,pad,esc,dstr,today0,days,timeStr,WD,every,clearTimers,getWeather,WC,curCity,cityLabel,holOf,TOOLS}=TI;
const view=$('#view'),title=$('#title'),back=$('#back'),gear=$('#gear');

/* chặn zoom trên iOS */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
document.addEventListener('dblclick',e=>e.preventDefault());

/* giao diện sáng / tối */
function applyTheme(anim){
  const t=store.get('theme','dark'),root=document.documentElement;
  const dark=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  if(anim===true&&!matchMedia('(prefers-reduced-motion:reduce)').matches){root.classList.add('tfx');void root.offsetWidth;clearTimeout(applyTheme._t);applyTheme._t=setTimeout(()=>root.classList.remove('tfx'),750)}
  root.dataset.theme=dark?'dark':'light';
  const mt=$('meta[name=theme-color]');if(mt)mt.content=dark?'#1e2535':'#ddd3bc';
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme(true));

/* màn hình chào */
(function splash(){
  const s=$('#splash');
  let seen=false;try{seen=sessionStorage.getItem('seen');if(!seen)sessionStorage.setItem('seen','1')}catch(e){}
  if(seen){s.remove();return}
  const n=store.get('name','');
  $('#hello').textContent='Xin chào'+(n?', '+n:'');
  $('#hellosub').textContent=TI.kodaPrompt?TI.kodaPrompt():'Tôi có thể giúp gì cho bạn?';
  const close=()=>{s.classList.add('out');setTimeout(()=>s.remove(),320)};
  s.onclick=close;setTimeout(close,1050);
})();

/* trang chủ */
function nextTet(){
  const t=today0();let y=t.getFullYear(),s=Lunar.lunar2solar(1,1,y,0,7),d=new Date(s[2],s[1]-1,s[0]);
  if(d<t){y++;s=Lunar.lunar2solar(1,1,y,0,7);d=new Date(s[2],s[1]-1,s[0])}
  return {y,n:days(t,d)};
}
const snapFirst=key=>DATA[key];
function greetWord(n){const h=n.getHours();return h<5?'Chào đêm khuya':h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối'}
function histCard(){const n=new Date(),t=TI.HIST&&TI.HIST[(n.getMonth()+1)+'-'+n.getDate()];if(!t)return '';const m=t.match(/^(-?\d{1,4}( TCN)?): (.*)$/),y=m?m[1]:'',x=m?m[3]:t;return `<div class="card mini wide" id="hist"><div class="k">Ngày này năm xưa · ${n.getDate()}/${n.getMonth()+1}</div><div class="hv">${y?`<b>${esc(y)}</b> · `:''}${esc(x)}</div></div>`}
function kodaSay(){const n=new Date(),h=n.getHours(),w=store.get('wx_last',null),ok=w&&Date.now()-w.at<108e5;
  if(ok&&w.rain)return 'Hôm nay có thể mưa, nhớ mang ô nhé ☔';
  if(ok&&w.t>=34)return `Trời nóng ${w.t}°C, nhớ uống nhiều nước nhé 💧`;
  if(ok&&w.t<=19)return `Trời se lạnh ${w.t}°C, bạn nhớ mặc ấm nhé 🧣`;
  return h<5?'Khuya rồi, bạn nên đi ngủ sớm nhé 🌙':h<11?'Chúc bạn một ngày mới thật nhẹ nhàng ☀️':h<14?'Đến giờ nghỉ trưa rồi, bạn ăn ngon nhé 🍚':h<18?'Chiều rồi, bạn đã uống nước chưa? 💧':'Tối rồi, nghỉ ngơi một chút nhé 🌿'}
function dayQuote(k){const Q=TI.QUOTES||[];if(!Q.length)return '';const n=new Date(),base=Math.floor((n-new Date(n.getFullYear(),0,0))/864e5);return Q[(base+k)%Q.length]}
function renderHome(){
  const name=store.get('name','');
  title.textContent=name?'Xin chào, '+name:'Tiện ích';
    let ti=0;const vis=TOOLS.filter(t=>!t.hidden),groups=[...new Set(vis.map(t=>t.group))],qs=TI.kodaPrompts?TI.kodaPrompts(4):[];const chipsHTML=a=>a.map(q=>`<a class="chip2" href="#koda" data-q="${esc(q)}">${esc(q)}</a>`).join('');
  view.innerHTML=`<section class="hero"><div class="greet" id="hc"></div><div id="hd"></div><div class="mut small" id="hl"></div><a class="wchip" id="wt" href="#thoitiet" hidden></a> <div class="chip" id="tet"></div></section>
  ${TI.kodaSVG?`<div class="koda-card"><div class="tb" id="tb"><div class="bub" id="bub"><span id="bt"></span></div><i class="d1"></i><i class="d2"></i></div><div class="kh"><button class="kmas" id="kmas" aria-label="KoDa – bấm để đổi câu">${TI.kodaSVG(54)}</button><a class="ktx" href="#koda"><div><div class="kt" id="ksay">Tôi có thể giúp gì cho bạn?</div><div class="mut">Bấm để hỏi KoDa bất cứ điều gì trong app</div></div><span class="chev">›</span></a></div><div class="sugs rot" id="sg">${chipsHTML(qs)}</div></div>`:''}
  <div class="cards"><a class="card mini wide" href="#thoitiet" id="mw" style="min-height:92px"><div class="k">Thời tiết · ${esc(cityLabel(curCity()))}</div><div class="v">Đang tải…</div></a>
  ${histCard()}
  <a class="card mini" href="#vang" id="cg"></a>
  <a class="card mini" href="#chungkhoan" id="cv"></a></div>
  ${groups.map(gr=>`<h2>${gr}</h2><div class="grid">${vis.filter(t=>t.group===gr).map(t=>`<a class="tile" style="--i:${Math.min(ti++,16)}" href="#${t.id}"><i>${t.icon}</i>${t.name}</a>`).join('')}</div>`).join('')}`;
  const paintCards=()=>{const g=DATA.vang,c=DATA.ck,sjc=g.sections[0].rows[0],vni=c.sections[0].rows[0],A=$('#cg',view),B=$('#cv',view);if(!A||!B)return;
    A.innerHTML=`<div class="k">${esc(sjc[0])} bán ra (triệu đ/lượng)</div><div class="v">${esc(sjc[2])}</div><div class="s">${esc(g.dataTime.split(' (')[0])}</div>`;
    B.innerHTML=`<div class="k">${esc(vni[0])}</div><div class="v">${esc(vni[1])}</div><div class="s">${esc(vni[2])} · ${esc(c.dataTime.split(' (')[0])}</div>`};
  paintCards();if(TI.live){const off=TI.live.on(k=>{if(k==='vang'||k==='ck')paintCards()});TI.cleanups.push(off)}
  view.onclick=e=>{const q=e.target.closest('[data-q]');if(q)store.set('koda_seed',q.dataset.q)};
  /* nhiệt độ hiện tại: hiện ngay bản đã lưu, rồi cập nhật khi có mạng */
  const paintTemp=x=>{const w=$('#wt',view);if(!w||!x)return;w.hidden=false;w.innerHTML=`<span>${x.e}</span><span>${x.t}°C</span><span class="l">${esc(x.l)}</span>`};
  const lastW=store.get('wx_last',null);if(lastW&&Date.now()-lastW.at<108e5)paintTemp(lastW);
  const paintSay=()=>{const e=$('#ksay',view);if(e)e.textContent=kodaSay()};paintSay();
  /* bong bóng cảm nghĩ của KoDa: đổi câu mỗi 10 giây, bấm bong bóng hoặc KoDa để đổi ngay */
  const QS=TI.QUOTES||[],bub=$('#bub',view),tb=$('#tb',view),bt=$('#bt',view),kmas=$('#kmas',view);
  const kface=id=>{if(TI.kodaFace&&kmas&&kmas.isConnected)TI.kodaFace(kmas,id||TI.kodaPick('pos'),3000)};
  if(kmas&&TI.kodaNow){setTimeout(()=>kface(TI.kodaNow()),450);let idl=0;every(()=>{if(++idl>=7){idl=0;kface(TI.kodaPick('idle'))}},1000)}
  if(bub&&QS.length){
    let qk=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/864e5)%QS.length,sec=0,anim=false;
    const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    bt.textContent=QS[qk];
    /* giữ chiều cao cố định theo câu dài nhất để giao diện không bị giật */
    const fit=()=>{if(!bub.isConnected)return;const pr=bub.style.minHeight;bub.style.minHeight='';const probe=bub.cloneNode(true);probe.removeAttribute('id');probe.style.cssText='position:absolute;visibility:hidden;left:0;top:0;width:'+bub.offsetWidth+'px;min-height:0;animation:none;transform:none';probe.firstChild.removeAttribute('id');bub.parentNode.appendChild(probe);let mx=0;QS.forEach(q=>{probe.firstChild.textContent=q;mx=Math.max(mx,probe.offsetHeight)});probe.remove();bub.style.minHeight=mx+'px'};
    requestAnimationFrame(fit);setTimeout(fit,400);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
    const next=()=>{if(anim||!bub.isConnected)return;anim=true;sec=0;kface();
      const pick=()=>{qk=(qk+1+TI.rnd(QS.length-1))%QS.length;bt.textContent=QS[qk]};
      if(reduce){pick();anim=false;return}
      tb.classList.remove('grow');tb.classList.add('shrink');kmas.classList.remove('bob');void kmas.offsetWidth;kmas.classList.add('bob');
      setTimeout(()=>{if(!tb.isConnected)return;pick();tb.classList.remove('shrink');void tb.offsetWidth;tb.classList.add('grow');setTimeout(()=>{tb.classList.remove('grow');anim=false},460)},270)};
    bub.onclick=next;kmas.onclick=next;
    every(()=>{if(++sec>=10)next()},1000);
  }
  /* thẻ gợi ý của KoDa đổi ngẫu nhiên */
  let rotStarted=false;
  every(()=>{if(!rotStarted){rotStarted=true;return}const sg=$('#sg',view);if(!sg||!TI.kodaPrompts)return;sg.classList.add('out');setTimeout(()=>{const s2=$('#sg',view);if(!s2)return;s2.innerHTML=chipsHTML(TI.kodaPrompts(4));s2.classList.remove('out')},220)},6500);
  every(()=>{const n=new Date(),L=Lunar.info(n),h=holOf(n,L);
    const gw=greetWord(n),hc=$('#hc',view);if(hc.textContent!==gw)hc.textContent=gw;
    $('#hd',view).textContent=`${WD[n.getDay()]}, ${dstr(n)}`;
    $('#hl',view).textContent=`Âm lịch ${L.d}/${L.m}${L.leap?' (nhuận)':''} · ${L.day} · năm ${L.year}${h.length?' · '+h[0]:''}`;
    const t=nextTet();$('#tet',view).textContent=t.n==0?'🎊 Hôm nay là Tết!':`🧧 Còn ${t.n} ngày đến Tết ${t.y}`},1000);
  getWeather(curCity()).then(({w,a})=>{const cu=w.current,[e,t]=WC(cu.weather_code),m=$('#mw',view);if(!m)return;const tx={t:Math.round(cu.temperature_2m),e,l:cityLabel(curCity()).split(',')[0],at:Date.now(),rain:((w.daily.precipitation_probability_max||[0])[0]||0)>=60||cu.weather_code>=51};store.set('wx_last',tx);paintTemp(tx);paintSay();
    m.innerHTML=`<div class="k">Thời tiết · ${esc(cityLabel(curCity()))}</div><div class="wx"><div><div class="v" style="font-size:30px">${Math.round(cu.temperature_2m)}° <span style="font-size:15px;font-weight:600">${t}</span></div><div class="s">${Math.round(w.daily.temperature_2m_min[0])}°–${Math.round(w.daily.temperature_2m_max[0])}° · ẩm ${cu.relative_humidity_2m}%${a&&a.current?' · AQI '+Math.round(a.current.us_aqi):''}</div></div><div class="e" style="font-size:38px">${e}</div></div>`}).catch(()=>{const m=$('#mw',view);if(m)m.querySelector('.v').textContent='Chưa có mạng'});
}

/* cài đặt */
function renderSettings(){
  title.textContent='Cài đặt';
  const th=store.get('theme','dark');
  view.innerHTML=`<h2>Giao diện</h2><div class="seg" id="th">${[['dark','Tối'],['light','Sáng'],['auto','Theo máy']].map(x=>`<button data-t="${x[0]}" class="${th===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>
  <h2>Chung</h2><label class="f"><span>Tên của bạn (hiện ở lời chào)</span><input id="nm" value="${esc(store.get('name',''))}" placeholder="Ví dụ: Lan"></label>
  <div class="card"><label class="li"><input type="checkbox" id="h24" ${store.get('h24',true)?'checked':''}><span class="t">Hiển thị giờ 24 giờ</span></label></div>
  <h2>Thêm vào màn hình chính iPhone</h2><div class="card small">Mở bằng Safari → nhấn nút Chia sẻ <b>⬆︎</b> → <b>Thêm vào Màn hình chính</b>. Mở từ biểu tượng đó, app sẽ chạy toàn màn hình (không còn thanh công cụ Safari).</div>
  <h2>Dữ liệu</h2><button class="btn ghost full" id="clr">Xóa toàn bộ dữ liệu đã lưu</button><div class="note">Mọi dữ liệu (việc cần làm, ghi chú, sổ chi tiêu…) chỉ lưu trên máy bạn.</div>`;
  $('#th',view).onclick=e=>{const b=e.target.closest('button');if(!b)return;store.set('theme',b.dataset.t);applyTheme(true);$$('#th button',view).forEach(x=>x.classList.toggle('on',x===b))};
  $('#nm',view).oninput=e=>store.set('name',e.target.value.trim());
  $('#h24',view).onchange=e=>store.set('h24',e.target.checked);
  $('#clr',view).onclick=()=>{if(confirm('Xóa toàn bộ dữ liệu đã lưu trong app?')){Object.keys(localStorage).filter(k=>k.startsWith('ti_')).forEach(k=>localStorage.removeItem(k));applyTheme();route()}};
}

/* điều hướng + nhớ màn hình đang xem */
let curId=null,first=true;
const saveScroll=()=>{if(curId)store.set('sc_'+curId,Math.round(window.scrollY))};
let st=0;addEventListener('scroll',()=>{if(st)return;st=setTimeout(()=>{st=0;saveScroll()},200)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveScroll()});
addEventListener('pagehide',saveScroll);
function route(soft){
  const y0=window.scrollY;if(!soft)saveScroll();clearTimers();while(TI.cleanups.length){try{TI.cleanups.pop()()}catch(e){}}
  const id=location.hash.slice(1)||'home',t=TOOLS.find(x=>x.id===id),ok=id==='settings'||id==='home'||t,rid=ok?id:'home';
  curId=rid;TI.cur=rid;store.set('last',rid);
  view.innerHTML='';view.classList.remove('hasc');view._live=null;view.onclick=view.oninput=view.onchange=null;
  if(rid==='settings')renderSettings();
  else if(t){title.textContent=t.hidden&&t.id==='koda'?'KoDa':t.name;t.view(view)}
  else renderHome();
  if(soft){window.scrollTo(0,y0);return}
  const sub=rid!=='home';
  view.classList.remove('in-r','in-l','first','leaving');void view.offsetWidth;view.classList.add(sub?'in-r':'in-l');if(!sub&&first)view.classList.add('first');
  back.hidden=!sub;gear.hidden=sub;
  const y=(rid==='home'||first)?store.get('sc_'+rid,0):0;first=false;
  window.scrollTo(0,y>0?y:0);
  if(y>0)requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y)});
}
/* hiệu ứng mở/đóng KoDa: thẻ KoDa từ từ phóng to phủ kín màn hình; đóng lại thì thu về đúng vị trí cũ */
let koBusy=false;
const reduceMo=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function koZoom(dir,card,go){
  koBusy=true;const ov=document.createElement('div');ov.id='zoomov';const W=innerWidth,H=innerHeight,full=()=>{ov.style.top='0px';ov.style.left='0px';ov.style.width=W+'px';ov.style.height=H+'px';ov.style.borderRadius='0px'};
  const fin=ms=>setTimeout(()=>{ov.style.opacity='0';setTimeout(()=>{ov.remove();koBusy=false},240)},ms);
  if(dir==='open'){
    const r=card.getBoundingClientRect(),inn=card.cloneNode(true);inn.removeAttribute('id');inn.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));inn.className='koda-card zin';inn.style.cssText='width:'+(r.width-2)+'px;margin:0;border:0;background:transparent';
    ov.style.cssText=`top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;border-radius:18px`;ov.appendChild(inn);document.body.appendChild(ov);void ov.offsetWidth;
    full();ov.style.background='var(--bg)';inn.style.opacity='0';
    setTimeout(()=>{go();requestAnimationFrame(()=>fin(40))},470);
  }else{
    ov.style.cssText=`top:0;left:0;width:${W}px;height:${H}px;border-radius:0;opacity:0`;document.body.appendChild(ov);void ov.offsetWidth;ov.style.opacity='1';
    setTimeout(()=>{go();requestAnimationFrame(()=>requestAnimationFrame(()=>{const c=document.querySelector('.koda-card');
      if(!c){fin(0);return}
      const r=c.getBoundingClientRect();ov.style.background='var(--card)';ov.style.top=r.top+'px';ov.style.left=r.left+'px';ov.style.width=r.width+'px';ov.style.height=r.height+'px';ov.style.borderRadius='18px';
      fin(480)}))},170);
  }
}
back.onclick=()=>{if(koBusy)return;if(curId==='koda'&&!reduceMo()){koZoom('close',null,()=>{location.hash='home'});return}back.classList.add('tap');view.classList.add('leaving');setTimeout(()=>{back.classList.remove('tap');location.hash='home'},170)};
/* hiệu ứng khi bấm vào tiện ích: nảy nhẹ rồi chuyển trang (nhanh) */
document.addEventListener('click',e=>{
  const a=e.target.closest('a.tile,a.card.mini,a.wchip,.koda-card a,#gear');
  if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||a.target==='_blank')return;
  const h=a.getAttribute('href');if(!h||h[0]!=='#'||a._go)return;
  e.preventDefault();
  if(h==='#koda'&&!reduceMo()){const card=a.closest('.koda-card');if(!koBusy&&card)koZoom('open',card,()=>{location.hash='koda'});else if(!koBusy)location.hash='koda';return}
  a._go=1;a.classList.add('tap');
  setTimeout(()=>{a.classList.remove('tap');a._go=0;location.hash=h.slice(1)},matchMedia('(prefers-reduced-motion:reduce)').matches?0:140);
});
addEventListener('hashchange',()=>route());
if(TI.live){const LM={vang:'vang',chungkhoan:'ck',xang:'xang',xoso:'xs'};TI.live.on(k=>{if(LM[curId]===k&&!koBusy)route(true)})}
/* mở lại app: về đúng màn hình lần trước */
if(!location.hash){const l=store.get('last','home');if(l&&l!=='home')history.replaceState(null,'','#'+l)}
route();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
