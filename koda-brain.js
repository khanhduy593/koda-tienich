/* KoDa – bộ não trả lời tin nhắn gõ tay (chạy hoàn toàn trên máy, không cần mạng, không cần AI)
   Hiểu câu hỏi bằng từ khóa + số liệu có sẵn trong app. Ngoài phạm vi app thì KoDa nói rõ là không trả lời. */
(function(){
'use strict';
const {TOOLS,store}=TI;
const pick=a=>a[TI.rnd(a.length)];
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9%/.,\-+*()\s×÷^:]/g,' ').replace(/\s+/g,' ').trim();
const vnd=n=>Math.round(n).toLocaleString('vi-VN')+' đ';
const f1=n=>(Math.round(n*10)/10).toLocaleString('vi-VN');
const pn=s=>{s=String(s).replace(/\s/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return parseFloat(s.replace(/\./g,'').replace(',','.'));if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))return parseFloat(s.replace(/,/g,''));return parseFloat(s.replace(',','.'))};
const MULT={k:1e3,nghin:1e3,ngan:1e3,tr:1e6,trieu:1e6,ty:1e9,ti:1e9};
const NUM='(\\d+(?:[.,]\\d+)*)';
/* "100 triệu", "1,5 tỷ", "50k", "1.250.000" → số đồng */
function money(t){const m=t.match(new RegExp(NUM+'\\s*(k|nghin|ngan|trieu|tr|ty|ti)?\\b'));if(!m)return null;const v=pn(m[1]);return isNaN(v)?null:v*(MULT[m[2]]||1)}
function allNums(t){const out=[];const re=new RegExp(NUM+'\\s*(k|nghin|ngan|trieu|tr|ty|ti)?(?![a-z0-9])','g');let m;while((m=re.exec(t))){const v=pn(m[1]);if(!isNaN(v))out.push({v:v*(MULT[m[2]]||1),raw:v,u:m[2]||'',i:m.index,end:re.lastIndex})}return out}

/* ===== Mô tả từng tiện ích + từ khóa nhận diện ===== */
const T={
gio:['gio quoc te|mui gio|gio o nuoc ngoai|may gio|dong ho the gioi','Xem giờ hiện tại ở Việt Nam và nhiều thành phố trên thế giới, tiện để hẹn giờ với người ở nước ngoài.'],
lich:['lich am|am lich|duong lich|lich|su kien|tet|ram|mung 1|hoang dao|ngay tot|ngay le','Xem lịch dương, âm lịch, ngày lễ, rằm, mùng 1 và giờ hoàng đạo. Chạm vào một ngày để thêm sự kiện của riêng bạn.'],
thoitiet:['thoi tiet|troi mua|troi nong|troi lanh|nhiet do|mang o|du bao|nang khong|aqi|khong khi|o nhiem','Xem thời tiết hiện tại, dự báo 7 ngày và chất lượng không khí theo nơi bạn ở. Cần có mạng để cập nhật.'],
ngay:['tinh ngay|khoang cach ngay|giua hai ngay|cong ngay|tru ngay|dem ngay','Tính số ngày giữa hai ngày, hoặc cộng/trừ một số ngày vào một ngày bất kỳ.'],
phantram:['phan tram|tang giam|giam gia|khuyen mai|chiet khau|sale|tang gia|giam bao nhieu|tang bao nhieu|gia goc','Tính giá sau khi tăng hoặc giảm %, tìm % đã tăng giảm giữa hai mức giá, tìm giá gốc, giảm giá nhiều lần liên tiếp.'],
laisuat:['lai suat|gui tiet kiem|tiet kiem|lai gui|so tiet kiem','Tính tiền lãi khi gửi tiết kiệm: nhập số tiền gửi, lãi suất theo năm và kỳ hạn.'],
vang:['vang|sjc|24k|18k|nhan tron|vang mieng|pnj|chi vang|luong vang','Xem giá vàng SJC, vàng 24K, 18K (PNJ). Giá được cập nhật qua mạng khi có mạng, có ghi rõ ngày giờ và nguồn.'],
chungkhoan:['chung khoan|co phieu|vn index|vnindex|hnx|upcom|cophieu','Xem điểm VN-Index, HNX-Index, UPCoM-Index ở phiên gần nhất (số chốt phiên).'],
vay:['vay|khoan vay|tra gop|tra no hang thang|lai vay|vay von|mua nha','Tính số tiền phải trả mỗi tháng khi vay: nhập số tiền vay, lãi suất và thời hạn.'],
luong:['luong|gross|net|thue thu nhap|bao hiem xa hoi','Đổi lương Gross sang Net và ngược lại, có tính bảo hiểm và thuế thu nhập cá nhân.'],
chia:['chia tien|chia deu|chia hoa don|tien an nhom|tra tien nhom|tien chung','Chia tiền ăn nhóm: chia đều, hoặc chia theo phần mỗi người đã dùng.'],
chitieu:['chi tieu|so chi tieu|thu chi|ghi chi tieu','Sổ chi tiêu: ghi các khoản thu chi hằng ngày để biết mình đã tiêu bao nhiêu.'],
no:['so no|cho vay|di vay|ghi no|no nan|con no','Sổ nợ: ghi ai nợ bạn, bạn nợ ai, và đánh dấu đã trả.'],
xang:['xang|dau diesel|gia dau|ron95|ron92|e5|e10|do xang|nhien lieu','Xem giá xăng dầu bán lẻ tối đa và tính chi phí cho một chuyến đi.'],
viec:['viec can lam|to do|todo|danh sach viec|nhac viec|cong viec','Việc cần làm: ghi việc, chạm để đánh dấu xong, xóa việc đã xong.'],
ghichu:['ghi chu|note|ghi nho','Ghi chú nhanh: lưu lại ý tưởng, địa chỉ, danh sách mua sắm… ngay trên máy bạn.'],
pomodoro:['pomodoro|tap trung|hoc bai|ky thuat ca chua','Pomodoro: làm việc tập trung 25 phút rồi nghỉ 5 phút, lặp lại.'],
nuoc:['uong nuoc|nhac uong nuoc|ly nuoc|uong bao nhieu','Theo dõi lượng nước uống mỗi ngày: chạm để thêm từng ly và xem đã đủ mục tiêu chưa.'],
bmi:['bmi|can nang|chieu cao|beo|gay|thua can|calo|calories|giam can|tang can','Tính BMI, cân nặng lý tưởng và lượng calo mỗi ngày từ chiều cao, cân nặng, tuổi.'],
anGi:['an gi|mon an|bua an|an trua|an toi|an sang|goi y mon','Gợi ý món ăn ngẫu nhiên khi bạn phân vân hôm nay ăn gì.'],
doidonvi:['doi don vi|quy doi don vi|km|met|kg|pound|mile|inch|do c|do f','Đổi đơn vị độ dài, khối lượng, nhiệt độ, diện tích…'],
docso:['doc so|so thanh chu|viet so|bang chu','Đọc số tiền thành chữ, ví dụ 1.250.000 thành “một triệu hai trăm năm mươi nghìn”.'],
qr:['tao ma qr|ma qr|qr code|quet ma|qr','Tạo mã QR từ link, văn bản hoặc số điện thoại rồi lưu hình.'],
maytinh:['may tinh|cong tru nhan chia|tinh toan','Máy tính cơ bản: cộng, trừ, nhân, chia, phần trăm.'],
bocthang:['boc tham|chia nhom|chia doi|ngau nhien|chon ngau nhien|boc ten','Bốc thăm ngẫu nhiên một tên, hoặc chia danh sách thành các nhóm.'],
bamgio:['bam gio|hen gio|dem nguoc|stopwatch|timer','Bấm giờ có ghi vòng và hẹn giờ đếm ngược.'],
tygia:['ty gia|doi tien|usd|do la|yen|won|nhan dan te|ngoai te|jpy|krw|cny|vietcombank','Quy đổi USD, JPY, KRW, CNY sang tiền Việt và ngược lại theo tỷ giá Vietcombank.'],
demso:['dem so|bo dem|dem luot|bam dem','Đếm số: mỗi lần chạm màn hình là cộng thêm 1.'],
vietqr:['vietqr|qr nhan tien|ma qr nhan tien|chuyen khoan|nhan tien|so tai khoan|ngan hang','Tạo mã VietQR nhận tiền từ ngân hàng và số tài khoản, có thể kèm số tiền và nội dung.'],
xucxac:['xuc xac|tung xuc xac|dong xu|tung dong xu|sap ngua','Tung xúc xắc (1–6 viên) và tung đồng xu cho vui hoặc để quyết định.'],
vongquay:['vong quay|quay so|quay thuong|may man','Vòng quay may mắn: nhập các lựa chọn rồi quay để may mắn quyết định.'],
hoidap:['hoi dap|cau do|quiz|kien thuc','Hỏi đáp vui: mỗi lượt 10 câu về kiến thức đời sống, có điểm cao nhất.'],
trochoi:['tro choi|game|2048|lat hinh|choi game|giai tri','Trò chơi nhẹ nhàng: Lật hình tìm cặp giống nhau và 2048.'],
xoso:['xo so|kqxs|mien nam|dai xo so|ve so|giai dac biet','Xem kết quả xổ số miền Nam (tự cập nhật qua mạng từ nhiều trang, có đối chiếu) và lịch các đài trong tuần.'],
settings:['cai dat|giao dien|che do sang|che do toi|dark mode|xoa du lieu|man hinh chinh|gio 24|ten cua toi','Cài đặt: đổi giao diện sáng/tối, đặt tên, chọn giờ 24 giờ, giọng đọc của KoDa, xóa dữ liệu.']
};
const alias={};Object.keys(T).forEach(k=>alias[k]=T[k][0].split('|'));
const hasPhrase=(n,p)=>(' '+n+' ').includes(' '+p+' ');

/* ===== Tách từ + trọng số IDF ===== */
const STOP=new Set('la bao nhieu the nao gi cho minh toi cua va co khong hom nay duoc o dau ban oi nhe vay thi cac nhung mot nhu may hay can lam sao muon biet xem hoi tui em anh ra de khi nua di voi trong roi ma tu den a ha ah ak dum giup chi'.split(' ').filter(w=>w!=='chi'));
const tok=s=>norm(s).replace(/[.,\-/%+*()×÷^:]/g,' ').split(' ').filter(w=>w&&!STOP.has(w)&&(w.length>1||/\d/.test(w)));
let DOCS=null,IDF=null;
function build(){
  const faq=(TI.kodaFAQ||[]);DOCS=[];
  faq.forEach(x=>{const al=x.go&&alias[x.go]?alias[x.go].join(' '):'';DOCS.push({kind:'faq',x,go:x.go||null,set:new Set([...tok(x.q),...tok(x.k||''),...tok(al)])})});
  Object.keys(T).forEach(id=>{const t=TOOLS.find(y=>y.id===id);DOCS.push({kind:'tool',id,go:id,set:new Set([...tok(T[id][0].replace(/\|/g,' ')),...tok(t?t.name:'')])})});
  const df={};DOCS.forEach(d=>d.set.forEach(w=>df[w]=(df[w]||0)+1));
  IDF=w=>Math.log((DOCS.length+1)/((df[w]||0)+0.5))+0.2;
}
function bestFAQ(txt,onlyGo){
  if(!DOCS)build();const ut=[...new Set(tok(txt))];if(!ut.length)return null;
  const tot=ut.reduce((a,w)=>a+IDF(w),0);let best=null;
  DOCS.forEach(d=>{if(d.kind!=='faq'||(onlyGo&&d.go!==onlyGo))return;const sh=ut.filter(w=>d.set.has(w));if(!sh.length)return;
    const sc=sh.reduce((a,w)=>a+IDF(w),0),cov=sc/tot,own=sh.length/Math.max(3,d.set.size),s=cov+own*0.35;
    if(!best||s>best.s)best={d,s,cov,sc}});
  return best;
}
function toolHit(n){let best=null;Object.keys(alias).forEach(id=>{alias[id].forEach(p=>{if(hasPhrase(n,p)){const w=p.length+(p.includes(' ')?4:0);if(!best||w>best.w)best={id,w}}})});return best&&best.id}

/* ===== Đọc số thành chữ ===== */
const D=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
function r3(n,full){const h=(n/100)|0,t=((n%100)/10)|0,u=n%10,s=[];
  if(h||full)s.push(D[h],'trăm');
  if(t>1){s.push(D[t],'mươi');if(u===1)s.push('mốt');else if(u===5)s.push('lăm');else if(u)s.push(D[u])}
  else if(t===1){s.push('mười');if(u===5)s.push('lăm');else if(u)s.push(D[u])}
  else if(u){if(h||full)s.push('lẻ');s.push(D[u])}
  return s.join(' ')}
function readVN(n){if(n===0)return 'không';if(n>=1e12)return null;const U=['','nghìn','triệu','tỷ'],g=[];let x=n;while(x>0){g.push(x%1000);x=Math.floor(x/1000)}
  const out=[];for(let i=g.length-1;i>=0;i--){if(!g[i])continue;out.push(r3(g[i],i<g.length-1)+(U[i]?' '+U[i]:''))}
  const s=out.join(' ');return s.charAt(0).toUpperCase()+s.slice(1)}

/* ===== Tỷ giá, thời gian, đơn vị ===== */
const CUR=[['USD','USD','usd|do la my|do la|dola|dollar|do my|my kim|do'],['JPY','JPY','jpy|yen|yên|nhat'],['KRW','KRW','krw|won|han quoc|han'],['CNY','CNY','cny|nhan dan te|yuan|rmb|te']];
const curOf=w=>{const c=CUR.find(c=>c[2].split('|').includes(w));return c&&c[0]};
const CURN={USD:'đô la Mỹ',JPY:'yên Nhật',KRW:'won Hàn Quốc',CNY:'nhân dân tệ'};
function hCurrency(n){
  const re=new RegExp(NUM+'\\s*(k|nghin|ngan|trieu|tr|ty|ti)?\\s*(usd|do la my|do la|dola|dollar|do my|my kim|do(?!\\s*[cf]\\b)|jpy|yen|nhat|krw|won|cny|nhan dan te|yuan|rmb|vnd|dong|d)\\b');
  const m=n.match(re);if(!m)return null;const F=DATA.fx,v=pn(m[1])*(MULT[m[2]]||1),cw=m[3];
  if(['vnd','dong','d'].includes(cw)){
    const other=['usd','do la','dollar','yen','jpy','won','krw','cny','nhan dan te','yuan','rmb','nhat','han quoc','my'].find(w=>hasPhrase(n.replace(m[0],' '),w));
    const c=other?(curOf(other)||(other==='my'?'USD':other==='han quoc'?'KRW':'USD')):'USD';if(!other&&!/(do|doi|quy|bang)/.test(n))return null;
    const r=F.rates[c].sell;return {t:`**${vnd(v)}** đổi được khoảng **${f1(v/r)} ${CURN[c]}** (tỷ giá bán ra ${r.toLocaleString('vi-VN')} đ). Theo ${F.source}, cập nhật ${TI.capText?TI.capText(F.asOf):''}. Tỷ giá thực tế tại nơi đổi có thể khác.`,go:'tygia'}}
  const c=curOf(cw);if(!c)return null;const r=F.rates[c].buy,tv=v*r;
  return {t:`**${v.toLocaleString('vi-VN')} ${CURN[c]}** ≈ **${vnd(tv)}** theo tỷ giá ngân hàng mua vào ${r.toLocaleString('vi-VN')} đ (${F.source}). Tỷ giá bán ra là ${F.rates[c].sell.toLocaleString('vi-VN')} đ. Mở “Quy đổi tiền tệ” để xem tỷ giá mới nhất khi có mạng.`,go:'tygia'}
}
const ZONES=[['tokyo|nhat ban|nhat','Asia/Tokyo','Tokyo (Nhật Bản)'],['seoul|han quoc|han','Asia/Seoul','Seoul (Hàn Quốc)'],['bac kinh|trung quoc|thuong hai|beijing','Asia/Shanghai','Trung Quốc'],['bangkok|thai lan','Asia/Bangkok','Bangkok (Thái Lan)'],['singapore','Asia/Singapore','Singapore'],['london|anh quoc|nuoc anh','Europe/London','London (Anh)'],['paris|phap','Europe/Paris','Paris (Pháp)'],['berlin|duc','Europe/Berlin','Berlin (Đức)'],['moscow|nga','Europe/Moscow','Moscow (Nga)'],['dubai','Asia/Dubai','Dubai'],['new york|nuoc my|hoa ky','America/New_York','New York (Mỹ)'],['los angeles|california|san francisco','America/Los_Angeles','Los Angeles (Mỹ)'],['sydney|uc|australia','Australia/Sydney','Sydney (Úc)'],['ha noi|sai gon|ho chi minh|viet nam','Asia/Ho_Chi_Minh','Việt Nam']];
function hWorldTime(n){
  if(!/(\bgio\b|may gio)/.test(n))return null;
  const z=ZONES.find(z=>z[0].split('|').some(w=>hasPhrase(n,w)));if(!z)return null;
  const s=new Intl.DateTimeFormat('vi-VN',{timeZone:z[1],weekday:'long',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}).format(new Date());
  return {t:`Bây giờ ở **${z[2]}** là **${s}**.`,go:'gio'}
}
const LEN={km:1000,m:1,met:1,cm:.01,mm:.001,dam:1609.344,mile:1609.344,inch:.0254,in:.0254,ft:.3048,feet:.3048};
const MASS={kg:1,g:.001,gram:.001,lb:.45359237,pound:.45359237,oz:.0283495,yen:3.75,tan:1000};
function hUnits(n){
  const m=n.match(new RegExp(NUM+'\\s*(km|met|m|cm|mm|dam|mile|inch|in|ft|feet|kg|gram|g|lb|pound|oz|do c|do f|c|f)\\s*(?:sang|ra|thanh|bang bao nhieu|bang may|la bao nhieu|=|->|doi ra|doi sang|to)\\s*(?:bao nhieu\\s*)?(km|met|m|cm|mm|dam|mile|inch|in|ft|feet|kg|gram|g|lb|pound|oz|do c|do f|c|f)?\\b'));
  if(!m)return null;let v=pn(m[1]),a=m[2],b=m[3];
  const T1=a.replace('do ','');
  if((a==='do c'||a==='do f'||(a==='c'||a==='f')&&(b==='do f'||b==='do c'||b==='c'||b==='f'))){
    const fromC=T1==='c';const r=fromC?v*9/5+32:(v-32)*5/9;return {t:`**${f1(v)}°${fromC?'C':'F'}** = **${f1(r)}°${fromC?'F':'C'}**.`,go:'doidonvi'}}
  const L=LEN[a]!=null&&(b==null||LEN[b]!=null),M=MASS[a]!=null&&(b==null||MASS[b]!=null);
  if(L){const t=b||(a==='km'||a==='mile'?'m':'km');if(LEN[t]==null)return null;const r=v*LEN[a]/LEN[t];return {t:`**${f1(v)} ${a}** = **${r.toLocaleString('vi-VN',{maximumFractionDigits:3})} ${t}**.`,go:'doidonvi'}}
  if(M){const t=b||(a==='kg'?'lb':'kg');if(MASS[t]==null)return null;const r=v*MASS[a]/MASS[t];return {t:`**${f1(v)} ${a}** = **${r.toLocaleString('vi-VN',{maximumFractionDigits:3})} ${t}**.`,go:'doidonvi'}}
  return null;
}

/* ===== Số liệu trong app ===== */
function hFuel(n){
  if(!/(xang|dau|do xang|e5|e10|ron)/.test(n))return null;const X=DATA.xang.fuels,f92=X[0],f95=X[1];
  const lm=n.match(new RegExp(NUM+'\\s*(lit|l)\\b'));
  if(lm){const l=pn(lm[1]);if(!(l>0&&l<2000))return null;return {t:`**${f1(l)} lít** xăng khoảng:\n• ${f92.n}: **${vnd(l*f92.p)}**\n• ${f95.n}: **${vnd(l*f95.p)}**\n\nGiá bán lẻ tối đa ${String(DATA.xang.dataTime).split(' (')[0]}.`,go:'xang'}}
  const mm=allNums(n).find(x=>x.u||x.raw>=1000);if(mm&&/(duoc|may lit|bao nhieu lit)/.test(n)){return {t:`**${vnd(mm.v)}** đổ được khoảng **${f1(mm.v/f92.p)} lít** ${f92.n} (${f92.p.toLocaleString('vi-VN')} đ/lít) hoặc **${f1(mm.v/f95.p)} lít** ${f95.n} (${f95.p.toLocaleString('vi-VN')} đ/lít).`,go:'xang'}}
  return null;
}
function hGold(n){
  if(!/(vang|sjc)/.test(n))return null;const m=n.match(new RegExp(NUM+'\\s*(chi|luong|cay)\\b'));if(!m)return null;
  const q=pn(m[1]),luong=m[2]==='chi'?q/10:q,r=DATA.vang.sections[0].rows[0],mua=pn(r[1])*1e6*luong,ban=pn(r[2])*1e6*luong;
  return {t:`**${f1(q)} ${m[2]==='chi'?'chỉ':'lượng'}** vàng SJC (1 lượng = 10 chỉ) khoảng:\n• Bán ra (bạn mua): **${vnd(ban)}**\n• Mua vào (bạn bán): **${vnd(mua)}**\n\nGiá niêm yết ${String(DATA.vang.dataTime).split(' (')[0]}, nguồn ${DATA.vang.source}.`,go:'vang'}
}
function hPercent(n){
  const pcs=[...n.matchAll(new RegExp(NUM+'\\s*(?:%|phan tram)','g'))].map(m=>({v:pn(m[1]),s:m[0],i:m.index}));
  const wants=/(phan tram|%|giam gia|khuyen mai|chiet khau|\bsale\b|giam|tang)/.test(n);if(!wants)return null;
  if(/(lai|gui|tiet kiem|vay|tra gop|bmi|luong)/.test(n))return null;
  let t=n;pcs.forEach(p=>{t=t.replace(p.s,' ')});
  const nums=allNums(t).filter(x=>x.raw>0);
  const sgn=x=>(x>0?'+':x<0?'−':'')+vnd(Math.abs(x));
  /* a) hai mức giá: tăng/giảm bao nhiêu % */
  if(!pcs.length&&nums.length>=2&&/(bao nhieu (phan tram|%)|may phan tram|bao nhieu %)/.test(n)){
    if(/\bcua\b/.test(n)){const a=nums[0].v,b=nums[1].v;if(b>0)return {t:`**${a.toLocaleString('vi-VN')}** bằng **${f1(a/b*100)}%** của **${b.toLocaleString('vi-VN')}**.`,go:'phantram'}}
    const a=nums[0].v,b=nums[1].v;if(a>0){const c=(b-a)/a*100,d=b-a;
      return {t:`Từ **${vnd(a)}** lên **${vnd(b)}**:\n• ${c>=0?'Tăng':'Giảm'} **${f1(Math.abs(c))}%**\n• Chênh lệch: **${sgn(d)}**\n• Giá mới bằng **${f1(b/a)} lần** giá cũ`+(c>0?`\n• Muốn về lại giá cũ thì phải giảm **${f1(d/b*100)}%** (không phải ${f1(c)}%)`:`\n• Muốn về lại giá cũ thì phải tăng **${f1(-d/b*100)}%**`),go:'phantram'}}}
  if(!pcs.length||!nums.length)return null;
  const price=nums.sort((a,b)=>(b.u?1:0)-(a.u?1:0)||b.v-a.v)[0].v,down=/(giam|khuyen mai|chiet khau|\bsale\b|off|re hon)/.test(n),up=/(tang|phu thu|dat hon)/.test(n);
  /* b) giảm/tăng nhiều lần liên tiếp */
  if(pcs.length>=2&&(down||up)){const f=pcs.slice(0,3).reduce((k,p)=>k*(1+(down&&!(up&&!down)?-1:1)*p.v/100),1),end=price*f;
    return {t:`Giá **${vnd(price)}** ${down?'giảm':'tăng'} lần lượt ${pcs.slice(0,3).map(p=>p.v+'%').join(' rồi ')}:\n• Giá cuối: **${vnd(end)}**\n• Tổng ${down?'giảm':'tăng'}: **${sgn(end-price)}**, tương đương ${down?'giảm':'tăng'} **${f1(Math.abs(f-1)*100)}%** (không phải cộng thẳng ${f1(pcs.slice(0,3).reduce((a,p)=>a+p.v,0))}%)`,go:'phantram'}}
  const p=pcs[0].v;
  /* c) tìm giá gốc */
  if(/(gia goc|ban dau|truoc khi|goc la)/.test(n)&&(down||up)){const o=down?price/(1-p/100):price/(1+p/100);if(!isFinite(o)||o<=0)return null;
    return {t:`Giá sau khi ${down?'giảm':'tăng'} **${f1(p)}%** là **${vnd(price)}** thì giá gốc là:\n• **${vnd(o)}**\n• Chênh lệch so với giá gốc: **${sgn(price-o)}**`,go:'phantram'}}
  /* d) giá sau khi tăng/giảm */
  if(down||up||/(phan tram|%)/.test(n)){const d=up&&!down?1:-1,end=price*(1+d*p/100),diff=end-price;
    return {t:`**${vnd(price)}** ${d<0?'giảm':'tăng'} **${f1(p)}%**:\n• Giá sau cùng: **${vnd(end)}**\n• ${d<0?'Tiết kiệm được':'Phải trả thêm'}: **${vnd(Math.abs(diff))}**\n• Bằng **${f1(end/price)} lần** giá ban đầu`+(d<0?`\n• Nếu sau đó tăng lại ${f1(p)}% thì ra ${vnd(end*(1+p/100))} (thấp hơn giá cũ)`:''),go:'phantram'}}
  return null;
}
function hSaving(n){
  if(!/(gui|tiet kiem|lai suat|lai kep|lai don)/.test(n))return null;if(/(vay|tra gop)/.test(n))return null;
  const pc=n.match(new RegExp(NUM+'\\s*%'));
  const rest=pc?n.replace(pc[0],' '):n,tm=rest.match(/(\d+)\s*(thang|nam)/),mo=tm?(tm[2]==='nam'?+tm[1]*12:+tm[1]):null;
  const nums=allNums(rest.replace(/(\d+)\s*(thang|nam)/,' ')).filter(x=>x.u||x.raw>=100000);
  const mon=/(moi thang|hang thang|gui gop|gop moi)/.test(n)&&/gui|gop/.test(n);
  const r=pc?pn(pc[1]):null;
  const fm=x=>vnd(x);
  /* 1) gửi góp hằng tháng */
  if(mon&&r&&nums.length&&mo){const m=nums[0].v,i=r/1200,fv=i?m*(Math.pow(1+i,mo)-1)/i:m*mo,put=m*mo;
    return {t:`Mỗi tháng gửi **${fm(m)}**, lãi **${String(r).replace(".",",")}%/năm**, trong **${mo} tháng** (lãi nhập gốc hằng tháng, ước tính):\n• Tổng tiền bạn bỏ vào: **${fm(put)}**\n• Tiền lãi: **${fm(fv-put)}**\n• Tổng sau cùng: **${fm(fv)}**\n• Lãi chiếm khoảng ${f1((fv-put)/fv*100)}% tổng số tiền nhận\n\nĐây là ước tính, mỗi ngân hàng tính gửi góp hơi khác nhau.`,go:'laisuat'}}
  /* 2) mục tiêu: gửi X, lãi r%, muốn có Y thì bao lâu */
  if(r&&nums.length>=2&&/(bao lau|may nam|bao nhieu nam|de dat|de co|moi du|thanh)/.test(n)){const [A,B]=[nums[0].v,nums[1].v].sort((x,y)=>x-y);if(B>A){const yr=Math.log(B/A)/Math.log(1+r/100),ys=(B-A)/(A*r/100);
    return {t:`Gửi **${fm(A)}** với lãi **${String(r).replace(".",",")}%/năm** để đạt **${fm(B)}**:\n• Lãi kép (nhập gốc mỗi năm): khoảng **${f1(yr)} năm** (≈ ${Math.ceil(yr*12)} tháng)\n• Lãi đơn (không nhập gốc): khoảng **${f1(ys)} năm**\n\nLãi kép nhanh hơn vì tiền lãi cũng sinh lãi.`,go:'laisuat'}}}
  /* 3) chưa nói lãi suất: đưa bảng mức tham khảo */
  if(!r&&nums.length&&nums[0].v>=1e6&&/(gui|tiet kiem)/.test(n)){const P=nums[0].v,T=mo||12,rows=[4,5,6,7].map(x=>`• Lãi ${x}%/năm: lãi **${fm(P*x/100*T/12)}**, nhận **${fm(P+P*x/100*T/12)}**`).join('\n');
    return {t:`Bạn chưa nói lãi suất. Với **${fm(P)}** gửi **${T} tháng**, thử các mức lãi giả định (để bạn hình dung):\n${rows}\n\nLãi suất thật tùy ngân hàng và kỳ hạn. Nói “gửi ${f1(P/1e6)} triệu lãi 5,5% 12 tháng” để mình tính đúng.`,go:'laisuat'}}
  /* 4) gửi một lần, có lãi suất: nhiều số liệu */
  if(!r||!nums.length)return null;const P=nums[0].v,T=mo||12,i=r/1200,L=P*r/100*T/12,comp=P*Math.pow(1+i,T),eff=(Math.pow(1+i,12)-1)*100;
  const ms=[6,12,24,36].filter(x=>x!==T).slice(0,3).map(x=>`${x} tháng ${fm(P*r/100*x/12)}`).join(' · ');
  return {t:`Gửi **${fm(P)}**, lãi **${String(r).replace(".",",")}%/năm**, kỳ hạn **${T} tháng**:\n• Tiền lãi (lãi đơn, nhận cuối kỳ): **${fm(L)}**\n• Cuối kỳ nhận: **${fm(P+L)}**\n• Nếu nhận lãi hằng tháng: **${fm(P*r/1200)}**/tháng\n• Lãi mỗi ngày khoảng: ${fm(P*r/36500)}\n• Nếu lãi nhập gốc hằng tháng (lãi kép): nhận **${fm(comp)}**, hơn lãi đơn ${fm(comp-P-L)}\n• Lãi hiệu dụng (lãi kép): ${f1(eff)}%/năm\n• Lãi các mốc khác: ${ms}\n• Gấp đôi vốn sau khoảng ${f1(100/r)} năm (lãi đơn) hoặc ${f1(Math.log(2)/Math.log(1+i)/12)} năm (lãi kép)\n\nSố liệu ước tính, thực tế tùy cách trả lãi của từng ngân hàng.`,go:'laisuat'};
}
function hLoan(n){
  if(!/(vay|tra gop)/.test(n))return null;const pc=n.match(new RegExp(NUM+'\\s*%'));if(!pc)return null;const a=allNums(n.replace(pc[0],' ')).find(x=>x.u||x.raw>=1e6);if(!a)return null;
  const tm=n.match(/(\d+)\s*(thang|nam)/);if(!tm)return null;const mo=tm[2]==='nam'?+tm[1]*12:+tm[1],r=pn(pc[1])/100/12;
  const pmt=r?a.v*r/(1-Math.pow(1+r,-mo)):a.v/mo;
  return {t:`Vay **${vnd(a.v)}**, lãi **${pn(pc[1])}%/năm**, thời hạn **${mo} tháng** (trả đều gốc + lãi hằng tháng):\n• Mỗi tháng khoảng **${vnd(pmt)}**\n• Tổng phải trả khoảng ${vnd(pmt*mo)}\n• Tổng tiền lãi khoảng ${vnd(pmt*mo-a.v)}\n\nDạng trả góp đều (annuity). Mỗi ngân hàng có thể tính khác một chút.`,go:'vay'}
}
function hSplit(n){
  if(!/chia/.test(n))return null;const pm=n.match(new RegExp(NUM+'\\s*(?:nguoi|ban|nguoi)'));if(!pm)return null;const people=Math.round(pn(pm[1]));if(!(people>=2&&people<=500))return null;
  const a=allNums(n.replace(pm[0],' ')).find(x=>x.u||x.raw>=1000);if(!a)return null;
  return {t:`Chia **${vnd(a.v)}** cho **${people} người**: mỗi người khoảng **${vnd(a.v/people)}**.`,go:'chia'}
}
function hBody(n){
  const kg=n.match(new RegExp(NUM+'\\s*(?:kg|ky|can)\\b'));if(!kg)return null;const w=pn(kg[1]);if(!(w>10&&w<300))return null;
  if(/nuoc/.test(n)&&/(uong|ly|nen)/.test(n)){const a=w*30,b=w*35;return {t:`Với cân nặng **${f1(w)} kg**, mỗi ngày bạn nên uống khoảng **${f1(a/1000)}–${f1(b/1000)} lít nước** (30–35 ml mỗi kg), tức khoảng ${Math.round(a/250)}–${Math.round(b/250)} ly 250 ml. Trời nóng hoặc vận động nhiều thì uống thêm.`,go:'nuoc'}}
  let h=null;const mc=n.match(/\b(\d{3})\s*cm\b/),m1=n.match(/\b([12])\s*m\s*(\d{1,2})\b/),m2=n.match(/\b([12](?:[.,]\d+)?)\s*m\b/);
  if(mc)h=+mc[1]/100;else if(m1)h=+m1[1]+(+m1[2])/(m1[2].length===1?10:100);else if(m2)h=pn(m2[1]);
  if(!h||h<1||h>2.5)return null;const b=w/(h*h);
  const kind=b<18.5?'thiếu cân':b<23?'cân đối':b<25?'thừa cân':'béo phì';
  return {t:`Cao **${h.toFixed(2).replace('.',',')} m**, nặng **${f1(w)} kg** thì **BMI ≈ ${f1(b)}**, thuộc nhóm **${kind}** (theo chuẩn châu Á: dưới 18,5 thiếu cân; 18,5–22,9 cân đối; 23–24,9 thừa cân; từ 25 béo phì).\n\nBMI chỉ để tham khảo. Mở tiện ích để xem cân nặng lý tưởng và calo mỗi ngày.`,go:'bmi'}
}
function hWords(n){
  if(!/(doc so|bang chu|thanh chu|viet so)/.test(n))return null;const m=n.match(new RegExp(NUM));if(!m)return null;const v=pn(m[1])*(MULT[(n.match(new RegExp(NUM+'\\s*(k|nghin|ngan|trieu|tr|ty|ti)\\b'))||[])[2]]||1);
  if(!(v>=0)||v!==Math.floor(v))return null;const s=readVN(v);if(!s)return {t:'Số này lớn quá, mình đọc được đến dưới 1.000 tỷ thôi nhé.',go:'docso'};
  return {t:`**${v.toLocaleString('vi-VN')}** đọc là: **${s} đồng**.`,go:'docso'}
}
const DOW=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
function hDate(n){
  const m=n.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/);if(!m)return null;
  const now=new Date(),d0=TI.today0(),y=m[3]?+m[3]:now.getFullYear(),dd=+m[1],mm=+m[2];if(mm<1||mm>12||dd<1||dd>31)return null;
  let d=new Date(y,mm-1,dd);if(d.getMonth()!==mm-1)return null;if(!m[3]&&d<d0&&/(con|may ngay|bao nhieu ngay|den)/.test(n))d=new Date(y+1,mm-1,dd);
  const L=Lunar.info(d),ds=`${dd}/${mm}/${d.getFullYear()}`;
  if(/am lich/.test(n))return {t:`Ngày **${ds}** (${DOW[d.getDay()]}) là ngày **${L.d}/${L.m}${L.leap?' (nhuận)':''} âm lịch**, ${L.day}, năm ${L.year}.`,go:'lich'};
  if(/(thu may|thu nao|ngay gi)/.test(n))return {t:`Ngày **${ds}** là **${DOW[d.getDay()]}**.`,go:'lich'};
  if(/(con|bao nhieu ngay|may ngay|den)/.test(n)){const k=TI.days(d0,d);return {t:k===0?`Hôm nay chính là ngày **${ds}**.`:k>0?`Còn **${k} ngày** nữa đến ngày **${ds}** (${DOW[d.getDay()]}).`:`Ngày **${ds}** đã qua **${-k} ngày** rồi.`,go:'ngay'}}
  return null;
}
function hLottery(n){
  if(!/(xo so|kqxs|ket qua|dai|giai)/.test(n))return null;const X=DATA.xs,keys=Object.keys(X.days).sort().reverse();
  const names=new Set();keys.forEach(k=>X.days[k].forEach(s=>names.add(s.n)));
  const st=[...names].find(s=>hasPhrase(n,norm(s))||(norm(s).split(' ').length>1&&norm(s)===norm(s)&&n.includes(norm(s))));if(!st)return null;
  for(const k of keys){const S=X.days[k].find(s=>s.n===st);if(S){const v=x=>Array.isArray(x)?x.join(' – '):x;const d=new Date(k+'T00:00:00');
    return {t:`Kết quả gần nhất của đài **${st}** (${DOW[d.getDay()]}, ${TI.dstr(d)}):\n• **Giải đặc biệt: ${v(S.db)}**\n• Giải nhất: ${v(S.g1)}\n• Giải nhì: ${v(S.g2)}\n\nMở “Xổ số miền Nam” để xem đủ các giải. ${X.live?'Kết quả lấy qua mạng':'Số liệu đã lưu'} lúc ${TI.live?TI.live.stamp(new Date(X.captured)):''}, hãy đối chiếu với kết quả chính thức trước khi dò vé.`,go:'xoso'}}}
  return null;
}
function hRandom(n){
  if(/(tung|gieo|lac).*(xuc xac)/.test(n)||/xuc xac/.test(n)&&/tung|choi|cho/.test(n)){const a=1+TI.rnd(6),b=1+TI.rnd(6);return {t:`🎲 Mình tung hai viên cho bạn: **${a}** và **${b}**, tổng **${a+b}**.`,go:'xucxac'}}
  if(/(dong xu|sap ngua)/.test(n)){return {t:`🪙 Mình tung đồng xu: ra mặt **${TI.rnd(2)?'NGỬA':'SẤP'}**.`,go:'xucxac'}}
  const m=n.match(/(?:so|chon)?\s*ngau nhien.*?(\d+)\s*(?:den|toi|-)\s*(\d+)/);if(m){const a=+m[1],b=+m[2];if(b>a&&b-a<1e9)return {t:`🎯 Số ngẫu nhiên từ ${a} đến ${b}: **${a+TI.rnd(b-a+1)}**.`,go:'bocthang'}}
  return null;
}
function hMath(raw,n){
  const p=n.match(new RegExp(NUM+'\\s*%\\s*(?:cua|of)\\s*'+NUM+'\\s*(k|nghin|ngan|trieu|tr|ty|ti)?'));
  if(p){const a=pn(p[1]),b=pn(p[2])*(MULT[p[3]]||1);return {t:`**${a}%** của **${b.toLocaleString('vi-VN')}** là **${(b*a/100).toLocaleString('vi-VN',{maximumFractionDigits:2})}**.`,go:'phantram'}}
  const e=raw.replace(/[x×]/gi,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/\s+/g,'');
  if(/^[\d+\-*/().]+$/.test(e)&&/[+\-*/]/.test(e)&&/\d/.test(e)&&e.length<60){try{const r=Function('"use strict";return ('+e+')')();if(isFinite(r))return {t:`**${raw.trim()}** = **${(Math.round(r*1e8)/1e8).toLocaleString('vi-VN')}**`,go:'maytinh'}}catch(_){}}
  return null;
}

/* ===== Trò chuyện thường ===== */
function listTools(){
  const vis=TOOLS.filter(t=>!t.hidden),g=[...new Set(vis.map(t=>t.group))];
  return g.map(x=>`**${x}**: ${vis.filter(t=>t.group===x).map(t=>t.name).join(', ')}`).join('\n');
}
function small(n){
  if(/^(xin chao|chao|hello|hi|alo|hey|chao ban|chao koda|koda oi|koda)\b/.test(n)&&n.split(' ').length<=4)return pick(['Chào bạn! Mình là KoDa đây 👋 Bạn cần xem giá vàng, xăng, thời tiết hay dùng tiện ích nào cứ hỏi mình nhé.','Xin chào! Hôm nay bạn muốn mình giúp gì trong app Tiện ích nào? 😊']);
  if(/(cam on|thanks|thank you|cảm ơn)/.test(n))return pick(['Không có chi! Cần gì cứ hỏi mình tiếp nhé 😊','Rất vui được giúp bạn 🌿']);
  if(/(tam biet|bye|hen gap lai|ngu ngon)/.test(n))return pick(['Hẹn gặp lại bạn nhé! Nhớ uống nước và nghỉ ngơi 💧','Chúc bạn ngủ ngon và một ngày mai nhẹ nhàng 🌙']);
  if(/(khoe khong|the nao roi|co vui khong|dang lam gi)/.test(n))return pick(['Mình khỏe lắm, vì là robot nhỏ chạy ngay trong app 😄 Còn bạn thì sao?','Mình đang ngồi chờ bạn hỏi đây! Hôm nay bạn thế nào?']);
  if(/(ban gioi|gioi qua|hay qua|tuyet voi)/.test(n))return 'Cảm ơn bạn nhé, mình sẽ cố gắng hơn nữa 🤖';
  return null;
}
function help(n){
  if(/(co nhung tien ich|danh sach tien ich|tat ca tien ich|liet ke|app co gi|co nhung gi|co chuc nang)/.test(n))return 'App Tiện ích hiện có:\n'+listTools()+'\n\nBạn muốn mình giải thích tiện ích nào, cứ gọi tên nhé.';
  if(/(giup duoc|lam duoc gi|co the lam gi|huong dan|biet gi|chuc nang cua ban)/.test(n)&&!toolHit(n))return 'Mình trả lời các câu hỏi về **tiện ích trong app**: giá vàng, xăng, chứng khoán, tỷ giá, xổ số, lịch âm, thời tiết, các công cụ tính (lãi, vay, BMI…) và cách dùng app.\n\nBạn có thể hỏi bằng số liệu như “5 chỉ vàng bao nhiêu”, “100 đô bằng bao nhiêu tiền Việt”, “áo 500 nghìn giảm 30% còn bao nhiêu”, “vay 1 tỷ 20 năm lãi 9%”.\n\n'+'Câu nào ngoài app thì mình sẽ báo lại, vì mình không phải AI trò chuyện tự do.';
  return null;
}
const OUT=['Câu này nằm ngoài phạm vi của app Tiện ích nên mình chưa trả lời được 🙏','Xin lỗi, chuyện này mình không có trong dữ liệu của app Tiện ích 🙏','Mình chỉ hỗ trợ những việc trong app Tiện ích, câu này thì mình xin phép không trả lời nhé 🙏'];
function outOfScope(){
  const s=(TI.kodaPrompts?TI.kodaPrompts(3):[]).map(q=>`• ${q}`).join('\n');
  return pick(OUT)+'\n\nMình giúp được về **giá vàng, xăng, chứng khoán, tỷ giá, xổ số, lịch âm, thời tiết** và các công cụ trong app. Bạn thử hỏi:\n'+s;
}

/* ===== Hàm chính ===== */
async function answerCore(text){
  const raw=String(text||'').trim(),n=norm(raw);if(!n)return {t:'Bạn gõ câu hỏi giúp mình nhé.',go:null};
  /* 1. trò chuyện thường */
  const sm=small(n);if(sm)return {t:sm,go:null};
  /* 2. số liệu & công cụ tính */
  const H=[()=>hMath(raw,n),()=>hPercent(n),()=>hWords(n),()=>hUnits(n),()=>hCurrency(n),()=>hGold(n),()=>hFuel(n),()=>hLoan(n),()=>hSaving(n),()=>hSplit(n),()=>hBody(n),()=>hWorldTime(n),()=>hLottery(n),()=>hRandom(n),()=>hDate(n)];
  for(const h of H){let r=null;try{r=h()}catch(e){r=null}if(r)return typeof r==='string'?{t:r,go:null}:r}
  const hp=help(n);if(hp)return {t:hp,go:null};
  /* 3. câu hỏi soạn sẵn / tiện ích */
  const th=toolHit(n),b=bestFAQ(raw);
  const run=async x=>{let out;try{out=await x.a()}catch(e){out='Xin lỗi, mình chưa trả lời được câu này.'}return {t:out,go:x.go===undefined?null:x.go}};
  if(th){const bt=bestFAQ(raw,th);if(bt&&bt.sc>0&&bt.cov>=0.3)return run(bt.d.x);
    if(b&&b.cov>=0.9)return run(b.d.x);
    if(T[th]){const t=TOOLS.find(y=>y.id===th);const name=th==='settings'?'Cài đặt':(t?t.name:th);return {t:`**${name}**: ${T[th][1]}\n\nBạn hỏi cụ thể hơn một chút, ví dụ có kèm con số, mình sẽ tính giúp nếu làm được nhé.`,go:th}}}
  if(b&&b.cov>=0.4)return run(b.d.x);
  return {t:outOfScope(),go:null,out:true};
}
async function answer(text){
  const n=norm(text);let kinds=[];
  if(TI.live){kinds=TI.live.kindsFor(n);if(kinds.length)await TI.live.wait(kinds,5500)}
  const r=await answerCore(text);if(kinds.length&&r&&!r.out&&TI.liveNote)r.t+=TI.liveNote(kinds);return r}
TI.kodaBrain=answer;
TI.kodaNorm=norm;
})();
