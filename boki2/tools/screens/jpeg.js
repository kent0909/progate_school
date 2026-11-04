'use strict';
// JPEGのSOF見出しを読む。画素の復号や外部ライブラリは不要。
const SOF=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
module.exports=function jpegSize(buf){
 if(buf.length<4||buf[0]!==0xff||buf[1]!==0xd8)throw Error('JPEGのSOIがない');
 let i=2;
 while(i<buf.length){
  if(buf[i]!==0xff)throw Error('JPEGのマーカー境界が不正');
  while(i<buf.length&&buf[i]===0xff)i++;
  if(i>=buf.length)break;
  const marker=buf[i++];
  if(marker===0xda||marker===0xd9)break; // 画素列の開始・画像の終わり
  if(marker===0x01||marker===0xd8||(marker>=0xd0&&marker<=0xd7))continue;
  if(marker===0x00||i+2>buf.length)throw Error('JPEGの見出しが途切れた');
  const len=buf.readUInt16BE(i);
  if(len<2||i+len>buf.length)throw Error('JPEGの区間の長さが不正');
  if(SOF.has(marker)){
   if(len<8)throw Error('JPEGのSOFが短い');
   const precision=buf[i+2],height=buf.readUInt16BE(i+3),width=buf.readUInt16BE(i+5);
   if(!width||!height)throw Error('JPEGの幅・高さが0');
   return {format:'jpeg',width,height,precision,marker};
  }
  i+=len;
 }
 throw Error('JPEGのSOFが見つからない');
};
