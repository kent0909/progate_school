// PROTO-SPEC-home.md 3章（43ac7d0）、PR #14 の回答 6619786282。
// 本番の会計・経営シミュレーションには接続しない、全版共通の仮の1か月。
export const scenario = {
  startYear:1, startMonth:5, elapsedMonths:1, deadlineMonths:119, previousPace:40_000,
  policy:'店を知ってもらう',
  opening:{account:3_000_000,cash:100_000,loan:0,sales:0},
  previous:{sales:180_000,net:3_100_000},
  assumption:'1年目の5月、経過1か月。期限は10期（120か月）、残り119か月。まだ記帳がないときは先月の増え方40,000円、記帳後は今月のネットキャッシュの増え方をペースとします。',
  documents:[
    {id:'cash-sales',person:'レジ',kind:'売上の書類',sentence:'今週の売上、現金で120,000円。',amount:120_000,debit:[['現金',120_000]],credit:[['売上',120_000]],effect:{cash:120_000,sales:120_000}},
    {id:'credit-purchase',person:'問屋',kind:'納品書',sentence:'食材40,000円、月末払いで。',amount:40_000,debit:[['仕入',40_000]],credit:[['買掛金',40_000]],effect:{}},
    {id:'rent',person:'大家',kind:'家賃の引き落とし',sentence:'今月の家賃80,000円、口座から引き落とし。',amount:80_000,debit:[['支払家賃',80_000]],credit:[['普通預金',80_000]],effect:{account:-80_000}},
    {id:'salary',person:'アルバイト',kind:'給料の書類',sentence:'今月のお給料60,000円、現金でお願いします。',amount:60_000,debit:[['給料',60_000]],credit:[['現金',60_000]],effect:{cash:-60_000}},
    {id:'card-sales',person:'カード会社',kind:'売上の通知',sentence:'カードの売上90,000円、入金は来月。',amount:90_000,debit:[['売掛金',90_000]],credit:[['売上',90_000]],effect:{sales:90_000}},
    {id:'equipment',person:'道具屋',kind:'領収書',sentence:'お玉、5,000円。現金で。',amount:5_000,debit:[['備品',5_000]],credit:[['現金',5_000]],effect:{cash:-5_000}}
  ]
};
