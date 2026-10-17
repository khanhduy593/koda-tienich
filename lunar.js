/* Thuật toán lịch âm Việt Nam (Hồ Ngọc Đức) — múi giờ +7 */
(function(){
var PI=Math.PI;
function INT(d){return Math.floor(d);}
function jdFromDate(dd,mm,yy){
 var a=INT((14-mm)/12),y=yy+4800-a,m=mm+12*a-3;
 var jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-INT(y/100)+INT(y/400)-32045;
 if(jd<2299161)jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-32083;
 return jd;
}
function jdToDate(jd){
 var a,b,c,d,e,m;
 if(jd>2299160){a=jd+32044;b=INT((4*a+3)/146097);c=a-INT(b*146097/4);}
 else{b=0;c=jd+32082;}
 d=INT((4*c+3)/1461);e=c-INT(1461*d/4);m=INT((5*e+2)/153);
 return [e-INT((153*m+2)/5)+1,m+3-12*INT(m/10),b*100+d-4800+INT(m/10)];
}
function NewMoon(k){
 var T=k/1236.85,T2=T*T,T3=T2*T,dr=PI/180;
 var Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
 Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);
 var M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
 var Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
 var F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
 var C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M);
 C1-=0.4068*Math.sin(Mpr*dr);C1+=0.0161*Math.sin(dr*2*Mpr);C1-=0.0004*Math.sin(dr*3*Mpr);
 C1+=0.0104*Math.sin(dr*2*F);C1-=0.0051*Math.sin(dr*(M+Mpr));C1-=0.0074*Math.sin(dr*(M-Mpr));
 C1+=0.0004*Math.sin(dr*(2*F+M));C1-=0.0004*Math.sin(dr*(2*F-M));C1-=0.0006*Math.sin(dr*(2*F+Mpr));
 C1+=0.0010*Math.sin(dr*(2*F-Mpr));C1+=0.0005*Math.sin(dr*(2*Mpr+M));
 var dt;
 if(T<-11)dt=0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3;
 else dt=-0.000278+0.000265*T+0.000262*T2;
 return Jd1+C1-dt;
}
function SunLongitude(jdn){
 var T=(jdn-2451545.0)/36525,T2=T*T,dr=PI/180;
 var M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;
 var L0=280.46645+36000.76983*T+0.0003032*T2;
 var DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M);
 DL+=(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);
 var L=(L0+DL)*dr;
 return L-PI*2*INT(L/(PI*2));
}
function getSunLongitude(dn,tz){return INT(SunLongitude(dn-0.5-tz/24.0)/PI*6);}
function getNewMoonDay(k,tz){return INT(NewMoon(k)+0.5+tz/24.0);}
function getLunarMonth11(yy,tz){
 var off=jdFromDate(31,12,yy)-2415021,k=INT(off/29.530588853),nm=getNewMoonDay(k,tz);
 if(getSunLongitude(nm,tz)>=9)nm=getNewMoonDay(k-1,tz);
 return nm;
}
function getLeapMonthOffset(a11,tz){
 var k=INT((a11-2415021.076998695)/29.530588853+0.5),last=0,i=1,arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);
 do{last=arc;i++;arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);}while(arc!=last&&i<14);
 return i-1;
}
function solar2lunar(dd,mm,yy,tz){
 tz=tz===undefined?7:tz;
 var dayNumber=jdFromDate(dd,mm,yy),k=INT((dayNumber-2415021.076998695)/29.530588853);
 var monthStart=getNewMoonDay(k+1,tz);
 if(monthStart>dayNumber)monthStart=getNewMoonDay(k,tz);
 var a11=getLunarMonth11(yy,tz),b11=a11,lunarYear;
 if(a11>=monthStart){lunarYear=yy;a11=getLunarMonth11(yy-1,tz);}
 else{lunarYear=yy+1;b11=getLunarMonth11(yy+1,tz);}
 var lunarDay=dayNumber-monthStart+1,diff=INT((monthStart-a11)/29),leap=0,lunarMonth=diff+11;
 if(b11-a11>365){
  var lm=getLeapMonthOffset(a11,tz);
  if(diff>=lm){lunarMonth=diff+10;if(diff==lm)leap=1;}
 }
 if(lunarMonth>12)lunarMonth-=12;
 if(lunarMonth>=11&&diff<4)lunarYear-=1;
 return [lunarDay,lunarMonth,lunarYear,leap,dayNumber];
}
function lunar2solar(ld,lm,ly,leap,tz){
 tz=tz===undefined?7:tz;
 var a11,b11;
 if(lm<11){a11=getLunarMonth11(ly-1,tz);b11=getLunarMonth11(ly,tz);}
 else{a11=getLunarMonth11(ly,tz);b11=getLunarMonth11(ly+1,tz);}
 var k=INT(0.5+(a11-2415021.076998695)/29.530588853),off=lm-11;
 if(off<0)off+=12;
 if(b11-a11>365){
  var lo=getLeapMonthOffset(a11,tz),lmo=lo-2;
  if(lmo<0)lmo+=12;
  if(leap!=0&&lm!=lmo)return [0,0,0];
  else if(leap!=0||off>=lo)off+=1;
 }
 return jdToDate(getNewMoonDay(k+off,tz)+ld-1);
}
var CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
var CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
function info(date){
 var r=solar2lunar(date.getDate(),date.getMonth()+1,date.getFullYear(),7),jd=r[4];
 return {d:r[0],m:r[1],y:r[2],leap:r[3],
  day:CAN[(jd+9)%10]+' '+CHI[(jd+1)%12],
  month:CAN[(r[2]*12+r[1]+3)%10]+' '+CHI[(r[1]+1)%12]+(r[3]?' (nhuận)':''),
  year:CAN[(r[2]+6)%10]+' '+CHI[(r[2]+8)%12]};
}
window.Lunar={solar2lunar:solar2lunar,lunar2solar:lunar2solar,info:info,jdFromDate:jdFromDate};
})();
