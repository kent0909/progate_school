// 教材データ

// シャドーイング教材
const SHADOWING_LESSONS = [
  {
    id: "sh-intro",
    title: "自己紹介",
    level: "初級",
    sentences: [
      { en: "Nice to meet you. I'm Ken from the sales department.", ja: "はじめまして。営業部のケンです。" },
      { en: "I've been working here for about three years.", ja: "ここで働いて約3年になります。" },
      { en: "I'm mainly in charge of our clients in Asia.", ja: "主にアジアの顧客を担当しています。" },
      { en: "I'm looking forward to working with you.", ja: "一緒に働けるのを楽しみにしています。" }
    ]
  },
  {
    id: "sh-meeting",
    title: "会議を始める",
    level: "初級",
    sentences: [
      { en: "Thank you all for coming today.", ja: "本日はお集まりいただきありがとうございます。" },
      { en: "Let's get started with the first item on the agenda.", ja: "議題の最初の項目から始めましょう。" },
      { en: "The purpose of this meeting is to review our sales results.", ja: "この会議の目的は売上結果を確認することです。" },
      { en: "Please feel free to ask questions at any time.", ja: "いつでも遠慮なく質問してください。" }
    ]
  },
  {
    id: "sh-schedule",
    title: "日程調整",
    level: "中級",
    sentences: [
      { en: "Would it be possible to reschedule our meeting to Thursday?", ja: "打ち合わせを木曜日に変更することは可能でしょうか。" },
      { en: "Something urgent has come up, and I can't make it on Tuesday.", ja: "急用が入り、火曜日は伺えなくなりました。" },
      { en: "Please let me know what time works best for you.", ja: "ご都合の良い時間を教えてください。" },
      { en: "I apologize for any inconvenience this may cause.", ja: "ご不便をおかけして申し訳ありません。" }
    ]
  },
  {
    id: "sh-presentation",
    title: "プレゼンテーション",
    level: "中級",
    sentences: [
      { en: "Today, I'd like to talk about our new marketing strategy.", ja: "本日は新しいマーケティング戦略についてお話しします。" },
      { en: "As you can see from this graph, sales have increased by twenty percent.", ja: "このグラフからわかるように、売上は20%増加しました。" },
      { en: "This is mainly due to the success of our online campaign.", ja: "これは主にオンラインキャンペーンの成功によるものです。" },
      { en: "To sum up, we need to invest more in digital channels.", ja: "まとめると、デジタルチャネルへの投資を増やす必要があります。" }
    ]
  },
  {
    id: "sh-negotiation",
    title: "交渉",
    level: "上級",
    sentences: [
      { en: "We appreciate your offer, but the price is a little higher than we expected.", ja: "ご提案には感謝していますが、価格が想定より少し高いです。" },
      { en: "If we increase the order volume, could you offer us a discount?", ja: "注文量を増やせば、割引していただけますか。" },
      { en: "I'm afraid we can't accept those terms as they are.", ja: "申し訳ありませんが、その条件のままではお受けできません。" },
      { en: "Let's try to find a solution that works for both of us.", ja: "双方にとって良い解決策を見つけましょう。" }
    ]
  },
  {
    id: "sh-trouble",
    title: "トラブル対応",
    level: "上級",
    sentences: [
      { en: "We've just been informed that the shipment has been delayed.", ja: "出荷が遅れているとの連絡を受けました。" },
      { en: "We're currently looking into the cause of the problem.", ja: "現在、問題の原因を調査しています。" },
      { en: "We'll get back to you as soon as we have more information.", ja: "詳細がわかり次第、折り返しご連絡します。" },
      { en: "We sincerely apologize and will do our best to prevent this from happening again.", ja: "深くお詫び申し上げ、再発防止に努めます。" }
    ]
  }
];

// 瞬間英作文の問題
const COMPOSITION_SETS = [
  {
    id: "cp-basic",
    title: "基本文型",
    level: "初級",
    questions: [
      { ja: "私は毎朝コーヒーを飲みます。", en: "I drink coffee every morning." },
      { ja: "彼女は東京に住んでいます。", en: "She lives in Tokyo." },
      { ja: "会議は3時に始まります。", en: "The meeting starts at three." },
      { ja: "私たちは昨日その報告書を終えました。", en: "We finished the report yesterday." },
      { ja: "明日は雨が降るでしょう。", en: "It will rain tomorrow." },
      { ja: "あなたはどこで働いていますか。", en: "Where do you work?" },
      { ja: "私は今忙しくありません。", en: "I'm not busy now." },
      { ja: "彼は英語を話すことができます。", en: "He can speak English." },
      { ja: "窓を開けてもいいですか。", en: "Can I open the window?" },
      { ja: "この本はとても面白いです。", en: "This book is very interesting." }
    ]
  },
  {
    id: "cp-business",
    title: "ビジネス定番表現",
    level: "中級",
    questions: [
      { ja: "資料を送っていただけますか。", en: "Could you send me the documents?" },
      { ja: "ご連絡ありがとうございます。", en: "Thank you for contacting me." },
      { ja: "少し考える時間をください。", en: "Please give me some time to think." },
      { ja: "その件については後で確認します。", en: "I'll check on that later." },
      { ja: "締め切りは来週の金曜日です。", en: "The deadline is next Friday." },
      { ja: "何か質問はありますか。", en: "Do you have any questions?" },
      { ja: "お手伝いしましょうか。", en: "Shall I help you?" },
      { ja: "私はその提案に賛成です。", en: "I agree with the proposal." },
      { ja: "会議に遅れてすみません。", en: "I'm sorry for being late for the meeting." },
      { ja: "詳細はメールでお送りします。", en: "I'll send you the details by email." }
    ]
  },
  {
    id: "cp-advanced",
    title: "複文・仮定法",
    level: "上級",
    questions: [
      { ja: "もし時間があれば、そのプロジェクトを手伝うのに。", en: "If I had time, I would help with the project." },
      { ja: "彼が言ったことは本当だとわかった。", en: "It turned out that what he said was true." },
      { ja: "私たちは予算を削減せざるを得なかった。", en: "We had no choice but to cut the budget." },
      { ja: "その問題はできるだけ早く解決されるべきだ。", en: "The problem should be solved as soon as possible." },
      { ja: "もっと早く始めていれば、間に合ったのに。", en: "If we had started earlier, we would have made it in time." },
      { ja: "顧客が満足しているかどうか確認する必要があります。", en: "We need to check whether the customers are satisfied." },
      { ja: "彼女が昇進したと聞いて驚きました。", en: "I was surprised to hear that she was promoted." },
      { ja: "このソフトのおかげで、作業時間が半分になった。", en: "Thanks to this software, our working time was cut in half." },
      { ja: "何が起きても、私たちは計画通りに進めます。", en: "No matter what happens, we will proceed as planned." },
      { ja: "新しいシステムに慣れるのに時間がかかった。", en: "It took time to get used to the new system." }
    ]
  }
];

// シナリオ英会話
// 各ターン: AIのセリフと、ユーザー返答の模範例・キーワード
const CONVERSATION_SCENARIOS = [
  {
    id: "cv-hotel",
    title: "ホテルのチェックイン",
    level: "初級",
    role: "ホテルのフロント係",
    turns: [
      {
        ai: "Good evening. Welcome to the Grand Hotel. How may I help you?",
        hint: "予約していることを伝えましょう",
        sample: "Hi, I have a reservation under the name Tanaka.",
        keywords: ["reservation", "booked", "book", "name"]
      },
      {
        ai: "Thank you. Could I see your passport, please?",
        hint: "パスポートを渡しましょう",
        sample: "Sure, here you are.",
        keywords: ["here", "sure", "passport", "course"]
      },
      {
        ai: "You're staying for three nights. Would you like breakfast included?",
        hint: "朝食を付けるか答えましょう",
        sample: "Yes, please. What time is breakfast served?",
        keywords: ["yes", "no", "please", "breakfast", "thank"]
      },
      {
        ai: "Breakfast is served from 7 to 10 a.m. on the second floor. Is there anything else I can do for you?",
        hint: "Wi-Fiのパスワードを聞いてみましょう",
        sample: "Could you tell me the Wi-Fi password?",
        keywords: ["wi-fi", "wifi", "password", "internet", "no", "thank"]
      },
      {
        ai: "It's written on your key card holder. Here's your key. Your room is 1205. Enjoy your stay!",
        hint: "お礼を言いましょう",
        sample: "Thank you very much.",
        keywords: ["thank", "thanks", "great"]
      }
    ]
  },
  {
    id: "cv-smalltalk",
    title: "会議前のスモールトーク",
    level: "中級",
    role: "海外支社の同僚",
    turns: [
      {
        ai: "Hi! Good to see you again. How have you been?",
        hint: "近況を答えましょう",
        sample: "I've been great, thanks. It's been really busy, though. How about you?",
        keywords: ["good", "great", "fine", "busy", "well", "you"]
      },
      {
        ai: "Pretty good. I just came back from a vacation in Hawaii. Have you been there?",
        hint: "行ったことがあるか答えましょう",
        sample: "No, I haven't, but I'd love to go someday. How was it?",
        keywords: ["haven't", "have", "never", "yes", "no", "love", "how"]
      },
      {
        ai: "It was amazing. The beaches were beautiful. Do you have any plans for the holidays?",
        hint: "休暇の予定を答えましょう",
        sample: "I'm planning to visit my family in Osaka.",
        keywords: ["plan", "planning", "going", "visit", "stay", "not", "yet"]
      },
      {
        ai: "That sounds nice. By the way, did you have a chance to look at the report I sent?",
        hint: "レポートを見たかどうか答えましょう",
        sample: "Yes, I did. I have a few questions about the budget section.",
        keywords: ["yes", "did", "read", "looked", "not", "yet", "question"]
      },
      {
        ai: "Sure, let's go over it in the meeting. Shall we head to the conference room?",
        hint: "同意しましょう",
        sample: "Sounds good. Let's go.",
        keywords: ["sure", "sounds", "good", "let's", "okay", "ok", "yes"]
      }
    ]
  },
  {
    id: "cv-interview",
    title: "英語面接",
    level: "上級",
    role: "面接官",
    turns: [
      {
        ai: "Thank you for coming in today. Could you start by telling me a little about yourself?",
        hint: "経歴を簡潔に話しましょう",
        sample: "Sure. I've worked in marketing for five years, mainly focusing on digital campaigns.",
        keywords: ["worked", "work", "years", "experience", "i'm", "currently"]
      },
      {
        ai: "Why are you interested in this position?",
        hint: "志望動機を伝えましょう",
        sample: "I'm interested because I want to use my experience in a more global environment.",
        keywords: ["because", "interested", "want", "experience", "global", "skills"]
      },
      {
        ai: "What would you say is your greatest strength?",
        hint: "自分の強みを話しましょう",
        sample: "My greatest strength is my ability to analyze data and turn it into clear action plans.",
        keywords: ["strength", "ability", "good", "able", "skill"]
      },
      {
        ai: "Can you tell me about a time you faced a difficult challenge at work?",
        hint: "困難を乗り越えた経験を話しましょう",
        sample: "Last year, our project was behind schedule, so I reorganized the tasks and we finished on time.",
        keywords: ["when", "last", "project", "problem", "challenge", "solved", "so"]
      },
      {
        ai: "Great. Do you have any questions for us?",
        hint: "逆質問をしてみましょう",
        sample: "Yes. What does a typical day look like for this role?",
        keywords: ["what", "how", "could", "question", "team", "role"]
      }
    ]
  }
];
