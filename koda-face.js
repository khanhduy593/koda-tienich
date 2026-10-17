/* Biểu cảm và cử chỉ của KoDa: 54 trạng thái (mắt + miệng + hiệu ứng nhỏ + động tác).
   Dùng:  TI.kodaDraw(size,id)  vẽ KoDa;  TI.kodaFace(svgHoặcKhung,id,ms)  đổi biểu cảm rồi tự trở về bình thường sau ms mili giây. */
(function(){
'use strict';
const A='var(--ac)',B='var(--bg)';
const st=(d,w=2.4)=>`<path d="${d}" fill="none" stroke="${A}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot=(x,y,r=3.3,f=A)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const ring=(x,y,r,w=1.8)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${A}" stroke-width="${w}"/>`;
const star=(cx,cy,R,f=A)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?R*.45:R;p.push((cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(' ')}" fill="${f}"/>`};
const heart=(cx,cy,s,f=A)=>`<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 3.4C-5 -.4 -5.2 -4.6 -2.2 -4.8C-.9 -4.9 0 -3.9 0 -3.2C0 -3.9 .9 -4.9 2.2 -4.8C5.2 -4.6 5 -.4 0 3.4Z" fill="${f}"/>`;
const sp4=(cx,cy,r)=>`<path d="M${cx} ${cy-r}Q${cx} ${cy} ${cx+r} ${cy}Q${cx} ${cy} ${cx} ${cy+r}Q${cx} ${cy} ${cx-r} ${cy}Q${cx} ${cy} ${cx} ${cy-r}Z" fill="${A}"/>`;
const tx=(t,x,y,s,w=800)=>`<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" text-anchor="middle" fill="${A}" font-family="Nunito,system-ui,sans-serif">${t}</text>`;
const L=25,R=39,Y=33;

/* ---- mắt ---- */
const E={
 open:()=>dot(L,Y)+dot(R,Y),
 sparkle:()=>dot(L,Y,3.6)+dot(R,Y,3.6)+dot(L+1.1,Y-1.3,1.05,B)+dot(R+1.1,Y-1.3,1.05,B),
 wide:()=>dot(L,Y,4.8)+dot(R,Y,4.8)+dot(L,Y,1.7,B)+dot(R,Y,1.7,B),
 shock:()=>dot(L,Y,5)+dot(R,Y,5)+dot(L,Y,1,B)+dot(R,Y,1,B),
 happy:()=>st('M20.5 35.5q4.5-7 9 0')+st('M34.5 35.5q4.5-7 9 0'),
 closed:()=>st('M20.5 32.5q4.5 4.5 9 0')+st('M34.5 32.5q4.5 4.5 9 0'),
 wink:()=>dot(L,Y)+st('M34.5 35.5q4.5-7 9 0'),
 star:()=>star(L,Y,5.4)+star(R,Y,5.4),
 heart:()=>heart(L,Y+.6,1.15)+heart(R,Y+.6,1.15),
 sleepy:()=>st('M20.5 34h9',2.8)+st('M34.5 34h9',2.8),
 angry:()=>dot(L,Y+1.2,3)+dot(R,Y+1.2,3)+st('M20 27.2l9.5 3.6',2.2)+st('M44 27.2l-9.5 3.6',2.2),
 sad:()=>dot(L,Y+1,3.2)+dot(R,Y+1,3.2)+st('M20 30.6l9.5-3.4',2.2)+st('M44 30.6l-9.5-3.4',2.2),
 cry:()=>st('M20.5 35q4.5-4.5 9 0')+st('M34.5 35q4.5-4.5 9 0'),
 dizzy:()=>ring(L,Y,4.4)+ring(R,Y,4.4)+ring(L,Y,1.5,1.5)+ring(R,Y,1.5,1.5),
 xx:()=>st('M21 29.5l8 7.6m0-7.6l-8 7.6',2.2)+st('M35 29.5l8 7.6m0-7.6l-8 7.6',2.2),
 lookL:()=>dot(L-2.6,Y)+dot(R-2.6,Y),
 lookR:()=>dot(L+2.6,Y)+dot(R+2.6,Y),
 lookU:()=>dot(L-1.6,Y-2.6)+dot(R-1.6,Y-2.6),
 lookD:()=>dot(L,Y+2.4)+dot(R,Y+2.4),
 dollar:()=>tx('$',L,Y+4.6,13)+tx('$',R,Y+4.6,13),
 glasses:()=>ring(L,Y,5.6)+ring(R,Y,5.6)+st('M30.6 33h2.8',1.8)+dot(L,Y,2)+dot(R,Y,2),
 sus:()=>dot(L,Y)+dot(R,Y)+`<rect x="19" y="27.4" width="12" height="5.2" fill="${B}"/><rect x="33" y="27.4" width="12" height="5.2" fill="${B}"/>`+st('M20.5 32.6h9',2)+st('M34.5 32.6h9',2),
 flat:()=>st('M21 33h8',2.8)+st('M35 33h8',2.8),
 tiny:()=>dot(L,Y,1.9)+dot(R,Y,1.9),
 shades:()=>`<rect x="17" y="28.6" width="30" height="8.6" rx="3.4" fill="${A}"/>`+dot(23,32,1.2,B)+dot(37,32,1.2,B),
 det:()=>dot(L,Y+.8)+dot(R,Y+.8)+st('M20.5 28.4h9',2.2)+st('M34.5 28.4h9',2.2),
};
/* ---- miệng ---- */
const M={
 smile:()=>st('M27.5 39.5q4.5 3.8 9 0'),
 grin:()=>`<path d="M25.5 38.6q6.5 9 13 0z" fill="${A}"/>`,
 o:()=>`<circle cx="32" cy="41.8" r="2.5" fill="none" stroke="${A}" stroke-width="2.2"/>`,
 oBig:()=>`<ellipse cx="32" cy="42" rx="3.2" ry="3.9" fill="${A}"/>`,
 tinyo:()=>dot(32,41.6,1.5),
 yawn:()=>`<ellipse cx="32" cy="42" rx="3.4" ry="4.4" fill="${A}"/>`,
 flat:()=>st('M28 41.5h8',2.4),
 sad:()=>st('M27.5 43q4.5-4 9 0'),
 cryM:()=>`<path d="M26.5 44.4q5.5-6 11 0z" fill="${A}"/>`,
 wavy:()=>st('M26.4 41.6q1.6-2.6 3.2 0t3.2 0t3.2 0',2.2),
 tongue:()=>st('M27.5 39.2q4.5 3.8 9 0')+`<path d="M30.2 41.6v2.4a1.8 1.8 0 0 0 3.6 0v-2.4z" fill="${A}" opacity=".85"/>`,
 smirk:()=>st('M27.5 41.6q5 .6 9-2.6'),
 cat:()=>st('M26.4 39.4q2.9 3.4 5.6 0q2.9 3.4 5.6 0',2.2),
 teeth:()=>`<rect x="26.6" y="39" width="10.8" height="5.4" rx="1.8" fill="none" stroke="${A}" stroke-width="2"/>`+st('M32 39v5.4',1.4)+st('M26.6 41.7h10.8',1.4),
 kiss:()=>dot(33,42,1.9)+st('M29.5 40.2q2-1.6 3.4-.4',1.6),
 chew:()=>`<path class="k-chew" d="M27.5 39.5q4.5 3.8 9 0" fill="none" stroke="${A}" stroke-width="2.4" stroke-linecap="round"/>`,
 pout:()=>st('M28.4 42.6q3.6-2.6 7.2 0',2.2),
};
/* ---- hiệu ứng nhỏ quanh mặt ---- */
const X={
 blush:()=>`<ellipse cx="19.6" cy="40.8" rx="3.4" ry="2" fill="${A}" opacity=".38"/><ellipse cx="44.4" cy="40.8" rx="3.4" ry="2" fill="${A}" opacity=".38"/>`,
 tear:()=>`<path class="k-tear" d="M22.6 37.6q-2 2.8 0 4q2-1.2 0-4z" fill="${A}" opacity=".85"/><path class="k-tear t2" d="M41.4 37.6q-2 2.8 0 4q2-1.2 0-4z" fill="${A}" opacity=".85"/>`,
 sweat:()=>`<path class="k-sweat" d="M50 15.6q-3.2 4 0 5.8q3.2-1.8 0-5.8z" fill="${A}" opacity=".85"/>`,
 heart:()=>`<g class="k-fl">${heart(51.5,10.5,.95)}</g><g class="k-fl d2">${heart(12.5,12,.65)}</g>`,
 spark:()=>`<g class="k-tw">${sp4(52,9.5,4.6)}</g><g class="k-tw d2">${sp4(12,11,3.2)}</g>`,
 zzz:()=>`<g class="k-fl">${tx('z',47,13,8)}${tx('Z',53,8,6)}</g>`,
 q:()=>`<g class="k-fl">${tx('?',51,13.5,13)}</g>`,
 ex:()=>`<g class="k-tw">${tx('!',51,13.5,14)}</g>`,
 note:()=>`<g class="k-fl">${tx('♪',51,12,12)}${tx('♫',12,12,8)}</g>`,
 vein:()=>st('M46 10l4 4m0-4l-4 4',2)+st('M52 8l1.6 1.6m0-1.6L52 9.6',1.4),
 bulb:()=>`<g class="k-tw"><circle cx="51" cy="9" r="4" fill="none" stroke="${A}" stroke-width="2"/>${st('M49.4 15h3.2',2)}</g>`,
 dots:()=>`<g class="k-dots">${dot(46,11.5,1.4)}${dot(51,11.5,1.4)}${dot(56,11.5,1.4)}</g>`,
 coin:()=>`<g class="k-tw"><circle cx="51" cy="10" r="4.6" fill="none" stroke="${A}" stroke-width="1.8"/>${tx('$',51,12.4,6.4)}</g>`,
 snow:()=>`<g class="k-fl">${st('M51 5v10m-4.3-5h8.6m-7.3-3.6l6 7.2m0-7.2l-6 7.2',1.4)}</g>`,
};
/* ---- 54 trạng thái: [id, tên, mắt, miệng, hiệu ứng, động tác, tay] ---- */
const S=[
 ['vui','Vui vẻ','happy','smile',[],'bounce',''],
 ['cuoitoe','Cười toe','sparkle','grin',[],'bounce',''],
 ['cuoiranh','Cười ranh mãnh','wink','smirk',[],'tilt',''],
 ['nguong','Ngượng ngùng','tiny','wavy',['blush'],'wiggle',''],
 ['yeu','Mê tít','heart','smile',['heart','blush'],'pulse',''],
 ['buon','Buồn buồn','sad','sad',['tear'],'float',''],
 ['khoc','Khóc òa','cry','cryM',['tear'],'shake',''],
 ['gian','Giận dữ','angry','teeth',['vein'],'shake',''],
 ['ngacnhien','Ngạc nhiên','wide','o',['ex'],'jump',''],
 ['soc','Sốc nặng','shock','oBig',['sweat'],'shiver',''],
 ['nghi','Đang nghĩ','lookU','flat',['dots'],'tilt',''],
 ['timkiem','Đang tìm','open','flat',['q'],'none','','scan'],
 ['hieura','Hiểu ra rồi','sparkle','grin',['bulb'],'jump',''],
 ['buonngu','Buồn ngủ','sleepy','yawn',['zzz'],'float',''],
 ['ngusay','Ngủ say','closed','tinyo',['zzz'],'float',''],
 ['metmoi','Mệt rũ','sleepy','wavy',['sweat'],'droop',''],
 ['chongmat','Chóng mặt','dizzy','wavy',[],'dizzy',''],
 ['xiu','Ngất xỉu','xx','tongue',[],'droop',''],
 ['ngau','Ngầu lòi','shades','smirk',[],'tilt',''],
 ['thongminh','Thông thái','glasses','smile',[],'nod',''],
 ['nghingo','Nghi ngờ','sus','flat',[],'tilt',''],
 ['lanhlung','Lạnh lùng','flat','flat',[],'none',''],
 ['leluoi','Lè lưỡi','wink','tongue',[],'wiggle',''],
 ['hon','Gửi nụ hôn','closed','kiss',['heart'],'pulse',''],
 ['haohung','Hào hứng','star','grin',['spark'],'jump',''],
 ['tuhao','Tự hào','happy','smile',['spark'],'pulse','up'],
 ['xinloi','Xin lỗi','sad','wavy',['sweat'],'bow',''],
 ['camon','Cảm ơn','closed','smile',['blush'],'bow',''],
 ['chao','Chào bạn','happy','grin',[],'bounce','wave'],
 ['tambiet','Tạm biệt','happy','smile',[],'none','wave'],
 ['dongy','Đồng ý','happy','smile',[],'nod',''],
 ['khongdongy','Không đồng ý','open','flat',[],'shake',''],
 ['boirol','Bối rối','lookL','wavy',['q'],'tilt',''],
 ['lolang','Lo lắng','wide','wavy',['sweat'],'shiver',''],
 ['soihai','Sợ hãi','shock','oBig',['sweat'],'shiver',''],
 ['tomo','Tò mò','wide','o',['q'],'tilt',''],
 ['taptrung','Tập trung','lookD','flat',[],'pulse',''],
 ['metien','Mê tiền','dollar','grin',['coin'],'bounce',''],
 ['nghenhac','Nghe nhạc','closed','smile',['note'],'swing',''],
 ['nhay','Nhảy múa','happy','grin',['note'],'hop','flap'],
 ['an','Ăn ngon','closed','chew',['blush'],'nod',''],
 ['hailong','Hài lòng','closed','smile',['blush'],'float',''],
 ['lanh','Run vì lạnh','tiny','wavy',['snow'],'shiver',''],
 ['nong','Nóng quá','sleepy','tongue',['sweat'],'wiggle',''],
 ['om','Hơi ốm','sleepy','sad',['sweat','dots'],'droop',''],
 ['tapthe','Tập thể dục','det','teeth',['sweat'],'bounce','flap'],
 ['thang','Chiến thắng','star','grin',['spark'],'flip','up'],
 ['thua','Thua cuộc','sad','sad',[],'droop',''],
 ['tinhnghich','Tinh nghịch','wink','cat',[],'wiggle',''],
 ['hondoi','Hờn dỗi','sus','pout',['blush'],'tilt',''],
 ['xoay','Xoay vòng','open','o',[],'spin',''],
 ['chemat','Che mắt','open','o',[],'none','cover'],
 ['choidoi','Chờ đợi','lookR','smile',['dots'],'swing',''],
 ['mongmo','Mơ mộng','lookU','smile',['heart'],'float','']
];
const ST={};S.forEach(s=>ST[s[0]]={id:s[0],n:s[1],e:s[2],m:s[3],x:s[4],g:s[5],a:s[6],scan:s[7]==='scan'});
ST.base={id:'base',n:'Bình thường',e:'open',m:'smile',x:[],g:'none',a:'',blink:1};
const faceHTML=o=>{const blink=(o.e==='open'||o.e==='sparkle'||o.e==='wide'||o.e==='lookD'||o.e==='lookL'||o.e==='lookR'||o.e==='lookU')&&!o.scan||o.blink;
  return `<g class="koda-eye${blink?'':' nb'}${o.scan?' scan':''}">${E[o.e]()}</g>${M[o.m]()}${o.x.map(k=>X[k]()).join('')}`};
const REDUCE=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;

/* vẽ KoDa */
TI.kodaDraw=(s=44,id='base')=>{const o=ST[id]||ST.base;
 return `<svg class="koda-av${o.g!=='none'?' g-'+o.g:''}${o.a?' a-'+o.a:''}" width="${s}" height="${s}" viewBox="0 0 64 64" role="img" aria-label="KoDa – linh vật trợ lý"><g class="k-ant"><line x1="32" y1="14" x2="32" y2="8" stroke="${A}" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="6.5" r="3.4" fill="${A}"/></g><rect class="k-ear l" x="3.5" y="30" width="5" height="12" rx="2.5" fill="${A}"/><rect class="k-ear r" x="55.5" y="30" width="5" height="12" rx="2.5" fill="${A}"/><rect x="8" y="14" width="48" height="42" rx="17" fill="var(--card)" stroke="${A}" stroke-width="2.6"/><rect x="14.5" y="23" width="35" height="23" rx="11.5" fill="${B}"/><g class="k-face">${faceHTML(o)}</g></svg>`};

/* đổi biểu cảm, tự về bình thường sau ms (0 = giữ nguyên) */
function apply(svg,id){
  const o=ST[id]||ST.base,f=svg.querySelector('.k-face');if(!f)return;
  f.innerHTML=faceHTML(o);svg._face=o.id;
  const keep=(svg.getAttribute('class')||'').split(/\s+/).filter(c=>c&&!/^(g-|a-)/.test(c));
  svg.setAttribute('class',keep.join(' '));
  if(REDUCE())return;
  void svg.getBoundingClientRect();
  const add=[];if(o.g!=='none')add.push('g-'+o.g);if(o.a)add.push('a-'+o.a);
  svg.setAttribute('class',keep.concat(add).join(' '));
}
TI.kodaFace=(root,id,ms)=>{
  if(!root)return;const svg=root.tagName&&root.tagName.toLowerCase()==='svg'?root:root.querySelector&&root.querySelector('svg.koda-av');if(!svg)return;
  clearTimeout(svg._ft);apply(svg,id);
  if(id!=='base'&&ms!==0){svg._ft=setTimeout(()=>{if(svg.isConnected)apply(svg,'base')},ms||2800)}
};
/* nhóm biểu cảm theo hoàn cảnh */
const G={
 pos:['vui','cuoitoe','cuoiranh','haohung','tuhao','tinhnghich','nghenhac','nhay','leluoi','hailong','hieura','thongminh','ngau','yeu'],
 idle:['vui','nghi','timkiem','tomo','nghenhac','cuoiranh','taptrung','choidoi','mongmo','nguong','tinhnghich','leluoi','nghingo','xoay','hailong'],
 oops:['boirol','xinloi','nguong'],
 money:['metien'],
};
const last={};
TI.kodaPick=(g,avoid)=>{const a=G[g]||Object.keys(ST).filter(k=>k!=='base');let id,n=0;do{id=a[TI.rnd(a.length)];n++}while((id===last[g]||id===avoid)&&n<6);last[g]=id;return id};
TI.kodaAny=()=>TI.kodaPick('all');
TI.kodaFaces=S.map(s=>({id:s[0],n:s[1]}));
/* chọn biểu cảm cho câu trả lời trong khung chat */
const GOFACE={vang:'metien',tygia:'metien',chungkhoan:'thongminh',xang:'lolang',xoso:'haohung',xucxac:'nhay',phantram:'thongminh',laisuat:'tuhao',vay:'lolang',luong:'metien',chitieu:'taptrung',no:'nghi',nuoc:'hailong',bmi:'tapthe',anGi:'an',pomodoro:'taptrung',thoitiet:'chao',lich:'vui',ngay:'nghi',hoidap:'tomo',tro:'nhay',qr:'thongminh',maytinh:'thongminh',doidonvi:'thongminh',docso:'thongminh',gio:'nghi'};
TI.kodaMood=(text,res)=>{
  const n=String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').toLowerCase();
  if(res&&res.out)return TI.kodaPick('oops');
  if(/\b(xin chao|chao|hello|hi|alo)\b/.test(n))return 'chao';
  if(/(cam on|thanks|thank)/.test(n))return 'camon';
  if(/(tam biet|bye|hen gap lai)/.test(n))return 'tambiet';
  if(/(ngu ngon|di ngu|buon ngu)/.test(n))return 'buonngu';
  if(/(yeu|thuong|nho ban)/.test(n))return 'yeu';
  if(/(buon|chan qua|met qua)/.test(n))return 'buon';
  if(/(gian|buc|tuc)/.test(n))return 'gian';
  if(/(gioi qua|tuyet|hay qua|gioi lam)/.test(n))return 'tuhao';
  if(/(xin loi|sorry)/.test(n))return 'xinloi';
  if(/(nong|nang)/.test(n)&&/(troi|thoi tiet|qua)/.test(n))return 'nong';
  if(/(lanh|ret)/.test(n)&&/(troi|thoi tiet|qua)/.test(n))return 'lanh';
  if(/(doi|an gi|an com)/.test(n))return 'an';
  const go=res&&res.go;if(go&&GOFACE[go])return GOFACE[go];
  return TI.kodaPick('pos');
};
/* hiện biểu cảm theo giờ và thời tiết lúc vào trang chủ */
TI.kodaNow=()=>{const h=new Date().getHours();let w=null;try{w=TI.store.get('wx_last',null)}catch(e){}
  if(h>=23||h<5)return 'buonngu';
  if(w&&Date.now()-w.at<108e5){if(w.t>=34)return 'nong';if(w.t<=17)return 'lanh';if(w.rain)return 'chemat'}
  if(h>=5&&h<10)return 'chao';return TI.kodaPick('pos')};
})();
