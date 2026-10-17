/* KoDa – linh vật hướng dẫn các tiện ích (câu hỏi & trả lời soạn sẵn, không cần AI, không cần mạng) + Xổ số miền Nam */
(function(){
'use strict';
const {$,$$,store,esc,pad,dstr,iso,WD,TOOLS,tabs,capText,rr,fmt}=TI;

/* ---------- Linh vật KoDa ---------- */
const kodaSVG0=(s=44)=>`<svg class="koda-av" width="${s}" height="${s}" viewBox="0 0 64 64" role="img" aria-label="KoDa – linh vật trợ lý"><line x1="32" y1="14" x2="32" y2="8" stroke="var(--ac)" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="6.5" r="3.4" fill="var(--ac)"/><rect x="3.5" y="30" width="5" height="12" rx="2.5" fill="var(--ac)"/><rect x="55.5" y="30" width="5" height="12" rx="2.5" fill="var(--ac)"/><rect x="8" y="14" width="48" height="42" rx="17" fill="var(--card)" stroke="var(--ac)" stroke-width="2.6"/><rect x="14.5" y="23" width="35" height="23" rx="11.5" fill="var(--bg)"/><g class="koda-eye"><circle cx="25" cy="33" r="3.3" fill="var(--ac)"/><circle cx="39" cy="33" r="3.3" fill="var(--ac)"/></g><path d="M27.5 39.5q4.5 3.8 9 0" fill="none" stroke="var(--ac)" stroke-width="2.4" stroke-linecap="round"/></svg>`;


const kodaSVG=(s=44,id)=>TI.kodaDraw?TI.kodaDraw(s,id||'base'):kodaSVG0(s);
TI.kodaSVG=kodaSVG;
/* ---------- Câu hỏi & trả lời của KoDa ---------- */
const CATS=[['tc','💰','Tài chính'],['tg','🕐','Thời gian'],['ds','🌿','Đời sống'],['cc','🧰','Công cụ'],['gt','🎮','Giải trí'],['app','📱','Dùng app']];
const tn=id=>{const t=TOOLS.find(x=>x.id===id);return t?t.name:''};
const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
const dt=Dd=>String(Dd.dataTime).split(' (')[0];
const pick=a=>a[TI.rnd(a.length)];
const DISHES=['Phở bò','Bún chả','Cơm tấm sườn','Bún bò Huế','Mì Quảng','Bánh mì chả','Cháo gà','Bún riêu','Hủ tiếu','Cơm gà Hội An','Bún đậu mắm tôm','Canh chua cá kho tộ','Gỏi cuốn','Bánh cuốn','Miến gà','Lẩu thái'];
function tetInfo(){
  const t=TI.today0();let y=t.getFullYear(),s=Lunar.lunar2solar(1,1,y,0,7),d=new Date(s[2],s[1]-1,s[0]);
  if(d<t){y++;s=Lunar.lunar2solar(1,1,y,0,7);d=new Date(s[2],s[1]-1,s[0])}
  return{y,d,n:TI.days(t,d)};
}
const Q=[
/* ----- Tài chính ----- */
{c:'tc',q:'Giá vàng SJC hôm nay bao nhiêu?',go:'vang',a:()=>{const D=DATA.vang,r=D.sections[0].rows[0],ch=(num(r[2])-num(r[1])).toFixed(1).replace('.',',');
  return `**${r[0]}**: mua vào **${r[1]}**, bán ra **${r[2]}** triệu đồng/lượng.\nChênh lệch mua – bán khoảng ${ch} triệu.\nSố liệu: ${dt(D)} · nguồn ${D.source}.\n${D.live?'Giá lấy qua mạng vừa xong, có thể thay đổi trong ngày.':'Đây là số liệu đã lưu, chưa lấy được giá mới qua mạng.'}`}},
{c:'tc',q:'Vàng 24K và 18K giá bao nhiêu?',go:'vang',a:()=>{const B=DATA.vang.more[0];
  return B.rows.map(r=>`• ${r[0]}: mua ${r[1]} – bán ${r[2]}`).join('\n')+`\nĐơn vị triệu đồng/lượng. Số liệu ${B.dataTime} · nguồn ${B.source}.`}},
{c:'tc',q:'Vàng miếng và vàng nhẫn khác nhau thế nào?',go:'vang',a:()=>'**Vàng miếng** (như SJC) là vàng thỏi do thương hiệu được cấp phép phát hành, giá niêm yết thường cao hơn.\n**Vàng nhẫn trơn** (999.9 hay còn gọi 24K) là nhẫn không đính đá, giá gần với vàng miếng.\n**Vàng 18K** (750) chỉ có 75% là vàng nguyên chất, thường dùng làm trang sức nên giá thấp hơn và chênh lệch mua – bán lớn.\nMua để tích trữ thì nên hỏi kỹ giá mua lại.'},
{c:'tc',q:'VN-Index đang bao nhiêu điểm?',go:'chungkhoan',a:()=>{const D=DATA.ck,r=D.sections[0].rows;
  return r.map(x=>`• ${x[0]}: **${x[1]}** (${x[2]})`).join('\n')+`\n${D.dataLabel||'Chốt phiên'} ${dt(D)}. Nguồn ${D.source}. ${D.live?'Lấy qua mạng vừa xong.':'Đây là số liệu đã lưu, chưa lấy được số mới qua mạng.'}`}},
{c:'tc',q:'Giá xăng hôm nay thế nào?',go:'xang',a:()=>{const D=DATA.xang,r=D.sections[0].rows;
  return r.map(x=>`• ${x[0]}: **${x[1]}** đ/lít (${x[2]} so kỳ trước)`).join('\n')+`\n${D.live?'Cập nhật':'Áp dụng từ'} ${dt(D)}. Đây là giá bán lẻ tối đa, cửa hàng có thể bán thấp hơn.`}},
{c:'tc',q:'100 đô la Mỹ đổi được bao nhiêu tiền Việt?',go:'tygia',a:()=>{const F=DATA.fx,u=F.rates.USD,j=F.rates.JPY;
  return `Theo tỷ giá ${F.live?'mới nhất':'đã lưu'} (${capText(F.captured)}):\n• 100 USD ≈ **${fmt(100*u.buy)}** đồng (ngân hàng mua vào) đến ${fmt(100*u.sell)} đồng (bán ra).\n• 10.000 JPY ≈ ${fmt(10000*j.buy)} đồng (mua vào).\nMở tiện ích để xem tỷ giá cập nhật qua mạng và đổi cả Hàn Quốc, Trung Quốc.`}},
{c:'tc',q:'Món 500 nghìn giảm 30% còn bao nhiêu?',go:'phantram',a:()=>'Giá sau giảm = giá × (1 − %).\nVí dụ **500.000 đ giảm 30%** còn **350.000 đ**, tiết kiệm 150.000 đ.\nMở **Tăng giảm %** nhập giá và % của bạn, hoặc hỏi KoDa kiểu “áo 800 nghìn giảm 25% còn bao nhiêu”.'},
{c:'tc',q:'Giá tăng từ 80 nghìn lên 100 nghìn là tăng bao nhiêu phần trăm?',go:'phantram',a:()=>'Công thức: (giá mới − giá cũ) ÷ giá cũ × 100.\nVí dụ từ **80.000 lên 100.000**: tăng **25%**. Nhưng muốn từ 100.000 về lại 80.000 thì chỉ cần giảm **20%**.\nNhập hai giá vào **Tăng giảm %** để tính ngay.'},
{c:'tc',q:'Giảm giá hai lần liên tiếp thì giảm tổng cộng bao nhiêu?',go:'phantram',a:()=>'Mỗi lần giảm tính trên giá đã giảm, nên **không cộng thẳng**.\nVí dụ giảm 30% rồi giảm thêm 10%: giá còn 0,7 × 0,9 = 63%, tức là chỉ giảm **37%** (không phải 40%).\nMở **Tăng giảm %** chọn “Giảm giá nhiều lần liên tiếp”.'},
{c:'tc',q:'Gửi 100 triệu lãi 6% một năm được bao nhiêu?',go:'laisuat',a:()=>'Gửi **100.000.000 đ**, lãi **6%/năm**, kỳ hạn 12 tháng:\n• Tiền lãi: **6.000.000 đ**, cuối kỳ nhận 106.000.000 đ\n• Nhận lãi hằng tháng: 500.000 đ/tháng\n• Nếu lãi nhập gốc hằng tháng: nhận khoảng 106.168.000 đ\nMuốn tính số của bạn, nhắn KoDa “gửi 200 triệu lãi 5,5% 12 tháng”.'},
{c:'tc',q:'Mỗi tháng gửi góp 5 triệu thì sau 5 năm có bao nhiêu?',go:'laisuat',a:()=>'Gửi góp mỗi tháng, tiền lãi cộng dồn theo từng tháng. Ví dụ **5 triệu/tháng, lãi 6%/năm, 60 tháng**: bỏ vào 300 triệu, lãi khoảng 48,9 triệu, tổng khoảng 348,9 triệu.\nNhắn KoDa “mỗi tháng gửi 5 triệu lãi 6% 5 năm” để KoDa tính theo số của bạn.'},
{c:'tc',q:'Bao lâu thì tiền gửi tiết kiệm gấp đôi?',go:'laisuat',a:()=>'Nhẩm nhanh: lấy **72 ÷ lãi suất (%)** ra số năm gần đúng khi lãi nhập gốc. Ví dụ lãi 6%/năm thì khoảng **12 năm**, lãi 8% thì khoảng 9 năm.\nNếu chỉ tính lãi đơn (không nhập gốc) thì là 100 ÷ lãi suất, ví dụ 6% mất khoảng 16,7 năm.'},
{c:'tc',q:'Gửi tiết kiệm thì tính lãi thế nào?',go:'laisuat',a:()=>'Nhập **số tiền gửi**, **lãi suất (%/năm)** và **kỳ hạn (tháng)**, rồi chọn hình thức:\n• Lãi nhận cuối kỳ\n• Lãi nhận hàng tháng\n• Lãi nhập gốc hàng tháng (lãi kép)\nApp cho biết tiền lãi, tổng nhận cuối kỳ và lãi hiệu dụng/năm. Các ô đều bắt đầu từ 0, bạn tự nhập số của mình.'},
{c:'tc',q:'Vay mua nhà mỗi tháng phải trả bao nhiêu?',go:'vay',a:()=>'Nhập **số tiền vay**, **lãi suất (%/năm)**, **thời hạn (tháng)**, rồi chọn cách trả:\n• **Gốc đều, lãi giảm dần**: tháng đầu trả nhiều nhất, sau đó giảm dần.\n• **Trả đều hàng tháng**: mỗi tháng trả một số tiền như nhau.\nApp cho biết tháng đầu, tháng cuối, tổng lãi và có bảng từng kỳ. Lãi suất thả nổi của ngân hàng có thể đổi theo thời gian nên kết quả chỉ để tham khảo.'},
{c:'tc',q:'Lương Gross và Net khác nhau thế nào?',go:'luong',a:()=>'**Gross** là lương trước khi trừ bảo hiểm và thuế. **Net** là số tiền thực nhận về tay.\nApp tính hai chiều: Gross → Net và Net → Gross, có tính giảm trừ gia cảnh theo số người phụ thuộc. Kết quả mang tính tham khảo, hãy đối chiếu quy định hiện hành hoặc phòng nhân sự.'},
{c:'tc',q:'Chia tiền ăn nhóm sao cho công bằng?',go:'chia',a:()=>'Có hai cách:\n• **Chia đều**: nhập tổng tiền, số người, thêm % tip hoặc phí nếu có, app ra số tiền mỗi người.\n• **Ai chi bao nhiêu**: nhập tên và số tiền mỗi người đã chi, app tính ai cần trả thêm hoặc được nhận lại.'},
{c:'tc',q:'Sổ chi tiêu và sổ nợ dùng thế nào?',go:'chitieu',a:()=>'**Sổ chi tiêu**: ghi các khoản thu chi hằng ngày để xem mình tiêu bao nhiêu.\n**Sổ nợ**: ghi ai nợ bạn, bạn nợ ai và đã trả bao nhiêu.\nDữ liệu chỉ lưu trên điện thoại của bạn.'},
/* ----- Thời gian ----- */
{c:'tg',q:'Hôm nay là ngày mấy âm lịch?',go:'lich',a:()=>{const n=new Date(),L=Lunar.info(n),h=TI.holOf(n,L);
  return `${WD[n.getDay()]}, ${dstr(n)} là ngày **${L.d}/${L.m}${L.leap?' (nhuận)':''}** âm lịch, ngày ${L.day}, năm ${L.year}.`+(h.length?`\nHôm nay: ${h.join(', ')}.`:'')}},
{c:'tg',q:'Còn bao nhiêu ngày nữa đến Tết?',go:'lich',a:()=>{const t=tetInfo();
  return t.n===0?'🎊 Hôm nay chính là Tết! Chúc bạn năm mới an khang.':`Còn **${t.n} ngày** nữa đến Tết Nguyên đán ${t.y} (mùng 1 rơi vào ${WD[t.d.getDay()]}, ${dstr(t.d)}).`}},
{c:'tg',q:'Hôm nay trời thế nào?',go:'thoitiet',a:async()=>{try{const{w,a}=await TI.getWeather(TI.curCity()),cu=w.current,[e,t]=TI.WC(cu.weather_code),d=w.daily;
  return `${e} Tại **${TI.cityLabel(TI.curCity())}**: ${Math.round(cu.temperature_2m)}°, ${t.toLowerCase()}.\nHôm nay ${Math.round(d.temperature_2m_min[0])}°–${Math.round(d.temperature_2m_max[0])}°, độ ẩm ${cu.relative_humidity_2m}%, khả năng mưa ${d.precipitation_probability_max[0]??0}%`+(a&&a.current?`, chỉ số không khí AQI ${Math.round(a.current.us_aqi)}.`:'.')+'\nMở tiện ích để xem dự báo 7 ngày và đổi sang phường bạn ở.'}catch(e){return 'Mình chưa tải được thời tiết, có thể do đang mất mạng. Bạn thử mở tiện ích Thời tiết sau nhé. Ở đó bạn cũng chọn được vị trí theo phường đang ở.'}}},
{c:'tg',q:'Thêm sự kiện của mình vào lịch thế nào?',go:'lich',a:()=>'Mở **Lịch & sự kiện**, chạm vào một ngày, rồi bấm thêm sự kiện: nhập tên, giờ nếu cần. Ngày có sự kiện sẽ hiện một chấm nhỏ. Lịch hiển thị cả dương lịch, âm lịch và các ngày lễ.'},
{c:'tg',q:'Tính số ngày giữa hai ngày thế nào?',go:'ngay',a:()=>'Mở **Ngày tháng**: chọn “Từ ngày” và “Đến ngày” để biết cách nhau bao nhiêu ngày. App cũng cho biết bạn bao nhiêu tuổi, sinh nhật tới còn mấy ngày, và cộng hoặc trừ một số ngày từ một ngày bất kỳ.'},
{c:'tg',q:'Dùng bấm giờ và hẹn giờ thế nào?',go:'bamgio',a:()=>'Mở **Bấm giờ & hẹn giờ**. Có hai phần:\n• **Bấm giờ**: bắt đầu, ghi vòng, dừng.\n• **Hẹn giờ**: đặt thời gian đếm ngược, hết giờ sẽ có âm báo.\nNếu không nghe tiếng, hãy kiểm tra nút gạt im lặng bên hông iPhone.'},
{c:'tg',q:'Xem giờ ở nước ngoài thế nào?',go:'gio',a:()=>'Mở **Giờ & múi giờ** để xem giờ hiện tại ở Việt Nam và các thành phố lớn trên thế giới, tiện khi gọi điện cho người thân ở xa.'},
{c:'tg',q:'Pomodoro là gì?',go:'pomodoro',a:()=>'Pomodoro là cách làm việc tập trung: **25 phút làm, nghỉ 5 phút**. Sau khoảng 4 vòng thì nghỉ dài hơn. Mở tiện ích, bấm bắt đầu là app đếm giờ cho bạn.'},
/* ----- Đời sống ----- */
{c:'ds',q:'Hôm nay xổ số miền Nam có những đài nào?',go:'xoso',a:()=>{const n=new Date(),X=DATA.xs;
  return `${WD[n.getDay()]}, ${dstr(n)} có các đài: **${X.sched[n.getDay()].join(', ')}**.\nXổ số miền Nam quay thưởng mỗi ngày, khoảng 16 giờ 15 phút. Lịch có thể thay đổi dịp lễ, Tết.`}},
{c:'ds',q:'Kết quả xổ số gần nhất là gì?',go:'xoso',a:()=>{const X=DATA.xs,k=Object.keys(X.days).sort().pop(),d=new Date(k+'T00:00:00');
  return `Kết quả mới nhất trong app: **${WD[d.getDay()]}, ${dstr(d)}**\n`+X.days[k].map(s=>`• ${s.n}: giải đặc biệt **${s.db[0]}**`).join('\n')+`\n${X.live?'Lấy qua mạng':'Số liệu đã lưu'} lúc ${capText(X.captured)}. Hãy dò vé theo kết quả chính thức của công ty xổ số kiến thiết.`}},
{c:'ds',q:'Hôm nay ăn gì?',go:'anGi',a:()=>{const a=pick(DISHES);let b=pick(DISHES);while(b===a)b=pick(DISHES);return `Mình gợi ý **${a}**. Nếu chưa ưng thì thử **${b}** nhé 😋\nMở tiện ích để xoay món khác.`}},
{c:'ds',q:'Mỗi ngày nên uống bao nhiêu nước?',go:'nuoc',a:()=>'Người trưởng thành thường cần khoảng **1,5–2 lít nước mỗi ngày**, tùy cân nặng, thời tiết và mức vận động. Tiện ích **Uống nước** tính mục tiêu theo cân nặng của bạn và đếm từng ly. Người có bệnh lý nên hỏi bác sĩ.'},
{c:'ds',q:'BMI là gì? Bao nhiêu là bình thường?',go:'bmi',a:()=>'**BMI** = cân nặng (kg) chia cho bình phương chiều cao (m). Với người châu Á, khoảng **18,5–22,9** thường được xem là cân đối. Mở tiện ích, nhập chiều cao, cân nặng, tuổi để xem BMI, cân nặng lý tưởng và lượng calo mỗi ngày. BMI chỉ để tham khảo, không thay lời khuyên của bác sĩ.'},
{c:'ds',q:'Việc cần làm và ghi chú dùng thế nào?',go:'viec',a:()=>'**Việc cần làm**: gõ việc rồi thêm, chạm để đánh dấu xong.\n**Ghi chú**: lưu những điều cần nhớ.\nCả hai chỉ lưu trên điện thoại của bạn, không gửi đi đâu.'},
/* ----- Công cụ ----- */
{c:'cc',q:'Tạo mã QR và lưu hình thế nào?',go:'qr',a:()=>'Mở **Tạo mã QR**, nhập link, văn bản hoặc số điện thoại, mã hiện ngay. Muốn lưu: bấm nút lưu hình, hoặc nhấn giữ vào hình QR rồi chọn lưu vào Ảnh. App tạo mã ngay trên máy nên không cần mạng.'},
{c:'cc',q:'Đếm số bằng cách chạm màn hình dùng sao?',go:'demso',a:()=>'Mở **Đếm số**, mỗi lần chạm vào màn hình là cộng thêm 1. Tiện khi đếm người ra vào, số vòng, số lần tập. Có nút để về 0.'},
{c:'cc',q:'Đọc số thành chữ để làm gì?',go:'docso',a:()=>'Nhập một số tiền, ví dụ 1.250.000, app đọc thành chữ “Một triệu hai trăm năm mươi nghìn đồng”. Hữu ích khi viết giấy nhận tiền, hợp đồng, séc.'},
{c:'cc',q:'Bốc thăm, chia nhóm ngẫu nhiên thế nào?',go:'bocthang',a:()=>'Nhập danh sách tên, mỗi dòng một người. Chọn **bốc thăm** để ra một người ngẫu nhiên, hoặc **chia nhóm** theo số nhóm bạn muốn.'},
{c:'cc',q:'Đổi đơn vị độ dài, cân nặng, nhiệt độ thế nào?',go:'doidonvi',a:()=>'Chọn loại (độ dài, khối lượng, nhiệt độ…), nhập giá trị và đơn vị gốc, app hiện luôn các đơn vị còn lại.'},
{c:'cc',q:'Dùng máy tính ra sao?',go:'maytinh',a:()=>'Máy tính cơ bản có cộng, trừ, nhân, chia, phần trăm. Bấm vào các số như máy tính thông thường.'},
/* ----- Thêm: tài chính ----- */
{c:'tc',q:'1 chỉ vàng hôm nay bao nhiêu tiền?',go:'vang',a:()=>{const r=DATA.vang.sections[0].rows[0],m=num(r[1])/10,b=num(r[2])/10,f2=x=>x.toFixed(2).replace('.',',');
  return `Theo giá **${r[0]}** ${DATA.vang.live?'mới nhất':'đã lưu'} (${dt(DATA.vang)}):\n• 1 chỉ mua vào: **${f2(m)}** triệu đồng\n• 1 chỉ bán ra: **${f2(b)}** triệu đồng\n(1 lượng = 10 chỉ). Giá thực tế ở tiệm có thể khác.`}},
{c:'tc',q:'Đổ đầy bình xăng xe máy hết bao nhiêu tiền?',go:'xang',a:()=>{const x=DATA.xang.fuels[0],p5=x.p*5;
  return `Với bình xăng khoảng 5 lít (tùy xe), dùng **${x.n}** giá ${fmt(x.p)} đ/lít thì hết khoảng **${fmt(p5)} đồng**. Giá xăng áp dụng từ ${dt(DATA.xang)}.`}},
{c:'tc',q:'Gửi 100 triệu, kỳ hạn 12 tháng, lãi 5%/năm được bao nhiêu?',go:'laisuat',a:()=>'Ví dụ minh họa với lãi nhận cuối kỳ: 100.000.000 × 5% = **5.000.000 đồng** tiền lãi, tổng nhận **105.000.000 đồng**. Lãi suất thật do từng ngân hàng quy định, bạn nhập số của mình vào tiện ích để tính chính xác, kể cả lãi nhập gốc hàng tháng.'},
{c:'tc',q:'Mã QR nhận tiền (VietQR) dùng thế nào?',go:'vietqr',a:()=>'Mở **Mã QR nhận tiền**, chọn ngân hàng, nhập số tài khoản, số tiền và nội dung (không bắt buộc), mã hiện ngay. Người khác quét bằng app ngân hàng là điền sẵn thông tin chuyển khoản. Bạn lưu được ảnh mã hoặc lưu tài khoản để lần sau chọn nhanh. Mã tạo ngay trên máy, không gửi đi đâu.'},
{c:'tc',q:'Quét mã QR chuyển khoản có an toàn không?',go:null,a:()=>'Mã QR chỉ là cách điền sẵn thông tin, an toàn hay không tùy người nhận. Bạn nên:\n• **Đọc kỹ tên người nhận** hiện trên app ngân hàng trước khi xác nhận.\n• Không quét mã lạ gửi qua tin nhắn, mạng xã hội hay dán ở nơi công cộng.\n• Kiểm tra số tiền và nội dung trước khi bấm chuyển.'},
/* ----- Thêm: thời gian ----- */
{c:'tg',q:'Hôm nay có nên mang ô không?',go:'thoitiet',a:async()=>{try{const{w}=await TI.getWeather(TI.curCity()),pr=w.daily.precipitation_probability_max[0]??0;
  return pr>=50?`☔ Nên mang ô nhé, khả năng mưa hôm nay khoảng **${pr}%**.`:pr>=25?`🌦️ Khả năng mưa khoảng **${pr}%**, mang theo áo mưa gấp gọn cho chắc.`:`🌤️ Khả năng mưa chỉ khoảng **${pr}%**, chắc không cần mang ô đâu.`}catch(e){return 'Mình chưa tải được dự báo, có thể đang mất mạng. Bạn thử mở tiện ích Thời tiết sau nhé.'}}},
{c:'tg',q:'Bây giờ là mấy giờ ở các nước khác?',go:'gio',a:()=>{const z=[['Tokyo (Nhật)','Asia/Tokyo'],['Seoul (Hàn Quốc)','Asia/Seoul'],['Bắc Kinh (Trung Quốc)','Asia/Shanghai'],['London (Anh)','Europe/London'],['New York (Mỹ)','America/New_York']],n=new Date();
  const tm=t=>new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:t}).format(n);
  return 'Giờ hiện tại:\n• Việt Nam: **'+tm('Asia/Ho_Chi_Minh')+'**\n'+z.map(x=>`• ${x[0]}: ${tm(x[1])}`).join('\n')+'\nMở tiện ích để xem thêm nhiều thành phố khác.'}},
{c:'tg',q:'Hôm nay có phải rằm hay mùng 1 không?',go:'lich',a:()=>{const n=new Date(),L=Lunar.info(n);
  if(L.d===15)return '🌕 Đúng rồi, hôm nay là **rằm** (15 âm lịch).';if(L.d===1)return '🌑 Đúng rồi, hôm nay là **mùng 1** âm lịch.';
  const lab=d=>d===15?'rằm':'mùng 1';let r=null;for(let i=1;i<=31&&!r;i++){const x=new Date(n);x.setDate(x.getDate()+i);const l=Lunar.info(x);if(l.d===1||l.d===15)r={i,x,l}}
  return `Hôm nay là ${L.d}/${L.m} âm lịch. Ngày **${lab(r.l.d)}** tới là ${WD[r.x.getDay()]}, ${dstr(r.x)} (còn ${r.i} ngày).`}},
{c:'tg',q:'Giờ hoàng đạo hôm nay là những giờ nào?',go:'lich',a:()=>{const n=new Date(),L=Lunar.info(n),chi=L.day.split(' ')[1],T={'Tý':0,'Ngọ':0,'Sửu':1,'Mùi':1,'Dần':2,'Thân':2,'Mão':3,'Dậu':3,'Thìn':4,'Tuất':4,'Tỵ':5,'Hợi':5};
  const H=[['Tý','Sửu','Mão','Ngọ','Thân','Dậu'],['Dần','Mão','Tỵ','Thân','Tuất','Hợi'],['Tý','Sửu','Thìn','Tỵ','Mùi','Tuất'],['Tý','Dần','Mão','Ngọ','Mùi','Dậu'],['Dần','Thìn','Tỵ','Thân','Dậu','Hợi'],['Sửu','Thìn','Ngọ','Mùi','Tuất','Hợi']];
  const R={'Tý':'23h–1h','Sửu':'1h–3h','Dần':'3h–5h','Mão':'5h–7h','Thìn':'7h–9h','Tỵ':'9h–11h','Ngọ':'11h–13h','Mùi':'13h–15h','Thân':'15h–17h','Dậu':'17h–19h','Tuất':'19h–21h','Hợi':'21h–23h'};
  return `Hôm nay là ngày **${L.day}**. Giờ hoàng đạo:\n`+H[T[chi]].map(h=>`• Giờ ${h} (${R[h]})`).join('\n')+'\nĐây là quan niệm dân gian, chỉ mang tính tham khảo.'}},
{c:'tg',q:'Hôm nay là thứ mấy, ngày bao nhiêu?',go:'lich',a:()=>{const n=new Date(),L=Lunar.info(n),y0=new Date(n.getFullYear(),0,1),d=Math.floor((n-y0)/864e5)+1;
  return `Hôm nay là **${WD[n.getDay()]}, ${dstr(n)}** (âm lịch ${L.d}/${L.m}). Đây là ngày thứ ${d} của năm ${n.getFullYear()}.`}},
/* ----- Thêm: đời sống ----- */
{c:'ds',q:'Mình hay quên, có tiện ích nào giúp nhớ không?',go:'viec',a:()=>'Có nhé:\n• **Việc cần làm**: ghi việc và tích khi xong.\n• **Ghi chú**: lưu điều cần nhớ.\n• **Lịch & sự kiện**: thêm sự kiện của bạn, ngày có sự kiện hiện chấm nhỏ.\nLưu ý: app trên iPhone không đổ chuông nhắc khi đã đóng app, nên mở app xem danh sách mỗi sáng sẽ tiện hơn.'},
/* ----- Giải trí ----- */
{c:'gt',q:'Cho mình tung xúc xắc nhé!',go:'xucxac',a:()=>{const a=1+TI.rnd(6),b=1+TI.rnd(6);return `🎲 Mình tung thử cho bạn nhé: **${a}** và **${b}**, tổng **${a+b}**.\nMuốn tung nhiều viên hoặc tung đồng xu thì mở tiện ích nhé.`}},
{c:'gt',q:'Mình đang phân vân, không biết chọn gì?',go:'vongquay',a:()=>'Để may mắn quyết định giúp bạn nhé 🎡\nMở **Vòng quay may mắn**, gõ các lựa chọn (món ăn, nơi đi chơi, ai trả tiền…) rồi bấm QUAY. Nếu chỉ có hai lựa chọn thì dùng **đồng xu** trong tiện ích Tung xúc xắc.'},
{c:'gt',q:'Cho mình chơi hỏi đáp vui đi!',go:'hoidap',a:()=>'Mở **Hỏi đáp vui**, mỗi lượt có 10 câu ngẫu nhiên về Việt Nam, khoa học và đời sống, chọn 1 trong 4 đáp án. App chấm điểm và lưu điểm cao nhất của bạn 🧠'},
{c:'gt',q:'Trong app có trò chơi nào không?',go:'trochoi',a:()=>'Có 2 trò nhẹ nhàng:\n• **Lật hình**: tìm các cặp hình giống nhau, ít lượt nhất là kỷ lục.\n• **2048**: vuốt để gộp các ô cùng số.\nCả hai đều lưu điểm cao nhất trên máy bạn 🎮'},
{c:'gt',q:'Kể mình nghe một điều thú vị đi!',go:'hoidap',a:()=>pick(['Mật ong nếu bảo quản kín thì gần như không bị hỏng 🍯','Bạch tuộc có tới 3 trái tim 🐙','Ánh sáng Mặt Trời mất khoảng 8 phút để đến Trái Đất ☀️','Kim cương và than chì đều được tạo thành từ nguyên tố cacbon 💎','Trên sao Kim, một ngày dài hơn cả một năm của nó 🪐','Văn Miếu – Quốc Tử Giám ở Hà Nội được xây dựng từ năm 1070, là trường đại học đầu tiên của nước ta 📚','Việt Nam là một trong những nước xuất khẩu cà phê nhiều nhất thế giới ☕','Về mặt thực vật học, quả chuối thuộc loại quả mọng 🍌','Tim người đập khoảng 100.000 lần mỗi ngày ❤️'])+'\nMuốn thử kiến thức của bạn thì chơi Hỏi đáp vui nhé!'},
/* ----- Dùng app ----- */
{c:'app',q:'Thêm app vào màn hình chính iPhone thế nào?',go:'settings',a:()=>'1. Mở app bằng **Safari**.\n2. Bấm nút **Chia sẻ** ⬆︎ ở thanh dưới.\n3. Chọn **Thêm vào Màn hình chính**, rồi bấm Thêm.\nMở từ biểu tượng đó, app chạy toàn màn hình, không còn thanh công cụ Safari.'},
{c:'app',q:'Đổi sang giao diện sáng hoặc tối thế nào?',go:'settings',a:()=>'Bấm biểu tượng **⚙︎** ở góc phải trang chủ, mục **Giao diện**, chọn Tối, Sáng hoặc Theo máy.'},
{c:'app',q:'Dữ liệu của tôi lưu ở đâu?',go:'settings',a:()=>'Mọi thứ bạn nhập (việc cần làm, ghi chú, sổ chi tiêu, sự kiện…) chỉ lưu **ngay trên điện thoại này**, không gửi đi đâu. Vì vậy máy khác sẽ không thấy, và nếu xóa dữ liệu trình duyệt thì dữ liệu cũng mất. Muốn xóa sạch, vào Cài đặt → Dữ liệu.'},
{c:'app',q:'Số liệu giá vàng, chứng khoán lấy từ đâu?',a:()=>{const L=[['Giá vàng SJC',DATA.vang],['Chứng khoán',DATA.ck],['Giá xăng dầu',DATA.xang]];
  return 'Các số liệu này là **bản chụp**, ghi rõ thời điểm và nguồn, bạn không sửa được trong app:\n'+L.map(x=>`• ${x[0]}: ${dt(x[1])} · ${x[1].source}`).join('\n')+`\n• Xổ số: chụp lúc ${capText(DATA.xs.captured)} · ${DATA.xs.source}\nThời tiết và tỷ giá tiền tệ thì cập nhật qua mạng khi bạn mở.`}},
{c:'app',q:'App có dùng được khi không có mạng?',a:()=>'Gần như có. Sau lần mở đầu có mạng, app lưu bản sao trên máy nên mở lại được khi mất mạng. Riêng **thời tiết** và **tỷ giá tiền tệ** cần mạng để lấy số mới.'},
{c:'app',q:'Bạn là ai vậy?',a:()=>'Mình là **KoDa**, linh vật nhỏ của app Tiện ích 🤖\nMình không phải AI trò chuyện tự do. Mình trả lời những câu hỏi soạn sẵn về các tiện ích trong app, và lấy số liệu thật từ chính app, nên bạn không cần mạng hay khóa gì cả. Bấm một câu hỏi bên dưới để mình trả lời nhé.'}
];
const KEEP=/^(VN-Index|BMI|Pomodoro|KoDa)/;
Q.forEach(x=>{if(x.q==='KoDa là ai?')x.q='Bạn là ai vậy?'});
const MOOD=[
 'Mình là robot nhỏ nên lúc nào cũng khỏe 😄 Còn bạn thì sao? Dù hôm nay thế nào, nhớ uống một ly nước nhé 💧',
 'Mình vui vì bạn ghé thăm! Hôm nay có việc gì cần làm thì ghi vào danh sách cho nhẹ đầu nhé ✅',
 'Nếu hôm nay hơi mệt thì cứ đi chậm lại một chút, nghỉ vài phút rồi làm tiếp. Cần thì bấm Pomodoro để chia nhỏ việc 🍅',
 'Mình thấy hôm nay là một ngày tốt để làm một việc nhỏ mà mình thích 🌿 Bạn đã ăn gì chưa? Hỏi mình “Hôm nay ăn gì?” nhé.'];
const INTRO={q:'Bạn giúp được mình việc gì?',a:()=>'Mình có thể giúp bạn xem **giá vàng, xăng, chứng khoán, xổ số**, tra **âm lịch, thời tiết**, và chỉ cách dùng **các tiện ích** như tính lãi, vay, lương, mã QR, bấm giờ… Chọn nhóm câu hỏi bên dưới, rồi bấm câu bạn muốn hỏi nhé.'};
const MOODQ={q:'Hôm nay bạn thế nào?',a:()=>pick(MOOD),go:null};
const ALLQ=[INTRO,MOODQ,...Q];
const BYTXT=t=>ALLQ.find(x=>x.q===t);
TI.kodaFAQ=ALLQ;
TI.kodaPrompts=n=>{const a=[...Q.map(x=>x.q),MOODQ.q,INTRO.q],out=[];while(out.length<n&&a.length)out.push(a.splice(TI.rnd(a.length),1)[0]);return out};
const GREET=['Tôi có thể giúp gì cho bạn?','Hôm nay bạn thế nào?','Hôm nay bạn muốn làm gì nào?','Bạn đã uống nước chưa?','Chúc bạn một ngày nhẹ nhàng'];
TI.kodaGreet=()=>pick(GREET);TI.kodaPrompt=TI.kodaGreet;

/* văn bản trả lời → HTML an toàn */
function md(t){
  const h=esc(t).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>');
  return h.split(/\n{2,}/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
}

/* ---------- Màn hình trò chuyện với KoDa ---------- */
const GOKIND={vang:'vang',chungkhoan:'ck',xang:'xang',tygia:'fx',xoso:'xs'};
function kodaTool(el){
  let cat=store.get('koda_cat','tc'),busy=false,asked=0;
  el.innerHTML=`<div class="msgs" id="ms"></div>`;el.classList.add('hasc');
  const cf=document.createElement('form');cf.className='composer';cf.id='cf';cf.autocomplete='off';
  cf.innerHTML=`<input id="ci" type="text" placeholder="Nhắn tin cho KoDa…" enterkeyhint="send" maxlength="200" autocomplete="off" autocorrect="off"><button class="sendb" aria-label="Gửi">➤</button>`;
  document.body.appendChild(cf);TI.cleanups.push(()=>cf.remove());
  const ms=$('#ms',el),ci=$('#ci',cf);
  const bub=(r,h,face)=>{const d=document.createElement('div');d.className='msg '+(r==='user'?'u':'b')+' in';d.innerHTML=r==='user'?h:`<div class="brow">${kodaSVG(30,face||'base')}<div class="bt">${h}</div></div>`;return d};
  const hi=document.createElement('div');hi.className='koda-hi';
  hi.innerHTML=`${kodaSVG(84)}<h3>Xin chào, mình là KoDa</h3><div class="mut">Tôi có thể giúp gì cho bạn?</div><div class="note" style="margin:6px 0 0">Gõ câu hỏi bên dưới hoặc bấm một câu gợi ý. Mình trả lời trong phạm vi các tiện ích của app.</div>`;
  ms.appendChild(hi);
  const panel=document.createElement('div');panel.className='qpanel';ms.appendChild(panel);
  function paintPanel(){
    const list=cat==='all'?[]:Q.filter(x=>x.c===cat);
    panel.innerHTML=`<div class="qh">${asked?'Hỏi tiếp nhé':'Hoặc chọn câu hỏi'}</div>
    <div class="chips"><button class="chip2" data-q="${esc(MOODQ.q)}">👋 ${esc(MOODQ.q)}</button><button class="chip2" data-q="${esc(INTRO.q)}">💬 ${esc(INTRO.q)}</button></div>
    <div class="chips qcats">${CATS.map(c=>`<button class="chip2${c[0]===cat?' on':''}" data-cat="${c[0]}">${c[1]} ${c[2]}</button>`).join('')}</div>
    <div class="ql">${list.map(x=>`<button class="qrow" data-q="${esc(x.q)}"><span>${esc(x.q)}</span><i>›</i></button>`).join('')}</div>
    <div class="row eq" style="margin-top:10px"><button class="chip2" data-rand="1">🎲 Hỏi ngẫu nhiên</button>${asked?'<button class="chip2" data-clear="1">↺ Làm mới</button>':''}</div>`;
  }
  async function ask(text,typed){
    text=String(text||'').trim();if(!text||busy)return;const x=typed?null:BYTXT(text);if(!typed&&!x)return;
    busy=true;hi.classList.add('mini');
    const u=bub('user',esc(text));ms.insertBefore(u,panel);
    const typing=bub('assistant','<span class="tl">KoDa đang tìm</span> <span class="dots"><i></i><i></i><i></i></span>','timkiem');if(TI.kodaFace)TI.kodaFace($('.koda-av',hi),'timkiem',0);ms.insertBefore(typing,panel);panel.style.display='none';
    scrollTo2(u);
    const t0=Date.now();let res;const lb=setTimeout(()=>{const l=typing.querySelector('.tl');if(l)l.textContent='Đang xem số liệu'},650);
    try{if(x){const kd=x.go&&GOKIND[x.go]?[GOKIND[x.go]]:[];if(kd.length&&TI.live)await TI.live.wait(kd,5500);let out;try{out=await x.a()}catch(e){out='Xin lỗi, mình chưa trả lời được câu này.'}if(kd.length&&TI.liveNote)out+=TI.liveNote(kd);res={t:out,go:x.go}}else res=await TI.kodaBrain(text)}
    catch(e){res={t:'Xin lỗi, mình chưa trả lời được câu này.',go:null}}
    const wait=Math.max(0,1000+TI.rnd(700)-(Date.now()-t0));await new Promise(r=>setTimeout(r,wait));
    clearTimeout(lb);if(!ms.isConnected)return;
    const go=res.go&&res.go!=='settings'?TOOLS.find(t=>t.id===res.go):null;
    const btn=res.go==='settings'?`<a class="gobtn" href="#settings">Mở Cài đặt ›</a>`:go?`<a class="gobtn" href="#${go.id}">${go.icon} Mở ${esc(go.name)} ›</a>`:'';
    const mood=TI.kodaMood?TI.kodaMood(text,res):'base';const a=bub('assistant',md(res.t)+btn,mood);typing.replaceWith(a);if(TI.kodaFace){TI.kodaFace($('.koda-av',a),mood,3600);TI.kodaFace($('.koda-av',hi),mood,3600)}
    asked++;busy=false;panel.style.display='';paintPanel();
    scrollTo2(u);
  }
  function scrollTo2(node){requestAnimationFrame(()=>{if(!node.isConnected||!ms.isConnected)return;const y=node.getBoundingClientRect().top+scrollY-70;window.scrollTo({top:Math.max(0,y),behavior:'smooth'})})}
  cf.onsubmit=e=>{e.preventDefault();const t=ci.value.trim();if(!t||busy)return;ci.value='';ci.blur();ask(t,true)};
  el.onclick=e=>{
    const c=e.target.closest('[data-cat]');if(c){cat=c.dataset.cat;store.set('koda_cat',cat);paintPanel();return}
    const q=e.target.closest('[data-q]');if(q){ask(q.dataset.q);return}
    if(e.target.closest('[data-rand]')){ask(ALLQ[TI.rnd(ALLQ.length)].q);return}
    if(e.target.closest('[data-clear]')){asked=0;hi.classList.remove('mini');$$('.msg',ms).forEach(m=>m.remove());paintPanel();window.scrollTo({top:0,behavior:'smooth'})}
  };
  paintPanel();
  const seed=store.get('koda_seed','');
  if(seed){store.set('koda_seed','');const x=BYTXT(seed);if(x){if(x.c)cat=x.c;paintPanel();setTimeout(()=>ask(seed),220)}}
}

/* ---------- Xổ số miền Nam ---------- */
const PR=[['ĐB','db'],['G1','g1'],['G2','g2'],['G3','g3'],['G4','g4'],['G5','g5'],['G6','g6'],['G7','g7'],['G8','g8']];
const dLong=d=>`${WD[d.getDay()]}, ${dstr(d)}`;
const ptISO=s=>new Date(s+'T00:00:00');
function lotteryTool(el){
  if(TI.live)TI.live.ensure('xs');
  const X=DATA.xs,keys=Object.keys(X.days).sort().reverse();
  const head=(TI.refreshBar?TI.refreshBar('xs'):'')+`<div class="res" style="margin-bottom:12px">${rr('Số liệu',`${keys.length} ngày gần nhất (đến ${dstr(ptISO(X.latest))})`)}${rr(X.live?'Lấy lúc':'Chụp lúc',capText(X.captured))}${rr('Nguồn',X.links.map(l=>`<a class="lnk" href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>`).join(', '))}</div>`;
  const foot=`<div class="note">${esc(X.note)}</div>`;
  const age=Date.now()-new Date(X.captured).getTime();
  const stale=!X.live&&age>864e5?`<div class="banner">Chưa lấy được kết quả mới qua mạng. Số liệu đã lưu cách đây ${Math.floor(age/864e5)} ngày, có thể đã có kỳ xổ mới.</div>`:'';
  let day=keys[0],st=0;
  tabs(el,[['Kết quả',p=>{
    const paint=()=>{
      const D=X.days[day],S=D[Math.min(st,D.length-1)];
      p.innerHTML=stale+head+`<div class="chips" id="dy">${keys.map(k=>{const d=ptISO(k);return `<button class="chip2${k===day?' on':''}" data-k="${k}">${d.getDay()?'T'+(d.getDay()+1):'CN'} ${pad(d.getDate())}/${pad(d.getMonth()+1)}</button>`}).join('')}</div>
      <div class="chips" id="sn">${D.map((s,i)=>`<button class="chip2${i===st?' on':''}" data-i="${i}">${esc(s.n)}</button>`).join('')}</div>
      <div class="card"><div class="xh"><b>Đài ${esc(S.n)}</b><span class="mut">${esc(dLong(ptISO(day)))}</span></div>${PR.map(([l,k])=>`<div class="xr${k==='db'?' db':''}"><span class="xl">${l==='ĐB'?'Đặc biệt':l==='G1'?'Giải nhất':l==='G2'?'Giải nhì':l==='G3'?'Giải ba':'Giải '+({G4:'tư',G5:'năm',G6:'sáu',G7:'bảy',G8:'tám'})[l]}</span><span class="xn">${(S[k]||[]).map(n=>`<i>${esc(n)}</i>`).join('')}</span></div>`).join('')}</div>`+foot;
    };
    p.onclick=e=>{const a=e.target.closest('#dy .chip2'),b=e.target.closest('#sn .chip2');if(a){day=a.dataset.k;st=0;paint()}else if(b){st=+b.dataset.i;paint()}};
    paint();
  }],['Lịch các đài',p=>{
    const t0=TI.today0(),rows=[];
    for(let i=0;i<7;i++){const d=new Date(t0);d.setDate(d.getDate()+i);rows.push(d)}
    p.innerHTML=`<div class="note" style="margin-top:0">Xổ số miền Nam quay thưởng mỗi ngày, khoảng 16 giờ 15 phút. Mỗi ngày có 3 đài (riêng thứ bảy có 4 đài).</div><h2>7 ngày tới</h2><div class="card">${rows.map((d,i)=>`<div class="sd${i===0?' today':''}"><div class="dd"><b>${esc(WD[d.getDay()])}</b><span class="mut">${dstr(d)}${i===0?' · hôm nay':''}</span></div><div class="ds">${X.sched[d.getDay()].map(n=>`<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div>
    <h2>Lịch cố định hằng tuần</h2><div class="card">${[1,2,3,4,5,6,0].map(w=>`<div class="sd"><div class="dd"><b>${esc(WD[w])}</b></div><div class="ds">${X.sched[w].map(n=>`<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div><div class="note">Lịch theo xskt.com.vn, có thể thay đổi vào dịp lễ, Tết. Hãy kiểm tra thông báo của công ty xổ số kiến thiết địa phương.</div>`;
  }]]);
}

/* ---------- Đăng ký ---------- */
TOOLS.unshift({id:'koda',name:'KoDa – Trợ lý',icon:'🤖',group:'Trợ lý',hidden:true,view:kodaTool});
const i=TOOLS.findIndex(t=>t.id==='tygia');
TOOLS.splice(i<0?TOOLS.length:i+1,0,{id:'xoso',name:'Xổ số miền Nam',icon:'🎟️',group:'Đời sống',view:lotteryTool});
})();
